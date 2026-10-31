const db = require('./db');
const eco = require('./economy');
const gzw = require('../config/gzw');

const cfg = gzw.tournament;
const now = () => Date.now();

const audit = (tournamentId, action, actorId, detail = null) =>
  db.prepare('INSERT INTO tournament_audit (tournamentId, action, actorId, detail, createdAt) VALUES (?, ?, ?, ?, ?)')
    .run(tournamentId, action, actorId || null, detail, now());

/* ============ Tiện ích ============ */

/** "1:5000,2:2000,3:1000" -> { 1: 5000, 2: 2000, 3: 1000 }. Hạng hợp lệ: 1-3 (hạng 3 áp dụng cho cả hai đội thua bán kết). */
function parseCoinPrizes(text) {
  const prizes = {};
  const raw = (text || '').trim();
  if (!raw) return { ok: true, prizes };
  for (const part of raw.split(',')) {
    const m = part.trim().match(/^([1-3])\s*:\s*(\d{1,9})$/);
    if (!m) return { ok: false, error: `"${part.trim()}" không đúng dạng hạng:số-coin (ví dụ 1:5000,2:2000,3:1000).` };
    const coins = Number(m[2]);
    if (coins <= 0 || coins > cfg.maxCoinPrizePerMember) {
      return { ok: false, error: `Coin mỗi thành viên phải từ 1 đến ${cfg.maxCoinPrizePerMember}.` };
    }
    if (prizes[m[1]]) return { ok: false, error: `Hạng ${m[1]} bị khai báo hai lần.` };
    prizes[m[1]] = coins;
  }
  return { ok: true, prizes };
}

/** Thứ tự hạt giống chuẩn cho nhánh 2^k (hạt 1 gặp hạt cuối, các hạt cao được bye trước). */
function seedOrder(size) {
  let order = [1];
  while (order.length < size) {
    const n = order.length * 2;
    order = order.flatMap((s) => [s, n + 1 - s]);
  }
  return order;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ============ Truy vấn ============ */
const getTournament = (guildId, id) =>
  db.prepare('SELECT * FROM tournaments WHERE id = ? AND guildId = ?').get(id, guildId);

const listActive = (guildId) =>
  db.prepare("SELECT * FROM tournaments WHERE guildId = ? AND status IN ('OPEN','RUNNING') ORDER BY id DESC LIMIT 15").all(guildId);

const listDrafts = (guildId) =>
  db.prepare("SELECT * FROM tournaments WHERE guildId = ? AND status = 'DRAFT' ORDER BY id DESC LIMIT 15").all(guildId);

function listHistory(guildId, limit = 10) {
  return db.prepare(`
    SELECT t.*, e.name AS championName
    FROM tournaments t
    LEFT JOIN tournament_placements p ON p.tournamentId = t.id AND p.placement = 1
    LEFT JOIN tournament_entrants e ON e.id = p.entrantId
    WHERE t.guildId = ? AND t.status IN ('FINISHED','CANCELLED')
    ORDER BY t.id DESC LIMIT ?`).all(guildId, limit);
}

function getEntrants(tournamentId) {
  const entrants = db.prepare('SELECT * FROM tournament_entrants WHERE tournamentId = ? ORDER BY id').all(tournamentId);
  const members = db.prepare('SELECT entrantId, userId FROM tournament_members WHERE tournamentId = ?').all(tournamentId);
  return entrants.map((e) => ({ ...e, members: members.filter((m) => m.entrantId === e.id).map((m) => m.userId) }));
}
const getEntrant = (id) => {
  const e = db.prepare('SELECT * FROM tournament_entrants WHERE id = ?').get(id);
  if (!e) return null;
  e.members = db.prepare('SELECT userId FROM tournament_members WHERE entrantId = ?').all(id).map((m) => m.userId);
  return e;
};
const entrantOfUser = (tournamentId, userId) =>
  db.prepare(`SELECT e.* FROM tournament_members m JOIN tournament_entrants e ON e.id = m.entrantId
              WHERE m.tournamentId = ? AND m.userId = ?`).get(tournamentId, userId);

const getMatches = (tournamentId) =>
  db.prepare('SELECT * FROM tournament_matches WHERE tournamentId = ? ORDER BY round, idx').all(tournamentId);
const getMatch = (guildId, matchId) =>
  db.prepare(`SELECT m.* FROM tournament_matches m JOIN tournaments t ON t.id = m.tournamentId
              WHERE m.id = ? AND t.guildId = ?`).get(matchId, guildId);

const getPlacements = (tournamentId) =>
  db.prepare('SELECT * FROM tournament_placements WHERE tournamentId = ? ORDER BY placement').all(tournamentId);
const getPayouts = (tournamentId) =>
  db.prepare('SELECT * FROM tournament_payouts WHERE tournamentId = ? ORDER BY placement, id').all(tournamentId);
const getAudit = (tournamentId, limit = 15) =>
  db.prepare('SELECT * FROM tournament_audit WHERE tournamentId = ? ORDER BY id DESC LIMIT ?').all(tournamentId, limit);

/** Bảng xếp hạng của một giải: hạng chung cuộc (nếu có), rồi số trận thắng. */
function standings(tournamentId) {
  const entrants = getEntrants(tournamentId);
  const placements = new Map(getPlacements(tournamentId).map((p) => [p.entrantId, p.placement]));
  const wins = db.prepare(`SELECT winnerId, COUNT(*) AS n FROM tournament_matches
                           WHERE tournamentId = ? AND status = 'DONE' GROUP BY winnerId`).all(tournamentId);
  const winMap = new Map(wins.map((w) => [w.winnerId, w.n]));
  return entrants
    .map((e) => ({ ...e, placement: placements.get(e.id) ?? null, wins: winMap.get(e.id) ?? 0 }))
    .sort((a, b) => (a.placement ?? 99) - (b.placement ?? 99) || b.wins - a.wins || a.id - b.id);
}

/** Bảng vinh danh toàn server (các giải đã kết thúc). */
const globalLeaderboard = (guildId, limit = 10) =>
  db.prepare(`
    SELECT m.userId,
           SUM(p.placement = 1) AS golds, SUM(p.placement = 2) AS silvers, SUM(p.placement = 3) AS bronzes
    FROM tournament_placements p
    JOIN tournament_members m ON m.tournamentId = p.tournamentId AND m.entrantId = p.entrantId
    JOIN tournaments t ON t.id = p.tournamentId
    WHERE t.guildId = ? AND t.status = 'FINISHED'
    GROUP BY m.userId
    ORDER BY golds DESC, silvers DESC, bronzes DESC LIMIT ?`).all(guildId, limit);

/* ============ Tạo / mở / huỷ giải ============ */
function createTournament(guildId, createdBy, d) {
  const info = db.prepare(`
    INSERT INTO tournaments (guildId, name, game, teamSize, maxEntrants, registerUntil, startsAt, schedule, rules,
                             winCondition, coinPrizes, status, createdBy, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'DRAFT', ?, ?)`)
    .run(guildId, d.name, d.game, d.teamSize, d.maxEntrants, d.registerUntil, d.startsAt ?? null, d.schedule ?? null,
      d.rules, d.winCondition, JSON.stringify(d.prizes || {}), createdBy, now());
  audit(info.lastInsertRowid, 'CREATE', createdBy, d.name);
  return info.lastInsertRowid;
}

const openRegistration = db.transaction((guildId, id, adminId) => {
  const t = getTournament(guildId, id);
  if (!t) return { ok: false, reason: 'notfound' };
  if (t.status !== 'DRAFT') return { ok: false, reason: 'status', t };
  if (t.registerUntil <= now()) return { ok: false, reason: 'deadline', t };
  db.prepare("UPDATE tournaments SET status = 'OPEN' WHERE id = ?").run(id);
  audit(id, 'OPEN', adminId);
  return { ok: true, t };
});

const cancelTournament = db.transaction((guildId, id, adminId, reason) => {
  const t = getTournament(guildId, id);
  if (!t) return { ok: false, reason: 'notfound' };
  if (['FINISHED', 'CANCELLED'].includes(t.status)) return { ok: false, reason: 'status', t };
  db.prepare("UPDATE tournaments SET status = 'CANCELLED', finishedAt = ? WHERE id = ?").run(now(), id);
  db.prepare("UPDATE tournament_cash_prizes SET status = 'CANCELLED', updatedAt = ? WHERE tournamentId = ? AND status != 'PAID'").run(now(), id);
  audit(id, 'CANCEL', adminId, reason);
  return { ok: true, t };
});

/* ============ Đăng ký ============ */
/** memberIds gồm cả đội trưởng (phần tử đầu). Số người phải đúng bằng teamSize. */
const register = db.transaction((guildId, id, captainId, name, memberIds) => {
  const t = getTournament(guildId, id);
  if (!t) return { ok: false, reason: 'notfound' };
  if (t.status !== 'OPEN') return { ok: false, reason: 'closed', t };
  if (now() >= t.registerUntil) return { ok: false, reason: 'deadline', t };

  const ids = [...new Set(memberIds)];
  if (ids.length !== memberIds.length) return { ok: false, reason: 'dupe', t };
  if (ids.length !== t.teamSize) return { ok: false, reason: 'size', t };

  const count = db.prepare('SELECT COUNT(*) AS n FROM tournament_entrants WHERE tournamentId = ?').get(id).n;
  if (count >= t.maxEntrants) return { ok: false, reason: 'full', t };

  for (const uid of ids) {
    if (entrantOfUser(id, uid)) return { ok: false, reason: 'already', userId: uid, t };
  }
  if (db.prepare('SELECT 1 FROM tournament_entrants WHERE tournamentId = ? AND name = ? COLLATE NOCASE').get(id, name)) {
    return { ok: false, reason: 'name', t };
  }

  const info = db.prepare('INSERT INTO tournament_entrants (tournamentId, name, captainId, createdAt) VALUES (?, ?, ?, ?)')
    .run(id, name, captainId, now());
  const entrantId = Number(info.lastInsertRowid);
  const ins = db.prepare('INSERT INTO tournament_members (tournamentId, entrantId, userId) VALUES (?, ?, ?)');
  for (const uid of ids) ins.run(id, entrantId, uid);
  audit(id, 'REGISTER', captainId, `${name} (${ids.join(',')})`);
  return { ok: true, t, entrantId, count: count + 1 };
});

const withdraw = db.transaction((guildId, id, userId) => {
  const t = getTournament(guildId, id);
  if (!t) return { ok: false, reason: 'notfound' };
  if (t.status !== 'OPEN') return { ok: false, reason: 'closed', t };
  const e = entrantOfUser(id, userId);
  if (!e) return { ok: false, reason: 'notregistered', t };
  if (e.captainId !== userId) return { ok: false, reason: 'notcaptain', t };
  db.prepare('DELETE FROM tournament_members WHERE entrantId = ?').run(e.id);
  db.prepare('DELETE FROM tournament_entrants WHERE id = ?').run(e.id);
  audit(id, 'WITHDRAW', userId, e.name);
  return { ok: true, t, entrant: e };
});

/* ============ Nhánh đấu ============ */
const roundCount = (tournamentId) =>
  db.prepare('SELECT COALESCE(MAX(round), 0) AS r FROM tournament_matches WHERE tournamentId = ?').get(tournamentId).r;

/** Đưa người thắng sang trận kế tiếp. Trả về true nếu đó là trận chung kết (kết thúc nhánh). */
function advanceWinner(match, winnerId) {
  const total = roundCount(match.tournamentId);
  if (match.round >= total) return true;
  const col = match.idx % 2 === 0 ? 'entrantA' : 'entrantB';
  const next = db.prepare('SELECT * FROM tournament_matches WHERE tournamentId = ? AND round = ? AND idx = ?')
    .get(match.tournamentId, match.round + 1, Math.floor(match.idx / 2));
  db.prepare(`UPDATE tournament_matches SET ${col} = ?, updatedAt = ? WHERE id = ?`).run(winnerId, now(), next.id);
  const fresh = db.prepare('SELECT * FROM tournament_matches WHERE id = ?').get(next.id);
  if (fresh.entrantA && fresh.entrantB && fresh.status === 'WAITING') {
    db.prepare("UPDATE tournament_matches SET status = 'PENDING' WHERE id = ?").run(next.id);
  }
  return false;
}

const startTournament = db.transaction((guildId, id, adminId) => {
  const t = getTournament(guildId, id);
  if (!t) return { ok: false, reason: 'notfound' };
  if (t.status !== 'OPEN') return { ok: false, reason: 'status', t };
  const entrants = getEntrants(id);
  if (entrants.length < 2) return { ok: false, reason: 'few', t };

  let size = 2;
  while (size < entrants.length) size *= 2;
  const rounds = Math.log2(size);
  const seeds = shuffle(entrants);
  const order = seedOrder(size);

  const ins = db.prepare(`INSERT INTO tournament_matches (tournamentId, round, idx, entrantA, entrantB, status, updatedAt)
                          VALUES (?, ?, ?, ?, ?, ?, ?)`);
  for (let r = 1; r <= rounds; r++) {
    const n = size / 2 ** r;
    for (let i = 0; i < n; i++) {
      if (r === 1) {
        const a = seeds[order[2 * i] - 1]?.id ?? null;
        const b = seeds[order[2 * i + 1] - 1]?.id ?? null;
        ins.run(id, 1, i, a, b, a && b ? 'PENDING' : 'BYE', now());
      } else {
        ins.run(id, r, i, null, null, 'WAITING', now());
      }
    }
  }
  // Xử lý bye: người có bye đi thẳng vào vòng sau
  const byes = db.prepare("SELECT * FROM tournament_matches WHERE tournamentId = ? AND round = 1 AND status = 'BYE'").all(id);
  for (const m of byes) {
    const w = m.entrantA ?? m.entrantB;
    db.prepare('UPDATE tournament_matches SET winnerId = ? WHERE id = ?').run(w, m.id);
    advanceWinner(m, w);
  }
  db.prepare("UPDATE tournaments SET status = 'RUNNING' WHERE id = ?").run(id);
  audit(id, 'START', adminId, `${entrants.length} đội, ${rounds} vòng`);
  return { ok: true, t, entrants, rounds, size };
});

/* ============ Kết quả trận ============ */
const isInMatch = (m, entrantId) => m.entrantA === entrantId || m.entrantB === entrantId;

/** Đội trưởng gửi kết quả + bằng chứng. Chưa tính là chính thức cho đến khi ban tổ chức duyệt. */
const reportResult = db.transaction((guildId, matchId, reporterId, scoreA, scoreB, evidence, note) => {
  const m = getMatch(guildId, matchId);
  if (!m) return { ok: false, reason: 'notfound' };
  const t = db.prepare('SELECT * FROM tournaments WHERE id = ?').get(m.tournamentId);
  if (t.status !== 'RUNNING') return { ok: false, reason: 'notrunning' };
  if (m.status !== 'PENDING') return { ok: false, reason: 'state', m };
  const mine = entrantOfUser(m.tournamentId, reporterId);
  if (!mine || mine.captainId !== reporterId || !isInMatch(m, mine.id)) return { ok: false, reason: 'notcaptain', m };
  if (!Number.isInteger(scoreA) || !Number.isInteger(scoreB) || scoreA < 0 || scoreB < 0 || scoreA === scoreB) {
    return { ok: false, reason: 'score', m };
  }
  const winnerId = scoreA > scoreB ? m.entrantA : m.entrantB;
  db.prepare(`UPDATE tournament_matches SET scoreA = ?, scoreB = ?, winnerId = ?, status = 'REPORTED', reportedBy = ?,
              evidence = ?, note = ?, updatedAt = ? WHERE id = ?`)
    .run(scoreA, scoreB, winnerId, reporterId, evidence, note || null, now(), matchId);
  audit(m.tournamentId, 'REPORT', reporterId, `trận #${matchId} ${scoreA}-${scoreB}`);
  return { ok: true, m: db.prepare('SELECT * FROM tournament_matches WHERE id = ?').get(matchId), t };
});

/** Đội trưởng bên còn lại khiếu nại kết quả đã gửi. */
const disputeResult = db.transaction((guildId, matchId, userId, reason) => {
  const m = getMatch(guildId, matchId);
  if (!m) return { ok: false, reason: 'notfound' };
  if (m.status !== 'REPORTED') return { ok: false, reason: 'state', m };
  const mine = entrantOfUser(m.tournamentId, userId);
  if (!mine || mine.captainId !== userId || !isInMatch(m, mine.id)) return { ok: false, reason: 'notcaptain', m };
  if (m.reportedBy === userId) return { ok: false, reason: 'own', m };
  db.prepare("UPDATE tournament_matches SET status = 'DISPUTED', note = ?, updatedAt = ? WHERE id = ?")
    .run(`Khiếu nại bởi ${userId}: ${reason}`, now(), matchId);
  audit(m.tournamentId, 'DISPUTE', userId, `trận #${matchId}: ${reason}`);
  return { ok: true, m, t: db.prepare('SELECT * FROM tournaments WHERE id = ?').get(m.tournamentId) };
});

/** Người duyệt không được là thành viên của hai đội trong trận (tránh tự duyệt). */
function adminConflict(m, adminId) {
  for (const eid of [m.entrantA, m.entrantB]) {
    if (eid && getEntrant(eid)?.members.includes(adminId)) return true;
  }
  return false;
}

/** Chốt trận (đã có winnerId): đưa người thắng đi tiếp; nếu là chung kết thì kết thúc giải và trao coin. */
function finalizeMatch(m, adminId) {
  db.prepare("UPDATE tournament_matches SET status = 'DONE', approvedBy = ?, updatedAt = ? WHERE id = ?")
    .run(adminId, now(), m.id);
  audit(m.tournamentId, 'APPROVE', adminId, `trận #${m.id} thắng: đội ${m.winnerId}`);
  const isFinal = advanceWinner(m, m.winnerId);
  return isFinal ? finishTournament(m.tournamentId, adminId) : null;
}

const approveResult = db.transaction((guildId, matchId, adminId) => {
  const m = getMatch(guildId, matchId);
  if (!m) return { ok: false, reason: 'notfound' };
  if (!['REPORTED', 'DISPUTED'].includes(m.status)) return { ok: false, reason: 'state', m };
  if (adminConflict(m, adminId)) return { ok: false, reason: 'conflict', m };
  const finished = finalizeMatch(m, adminId);
  return { ok: true, m: db.prepare('SELECT * FROM tournament_matches WHERE id = ?').get(matchId), finished };
});

const rejectResult = db.transaction((guildId, matchId, adminId, reason) => {
  const m = getMatch(guildId, matchId);
  if (!m) return { ok: false, reason: 'notfound' };
  if (!['REPORTED', 'DISPUTED'].includes(m.status)) return { ok: false, reason: 'state', m };
  db.prepare(`UPDATE tournament_matches SET status = 'PENDING', scoreA = NULL, scoreB = NULL, winnerId = NULL, reportedBy = NULL,
              evidence = NULL, note = ?, updatedAt = ? WHERE id = ?`).run(`Bị từ chối: ${reason}`, now(), matchId);
  audit(m.tournamentId, 'REJECT', adminId, `trận #${matchId}: ${reason}`);
  return { ok: true, m };
});

/** Ban tổ chức tự quyết kết quả (giải quyết tranh chấp / đội không gửi kết quả). */
const adminSetResult = db.transaction((guildId, matchId, adminId, winnerEntrantId, scoreA, scoreB, note) => {
  const m = getMatch(guildId, matchId);
  if (!m) return { ok: false, reason: 'notfound' };
  if (!['PENDING', 'REPORTED', 'DISPUTED'].includes(m.status)) return { ok: false, reason: 'state', m };
  if (!isInMatch(m, winnerEntrantId)) return { ok: false, reason: 'winner', m };
  if (adminConflict(m, adminId)) return { ok: false, reason: 'conflict', m };
  db.prepare('UPDATE tournament_matches SET winnerId = ?, scoreA = ?, scoreB = ?, note = ? WHERE id = ?')
    .run(winnerEntrantId, scoreA ?? null, scoreB ?? null, note, matchId);
  const fresh = db.prepare('SELECT * FROM tournament_matches WHERE id = ?').get(matchId);
  const finished = finalizeMatch(fresh, adminId);
  return { ok: true, m: db.prepare('SELECT * FROM tournament_matches WHERE id = ?').get(matchId), finished };
});

/* ============ Kết thúc giải & trao coin ============ */
function finishTournament(tournamentId, adminId) {
  const t = db.prepare('SELECT * FROM tournaments WHERE id = ?').get(tournamentId);
  if (t.status === 'FINISHED') return null; // đã chốt rồi -> không trao lại
  const total = roundCount(tournamentId);
  const final = db.prepare('SELECT * FROM tournament_matches WHERE tournamentId = ? AND round = ? AND idx = 0').get(tournamentId, total);
  const champion = final.winnerId;
  const runnerUp = final.entrantA === champion ? final.entrantB : final.entrantA;

  const placeIns = db.prepare('INSERT OR IGNORE INTO tournament_placements (tournamentId, entrantId, placement) VALUES (?, ?, ?)');
  placeIns.run(tournamentId, champion, 1);
  placeIns.run(tournamentId, runnerUp, 2);
  if (total >= 2) {
    const semis = db.prepare("SELECT * FROM tournament_matches WHERE tournamentId = ? AND round = ? AND status = 'DONE'").all(tournamentId, total - 1);
    for (const s of semis) {
      const loser = s.entrantA === s.winnerId ? s.entrantB : s.entrantA;
      if (loser) placeIns.run(tournamentId, loser, 3);
    }
  }

  const prizes = JSON.parse(t.coinPrizes || '{}');
  const payouts = [];
  for (const p of getPlacements(tournamentId)) {
    const coins = prizes[String(p.placement)];
    if (!coins) continue;
    for (const userId of getEntrant(p.entrantId).members) {
      const res = eco.addCoins(t.guildId, userId, coins, 'tournament', `Giải #${tournamentId} hạng ${p.placement}`, `tour:${tournamentId}:${userId}`);
      if (res.ok) {
        db.prepare('INSERT INTO tournament_payouts (tournamentId, entrantId, userId, placement, coins, approvedBy, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)')
          .run(tournamentId, p.entrantId, userId, p.placement, coins, adminId, now());
        payouts.push({ userId, placement: p.placement, coins });
      }
    }
  }
  db.prepare("UPDATE tournaments SET status = 'FINISHED', finishedAt = ? WHERE id = ?").run(now(), tournamentId);
  audit(tournamentId, 'FINISH', adminId, `vô địch: đội ${champion}; trao ${payouts.length} khoản coin`);
  return { champion: getEntrant(champion), runnerUp: getEntrant(runnerUp), payouts, placements: getPlacements(tournamentId) };
}

/* ============ Giải thưởng tiền mặt (chỉ ghi nhận trạng thái) ============ */
const CASH_FLOW = {
  budget:    { from: 'PLANNED',             to: 'BUDGET_CONFIRMED',    by: 'budgetBy' },
  recipient: { from: 'BUDGET_CONFIRMED',    to: 'RECIPIENT_CONFIRMED', by: 'recipientBy' },
  paid:      { from: 'RECIPIENT_CONFIRMED', to: 'PAID',                by: 'paidBy' }
};

const addCashPrize = db.transaction((guildId, tournamentId, adminId, placement, amountVnd, description) => {
  const t = getTournament(guildId, tournamentId);
  if (!t) return { ok: false, reason: 'notfound' };
  if (t.status === 'CANCELLED') return { ok: false, reason: 'status', t };
  const info = db.prepare(`INSERT INTO tournament_cash_prizes (tournamentId, placement, amountVnd, description, createdBy, createdAt, updatedAt)
                           VALUES (?, ?, ?, ?, ?, ?, ?)`).run(tournamentId, placement, amountVnd, description || null, adminId, now(), now());
  audit(tournamentId, 'CASH_ADD', adminId, `hạng ${placement}: ${amountVnd}đ`);
  return { ok: true, id: Number(info.lastInsertRowid), t };
});

/** step: budget | recipient | paid | cancel. Bot chỉ ghi trạng thái; việc chuyển tiền do người lớn phụ trách làm ngoài bot. */
const updateCashPrize = db.transaction((guildId, prizeId, adminId, step, note) => {
  const p = db.prepare(`SELECT c.* FROM tournament_cash_prizes c JOIN tournaments t ON t.id = c.tournamentId
                        WHERE c.id = ? AND t.guildId = ?`).get(prizeId, guildId);
  if (!p) return { ok: false, reason: 'notfound' };
  const t = db.prepare('SELECT * FROM tournaments WHERE id = ?').get(p.tournamentId);

  if (step === 'cancel') {
    if (p.status === 'PAID') return { ok: false, reason: 'paid', p };
    db.prepare("UPDATE tournament_cash_prizes SET status = 'CANCELLED', note = ?, updatedAt = ? WHERE id = ?").run(note || null, now(), prizeId);
    audit(p.tournamentId, 'CASH_CANCEL', adminId, `#${prizeId}`);
    return { ok: true, p, status: 'CANCELLED' };
  }

  const flow = CASH_FLOW[step];
  if (!flow) return { ok: false, reason: 'step' };
  if (p.status !== flow.from) return { ok: false, reason: 'order', p, expected: flow.from };

  let recipientEntrantId = p.recipientEntrantId;
  if (step !== 'budget') {
    if (t.status !== 'FINISHED') return { ok: false, reason: 'notfinished', p };
    recipientEntrantId = db.prepare('SELECT entrantId FROM tournament_placements WHERE tournamentId = ? AND placement = ? LIMIT 1')
      .get(p.tournamentId, p.placement)?.entrantId;
    if (!recipientEntrantId) return { ok: false, reason: 'norecipient', p };
    // Người xác nhận không được là người nhận thưởng
    if (getEntrant(recipientEntrantId).members.includes(adminId)) return { ok: false, reason: 'conflict', p };
  }
  db.prepare(`UPDATE tournament_cash_prizes SET status = ?, ${flow.by} = ?, recipientEntrantId = ?, note = COALESCE(?, note), updatedAt = ? WHERE id = ?`)
    .run(flow.to, adminId, recipientEntrantId ?? null, note || null, now(), prizeId);
  audit(p.tournamentId, `CASH_${step.toUpperCase()}`, adminId, `#${prizeId}${note ? ` · ${note}` : ''}`);
  return { ok: true, p: db.prepare('SELECT * FROM tournament_cash_prizes WHERE id = ?').get(prizeId), status: flow.to };
});

const listCashPrizes = (tournamentId) =>
  db.prepare('SELECT * FROM tournament_cash_prizes WHERE tournamentId = ? ORDER BY placement, id').all(tournamentId);

module.exports = {
  parseCoinPrizes, getTournament, listActive, listDrafts, listHistory,
  getEntrants, getEntrant, entrantOfUser, getMatches, getMatch, getPlacements, getPayouts, getAudit,
  standings, globalLeaderboard, roundCount,
  createTournament, openRegistration, cancelTournament, register, withdraw, startTournament,
  reportResult, disputeResult, approveResult, rejectResult, adminSetResult,
  addCashPrize, updateCashPrize, listCashPrizes
};
