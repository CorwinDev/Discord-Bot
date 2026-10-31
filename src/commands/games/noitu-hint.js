const { SlashCommandBuilder } = require('discord.js');
const game = require('../../games/noitu/engine');

module.exports = {
  group: 'Nối Từ',
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('noitu-hint')
    .setDescription('Gợi ý một vài từ có thể nối tiếp')
    .setDMPermission(false),

  async execute(interaction) {
    const hints = game.getHints(interaction.channelId);
    if (!hints.length) return interaction.reply({ content: 'Kênh chưa có ván Nối Từ đang chạy.', ephemeral: true });
    return interaction.reply({ content: `💡 Có thể nối bằng: ${hints.map((word) => `**${word}**`).join(' · ')}`, ephemeral: true });
  }
};