'use strict';


const os = require('os');
const env = require('../config/env');
const { state, redact } = require('./healthState');

const VALID_URL = /^https:\/\/(?:(?:canary|ptb)\.)?discord(?:app)?\.com\/api(?:\/v\d+)?\/webhooks\/\d+\/[\w-]+$/;
const COLORS = { error: 0xed4245, warn: 0xfee75c, success: 0x57f287, info: 0x5865f2 };
const MAX_QUEUE = 30;
const MIN_GAP_MS = 600;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const log = (msg) => process.stderr.write(`[webhook] ${msg}\n`);
const truncate = (text, max) => (text.length > max ? `${text.slice(0, max - 1)}…` : text);

let url = env.ERROR_WEBHOOK_URL || null;
if (url && !VALID_URL.test(url)) {
  log('ERROR_WEBHOOK_URL không đúng định dạng webhook Discord, tạm tắt thông báo webhook.');
  url = null;
}
state.webhook.configured = Boolean(url);

const mentionId = /^\d{15,25}$/.test(env.ALERT_MENTION_USER_ID) ? env.ALERT_MENTION_USER_ID : null;

const queue = [];
const recent = new Map(); 
let sending = false;

function prune(now) {
  for (const [key, entry] of recent) {
    if (now - entry.ts > 10 * 60_000) recent.delete(key);
  }
}

/**
 * @param {object} o
 * @param {'error'|'warn'|'success'|'info'} [o.level]
 * @param {string} o.title
 * @param {string} [o.description]
 * @param {{name:string,value:string,inline?:boolean}[]} [o.fields]
 * @param {string} [o.key]       khoá chống trùng (mặc định suy ra từ nội dung)
 * @param {number} [o.dedupeMs]  0 = luôn gửi
 * @param {boolean} [o.ping]     ping ALERT_MENTION_USER_ID (nếu có)
 * @returns {boolean} true nếu đã đưa vào hàng đợi
 */
function notify({ level = 'info', title, description = '', fields = [], key, dedupeMs = 60_000, ping = false } = {}) {
  if (!url || !title) return false;

  const now = Date.now();
  const dedupeKey = key || `${level}|${title}|${String(description).slice(0, 160)}`;
  const seen = recent.get(dedupeKey);
  if (seen && now - seen.ts < dedupeMs) {
    seen.suppressed++;
    return false;
  }
  const suppressed = seen ? seen.suppressed : 0;
  recent.set(dedupeKey, { ts: now, suppressed: 0 });
  if (recent.size > 300) prune(now);

  let body = truncate(redact(description), 3800);
  if (suppressed > 0) body += `\n\n_(đã lặp lại ${suppressed} lần trong thời gian bị chặn trùng)_`;

  const embed = {
    title: truncate(redact(title), 256),
    description: body,
    color: COLORS[level] ?? COLORS.info,
    fields: fields.slice(0, 10).map((f) => ({
      name: truncate(redact(f.name), 256),
      value: truncate(redact(f.value) || '—', 1024),
      inline: f.inline !== false
    })),
    timestamp: new Date(now).toISOString(),
    footer: { text: `${os.hostname()} • PID ${process.pid}` }
  };

  if (queue.length >= MAX_QUEUE) {
    queue.shift();
    state.webhook.dropped++;
  }
  queue.push({ embed, ping });
  pump();
  return true;
}

async function deliver({ embed, ping }) {
  const mention = ping && mentionId ? mentionId : null;
  const payload = JSON.stringify({
    username: 'Giám sát bot',
    content: mention ? `<@${mention}>` : undefined,
    allowed_mentions: { parse: [], users: mention ? [mention] : [] },
    embeds: [embed]
  });

  for (let attempt = 0; attempt < 4; attempt++) {
    let res;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: payload,
        signal: AbortSignal.timeout(10_000)
      });
    } catch (err) {
      log(`Không gửi được (lần ${attempt + 1}): ${err.message}`);
      await sleep(1000 * 2 ** attempt);
      continue;
    }

    if (res.ok) return true;

    if (res.status === 429) {
      const data = await res.json().catch(() => ({}));
      await sleep(Math.min(30_000, (Number(data.retry_after) || 1) * 1000 + 100));
      continue;
    }
    if (res.status === 401 || res.status === 403 || res.status === 404) {
      log(`Webhook bị từ chối (HTTP ${res.status}) — có thể đã bị xoá hoặc sai URL. Tắt thông báo webhook.`);
      url = null;
      state.webhook.configured = false;
      return false;
    }
    if (res.status >= 500) {
      await sleep(1000 * 2 ** attempt);
      continue;
    }
    log(`Discord trả về HTTP ${res.status}, bỏ qua thông báo này.`);
    return false;
  }
  return false;
}

async function pump() {
  if (sending) return;
  sending = true;
  try {
    while (queue.length && url) {
      const ok = await deliver(queue.shift());
      if (ok) state.webhook.sent++;
      else state.webhook.failed++;
      await sleep(MIN_GAP_MS);
    }
    if (!url) queue.length = 0;
  } finally {
    sending = false;
  }
}


async function flush(timeoutMs = 5000) {
  const end = Date.now() + timeoutMs;
  while ((sending || queue.length) && Date.now() < end) await sleep(100);
}

const isConfigured = () => Boolean(url);

module.exports = { notify, flush, isConfigured };


if (require.main === module) {
  if (!isConfigured()) {
    log('Chưa có ERROR_WEBHOOK_URL hợp lệ. Hãy đặt biến môi trường này rồi chạy lại.');
    process.exit(1);
  }
  notify({
    level: 'success',
    title: '✅ Webhook hoạt động',
    description: 'Đây là tin nhắn thử. Khi bot gặp sự cố, thông báo sẽ xuất hiện ở kênh này.',
    dedupeMs: 0
  });
  flush(15_000).then(() => {
    log(state.webhook.sent ? 'Đã gửi tin nhắn thử.' : 'Gửi thất bại, kiểm tra lại URL webhook.');
    process.exit(state.webhook.sent ? 0 : 1);
  });
}