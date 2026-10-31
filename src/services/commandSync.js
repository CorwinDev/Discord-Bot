'use strict';

/**
 * Tự đăng ký slash command lên Discord khi bot khởi động, nhưng CHỈ khi danh sách lệnh đã đổi
 * (so bằng mã băm lưu cục bộ). Nhờ vậy lệnh mới như /uptime hiện ra mà không cần nhớ chạy `npm run deploy`,
 * và không gọi API Discord lại ở những lần khởi động sau (Discord giới hạn số lần đăng ký lệnh mỗi ngày).
 *
 * Phạm vi giống src/deploy-commands.js: có GUILD_ID thì đăng ký riêng cho server đó (hiện ngay),
 * không có thì đăng ký toàn cục (Discord có thể mất tới ~1 giờ để hiện).
 * Tắt bằng AUTO_DEPLOY_COMMANDS=false.
 */

const crypto = require('crypto');
const env = require('../config/env');
const config = require('../config/config');

const HASH_KEY = 'commandsHash';

const sha256 = (text) => crypto.createHash('sha256').update(text).digest('hex');

async function syncCommands(client) {
  if (!env.AUTO_DEPLOY_COMMANDS) return { status: 'disabled' };

  const body = [...client.commands.values()].map((c) => c.data.toJSON());
  const guildId = config.guildId;
  const hash = sha256(JSON.stringify({ scope: guildId || 'global', body }));

  const { local } = require('../database/meta'); // bảng backup_state: không bị backup/khôi phục nhầm sang máy khác
  if (local.get(HASH_KEY) === hash) return { status: 'unchanged', count: body.length };

  if (!client.application) throw new Error('client.application chưa sẵn sàng');
  if (guildId) await client.application.commands.set(body, guildId);
  else await client.application.commands.set(body);

  local.set(HASH_KEY, hash);
  console.log(guildId
    ? `✅ Đã tự đăng ký ${body.length} slash command cho server ${guildId} (hiện ngay).`
    : `✅ Đã tự đăng ký ${body.length} slash command toàn cục (Discord có thể mất tới 1 giờ để hiện).`);
  return { status: 'synced', count: body.length };
}

module.exports = { syncCommands };