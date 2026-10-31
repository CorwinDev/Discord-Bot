const db = require('./db');

function getUser(guildId, userId) {
  let row = db.prepare('SELECT * FROM levels WHERE guildId = ? AND userId = ?').get(guildId, userId);
  if (!row) {
    db.prepare('INSERT INTO levels (guildId, userId, xp, level, lastMessageAt) VALUES (?, ?, 0, 0, 0)').run(guildId, userId);
    row = { guildId, userId, xp: 0, level: 0, lastMessageAt: 0 };
  }
  return row;
}

function xpForNextLevel(level) {
  return 5 * (level ** 2) + 50 * level + 100;
}

/**
 * Cộng XP cho user, trả về { leveledUp, newLevel } nếu có thay đổi.
 */
function addXp(guildId, userId, amount) {
  const user = getUser(guildId, userId);
  let xp = user.xp + amount;
  let level = user.level;
  let leveledUp = false;

  while (xp >= xpForNextLevel(level)) {
    xp -= xpForNextLevel(level);
    level += 1;
    leveledUp = true;
  }

  db.prepare('UPDATE levels SET xp = ?, level = ?, lastMessageAt = ? WHERE guildId = ? AND userId = ?')
    .run(xp, level, Date.now(), guildId, userId);

  return { leveledUp, newLevel: level };
}

function canGainXp(guildId, userId, cooldownSeconds) {
  const user = getUser(guildId, userId);
  return Date.now() - user.lastMessageAt >= cooldownSeconds * 1000;
}

function getRank(guildId, userId) {
  const rows = db.prepare('SELECT userId FROM levels WHERE guildId = ? ORDER BY level DESC, xp DESC').all(guildId);
  return rows.findIndex(r => r.userId === userId) + 1;
}

module.exports = { getUser, addXp, canGainXp, xpForNextLevel, getRank };
