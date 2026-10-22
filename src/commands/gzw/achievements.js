const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const eco = require('../../database/economy');
const { colorFor } = require('../../services/gzwUi');
const gzw = require('../../config/gzw');

module.exports = {
  group: 'GZW CORE',
  cooldown: 5,
  data: new SlashCommandBuilder().setName('achievements').setDescription('Xem thành tích đã đạt và chưa đạt'),

  async execute(interaction) {
    const gid = interaction.guild.id, uid = interaction.user.id;
    const earned = new Set(eco.listAchievements(gid, uid).map((a) => a.achievementId));
    const lines = gzw.achievements.map((a) => {
      const how = a.auto ? a.desc : `${a.desc} (do ban tổ chức trao)`;
      return `${earned.has(a.id) ? '🏅' : '🔒'} **${a.name}** — ${how}${a.reward ? ` · thưởng ${a.reward} ${gzw.currency.emoji}` : ''}`;
    });
    const embed = new EmbedBuilder()
      .setColor(colorFor(eco.getWallet(gid, uid)))
      .setTitle(`🏅 Thành tích (${earned.size}/${gzw.achievements.length})`)
      .setDescription(lines.join('\n'))
      .setFooter({ text: 'Thành tích được lưu vĩnh viễn và không thể mua trong shop' });
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
