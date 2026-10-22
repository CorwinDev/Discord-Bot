require('dotenv').config();

module.exports = {
  token: process.env.DISCORD_TOKEN,
  clientId: process.env.CLIENT_ID,
  guildId: process.env.GUILD_ID || null, // nếu có -> deploy slash command nhanh cho 1 server (dev); null -> global

  prefix: '!', // chỉ dùng cho vài lệnh phụ nếu cần, chính vẫn là slash command

  colors: {
    primary: 0x5865f2,
    success: 0x57f287,
    warning: 0xfee75c,
    danger: 0xed4245
  },

  welcome: {
    enabled: true,
    channelName: 'welcome',
    autoRoleName: null // đặt tên role muốn tự gán khi có thành viên mới, null = tắt
  },

  leveling: {
    enabled: true,
    xpPerMessage: [15, 25], // random min-max
    cooldownSeconds: 60
  },

  automod: {
    enabled: true,
    maxMentions: 5,
    maxMessagesPerInterval: 6,
    intervalMs: 7000,
    bannedWords: [],
    blockInvites: true,          // chặn link mời sang server khác (người có ManageMessages được miễn)
    strikesBeforeTimeout: 3,     // vi phạm bao nhiêu lần trong cửa sổ thì timeout
    strikeWindowMs: 10 * 60000,
    timeoutMinutes: 10
  },
  raid: { joins: 8, windowMs: 30000, cooldownMs: 5 * 60000, newAccountDays: 7 }
};
