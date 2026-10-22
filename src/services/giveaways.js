const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const db = require('../database/db');
const gzw = require('../config/gzw');

const ts = (ms) => `<t:${Math.floor(ms / 1000)}:R>`;
const entryCount = (id) => db.prepare('SELECT COUNT(*) AS n FROM giveaway_entries WHERE giveawayId = ?').get(id).n;

function buildMessage(g, ended = false) {
  const n = entryCount(g.id);
  const winners = g.winnerIds ? JSON.parse(g.winnerIds) : [];
  const embed = new EmbedBuilder().setColor(gzw.brandColor).setTitle(`🎉 ${g.prize}`)
    .setDescription(
      ended
        ? (winners.length ? `Người thắng: ${winners.map((w) => `<@${w}>`).join(', ')}` : 'Không có người tham gia hợp lệ.')
        : `Bấm nút bên dưới để tham gia!\nKết thúc: ${ts(g.endsAt)}\nSố người thắng: **${g.winners}**`
    )
    .setFooter({ text: `Tổ chức bởi ${g.hostId} · ${n} người tham gia · ID #${g.id}` });
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`gw_join_${g.id}`).setLabel(ended ? 'Đã kết thúc' : 'Tham gia 🎉').setStyle(ButtonStyle.Primary).setDisabled(ended)
  );
  return { embeds: [embed], components: [row] };
}

/** Bốc thăm ngẫu nhiên bằng crypto để không thể đoán trước. */
function pickWinners(userIds, count) {
  const crypto = require('crypto');
  const pool = [...userIds];
  const out = [];
  while (out.length < count && pool.length) out.push(pool.splice(crypto.randomInt(pool.length), 1)[0]);
  return out;
}

async function refreshMessage(client, g, ended) {
  const ch = await client.channels.fetch(g.channelId).catch(() => null);
  const msg = ch && g.messageId ? await ch.messages.fetch(g.messageId).catch(() => null) : null;
  if (msg) await msg.edit(buildMessage(g, ended)).catch(() => {});
  return ch;
}

/** Kết thúc giveaway (idempotent: chỉ chạy được khi còn RUNNING). */
async function endGiveaway(client, id) {
  const claimed = db.prepare("UPDATE giveaways SET status = 'ENDED' WHERE id = ? AND status = 'RUNNING'").run(id).changes;
  if (!claimed) return null;
  const g = db.prepare('SELECT * FROM giveaways WHERE id = ?').get(id);
  const entrants = db.prepare('SELECT userId FROM giveaway_entries WHERE giveawayId = ?').all(id).map((r) => r.userId);
  const winners = pickWinners(entrants, g.winners);
  db.prepare('UPDATE giveaways SET winnerIds = ? WHERE id = ?').run(JSON.stringify(winners), id);
  g.winnerIds = JSON.stringify(winners);
  const ch = await refreshMessage(client, g, true);
  if (ch) {
    await ch.send({
      content: winners.length ? `🎊 Chúc mừng ${winners.map((w) => `<@${w}>`).join(', ')} đã thắng **${g.prize}**! Liên hệ <@${g.hostId}> để nhận thưởng.` : `😢 Giveaway **${g.prize}** kết thúc mà không có ai tham gia.`,
      allowedMentions: { users: winners }
    }).catch(() => {});
  }
  return { g, winners };
}

/** Quét giveaway đến hạn (chịu được việc bot tắt/khởi động lại, không phụ thuộc setTimeout dài). */
function startScheduler(client) {
  const tick = () => {
    const due = db.prepare("SELECT id FROM giveaways WHERE status = 'RUNNING' AND endsAt <= ?").all(Date.now());
    for (const { id } of due) endGiveaway(client, id).catch((e) => console.error('⚠️  endGiveaway:', e));
  };
  tick();
  return setInterval(tick, 15000);
}

module.exports = { buildMessage, endGiveaway, pickWinners, startScheduler, entryCount, refreshMessage };
