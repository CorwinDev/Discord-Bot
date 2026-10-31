const { SlashCommandBuilder } = require('discord.js');
const game = require('../../games/noitu/engine');

module.exports = {
  group: 'Nối Từ',
  cooldown: 3,
  data: new SlashCommandBuilder()
    .setName('noitu-new')
    .setDescription('Bắt đầu hoặc reset ván Nối Từ trong kênh hiện tại')
    .setDMPermission(false),

  async execute(interaction) {
    if (!game.getChannel(interaction.channelId)) {
      return interaction.reply({ content: 'Kênh này chưa bật Nối Từ. Quản trị viên dùng `/noitu-add` để bật.', ephemeral: true });
    }
    const word = game.startGame(interaction.channelId);
    if (!word) return interaction.reply({ content: 'Không tìm được từ mở màn phù hợp. Thử lại sau nhé.', ephemeral: true });
    return interaction.reply({ content: `🎮 Ván Nối Từ mới bắt đầu!\nTừ mở màn: **${word}**\nHãy nối tiếp bằng một cụm 2 tiếng bắt đầu bằng **${word.split(' ').at(-1)}**.` });
  }
};