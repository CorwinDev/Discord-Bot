'use strict';

/** Theo dõi thời gian online: phiên hiện tại + tổng cộng mọi lần chạy (lưu trong DB nên được backup). */

const { state } = require('./healthState');

const TICK_MS = 30_000;
let timer = null;
let lastTick = 0;
let bootAt = Date.now();
let clientRef = null;

const metaStore = () => require('../database/meta').meta;

function init() {
  const meta = metaStore();
  bootAt = Date.now();
  if (!meta.get('firstOnlineAt')) meta.set('firstOnlineAt', bootAt);
  meta.set('bootCount', meta.getNum('bootCount', 0) + 1);
  meta.set('lastBootAt', bootAt);
}

function tick() {
  const now = Date.now();
  const elapsed = Math.min(now - lastTick, 5 * TICK_MS); // chống nhảy đồng hồ
  lastTick = now;
  if (!clientRef || !clientRef.isReady()) return;
  try {
    const meta = metaStore();
    meta.set('onlineTotalMs', meta.getNum('onlineTotalMs', 0) + elapsed);
  } catch { /* DB lỗi đã được báo ở chỗ khác */ }
}

function start(client) {
  clientRef = client;
  lastTick = Date.now();
  if (timer) return;
  timer = setInterval(tick, TICK_MS);
  timer.unref();
}

/** Gọi trước khi thoát để không mất đoạn cuối. */
function flush() { try { tick(); } catch { /* bỏ qua */ } }

function info(client = clientRef) {
  const meta = metaStore();
  const now = Date.now();
  const ready = Boolean(client && client.isReady());
  const sinceLast = ready ? Math.min(now - lastTick, 5 * TICK_MS) : 0; // phần chưa kịp ghi
  return {
    processMs: Math.floor(process.uptime() * 1000),
    connectedMs: ready ? Math.floor(client.uptime || 0) : 0,
    totalOnlineMs: meta.getNum('onlineTotalMs', 0) + sinceLast,
    firstOnlineAt: meta.getNum('firstOnlineAt', bootAt),
    bootCount: meta.getNum('bootCount', 1),
    lastBootAt: meta.getNum('lastBootAt', bootAt),
    lastDisconnectAt: state.lastDisconnectAt,
    recoveries: state.recoveries
  };
}

/** 90061000 -> "1 ngày 1 giờ 1 phút" */
function formatMs(ms, { seconds = false } = {}) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const parts = [];
  if (d) parts.push(`${d} ngày`);
  if (d || h) parts.push(`${h} giờ`);
  parts.push(`${m} phút`);
  if (seconds && !d) parts.push(`${s} giây`);
  return parts.join(' ');
}

const hours = (ms) => Math.round((ms / 3_600_000) * 10) / 10;

module.exports = { init, start, flush, info, formatMs, hours };