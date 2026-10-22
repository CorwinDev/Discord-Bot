const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../config/config');

module.exports = {
  group: 'Quản trị',
  cooldown: 3,
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban một thành viên khỏi server')
    .addUserOption(opt => opt.setName('user').setDescription('Thành viên cần ban').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Lý do'))
    .addIntegerOption(opt =>
      opt.setName('delete_days').setDescription('Xoá tin nhắn trong bao nhiêu ngày gần nhất (0-7)').setMinValue(0).setMaxValue(7)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .setDMPermission(false),

  async execute(interaction) {
    const target = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'Không có lý do';
    const deleteDays = interaction.options.getInteger('delete_days') || 0;

    const member = await interaction.guild.members.fetch(target.id).catch(() => null);
    if (member && !member.bannable) {
      return interaction.reply({ content: '❌ Tôi không có quyền ban thành viên này.', ephemeral: true });
    }
    if (target.id === interaction.user.id) {
      return interaction.reply({ content: '❌ Bạn không thể tự ban chính mình.', ephemeral: true });
    }

    await interaction.guild.members.ban(target.id, { deleteMessageSeconds: deleteDays * 86400, reason });
    require('../../database/management').addCase(interaction.guild.id, target.id, interaction.user.id, 'ban', reason);

    const embed = new EmbedBuilder()
      .setColor(config.colors.danger)
      .setTitle('🔨 Đã ban thành viên')
      .addFields(
        { name: 'Thành viên', value: `${target.tag} (${target.id})` },
        { name: 'Người thực hiện', value: interaction.user.tag },
        { name: 'Lý do', value: reason }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
