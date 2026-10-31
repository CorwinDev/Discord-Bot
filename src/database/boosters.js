const db = require('./db');
const eco = require('./economy');
const gzw = require('../config/gzw');

const cfg = gzw.booster;
const now = () => Date.now();

/* ============ Chính sách thưởng (do admin cấu hình) ============ */
/** Chính sách hiện hành: giá trị admin đã đặt trong DB, nếu chưa có thì dùng mặc định trong config. */
function getPolicy(guildId) {
  const row = db.prepare('SELECT * FROM booster_policy WHERE guildId = ?').get(guildId);
  const coins = Math.min(row ? row.coinsPerBoost : cfg.defaultRewardPerBoost, cfg.maxRewardPerBoost);
  const enabled = row ? !!row.enabled : true;
  return { coins, enabled: enabled && coins > 0, configured: !!row, rawEnabled: enabled };
}

function setPolicy(guildId, adminId, { coins = null, enabled = null }) {
  const cur = getPolicy(guildId);
  const nextCoins = coins ?? cur.coins;
  if (!Number.isInteger(nextCoins) || nextCoins < 0 || nextCoins > cfg.maxRewardPerBoost) return { ok: false, reason: 'range' };
  const nextEnabled = enabled ?? cur.rawEnabled;
  db.prepare(`INSERT INTO booster_policy (guildId, coinsPerBoost, enabled, updatedBy, updatedAt) VALUES (?, ?, ?, ?, ?)
              ON CONFLICT (guildId) DO UPDATE SET coinsPerBoost = excluded.coinsPerBoost, enabled = excluded.enabled,
                updatedBy = excluded.updatedBy, updatedAt = excluded.updatedAt`)
    .run(guildId, nextCoins, nextEnabled ? 1 : 0, adminId, now());
  return { ok: true, policy: getPolicy(guildId) };
}

/* ============ Ghi nhận sự kiện Boost ============ */
/**
 * Ghi nhận MỘT sự kiện Boost đã được Discord xác nhận.
 *  key    : mã sự kiện duy nhất (ID tin nhắn hệ thống, hoặc `start:<userId>:<premiumSince>`) -> không bao giờ ghi/thưởng hai lần.
 *  source : 'message' | 'start'.
 * Một lượt Boost mới thường tạo cả tin nhắn hệ thống lẫn thay đổi premiumSince. Hai tín hiệu của cùng người trong
 * `linkWindowSeconds` được coi là CÙNG sự kiện: tín hiệu đến sau chỉ được ghi LINKED, không thưởng thêm.
 */
const recordBoost = db.transaction((guildId, userId, key, source) => {
  if (db.prepare('SELECT 1 FROM boost_events WHERE messageId = ?').get(key)) return { ok: false, duplicate: true };

  const twinSource = source === 'message' ? 'start' : 'message';
  const twin = db.prepare(`
    SELECT e.* FROM boost_events e
    WHERE e.guildId = ? AND e.userId = ? AND e.source = ? AND e.status != 'LINKED' AND e.createdAt >= ?
      AND NOT EXISTS (SELECT 1 FROM boost_events l WHERE l.linkedTo = e.id)
    ORDER BY e.id DESC LIMIT 1`).get(guildId, userId, twinSource, now() - cfg.linkWindowSeconds * 1000);
  if (twin) {
    db.prepare("INSERT INTO boost_events (guildId, userId, messageId, source, status, coins, linkedTo, createdAt) VALUES (?, ?, ?, ?, 'LINKED', 0, ?, ?)")
      .run(guildId, userId, key, source, twin.id, now());
    return { ok: false, linked: true };
  }

  const policy = getPolicy(guildId);
  const coins = policy.enabled ? policy.coins : 0;
  const status = coins > 0 ? 'REWARDED' : 'PENDING';
  const info = db.prepare('INSERT INTO boost_events (guildId, userId, messageId, source, status, coins, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(guildId, userId, key, source, status, coins, now());

  let balance = null;
  if (status === 'REWARDED') {
    balance = eco.addCoins(guildId, userId, coins, 'booster', `Boost ${key}`, `boost:${key}`).balance;
  }
  return { ok: true, id: Number(info.lastInsertRowid), status, coins, balance };
});

/** Admin trao thưởng cho sự kiện đã ghi nhận nhưng chưa được thưởng (PENDING), theo chính sách hiện hành. */
const grantBoost = db.transaction((guildId, eventId, adminId) => {
  const ev = db.prepare('SELECT * FROM boost_events WHERE id = ? AND guildId = ?').get(eventId, guildId);
  if (!ev) return { ok: false, reason: 'notfound' };
  if (ev.status !== 'PENDING') return { ok: false, reason: 'done', ev };
  if (ev.userId === adminId) return { ok: false, reason: 'self' };
  const policy = getPolicy(guildId);
  if (!policy.enabled) return { ok: false, reason: 'policy' };

  db.prepare("UPDATE boost_events SET status = 'REWARDED', coins = ?, approvedBy = ? WHERE id = ?").run(policy.coins, adminId, ev.id);
  const res = eco.addCoins(guildId, ev.userId, policy.coins, 'booster', `Boost ${ev.messageId}`, `boost:${ev.messageId}`);
  return { ok: true, ev, coins: policy.coins, balance: res.balance };
});

const listPending = (guildId, limit = 15) =>
  db.prepare("SELECT * FROM boost_events WHERE guildId = ? AND status = 'PENDING' ORDER BY id LIMIT ?").all(guildId, limit);
const listUser = (guildId, userId, limit = 10) =>
  db.prepare("SELECT * FROM boost_events WHERE guildId = ? AND userId = ? AND status != 'LINKED' ORDER BY id DESC LIMIT ?").all(guildId, userId, limit);

/* ============ Trạng thái Boost & vật phẩm độc quyền ============ */
function markBoosting(guildId, userId) {
  db.prepare(
    `INSERT INTO booster_status (guildId, userId, active, since) VALUES (?, ?, 1, ?)
     ON CONFLICT (guildId, userId) DO UPDATE SET active = 1, endedAt = NULL,
       since = CASE WHEN active = 1 THEN since ELSE excluded.since END`
  ).run(guildId, userId, now());
}
function markEnded(guildId, userId) {
  db.prepare('UPDATE booster_status SET active = 0, endedAt = ? WHERE guildId = ? AND userId = ? AND active = 1').run(now(), guildId, userId);
}
const getStatus = (guildId, userId) =>
  db.prepare('SELECT * FROM booster_status WHERE guildId = ? AND userId = ?').get(guildId, userId);

/** Cấp khung / danh hiệu độc quyền vào kho (không trùng). */
function grantPerkItems(guildId, userId) {
  const ins = db.prepare('INSERT OR IGNORE INTO inventory (guildId, userId, itemId, acquiredAt) VALUES (?, ?, ?, ?)');
  for (const it of cfg.perkItems) ins.run(guildId, userId, it.id, now());
}
/** Gỡ vật phẩm độc quyền khỏi kho và bỏ trang bị khi ngừng Boost. Coin và huy hiệu lịch sử không bị đụng tới. */
const revokePerkItems = db.transaction((guildId, userId) => {
  for (const it of cfg.perkItems) {
    db.prepare('DELETE FROM inventory WHERE guildId = ? AND userId = ? AND itemId = ?').run(guildId, userId, it.id);
    db.prepare('UPDATE wallets SET equippedTitle = NULL WHERE guildId = ? AND userId = ? AND equippedTitle = ?').run(guildId, userId, it.id);
    db.prepare('UPDATE wallets SET equippedFrame = NULL WHERE guildId = ? AND userId = ? AND equippedFrame = ?').run(guildId, userId, it.id);
  }
});

module.exports = {
  getPolicy, setPolicy, recordBoost, grantBoost, listPending, listUser,
  markBoosting, markEnded, getStatus, grantPerkItems, revokePerkItems
};
