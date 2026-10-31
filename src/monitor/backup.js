'use strict';

/**
 * Backup / khôi phục dữ liệu qua Discord webhook.
 *
 * - Định kỳ (BACKUP_INTERVAL_MINUTES) dump toàn bộ SQLite -> JSON -> gzip -> gửi vào kênh của webhook.
 * - Khi bot khởi động / kết nối lại: đọc bản backup mới nhất trong kênh đó và khôi phục nếu cần
 *   (DB trống = ổ đĩa bị xoá khi restart, hoặc DB cũ hơn bản backup).
 * - Đọc lại tin nhắn trong kênh bằng chính token bot (webhook chỉ ghi được, không liệt kê được),
 *   nên bot cần quyền Xem kênh + Đọc lịch sử tin nhắn ở kênh đó.
 */

const crypto = require('crypto');
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');
const env = require('../config/env');
const { state, addIncident, firstLine } = require('./healthState');
const notifier = require('./webhookNotifier');

const FORMAT = 1;
const MAGIC = 'GZW-BACKUP v1';
const HEADER_RE = /GZW-BACKUP v1 \| id=([0-9a-z]+) \| part=(\d+)\/(\d+) \| at=(\d+) \| sha=([0-9a-f]{64}) \| bytes=(\d+)/;
const VALID_URL = /^https:\/\/(?:(?:canary|ptb)\.)?discord(?:app)?\.com\/api(?:\/v\d+)?\/webhooks\/\d+\/[\w-]+$/;
const MAX_PART_BYTES = 7 * 1024 * 1024;
const HEARTBEAT_MS = 60 * 60_000;       // dữ liệu không đổi vẫn gửi 1 bản mỗi giờ (giữ số giờ online mới)
const EXCLUDE_TABLES = new Set(['backup_state']);
const VOLATILE_TABLES = new Set(['bot_meta']); // đổi liên tục (đếm giờ online), không tính vào "dữ liệu có đổi không"
const SAFE_NAME = /^[A-Za-z0-9_]+$/;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const log = (msg) => process.stderr.write(`[backup] ${msg}\n`);
const sha256 = (buf) => crypto.createHash('sha256').update(buf).digest('hex');

const svc = { transport: null, running: false, restoring: false, timer: null, pendingTimer: null, lastPrune: 0 };

function deps() {
  const db = require('../database/db');
  const { meta, local } = require('../database/meta');
  return { db, meta, local };
}

function enabled() {
  return Boolean(env.BACKUP_ENABLED && env.BACKUP_WEBHOOK_URL && VALID_URL.test(env.BACKUP_WEBHOOK_URL));
}

// ---------------------------------------------------------------------------
// Dump / restore
// ---------------------------------------------------------------------------

const encodeValue = (v) => {
  if (Buffer.isBuffer(v)) return { $b64: v.toString('base64') };
  if (typeof v === 'bigint') return { $big: v.toString() };
  return v;
};
const decodeValue = (v) => {
  if (v && typeof v === 'object') {
    if (typeof v.$b64 === 'string') return Buffer.from(v.$b64, 'base64');
    if (typeof v.$big === 'string') return BigInt(v.$big);
  }
  return v;
};

function listTables(db) {
  return db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
    .all().map((r) => r.name).filter((n) => SAFE_NAME.test(n) && !EXCLUDE_TABLES.has(n));
}

function dumpDatabase(db) {
  const tables = {};
  db.transaction(() => {
    for (const name of listTables(db)) {
      const cols = db.prepare(`PRAGMA table_info("${name}")`).all().map((c) => c.name);
      const rows = db.prepare(`SELECT * FROM "${name}"`).all().map((r) => cols.map((c) => encodeValue(r[c])));
      tables[name] = { cols, rows };
    }
  })();
  return { format: FORMAT, createdAt: Date.now(), tables };
}

function countRows(dump) {
  return Object.values(dump.tables).reduce((n, t) => n + t.rows.length, 0);
}

function fingerprint(dump) {
  const stable = {};
  for (const [name, t] of Object.entries(dump.tables)) if (!VOLATILE_TABLES.has(name)) stable[name] = t;
  return sha256(JSON.stringify(stable));
}

/** DB được coi là "trống" khi không có dòng dữ liệu nào (không tính bảng meta). */
function isFresh(db) {
  for (const name of listTables(db)) {
    if (VOLATILE_TABLES.has(name)) continue;
    if (db.prepare(`SELECT 1 FROM "${name}" LIMIT 1`).get()) return false;
  }
  return true;
}

function restoreDump(db, dump) {
  if (!dump || dump.format !== FORMAT || typeof dump.tables !== 'object') throw new Error('Bản backup không đúng định dạng');
  let rows = 0;
  const skipped = [];
  db.transaction(() => {
    // Sổ cái coin_ledger có trigger chặn DELETE: gỡ tạm rồi tạo lại (DDL nằm trong transaction nên lỗi sẽ rollback cả trigger)
    const triggers = db.prepare("SELECT name, sql FROM sqlite_master WHERE type = 'trigger' AND sql IS NOT NULL").all();
    for (const t of triggers) db.exec(`DROP TRIGGER IF EXISTS "${t.name}"`);

    for (const [name, tbl] of Object.entries(dump.tables)) {
      if (!SAFE_NAME.test(name) || EXCLUDE_TABLES.has(name)) continue;
      const info = db.prepare(`PRAGMA table_info("${name}")`).all();
      if (!info.length) { skipped.push(name); continue; }
      const localCols = new Set(info.map((c) => c.name));
      const usable = tbl.cols.map((c, i) => [c, i]).filter(([c]) => SAFE_NAME.test(c) && localCols.has(c));
      db.exec(`DELETE FROM "${name}"`);
      if (!usable.length || !tbl.rows.length) continue;
      const stmt = db.prepare(`INSERT INTO "${name}" (${usable.map(([c]) => `"${c}"`).join(', ')}) VALUES (${usable.map(() => '?').join(', ')})`);
      for (const row of tbl.rows) {
        stmt.run(...usable.map(([, i]) => decodeValue(row[i])));
        rows++;
      }
    }

    for (const t of triggers) db.exec(t.sql);
  })();
  return { rows, tables: Object.keys(dump.tables).length, skipped };
}

function safetyCopy(db) {
  try {
    const dir = path.dirname(db.filePath || path.join(process.cwd(), 'data', 'bot.sqlite'));
    const file = path.join(dir, `pre-restore-${Date.now()}.sqlite`);
    db.exec(`VACUUM INTO '${file.replace(/'/g, "''")}'`);
    const olds = fs.readdirSync(dir).filter((f) => /^pre-restore-\d+\.sqlite$/.test(f)).sort();
    for (const f of olds.slice(0, Math.max(0, olds.length - 3))) fs.rmSync(path.join(dir, f), { force: true });
    return file;
  } catch (err) {
    log(`Không tạo được bản sao an toàn trước khi khôi phục: ${err.message}`);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Vận chuyển qua Discord (có thể thay bằng bản giả khi test)
// ---------------------------------------------------------------------------

function createTransport(webhookUrl, botToken) {
  const m = /webhooks\/(\d+)\/([\w-]+)/.exec(webhookUrl);
  const base = webhookUrl.replace(/\?.*$/, '');
  let rest = null;
  const getRest = () => {
    if (!rest) {
      const { REST } = require('discord.js');
      rest = new REST({ version: '10' }).setToken(botToken);
    }
    return rest;
  };

  async function request(fn, what) {
    let lastErr;
    for (let attempt = 0; attempt < 4; attempt++) {
      let res;
      try { res = await fn(); } catch (err) { lastErr = err; await sleep(1000 * 2 ** attempt); continue; }
      if (res.ok) return res;
      if (res.status === 429) {
        const data = await res.json().catch(() => ({}));
        await sleep(Math.min(30_000, (Number(data.retry_after) || 1) * 1000 + 100));
        lastErr = new Error(`${what}: bị giới hạn tốc độ`);
        continue;
      }
      if (res.status >= 500) { lastErr = new Error(`${what}: HTTP ${res.status}`); await sleep(1000 * 2 ** attempt); continue; }
      const err = new Error(`${what}: HTTP ${res.status}`);
      err.status = res.status;
      throw err;
    }
    throw lastErr || new Error(`${what}: thất bại`);
  }

  return {
    webhookId: m ? m[1] : null,
    async info() {
      const res = await request(() => fetch(base, { signal: AbortSignal.timeout(15_000) }), 'Đọc webhook');
      return res.json();
    },
    async listMessages(channelId, before) {
      const { Routes } = require('discord.js');
      const query = new URLSearchParams({ limit: '100' });
      if (before) query.set('before', before);
      return getRest().get(Routes.channelMessages(channelId), { query });
    },
    async upload({ content, filename, buffer }) {
      const res = await request(() => {
        const form = new FormData();
        form.append('payload_json', JSON.stringify({
          username: 'GZW Backup',
          content,
          allowed_mentions: { parse: [] },
          attachments: [{ id: 0, filename }]
        }));
        form.append('files[0]', new Blob([buffer]), filename);
        return fetch(`${base}?wait=true`, { method: 'POST', body: form, signal: AbortSignal.timeout(90_000) });
      }, 'Gửi backup');
      return res.json();
    },
    async remove(messageId) {
      await request(() => fetch(`${base}/messages/${messageId}`, { method: 'DELETE', signal: AbortSignal.timeout(15_000) }), 'Xoá backup cũ');
    },
    async download(url) {
      const res = await request(() => fetch(url, { signal: AbortSignal.timeout(90_000) }), 'Tải backup');
      return Buffer.from(await res.arrayBuffer());
    }
  };
}

function getTransport() {
  if (!svc.transport) svc.transport = createTransport(env.BACKUP_WEBHOOK_URL, env.DISCORD_TOKEN);
  return svc.transport;
}
function setTransport(t) { svc.transport = t; }

/** Liệt kê các nhóm backup (mới nhất trước) đang nằm trong kênh của webhook. */
async function listBackups(tp, { maxPages = 5, untilComplete = false } = {}) {
  const info = await tp.info();
  const channelId = info.channel_id;
  if (!channelId) throw new Error('Webhook không trả về kênh');
  const groups = new Map();
  let before;
  for (let page = 0; page < maxPages; page++) {
    const msgs = await tp.listMessages(channelId, before);
    if (!msgs || !msgs.length) break;
    for (const msg of msgs) {
      if (msg.webhook_id !== tp.webhookId) continue;
      const h = HEADER_RE.exec(msg.content || '');
      const att = msg.attachments && msg.attachments[0];
      if (!h || !att) continue;
      const [, id, part, total, at, sha, bytes] = h;
      let g = groups.get(id);
      if (!g) { g = { id, at: Number(at), total: Number(total), sha, bytes: Number(bytes), parts: {}, messageIds: [] }; groups.set(id, g); }
      g.parts[Number(part)] = { messageId: msg.id, url: att.url };
      g.messageIds.push(msg.id);
    }
    before = msgs[msgs.length - 1].id;
    if (msgs.length < 100) break;
    // Chỉ cần bản mới nhất: dừng ngay khi đã thấy một bản đủ phần (báo cáo 5 phút chen vào kênh nên có thể phải lùi vài trang)
    if (untilComplete && [...groups.values()].some((g) => Object.keys(g.parts).length === g.total)) break;
  }
  const all = [...groups.values()].map((g) => ({ ...g, complete: Object.keys(g.parts).length === g.total }));
  all.sort((a, b) => b.at - a.at);
  return all;
}

/** Tải + kiểm tra + giải nén bản backup hoàn chỉnh mới nhất; bản hỏng thì thử bản kế tiếp. */
async function loadNewest(tp, groups) {
  let lastErr = null;
  for (const g of groups.filter((x) => x.complete)) {
    try {
      const bufs = [];
      for (let i = 1; i <= g.total; i++) bufs.push(await tp.download(g.parts[i].url));
      const gz = Buffer.concat(bufs);
      if (sha256(gz) !== g.sha) throw new Error('sai mã kiểm tra (sha256)');
      const dump = JSON.parse(zlib.gunzipSync(gz).toString('utf8'));
      return { group: g, dump };
    } catch (err) {
      lastErr = err;
      log(`Bản backup ${g.id} không dùng được: ${err.message}. Thử bản cũ hơn.`);
      addIncident({ level: 'warn', type: 'backup', isPublic: false, message: `Bản backup ${g.id} hỏng: ${firstLine(err.message)}` });
    }
  }
  if (lastErr) throw lastErr;
  return null;
}

// ---------------------------------------------------------------------------
// Backup
// ---------------------------------------------------------------------------

function splitBuffer(buf, size = MAX_PART_BYTES) {
  const parts = [];
  for (let i = 0; i < buf.length; i += size) parts.push(buf.subarray(i, i + size));
  return parts.length ? parts : [buf];
}

async function pruneOld(tp) {
  const groups = await listBackups(tp, { maxPages: 10 });
  const complete = groups.filter((g) => g.complete);
  const keepIds = new Set(complete.slice(0, env.BACKUP_KEEP).map((g) => g.id));
  const cutoff = Date.now() - 10 * 60_000;
  let removed = 0;
  for (const g of groups) {
    if (keepIds.has(g.id)) continue;
    if (!g.complete && g.at > cutoff) continue; // có thể đang gửi dở
    for (const mid of g.messageIds) {
      try { await tp.remove(mid); removed++; } catch { /* bỏ qua */ }
      await sleep(300);
    }
  }
  return removed;
}

async function runBackup({ reason = 'định kỳ', force = false } = {}) {
  if (!enabled()) return { skipped: 'disabled' };
  if (state.backup.pendingRestore) return { skipped: 'pending-restore' };
  if (svc.running || svc.restoring) return { skipped: 'busy' };
  svc.running = true;
  try {
    const { db, local } = deps();
    const dump = dumpDatabase(db);
    const fp = fingerprint(dump);
    const lastAt = local.getNum('lastBackupAt', 0);
    if (!force && fp === local.get('lastFingerprint') && Date.now() - lastAt < HEARTBEAT_MS) return { skipped: 'unchanged' };

    const gz = zlib.gzipSync(Buffer.from(JSON.stringify(dump)), { level: 9 });
    const sha = sha256(gz);
    const id = `${Date.now().toString(36)}${crypto.randomBytes(3).toString('hex')}`;
    const parts = splitBuffer(gz);
    const tp = getTransport();

    for (let i = 0; i < parts.length; i++) {
      await tp.upload({
        content: `🗄️ ${MAGIC} | id=${id} | part=${i + 1}/${parts.length} | at=${dump.createdAt} | sha=${sha} | bytes=${gz.length}\nTự động sao lưu dữ liệu bot (${reason}). Không xoá tin nhắn này.`,
        filename: `gzw-backup-${id}-p${i + 1}of${parts.length}.json.gz`,
        buffer: parts[i]
      });
    }

    local.set('lastBackupAt', dump.createdAt);
    local.set('lastFingerprint', fp);
    local.set('lastBackupId', id);
    const rows = countRows(dump);
    Object.assign(state.backup, { lastBackupAt: dump.createdAt, lastSizeBytes: gz.length, lastRows: rows, lastError: null });
    state.backup.count++;

    if (Date.now() - svc.lastPrune > 30 * 60_000) {
      svc.lastPrune = Date.now();
      pruneOld(tp).catch((err) => log(`Không dọn được backup cũ: ${err.message}`));
    }
    return { ok: true, id, rows, bytes: gz.length, parts: parts.length };
  } catch (err) {
    state.backup.failures++;
    state.backup.lastError = firstLine(err && err.message);
    addIncident({ level: 'warn', type: 'backup', isPublic: false, message: `Backup thất bại: ${firstLine(err && err.message)}` });
    return { ok: false, error: err };
  } finally {
    svc.running = false;
  }
}

// ---------------------------------------------------------------------------
// Khôi phục
// ---------------------------------------------------------------------------

/**
 * Quyết định có khôi phục không.
 *  - fresh: DB trống -> luôn khôi phục
 *  - boot: DB cũ hơn bản backup từ xa (localAt < remoteAt) -> khôi phục; chưa từng backup mà DB có dữ liệu -> giữ DB cục bộ
 *  - runtime (sau khi kết nối lại): chỉ khôi phục khi DB trống
 */
function decide({ mode, fresh, localAt, remoteAt, force = false, allowOverwrite = false }) {
  if (force) return 'restore-forced';
  if (fresh) return 'restore-fresh';
  if (allowOverwrite) return 'restore-pending';
  if (mode === 'runtime') return 'keep';
  if (!localAt) return 'conflict-keep-local';
  if (localAt < remoteAt) return 'restore-stale';
  return 'keep';
}

const REASON_TEXT = {
  'restore-fresh': 'Dữ liệu cục bộ trống (ổ đĩa bị xoá khi restart/deploy)',
  'restore-stale': 'Dữ liệu cục bộ cũ hơn bản backup trong kênh',
  'restore-pending': 'Lần đầu không đọc được backup, đã đọc lại thành công',
  'restore-forced': 'Quản trị viên yêu cầu khôi phục'
};

async function restoreIfNeeded({ mode = 'boot', force = false, allowOverwrite = false } = {}) {
  if (!enabled()) return { status: 'disabled' };
  if (svc.restoring || svc.running) return { status: 'busy' };
  svc.restoring = true;
  try {
    const { db, local } = deps();
    const tp = getTransport();
    const groups = await listBackups(tp, { maxPages: 40, untilComplete: true });
    const picked = await loadNewest(tp, groups);
    if (!picked) {
      if (groups.some((g) => !g.complete)) log('Có backup chưa đủ phần, bỏ qua.');
      return { status: 'no-backup' };
    }

    const fresh = isFresh(db);
    const localAt = local.getNum('lastBackupAt', 0);
    const decision = decide({ mode, fresh, localAt, remoteAt: picked.group.at, force, allowOverwrite });

    if (decision === 'keep') return { status: 'kept-local' };
    if (decision === 'conflict-keep-local') {
      notifier.notify({
        level: 'warn',
        title: '⚠️ Có cả dữ liệu cục bộ lẫn backup trong kênh',
        description: 'Bot giữ dữ liệu cục bộ (chưa từng sao lưu nên không thể biết bản nào mới hơn). Bản backup cũ vẫn còn trong kênh. Muốn dùng bản backup, quản trị viên gõ lệnh khôi phục thủ công.',
        key: 'backupConflict',
        dedupeMs: 60 * 60_000
      });
      return { status: 'conflict-kept-local' };
    }

    const copy = fresh ? null : safetyCopy(db);
    const res = restoreDump(db, picked.dump);

    local.set('lastBackupAt', picked.group.at);
    local.set('lastBackupId', picked.group.id);
    local.set('lastFingerprint', fingerprint(dumpDatabase(db)));
    Object.assign(state.backup, {
      lastRestoreAt: Date.now(), lastRestoreRows: res.rows, pendingRestore: false, lastError: null
    });
    state.backup.restores++;
    addIncident({ level: 'recovered', type: 'backup', message: `Đã khôi phục dữ liệu từ backup (${res.rows} dòng, ${res.tables} bảng)` });

    notifier.notify({
      level: 'success',
      title: '♻️ Đã tự khôi phục dữ liệu từ backup',
      description: `${REASON_TEXT[decision]}. Level, coin và toàn bộ dữ liệu đã được nạp lại từ bản backup trong kênh này.`,
      fields: [
        { name: 'Bản backup lúc', value: `<t:${Math.floor(picked.group.at / 1000)}:F>\n(<t:${Math.floor(picked.group.at / 1000)}:R>)` },
        { name: 'Đã nạp', value: `${res.rows.toLocaleString('vi-VN')} dòng / ${res.tables} bảng` },
        { name: 'Bản sao cục bộ cũ', value: copy ? 'Đã lưu trong thư mục data/' : 'Không có (DB trống)' }
      ],
      dedupeMs: 0
    });
    return { status: 'restored', decision, ...res, at: picked.group.at };
  } finally {
    svc.restoring = false;
  }
}

/** Gọi trước khi đăng nhập Discord. Lỗi mạng thì thử lại; thất bại hẳn và DB trống -> chờ, không backup đè. */
async function restoreOnBoot() {
  state.backup.enabled = enabled();
  if (!enabled()) {
    log(env.BACKUP_ENABLED ? 'Chưa có webhook hợp lệ (ERROR_WEBHOOK_URL / BACKUP_WEBHOOK_URL), tắt backup.' : 'Backup đang tắt (BACKUP_ENABLED=false).');
    return { status: 'disabled' };
  }

  let lastErr = null;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const r = await restoreIfNeeded({ mode: 'boot' });
      log(`Khôi phục khi khởi động: ${r.status}${r.rows ? ` (${r.rows} dòng)` : ''}`);
      return r;
    } catch (err) {
      lastErr = err;
      log(`Đọc backup lần ${attempt} thất bại: ${err.message}`);
      await sleep(attempt * 3000);
    }
  }

  const { db } = deps();
  state.backup.lastError = firstLine(lastErr && lastErr.message);
  addIncident({ level: 'error', type: 'backup', isPublic: false, message: `Không đọc được backup khi khởi động: ${firstLine(lastErr && lastErr.message)}` });
  notifier.notify({
    level: 'error',
    title: '🗄️ Không đọc được backup khi khởi động',
    description: `${firstLine(lastErr && lastErr.message)}\n\nKiểm tra: bot có trong server chứa kênh webhook, và có quyền **Xem kênh** + **Đọc lịch sử tin nhắn** ở kênh đó.`,
    key: 'bootRestoreFail',
    dedupeMs: 30 * 60_000,
    ping: true
  });
  if (isFresh(db)) {
    state.backup.pendingRestore = true;
    startPendingRetry();
  }
  return { status: 'failed' };
}

function startPendingRetry() {
  if (svc.pendingTimer) return;
  svc.pendingTimer = setInterval(async () => {
    try {
      const r = await restoreIfNeeded({ mode: 'boot', allowOverwrite: true });
      if (r.status !== 'busy') {
        state.backup.pendingRestore = false;
        clearInterval(svc.pendingTimer);
        svc.pendingTimer = null;
      }
    } catch { /* thử lại ở lần sau */ }
  }, 30_000);
  svc.pendingTimer.unref();
}

/** Sau khi bot kết nối lại Discord: kiểm tra dữ liệu, rồi backup ngay. */
async function onReconnect({ notify = true } = {}) {
  if (!enabled()) return;
  let restored = null;
  try { restored = await restoreIfNeeded({ mode: 'runtime' }); } catch (err) {
    log(`Kiểm tra backup sau khi kết nối lại thất bại: ${err.message}`);
  }
  const res = await runBackup({ reason: 'sau khi kết nối lại', force: true });
  if (notify && (!restored || restored.status !== 'restored')) {
    notifier.notify({
      level: res && res.ok ? 'info' : 'warn',
      title: '💾 Đã kiểm tra dữ liệu sau khi kết nối lại',
      description: restored && restored.status === 'kept-local'
        ? 'Dữ liệu trên bot vẫn còn nguyên nên không cần khôi phục.'
        : 'Đã đối chiếu với backup trong kênh.',
      fields: [{ name: 'Backup mới', value: res && res.ok ? `Đã gửi (${(res.bytes / 1024).toFixed(1)} KB)` : `Chưa gửi (${res && res.skipped ? res.skipped : firstLine(res && res.error && res.error.message)})` }],
      dedupeMs: 0
    });
  }
}

function startScheduler() {
  if (svc.timer || !enabled()) return;
  svc.timer = setInterval(() => { runBackup({ reason: 'định kỳ' }); }, env.BACKUP_INTERVAL_MINUTES * 60_000);
  svc.timer.unref();
  setTimeout(() => { runBackup({ reason: 'sau khi khởi động' }); }, 20_000).unref();
}

/** Backup lần cuối trước khi thoát (có giới hạn thời gian để không làm chậm việc tắt). */
async function finalBackup(timeoutMs = 8000) {
  if (!enabled()) return null;
  try {
    return await Promise.race([runBackup({ reason: 'trước khi tắt', force: true }), sleep(timeoutMs).then(() => ({ skipped: 'timeout' }))]);
  } catch { return null; }
}

module.exports = {
  enabled, runBackup, restoreIfNeeded, restoreOnBoot, onReconnect, startScheduler, finalBackup,
  // nội bộ, để test
  dumpDatabase, restoreDump, fingerprint, isFresh, decide, listBackups, loadNewest, splitBuffer, setTransport, createTransport, HEADER_RE, MAGIC
};

// node src/monitor/backup.js          -> liệt kê các backup đang có trong kênh
// node src/monitor/backup.js --now    -> gửi 1 bản backup ngay
if (require.main === module) {
  (async () => {
    if (!enabled()) { log('Chưa cấu hình webhook hợp lệ hoặc BACKUP_ENABLED=false.'); process.exit(1); }
    if (process.argv.includes('--now')) {
      const r = await runBackup({ reason: 'chạy tay', force: true });
      console.log(r.ok ? `Đã gửi backup ${r.id}: ${r.rows} dòng, ${(r.bytes / 1024).toFixed(1)} KB` : `Thất bại: ${r.error ? r.error.message : r.skipped}`);
      process.exit(r.ok ? 0 : 1);
    }
    const groups = await listBackups(getTransport());
    if (!groups.length) console.log('Chưa có backup nào trong kênh.');
    for (const g of groups) console.log(`${new Date(g.at).toLocaleString('vi-VN')}  id=${g.id}  ${g.complete ? 'đủ' : 'THIẾU PHẦN'}  ${(g.bytes / 1024).toFixed(1)} KB`);
    process.exit(0);
  })().catch((err) => { console.error(err.message); process.exit(1); });
}