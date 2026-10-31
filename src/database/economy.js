const db = require('./db');
const gzw = require('../config/gzw');

/* ============ Thời gian: chia ngày/tuần theo múi giờ cấu hình ============ */
const DAY_MS = 86400000;
const OFFSET_MS = gzw.utcOffsetHours * 3600000;
const dayKey = (t = Date.now()) => Math.floor((t + OFFSET_MS) / DAY_MS);
const weekKey = (t = Date.now()) => Math.floor((dayKey(t) + 3) / 7); // tuần bắt đầu thứ Hai
const dayStartMs = (dk) => dk * DAY_MS - OFFSET_MS;
const periodKey = (period) => (period === 'weekly' ? weekKey() : dayKey());

/* ============ Ví & sổ cái ============ */
function ensureWallet(guildId, userId) {
  db.prepare('INSERT OR IGNORE INTO wallets (guildId, userId) VALUES (?, ?)').run(guildId, userId);
  return db.prepare('SELECT * FROM wallets WHERE guildId = ? AND userId = ?').get(guildId, userId);
}

function getWallet(guildId, userId) {
  return ensureWallet(guildId, userId);
}

/**
 * Cộng (amount > 0) hoặc trừ (amount < 0) coin. Mọi thay đổi đều ghi vào coin_ledger.
 * Trừ quá số dư -> { ok:false } và KHÔNG thay đổi gì.
 */
const applyDelta = db.transaction((guildId, userId, amount, source, reason, refId = null) => {
  const wallet = ensureWallet(guildId, userId);
  // Idempotency: cùng (source, refId) đã ghi rồi -> không làm gì thêm
  if (refId && db.prepare('SELECT 1 FROM coin_ledger WHERE source = ? AND refId = ?').get(source, refId)) {
    return { ok: false, duplicate: true, balance: wallet.balance };
  }
  const newBalance = wallet.balance + amount;
  if (newBalance < 0) return { ok: false, balance: wallet.balance };

  db.prepare('UPDATE wallets SET balance = ? WHERE guildId = ? AND userId = ?').run(newBalance, guildId, userId);
  db.prepare(
    'INSERT INTO coin_ledger (guildId, userId, amount, balanceAfter, source, reason, createdAt, refId) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(guildId, userId, amount, newBalance, source, reason || null, Date.now(), refId);
  return { ok: true, balance: newBalance };
});

function addCoins(guildId, userId, amount, source, reason, refId = null) {
  if (!Number.isInteger(amount) || amount <= 0) throw new Error('addCoins: amount phải là số nguyên dương');
  return applyDelta(guildId, userId, amount, source, reason, refId);
}
function spendCoins(guildId, userId, amount, source, reason) {
  if (!Number.isInteger(amount) || amount <= 0) throw new Error('spendCoins: amount phải là số nguyên dương');
  return applyDelta(guildId, userId, -amount, source, reason);
}

function getLedger(guildId, userId, limit = 10) {
  return db
    .prepare('SELECT * FROM coin_ledger WHERE guildId = ? AND userId = ? ORDER BY id DESC LIMIT ?')
    .all(guildId, userId, limit);
}

function topBalances(guildId, limit = 10) {
  return db
    .prepare('SELECT userId, balance FROM wallets WHERE guildId = ? AND balance > 0 ORDER BY balance DESC LIMIT ?')
    .all(guildId, limit);
}

/* ============ Nhiệm vụ ============ */
/**
 * Tăng tiến độ mọi nhiệm vụ có event tương ứng. Nhiệm vụ đạt mục tiêu sẽ tự trả thưởng (đúng 1 lần/kỳ).
 * Trả về danh sách nhiệm vụ vừa hoàn thành.
 */
const progressQuests = db.transaction((guildId, userId, event, amount = 1) => {
  const completedNow = [];
  for (const q of gzw.quests.filter((x) => x.event === event)) {
    const pk = periodKey(q.period);
    db.prepare(
      'INSERT OR IGNORE INTO quest_progress (guildId, userId, questId, periodKey) VALUES (?, ?, ?, ?)'
    ).run(guildId, userId, q.id, pk);
    const row = db
      .prepare('SELECT * FROM quest_progress WHERE guildId = ? AND userId = ? AND questId = ? AND periodKey = ?')
      .get(guildId, userId, q.id, pk);
    if (row.completed) continue;

    const progress = Math.min(q.target, row.progress + amount);
    const done = progress >= q.target ? 1 : 0;
    db.prepare(
      'UPDATE quest_progress SET progress = ?, completed = ? WHERE guildId = ? AND userId = ? AND questId = ? AND periodKey = ?'
    ).run(progress, done, guildId, userId, q.id, pk);

    if (done) {
      addCoins(guildId, userId, q.reward, 'quest', q.id);
      completedNow.push(q);
    }
  }
  return completedNow;
});

function getQuestStatus(guildId, userId) {
  return gzw.quests.map((q) => {
    const row = db
      .prepare('SELECT progress, completed FROM quest_progress WHERE guildId = ? AND userId = ? AND questId = ? AND periodKey = ?')
      .get(guildId, userId, q.id, periodKey(q.period));
    return { ...q, progress: row?.progress ?? 0, completed: !!row?.completed };
  });
}

function hasEverCompletedQuest(guildId, userId) {
  return !!db
    .prepare('SELECT 1 FROM quest_progress WHERE guildId = ? AND userId = ? AND completed = 1 LIMIT 1')
    .get(guildId, userId);
}

/* ============ Upgrade Center ============ */
const playerLevel = (guildId, userId) =>
  db.prepare('SELECT level FROM levels WHERE guildId = ? AND userId = ?').get(guildId, userId)?.level ?? 0;
const findUpgrade = (id) => gzw.upgrades.find((u) => u.id === id);

function getUpgradeLevel(guildId, userId, upgradeId) {
  return db.prepare('SELECT level FROM upgrades WHERE guildId = ? AND userId = ? AND upgradeId = ?')
    .get(guildId, userId, upgradeId)?.level ?? 0;
}
/** Giá trị hiệu lực của một nâng cấp (base + perLevel × cấp). */
function upgradeValue(guildId, userId, upgradeId) {
  const def = findUpgrade(upgradeId);
  return def ? def.base + def.perLevel * getUpgradeLevel(guildId, userId, upgradeId) : 0;
}
function getUpgradeStatus(guildId, userId) {
  const plv = playerLevel(guildId, userId);
  return gzw.upgrades.map((def) => {
    const level = getUpgradeLevel(guildId, userId, def.id);
    const max = def.costs.length;
    return {
      def, level, max, maxed: level >= max, playerLevel: plv,
      nextCost: level < max ? def.costs[level] : null,
      nextMinLevel: level < max ? def.minPlayerLevel[level] : null,
      current: def.base + def.perLevel * level,
      next: level < max ? def.base + def.perLevel * (level + 1) : null
    };
  });
}
const buyUpgrade = db.transaction((guildId, userId, upgradeId) => {
  const def = findUpgrade(upgradeId);
  if (!def) return { ok: false, reason: 'notfound' };
  const level = getUpgradeLevel(guildId, userId, upgradeId);
  if (level >= def.costs.length) return { ok: false, reason: 'maxed', def };
  const needLv = def.minPlayerLevel[level];
  if (playerLevel(guildId, userId) < needLv) return { ok: false, reason: 'level', def, needLv };

  const spent = spendCoins(guildId, userId, def.costs[level], 'upgrade', `${upgradeId}→${level + 1}`);
  if (!spent.ok) return { ok: false, reason: 'funds', def, cost: def.costs[level], balance: spent.balance };

  db.prepare(`INSERT INTO upgrades (guildId, userId, upgradeId, level, updatedAt) VALUES (?, ?, ?, ?, ?)
              ON CONFLICT(guildId, userId, upgradeId) DO UPDATE SET level = excluded.level, updatedAt = excluded.updatedAt`)
    .run(guildId, userId, upgradeId, level + 1, Date.now());
  return { ok: true, def, level: level + 1, balance: spent.balance };
});

/* ============ Daily ============ */
const claimDaily = db.transaction((guildId, userId) => {
  const wallet = ensureWallet(guildId, userId);
  const today = dayKey();
  if (wallet.lastDailyDay === today) return { ok: false };

  const streak = wallet.lastDailyDay === today - 1 ? wallet.streak + 1 : 1;
  const bonusDays = Math.min(streak, gzw.daily.streakCapDays) - 1;
  const reward = gzw.daily.base + bonusDays * gzw.daily.streakBonusPerDay + upgradeValue(guildId, userId, 'daily_bonus');

  db.prepare('UPDATE wallets SET streak = ?, lastDailyDay = ? WHERE guildId = ? AND userId = ?')
    .run(streak, today, guildId, userId);
  const { balance } = addCoins(guildId, userId, reward, 'daily', `streak ${streak}`);
  const completedQuests = progressQuests(guildId, userId, 'daily', 1);
  return { ok: true, reward, streak, balance, completedQuests };
});

/* ============ Mini-game /hunt (không cược) ============ */
function earnedFromSourceToday(guildId, userId, source) {
  const start = dayStartMs(dayKey());
  const row = db
    .prepare('SELECT COALESCE(SUM(amount), 0) AS total FROM coin_ledger WHERE guildId = ? AND userId = ? AND source = ? AND amount > 0 AND createdAt >= ? AND createdAt < ?')
    .get(guildId, userId, source, start, start + DAY_MS);
  return row.total;
}

/** Xem trạng thái trước khi hiện nút chơi (không thay đổi dữ liệu). */
function playStatus(guildId, userId) {
  const wallet = ensureWallet(guildId, userId);
  const waitMs = wallet.lastPlayAt + gzw.play.cooldownSeconds * 1000 - Date.now();
  const remainingCap = gzw.play.dailyCap + upgradeValue(guildId, userId, 'game_cap') - earnedFromSourceToday(guildId, userId, 'play');
  if (waitMs > 0) return { ok: false, reason: 'cooldown', waitSeconds: Math.ceil(waitMs / 1000) };
  if (remainingCap <= 0) return { ok: false, reason: 'cap' };
  return { ok: true, remainingCap };
}

/** Thực hiện lượt chơi: kiểm tra lại cooldown/trần trong cùng transaction nên không thể lách bằng nhiều nút. */
const doPlay = db.transaction((guildId, userId) => {
  const status = playStatus(guildId, userId);
  if (!status.ok) return status;

  const [min, max] = gzw.play.rewardRange;
  let reward = Math.floor(Math.random() * (max - min + 1)) + min;
  const doubled = Math.random() < gzw.play.doubleChance;
  if (doubled) reward *= 2;
  reward = Math.min(reward, status.remainingCap);

  db.prepare('UPDATE wallets SET lastPlayAt = ? WHERE guildId = ? AND userId = ?').run(Date.now(), guildId, userId);
  const { balance } = addCoins(guildId, userId, reward, 'play', doubled ? 'x2' : null);
  const completedQuests = progressQuests(guildId, userId, 'play', 1);
  return { ok: true, reward, doubled, balance, completedQuests };
});

/* ============ Shop / Kho đồ ============ */
// Gồm cả vật phẩm độc quyền Booster (không nằm trong shop nên không mua/tặng được)
const findItem = (itemId) => gzw.shop.find((i) => i.id === itemId) || gzw.booster.perkItems.find((i) => i.id === itemId);

function getInventory(guildId, userId) {
  return db.prepare('SELECT itemId, acquiredAt FROM inventory WHERE guildId = ? AND userId = ? ORDER BY acquiredAt').all(guildId, userId)
    .map((r) => ({ ...r, item: findItem(r.itemId) }))
    .filter((r) => r.item);
}
const owns = (guildId, userId, itemId) =>
  !!db.prepare('SELECT 1 FROM inventory WHERE guildId = ? AND userId = ? AND itemId = ?').get(guildId, userId, itemId);

const buyItem = db.transaction((guildId, userId, itemId) => {
  const item = findItem(itemId);
  if (!item || item.boosterPerk) return { ok: false, reason: 'notfound' };
  if (owns(guildId, userId, itemId)) return { ok: false, reason: 'owned', item };

  const spent = spendCoins(guildId, userId, item.price, 'shop', itemId);
  if (!spent.ok) return { ok: false, reason: 'funds', item, balance: spent.balance };

  db.prepare('INSERT INTO inventory (guildId, userId, itemId, acquiredAt) VALUES (?, ?, ?, ?)')
    .run(guildId, userId, itemId, Date.now());
  return { ok: true, item, balance: spent.balance };
});

function equip(guildId, userId, itemId) {
  const item = findItem(itemId);
  if (!item || !['title', 'frame'].includes(item.type)) return { ok: false, reason: 'notequippable' };
  if (!owns(guildId, userId, itemId)) return { ok: false, reason: 'notowned' };
  ensureWallet(guildId, userId);
  const col = item.type === 'title' ? 'equippedTitle' : 'equippedFrame';
  db.prepare(`UPDATE wallets SET ${col} = ? WHERE guildId = ? AND userId = ?`).run(itemId, guildId, userId);
  return { ok: true, item };
}
function unequip(guildId, userId, slot) {
  const col = slot === 'title' ? 'equippedTitle' : 'equippedFrame';
  ensureWallet(guildId, userId);
  db.prepare(`UPDATE wallets SET ${col} = NULL WHERE guildId = ? AND userId = ?`).run(guildId, userId);
}

/* ============ Thành tích ============ */
/** Ghi thành tích vĩnh viễn. Trả true nếu là lần đầu (và trả thưởng coin một lần). */
const grantAchievement = db.transaction((guildId, userId, achievementId, grantedBy = null) => {
  const def = gzw.achievements.find((a) => a.id === achievementId);
  if (!def) return false;
  const res = db
    .prepare('INSERT OR IGNORE INTO achievements (guildId, userId, achievementId, earnedAt, grantedBy) VALUES (?, ?, ?, ?, ?)')
    .run(guildId, userId, achievementId, Date.now(), grantedBy);
  if (res.changes === 0) return false;
  if (def.reward > 0) addCoins(guildId, userId, def.reward, 'achievement', achievementId);
  return true;
});
function listAchievements(guildId, userId) {
  return db.prepare('SELECT achievementId, earnedAt FROM achievements WHERE guildId = ? AND userId = ? ORDER BY earnedAt').all(guildId, userId)
    .map((r) => ({ ...r, def: gzw.achievements.find((a) => a.id === r.achievementId) }))
    .filter((r) => r.def);
}

/* ============ Thống kê phục vụ thành tích tự động ============ */
const countPredictionsCorrect = (guildId, userId) =>
  db.prepare("SELECT COUNT(*) AS n FROM spectator_actions WHERE guildId = ? AND userId = ? AND kind = 'predict' AND correct = 1").get(guildId, userId).n;
const countSupportActions = (guildId, userId) =>
  db.prepare("SELECT COUNT(*) AS n FROM spectator_actions WHERE guildId = ? AND userId = ? AND kind = 'cheer'").get(guildId, userId).n
  + db.prepare('SELECT COUNT(*) AS n FROM transfers WHERE guildId = ? AND fromId = ?').get(guildId, userId).n;
const countFinishedDuels = (guildId, userId) =>
  db.prepare("SELECT COUNT(*) AS n FROM game_matches WHERE guildId = ? AND status = 'finished' AND game = 'duel' AND (p1 = ? OR p2 = ?)").get(guildId, userId, userId).n;

module.exports = {
  dayKey, weekKey,
  getWallet, addCoins, spendCoins, getLedger, topBalances,
  progressQuests, getQuestStatus, hasEverCompletedQuest,
  claimDaily, playStatus, doPlay,
  findItem, getInventory, owns, buyItem, equip, unequip,
  grantAchievement, listAchievements,
  playerLevel, findUpgrade, getUpgradeLevel, upgradeValue, getUpgradeStatus, buyUpgrade,
  earnedFromSourceToday, dayStartMs,
  countPredictionsCorrect, countSupportActions, countFinishedDuels
};
