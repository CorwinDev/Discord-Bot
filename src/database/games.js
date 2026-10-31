const db = require('./db');
const gzw = require('../config/gzw');
const eco = require('./economy');

const G = gzw.games;

/* ============ Trận đấu ============ */
function createMatch(guildId, channelId, game, p1, p2) {
  return db.prepare('INSERT INTO game_matches (guildId, channelId, game, p1, p2, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(guildId, channelId, game, p1, p2, 'playing', Date.now()).lastInsertRowid;
}
const setMatchMessage = (id, messageId) => db.prepare('UPDATE game_matches SET messageId = ? WHERE id = ?').run(messageId, id);
const getMatch = (id) => db.prepare('SELECT * FROM game_matches WHERE id = ?').get(id);

/** Khi bot khởi động lại, các trận đang dang dở không thể tiếp tục -> đánh dấu aborted (không thưởng). */
function abortStaleMatches() {
  return db.prepare("UPDATE game_matches SET status = 'aborted', endedAt = ? WHERE status IN ('playing','waiting')").run(Date.now()).changes;
}
function abortMatch(id) {
  db.prepare("UPDATE game_matches SET status = 'aborted', endedAt = ? WHERE id = ? AND status = 'playing'").run(Date.now(), id);
}
const activeMatches = (guildId) =>
  db.prepare("SELECT * FROM game_matches WHERE guildId = ? AND status = 'playing' ORDER BY id DESC LIMIT 10").all(guildId);
const isInActiveMatch = (guildId, userId) =>
  !!db.prepare("SELECT 1 FROM game_matches WHERE guildId = ? AND status = 'playing' AND (p1 = ? OR p2 = ?) LIMIT 1").get(guildId, userId, userId);
const matchHistory = (guildId, userId, limit = 10) =>
  db.prepare("SELECT * FROM game_matches WHERE guildId = ? AND status = 'finished' AND (p1 = ? OR p2 = ?) ORDER BY id DESC LIMIT ?").all(guildId, userId, userId, limit);

/* ============ Dự đoán miễn phí & cổ vũ ============ */
function addPrediction(matchId, guildId, userId, pickId) {
  const m = getMatch(matchId);
  if (!m || m.status !== 'playing') return { ok: false, reason: 'closed' };
  if (userId === m.p1 || userId === m.p2) return { ok: false, reason: 'player' };
  const res = db.prepare("INSERT OR IGNORE INTO spectator_actions (matchId, guildId, userId, kind, value, createdAt) VALUES (?, ?, ?, 'predict', ?, ?)")
    .run(matchId, guildId, userId, pickId, Date.now());
  return res.changes ? { ok: true } : { ok: false, reason: 'duplicate' };
}
function addCheer(matchId, guildId, userId, emoji) {
  const last = db.prepare("SELECT createdAt FROM spectator_actions WHERE matchId = ? AND userId = ? AND kind = 'cheer' ORDER BY id DESC LIMIT 1").get(matchId, userId);
  if (last && Date.now() - last.createdAt < 10000) return { ok: false, reason: 'cooldown' };
  db.prepare("INSERT INTO spectator_actions (matchId, guildId, userId, kind, value, createdAt) VALUES (?, ?, ?, 'cheer', ?, ?)")
    .run(matchId, guildId, userId, emoji, Date.now());
  return { ok: true };
}
function spectatorStats(matchId) {
  const m = getMatch(matchId);
  const pred = db.prepare("SELECT value, COUNT(*) AS n FROM spectator_actions WHERE matchId = ? AND kind = 'predict' GROUP BY value").all(matchId);
  const cheers = db.prepare("SELECT COUNT(*) AS n FROM spectator_actions WHERE matchId = ? AND kind = 'cheer'").get(matchId).n;
  return { p1: pred.find((x) => x.value === m.p1)?.n ?? 0, p2: pred.find((x) => x.value === m.p2)?.n ?? 0, cheers };
}

/**
 * Kết thúc trận: ghi điểm, chốt dự đoán, và trả thưởng (có trần/ngày và giới hạn theo cặp).
 * Thưởng là coin từ hệ thống, KHÔNG phải coin của đối thủ (không cược).
 */
const finishDuel = db.transaction((matchId, score1, score2) => {
  const m = getMatch(matchId);
  if (!m || m.status !== 'playing') return null;
  const winnerId = score1 > score2 ? m.p1 : score2 > score1 ? m.p2 : null;
  db.prepare("UPDATE game_matches SET status = 'finished', score1 = ?, score2 = ?, winnerId = ?, endedAt = ? WHERE id = ?")
    .run(score1, score2, winnerId, Date.now(), matchId);

  // chốt dự đoán (hoà = không ai đúng)
  db.prepare("UPDATE spectator_actions SET correct = CASE WHEN value = ? THEN 1 ELSE 0 END WHERE matchId = ? AND kind = 'predict'")
    .run(winnerId ?? '', matchId);
  const correctUsers = db.prepare("SELECT userId FROM spectator_actions WHERE matchId = ? AND kind = 'predict' AND correct = 1").all(matchId).map((r) => r.userId);

  // giới hạn theo cặp mỗi ngày
  const start = eco.dayStartMs(eco.dayKey());
  const pairToday = db.prepare(
    "SELECT COUNT(*) AS n FROM game_matches WHERE guildId = ? AND game = 'duel' AND rewarded = 1 AND createdAt >= ? AND ((p1 = ? AND p2 = ?) OR (p1 = ? AND p2 = ?))"
  ).get(m.guildId, start, m.p1, m.p2, m.p2, m.p1).n;

  const rewards = { [m.p1]: 0, [m.p2]: 0 };
  let pairLimited = false;
  if (pairToday >= G.duel.pairRewardedPerDay) pairLimited = true;
  else {
    for (const uid of [m.p1, m.p2]) {
      const base = winnerId === null ? G.duel.loserReward : uid === winnerId ? G.duel.winnerReward : G.duel.loserReward;
      const room = G.duel.dailyRewardCap - eco.earnedFromSourceToday(m.guildId, uid, 'duel');
      const amt = Math.max(0, Math.min(base, room));
      if (amt > 0) { eco.addCoins(m.guildId, uid, amt, 'duel', `match ${matchId}`); rewards[uid] = amt; }
    }
    db.prepare('UPDATE game_matches SET rewarded = 1 WHERE id = ?').run(matchId);
  }
  return { match: getMatch(matchId), winnerId, rewards, pairLimited, correctUsers };
});

/* ============ Quiz solo ============ */
function quizStatus(guildId, userId) {
  const room = G.soloDailyCap - eco.earnedFromSourceToday(guildId, userId, 'quiz');
  return room > 0 ? { ok: true, room } : { ok: false, reason: 'cap' };
}
const awardQuiz = db.transaction((guildId, userId) => {
  const st = quizStatus(guildId, userId);
  if (!st.ok) return { ok: false, reason: 'cap' };
  const amt = Math.min(G.soloReward, st.room);
  const { balance } = eco.addCoins(guildId, userId, amt, 'quiz', null);
  return { ok: true, reward: amt, balance };
});

module.exports = {
  createMatch, setMatchMessage, getMatch, abortStaleMatches, abortMatch, activeMatches, isInActiveMatch, matchHistory,
  addPrediction, addCheer, spectatorStats, finishDuel, quizStatus, awardQuiz
};
