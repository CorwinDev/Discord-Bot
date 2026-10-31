'use strict';


const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const env = require('../config/env');
const notifier = require('./webhookNotifier');
const { state } = require('./healthState');
const metrics = require('./metrics');
const uptime = require('./uptime');
const periodicReport = require('./periodicReport');

// Trang chính là index.html nằm cùng cấp package.json; script của trang ở monitor/public/app.js
const ROOT_DIR = path.join(__dirname, '..', '..');
const PUBLIC_DIR = path.join(__dirname, 'public');
const ROUTES = {
  '/': [path.join(ROOT_DIR, 'index.html'), 'text/html; charset=utf-8'],
  '/index.html': [path.join(ROOT_DIR, 'index.html'), 'text/html; charset=utf-8'],
  '/app.js': [path.join(PUBLIC_DIR, 'app.js'), 'text/javascript; charset=utf-8']
};
const SHARD_STATUS = ['Ready', 'Connecting', 'Reconnecting', 'Idle', 'Nearly', 'Disconnected', 'WaitingForGuilds', 'Identifying', 'Resuming'];

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
  'Cache-Control': 'no-store',
  'Content-Security-Policy':
    "default-src 'none'; script-src 'self'; style-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"
};

const log = (msg) => process.stderr.write(`[dashboard] ${msg}\n`);
const fileCache = new Map();

// Một phần số liệu lỗi thì chỉ phần đó trống, không được làm cả trang không tải được.
const safe = (fn, fallback) => {
  try { return fn(); } catch (err) { log(`Bỏ qua một phần số liệu: ${err.message}`); return fallback; }
};

const FALLBACK_PAGE = '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Tình hình bot</title>'
  + '<body style="font-family:system-ui;padding:24px"><h1>Tình hình bot</h1><p>Không tìm thấy giao diện web (index.html). Dữ liệu vẫn có ở <a href="/api/status">/api/status</a> và <a href="/health">/health</a>.</p></body>';

function readPublic(file) {
  if (!fileCache.has(file)) fileCache.set(file, fs.readFileSync(file));
  return fileCache.get(file);
}

function send(req, res, code, body, type) {
  const buf = Buffer.isBuffer(body) ? body : Buffer.from(body);
  res.writeHead(code, { ...SECURITY_HEADERS, 'Content-Type': type, 'Content-Length': buf.length });
  res.end(req.method === 'HEAD' ? undefined : buf);
}
const sendJson = (req, res, code, obj) => send(req, res, code, JSON.stringify(obj), 'application/json; charset=utf-8');


const hits = new Map();
function limited(key, max, windowMs) {
  const now = Date.now();
  let entry = hits.get(key);
  if (!entry || now > entry.reset) {
    entry = { count: 0, reset: now + windowMs };
    hits.set(key, entry);
  }
  entry.count++;
  return entry.count > max;
}

function clientIp(req) {
  const fwd = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return fwd || req.socket.remoteAddress || 'unknown';
}

function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

function authorized(req) {
  if (!env.DASHBOARD_TOKEN) return true;
  const header = String(req.headers.authorization || '');
  const supplied = header.startsWith('Bearer ') ? header.slice(7) : String(req.headers['x-dashboard-token'] || '');
  return supplied.length > 0 && safeEqual(supplied, env.DASHBOARD_TOKEN);
}


function computeStatus(client) {
  const now = Date.now();
  if (client.isReady()) {
    const ping = client.ws.ping;
    return !state.dbOk || ping > env.HIGH_PING_MS ? 'degraded' : 'online';
  }
  if (!state.firstReadyAt) return now - state.startedAt > 5 * 60_000 ? 'offline' : 'starting';
  const downFor = state.lastDisconnectAt ? now - state.lastDisconnectAt : 0;
  return downFor > env.RECOVERY_GRACE_SECONDS * 1000 ? 'offline' : 'reconnecting';
}

function snapshot(client, full) {
  const mem = process.memoryUsage();
  const ready = client.isReady();
  const ping = ready && client.ws.ping >= 0 ? client.ws.ping : null;
  let members = 0;
  for (const guild of client.guilds.cache.values()) members += guild.memberCount || 0;

  return {
    status: computeStatus(client),
    bot: client.user ? { tag: client.user.tag } : null,
    ping,
    uptime: safe(() => {
      const u = uptime.info(client);
      return {
        processSec: Math.floor(u.processMs / 1000),
        connectedSec: Math.floor(u.connectedMs / 1000),
        totalOnlineSec: Math.floor(u.totalOnlineMs / 1000),
        firstOnlineAt: u.firstOnlineAt,
        bootCount: u.bootCount
      };
    }, { processSec: Math.floor(process.uptime()), connectedSec: 0, totalOnlineSec: 0, firstOnlineAt: Date.now(), bootCount: 1 }),
    network: safe(() => metrics.snapshotLatest(), {}),
    pingHistory: safe(() => metrics.getHistory().slice(-60), []),
    lastReport: safe(() => {
      const r = periodicReport.getLastReport();
      if (!r) return null;
      return {
        at: r.at, windowMin: r.windowMin, level: r.level, errors: r.errors, warnings: r.warnings, disconnects: r.disconnects,
        // Chi tiết lý do chỉ cho người đã đăng nhập (DASHBOARD_TOKEN), trang công khai chỉ thấy số lượng.
        issues: full ? r.issues.slice(0, 5).map(({ level, count, message }) => ({ level, count, message })) : [],
        lastDisconnectReason: full ? r.lastDisconnectReason : null,
        ping: r.ping ? { avg: r.ping.avg, max: r.ping.max } : null
      };
    }, null),
    backup: {
      enabled: state.backup.enabled,
      lastBackupAt: state.backup.lastBackupAt,
      sizeKB: Math.round(state.backup.lastSizeBytes / 102.4) / 10,
      count: state.backup.count,
      failures: state.backup.failures,
      lastRestoreAt: state.backup.lastRestoreAt,
      pendingRestore: state.backup.pendingRestore
    },
    guilds: client.guilds.cache.size,
    members,
    commands: client.commands ? client.commands.size : 0,
    shards: [...client.ws.shards.values()].map((s) => ({ id: s.id, status: SHARD_STATUS[s.status] || String(s.status) })),
    memory: { rssMB: Math.round(mem.rss / 1048576), heapUsedMB: Math.round(mem.heapUsed / 1048576) },
    node: process.version,
    database: { ok: state.dbOk },
    recovery: {
      autoFix: env.AUTO_FIX,
      recoveries: state.recoveries,
      attempts: state.recoveryAttempts,
      lastRecoveryAt: state.lastRecoveryAt
    },
    alerts: safe(() => ({
      webhookConfigured: notifier.isConfigured(),
      sent: state.webhook.sent,
      failed: state.webhook.failed,
      queued: notifier.stats().queued,
      lastSentAt: state.webhook.lastSentAt,
      failing: Boolean(state.webhook.lastError),
      lastError: full ? state.webhook.lastError : null
    }), { webhookConfigured: false, sent: 0, failed: 0, queued: 0, lastSentAt: null, failing: false, lastError: null }),
    counters: { errors: state.errorCount, warnings: state.warnCount },
    incidents: state.incidents
      .filter((i) => full || i.isPublic)
      .slice(-20)
      .reverse()
      .map(({ ts, level, type, message }) => ({ ts, level, type, message })),
    view: full ? 'full' : 'public',
    tokenRequired: Boolean(env.DASHBOARD_TOKEN),
    generatedAt: Date.now()
  };
}

function start(client) {
  if (!env.DASHBOARD_ENABLED) {
    log('Dashboard đang tắt (DASHBOARD_ENABLED=false).');
    return null;
  }

  const server = http.createServer((req, res) => {
    try {
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        res.setHeader('Allow', 'GET, HEAD');
        return sendJson(req, res, 405, { error: 'method_not_allowed' });
      }

      const pathname = (req.url || '/').split('?')[0];
      const ip = clientIp(req);

      if (ROUTES[pathname]) {
        const [file, type] = ROUTES[pathname];
        let body;
        try { body = readPublic(file); } catch (err) {
          log(`Không đọc được ${path.basename(file)}: ${err.message}`);
          return pathname === '/app.js' ? send(req, res, 404, '', type) : send(req, res, 200, FALLBACK_PAGE, 'text/html; charset=utf-8');
        }
        return send(req, res, 200, body, type);
      }

      if (pathname === '/health') {
        const status = computeStatus(client);
        return sendJson(req, res, status === 'offline' ? 503 : 200, { ok: status !== 'offline', status });
      }

      if (pathname === '/api/status') {
        if (limited(`api:${ip}`, 120, 60_000)) return sendJson(req, res, 429, { error: 'too_many_requests' });
        if (!authorized(req)) {
          if (limited(`fail:${ip}`, 10, 60_000)) return sendJson(req, res, 429, { error: 'too_many_requests' });
          return sendJson(req, res, 401, { error: 'unauthorized', tokenRequired: true });
        }
        return sendJson(req, res, 200, snapshot(client, Boolean(env.DASHBOARD_TOKEN)));
      }

      return sendJson(req, res, 404, { error: 'not_found' });
    } catch (err) {
      log(`Lỗi xử lý request: ${err.message}`);
      try { sendJson(req, res, 500, { error: 'internal_error' }); } catch { /* đã gửi một phần */ }
    }
  });

  server.requestTimeout = 10_000;
  server.headersTimeout = 10_000;

  // Cổng đang bận (bot cũ chưa tắt hẳn, hosting chưa nhả cổng...): thử mở lại thay vì bỏ cuộc,
  // bot vẫn chạy bình thường trong lúc chờ.
  let retryTimer = null;
  const listen = () => server.listen(env.PORT, env.HOST);
  server.on('error', (err) => {
    if (server.listening) { log(`Lỗi web: ${err.code || err.message}`); return; }
    log(`Không mở được web trên cổng ${env.PORT}: ${err.code || err.message}. Thử lại sau 15 giây (bot vẫn chạy bình thường).`);
    clearTimeout(retryTimer);
    retryTimer = setTimeout(listen, 15_000);
    retryTimer.unref();
  });
  server.on('listening', () => {
    log(`Web trạng thái đang chạy tại cổng ${env.PORT}${env.DASHBOARD_TOKEN ? ' (có mật khẩu)' : ' (công khai, nên đặt DASHBOARD_TOKEN)'}.`);
  });
  listen();

  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) if (now > entry.reset) hits.delete(key);
  }, 60_000).unref();

  return server;
}

module.exports = { start };