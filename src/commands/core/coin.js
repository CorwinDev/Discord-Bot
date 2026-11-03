const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const safety = require('../../database/safety');
const tr = require('../../database/transfers');
const { fmt } = require('../../services/coreUi');
const gzw = require('../../config/core');

module.exports = {
  group: 'GZW CORE',
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('coin')
    .setDescription('Quản lý giới hạn quà và tham gia')
    .addSubcommand((s) => s.setName('limits').setDescription('Xem hạn mức tặng vật phẩm hôm nay'))
    .addSubcommand((s) => s.setName('pause').setDescription('Tự tạm dừng game và tặng vật phẩm (không huỷ sớm được)')
      .addIntegerOption((o) => o.setName('thoi-gian').setDescription('Thời gian tạm dừng').setRequired(true)
        .addChoices(...gzw.selfPauseChoices.map((c) => ({ name: c.name, value: c.hours }))))),

  async execute(interaction) {
    const gid = interaction.guild.id, uid = interaction.user.id;
    const sub = interaction.options.getSubcommand();

    if (sub === 'limits') {
      const t = tr.sentToday(gid, uid);
      const e = new EmbedBuilder().setColor(gzw.brandColor).setTitle('📊 Hạn mức tặng vật phẩm hôm nay')
        .setDescription([
          `Lượt tặng đã dùng: **${t.n}/${gzw.transfer.dailyTxCap}**`,
          `Yêu cầu cấp chat tối thiểu: ${gzw.transfer.minSenderLevel}`
        ].join('\n'));
      return interaction.reply({ embeds: [e], ephemeral: true });
    }

    if (sub === 'pause') {
      const hours = interaction.options.getInteger('thoi-gian');
      if (!gzw.selfPauseChoices.some((c) => c.hours === hours)) return interaction.reply({ content: '❌ Lựa chọn không hợp lệ.', ephemeral: true });
      const until = safety.setSelfPause(gid, uid, hours);
      return interaction.reply({
        content: `🌙 Bạn đã tạm dừng game, /hunt và tặng vật phẩm đến <t:${Math.floor(until / 1000)}:f>. Không thể huỷ sớm — nhờ quản trị nếu có việc gấp.`,
        ephemeral: true
      });
    }
  }
};
