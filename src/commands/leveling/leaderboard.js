const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../../database/db');
const eco = require('../../database/economy');
const config = require('../../config/config');
const gzw = require('../../config/gzw');

module.exports = {
  group: 'Leveling',
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Bảng xếp hạng trong server')
    .addStringOption((o) => o.setName('loai').setDescription('Loại bảng xếp hạng (mặc định: level)')
      .addChoices({ name: 'Level', value: 'level' }, { name: 'Coin', value: 'coin' })),

  async execute(interaction) {
    const type = interaction.options.getString('loai') || 'level';
    const medals = ['🥇', '🥈', '🥉'];
    let lines;

    if (type === 'coin') {
      const rows = eco.topBalances(interaction.guild.id, 10);
      if (rows.length === 0) return interaction.reply('📉 Chưa có ai có coin trong server này.');
      lines = rows.map((r, i) => `${medals[i] || `**${i + 1}.**`} <@${r.userId}> — ${r.balance.toLocaleString('vi-VN')} ${gzw.currency.emoji}`);
    } else {
      const rows = db.prepare('SELECT * FROM levels WHERE guildId = ? ORDER BY level DESC, xp DESC LIMIT 10').all(interaction.guild.id);
      if (rows.length === 0) return interaction.reply('📉 Chưa có dữ liệu level nào trong server này.');
      lines = rows.map((r, i) => `${medals[i] || `**${i + 1}.**`} <@${r.userId}> — Cấp ${r.level} (${r.xp} XP)`);
    }

    const embed = new EmbedBuilder()
      .setColor(type === 'coin' ? gzw.brandColor : config.colors.primary)
      .setTitle(`🏆 ${type === 'coin' ? 'Bảng xếp hạng Coin' : 'Bảng xếp hạng Level'} — ${interaction.guild.name}`)
      .setDescription(lines.join('\n'));
    await interaction.reply({ embeds: [embed], allowedMentions: { parse: [] } });
  }
};
