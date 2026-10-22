const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../config/config');

module.exports = {
  group: 'Quản trị',
  cooldown: 3,
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Gỡ ban cho một user bằng ID')
    .addStringOption(opt => opt.setName('user_id').setDescription('ID của user cần unban').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .setDMPermission(false),

  async execute(interaction) {
    const userId = interaction.options.getString('user_id');

    try {
      await interaction.guild.members.unban(userId);
      require('../../database/management').addCase(interaction.guild.id, userId, interaction.user.id, 'unban', 'unban qua lệnh cũ');
    } catch (err) {
      return interaction.reply({ content: '❌ Không thể unban (ID sai hoặc user chưa bị ban).', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setColor(config.colors.success)
      .setTitle('✅ Đã gỡ ban')
      .setDescription(`User ID: \`${userId}\``)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
