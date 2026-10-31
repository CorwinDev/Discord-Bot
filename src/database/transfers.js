const crypto = require('crypto');
const db = require('./db');
const gzw = require('../config/gzw');
const eco = require('./economy');

const newTxId = () => `TX-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
const T = gzw.transfer;

/** Kiểm tra hạn mức & luật chống farm. Gọi bên trong transaction để số liệu khớp lúc ghi. */
function checkLimits(guildId, fromId, toId, coinAmount) {
  if (fromId === toId) return { ok: false, reason: 'self' };
  if (eco.playerLevel(guildId, fromId) < T.minSenderLevel) return { ok: false, reason: 'newbie', need: T.minSenderLevel };

  const start = eco.dayStartMs(eco.dayKey());
  const day = db.prepare(
    "SELECT COUNT(*) AS n, COALESCE(SUM(CASE WHEN kind = 'coin' THEN amount ELSE 0 END), 0) AS coins FROM transfers WHERE guildId = ? AND fromId = ? AND createdAt >= ?"
  ).get(guildId, fromId, start);
  if (day.n >= T.dailyTxCap) return { ok: false, reason: 'txcap' };
  if (coinAmount > 0 && day.coins + coinAmount > T.dailySentCap) {
    return { ok: false, reason: 'coincap', remaining: Math.max(0, T.dailySentCap - day.coins) };
  }

  // Chống chuyển qua lại: người nhận đã gửi cho người gửi trong cửa sổ thời gian
  const since = Date.now() - T.reciprocalWindowHours * 3600000;
  const back = db.prepare('SELECT 1 FROM transfers WHERE guildId = ? AND fromId = ? AND toId = ? AND createdAt >= ? LIMIT 1')
    .get(guildId, toId, fromId, since);
  if (back) return { ok: false, reason: 'reciprocal' };
  return { ok: true };
}

/** Chuyển coin: trừ người gửi, cộng người nhận, ghi transfers — tất cả trong một transaction. */
const transferCoins = db.transaction((guildId, fromId, toId, amount, context = 'donate', note = null) => {
  if (!Number.isInteger(amount) || amount < T.minAmount) return { ok: false, reason: 'min', min: T.minAmount };
  if (amount > T.maxPerTx) return { ok: false, reason: 'max', max: T.maxPerTx };
  const lim = checkLimits(guildId, fromId, toId, amount);
  if (!lim.ok) return lim;

  const txId = newTxId();
  const out = eco.spendCoins(guildId, fromId, amount, 'donate_out', `${txId} → ${toId}`);
  if (!out.ok) return { ok: false, reason: 'funds', balance: out.balance };
  eco.addCoins(guildId, toId, amount, 'donate_in', `${txId} ← ${fromId}`);
  db.prepare('INSERT INTO transfers (txId, guildId, fromId, toId, kind, amount, context, note, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .run(txId, guildId, fromId, toId, 'coin', amount, context, note ? String(note).slice(0, 100) : null, Date.now());
  return { ok: true, txId, balance: out.balance };
});

/**
 * Tặng vật phẩm.
 * mode 'inventory': lấy từ kho người gửi (phải sở hữu, item.tradable).
 * mode 'shop': người gửi trả giá shop, vật phẩm vào thẳng kho người nhận.
 */
const transferItem = db.transaction((guildId, fromId, toId, itemId, mode, note = null) => {
  const item = eco.findItem(itemId);
  if (!item) return { ok: false, reason: 'notfound' };
  if (!item.tradable) return { ok: false, reason: 'untradable', item };
  if (eco.owns(guildId, toId, itemId)) return { ok: false, reason: 'recipient_owns', item };

  const lim = checkLimits(guildId, fromId, toId, 0);
  if (!lim.ok) return lim;

  const txId = newTxId();
  let balance = null;
  if (mode === 'shop') {
    const spent = eco.spendCoins(guildId, fromId, item.price, 'gift_shop', `${txId} ${itemId} → ${toId}`);
    if (!spent.ok) return { ok: false, reason: 'funds', item, balance: spent.balance };
    balance = spent.balance;
  } else {
    if (!eco.owns(guildId, fromId, itemId)) return { ok: false, reason: 'notowned', item };
    db.prepare('DELETE FROM inventory WHERE guildId = ? AND userId = ? AND itemId = ?').run(guildId, fromId, itemId);
    db.prepare('UPDATE wallets SET equippedTitle = NULL WHERE guildId = ? AND userId = ? AND equippedTitle = ?').run(guildId, fromId, itemId);
    db.prepare('UPDATE wallets SET equippedFrame = NULL WHERE guildId = ? AND userId = ? AND equippedFrame = ?').run(guildId, fromId, itemId);
  }
  db.prepare('INSERT INTO inventory (guildId, userId, itemId, acquiredAt) VALUES (?, ?, ?, ?)').run(guildId, toId, itemId, Date.now());
  db.prepare('INSERT INTO transfers (txId, guildId, fromId, toId, kind, amount, itemId, context, note, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .run(txId, guildId, fromId, toId, 'item', mode === 'shop' ? item.price : 0, itemId, 'gift', note ? String(note).slice(0, 100) : null, Date.now());
  return { ok: true, txId, item, balance };
});

const getTransfer = (guildId, txId) =>
  db.prepare('SELECT * FROM transfers WHERE guildId = ? AND txId = ?').get(guildId, String(txId).trim().toUpperCase());

const sentToday = (guildId, userId) => {
  const start = eco.dayStartMs(eco.dayKey());
  return db.prepare(
    "SELECT COUNT(*) AS n, COALESCE(SUM(CASE WHEN kind = 'coin' THEN amount ELSE 0 END), 0) AS coins FROM transfers WHERE guildId = ? AND fromId = ? AND createdAt >= ?"
  ).get(guildId, userId, start);
};

const REASON_TEXT = (r) => ({
  self: '❌ Bạn không thể tự tặng cho chính mình.',
  newbie: `❌ Cần đạt cấp chat **${r.need}** trở lên mới được tặng (chống tài khoản phụ).`,
  txcap: `❌ Bạn đã dùng hết **${T.dailyTxCap}** lượt tặng hôm nay.`,
  coincap: `❌ Vượt hạn mức coin gửi mỗi ngày (còn **${r.remaining}** coin hôm nay).`,
  reciprocal: `❌ Người này vừa tặng bạn trong ${T.reciprocalWindowHours}h qua — để tránh chuyển qua lại, hãy thử lại sau.`,
  min: `❌ Tối thiểu **${r.min}** coin mỗi giao dịch.`,
  max: `❌ Tối đa **${r.max}** coin mỗi giao dịch.`,
  funds: '❌ Bạn không đủ coin.',
  notfound: '❌ Không tìm thấy vật phẩm.',
  untradable: '❌ Vật phẩm này không thể chuyển tặng.',
  recipient_owns: '❌ Người nhận đã sở hữu vật phẩm này.',
  notowned: '❌ Bạn không sở hữu vật phẩm này trong kho.'
}[r.reason] || '❌ Giao dịch không hợp lệ.');

module.exports = { transferCoins, transferItem, getTransfer, sentToday, checkLimits, reasonText: REASON_TEXT };
