const gzw = require('../config/gzw');
const eco = require('../database/economy');

const fmt = (n) => Number(n).toLocaleString('vi-VN');
const coin = (n) => `${fmt(n)} ${gzw.currency.emoji}`;

/** Màu embed = màu khung hồ sơ đang trang bị, mặc định tím GZW. */
function colorFor(wallet) {
  const frame = wallet?.equippedFrame && eco.findItem(wallet.equippedFrame);
  return frame?.color ?? gzw.brandColor;
}

function questLines(quests) {
  return quests.map((q) => {
    const bar = q.completed ? '✅' : `${q.progress}/${q.target}`;
    return `${q.completed ? '✅' : '▫️'} ${q.name} — **${bar}** · +${q.reward} ${gzw.currency.emoji}`;
  });
}

module.exports = { fmt, coin, colorFor, questLines };
