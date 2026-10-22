const { SlashCommandBuilder } = require('discord.js');
const { useQueue } = require('discord-player');

module.exports = {
  group: 'Nhạc',
  cooldown: 3,
  data: new SlashCommandBuilder().setName('stop').setDescription('Dừng phát và xoá hàng chờ').setDMPermission(false),

  async execute(interaction) {
    const queue = useQueue(interaction.guild.id);
    if (!queue) {
      return interaction.reply({ content: '❌ Bot không đang phát nhạc.', ephemeral: true });
    }
    queue.delete();
    await interaction.reply('⏹️ Đã dừng phát và rời kênh voice.');
  }
};
