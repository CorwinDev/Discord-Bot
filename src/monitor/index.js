'use strict';

/**
 * Khởi động toàn bộ phần giám sát. Nguyên tắc: MỖI KHỐI CHẠY ĐỘC LẬP.
 * Một khối lỗi (webhook, backup, web...) chỉ bị báo lại và bỏ qua, không bao giờ làm các khối khác
 * hoặc chính con bot ngừng chạy. Web trạng thái được bật TRƯỚC mọi việc cần mạng/webhook,
 * nên luôn mở được kể cả khi webhook hoặc backup đang lỗi.
 */

const env = require('../config/env');

const RESTORE_TIMEOUT_MS = 60_000; // đọc backup quá lâu thì cứ để bot đăng nhập, việc khôi phục vẫn tiếp tục chạy nền

const warn = (msg) => process.stderr.write(`[monitor] ${msg}\n`);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** require nhưng không ném lỗi: trả về null và ghi log nếu module hỏng/thiếu. */
function load(name) {
  try { return require(name); } catch (err) {
    warn(`Không nạp được ${name}: ${err.message}`);
    return null;
  }
}

async function start(client, token) {
  const { addIncident } = require('./healthState');
  const notifier = load('./webhookNotifier');
  const errorReporter = load('./errorReporter');

  if (errorReporter && env.CAPTURE_CONSOLE_ERRORS) {
    try { errorReporter.installConsoleTap(); } catch (err) { warn(`Không bật được bắt lỗi console: ${err.message}`); }
  }

  // 1) Web trạng thái: bật đầu tiên, không phụ thuộc webhook / backup / mạng.
  try {
    const web = load('./statusServer');
    if (web) web.start(client);
  } catch (err) {
    warn(`Không bật được web trạng thái: ${err.message}`);
  }

  // 2) Đếm giờ online (lưu trong DB nên cũng được backup).
  try {
    const uptime = require('./uptime');
    uptime.init();
    uptime.start(client);
  } catch (err) {
    warn(`Không bật được đếm giờ online: ${err.message}`);
  }

  // 3) Lấy lại dữ liệu từ backup trong kênh webhook TRƯỚC khi bot nhận sự kiện, nhưng không chờ vô hạn.
  const backup = load('./backup');
  if (backup) {
    try {
      const restoring = Promise.resolve(backup.restoreOnBoot());
      restoring.catch((err) => warn(`Khôi phục dữ liệu khi khởi động gặp lỗi: ${err.message}`));
      const outcome = await Promise.race([restoring.then(() => 'done', () => 'failed'), sleep(RESTORE_TIMEOUT_MS).then(() => 'timeout')]);
      if (outcome === 'timeout') {
        warn(`Đọc backup quá ${RESTORE_TIMEOUT_MS / 1000} giây, bot vẫn đăng nhập; việc khôi phục tiếp tục chạy nền.`);
        addIncident({ level: 'warn', type: 'backup', isPublic: false, message: 'Đọc backup khi khởi động quá lâu, bot đăng nhập trước' });
      }
    } catch (err) {
      warn(`Khôi phục dữ liệu khi khởi động gặp lỗi: ${err.message}`);
    }
  }

  // 4) Tự khắc phục kết nối (reconnect, đăng nhập lại, thoát để supervisor chạy lại).
  let recovery = null;
  try {
    recovery = require('./autoRecovery').attach(client, token);
  } catch (err) {
    warn(`Không bật được tự khắc phục: ${err.message}`);
  }

  // 5) Báo cáo định kỳ + backup định kỳ.
  try { require('./periodicReport').start(client); } catch (err) { warn(`Không bật được báo cáo định kỳ: ${err.message}`); }
  try { if (backup) backup.startScheduler(); } catch (err) { warn(`Không bật được backup định kỳ: ${err.message}`); }

  // 6) Tự ping web của mình để hosting không tắt tiến trình lúc rảnh (chỉ khi đặt KEEPALIVE_URL).
  try { require('../services/keepAlive').start(); } catch (err) { warn(`Không bật được keep-alive: ${err.message}`); }

  const configured = notifier && notifier.isConfigured();
  const problem = notifier && notifier.configProblem();
  console.log(`📡 Webhook báo lỗi: ${configured ? `BẬT (báo cáo mỗi ${env.REPORT_INTERVAL_MINUTES} phút)` : `TẮT (${problem || 'không nạp được module webhook'})`} | 🔧 Tự sửa lỗi: ${env.AUTO_FIX ? 'BẬT' : 'TẮT'} | 💾 Backup: ${backup && backup.enabled() ? `BẬT (mỗi ${env.BACKUP_INTERVAL_MINUTES} phút)` : 'TẮT'} | 🌐 Web: ${env.DASHBOARD_ENABLED ? `cổng ${env.PORT}` : 'TẮT'}`);

  if (recovery) return recovery.loginWithRetry();
  return client.login(token);
}

module.exports = { start };