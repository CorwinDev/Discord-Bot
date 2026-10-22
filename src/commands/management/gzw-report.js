const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const mgdb = require('../../database/management');
const { audit, economyStats } = require('../../database/safety');
const perm = require('../../services/perm');
const gzw = require('../../config/gzw');
const { fmt } = require('../../services/gzwUi');

module.exports = {
  group: 'GZW Management',
  cooldown: 10,
  data: new SlashCommandBuilder()
    .setName('gzw-report')
    .setDescription('Báo cáo & thống kê cho nhân sự có quyền xem (audit)')
    .setDMPermission(false)
    .addSubcommand((s) => s.setName('overview').setDescription('Tổng quan thành viên, hoạt động, kinh tế'))
    .addSubcommand((s) => s.setName('moderation').setDescription('Thống kê kiểm duyệt, báo cáo, kháng nghị, ticket (30 ngày)'))
    .addSubcommand((s) => s.setName('export').setDescription('Xuất CSV (chỉ gồm cột được phép xem)')
      .addStringOption((o) => o.setName('loai').setDescription('Dữ liệu').setRequired(true)
        .addChoices({ name: 'Sổ cái coin', value: 'ledger' }, { name: 'Kiểm duyệt', value: 'moderation' }, { name: 'Sự kiện', value: 'events' }, { name: 'Booster', value: 'boosts' }))
      .addIntegerOption((o) => o.setName('so-ngay').setDescription('Số ngày (mặc định 30)').setMinValue(1).setMaxValue(365))),

  async execute(interaction) {
    const err = perm.require(interaction, 'audit');
    if (err) return interaction.reply({ content: err, ephemeral: true });
    const gid = interaction.guild.id;
    const sub = interaction.options.getSubcommand();
    const e = new EmbedBuilder().setColor(gzw.brandColor);

    if (sub === 'overview') {
      const flow = mgdb.memberFlow(gid, 7);
      const eco = economyStats(gid, 7);
      const earned = eco.bySource.reduce((s, r) => s + r.earned, 0), spent = eco.bySource.reduce((s, r) => s + r.spent, 0);
      e.setTitle('📊 GZW Overview (7 ngày)').addFields(
        { name: 'Thành viên', value: `${fmt(interaction.guild.memberCount)} · +${flow.joins} vào / −${flow.leaves} rời`, inline: true },
        { name: 'Hoạt động', value: `${fmt(mgdb.activeMembers(gid, 7))} người có chat`, inline: true },
        { name: 'Coin Flow', value: `phát ra ${fmt(earned)} · tiêu ${fmt(spent)} · lưu hành ${fmt(eco.supply.total)} ${gzw.currency.emoji}`, inline: false },
        { name: 'Booster', value: `${mgdb.boostsSince(gid, 7)} boost mới`, inline: true },
        { name: 'Sự kiện đang mở', value: String(mgdb.listEvents(gid, 100).length), inline: true }
      ).setFooter({ text: 'Số liệu thành viên vào/rời chỉ tính từ khi bot bắt đầu ghi nhận.' });
      return interaction.reply({ embeds: [e], ephemeral: true });
    }
    if (sub === 'moderation') {
      const m = mgdb.moderationStats(gid, 30);
      const f = (rows, k) => rows.length ? rows.map((r) => `${r[k]}: **${r.n}**`).join(' · ') : '—';
      e.setTitle('🛡️ Moderation (30 ngày)').addFields(
        { name: 'Case', value: f(m.byType, 'type') }, { name: 'Báo cáo', value: f(m.reports, 'status') },
        { name: 'Kháng nghị', value: f(m.appeals, 'status') }, { name: 'Ticket theo loại', value: f(m.tickets, 'category') });
      return interaction.reply({ embeds: [e], ephemeral: true });
    }
    // export
    const type = interaction.options.getString('loai');
    const days = interaction.options.getInteger('so-ngay') ?? 30;
    if ((type === 'ledger') && !perm.has(interaction.member, 'economy') && !perm.has(interaction.member, 'audit')) return interaction.reply({ content: '❌ Không đủ quyền xuất sổ cái.', ephemeral: true });
    const csv = mgdb.exportData(gid, type, days);
    if (!csv) return interaction.reply({ content: '❌ Loại dữ liệu không hợp lệ.', ephemeral: true });
    audit(gid, interaction.user.id, 'report.export', type, `${days} ngày`);
    const file = new AttachmentBuilder(Buffer.from(csv, 'utf8'), { name: `gzw-${type}-${days}d.csv` });
    return interaction.reply({ content: `📎 Xuất **${type}** (${days} ngày). File chỉ gửi riêng cho bạn — hãy bảo quản cẩn thận.`, files: [file], ephemeral: true });
  }
};
