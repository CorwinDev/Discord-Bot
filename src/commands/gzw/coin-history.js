const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const eco = require('../../database/economy');
const { coin, colorFor, fmt } = require('../../services/gzwUi');

const SOURCE_LABEL = {
  daily: 'Daily', play: 'Mini-game', quest: 'Nhiệm vụ', achievement: 'Thành tích', shop: 'Shop', admin: 'Quản trị',
  purchase: 'Nạp coin (cũ)', booster: 'Booster', tournament: 'Giải đấu', duel: 'Duel', quiz: 'Quiz',
  upgrade: 'Nâng cấp', donate_in: 'Nhận coin', donate_out: 'Tặng coin', gift_shop: 'Tặng quà'
};

module.exports = {
  group: 'GZW CORE',
  cooldown: 5,
  data: new SlashCommandBuilder().setName('coin-history').setDescription('Xem 10 giao dịch coin gần nhất của bạn'),

  async execute(interaction) {
    const gid = interaction.guild.id, uid = interaction.user.id;
    const rows = eco.getLedger(gid, uid, 10);
    if (!rows.length) return interaction.reply({ content: 'Bạn chưa có giao dịch coin nào.', ephemeral: true });

    const lines = rows.map((r) => {
      const sign = r.amount > 0 ? '＋' : '－';
      const ts = Math.floor(r.createdAt / 1000);
      return `${sign} **${fmt(Math.abs(r.amount))}** · ${SOURCE_LABEL[r.source] || r.source}${r.reason && r.source !== 'admin' ? ` (${r.reason})` : ''} · <t:${ts}:R>`;
    });
    const embed = new EmbedBuilder()
      .setColor(colorFor(eco.getWallet(gid, uid)))
      .setTitle('🧾 Lịch sử coin')
      .setDescription(lines.join('\n'))
      .setFooter({ text: `Số dư hiện tại: ${eco.getWallet(gid, uid).balance} coin` });
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
