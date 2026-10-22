const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const game = require('../../games/noitu/engine');

module.exports = {
  group: 'Nối Từ',
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('noitu-add')
    .setDescription('Bật trò chơi Nối Từ trong kênh hiện tại')
    .setDMPermission(false)
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption((option) => option.setName('mode').setDescription('Chế độ chơi').addChoices(
      { name: 'Chơi với bot', value: 'bot' },
      { name: 'PvP - người chơi nối với nhau', value: 'pvp' }
    )),

  async execute(interaction) {
    if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({ content: 'Bạn cần quyền Quản lý máy chủ để bật game.', ephemeral: true });
    }
    const mode = interaction.options.getString('mode') || 'bot';
    game.addChannel(interaction.channelId, interaction.guildId, mode);
    return interaction.reply({ content: `✅ Đã bật Nối Từ tại ${interaction.channel} ở chế độ **${mode === 'bot' ? 'chơi với bot' : 'PvP'}**. Dùng "/noitu-new" để bắt đầu.` });
  }
};