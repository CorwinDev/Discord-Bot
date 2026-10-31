const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const tr = require('../../database/transfers');
const eco = require('../../database/economy');
const { coin } = require('../../services/gzwUi');
const gzw = require('../../config/gzw');

module.exports = {
  group: 'GZW CORE',
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('transaction')
    .setDescription('Tra cứu giao dịch tặng coin/vật phẩm bằng mã (TX-...)')
    .addStringOption((o) => o.setName('ma').setDescription('Mã giao dịch, ví dụ TX-1A2B3C4D').setRequired(true)),

  async execute(interaction) {
    const t = tr.getTransfer(interaction.guild.id, interaction.options.getString('ma'));
    const isStaff = require('../../services/perm').anyOf(interaction.member, 'audit', 'economy');
    // Chỉ người trong cuộc hoặc quản trị mới xem được (tránh lộ giao dịch riêng)
    if (!t || (!isStaff && t.fromId !== interaction.user.id && t.toId !== interaction.user.id)) {
      return interaction.reply({ content: '❌ Không tìm thấy giao dịch (hoặc bạn không có quyền xem).', ephemeral: true });
    }
    const item = t.itemId && eco.findItem(t.itemId);
    const embed = new EmbedBuilder().setColor(gzw.brandColor).setTitle(`🧾 ${t.txId}`)
      .addFields(
        { name: 'Người gửi', value: `<@${t.fromId}>`, inline: true },
        { name: 'Người nhận', value: `<@${t.toId}>`, inline: true },
        { name: 'Nội dung', value: t.kind === 'coin' ? coin(t.amount) : `${item?.emoji ?? ''} ${item?.name ?? t.itemId}`, inline: true },
        { name: 'Loại', value: t.context || '—', inline: true },
        { name: 'Thời gian', value: `<t:${Math.floor(t.createdAt / 1000)}:f>`, inline: true }
      );
    if (t.note) embed.addFields({ name: 'Lời nhắn', value: t.note });
    await interaction.reply({ embeds: [embed], ephemeral: true, allowedMentions: { parse: [] } });
  }
};
