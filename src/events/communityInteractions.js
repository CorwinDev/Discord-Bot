const { PermissionFlagsBits } = require('discord.js');
const db = require('../database/db');
const gw = require('../services/giveaways');

/** Nút tham gia giveaway (gw_join_<id>) và nút nhận role (rr_<roleId>). */
module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    if (!interaction.isButton() || !interaction.guild) return;
    const id = interaction.customId;

    if (id.startsWith('gw_join_')) {
      const gid = Number(id.slice(8));
      const g = db.prepare('SELECT * FROM giveaways WHERE id = ? AND guildId = ?').get(gid, interaction.guild.id);
      if (!g || g.status !== 'RUNNING' || g.endsAt <= Date.now()) {
        return interaction.reply({ content: '⏹️ Giveaway này đã kết thúc.', ephemeral: true });
      }
      if (interaction.user.id === g.hostId) return interaction.reply({ content: '❌ Người tổ chức không thể tham gia giveaway của chính mình.', ephemeral: true });
      const res = db.prepare('INSERT OR IGNORE INTO giveaway_entries (giveawayId, userId) VALUES (?, ?)').run(gid, interaction.user.id);
      if (!res.changes) {
        db.prepare('DELETE FROM giveaway_entries WHERE giveawayId = ? AND userId = ?').run(gid, interaction.user.id);
        await interaction.reply({ content: '↩️ Bạn đã rút khỏi giveaway.', ephemeral: true });
      } else {
        await interaction.reply({ content: '🎉 Bạn đã tham gia giveaway. Bấm lại để rút.', ephemeral: true });
      }
      return interaction.message.edit(gw.buildMessage(g)).catch(() => {});
    }

    if (id.startsWith('rr_')) {
      const roleId = id.slice(3);
      const row = db.prepare('SELECT 1 FROM reaction_roles WHERE messageId = ? AND roleId = ?').get(interaction.message.id, roleId);
      const role = interaction.guild.roles.cache.get(roleId);
      if (!row || !role) return interaction.reply({ content: '❌ Role này không còn khả dụng.', ephemeral: true });
      // Kiểm tra lại lúc bấm: role có thể đã được cấp thêm quyền nguy hiểm sau khi tạo bảng
      const me = interaction.guild.members.me;
      if (role.managed || role.position >= me.roles.highest.position
        || role.permissions.has(PermissionFlagsBits.Administrator) || role.permissions.has(PermissionFlagsBits.ManageGuild)) {
        return interaction.reply({ content: '❌ Role này hiện không được phép tự nhận.', ephemeral: true });
      }
      const has = interaction.member.roles.cache.has(roleId);
      await (has ? interaction.member.roles.remove(role, 'reaction role') : interaction.member.roles.add(role, 'reaction role'))
        .then(() => interaction.reply({ content: has ? `➖ Đã bỏ role **${role.name}**.` : `➕ Đã nhận role **${role.name}**.`, ephemeral: true }))
        .catch(() => interaction.reply({ content: '❌ Bot không đủ quyền để đổi role này.', ephemeral: true }));
    }
  }
};
