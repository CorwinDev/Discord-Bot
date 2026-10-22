const db = require('../database/db');
const gzw = require('../config/gzw');

/** Chúc mừng sinh nhật mỗi ngày (UTC+7), mỗi người chỉ một lần/năm. Quét mỗi 30 phút nên bot tắt/mở lại không bỏ sót. */
function startBirthdayScheduler(client) {
  const tick = async () => {
    const now = new Date(Date.now() + gzw.utcOffsetHours * 3600000);
    const [day, month, year] = [now.getUTCDate(), now.getUTCMonth() + 1, now.getUTCFullYear()];
    const rows = db.prepare('SELECT * FROM birthdays WHERE day = ? AND month = ? AND lastAnnouncedYear < ?').all(day, month, year);
    for (const r of rows) {
      const guild = client.guilds.cache.get(r.guildId);
      if (!guild) continue;
      const ch = guild.channels.cache.find((c) => c.name === gzw.community.birthdayChannelName && c.isTextBased()) || guild.systemChannel;
      const member = await guild.members.fetch(r.userId).catch(() => null);
      if (!member) { db.prepare('DELETE FROM birthdays WHERE guildId = ? AND userId = ?').run(r.guildId, r.userId); continue; }
      if (ch) await ch.send({ content: `🎂 Chúc mừng sinh nhật ${member}! Cả server chúc bạn một ngày thật vui 🎉`, allowedMentions: { users: [member.id] } }).catch(() => {});
      db.prepare('UPDATE birthdays SET lastAnnouncedYear = ? WHERE guildId = ? AND userId = ?').run(year, r.guildId, r.userId);
    }
  };
  tick().catch((e) => console.error('⚠️  birthday tick:', e));
  return setInterval(() => tick().catch((e) => console.error('⚠️  birthday tick:', e)), 30 * 60000);
}

module.exports = { startBirthdayScheduler };
