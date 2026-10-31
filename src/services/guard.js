const { EmbedBuilder } = require('discord.js');
const db = require('../database/db');
const config = require('../config/config');
const safety = require('../database/safety');
const { StrikeCounter } = require('./guardRules');

const strikes = new StrikeCounter(config.automod.strikeWindowMs);
const LABEL = { mention: 'Tag quá nhiều người', spam: 'Spam tin nhắn', word: 'Từ cấm', invite: 'Link mời server khác' };

function logChannel(guild) {
  const row = db.prepare('SELECT logChannelId FROM guild_settings WHERE guildId = ?').get(guild.id);
  const ch = row?.logChannelId && guild.channels.cache.get(row.logChannelId);
  return ch && ch.isTextBased() ? ch : null;
}
const sendLog = (guild, embed) => logChannel(guild)?.send({ embeds: [embed], allowedMentions: { parse: [] } }).catch(() => {});

/**
 * Xử lý một vi phạm automod: xoá tin, nhắc ngắn, ghi log; đủ số lần trong cửa sổ thời gian thì
 * ghi cảnh cáo + timeout tạm thời (có thể kháng nghị qua ticket).
 */
async function violation(message, kind) {
  const { guild, author } = message;
  await message.delete().catch(() => {});
  const note = await message.channel.send(`⚠️ ${author}, tin nhắn bị gỡ: **${LABEL[kind]}**.`).catch(() => null);
  if (note) setTimeout(() => note.delete().catch(() => {}), 5000);

  const count = strikes.add(`${guild.id}:${author.id}`);
  const fields = [{ name: 'Thành viên', value: `${author} (${author.id})` }, { name: 'Kênh', value: `${message.channel}` }, { name: 'Lần vi phạm', value: `${count}/${config.automod.strikesBeforeTimeout}` }];
  sendLog(guild, new EmbedBuilder().setColor(config.colors.warning).setTitle(`🛡️ Automod — ${LABEL[kind]}`).addFields(fields).setTimestamp());

  if (count >= config.automod.strikesBeforeTimeout) {
    strikes.reset(`${guild.id}:${author.id}`);
    const ms = config.automod.timeoutMinutes * 60000;
    const ok = await message.member?.timeout(ms, `Automod: ${LABEL[kind]} lặp lại`).then(() => true).catch(() => false);
    db.prepare('INSERT INTO warnings (guildId, userId, moderatorId, reason, createdAt) VALUES (?, ?, ?, ?, ?)')
      .run(guild.id, author.id, message.client.user.id, `Automod: ${LABEL[kind]} lặp lại`, Date.now());
    safety.audit(guild.id, message.client.user.id, 'automod.timeout', author.id, `${LABEL[kind]} · ${config.automod.timeoutMinutes} phút · ${ok ? 'đã timeout' : 'không timeout được'}`);
    sendLog(guild, new EmbedBuilder().setColor(config.colors.error ?? 0xef4444).setTitle('⏳ Automod đã timeout thành viên')
      .setDescription(`${author} bị timeout ${config.automod.timeoutMinutes} phút${ok ? '' : ' (bot thiếu quyền hoặc thành viên có quyền cao hơn)'}.`).setTimestamp());
  }
}

module.exports = { logChannel, sendLog, violation };
