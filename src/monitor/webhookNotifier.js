'use strict';

/**
 * Gửi thông báo (embed) lên Discord webhook ERROR_WEBHOOK_URL.
 *
 * - notify() không bao giờ ném lỗi và không chặn: tin được xếp hàng rồi gửi nền.
 * - Tôn trọng giới hạn của Discord (5 request / 2 giây), tự chờ khi bị 429.
 * - Mất mạng: giữ tin trong hàng đợi, thử lại với thời gian chờ tăng dần, gửi bù khi có mạng
 *   (tin gửi trễ được ghi chú ở chân embed). Tin quá cũ (> STALE_DROP_MS) thì bỏ.
 * - Gộp tin trùng theo `key` trong `dedupeMs` (đặt dedupeMs: 0 để luôn gửi).
 * - Mọi nội dung đều qua redact() nên token / URL webhook không bao giờ lộ.
 * - Ghi log bằng process.stderr (không dùng console.error) để không tự gửi lỗi của chính nó lên webhook.
 *
 * Thử nhanh: npm run webhook:test
 */

const os = require('os');
const env = require('../config/env');
const { state, redact, firstLine, addIncident } = require('./healthState');

const VALID_URL = /^https:\/\/(?:(?:canary|ptb)\.)?discord(?:app)?\.com\/api(?:\/v\d+)?\/webhooks\/\d+\/[\w-]+$/;
const COLORS = { success: 0x57f287, info: 0x5865f2, warn: 0xfee75c, error: 0xed4245, recovered: 0x57f287 };

// Có thể chỉnh trong test.
const cfg = {
  maxQueue: 50,
  minGapMs: 500,             // Discord: 5 request / 2 giây cho mỗi webhook
  requestTimeoutMs: 10_000,
  defaultDedupeMs: 60_000,
  staleDropMs: 30 * 60_000,  // tin kẹt quá lâu (mất mạng kéo dài) thì bỏ
  staleNoteMs: 60_000,       // tin gửi trễ hơn mức này sẽ được ghi chú
  maxHttpAttempts: 5,
  backoffBaseMs: 2000,
  backoffMaxMs: 60_000
};

const queue = [];
const lastSent = new Map();
let waiters = [];
let draining = false;
let nextAllowedAt = 0;
let failStreak = 0;
let lastFailLogAt = 0;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const log = (msg) => process.stderr.write(`[webhook] ${msg}\n`);
const clip = (text, n) => {
  const s = String(text ?? '');
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
};

function isConfigured() {
  const ok = Boolean(env.ERROR_WEBHOOK_URL && VALID_URL.test(env.ERROR_WEBHOOK_URL));
  state.webhook.configured = ok;
  return ok;
}

/** Giải thích vì sao URL không dùng được (để báo rõ khi khởi động / webhook:test). */
function configProblem() {
  if (!env.ERROR_WEBHOOK_URL) return 'Chưa đặt biến ERROR_WEBHOOK_URL.';
  if (!VALID_URL.test(env.ERROR_WEBHOOK_URL)) {
    return 'ERROR_WEBHOOK_URL sai định dạng. Cần dạng https://discord.com/api/webhooks/<số>/<mã> (lấy ở Cài đặt kênh → Tích hợp → Webhook → Sao chép URL).';
  }
  return null;
}

// --- Dựng nội dung ---------------------------------------------------------

function describeDelay(ms) {
  const s = Math.round(ms / 1000);
  if (s < 90) return `${s} giây`;
  const m = Math.round(s / 60);
  return m < 90 ? `${m} phút` : `${Math.round(m / 60)} giờ`;
}

function buildPayload(msg, queuedAt, now = Date.now()) {
  const level = COLORS[msg.level] !== undefined ? msg.level : 'info';

  const fields = (Array.isArray(msg.fields) ? msg.fields : [])
    .filter((f) => f && f.name)
    .slice(0, 25)
    .map((f) => ({
      name: clip(redact(f.name), 256) || '–',
      value: clip(redact(f.value), 1024) || '–',
      inline: Boolean(f.inline)
    }));

  const delay = now - queuedAt;
  const footerParts = ['Giám sát bot'];
  if (msg.footer) footerParts.push(redact(msg.footer));
  if (delay > cfg.staleNoteMs) footerParts.push(`gửi trễ ${describeDelay(delay)} (do mạng hoặc webhook bị gián đoạn)`);

  const embed = {
    color: COLORS[level],
    title: clip(redact(msg.title || '(không có tiêu đề)'), 256),
    description: clip(redact(msg.description || ''), 4000) || undefined,
    fields: fields.length ? fields : undefined,
    footer: { text: clip(footerParts.join(' · '), 2048) },
    timestamp: new Date(queuedAt).toISOString()
  };

  // Giới hạn tổng 6000 ký tự của một embed: cắt mô tả trước, rồi bỏ bớt field cuối.
  const total = () => embed.title.length + (embed.description ? embed.description.length : 0) + embed.footer.text.length
    + (embed.fields || []).reduce((n, f) => n + f.name.length + f.value.length, 0);
  let over = total() - 5800;
  if (over > 0 && embed.description) {
    embed.description = clip(embed.description, Math.max(200, embed.description.length - over));
    over = total() - 5800;
  }
  while (over > 0 && embed.fields && embed.fields.length) {
    embed.fields.pop();
    over = total() - 5800;
  }
  if (embed.fields && !embed.fields.length) embed.fields = undefined;

  const mentionId = msg.ping && /^\d{5,25}$/.test(env.ALERT_MENTION_USER_ID || '') ? env.ALERT_MENTION_USER_ID : null;
  return {
    username: 'Giám sát bot',
    content: mentionId ? `<@${mentionId}>` : undefined,
    embeds: [embed],
    allowed_mentions: { parse: [], users: mentionId ? [mentionId] : [] }
  };
}

// --- Gửi -------------------------------------------------------------------

function describeNetworkError(err) {
  const code = (err && err.cause && err.cause.code) || (err && err.code);
  if (err && (err.name === 'TimeoutError' || err.name === 'AbortError')) return 'quá thời gian chờ (mạng chậm hoặc Discord không phản hồi)';
  const map = {
    ENOTFOUND: 'không phân giải được tên miền discord.com (mất mạng hoặc lỗi DNS)',
    EAI_AGAIN: 'lỗi DNS tạm thời (mạng không ổn định)',
    ECONNREFUSED: 'kết nối bị từ chối',
    ECONNRESET: 'kết nối bị ngắt giữa chừng',
    ETIMEDOUT: 'kết nối quá thời gian chờ',
    ENETUNREACH: 'không có đường ra Internet',
    EHOSTUNREACH: 'không tới được máy chủ Discord',
    UND_ERR_CONNECT_TIMEOUT: 'kết nối quá thời gian chờ'
  };
  return map[code] || firstLine((err && err.message) || err, 160);
}

/** Cách gửi mặc định (fetch). Test có thể thay bằng _setTransport. */
async function defaultTransport(url, payload) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(cfg.requestTimeoutMs)
  });
  let body = '';
  try { body = await res.text(); } catch { /* không đọc được body cũng không sao */ }
  return { status: res.status, retryAfter: res.headers.get('retry-after'), body };
}
let transport = defaultTransport;

/**
 * Gửi 1 tin. Trả về { ok } hoặc { ok:false, retry, delay, error, network }.
 * `retry:false` nghĩa là lỗi vĩnh viễn (URL sai, webhook đã bị xoá, nội dung bị từ chối).
 */
async function post(item) {
  let res;
  try {
    res = await transport(env.ERROR_WEBHOOK_URL, buildPayload(item.msg, item.at));
  } catch (err) {
    return { ok: false, retry: true, network: true, error: `Không kết nối được tới Discord: ${describeNetworkError(err)}` };
  }

  if (res.status >= 200 && res.status < 300) return { ok: true };

  if (res.status === 429) {
    let wait = Number.parseFloat(res.retryAfter);
    if (!Number.isFinite(wait)) {
      try { wait = Number(JSON.parse(res.body).retry_after); } catch { wait = NaN; }
    }
    return { ok: false, retry: true, rateLimited: true, delay: Math.ceil((Number.isFinite(wait) ? wait : 2) * 1000) + 100, error: 'Discord giới hạn tốc độ (429)' };
  }

  if (res.status >= 500) return { ok: false, retry: true, error: `Discord đang lỗi (HTTP ${res.status})` };

  const hint = res.status === 404 || res.status === 401
    ? 'Webhook không tồn tại hoặc đã bị xoá, hãy tạo webhook mới và cập nhật ERROR_WEBHOOK_URL'
    : `Discord từ chối tin nhắn (HTTP ${res.status}): ${firstLine(res.body, 120)}`;
  return { ok: false, retry: false, error: hint };
}

function noteFailure(result, item) {
  state.webhook.lastError = result.error;
  failStreak++;
  const now = Date.now();
  if (now - lastFailLogAt > 60_000) {
    lastFailLogAt = now;
    log(`${result.error}${item ? ` · còn ${queue.length} tin trong hàng đợi` : ''}`);
  }
  if (failStreak === 3) {
    addIncident({ level: 'warn', type: 'webhook', isPublic: false, message: `Webhook không gửi được: ${result.error}` });
  }
}

function settle() {
  if (queue.length || draining) return;
  const done = waiters;
  waiters = [];
  for (const fn of done) fn(true);
}

async function drain() {
  if (draining) return;
  draining = true;
  try {
    while (queue.length) {
      const wait = nextAllowedAt - Date.now();
      if (wait > 0) await sleep(wait);

      const item = queue[0];
      if (Date.now() - item.at > cfg.staleDropMs) {
        queue.shift();
        state.webhook.dropped++;
        continue;
      }

      let result;
      try { result = await post(item); } catch (err) { result = { ok: false, retry: false, error: firstLine(err && err.message) }; }

      if (result.ok) {
        queue.shift();
        state.webhook.sent++;
        state.webhook.lastSentAt = Date.now();
        state.webhook.lastError = null;
        if (failStreak >= 3) addIncident({ level: 'recovered', type: 'webhook', isPublic: false, message: 'Webhook gửi được trở lại' });
        failStreak = 0;
        nextAllowedAt = Date.now() + cfg.minGapMs;
      } else if (result.retry) {
        if (result.rateLimited) {
          item.rateLimited = (item.rateLimited || 0) + 1;
          if (item.rateLimited > 10) { queue.shift(); state.webhook.failed++; continue; }
          nextAllowedAt = Date.now() + result.delay;
        } else {
          noteFailure(result, item);
          if (!result.network) {
            item.attempts = (item.attempts || 0) + 1;
            if (item.attempts >= cfg.maxHttpAttempts) { queue.shift(); state.webhook.failed++; }
          }
          nextAllowedAt = Date.now() + Math.min(cfg.backoffMaxMs, cfg.backoffBaseMs * 2 ** Math.min(failStreak, 5));
        }
      } else {
        queue.shift();
        state.webhook.failed++;
        noteFailure(result, null);
        failStreak = 0; // lỗi nội dung/URL không phải do mạng, không làm chậm các tin sau
      }
    }
  } finally {
    draining = false;
    settle();
  }
}

// --- API công khai ---------------------------------------------------------

/**
 * @param {object} msg { level, title, description, fields[{name,value,inline}], footer, key, dedupeMs, ping }
 * @returns {boolean} true nếu tin đã vào hàng đợi
 */
function notify(msg = {}) {
  try {
    if (!isConfigured()) return false;

    const now = Date.now();
    const dedupeMs = msg.dedupeMs === undefined ? cfg.defaultDedupeMs : msg.dedupeMs;
    const key = msg.key || `${msg.level || 'info'}|${msg.title || ''}`;
    if (dedupeMs > 0) {
      const last = lastSent.get(key);
      if (last && now - last < dedupeMs) { state.webhook.deduped++; return false; }
    }
    lastSent.set(key, now);
    if (lastSent.size > 500) {
      for (const [k, t] of lastSent) if (now - t > 60 * 60_000) lastSent.delete(k);
    }

    if (queue.length >= cfg.maxQueue) {
      // Đầy hàng đợi: bỏ tin thường cũ nhất trước, giữ lại tin lỗi / cảnh báo.
      let idx = queue.findIndex((q, i) => i > 0 && q.msg.level !== 'error' && q.msg.level !== 'warn');
      if (idx === -1) idx = queue.length > 1 ? 1 : 0;
      queue.splice(idx, 1);
      state.webhook.dropped++;
    }

    queue.push({ msg, at: now, attempts: 0 });
    drain().catch((err) => log(`Lỗi hàng đợi: ${err.message}`));
    return true;
  } catch (err) {
    log(`notify lỗi: ${err.message}`);
    return false;
  }
}

/** Chờ gửi hết hàng đợi (tối đa timeoutMs). Dùng trước khi thoát tiến trình. */
function flush(timeoutMs = 5000) {
  if (!queue.length && !draining) return Promise.resolve(true);
  if (!draining) drain().catch(() => {});
  return new Promise((resolve) => {
    let finished = false;
    const done = (ok) => { if (!finished) { finished = true; clearTimeout(timer); resolve(ok); } };
    const timer = setTimeout(() => {
      waiters = waiters.filter((w) => w !== done);
      done(false);
    }, timeoutMs);
    waiters.push(done);
  });
}

const stats = () => ({ configured: isConfigured(), queued: queue.length, failStreak, ...state.webhook });

module.exports = {
  notify, flush, isConfigured, configProblem, stats,
  // nội bộ, để test
  buildPayload, post, _cfg: cfg, _queue: queue, _setTransport: (fn) => { transport = fn || defaultTransport; },
  _reset: () => { queue.length = 0; lastSent.clear(); waiters = []; failStreak = 0; nextAllowedAt = 0; }
};

// npm run webhook:test  -> gửi 1 tin thử và in kết quả
if (require.main === module) {
  (async () => {
    const problem = configProblem();
    if (problem) { console.log(`❌ ${problem}`); process.exit(1); }
    const item = {
      at: Date.now(),
      msg: {
        level: 'success',
        title: '🧪 Thử webhook thành công',
        description: 'Nếu bạn đọc được tin này thì thông báo lỗi và báo cáo định kỳ của bot sẽ hoạt động.',
        fields: [
          { name: 'Máy chủ', value: os.hostname(), inline: true },
          { name: 'Node', value: process.version, inline: true },
          { name: 'Báo cáo định kỳ', value: `Mỗi ${env.REPORT_INTERVAL_MINUTES} phút`, inline: true }
        ]
      }
    };
    const r = await post(item);
    console.log(r.ok ? '✅ Đã gửi tin thử, kiểm tra kênh Discord của webhook.' : `❌ Gửi thất bại: ${r.error}`);
    process.exit(r.ok ? 0 : 1);
  })();
}