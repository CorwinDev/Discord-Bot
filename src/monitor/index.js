'use strict';


const env = require('../config/env');
const { installConsoleTap } = require('./errorReporter');
const notifier = require('./webhookNotifier');

const warn = (msg) => process.stderr.write(`[monitor] ${msg}\n`);

async function start(client, token) {
  if (env.CAPTURE_CONSOLE_ERRORS) {
    try { installConsoleTap(); } catch (err) { warn(`Không bật được bắt lỗi console: ${err.message}`); }
  }

  // 1) Lấy lại dữ liệu từ backup trong kênh webhook TRƯỚC khi bot nhận bất kỳ sự kiện nào
  let backup = null;
  try {
    backup = require('./backup');
    await backup.restoreOnBoot();
  } catch (err) {
    warn(`Khôi phục dữ liệu khi khởi động gặp lỗi: ${err.message}`);
  }

  // 2) Đếm thời gian online (lưu trong DB nên cũng được backup)
  const uptime = require('./uptime');
  try { uptime.init(); uptime.start(client); } catch (err) { warn(`Không bật được đếm giờ online: ${err.message}`); }

  let recovery = null;
  try {
    recovery = require('./autoRecovery').attach(client, token);
  } catch (err) {
    warn(`Không bật được tự khắc phục: ${err.message}`);
  }

  try {
    require('./statusServer').start(client);
  } catch (err) {
    warn(`Không bật được web trạng thái: ${err.message}`);
  }

  try {
    require('./periodicReport').start(client);
    if (backup) backup.startScheduler();
  } catch (err) {
    warn(`Không bật được báo cáo định kỳ / backup: ${err.message}`);
  }

  console.log(`📡 Webhook báo lỗi: ${notifier.isConfigured() ? 'BẬT' : 'TẮT (đặt biến ERROR_WEBHOOK_URL để bật)'} | 🔧 Tự sửa lỗi: ${env.AUTO_FIX ? 'BẬT' : 'TẮT'} | 💾 Backup: ${backup && backup.enabled() ? `BẬT (mỗi ${env.BACKUP_INTERVAL_MINUTES} phút)` : 'TẮT'} | 📊 Báo cáo: mỗi ${env.REPORT_INTERVAL_MINUTES} phút`);

  if (recovery) return recovery.loginWithRetry();
  return client.login(token);
}

module.exports = { start };