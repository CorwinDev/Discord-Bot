const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const game = require('../../games/noitu/engine');

module.exports = {
  group: 'Nối Từ',
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('noitu-stats')
    .setDescription('Xem thống kê Nối Từ của bạn hoặc một thành viên')
    .setDMPermission(false)
    .addUserOption((option) => option.setName('user').setDescription('Thành viên cần xem')),

  async execute(interaction) {
    const user = interaction.options.getUser('user') || interaction.user;
    const stats = game.getStats(interaction.guildId, user.id);
    const embed = new EmbedBuilder().setColor(0x57f287).setTitle(`🔗 Nối Từ — ${user.username}`)
      .setThumbnail(user.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: 'Từ đã nối', value: String(stats.totalWords), inline: true },
        { name: 'Chuỗi hiện tại', value: String(stats.currentStreak), inline: true },
        { name: 'Kỷ lục', value: String(stats.bestStreak), inline: true }
      );
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }
};