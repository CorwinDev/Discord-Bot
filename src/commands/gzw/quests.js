const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const eco = require('../../database/economy');
const { questLines, colorFor } = require('../../services/gzwUi');

module.exports = {
  group: 'GZW CORE',
  cooldown: 3,
  data: new SlashCommandBuilder().setName('quests').setDescription('Xem nhiệm vụ ngày và tuần của bạn'),

  async execute(interaction) {
    const gid = interaction.guild.id, uid = interaction.user.id;
    const quests = eco.getQuestStatus(gid, uid);
    const embed = new EmbedBuilder()
      .setColor(colorFor(eco.getWallet(gid, uid)))
      .setTitle('📜 Nhiệm vụ')
      .addFields(
        { name: 'Hằng ngày (làm mới 00:00 giờ VN)', value: questLines(quests.filter((q) => q.period === 'daily')).join('\n') },
        { name: 'Hằng tuần (làm mới Thứ Hai)', value: questLines(quests.filter((q) => q.period === 'weekly')).join('\n') }
      )
      .setFooter({ text: 'Thưởng được trả tự động ngay khi hoàn thành' });
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
