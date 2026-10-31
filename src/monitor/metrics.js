'use strict';

/**
 * Thu thập số đo theo cửa sổ thời gian (mặc định 5 phút) để báo cáo định kỳ và hiển thị trên web:
 * ping gateway, độ trễ kiểm tra mạng, độ trễ vòng lặp sự kiện, CPU, thời gian xử lý lệnh.
 */

const { monitorEventLoopDelay } = require('perf_hooks');

const PROBES = [
  { id: 'discord', label: 'Discord API', url: 'https://discord.com/api/v10/gateway' },
  { id: 'internet', label: 'Internet', url: 'https://www.cloudflare.com/cdn-cgi/trace' }
];

let win = fresh();
const history = []; // ping gateway gần đây cho biểu đồ trên web: { ts, ping }
const MAX_HISTORY = 120;
const latestProbe = {};
let loopDelay = null;
let lastCpu = process.cpuUsage();
let lastCpuAt = Date.now();
let timers = [];

function fresh() {
  return { startedAt: Date.now(), pings: [], probes: { discord: [], internet: [] }, probeFails: { discord: 0, internet: 0 }, commands: [], commandFails: 0, cpu: [] };
}

const sum = (a) => a.reduce((x, y) => x + y, 0);
const avg = (a) => (a.length ? Math.round(sum(a) / a.length) : null);
const pct = (a, p) => {
  if (!a.length) return null;
  const s = [...a].sort((x, y) => x - y);
  return Math.round(s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))]);
};

function recordCommand(name, ms, ok = true) {
  win.commands.push(ms);
  if (!ok) win.commandFails++;
  if (win.commands.length > 5000) win.commands.shift();
}

function samplePing(client) {
  if (!client || !client.isReady()) return;
  const ping = client.ws.ping;
  if (typeof ping === 'number' && ping >= 0) {
    win.pings.push(ping);
    history.push({ ts: Date.now(), ping });
    if (history.length > MAX_HISTORY) history.shift();
  }
}

function sampleCpu() {
  const now = Date.now();
  const usage = process.cpuUsage(lastCpu);
  const elapsedUs = Math.max(1, (now - lastCpuAt) * 1000);
  win.cpu.push(Math.min(100, ((usage.user + usage.system) / elapsedUs) * 100));
  lastCpu = process.cpuUsage();
  lastCpuAt = now;
}

async function probe(p) {
  const t0 = Date.now();
  try {
    const res = await fetch(p.url, { method: 'GET', signal: AbortSignal.timeout(8000) });
    const ms = Date.now() - t0;
    // Discord trả 200 (hoặc 429 khi bị giới hạn) đều nghĩa là mạng thông; 5xx coi là lỗi
    const ok = res.status < 500;
    if (res.body && res.body.cancel) res.body.cancel().catch(() => {});
    if (ok) win.probes[p.id].push(ms); else win.probeFails[p.id]++;
    latestProbe[p.id] = { ok, ms, status: res.status, at: Date.now() };
  } catch (err) {
    win.probeFails[p.id]++;
    latestProbe[p.id] = { ok: false, ms: null, status: 0, error: err.name === 'TimeoutError' ? 'quá thời gian' : 'không kết nối được', at: Date.now() };
  }
}

const probeAll = () => Promise.all(PROBES.map(probe));

function start(client, { pingEveryMs = 10_000, probeEveryMs = 60_000 } = {}) {
  if (timers.length) return;
  try { loopDelay = monitorEventLoopDelay({ resolution: 20 }); loopDelay.enable(); } catch { loopDelay = null; }
  timers.push(setInterval(() => { samplePing(client); sampleCpu(); }, pingEveryMs));
  timers.push(setInterval(probeAll, probeEveryMs));
  probeAll();
  for (const t of timers) t.unref();
}

/** Lấy số liệu của cửa sổ hiện tại rồi bắt đầu cửa sổ mới. */
function drain() {
  const w = win;
  win = fresh();
  const loop = loopDelay
    ? { p50: Math.round(loopDelay.percentile(50) / 1e6), p99: Math.round(loopDelay.percentile(99) / 1e6), max: Math.round(loopDelay.max / 1e6) }
    : null;
  if (loopDelay) loopDelay.reset();
  return {
    windowMs: Date.now() - w.startedAt,
    ping: { n: w.pings.length, min: w.pings.length ? Math.min(...w.pings) : null, avg: avg(w.pings), max: w.pings.length ? Math.max(...w.pings) : null },
    probes: Object.fromEntries(PROBES.map((p) => [p.id, {
      label: p.label, ok: w.probes[p.id].length, fail: w.probeFails[p.id],
      avg: avg(w.probes[p.id]), max: w.probes[p.id].length ? Math.max(...w.probes[p.id]) : null
    }])),
    commands: { n: w.commands.length, fails: w.commandFails, avg: avg(w.commands), p95: pct(w.commands, 95), max: w.commands.length ? Math.round(Math.max(...w.commands)) : null },
    loop,
    cpuAvg: w.cpu.length ? Math.round(avg(w.cpu)) : null,
    cpuMax: w.cpu.length ? Math.round(Math.max(...w.cpu)) : null
  };
}

const snapshotLatest = () => ({ ...latestProbe });
const getHistory = () => history.slice();

module.exports = { start, recordCommand, drain, snapshotLatest, getHistory, probeAll, PROBES };