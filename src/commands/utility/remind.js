const { SlashCommandBuilder } = require('discord.js');

const UNIT_MS = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };

function parseDuration(input) {
  const match = /^(\d+)(s|m|h|d)$/.exec(input.trim());
  if (!match) return null;
  return Number(match[1]) * UNIT_MS[match[2]];
}

module.exports = {
  group: 'Tiện ích',
  cooldown: 3,
  data: new SlashCommandBuilder()
    .setName('remind')
    .setDescription('Đặt nhắc nhở (ví dụ: 10m, 2h, 1d)')
    .addStringOption(opt => opt.setName('time').setDescription('Thời gian: 10s, 5m, 2h, 1d').setRequired(true))
    .addStringOption(opt => opt.setName('message').setDescription('Nội dung nhắc nhở').setRequired(true)),

  async execute(interaction) {
    const timeStr = interaction.options.getString('time');
    const message = interaction.options.getString('message');
    const ms = parseDuration(timeStr);

    if (!ms || ms > 7 * 86_400_000) {
      return interaction.reply({ content: '❌ Thời gian không hợp lệ. Dùng định dạng như `10s`, `5m`, `2h`, `1d` (tối đa 7d).', ephemeral: true });
    }

    await interaction.reply(`⏰ Đã đặt nhắc nhở sau **${timeStr}**: "${message}"`);

    setTimeout(() => {
      interaction.followUp({ content: `🔔 ${interaction.user}, nhắc nhở: ${message}` }).catch(() => {});
    }, ms);
  }
};
