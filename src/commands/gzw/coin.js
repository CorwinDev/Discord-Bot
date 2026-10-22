const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const safety = require('../../database/safety');
const tr = require('../../database/transfers');
const { confirmTransfer } = require('../../services/transferUi');
const { coin, fmt } = require('../../services/gzwUi');
const gzw = require('../../config/gzw');

module.exports = {
  group: 'GZW CORE',
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('coin')
    .setDescription('Tặng coin và quản lý tham gia')
    .addSubcommand((s) => s.setName('donate').setDescription('Tặng coin ảo cho thành viên khác')
      .addUserOption((o) => o.setName('user').setDescription('Người nhận').setRequired(true))
      .addIntegerOption((o) => o.setName('so-coin').setDescription('Số coin').setRequired(true).setMinValue(gzw.transfer.minAmount).setMaxValue(gzw.transfer.maxPerTx))
      .addStringOption((o) => o.setName('loi-nhan').setDescription('Lời nhắn (tuỳ chọn)').setMaxLength(100)))
    .addSubcommand((s) => s.setName('limits').setDescription('Xem hạn mức tặng của bạn hôm nay'))
    .addSubcommand((s) => s.setName('pause').setDescription('Tự tạm dừng game và tặng coin (không huỷ sớm được)')
      .addIntegerOption((o) => o.setName('thoi-gian').setDescription('Thời gian tạm dừng').setRequired(true)
        .addChoices(...gzw.selfPauseChoices.map((c) => ({ name: c.name, value: c.hours }))))),

  async execute(interaction) {
    const gid = interaction.guild.id, uid = interaction.user.id;
    const sub = interaction.options.getSubcommand();

    if (sub === 'donate') {
      return confirmTransfer(interaction, {
        toUser: interaction.options.getUser('user'),
        kind: 'coin',
        amount: interaction.options.getInteger('so-coin'),
        context: 'donate',
        note: interaction.options.getString('loi-nhan')
      });
    }

    if (sub === 'limits') {
      const t = tr.sentToday(gid, uid);
      const e = new EmbedBuilder().setColor(gzw.brandColor).setTitle('📊 Hạn mức tặng hôm nay')
        .setDescription([
          `Coin đã gửi: **${fmt(t.coins)}/${fmt(gzw.transfer.dailySentCap)}**`,
          `Lượt tặng: **${t.n}/${gzw.transfer.dailyTxCap}**`,
          `Mỗi giao dịch: ${fmt(gzw.transfer.minAmount)}–${fmt(gzw.transfer.maxPerTx)} coin`,
          `Yêu cầu cấp chat tối thiểu để gửi: ${gzw.transfer.minSenderLevel}`
        ].join('\n'));
      return interaction.reply({ embeds: [e], ephemeral: true });
    }

    if (sub === 'pause') {
      const hours = interaction.options.getInteger('thoi-gian');
      if (!gzw.selfPauseChoices.some((c) => c.hours === hours)) return interaction.reply({ content: '❌ Lựa chọn không hợp lệ.', ephemeral: true });
      const until = safety.setSelfPause(gid, uid, hours);
      return interaction.reply({
        content: `🌙 Bạn đã tạm dừng game, /hunt và tặng coin đến <t:${Math.floor(until / 1000)}:f>. Không thể huỷ sớm — nhờ quản trị nếu có việc gấp.`,
        ephemeral: true
      });
    }
  }
};
