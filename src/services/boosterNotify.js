const db = require('../database/db');

/** Gửi tin vào kênh log của server (nếu đã cấu hình bằng guild_settings.logChannelId). */
function notifyStaffLog(guild, content) {
  const row = db.prepare('SELECT logChannelId FROM guild_settings WHERE guildId = ?').get(guild.id);
  const ch = row?.logChannelId && guild.channels.cache.get(row.logChannelId);
  return ch ? ch.send({ content, allowedMentions: { parse: [] } }).catch(() => {}) : Promise.resolve();
}
module.exports = { notifyStaffLog };
