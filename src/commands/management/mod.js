const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const mgdb = require('../../database/management');
const { audit } = require('../../database/safety');
const perm = require('../../services/perm');
const { logToStaff, confirmAction, dmUser } = require('../../services/modTools');
const mg = require('../../config/management');

const COLORS = { warn: 0xfee75c, timeout: 0xe8a24d, kick: 0xed7b45, ban: 0xed4245, unban: 0x57f287 };
const ICON = { warn: '⚠️', timeout: '🔇', kick: '👢', ban: '🔨', unban: '✅' };

function caseEmbed(c, user) {
  return new EmbedBuilder().setColor(COLORS[c.type] ?? 0x8b5cf6)
    .setTitle(`${ICON[c.type] ?? '📌'} Case #${c.id} — ${c.type}${c.revoked ? ' (đã thu hồi)' : ''}`)
    .addFields(
      { name: 'Thành viên', value: `<@${c.userId}> (${c.userId})`, inline: true },
      { name: 'Nhân sự', value: `<@${c.modId}>`, inline: true },
      { name: 'Thời gian', value: `<t:${Math.floor(c.createdAt / 1000)}:f>`, inline: true },
      { name: 'Lý do', value: c.reason || '—' }
    ).setFooter({ text: 'Có kháng nghị? Dùng /appeal gửi case này.' });
}

module.exports = {
  group: 'GZW Management',
  cooldown: 3,
  data: new SlashCommandBuilder()
    .setName('mod')
    .setDescription('Kiểm duyệt có ghi case (cần vai trò nhân sự phù hợp)')
    .setDMPermission(false)
    .addSubcommand((s) => s.setName('warn').setDescription('Cảnh cáo thành viên')
      .addUserOption((o) => o.setName('user').setDescription('Thành viên').setRequired(true))
      .addStringOption((o) => o.setName('ly-do').setDescription('Lý do (bắt buộc)').setRequired(true).setMaxLength(300)))
    .addSubcommand((s) => s.setName('timeout').setDescription('Timeout thành viên')
      .addUserOption((o) => o.setName('user').setDescription('Thành viên').setRequired(true))
      .addIntegerOption((o) => o.setName('phut').setDescription('Số phút').setRequired(true).setMinValue(1).setMaxValue(mg.modLimits.maxTimeoutMinutes))
      .addStringOption((o) => o.setName('ly-do').setDescription('Lý do (bắt buộc)').setRequired(true).setMaxLength(300)))
    .addSubcommand((s) => s.setName('kick').setDescription('Kick thành viên (có xác nhận)')
      .addUserOption((o) => o.setName('user').setDescription('Thành viên').setRequired(true))
      .addStringOption((o) => o.setName('ly-do').setDescription('Lý do (bắt buộc)').setRequired(true).setMaxLength(300)))
    .addSubcommand((s) => s.setName('ban').setDescription('Ban thành viên (có xác nhận)')
      .addUserOption((o) => o.setName('user').setDescription('Thành viên').setRequired(true))
      .addStringOption((o) => o.setName('ly-do').setDescription('Lý do (bắt buộc)').setRequired(true).setMaxLength(300)))
    .addSubcommand((s) => s.setName('unban').setDescription('Gỡ ban theo ID')
      .addStringOption((o) => o.setName('user-id').setDescription('ID người dùng').setRequired(true))
      .addStringOption((o) => o.setName('ly-do').setDescription('Lý do (bắt buộc)').setRequired(true).setMaxLength(300)))
    .addSubcommand((s) => s.setName('history').setDescription('Lịch sử case của thành viên')
      .addUserOption((o) => o.setName('user').setDescription('Thành viên').setRequired(true)))
    .addSubcommand((s) => s.setName('case').setDescription('Xem một case')
      .addIntegerOption((o) => o.setName('id').setDescription('Số case').setRequired(true).setMinValue(1)))
    .addSubcommand((s) => s.setName('revoke').setDescription('Thu hồi case cảnh cáo (không gỡ timeout/ban)')
      .addIntegerOption((o) => o.setName('id').setDescription('Số case').setRequired(true).setMinValue(1))
      .addStringOption((o) => o.setName('ly-do').setDescription('Lý do (bắt buộc)').setRequired(true).setMaxLength(300))),

  async execute(interaction) {
    const err = perm.require(interaction, 'mod');
    if (err) return interaction.reply({ content: err, ephemeral: true });
    const guild = interaction.guild, gid = guild.id, actor = interaction.member;
    const sub = interaction.options.getSubcommand();

    if (sub === 'history') {
      const user = interaction.options.getUser('user');
      const cases = mgdb.userCases(gid, user.id);
      const e = new EmbedBuilder().setColor(0x8b5cf6).setTitle(`📚 Case của ${user.username}`)
        .setDescription(cases.length ? cases.map((c) => `${ICON[c.type] ?? '📌'} **#${c.id}** ${c.type}${c.revoked ? ' ~~' : ' '}— ${c.reason || '—'}${c.revoked ? '~~' : ''} · <t:${Math.floor(c.createdAt / 1000)}:d> · <@${c.modId}>`).join('\n') : 'Chưa có case nào.')
        .setFooter({ text: `Cảnh cáo còn hiệu lực: ${mgdb.activeWarnCount(gid, user.id)}` });
      return interaction.reply({ embeds: [e], ephemeral: true, allowedMentions: { parse: [] } });
    }
    if (sub === 'case') {
      const c = mgdb.getCase(gid, interaction.options.getInteger('id'));
      return c ? interaction.reply({ embeds: [caseEmbed(c)], ephemeral: true, allowedMentions: { parse: [] } })
        : interaction.reply({ content: '❌ Không có case này.', ephemeral: true });
    }
    if (sub === 'revoke') {
      const id = interaction.options.getInteger('id');
      const c = mgdb.getCase(gid, id);
      if (!c) return interaction.reply({ content: '❌ Không có case này.', ephemeral: true });
      if (c.type !== 'warn') return interaction.reply({ content: '❌ Chỉ thu hồi được case cảnh cáo. Timeout/ban dùng gỡ timeout hoặc `/mod unban`.', ephemeral: true });
      if (c.modId === interaction.user.id && !perm.has(actor, 'admin')) return interaction.reply({ content: '❌ Bạn không thể tự thu hồi case của chính mình (nhờ nhân sự khác).', ephemeral: true });
      mgdb.revokeCase(gid, id);
      audit(gid, interaction.user.id, 'mod.revoke', c.userId, `case #${id} — ${interaction.options.getString('ly-do')}`);
      return interaction.reply({ content: `✅ Đã thu hồi case #${id}.`, ephemeral: true });
    }

    const reason = interaction.options.getString('ly-do');

    if (sub === 'unban') {
      const userId = interaction.options.getString('user-id').trim();
      if (!/^\d{15,25}$/.test(userId)) return interaction.reply({ content: '❌ ID không hợp lệ.', ephemeral: true });
      const ok = await guild.members.unban(userId, `${reason} (bởi ${interaction.user.tag})`).then(() => true).catch(() => false);
      if (!ok) return interaction.reply({ content: '❌ Không unban được (ID sai hoặc chưa bị ban).', ephemeral: true });
      const id = mgdb.addCase(gid, userId, interaction.user.id, 'unban', reason);
      const e = caseEmbed(mgdb.getCase(gid, id));
      logToStaff(guild, { embeds: [e] });
      return interaction.reply({ embeds: [e], ephemeral: true, allowedMentions: { parse: [] } });
    }

    const target = interaction.options.getUser('user');
    const member = await guild.members.fetch(target.id).catch(() => null);
    if (!member && sub !== 'ban') return interaction.reply({ content: '❌ Không tìm thấy thành viên trong server.', ephemeral: true });
    const can = perm.canActOn(actor, member ?? { id: target.id, user: target, guild, roles: { cache: new Map(), highest: { position: -1 } }, permissions: null });
    if (!can.ok) return interaction.reply({ content: can.msg, ephemeral: true });

    let reply = (payload) => interaction.reply(payload);
    let minutes = null;
    if (sub === 'timeout') {
      minutes = interaction.options.getInteger('phut');
      if (!member.moderatable) return interaction.reply({ content: '❌ Bot không đủ quyền timeout người này.', ephemeral: true });
    }
    if (sub === 'kick' && !member.kickable) return interaction.reply({ content: '❌ Bot không đủ quyền kick người này.', ephemeral: true });
    if (sub === 'ban' && member && !member.bannable) return interaction.reply({ content: '❌ Bot không đủ quyền ban người này.', ephemeral: true });

    const needConfirm = sub === 'kick' || sub === 'ban' || (sub === 'timeout' && minutes > mg.modLimits.confirmAboveMinutes);
    if (needConfirm) {
      const c = await confirmAction(interaction, `Xác nhận **${sub}** ${target} — lý do: ${reason}${minutes ? ` (${minutes} phút)` : ''}?`);
      if (!c) return;
      reply = (payload) => c.btn.update({ content: '', components: [], ...payload });
    }

    const rtext = `${reason} (bởi ${interaction.user.tag})`;
    try {
      if (sub === 'timeout') await member.timeout(minutes * 60000, rtext);
      if (sub === 'kick') await member.kick(rtext);
      if (sub === 'ban') await guild.members.ban(target.id, { reason: rtext, deleteMessageSeconds: 0 });
    } catch (e) {
      return reply({ content: `❌ Thao tác thất bại: ${e.message}`, ephemeral: true });
    }
    const id = mgdb.addCase(gid, target.id, interaction.user.id, sub, reason, minutes ? minutes * 60000 : null);
    const c = mgdb.getCase(gid, id);
    const dm = await dmUser(target, `${ICON[sub]} Bạn nhận xử lý **${sub}** tại **${guild.name}** (case #${id}).\nLý do: ${reason}\nNếu cho rằng quyết định chưa đúng, dùng \`/appeal\` trong server (nếu còn ở server) hoặc liên hệ ban quản trị.`);
    const e = caseEmbed(c);
    if (sub === 'warn') e.addFields({ name: 'Cảnh cáo còn hiệu lực', value: String(mgdb.activeWarnCount(gid, target.id)), inline: true });
    e.addFields({ name: 'Thông báo DM', value: dm ? 'Đã gửi' : 'Không gửi được', inline: true });
    logToStaff(guild, { embeds: [e] });
    return reply({ embeds: [e], ephemeral: true, allowedMentions: { parse: [] } });
  }
};
