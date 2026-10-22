const game = require('../games/noitu/engine');

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    if (!message.guild || message.author.bot || !message.content.trim()) return;

    const channel = game.getChannel(message.channelId);
    if (!channel || !channel.word) return;

    const result = game.processMove(message.channelId, message.author.id, message.content);
    if (result.type === 'ignored') return;
    if (result.type === 'error') {
      await message.reply({ content: `❌ ${result.message}`, allowedMentions: { parse: [] } }).catch(() => {});
      return;
    }

    if (result.type === 'bot') {
      await message.reply({ content: `✅ **${result.phrase}**\n🤖 Bot nối: **${result.botWord}**. Tới bạn!`, allowedMentions: { parse: [] } }).catch(() => {});
      return;
    }

    if (result.type === 'win') {
      await message.reply({ content: result.message, allowedMentions: { users: [message.author.id] } }).catch(() => {});
      return;
    }

    await message.react('✅').catch(() => {});
  }
};