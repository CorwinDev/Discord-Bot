'use strict';


const { spawn } = require('child_process');
const path = require('path');
const env = require('./config/env');
const notifier = require('./monitor/webhookNotifier');

const EXIT_CONFIG = 78;
const log = (msg) => console.log(`[supervisor] ${msg}`);

let restarts = 0;
let stopping = false;
let child = null;
const crashTimes = [];

function delayFor() {
  const now = Date.now();
  while (crashTimes.length && now - crashTimes[0] > 2 * 60_000) crashTimes.shift();
  if (crashTimes.length >= 5) return 60_000; // chết liên tục: chờ lâu hơn
  return Math.min(30_000, 2000 * 2 ** Math.max(0, crashTimes.length - 1));
}

function run() {
  const startedAt = Date.now();
  child = spawn(process.execPath, [path.join(__dirname, 'index.js')], {
    stdio: 'inherit',
    env: { ...process.env, SUPERVISOR_RESTARTS: String(restarts) }
  });

  child.on('error', (err) => log(`Không chạy được bot: ${err.message}`));

  child.on('exit', async (code, signal) => {
    child = null;
    if (stopping || code === 0) {
      log('Bot đã dừng, supervisor dừng theo.');
      await notifier.flush(3000);
      process.exit(code ?? 0);
    }
    if (code === EXIT_CONFIG) {
      log('Bot dừng do lỗi cấu hình. Sửa xong rồi chạy lại, supervisor không tự khởi động lại.');
      await notifier.flush(3000);
      process.exit(EXIT_CONFIG);
    }

    if (Date.now() - startedAt > 5 * 60_000) crashTimes.length = 0; // chạy ổn định đủ lâu thì coi như hết chuỗi lỗi
    crashTimes.push(Date.now());
    const wait = delayFor();
    restarts++;

    const reason = signal ? `tín hiệu ${signal}` : `mã thoát ${code}`;
    log(`Bot dừng bất thường (${reason}). Chạy lại sau ${Math.round(wait / 1000)} giây (lần ${restarts}).`);
    notifier.notify({
      level: 'error',
      title: '💀 Tiến trình bot đã dừng bất thường',
      description: `Nguyên nhân: **${reason}**.\nSupervisor sẽ chạy lại sau **${Math.round(wait / 1000)} giây** (lần khởi động lại thứ ${restarts}).`,
      dedupeMs: 0,
      ping: true
    });
    setTimeout(run, wait);
  });
}

function stop(signal) {
  if (stopping) return;
  stopping = true;
  log(`Nhận ${signal}, đang tắt bot…`);
  if (!child) return process.exit(0);
  child.kill(signal);
  setTimeout(() => { if (child) child.kill('SIGKILL'); }, 10_000).unref();
}
process.on('SIGINT', () => stop('SIGINT'));
process.on('SIGTERM', () => stop('SIGTERM'));

if (!env.DISCORD_TOKEN) {
  console.error('❌ Thiếu biến môi trường DISCORD_TOKEN. Hãy đặt biến này ở nơi chạy bot (Secrets/Variables), xem README.');
  process.exit(EXIT_CONFIG);
}

log('Supervisor đã bật.');
run();