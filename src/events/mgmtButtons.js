const mgdb = require('../database/management');
const perm = require('../services/perm');
const { reportButtons, reportEmbed } = require('../commands/management/report');
const { PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const mg = require('../config/management');
const eventsUi = require('../services/eventsUi');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    try {
      /* ---- Nút báo cáo (nhân sự) ---- */
      if (interaction.isButton() && interaction.customId.startsWith('rpt_')) {
        if (!perm.has(interaction.member, 'mod')) return interaction.reply({ content: '❌ Chỉ nhân sự kiểm duyệt dùng được nút này.', ephemeral: true });
        const [, action, idStr] = interaction.customId.split('_');
        const gid = interaction.guild.id, id = Number(idStr);
        const r0 = mgdb.getReport(gid, id);
        if (!r0) return interaction.reply({ content: '❌ Báo cáo không tồn tại.', ephemeral: true });
        if (r0.targetId === interaction.user.id || r0.reporterId === interaction.user.id) {
          return interaction.reply({ content: '❌ Bạn liên quan trực tiếp tới báo cáo này, hãy để nhân sự khác xử lý.', ephemeral: true });
        }
        const status = action === 'claim' ? 'claimed' : action === 'resolve' ? 'resolved' : 'dismissed';
        const ok = mgdb.updateReport(gid, id, status, interaction.user.id);
        if (!ok) return interaction.reply({ content: 'ℹ️ Báo cáo này đã đóng.', ephemeral: true });
        const r = mgdb.getReport(gid, id);
        return interaction.update({ embeds: [reportEmbed(r)], components: [reportButtons(id, status)], allowedMentions: { parse: [] } });
      }

      /* ---- Nút sự kiện: đăng ký / huỷ ---- */
      if (interaction.isButton() && interaction.customId.startsWith('evt_')) return eventsUi.handleButton(interaction);

      /* ---- Role menu ---- */
      if (interaction.isStringSelectMenu() && interaction.customId === 'rolemenu') {
        const guild = interaction.guild;
        const allowed = interaction.component.options.map((o) => o.value);
        const member = interaction.member;
        const chosen = new Set(interaction.values);
        const added = [], removed = [], skipped = [];
        for (const rid of allowed.filter((x) => chosen.has(x))) { // bật/tắt (toggle) các role vừa chọn
          const role = guild.roles.cache.get(rid);
          if (!role) continue;
          // kiểm tra lại quyền tại thời điểm bấm: role có thể đã bị cấp quyền nguy hiểm sau khi tạo menu
          if (mg.dangerousPerms.some((p) => role.permissions.has(PermissionFlagsBits[p])) || role.managed) { skipped.push(role.name); continue; }
          if (member.roles.cache.has(rid)) await member.roles.remove(role, 'Role menu').then(() => removed.push(role.name)).catch(() => skipped.push(role.name));
          else await member.roles.add(role, 'Role menu').then(() => added.push(role.name)).catch(() => skipped.push(role.name));
        }
        const parts = [];
        if (added.length) parts.push(`➕ ${added.join(', ')}`);
        if (removed.length) parts.push(`➖ ${removed.join(', ')}`);
        if (skipped.length) parts.push(`⚠️ Bỏ qua: ${skipped.join(', ')}`);
        return interaction.reply({ content: parts.join('\n') || 'Không có thay đổi.', ephemeral: true });
      }
    } catch (err) {
      console.error('⚠️  Lỗi mgmtButtons:', err);
      if (!interaction.replied && !interaction.deferred) interaction.reply({ content: '❌ Có lỗi xảy ra.', ephemeral: true }).catch(() => {});
    }
  }
};
