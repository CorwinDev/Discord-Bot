const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../config/config');
const uptime = require('../../monitor/uptime');

module.exports = {
  cooldown: 5,
  group: 'Tiện ích',
  data: new SlashCommandBuilder()
    .setName('uptime')
    .setDescription('Xem bot đã online được bao lâu'),

  async execute(interaction, client) {
    const u = uptime.info(client);
    const since = (ms) => `<t:${Math.floor(ms / 1000)}:R>`;

    const embed = new EmbedBuilder()
      .setColor(config.colors.success)
      .setTitle('⏱️ Thời gian online của bot')
      .setDescription(`Bot đã online tổng cộng **${uptime.hours(u.totalOnlineMs)} giờ** (${uptime.formatMs(u.totalOnlineMs)}).`)
      .addFields(
        { name: 'Phiên hiện tại', value: uptime.formatMs(u.processMs, { seconds: true }), inline: true },
        { name: 'Kết nối Discord liên tục', value: u.connectedMs ? uptime.formatMs(u.connectedMs, { seconds: true }) : 'Đang kết nối lại', inline: true },
        { name: 'Số lần khởi động', value: String(u.bootCount), inline: true },
        { name: 'Khởi động gần nhất', value: since(u.lastBootAt), inline: true },
        { name: 'Hoạt động từ', value: `<t:${Math.floor(u.firstOnlineAt / 1000)}:D>`, inline: true },
        { name: 'Tự khắc phục', value: `${u.recoveries} lần`, inline: true }
      )
      .setFooter({ text: `Ping ${Math.round(client.ws.ping)}ms` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};