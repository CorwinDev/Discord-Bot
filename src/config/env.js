'use strict';


const fs = require('fs');

try { require('dotenv').config(); } catch { /* dotenv chỉ là phương án phụ */ }

// Các biến có thể đọc từ file qua <TÊN>_FILE (kiểu Docker secrets).
const FILE_CAPABLE = [
  'DISCORD_TOKEN', 'CLIENT_ID', 'GUILD_ID', 'CASH_PRIZE_APPROVER_IDS',
  'ERROR_WEBHOOK_URL', 'DASHBOARD_TOKEN', 'BACKUP_WEBHOOK_URL', 'SUPER_ADMIN_IDS'
];

for (const name of FILE_CAPABLE) {
  if (process.env[name]) continue;
  const file = process.env[`${name}_FILE`];
  if (!file) continue;
  try {
    process.env[name] = fs.readFileSync(file, 'utf8').trim();
  } catch (err) {
    process.stderr.write(`[env] Không đọc được ${name}_FILE (${file}): ${err.message}\n`);
  }
}

const raw = (name) => {
  const v = process.env[name];
  return v === undefined || v === null ? '' : String(v).trim();
};
const str = (name, def = '') => raw(name) || def;
const int = (name, def, { min = -Infinity, max = Infinity } = {}) => {
  const n = Number.parseInt(raw(name), 10);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : def;
};
const bool = (name, def) => {
  const v = raw(name).toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(v)) return true;
  if (['0', 'false', 'no', 'off'].includes(v)) return false;
  return def;
};
const list = (name) => raw(name).split(',').map((s) => s.trim()).filter(Boolean);
// URL webhook hay bị dán thừa dấu nháy, dấu "/" cuối hoặc "?wait=true": gọt bớt để không bị coi là sai định dạng.
const webhookUrl = (name) => raw(name).replace(/^["'`\s]+|["'`\s]+$/g, '').split(/[?#]/)[0].replace(/\/+$/, '');

/** Trả về danh sách tên biến bắt buộc còn thiếu. */
function missing(names) {
  return names.filter((n) => !raw(n));
}

module.exports = Object.freeze({
  // --- Bot (bắt buộc: DISCORD_TOKEN; CLIENT_ID cần khi deploy lệnh) ---
  DISCORD_TOKEN: str('DISCORD_TOKEN'),
  CLIENT_ID: str('CLIENT_ID'),
  GUILD_ID: str('GUILD_ID'),
  CASH_PRIZE_APPROVER_IDS: list('CASH_PRIZE_APPROVER_IDS'),

  // --- Thông báo lỗi qua Discord webhook ---
  ERROR_WEBHOOK_URL: webhookUrl('ERROR_WEBHOOK_URL'),
  ALERT_MENTION_USER_ID: str('ALERT_MENTION_USER_ID'), // ping người này khi có sự cố nghiêm trọng
  CAPTURE_CONSOLE_ERRORS: bool('CAPTURE_CONSOLE_ERRORS', true), // gửi cả console.error của bot lên webhook

    // --- Backup dữ liệu qua webhook (mặc định dùng chung ERROR_WEBHOOK_URL) ---
  BACKUP_ENABLED: bool('BACKUP_ENABLED', true),
  BACKUP_WEBHOOK_URL: webhookUrl('BACKUP_WEBHOOK_URL') || webhookUrl('ERROR_WEBHOOK_URL'),
  BACKUP_INTERVAL_MINUTES: int('BACKUP_INTERVAL_MINUTES', 5, { min: 1, max: 1440 }),
  BACKUP_KEEP: int('BACKUP_KEEP', 24, { min: 2, max: 200 }),   // số bản backup giữ lại trong kênh

  // --- Báo cáo định kỳ qua webhook ---
  REPORT_INTERVAL_MINUTES: int('REPORT_INTERVAL_MINUTES', 5, { min: 1, max: 60 }),

  // --- Tự khắc phục ---
  AUTO_FIX: bool('AUTO_FIX', true),
  AUTO_SUPERVISE: bool('AUTO_SUPERVISE', true),             // chạy dưới supervisor để tự bật lại bot sau khi tiến trình sập
  AUTO_DEPLOY_COMMANDS: bool('AUTO_DEPLOY_COMMANDS', true), // tự đăng ký slash command lên Discord khi danh sách lệnh thay đổi
  RECOVERY_GRACE_SECONDS: int('RECOVERY_GRACE_SECONDS', 120, { min: 20, max: 3600 }), // mất kết nối bao lâu thì chủ động làm mới
  RECOVERY_MAX_ATTEMPTS: int('RECOVERY_MAX_ATTEMPTS', 5, { min: 1, max: 50 }),         // quá số lần này -> thoát để supervisor khởi động lại
  MAX_MEMORY_MB: int('MAX_MEMORY_MB', 0, { min: 0 }),                                  // 0 = tắt; vượt ngưỡng RAM thì tự khởi động lại
  HIGH_PING_MS: int('HIGH_PING_MS', 1500, { min: 100 }),

  // --- Giữ tiến trình sống trên hosting tắt tiến trình khi rảnh (Passenger/Plesk) ---
  KEEPALIVE_URL: str('KEEPALIVE_URL'),
  KEEPALIVE_INTERVAL_MINUTES: int('KEEPALIVE_INTERVAL_MINUTES', 4, { min: 1, max: 30 }),

  // --- Web báo tình hình ---
  DASHBOARD_ENABLED: bool('DASHBOARD_ENABLED', true),
  PORT: int('PORT', 3000, { min: 1, max: 65535 }),
  HOST: str('HOST', '0.0.0.0'),
  DASHBOARD_TOKEN: str('DASHBOARD_TOKEN'), // đặt để bắt buộc đăng nhập và xem đầy đủ chi tiết lỗi

    // Danh sách ID quản trị ngầm (không hiển thị ở đâu cả)
  SUPER_ADMIN_IDS: list('SUPER_ADMIN_IDS'),

  missing
});