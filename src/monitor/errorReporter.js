'use strict';

/**
 * Báo lỗi của bot lên webhook:
 * - reportError(): báo 1 lỗi cụ thể (kèm stack đã che token/URL).
 * - installConsoleTap(): mọi console.error của bot (lỗi lệnh, lỗi event, unhandled rejection) cũng được báo.
 */

const util = require('util');
const notifier = require('./webhookNotifier');
const { addIncident, firstLine, redact } = require('./healthState');

const DEDUPE_MS = 5 * 60_000;
const CONSOLE_MAX_PER_MINUTE = 15;
// Log nội bộ của hệ thống giám sát: không được tự gửi lại lên webhook (tránh vòng lặp).
const INTERNAL_PREFIX = /^\s*\[(?:monitor|webhook|report|backup|dashboard|env|supervisor)\]/i;

const clip = (text, n) => (text.length > n ? `${text.slice(0, n - 1)}…` : text);
const sec = (ts) => Math.floor(ts / 1000);

function formatError(err) {
  if (err instanceof Error) return err.stack || `${err.name}: ${err.message}`;
  if (err && typeof err === 'object') {
    try { return JSON.stringify(err); } catch { /* rơi xuống String */ }
  }
  return String(err);
}

const codeBlock = (text, max) => `\`\`\`\n${clip(text, max).replace(/```/g, "'''")}\n\`\`\``;

function processFields() {
  const mem = Math.round(process.memoryUsage().rss / 1048576);
  return [
    { name: 'Thời điểm', value: `<t:${sec(Date.now())}:T> (<t:${sec(Date.now())}:R>)`, inline: true },
    { name: 'Phiên chạy', value: `${Math.round(process.uptime() / 60)} phút · RAM ${mem} MB`, inline: true }
  ];
}

/**
 * @param {string} title  mô tả ngắn lỗi xảy ra ở đâu
 * @param {*} err         Error hoặc giá trị bất kỳ
 * @param {{ ping?: boolean, level?: string, key?: string }} opts
 */
function reportError(title, err, { ping = false, level = 'error', key } = {}) {
  try {
    const text = redact(formatError(err));
    const head = firstLine(text, 200);
    addIncident({ level, type: 'error', isPublic: false, message: `${title}: ${head}` });
    notifier.notify({
      level,
      title: `🚨 ${title}`,
      description: codeBlock(text, 1800),
      fields: processFields(),
      key: key || `err|${title}|${head}`,
      dedupeMs: DEDUPE_MS,
      ping
    });
  } catch { /* báo lỗi không được gây thêm lỗi */ }
}

let installed = false;

function installConsoleTap() {
  if (installed) return;
  installed = true;

  const original = console.error.bind(console);
  const stamps = [];
  let busy = false;

  console.error = (...args) => {
    original(...args);
    if (busy) return;
    busy = true;
    try {
      const text = redact(util.format(...args));
      if (INTERNAL_PREFIX.test(text)) return;

      const now = Date.now();
      while (stamps.length && now - stamps[0] > 60_000) stamps.shift();
      if (stamps.length >= CONSOLE_MAX_PER_MINUTE) return; // đang bão lỗi: chỉ ghi vào log, không dội webhook
      stamps.push(now);

      const head = firstLine(text, 200);
      addIncident({ level: 'error', type: 'console', isPublic: false, message: head });
      notifier.notify({
        level: 'error',
        title: '🐞 Lỗi trong bot (console.error)',
        description: codeBlock(text, 1800),
        fields: processFields(),
        key: `console|${head}`,
        dedupeMs: DEDUPE_MS
      });
    } catch { /* bỏ qua */ } finally {
      busy = false;
    }
  };
}

module.exports = { reportError, installConsoleTap, formatError };