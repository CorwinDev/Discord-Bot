const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../config/config');

module.exports = {
  group: 'Quản trị',
  cooldown: 3,
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick một thành viên khỏi server')
    .addUserOption(opt => opt.setName('user').setDescription('Thành viên cần kick').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Lý do'))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .setDMPermission(false),

  async execute(interaction) {
    const target = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'Không có lý do';
    const member = await interaction.guild.members.fetch(target.id).catch(() => null);

    if (!member) {
      return interaction.reply({ content: '❌ Không tìm thấy thành viên này trong server.', ephemeral: true });
    }
    if (!member.kickable) {
      return interaction.reply({ content: '❌ Tôi không có quyền kick thành viên này (role cao hơn hoặc bằng bot).', ephemeral: true });
    }
    if (member.id === interaction.user.id) {
      return interaction.reply({ content: '❌ Bạn không thể tự kick chính mình.', ephemeral: true });
    }

    await member.kick(reason);
    require('../../database/management').addCase(interaction.guild.id, member.id, interaction.user.id, 'kick', reason);

    const embed = new EmbedBuilder()
      .setColor(config.colors.warning)
      .setTitle('👢 Đã kick thành viên')
      .addFields(
        { name: 'Thành viên', value: `${target.tag} (${target.id})` },
        { name: 'Người thực hiện', value: interaction.user.tag },
        { name: 'Lý do', value: reason }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
