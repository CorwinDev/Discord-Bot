const { ActivityType } = require('discord.js');
const { abortStaleMatches } = require('../database/games');
const giveaways = require('../services/giveaways');
const { startBirthdayScheduler } = require('../services/birthdays');
const { runChecks, format } = require('../services/serverCheck');
const { logToStaff } = require('../services/modTools');

module.exports = {
  name: 'clientReady',
  once: true,
  execute(client) {
    console.log(`✅ Bot đã đăng nhập thành công: ${client.user.tag}`);
    const aborted = abortStaleMatches();
    if (aborted) console.log(`ℹ️  Đã huỷ ${aborted} trận dang dở từ lần chạy trước (không thưởng).`);
    giveaways.startScheduler(client);
    startBirthdayScheduler(client);
    // Kiểm tra cấu hình khi khởi động (không chặn bot nếu lỗi)
    for (const guild of client.guilds.cache.values()) {
      try {
        const issues = runChecks(guild).filter((x) => x.level !== 'ok');
        if (issues.length) {
          console.log(`⚠️  [${guild.name}] cấu hình cần chú ý:\n${format(issues)}`);
          logToStaff(guild, { content: `🛡️ **Kiểm tra cấu hình khi khởi động**\n${format(issues)}` });
        }
      } catch (err) { console.error('⚠️  Lỗi kiểm tra cấu hình:', err.message); }
    }
    client.user.setPresence({
      activities: [{ name: `${client.commands.size} lệnh | /help`, type: ActivityType.Watching }],
      status: 'online'
    });
  }
};
