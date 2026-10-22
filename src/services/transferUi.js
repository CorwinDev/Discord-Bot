const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const tr = require('../database/transfers');
const eco = require('../database/economy');
const safety = require('../database/safety');
const gzw = require('../config/gzw');
const { coin } = require('./gzwUi');
const { checkAutoAchievements } = require('./gzwCore');

/**
 * Hiện bảng xác nhận (người gửi, người nhận, nội dung) rồi mới thực hiện giao dịch.
 * kind 'coin': { amount } · kind 'item': { itemId, mode }
 * `interaction` có thể là slash command hoặc nút bấm (trả lời ephemeral).
 */
async function confirmTransfer(interaction, { toUser, kind, amount, itemId, mode, context, note, announce = true }) {
  const gid = interaction.guild.id, uid = interaction.user.id;

  const blocked = safety.gate(gid, uid, 'transfer', true);
  if (blocked) return interaction.reply({ content: blocked, ephemeral: true });
  if (toUser.bot) return interaction.reply({ content: '❌ Không thể tặng cho bot.', ephemeral: true });
  if (safety.selfPauseUntil(gid, toUser.id)) {
    return interaction.reply({ content: '🌙 Người nhận đang tạm dừng tham gia, hãy thử lại sau.', ephemeral: true });
  }

  const item = kind === 'item' ? eco.findItem(itemId) : null;
  // Kiểm tra sơ bộ để báo lỗi sớm (kiểm tra thật nằm trong transaction khi bấm xác nhận)
  const pre = tr.checkLimits(gid, uid, toUser.id, kind === 'coin' ? amount : 0);
  if (!pre.ok) return interaction.reply({ content: tr.reasonText(pre), ephemeral: true });

  const what = kind === 'coin' ? `**${coin(amount)}**`
    : `${item.emoji} **${item.name}**${mode === 'shop' ? ` (mua từ shop, giá ${coin(item.price)})` : ' (từ kho của bạn)'}`;
  const embed = new EmbedBuilder().setColor(gzw.brandColor).setTitle('🎁 Xác nhận giao dịch')
    .setDescription(`**Người gửi:** ${interaction.user}\n**Người nhận:** ${toUser}\n**Nội dung:** ${what}${note ? `\n**Lời nhắn:** ${note}` : ''}\n\nGiao dịch **không tự thu hồi** sau khi xác nhận.`);
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('tx_confirm').setLabel('Xác nhận').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('tx_cancel').setLabel('Huỷ').setStyle(ButtonStyle.Secondary)
  );
  await interaction.reply({ embeds: [embed], components: [row], ephemeral: true, allowedMentions: { parse: [] } });
  const message = await interaction.fetchReply();

  const collector = message.createMessageComponentCollector({ filter: (i) => i.user.id === uid, time: 45000, max: 1 });
  collector.on('collect', async (i) => {
    if (i.customId === 'tx_cancel') return i.update({ content: 'Đã huỷ.', embeds: [], components: [] });
    const gate2 = safety.gate(gid, uid, 'transfer', true);
    if (gate2) return i.update({ content: gate2, embeds: [], components: [] });

    const res = kind === 'coin'
      ? tr.transferCoins(gid, uid, toUser.id, amount, context, note)
      : tr.transferItem(gid, uid, toUser.id, itemId, mode, note);
    if (!res.ok) return i.update({ content: tr.reasonText(res), embeds: [], components: [] });

    await i.update({
      content: `✅ Đã gửi ${kind === 'coin' ? coin(amount) : `${item.emoji} ${item.name}`} cho ${toUser}. Mã giao dịch: \`${res.txId}\``,
      embeds: [], components: [], allowedMentions: { parse: [] }
    });
    if (announce) {
      interaction.channel?.send({
        content: `🎁 ${interaction.user} đã tặng ${toUser} ${kind === 'coin' ? `**${coin(amount)}**` : `${item.emoji} **${item.name}**`}${note ? ` — “${note}”` : ''}`,
        allowedMentions: { users: [toUser.id] }
      }).catch(() => {});
    }
    checkAutoAchievements(interaction.guild, uid).catch(() => {});
  });
  collector.on('end', (c) => {
    if (c.size === 0) interaction.editReply({ content: '⌛ Hết thời gian xác nhận.', embeds: [], components: [] }).catch(() => {});
  });
}

module.exports = { confirmTransfer };
