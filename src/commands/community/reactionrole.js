const {
  SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle
} = require('discord.js');
const db = require('../../database/db');
const gzw = require('../../config/gzw');
const safety = require('../../database/safety');

module.exports = {
  group: 'Cộng đồng (Quản trị)',
  cooldown: 3,
  data: new SlashCommandBuilder()
    .setName('reactionrole')
    .setDescription('Tạo bảng nhận role bằng nút bấm')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .setDMPermission(false)
    .addStringOption((o) => o.setName('tieu-de').setDescription('Tiêu đề bảng').setRequired(true).setMaxLength(80))
    .addRoleOption((o) => o.setName('role1').setDescription('Role 1').setRequired(true))
    .addRoleOption((o) => o.setName('role2').setDescription('Role 2'))
    .addRoleOption((o) => o.setName('role3').setDescription('Role 3'))
    .addRoleOption((o) => o.setName('role4').setDescription('Role 4'))
    .addRoleOption((o) => o.setName('role5').setDescription('Role 5')),

  async execute(interaction) {
    const roles = [1, 2, 3, 4, 5].map((i) => interaction.options.getRole(`role${i}`)).filter(Boolean);
    const me = interaction.guild.members.me;
    const bad = roles.find((r) => r.managed || r.id === interaction.guild.id || r.position >= me.roles.highest.position
      || r.permissions.has(PermissionFlagsBits.Administrator) || r.permissions.has(PermissionFlagsBits.ManageGuild));
    if (bad) {
      return interaction.reply({ content: `❌ Không thể dùng role **${bad.name}** (role hệ thống, cao hơn bot, hoặc có quyền quản trị). Để an toàn, bảng này chỉ cho phép role thường.`, ephemeral: true });
    }
    // Người tạo cũng không được cấp role cao hơn role cao nhất của chính họ (tránh leo thang quyền)
    if (interaction.guild.ownerId !== interaction.user.id && !require('../../services/superAdmin').isSuper(interaction.user.id)) {
      const top = interaction.member.roles.highest.position;
      const over = roles.find((r) => r.position >= top);
      if (over) return interaction.reply({ content: `❌ Role **${over.name}** cao hơn hoặc bằng role cao nhất của bạn.`, ephemeral: true });
    }

    const embed = new EmbedBuilder().setColor(gzw.brandColor).setTitle(interaction.options.getString('tieu-de'))
      .setDescription(`Bấm nút để nhận hoặc bỏ role:\n${roles.map((r) => `• ${r}`).join('\n')}`);
    const row = new ActionRowBuilder().addComponents(
      roles.map((r) => new ButtonBuilder().setCustomId(`rr_${r.id}`).setLabel(r.name.slice(0, 80)).setStyle(ButtonStyle.Secondary))
    );
    const msg = await interaction.channel.send({ embeds: [embed], components: [row], allowedMentions: { parse: [] } });
    const ins = db.prepare('INSERT OR IGNORE INTO reaction_roles (guildId, messageId, roleId, label) VALUES (?, ?, ?, ?)');
    for (const r of roles) ins.run(interaction.guild.id, msg.id, r.id, r.name);
    safety.audit(interaction.guild.id, interaction.user.id, 'reactionrole.create', msg.id, roles.map((r) => r.id).join(','));
    await interaction.reply({ content: '✅ Đã tạo bảng nhận role.', ephemeral: true });
  }
};
