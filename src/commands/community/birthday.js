const { SlashCommandBuilder } = require('discord.js');
const db = require('../../database/db');

const DAYS = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

module.exports = {
  group: 'Cộng đồng',
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('birthday')
    .setDescription('Sinh nhật: bot sẽ chúc mừng bạn trong kênh sinh nhật')
    .setDMPermission(false)
    .addSubcommand((s) => s.setName('set').setDescription('Đặt ngày sinh (chỉ ngày/tháng, không lưu năm)')
      .addIntegerOption((o) => o.setName('ngay').setDescription('Ngày').setRequired(true).setMinValue(1).setMaxValue(31))
      .addIntegerOption((o) => o.setName('thang').setDescription('Tháng').setRequired(true).setMinValue(1).setMaxValue(12)))
    .addSubcommand((s) => s.setName('remove').setDescription('Xoá ngày sinh đã đặt'))
    .addSubcommand((s) => s.setName('upcoming').setDescription('Sinh nhật sắp tới trong server')),

  async execute(interaction) {
    const gid = interaction.guild.id, uid = interaction.user.id;
    const sub = interaction.options.getSubcommand();
    if (sub === 'set') {
      const day = interaction.options.getInteger('ngay'), month = interaction.options.getInteger('thang');
      if (day > DAYS[month - 1]) return interaction.reply({ content: '❌ Ngày không hợp lệ với tháng đã chọn.', ephemeral: true });
      db.prepare(`INSERT INTO birthdays (guildId, userId, day, month) VALUES (?, ?, ?, ?)
                  ON CONFLICT (guildId, userId) DO UPDATE SET day = excluded.day, month = excluded.month, lastAnnouncedYear = 0`).run(gid, uid, day, month);
      return interaction.reply({ content: `🎂 Đã lưu sinh nhật của bạn: **${day}/${month}**. Chỉ lưu ngày và tháng.`, ephemeral: true });
    }
    if (sub === 'remove') {
      const n = db.prepare('DELETE FROM birthdays WHERE guildId = ? AND userId = ?').run(gid, uid).changes;
      return interaction.reply({ content: n ? '✅ Đã xoá ngày sinh của bạn.' : 'ℹ️ Bạn chưa đặt ngày sinh.', ephemeral: true });
    }
    const now = new Date(Date.now() + 7 * 3600000); // UTC+7
    const today = (now.getUTCMonth() + 1) * 100 + now.getUTCDate();
    const rows = db.prepare('SELECT * FROM birthdays WHERE guildId = ?').all(gid)
      .map((r) => ({ ...r, key: r.month * 100 + r.day }))
      .map((r) => ({ ...r, order: r.key >= today ? r.key : r.key + 1300 }))
      .sort((a, b) => a.order - b.order).slice(0, 10);
    return interaction.reply({
      content: rows.length ? rows.map((r) => `🎂 <@${r.userId}> — ${r.day}/${r.month}`).join('\n') : 'Chưa có ai đặt sinh nhật.',
      ephemeral: true, allowedMentions: { parse: [] }
    });
  }
};
