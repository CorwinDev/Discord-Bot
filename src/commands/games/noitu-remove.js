const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const game = require('../../games/noitu/engine');

module.exports = {
  group: 'Nối Từ',
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('noitu-remove')
    .setDescription('Tắt trò chơi Nối Từ trong kênh hiện tại')
    .setDMPermission(false)
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({ content: 'Bạn cần quyền Quản lý máy chủ để tắt game.', ephemeral: true });
    }
    if (!game.removeChannel(interaction.channelId)) {
      return interaction.reply({ content: 'ℹ️ Kênh này chưa bật Nối Từ.', ephemeral: true });
    }
    return interaction.reply({ content: '✅ Đã tắt Nối Từ trong kênh này.' });
  }
};