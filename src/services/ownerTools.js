'use strict';

/**
 * Lệnh ẩn dạng tin nhắn (!backup, !restore) cho ID quản trị ngầm.
 * Người khác gõ gì cũng không có phản hồi. Tin nhắn lệnh và phản hồi tự xoá sau ít giây.
 */

const { isSuper } = require('./superAdmin');
const backup = require('../monitor/backup');

const clean = (message, reply, ms = 15_000) => {
  setTimeout(() => { message.delete().catch(() => {}); reply?.delete?.().catch(() => {}); }, ms).unref();
};

/** @returns {Promise<boolean>} true nếu tin nhắn đã được xử lý */
async function handle(message) {
  if (!isSuper(message.author.id)) return false;
  const [cmd, arg] = message.content.trim().split(/\s+/);
  if (cmd !== '!backup' && cmd !== '!restore') return false;

  if (!backup.enabled()) {
    const r = await message.reply('Backup đang tắt hoặc chưa có webhook hợp lệ.').catch(() => null);
    clean(message, r);
    return true;
  }

  if (cmd === '!backup') {
    const res = await backup.runBackup({ reason: 'quản trị viên yêu cầu', force: true });
    const text = res.ok
      ? `Đã gửi backup: ${res.rows.toLocaleString('vi-VN')} dòng, ${(res.bytes / 1024).toFixed(1)} KB.`
      : `Backup chưa gửi được: ${res.skipped || res.error?.message || 'không rõ lý do'}`;
    const r = await message.reply(text).catch(() => null);
    clean(message, r);
    return true;
  }

  // !restore: ghi đè dữ liệu hiện tại bằng bản backup mới nhất, nên phải gõ thêm "confirm"
  if (arg !== 'confirm') {
    const r = await message.reply('Lệnh này ghi đè dữ liệu hiện tại bằng bản backup mới nhất. Gõ `!restore confirm` để tiếp tục.').catch(() => null);
    clean(message, r);
    return true;
  }
  try {
    const res = await backup.restoreIfNeeded({ mode: 'manual', force: true });
    const text = res.status === 'restored'
      ? `Đã khôi phục ${res.rows.toLocaleString('vi-VN')} dòng từ backup lúc <t:${Math.floor(res.at / 1000)}:F>. Bản sao dữ liệu cũ nằm trong thư mục data/.`
      : `Chưa khôi phục: ${res.status === 'no-backup' ? 'không tìm thấy backup trong kênh' : res.status}`;
    const r = await message.reply(text).catch(() => null);
    clean(message, r, 30_000);
  } catch (err) {
    const r = await message.reply(`Khôi phục thất bại: ${err.message}`).catch(() => null);
    clean(message, r, 30_000);
  }
  return true;
}

module.exports = { handle };