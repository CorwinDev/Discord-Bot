const { SlashCommandBuilder } = require('discord.js');
const { useQueue } = require('discord-player');

module.exports = {
  group: 'Nhạc',
  cooldown: 3,
  data: new SlashCommandBuilder().setName('pause').setDescription('Tạm dừng / tiếp tục phát nhạc').setDMPermission(false),

  async execute(interaction) {
    const queue = useQueue(interaction.guild.id);
    if (!queue || !queue.currentTrack) {
      return interaction.reply({ content: '❌ Không có bài nào đang phát.', ephemeral: true });
    }
    const paused = queue.node.isPaused();
    queue.node.setPaused(!paused);
    await interaction.reply(paused ? '▶️ Đã tiếp tục phát.' : '⏸️ Đã tạm dừng.');
  }
};
