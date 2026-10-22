const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const mgdb = require('../../database/management');
const { audit } = require('../../database/safety');
const perm = require('../../services/perm');
const mg = require('../../config/management');

const roleChoices = Object.keys(mg.staffRoles).map((n) => ({ name: n, value: n }));
const parseDue = (s) => {
  if (!s) return null;
  const m = /^(\d{1,3})([hd])$/i.exec(s.trim());
  return m ? Date.now() + Number(m[1]) * (m[2].toLowerCase() === 'h' ? 3600000 : 86400000) : undefined;
};

module.exports = {
  group: 'GZW Management',
  cooldown: 3,
  data: new SlashCommandBuilder()
    .setName('staff')
    .setDescription('Quản lý nhân sự: danh sách, phân vai, nhiệm vụ, thống kê')
    .setDMPermission(false)
    .addSubcommand((s) => s.setName('list').setDescription('Danh sách nhân sự theo vai trò'))
    .addSubcommand((s) => s.setName('assign').setDescription('(Admin) cấp/gỡ vai trò nhân sự')
      .addUserOption((o) => o.setName('user').setDescription('Thành viên').setRequired(true))
      .addStringOption((o) => o.setName('vai-tro').setDescription('Vai trò').setRequired(true).addChoices(...roleChoices))
      .addStringOption((o) => o.setName('hanh-dong').setDescription('Cấp hay gỡ').setRequired(true).addChoices({ name: 'Cấp', value: 'add' }, { name: 'Gỡ', value: 'remove' }))
      .addStringOption((o) => o.setName('ly-do').setDescription('Lý do (bắt buộc)').setRequired(true).setMaxLength(200)))
    .addSubcommand((s) => s.setName('task-add').setDescription('(Admin) giao nhiệm vụ cho nhân sự')
      .addUserOption((o) => o.setName('user').setDescription('Nhân sự').setRequired(true))
      .addStringOption((o) => o.setName('noi-dung').setDescription('Nhiệm vụ').setRequired(true).setMaxLength(200))
      .addStringOption((o) => o.setName('han').setDescription('Hạn, ví dụ 12h hoặc 3d (tuỳ chọn)').setMaxLength(6)))
    .addSubcommand((s) => s.setName('task-list').setDescription('Xem nhiệm vụ đang mở')
      .addUserOption((o) => o.setName('user').setDescription('Nhân sự (mặc định: bạn)')))
    .addSubcommand((s) => s.setName('task-done').setDescription('Đánh dấu hoàn thành nhiệm vụ')
      .addIntegerOption((o) => o.setName('id').setDescription('Số nhiệm vụ').setRequired(true).setMinValue(1)))
    .addSubcommand((s) => s.setName('stats').setDescription('Thống kê công việc 30 ngày')
      .addUserOption((o) => o.setName('user').setDescription('Nhân sự (mặc định: bạn)')))
    .addSubcommand((s) => s.setName('reports').setDescription('Hàng chờ báo cáo thành viên (nhân sự mod)')),

  async execute(interaction) {
    const guild = interaction.guild, gid = guild.id, actor = interaction.member;
    const sub = interaction.options.getSubcommand();
    const e = new EmbedBuilder().setColor(0x8b5cf6);

    if (sub === 'list') {
      await guild.members.fetch().catch(() => {});
      const lines = Object.keys(mg.staffRoles).sort((a, b) => mg.staffRoles[b].rank - mg.staffRoles[a].rank).map((name) => {
        const role = guild.roles.cache.find((r) => r.name === name);
        const ms = role ? [...role.members.values()].map((m) => m.toString()).join(' ') : '*(chưa tạo role)*';
        return `**${name}** — ${ms || '—'}`;
      });
      return interaction.reply({ embeds: [e.setTitle('🐺 Đội ngũ GZW').setDescription(lines.join('\n'))], allowedMentions: { parse: [] } });
    }

    if (sub === 'assign') {
      const err = perm.require(interaction, 'admin');
      if (err) return interaction.reply({ content: err, ephemeral: true });
      const user = interaction.options.getUser('user'), roleName = interaction.options.getString('vai-tro');
      const action = interaction.options.getString('hanh-dong'), reason = interaction.options.getString('ly-do');
      const target = await guild.members.fetch(user.id).catch(() => null);
      if (!target || user.bot) return interaction.reply({ content: '❌ Không áp dụng được cho đối tượng này.', ephemeral: true });
      if (user.id === interaction.user.id) return interaction.reply({ content: '❌ Không thể tự thay đổi vai trò nhân sự của chính mình.', ephemeral: true });
      const isOwner = guild.ownerId === interaction.user.id;
      const actorRank = perm.rankOf(actor);
      if (!isOwner && (mg.staffRoles[roleName].rank >= actorRank || perm.rankOf(target) >= actorRank)) {
        return interaction.reply({ content: '❌ Bạn chỉ được cấp/gỡ vai trò thấp hơn cấp bậc của mình, cho người thấp hơn mình.', ephemeral: true });
      }
      const role = guild.roles.cache.find((r) => r.name === roleName);
      if (!role) return interaction.reply({ content: `❌ Server chưa có role **${roleName}**.`, ephemeral: true });
      try {
        if (action === 'add') await target.roles.add(role, `${reason} (bởi ${interaction.user.tag})`); else await target.roles.remove(role, `${reason} (bởi ${interaction.user.tag})`);
      } catch { return interaction.reply({ content: '❌ Bot không đủ quyền quản lý role này (đặt role bot cao hơn role nhân sự).', ephemeral: true }); }
      audit(gid, interaction.user.id, `staff.${action}`, user.id, `${roleName} — ${reason}`);
      return interaction.reply({ content: `✅ Đã ${action === 'add' ? 'cấp' : 'gỡ'} **${roleName}** ${action === 'add' ? 'cho' : 'của'} ${user}.`, allowedMentions: { parse: [] }, ephemeral: true });
    }

    if (sub === 'task-add') {
      const err = perm.require(interaction, 'admin');
      if (err) return interaction.reply({ content: err, ephemeral: true });
      const user = interaction.options.getUser('user');
      const due = parseDue(interaction.options.getString('han'));
      if (due === undefined) return interaction.reply({ content: '❌ Hạn không hợp lệ (ví dụ `12h`, `3d`).', ephemeral: true });
      const id = mgdb.addTask(gid, user.id, interaction.user.id, interaction.options.getString('noi-dung'), due);
      return interaction.reply({ content: `📌 Đã giao nhiệm vụ **#${id}** cho ${user}${due ? ` · hạn <t:${Math.floor(due / 1000)}:R>` : ''}.`, allowedMentions: { users: [user.id] } });
    }
    if (sub === 'task-list') {
      const user = interaction.options.getUser('user') || interaction.user;
      const tasks = mgdb.listTasks(gid, user.id);
      return interaction.reply({ embeds: [e.setTitle(`📌 Nhiệm vụ của ${user.username}`).setDescription(tasks.length
        ? tasks.map((t) => `**#${t.id}** ${t.title}${t.dueAt ? ` · hạn <t:${Math.floor(t.dueAt / 1000)}:R>` : ''}`).join('\n') : 'Không có nhiệm vụ đang mở.')], ephemeral: true });
    }
    if (sub === 'task-done') {
      const r = mgdb.completeTask(gid, interaction.options.getInteger('id'), interaction.user.id, perm.has(actor, 'admin'));
      return interaction.reply({ content: r.ok ? `✅ Đã hoàn thành nhiệm vụ #${r.task.id}.` : r.reason === 'forbidden' ? '❌ Đây không phải nhiệm vụ của bạn.' : '❌ Không tìm thấy nhiệm vụ đang mở.', ephemeral: true });
    }
    if (sub === 'stats') {
      const user = interaction.options.getUser('user') || interaction.user;
      if (user.id !== interaction.user.id && !perm.has(actor, 'admin') && !perm.has(actor, 'audit')) return interaction.reply({ content: '❌ Chỉ xem được thống kê của chính bạn.', ephemeral: true });
      const s = mgdb.staffStats(gid, user.id);
      return interaction.reply({ embeds: [e.setTitle(`📊 Công việc 30 ngày — ${user.username}`).addFields(
        { name: 'Case kiểm duyệt', value: String(s.cases), inline: true }, { name: 'Báo cáo đã xử lý', value: String(s.reports), inline: true },
        { name: 'Ticket nhận', value: String(s.tickets), inline: true }, { name: 'Kháng nghị đã duyệt', value: String(s.appeals), inline: true },
        { name: 'Nhiệm vụ xong / đang mở', value: `${s.tasksDone} / ${s.tasksOpen}`, inline: true })], ephemeral: true });
    }
    if (sub === 'reports') {
      const err = perm.require(interaction, 'mod');
      if (err) return interaction.reply({ content: err, ephemeral: true });
      const rows = require('../../database/db').prepare("SELECT * FROM reports WHERE guildId = ? AND status IN ('open','claimed') ORDER BY id LIMIT 15").all(gid);
      return interaction.reply({ embeds: [e.setTitle('🚨 Báo cáo đang mở').setDescription(rows.length
        ? rows.map((r) => `**#${r.id}** [${r.status}] <@${r.targetId}> — ${r.reason.slice(0, 80)}`).join('\n') : 'Không có.')], ephemeral: true, allowedMentions: { parse: [] } });
    }
  }
};
