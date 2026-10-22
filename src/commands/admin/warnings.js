const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../../database/db');
const config = require('../../config/config');

module.exports = {
  group: 'Quản trị',
  cooldown: 3,
  data: new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('Xem lịch sử cảnh cáo của một thành viên')
    .addUserOption(opt => opt.setName('user').setDescription('Thành viên').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setDMPermission(false),

  async execute(interaction) {
    const target = interaction.options.getUser('user');
    const rows = db.prepare('SELECT * FROM warnings WHERE guildId = ? AND userId = ? ORDER BY createdAt DESC LIMIT 15')
      .all(interaction.guild.id, target.id);

    if (rows.length === 0) {
      return interaction.reply({ content: `✅ ${target.tag} chưa có lần cảnh cáo nào.`, ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setColor(config.colors.warning)
      .setTitle(`⚠️ Lịch sử cảnh cáo — ${target.tag}`)
      .setDescription(
        rows.map((r, i) => `**${i + 1}.** ${r.reason}\n└ <t:${Math.floor(r.createdAt / 1000)}:R> bởi <@${r.moderatorId}>`).join('\n\n')
      );

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
