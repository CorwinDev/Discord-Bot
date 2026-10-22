const { SlashCommandBuilder } = require('discord.js');
const { useQueue } = require('discord-player');

module.exports = {
  group: 'Nhạc',
  cooldown: 3,
  data: new SlashCommandBuilder().setName('skip').setDescription('Bỏ qua bài hiện tại').setDMPermission(false),

  async execute(interaction) {
    const queue = useQueue(interaction.guild.id);
    if (!queue || !queue.currentTrack) {
      return interaction.reply({ content: '❌ Không có bài nào đang phát.', ephemeral: true });
    }
    const title = queue.currentTrack.title;
    queue.node.skip();
    await interaction.reply(`⏭️ Đã bỏ qua: **${title}**`);
  }
};
