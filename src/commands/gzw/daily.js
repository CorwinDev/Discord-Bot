const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const eco = require('../../database/economy');
const { coin, colorFor, fmt } = require('../../services/gzwUi');
const { checkAutoAchievements } = require('../../services/gzwCore');
const gzw = require('../../config/gzw');

module.exports = {
  group: 'GZW CORE',
  cooldown: 3,
  data: new SlashCommandBuilder().setName('daily').setDescription('Nhận thưởng coin mỗi ngày (liên tiếp để có thêm bonus)'),

  async execute(interaction) {
    const gid = interaction.guild.id, uid = interaction.user.id;
    const res = eco.claimDaily(gid, uid);

    if (!res.ok) {
      const w = eco.getWallet(gid, uid);
      return interaction.reply({
        content: `⏳ Bạn đã nhận thưởng hôm nay rồi (chuỗi hiện tại: **${w.streak} ngày**). Quay lại vào ngày mai nhé.`,
        ephemeral: true
      });
    }

    const embed = new EmbedBuilder()
      .setColor(colorFor(eco.getWallet(gid, uid)))
      .setTitle('🎁 Thưởng hằng ngày')
      .setDescription(`Bạn nhận được **${coin(res.reward)}**\nChuỗi liên tiếp: **${res.streak} ngày** · Số dư: **${coin(res.balance)}**`);

    if (res.completedQuests.length) {
      embed.addFields({
        name: 'Nhiệm vụ hoàn thành',
        value: res.completedQuests.map((q) => `✅ ${q.name} · +${fmt(q.reward)} ${gzw.currency.emoji}`).join('\n')
      });
    }

    const earned = await checkAutoAchievements(interaction.guild, uid);
    if (earned.length) embed.addFields({ name: 'Thành tích mới', value: earned.map((a) => `🏅 ${a.name}`).join('\n') });

    await interaction.reply({ embeds: [embed] });
  }
};
