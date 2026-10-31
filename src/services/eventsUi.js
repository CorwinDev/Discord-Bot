const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const mgdb = require('../database/management');
const gzw = require('../config/gzw');

function eventEmbed(e) {
  const st = mgdb.eventStats(e.id);
  const color = e.status === 'open' ? gzw.brandColor : e.status === 'finished' ? 0x57f287 : 0x99aab5;
  const emb = new EmbedBuilder().setColor(color).setTitle(`🎉 Sự kiện #${e.id}: ${e.title}${e.status !== 'open' ? ` (${e.status === 'finished' ? 'đã kết thúc' : 'đã huỷ'})` : ''}`)
    .setDescription(e.description || '—')
    .addFields(
      { name: 'Bắt đầu', value: `<t:${Math.floor(e.startsAt / 1000)}:F> (<t:${Math.floor(e.startsAt / 1000)}:R>)` },
      { name: 'Đăng ký', value: `${st.signups}${e.capacity ? `/${e.capacity}` : ''}`, inline: true },
      { name: 'Đã check-in', value: String(st.checkedIn), inline: true },
      { name: 'Ngân sách thưởng', value: e.rewardBudget ? `${e.rewardSpent}/${e.rewardBudget} ${gzw.currency.emoji}` : 'Không có', inline: true }
    );
  return emb;
}
const eventButtons = (e) => new ActionRowBuilder().addComponents(
  new ButtonBuilder().setCustomId(`evt_join_${e.id}`).setLabel('Đăng ký').setEmoji('✅').setStyle(ButtonStyle.Success).setDisabled(e.status !== 'open'),
  new ButtonBuilder().setCustomId(`evt_leave_${e.id}`).setLabel('Huỷ đăng ký').setStyle(ButtonStyle.Secondary).setDisabled(e.status !== 'open')
);

async function refresh(guild, e) {
  if (!e.channelId || !e.messageId) return;
  const ch = guild.channels.cache.get(e.channelId);
  const msg = await ch?.messages?.fetch(e.messageId).catch(() => null);
  msg?.edit({ embeds: [eventEmbed(e)], components: [eventButtons(e)] }).catch(() => {});
}

const WHY = { closed: '❌ Sự kiện đã đóng.', already: 'ℹ️ Bạn đã đăng ký rồi.', full: '❌ Sự kiện đã đủ người.', notjoined: 'ℹ️ Bạn chưa đăng ký.' };

async function handleButton(interaction) {
  const [, action, idStr] = interaction.customId.split('_');
  const gid = interaction.guild.id, id = Number(idStr), uid = interaction.user.id;
  const r = action === 'join' ? mgdb.joinEvent(gid, id, uid) : mgdb.leaveEvent(gid, id, uid);
  if (!r.ok) return interaction.reply({ content: WHY[r.reason] || '❌ Không thực hiện được.', ephemeral: true });
  await interaction.reply({ content: action === 'join' ? '✅ Đã đăng ký tham gia!' : '👋 Đã huỷ đăng ký.', ephemeral: true });
  refresh(interaction.guild, mgdb.getEvent(gid, id));
}

module.exports = { eventEmbed, eventButtons, refresh, handleButton };
