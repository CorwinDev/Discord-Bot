'use strict';

/** Báo cáo tình hình bot qua Discord webhook mỗi REPORT_INTERVAL_MINUTES phút (kể cả khi không có lỗi). */

const os = require('os');
const env = require('../config/env');
const notifier = require('./webhookNotifier');
const metrics = require('./metrics');
const uptime = require('./uptime');
const { state, drainWindow } = require('./healthState');

const log = (msg) => process.stderr.write(`[report] ${msg}\n`);
let timer = null;
let lastReport = null; // tóm tắt cho web

const clip = (text, n) => (text.length > n ? `${text.slice(0, n - 1)}…` : text);
const hhmm = (ts) => new Date(ts).toLocaleTimeString('vi-VN', { hour12: false, timeZone: 'Asia/Bangkok' });
const ms = (v) => (v === null || v === undefined ? '–' : `${v}ms`);

/** Gộp các sự kiện giống nhau: { message, level, count, first, last } */
function groupEvents(events) {
  const map = new Map();
  for (const e of events) {
    if (e.level !== 'error' && e.level !== 'warn') continue;
    const key = `${e.level}|${e.type}|${e.message}`;
    const g = map.get(key);
    if (g) { g.count++; g.last = e.ts; } else map.set(key, { level: e.level, type: e.type, message: e.message, count: 1, first: e.ts, last: e.ts });
  }
  return [...map.values()].sort((a, b) => (a.level === b.level ? b.count - a.count : a.level === 'error' ? -1 : 1));
}

function build(client) {
  const events = drainWindow();
  const m = metrics.drain();
  const groups = groupEvents(events);
  const errors = events.filter((e) => e.level === 'error').length;
  const warns = events.filter((e) => e.level === 'warn').length;
  const disconnects = events.filter((e) => e.type === 'connection' && /Mất kết nối/.test(e.message)).length;
  const recovered = events.filter((e) => e.level === 'recovered').length;
  const netFail = Object.values(m.probes).reduce((n, p) => n + p.fail, 0);
  const ready = client.isReady();
  const up = uptime.info(client);
  const mem = process.memoryUsage();

  let level = 'success';
  let verdict = '✅ Không có lỗi nào phát sinh';
  if (!ready || errors) { level = 'error'; verdict = errors ? `🔴 Có ${errors} lỗi phát sinh` : '🔴 Bot đang mất kết nối Discord'; }
  else if (warns || netFail || !state.dbOk) { level = 'warn'; verdict = `🟡 Có ${warns + netFail} cảnh báo`; }

  const windowMin = Math.max(1, Math.round(m.windowMs / 60_000));
  const to = Date.now();
  const from = to - m.windowMs;
  const sec = (ts) => Math.floor(ts / 1000);
  const lastDown = state.lastDisconnectAt && state.lastDisconnectAt >= from
    ? `Mất kết nối lúc <t:${sec(state.lastDisconnectAt)}:T>${state.lastDisconnectReason ? `\nLý do: ${clip(state.lastDisconnectReason, 150)}` : ''}`
    : null;

  const issueText = groups.length
    ? groups.slice(0, 8).map((g) => `${g.level === 'error' ? '🔴' : '🟡'} **×${g.count}** ${clip(g.message, 150)} _(${hhmm(g.first)}${g.count > 1 ? `–${hhmm(g.last)}` : ''})_`).join('\n')
      + (groups.length > 8 ? `\n… và ${groups.length - 8} nhóm lỗi khác` : '')
    : 'Không có lỗi hay cảnh báo trong khoảng này.';

  const netLines = Object.values(m.probes).map((p) => {
    const latest = metrics.snapshotLatest();
    const id = p.label === 'Discord API' ? 'discord' : 'internet';
    const now = latest[id];
    const icon = now ? (now.ok ? '🟢' : '🔴') : '⚪';
    return `${icon} ${p.label}: TB ${ms(p.avg)} · cao nhất ${ms(p.max)}${p.fail ? ` · **${p.fail} lần lỗi**` : ''}`;
  }).join('\n');

  const cmd = m.commands;
  const speed = [
    `Ping gateway: ${ms(m.ping.min)} / **${ms(m.ping.avg)}** / ${ms(m.ping.max)} _(thấp/TB/cao, ${m.ping.n} mẫu)_`,
    `Lệnh: ${cmd.n ? `${cmd.n} lệnh · TB ${ms(cmd.avg)} · p95 ${ms(cmd.p95)} · cao nhất ${ms(cmd.max)}${cmd.fails ? ` · ${cmd.fails} lỗi` : ''}` : 'chưa có ai dùng lệnh'}`,
    m.loop ? `Độ trễ xử lý: p50 ${ms(m.loop.p50)} · p99 ${ms(m.loop.p99)} · cao nhất ${ms(m.loop.max)}` : null
  ].filter(Boolean).join('\n');

  const b = state.backup;
  const backupText = !b.enabled
    ? 'Đang tắt'
    : [
        b.lastBackupAt ? `Gần nhất: <t:${Math.floor(b.lastBackupAt / 1000)}:R> (${(b.lastSizeBytes / 1024).toFixed(1)} KB)` : 'Chưa có bản nào',
        b.pendingRestore ? '⚠️ Đang chờ khôi phục dữ liệu' : null,
        b.lastError ? `⚠️ Lỗi gần nhất: ${clip(b.lastError, 120)}` : null
      ].filter(Boolean).join('\n');

  const embed = {
    level,
    title: `📊 Báo cáo ${windowMin} phút · ${verdict}`,
    description: issueText,
    fields: [
      { name: 'Kết nối Discord', value: [`${ready ? '🟢 Đang online' : '🔴 Mất kết nối'}`, `Mất kết nối: ${disconnects} · Tự phục hồi: ${recovered}`, lastDown].filter(Boolean).join('\n'), inline: true },
      { name: 'Thời gian', value: `Báo cáo lúc <t:${sec(to)}:T> · <t:${sec(to)}:d>\nKhoảng đo: <t:${sec(from)}:t> → <t:${sec(to)}:t>\nBáo cáo kế tiếp: <t:${sec(to + env.REPORT_INTERVAL_MINUTES * 60_000)}:R>`, inline: true },
      { name: 'Mạng', value: netLines || '–', inline: false },
      { name: 'Tốc độ bot', value: speed, inline: false },
      { name: 'Tài nguyên', value: `CPU TB ${m.cpuAvg ?? '–'}% (cao ${m.cpuMax ?? '–'}%)\nRAM ${Math.round(mem.rss / 1048576)} MB · heap ${Math.round(mem.heapUsed / 1048576)} MB\nHệ thống: tải ${os.loadavg()[0].toFixed(2)} · trống ${Math.round(os.freemem() / 1048576)} MB`, inline: true },
      { name: 'Cơ sở dữ liệu', value: state.dbOk ? '🟢 Bình thường' : '🔴 Lỗi truy vấn', inline: true },
      { name: 'Online', value: `Phiên này: **${uptime.formatMs(up.processMs)}**\nTổng cộng: **${uptime.hours(up.totalOnlineMs)} giờ** · khởi động ${up.bootCount} lần`, inline: true },
      { name: 'Backup dữ liệu', value: backupText, inline: false }
    ]
  };

  lastReport = {
    at: Date.now(), windowMin, level, verdict, errors, warnings: warns + netFail, disconnects, recovered,
    ping: m.ping, issues: groups.slice(0, 8).map((g) => ({ level: g.level, count: g.count, message: g.message, first: g.first, last: g.last })),
    commands: cmd,
    network: Object.values(m.probes).map((p) => ({ label: p.label, avg: p.avg, max: p.max, fail: p.fail })),
    lastDisconnectReason: lastDown ? state.lastDisconnectReason : null
  };
  return embed;
}

function send(client) {
  try {
    const embed = build(client);
    notifier.notify({ ...embed, key: `periodic|${Date.now()}`, dedupeMs: 0, ping: false });
  } catch (err) {
    log(`Không tạo được báo cáo: ${err.message}`);
  }
}

function start(client) {
  if (timer) return;
  metrics.start(client);
  timer = setInterval(() => send(client), env.REPORT_INTERVAL_MINUTES * 60_000);
  timer.unref();
}

const getLastReport = () => lastReport;

module.exports = { start, send, build, getLastReport, groupEvents };