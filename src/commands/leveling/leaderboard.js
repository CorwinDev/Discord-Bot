const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../../database/db');
const eco = require('../../database/economy');
const config = require('../../config/config');
const gzw = require('../../config/core');
const { currentPeriodKey, voicePeriodLeaderboard } = require('../../database/activity');

module.exports = {
  group: 'Leveling',
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Bảng xếp hạng trong server')
    .addStringOption((o) => o.setName('loai').setDescription('Loại bảng xếp hạng (mặc định: level)')
      .addChoices(
        { name: 'Level', value: 'level' },
        { name: 'Coin', value: 'coin' },
        { name: 'Chat', value: 'chat' },
        { name: 'Voice', value: 'voice' }
      ))
    .addStringOption((o) => o.setName('ky').setDescription('Kỳ thống kê cho Chat/Voice (mặc định: tổng)')
      .addChoices(
        { name: 'Tổng', value: 'all' },
        { name: 'Hôm nay', value: 'day' },
        { name: 'Tuần này', value: 'week' }
      )),

  async execute(interaction) {
    const type = interaction.options.getString('loai') || 'level';
    const period = interaction.options.getString('ky') || 'all';
    const periodLabel = { all: 'Tổng', day: 'Hôm nay', week: 'Tuần này' }[period] || 'Tổng';
    const medals = ['🥇', '🥈', '🥉'];
    let lines;

    if (type === 'coin') {
      const rows = eco.topBalances(interaction.guild.id, 10);
      if (rows.length === 0) return interaction.reply('📉 Chưa có ai có coin trong server này.');
      lines = rows.map((r, i) => `${medals[i] || `**${i + 1}.**`} <@${r.userId}> — ${r.balance.toLocaleString('vi-VN')} ${gzw.currency.emoji}`);
    } else if (type === 'chat') {
      const rows = period === 'all'
        ? db.prepare('SELECT userId, messageCount FROM chat_activity WHERE guildId = ? ORDER BY messageCount DESC LIMIT 10').all(interaction.guild.id)
        : db.prepare(`SELECT userId, messageCount FROM chat_activity_periods
            WHERE guildId = ? AND periodType = ? AND periodKey = ? ORDER BY messageCount DESC LIMIT 10`)
          .all(interaction.guild.id, period, currentPeriodKey(period));
      if (rows.length === 0) return interaction.reply('📉 Chưa có dữ liệu chat trong server này.');
      lines = rows.map((r, i) => `${medals[i] || `**${i + 1}.**`} <@${r.userId}> — ${r.messageCount.toLocaleString('vi-VN')} tin nhắn`);
    } else if (type === 'voice') {
      const now = Date.now();
      const rows = period === 'all'
        ? db.prepare(`SELECT userId, SUM(milliseconds) AS totalMs FROM (
            SELECT userId, totalMs AS milliseconds FROM voice_totals WHERE guildId = ?
            UNION ALL
            SELECT userId, MAX(0, ? - joinedAt) AS milliseconds FROM voice_sessions WHERE guildId = ?
          ) GROUP BY userId ORDER BY totalMs DESC LIMIT 10`).all(interaction.guild.id, now, interaction.guild.id)
        : voicePeriodLeaderboard(interaction.guild.id, period, currentPeriodKey(period), now);
      if (rows.length === 0) return interaction.reply('📉 Chưa có dữ liệu voice trong server này.');
      lines = rows.map((r, i) => `${medals[i] || `**${i + 1}.**`} <@${r.userId}> — ${(r.totalMs / 3600000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} giờ`);
    } else {
      const rows = db.prepare('SELECT * FROM levels WHERE guildId = ? ORDER BY level DESC, xp DESC LIMIT 10').all(interaction.guild.id);
      if (rows.length === 0) return interaction.reply('📉 Chưa có dữ liệu level nào trong server này.');
      lines = rows.map((r, i) => `${medals[i] || `**${i + 1}.**`} <@${r.userId}> — Cấp ${r.level} (${r.xp} XP)`);
    }

    const embed = new EmbedBuilder()
      .setColor(type === 'coin' ? gzw.brandColor : config.colors.primary)
      .setTitle(`🏆 ${({ coin: 'Coin', chat: `Chat · ${periodLabel}`, voice: `Voice · ${periodLabel}`, level: 'Level' })[type]} — ${interaction.guild.name}`)
      .setDescription(lines.join('\n'));
    await interaction.reply({ embeds: [embed], allowedMentions: { parse: [] } });
  }
};
