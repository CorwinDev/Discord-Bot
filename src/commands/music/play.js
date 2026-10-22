const { SlashCommandBuilder } = require('discord.js');
const { useMainPlayer } = require('discord-player');

module.exports = {
  group: 'Nhạc',
  cooldown: 3,
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Phát nhạc trong kênh voice (từ khoá hoặc link)')
    .addStringOption(opt => opt.setName('query').setDescription('Tên bài hát hoặc link').setRequired(true))
    .setDMPermission(false),

  async execute(interaction) {
    const channel = interaction.member?.voice?.channel;
    if (!channel) {
      return interaction.reply({ content: '❌ Bạn cần vào một kênh voice trước.', ephemeral: true });
    }

    const query = interaction.options.getString('query');
    await interaction.deferReply();

    const player = useMainPlayer();

    try {
      const { track } = await player.play(channel, query, {
        nodeOptions: {
          metadata: { channel: interaction.channel },
          leaveOnEmpty: true,
          leaveOnEmptyCooldown: 60_000,
          leaveOnEnd: true,
          leaveOnEndCooldown: 300_000
        }
      });

      await interaction.editReply(`✅ Đã thêm vào hàng chờ: **${track.title}**`);
    } catch (err) {
      console.error('❌ Lỗi /play:', err);
      await interaction.editReply('❌ Không thể phát bài này. Hãy thử từ khoá hoặc link khác.');
    }
  }
};
