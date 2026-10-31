const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const mgdb = require('../../database/management');
const { modLogChannel } = require('../../services/modTools');

const reportButtons = (id, status = 'open') => new ActionRowBuilder().addComponents(
  new ButtonBuilder().setCustomId(`rpt_claim_${id}`).setLabel('Nhận xử lý').setStyle(ButtonStyle.Primary).setDisabled(status !== 'open'),
  new ButtonBuilder().setCustomId(`rpt_resolve_${id}`).setLabel('Đã xử lý').setStyle(ButtonStyle.Success).setDisabled(status === 'resolved' || status === 'dismissed'),
  new ButtonBuilder().setCustomId(`rpt_dismiss_${id}`).setLabel('Bỏ qua').setStyle(ButtonStyle.Secondary).setDisabled(status === 'resolved' || status === 'dismissed')
);
const reportEmbed = (r, status = r.status) => new EmbedBuilder().setColor(status === 'resolved' ? 0x57f287 : status === 'dismissed' ? 0x99aab5 : 0xed4245)
  .setTitle(`🚨 Báo cáo #${r.id} — ${status}`)
  .addFields(
    { name: 'Người bị báo cáo', value: `<@${r.targetId}>`, inline: true },
    { name: 'Người báo cáo', value: `<@${r.reporterId}>`, inline: true },
    { name: 'Nhân sự xử lý', value: r.handlerId ? `<@${r.handlerId}>` : '—', inline: true },
    { name: 'Lý do', value: r.reason },
    ...(r.link ? [{ name: 'Liên kết', value: r.link }] : [])
  ).setTimestamp(r.createdAt);

module.exports = {
  group: 'GZW Management',
  cooldown: 30,
  reportButtons, reportEmbed,
  data: new SlashCommandBuilder()
    .setName('report')
    .setDescription('Báo cáo một thành viên cho đội ngũ kiểm duyệt (riêng tư)')
    .setDMPermission(false)
    .addUserOption((o) => o.setName('user').setDescription('Thành viên bị báo cáo').setRequired(true))
    .addStringOption((o) => o.setName('ly-do').setDescription('Mô tả vi phạm').setRequired(true).setMaxLength(800))
    .addStringOption((o) => o.setName('lien-ket').setDescription('Link tin nhắn làm bằng chứng (tuỳ chọn)').setMaxLength(200)),

  async execute(interaction) {
    const target = interaction.options.getUser('user');
    if (target.bot || target.id === interaction.user.id) return interaction.reply({ content: '❌ Không thể báo cáo đối tượng này.', ephemeral: true });
    const link = interaction.options.getString('lien-ket');
    if (link && !/^https:\/\/(discord|discordapp)\.com\/channels\/\d+\/\d+\/\d+$/.test(link.trim())) {
      return interaction.reply({ content: '❌ Liên kết phải là link tin nhắn Discord hợp lệ.', ephemeral: true });
    }
    const res = mgdb.createReport(interaction.guild.id, interaction.user.id, target.id, interaction.options.getString('ly-do'), link?.trim());
    if (!res.ok) return interaction.reply({ content: res.reason === 'duplicate' ? 'ℹ️ Bạn đã có báo cáo đang xử lý về người này.' : '❌ Bạn đang có quá nhiều báo cáo chưa xử lý (tối đa 5).', ephemeral: true });

    const r = mgdb.getReport(interaction.guild.id, res.id);
    const ch = modLogChannel(interaction.guild, require('../../config/management').channels.reports);
    if (ch) {
      const m = await ch.send({ embeds: [reportEmbed(r)], components: [reportButtons(r.id)], allowedMentions: { parse: [] } }).catch(() => null);
      if (m) mgdb.setReportMessage(r.id, m.channelId, m.id);
    }
    await interaction.reply({ content: `✅ Đã gửi báo cáo **#${r.id}** tới đội ngũ kiểm duyệt. Danh tính người báo cáo chỉ hiển thị cho nhân sự.${ch ? '' : ' (Server chưa có kênh nhận báo cáo — nhân sự xem bằng `/staff reports`.)'}`, ephemeral: true });
  }
};
