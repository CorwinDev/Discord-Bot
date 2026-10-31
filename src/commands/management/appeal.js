const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const mgdb = require('../../database/management');
const perm = require('../../services/perm');
const { logToStaff, dmUser } = require('../../services/modTools');

const WHY = {
  notyours: '❌ Case này không tồn tại hoặc không phải của bạn.',
  revoked: 'ℹ️ Case này đã được thu hồi rồi.',
  type: '❌ Loại case này không cần kháng nghị.',
  already_denied: '❌ Kháng nghị cho case này đã bị từ chối — hãy mở ticket loại "Khiếu nại" nếu có thêm bằng chứng.',
  pending: 'ℹ️ Case này đã có kháng nghị đang chờ xử lý.'
};

module.exports = {
  group: 'GZW Management',
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('appeal')
    .setDescription('Kháng nghị quyết định kiểm duyệt')
    .setDMPermission(false)
    .addSubcommand((s) => s.setName('submit').setDescription('Gửi kháng nghị cho một case của bạn')
      .addIntegerOption((o) => o.setName('case').setDescription('Số case (xem trong DM/thông báo)').setRequired(true).setMinValue(1))
      .addStringOption((o) => o.setName('ly-do').setDescription('Vì sao nên xem xét lại?').setRequired(true).setMaxLength(800)))
    .addSubcommand((s) => s.setName('list').setDescription('(Nhân sự) kháng nghị đang chờ'))
    .addSubcommand((s) => s.setName('review').setDescription('(Nhân sự) duyệt kháng nghị')
      .addIntegerOption((o) => o.setName('id').setDescription('Số kháng nghị').setRequired(true).setMinValue(1))
      .addStringOption((o) => o.setName('quyet-dinh').setDescription('Quyết định').setRequired(true)
        .addChoices({ name: 'Chấp nhận (thu hồi case)', value: 'accept' }, { name: 'Từ chối', value: 'deny' }))
      .addStringOption((o) => o.setName('ghi-chu').setDescription('Ghi chú gửi cho thành viên (bắt buộc)').setRequired(true).setMaxLength(300))),

  async execute(interaction) {
    const gid = interaction.guild.id;
    const sub = interaction.options.getSubcommand();

    if (sub === 'submit') {
      const r = mgdb.createAppeal(gid, interaction.user.id, interaction.options.getInteger('case'), interaction.options.getString('ly-do'));
      if (!r.ok) return interaction.reply({ content: WHY[r.reason] || '❌ Không gửi được.', ephemeral: true });
      const e = new EmbedBuilder().setColor(0x8b5cf6).setTitle(`⚖️ Kháng nghị #${r.id}`)
        .setDescription(`${interaction.user} kháng nghị case **#${r.case.id}** (${r.case.type}).\n**Lý do gốc:** ${r.case.reason || '—'}\n**Lời kháng nghị:** ${interaction.options.getString('ly-do')}`)
        .setFooter({ text: 'Duyệt bằng /appeal review' });
      logToStaff(interaction.guild, { embeds: [e] });
      return interaction.reply({ content: `✅ Đã gửi kháng nghị **#${r.id}**. Nhân sự khác với người ra quyết định sẽ xem xét.`, ephemeral: true });
    }

    const err = perm.require(interaction, 'mod');
    if (err) return interaction.reply({ content: err, ephemeral: true });

    if (sub === 'list') {
      const rows = mgdb.pendingAppeals(gid);
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(0x8b5cf6).setTitle('⚖️ Kháng nghị đang chờ')
          .setDescription(rows.length ? rows.map((a) => `**#${a.id}** · case #${a.caseId} · <@${a.userId}> · ${a.reason.slice(0, 100)}`).join('\n') : 'Không có.')],
        ephemeral: true, allowedMentions: { parse: [] }
      });
    }

    // review
    const accept = interaction.options.getString('quyet-dinh') === 'accept';
    const note = interaction.options.getString('ghi-chu');
    const r = mgdb.reviewAppeal(gid, interaction.options.getInteger('id'), interaction.user.id, accept, note);
    if (!r.ok) {
      return interaction.reply({ content: r.reason === 'own_case' ? '❌ Bạn là người ra quyết định gốc — hãy nhờ nhân sự khác duyệt.' : '❌ Kháng nghị không tồn tại hoặc đã được xử lý.', ephemeral: true });
    }
    let extra = '';
    if (accept && r.case) {
      if (r.case.type === 'timeout') {
        const m = await interaction.guild.members.fetch(r.case.userId).catch(() => null);
        if (m?.moderatable) { await m.timeout(null, `Kháng nghị #${r.appeal.id} được chấp nhận`).catch(() => {}); extra = ' Đã gỡ timeout.'; }
      } else if (r.case.type === 'ban') {
        const ok = await interaction.guild.members.unban(r.case.userId, `Kháng nghị #${r.appeal.id}`).then(() => true).catch(() => false);
        extra = ok ? ' Đã gỡ ban.' : '';
      }
    }
    const user = await interaction.client.users.fetch(r.appeal.userId).catch(() => null);
    if (user) dmUser(user, `⚖️ Kháng nghị #${r.appeal.id} của bạn tại **${interaction.guild.name}** đã được **${accept ? 'chấp nhận' : 'từ chối'}**.\n${note}`);
    logToStaff(interaction.guild, { content: `⚖️ <@${interaction.user.id}> ${accept ? 'chấp nhận' : 'từ chối'} kháng nghị #${r.appeal.id} (case #${r.appeal.caseId}).${extra}` });
    return interaction.reply({ content: `✅ Đã ${accept ? 'chấp nhận' : 'từ chối'} kháng nghị #${r.appeal.id}.${extra}`, ephemeral: true });
  }
};
