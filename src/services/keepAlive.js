'use strict';

/**
 * Giữ tiến trình sống trên hosting kiểu Passenger (Plesk, cPanel...): các hosting này tắt tiến trình khi không có
 * request nào trong vài phút, kéo theo bot Discord offline. Bot tự gọi /health của chính URL công khai của mình
 * mỗi KEEPALIVE_INTERVAL_MINUTES phút để hosting coi như vẫn có người truy cập.
 *
 * Bật khi đặt KEEPALIVE_URL (ví dụ https://gzw.hqmt.io.vn). Để trống thì không làm gì.
 * Lưu ý: nếu tiến trình đã bị tắt từ trước thì cần 1 lượt truy cập đầu tiên (mở web, hoặc dịch vụ ping ngoài
 * như UptimeRobot) để bật lại; sau đó bot tự giữ mình.
 */

const env = require('../config/env');

const log = (msg) => process.stderr.write(`[keepalive] ${msg}\n`);
let timer = null;
let fails = 0;

async function ping(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15_000), headers: { 'User-Agent': 'gzw-keepalive' } });
    if (res.body && res.body.cancel) res.body.cancel().catch(() => {});
    if (fails >= 3) log('Đã ping lại được.');
    fails = 0;
  } catch (err) {
    fails++;
    if (fails === 3) log(`Không ping được ${url}: ${err.name === 'TimeoutError' ? 'quá thời gian' : err.message}. Kiểm tra KEEPALIVE_URL.`);
  }
}

function start() {
  if (timer || !env.KEEPALIVE_URL) return false;
  if (!/^https?:\/\//i.test(env.KEEPALIVE_URL)) {
    log('KEEPALIVE_URL phải bắt đầu bằng http:// hoặc https://, bỏ qua.');
    return false;
  }
  const url = `${env.KEEPALIVE_URL.replace(/\/+$/, '')}/health`;
  timer = setInterval(() => ping(url), env.KEEPALIVE_INTERVAL_MINUTES * 60_000);
  timer.unref();
  setTimeout(() => ping(url), 30_000).unref();
  log(`Bật, ping ${url} mỗi ${env.KEEPALIVE_INTERVAL_MINUTES} phút.`);
  return true;
}

module.exports = { start };