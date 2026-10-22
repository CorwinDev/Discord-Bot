const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const game = require('../../games/noitu/engine');

module.exports = {
  group: 'Nối Từ',
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('noitu-mode')
    .setDescription('Đổi chế độ Nối Từ trong kênh hiện tại')
    .setDMPermission(false)
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption((option) => option.setName('mode').setDescription('Chế độ mới').setRequired(true).addChoices(
      { name: 'Chơi với bot', value: 'bot' },
      { name: 'PvP - người chơi nối với nhau', value: 'pvp' }
    )),

  async execute(interaction) {
    if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({ content: 'Bạn cần quyền Quản lý máy chủ để đổi chế độ.', ephemeral: true });
    }
    const mode = interaction.options.getString('mode');
    if (!game.setMode(interaction.channelId, mode)) {
      return interaction.reply({ content: 'Kênh này chưa bật Nối Từ. Dùng `/noitu-add` trước nhé.', ephemeral: true });
    }
    return interaction.reply({ content: `✅ Đã chuyển sang chế độ **${mode === 'bot' ? 'chơi với bot' : 'PvP'}**. Ván cũ đã kết thúc; dùng "/noitu-new" để chơi tiếp.` });
  }
};