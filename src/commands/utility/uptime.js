const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../config/config');
const uptime = require('../../monitor/uptime');
const { state } = require('../../monitor/healthState');

const stamp = (ms, style = 'R') => `<t:${Math.floor(ms / 1000)}:${style}>`;

/** Tóm tắt mạng từ lần đo gần nhất (metrics đo mỗi phút); trả về null nếu chưa có số liệu. */
function networkText() {
  try {
    const latest = require('../../monitor/metrics').snapshotLatest();
    const line = (p, label) => (!p ? null : p.ok ? `🟢 ${label}: ${p.ms}ms` : `🔴 ${label}: ${p.error || `HTTP ${p.status}`}`);
    const text = [line(latest.discord, 'Discord API'), line(latest.internet, 'Internet')].filter(Boolean).join('\n');
    return text || null;
  } catch {
    return null;
  }
}

module.exports = {
  cooldown: 5,
  group: 'Tiện ích',
  data: new SlashCommandBuilder()
    .setName('uptime')
    .setDescription('Xem bot đã online được bao lâu'),

  async execute(interaction, client) {
    // Nếu đọc số liệu lưu trong DB bị lỗi thì vẫn trả lời bằng thời gian chạy của phiên hiện tại.
    let u = null;
    try {
      u = uptime.info(client);
    } catch (err) {
      console.error('⚠️  /uptime không đọc được số liệu online đã lưu:', err);
    }

    const ping = Math.round(client.ws.ping);
    const embed = new EmbedBuilder()
      .setColor(config.colors.success)
      .setTitle('⏱️ Thời gian online của bot')
      .setFooter({ text: `Ping ${ping >= 0 ? `${ping}ms` : '–'}` })
      .setTimestamp();

    if (u) {
      embed
        .setDescription(`Bot đã online tổng cộng **${uptime.hours(u.totalOnlineMs)} giờ** (${uptime.formatMs(u.totalOnlineMs)}).`)
        .addFields(
          { name: 'Phiên hiện tại', value: uptime.formatMs(u.processMs, { seconds: true }), inline: true },
          { name: 'Kết nối Discord liên tục', value: u.connectedMs ? uptime.formatMs(u.connectedMs, { seconds: true }) : 'Đang kết nối lại', inline: true },
          { name: 'Số lần khởi động', value: String(u.bootCount), inline: true },
          { name: 'Khởi động gần nhất', value: stamp(u.lastBootAt), inline: true },
          { name: 'Hoạt động từ', value: stamp(u.firstOnlineAt, 'D'), inline: true },
          { name: 'Tự khắc phục', value: `${u.recoveries} lần`, inline: true }
        );
      if (u.lastDisconnectAt) {
        embed.addFields({
          name: 'Lần mất kết nối gần nhất',
          value: `${stamp(u.lastDisconnectAt)}${state.lastDisconnectReason ? `\nLý do: ${state.lastDisconnectReason.slice(0, 200)}` : ''}`,
          inline: false
        });
      }
    } else {
      embed
        .setColor(config.colors.warning)
        .setDescription('Không đọc được tổng thời gian online đã lưu, nhưng bot vẫn đang chạy.')
        .addFields({ name: 'Phiên hiện tại', value: uptime.formatMs(process.uptime() * 1000, { seconds: true }), inline: true });
    }

    const net = networkText();
    if (net) embed.addFields({ name: 'Mạng', value: net, inline: false });

    await interaction.reply({ embeds: [embed] });
  }
};