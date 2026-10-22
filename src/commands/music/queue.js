const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { useQueue } = require('discord-player');
const config = require('../../config/config');

module.exports = {
  group: 'Nhạc',
  cooldown: 3,
  data: new SlashCommandBuilder().setName('queue').setDescription('Xem hàng chờ phát nhạc').setDMPermission(false),

  async execute(interaction) {
    const queue = useQueue(interaction.guild.id);
    if (!queue || !queue.currentTrack) {
      return interaction.reply({ content: '❌ Không có bài nào đang phát.', ephemeral: true });
    }

    const upcoming = queue.tracks.toArray().slice(0, 10)
      .map((t, i) => `${i + 1}. ${t.title}`)
      .join('\n') || 'Không có bài nào tiếp theo.';

    const embed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle('🎶 Hàng chờ phát nhạc')
      .addFields(
        { name: 'Đang phát', value: queue.currentTrack.title },
        { name: 'Tiếp theo', value: upcoming }
      );

    await interaction.reply({ embeds: [embed] });
  }
};
