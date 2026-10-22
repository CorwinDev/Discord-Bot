const { MessageType } = require('discord.js');
const { handleBoost } = require('../services/boosterFlow');

const BOOST_TYPES = new Set([
  MessageType.GuildBoost,
  MessageType.GuildBoostTier1,
  MessageType.GuildBoostTier2,
  MessageType.GuildBoostTier3
]);

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    // Chỉ tin nhắn hệ thống "đã boost server" do Discord tạo ra (người dùng không giả được bằng chat thường)
    if (!message.guild || !BOOST_TYPES.has(message.type) || message.author?.bot) return;
    try {
      await handleBoost(message.guild, message.author.id, message.id, 'message', message.channel);
    } catch (err) {
      console.error('⚠️  Lỗi boostDetect:', err);
    }
  }
};
