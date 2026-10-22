const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../config/config');

module.exports = {
  group: 'Quản trị',
  cooldown: 3,
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Cấm chat (timeout) một thành viên trong thời gian nhất định')
    .addUserOption(opt => opt.setName('user').setDescription('Thành viên').setRequired(true))
    .addIntegerOption(opt => opt.setName('minutes').setDescription('Số phút timeout (0 để gỡ)').setRequired(true).setMinValue(0).setMaxValue(40320))
    .addStringOption(opt => opt.setName('reason').setDescription('Lý do'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setDMPermission(false),

  async execute(interaction) {
    const target = interaction.options.getUser('user');
    const minutes = interaction.options.getInteger('minutes');
    const reason = interaction.options.getString('reason') || 'Không có lý do';

    const member = await interaction.guild.members.fetch(target.id).catch(() => null);
    if (!member) return interaction.reply({ content: '❌ Không tìm thấy thành viên.', ephemeral: true });
    if (!member.moderatable) {
      return interaction.reply({ content: '❌ Tôi không có quyền timeout thành viên này.', ephemeral: true });
    }

    if (minutes === 0) {
      await member.timeout(null, reason);
      return interaction.reply({ content: `✅ Đã gỡ timeout cho ${target.tag}.` });
    }

    await member.timeout(minutes * 60 * 1000, reason);
    require('../../database/management').addCase(interaction.guild.id, target.id, interaction.user.id, 'timeout', reason, minutes * 60000);

    const embed = new EmbedBuilder()
      .setColor(config.colors.warning)
      .setTitle('🔇 Đã timeout thành viên')
      .addFields(
        { name: 'Thành viên', value: `${target.tag} (${target.id})` },
        { name: 'Thời gian', value: `${minutes} phút` },
        { name: 'Người thực hiện', value: interaction.user.tag },
        { name: 'Lý do', value: reason }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
