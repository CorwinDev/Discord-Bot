const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const db = require('../database/db');
const mg = require('../config/management');

/** Kênh log nhân sự: theo tên trong config, hoặc kênh log đã cấu hình trong guild_settings. */
function modLogChannel(guild, name = mg.channels.modLog) {
  const byName = guild.channels.cache.find((c) => c.name === name && c.isTextBased());
  if (byName) return byName;
  const row = db.prepare('SELECT logChannelId FROM guild_settings WHERE guildId = ?').get(guild.id);
  return row?.logChannelId ? guild.channels.cache.get(row.logChannelId) ?? null : null;
}
const logToStaff = (guild, payload) => modLogChannel(guild)?.send({ allowedMentions: { parse: [] }, ...payload }).catch(() => {});

/**
 * Hỏi xác nhận cho thao tác ảnh hưởng lớn. Trả về { btn } nếu xác nhận (chưa trả lời btn — caller update),
 * hoặc null nếu huỷ / hết giờ (đã tự phản hồi).
 */
async function confirmAction(interaction, text) {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('act_yes').setLabel('Xác nhận').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('act_no').setLabel('Huỷ').setStyle(ButtonStyle.Secondary)
  );
  await interaction.reply({ content: `⚠️ ${text}`, components: [row], ephemeral: true, allowedMentions: { parse: [] } });
  const msg = await interaction.fetchReply();
  try {
    const btn = await msg.awaitMessageComponent({ filter: (i) => i.user.id === interaction.user.id, time: 30000 });
    if (btn.customId === 'act_no') { await btn.update({ content: 'Đã huỷ.', components: [] }); return null; }
    return { btn };
  } catch {
    await interaction.editReply({ content: '⌛ Hết thời gian xác nhận.', components: [] }).catch(() => {});
    return null;
  }
}

async function dmUser(user, content) {
  return user.send({ content }).then(() => true).catch(() => false);
}

module.exports = { modLogChannel, logToStaff, confirmAction, dmUser };
