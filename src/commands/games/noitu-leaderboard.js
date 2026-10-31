const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const game = require('../../games/noitu/engine');

module.exports = {
  group: 'Nối Từ',
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('noitu-leaderboard')
    .setDescription('Xem bảng xếp hạng Nối Từ của server')
    .setDMPermission(false),

  async execute(interaction) {
    const rows = game.getLeaderboard(interaction.guildId);
    const description = rows.length
      ? rows.map((row, index) => `**${index + 1}.** <@${row.userId}> — kỷ lục **${row.bestStreak}** · ${row.totalWords} từ`).join('\n')
      : 'Chưa có dữ liệu. Bắt đầu bằng `/noitu-add` và `/noitu-new` nhé!';
    const embed = new EmbedBuilder().setColor(0x57f287).setTitle('🏆 Nối Từ — Bảng xếp hạng').setDescription(description);
    return interaction.reply({ embeds: [embed], ephemeral: true, allowedMentions: { parse: [] } });
  }
};