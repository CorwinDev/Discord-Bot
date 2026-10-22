const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../../database/db');
const config = require('../../config/config');

module.exports = {
  group: 'Quản trị',
  cooldown: 3,
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Cảnh cáo một thành viên (lưu lại lịch sử)')
    .addUserOption(opt => opt.setName('user').setDescription('Thành viên').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Lý do').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setDMPermission(false),

  async execute(interaction) {
    const target = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason');

    db.prepare('INSERT INTO warnings (guildId, userId, moderatorId, reason, createdAt) VALUES (?, ?, ?, ?, ?)')
      .run(interaction.guild.id, target.id, interaction.user.id, reason, Date.now());

    require('../../database/management').addCase(interaction.guild.id, target.id, interaction.user.id, 'warn', reason);
    const count = db.prepare('SELECT COUNT(*) as c FROM warnings WHERE guildId = ? AND userId = ?')
      .get(interaction.guild.id, target.id).c;

    const embed = new EmbedBuilder()
      .setColor(config.colors.warning)
      .setTitle('⚠️ Đã cảnh cáo thành viên')
      .addFields(
        { name: 'Thành viên', value: `${target.tag} (${target.id})` },
        { name: 'Lý do', value: reason },
        { name: 'Tổng số lần bị cảnh cáo', value: `${count}` }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    target.send({ content: `⚠️ Bạn đã bị cảnh cáo tại **${interaction.guild.name}**.\nLý do: ${reason}` }).catch(() => {});
  }
};
