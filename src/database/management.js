const db = require('./db');
const eco = require('./economy');
const gzw = require('../config/gzw');
const mg = require('../config/management');
const { audit } = require('./safety');

const now = () => Date.now();

/* ================= Mod cases ================= */
function addCase(guildId, userId, modId, type, reason, durationMs = null) {
  return db.prepare('INSERT INTO mod_cases (guildId, userId, modId, type, reason, durationMs, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(guildId, userId, modId, type, reason || null, durationMs, now()).lastInsertRowid;
}
const getCase = (guildId, id) => db.prepare('SELECT * FROM mod_cases WHERE guildId = ? AND id = ?').get(guildId, id);
const userCases = (guildId, userId, limit = 15) =>
  db.prepare('SELECT * FROM mod_cases WHERE guildId = ? AND userId = ? ORDER BY id DESC LIMIT ?').all(guildId, userId, limit);
const revokeCase = (guildId, id) => db.prepare('UPDATE mod_cases SET revoked = 1 WHERE guildId = ? AND id = ?').run(guildId, id).changes > 0;
const activeWarnCount = (guildId, userId) =>
  db.prepare("SELECT COUNT(*) n FROM mod_cases WHERE guildId = ? AND userId = ? AND type = 'warn' AND revoked = 0").get(guildId, userId).n;

/* ================= Ghi chú nội bộ ================= */
const addNote = (guildId, userId, authorId, note) =>
  db.prepare('INSERT INTO member_notes (guildId, userId, authorId, note, createdAt) VALUES (?, ?, ?, ?, ?)').run(guildId, userId, authorId, note.slice(0, 500), now()).lastInsertRowid;
const listNotes = (guildId, userId, limit = 10) =>
  db.prepare('SELECT * FROM member_notes WHERE guildId = ? AND userId = ? ORDER BY id DESC LIMIT ?').all(guildId, userId, limit);

/* ================= Kháng nghị ================= */
function createAppeal(guildId, userId, caseId, reason) {
  const c = getCase(guildId, caseId);
  if (!c || c.userId !== userId) return { ok: false, reason: 'notyours' };
  if (c.revoked) return { ok: false, reason: 'revoked' };
  if (c.type === 'unban') return { ok: false, reason: 'type' };
  const prior = db.prepare("SELECT COUNT(*) n FROM appeals WHERE caseId = ? AND status = 'denied'").get(caseId).n;
  if (prior >= 1) return { ok: false, reason: 'already_denied' };
  const res = db.prepare("INSERT OR IGNORE INTO appeals (guildId, caseId, userId, reason, createdAt) VALUES (?, ?, ?, ?, ?)").run(guildId, caseId, userId, reason.slice(0, 800), now());
  return res.changes ? { ok: true, id: res.lastInsertRowid, case: c } : { ok: false, reason: 'pending' };
}
const getAppeal = (guildId, id) => db.prepare('SELECT * FROM appeals WHERE guildId = ? AND id = ?').get(guildId, id);
const pendingAppeals = (guildId, limit = 10) => db.prepare("SELECT * FROM appeals WHERE guildId = ? AND status = 'pending' ORDER BY id LIMIT ?").all(guildId, limit);
const reviewAppeal = db.transaction((guildId, id, reviewerId, accept, note) => {
  const a = getAppeal(guildId, id);
  if (!a || a.status !== 'pending') return { ok: false, reason: 'notpending' };
  const c = getCase(guildId, a.caseId);
  if (c && c.modId === reviewerId) return { ok: false, reason: 'own_case' }; // người ra quyết định không tự duyệt kháng nghị của mình
  db.prepare('UPDATE appeals SET status = ?, reviewerId = ?, reviewNote = ?, reviewedAt = ? WHERE id = ?').run(accept ? 'accepted' : 'denied', reviewerId, note || null, now(), id);
  if (accept) revokeCase(guildId, a.caseId);
  audit(guildId, reviewerId, accept ? 'appeal.accept' : 'appeal.deny', a.userId, `appeal #${id} case #${a.caseId}${note ? ' — ' + note : ''}`);
  return { ok: true, appeal: getAppeal(guildId, id), case: c };
});

/* ================= Báo cáo thành viên ================= */
function createReport(guildId, reporterId, targetId, reason, link) {
  const dup = db.prepare("SELECT 1 FROM reports WHERE guildId = ? AND reporterId = ? AND targetId = ? AND status IN ('open','claimed') LIMIT 1").get(guildId, reporterId, targetId);
  if (dup) return { ok: false, reason: 'duplicate' };
  const open = db.prepare("SELECT COUNT(*) n FROM reports WHERE guildId = ? AND reporterId = ? AND status IN ('open','claimed')").get(guildId, reporterId).n;
  if (open >= 5) return { ok: false, reason: 'toomany' };
  const id = db.prepare('INSERT INTO reports (guildId, reporterId, targetId, reason, link, createdAt) VALUES (?, ?, ?, ?, ?, ?)')
    .run(guildId, reporterId, targetId, reason.slice(0, 800), link || null, now()).lastInsertRowid;
  return { ok: true, id };
}
const getReport = (guildId, id) => db.prepare('SELECT * FROM reports WHERE guildId = ? AND id = ?').get(guildId, id);
const setReportMessage = (id, channelId, messageId) => db.prepare('UPDATE reports SET channelId = ?, messageId = ? WHERE id = ?').run(channelId, messageId, id);
function updateReport(guildId, id, status, handlerId) {
  const closed = status === 'resolved' || status === 'dismissed';
  return db.prepare('UPDATE reports SET status = ?, handlerId = ?, closedAt = ? WHERE guildId = ? AND id = ? AND status IN (\'open\',\'claimed\')')
    .run(status, handlerId, closed ? now() : null, guildId, id).changes > 0;
}

/* ================= Nhiệm vụ nhân sự ================= */
const addTask = (guildId, assigneeId, assignerId, title, dueAt) =>
  db.prepare('INSERT INTO staff_tasks (guildId, assigneeId, assignerId, title, dueAt, createdAt) VALUES (?, ?, ?, ?, ?, ?)').run(guildId, assigneeId, assignerId, title.slice(0, 200), dueAt, now()).lastInsertRowid;
const listTasks = (guildId, assigneeId, status = 'open') =>
  db.prepare('SELECT * FROM staff_tasks WHERE guildId = ? AND assigneeId = ? AND status = ? ORDER BY COALESCE(dueAt, 9e15), id LIMIT 20').all(guildId, assigneeId, status);
const completeTask = (guildId, id, userId, isAdmin) => {
  const t = db.prepare('SELECT * FROM staff_tasks WHERE guildId = ? AND id = ?').get(guildId, id);
  if (!t || t.status !== 'open') return { ok: false, reason: 'notfound' };
  if (t.assigneeId !== userId && !isAdmin) return { ok: false, reason: 'forbidden' };
  db.prepare("UPDATE staff_tasks SET status = 'done', doneAt = ? WHERE id = ?").run(now(), id);
  return { ok: true, task: t };
};
function staffStats(guildId, userId, days = 30) {
  const since = now() - days * 86400000;
  const c = (sql, ...a) => db.prepare(sql).get(...a).n;
  return {
    cases: c('SELECT COUNT(*) n FROM mod_cases WHERE guildId = ? AND modId = ? AND createdAt >= ?', guildId, userId, since),
    reports: c("SELECT COUNT(*) n FROM reports WHERE guildId = ? AND handlerId = ? AND status IN ('resolved','dismissed') AND closedAt >= ?", guildId, userId, since),
    tickets: c('SELECT COUNT(*) n FROM tickets WHERE guildId = ? AND claimedBy = ? AND createdAt >= ?', guildId, userId, since),
    appeals: c('SELECT COUNT(*) n FROM appeals WHERE guildId = ? AND reviewerId = ? AND reviewedAt >= ?', guildId, userId, since),
    tasksDone: c("SELECT COUNT(*) n FROM staff_tasks WHERE guildId = ? AND assigneeId = ? AND status = 'done' AND doneAt >= ?", guildId, userId, since),
    tasksOpen: c("SELECT COUNT(*) n FROM staff_tasks WHERE guildId = ? AND assigneeId = ? AND status = 'open'", guildId, userId)
  };
}

/* ================= Ticket ================= */
const openTicketOf = (guildId, userId) => db.prepare("SELECT * FROM tickets WHERE guildId = ? AND userId = ? AND status = 'open' LIMIT 1").get(guildId, userId);
const createTicket = (guildId, userId, category, channelId) =>
  db.prepare('INSERT INTO tickets (guildId, userId, category, channelId, createdAt) VALUES (?, ?, ?, ?, ?)').run(guildId, userId, category, channelId, now()).lastInsertRowid;
const ticketByChannel = (channelId) => db.prepare('SELECT * FROM tickets WHERE channelId = ?').get(channelId);
const claimTicket = (id, staffId) => db.prepare("UPDATE tickets SET claimedBy = ? WHERE id = ? AND status = 'open' AND claimedBy IS NULL").run(staffId, id).changes > 0;
const closeTicket = (id, by) => db.prepare("UPDATE tickets SET status = 'closed', closedBy = ?, closedAt = ? WHERE id = ? AND status = 'open'").run(by, now(), id).changes > 0;

/* ================= Sự kiện ================= */
function createEvent(guildId, createdBy, { title, description, startsAt, capacity, rewardBudget, channelId }) {
  return db.prepare('INSERT INTO events (guildId, title, description, startsAt, capacity, rewardBudget, createdBy, channelId, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .run(guildId, title, description || null, startsAt, capacity, rewardBudget, createdBy, channelId, now()).lastInsertRowid;
}
const getEvent = (guildId, id) => db.prepare('SELECT * FROM events WHERE guildId = ? AND id = ?').get(guildId, id);
const setEventMessage = (id, messageId) => db.prepare('UPDATE events SET messageId = ? WHERE id = ?').run(messageId, id);
const listEvents = (guildId, limit = 10) => db.prepare("SELECT * FROM events WHERE guildId = ? AND status = 'open' ORDER BY startsAt LIMIT ?").all(guildId, limit);
const signupCount = (eventId) => db.prepare('SELECT COUNT(*) n FROM event_signups WHERE eventId = ?').get(eventId).n;
const roster = (eventId) => db.prepare('SELECT * FROM event_signups WHERE eventId = ? ORDER BY joinedAt').all(eventId);

const joinEvent = db.transaction((guildId, eventId, userId) => {
  const e = getEvent(guildId, eventId);
  if (!e || e.status !== 'open') return { ok: false, reason: 'closed' };
  if (db.prepare('SELECT 1 FROM event_signups WHERE eventId = ? AND userId = ?').get(eventId, userId)) return { ok: false, reason: 'already' };
  if (e.capacity > 0 && signupCount(eventId) >= e.capacity) return { ok: false, reason: 'full' };
  db.prepare('INSERT INTO event_signups (eventId, userId, joinedAt) VALUES (?, ?, ?)').run(eventId, userId, now());
  return { ok: true, event: e, count: signupCount(eventId) };
});
const leaveEvent = (guildId, eventId, userId) => {
  const e = getEvent(guildId, eventId);
  if (!e || e.status !== 'open') return { ok: false, reason: 'closed' };
  return db.prepare('DELETE FROM event_signups WHERE eventId = ? AND userId = ?').run(eventId, userId).changes
    ? { ok: true, event: e } : { ok: false, reason: 'notjoined' };
};
const checkIn = (guildId, eventId, userId) => {
  const e = getEvent(guildId, eventId);
  if (!e || e.status !== 'open') return { ok: false, reason: 'closed' };
  return db.prepare('UPDATE event_signups SET checkedIn = 1 WHERE eventId = ? AND userId = ?').run(eventId, userId).changes
    ? { ok: true } : { ok: false, reason: 'notjoined' };
};
function makeTeams(guildId, eventId, n, onlyCheckedIn = true) {
  const e = getEvent(guildId, eventId);
  if (!e || e.status !== 'open') return { ok: false, reason: 'closed' };
  const rows = roster(eventId).filter((r) => !onlyCheckedIn || r.checkedIn);
  if (rows.length < n) return { ok: false, reason: 'few', count: rows.length };
  const ids = rows.map((r) => r.userId).sort(() => Math.random() - 0.5);
  const teams = Array.from({ length: n }, () => []);
  ids.forEach((id, i) => { teams[i % n].push(id); db.prepare('UPDATE event_signups SET team = ? WHERE eventId = ? AND userId = ?').run((i % n) + 1, eventId, id); });
  return { ok: true, teams };
}
/**
 * Trao thưởng: chỉ cho người đã check-in, mỗi người một lần, tổng không vượt ngân sách sự kiện.
 * results: [{ userId, placement, coins }]
 */
const rewardEvent = db.transaction((guildId, eventId, actorId, results) => {
  const e = getEvent(guildId, eventId);
  if (!e || e.status !== 'open') return { ok: false, reason: 'closed' };
  const total = results.reduce((s, r) => s + r.coins, 0);
  if (e.rewardSpent + total > e.rewardBudget) return { ok: false, reason: 'budget', remaining: e.rewardBudget - e.rewardSpent, need: total };
  for (const r of results) {
    const su = db.prepare('SELECT * FROM event_signups WHERE eventId = ? AND userId = ?').get(eventId, r.userId);
    if (!su || !su.checkedIn) return { ok: false, reason: 'notcheckedin', userId: r.userId };
    if (su.rewarded) return { ok: false, reason: 'alreadyrewarded', userId: r.userId };
  }
  for (const r of results) {
    if (r.coins > 0) eco.addCoins(guildId, r.userId, r.coins, 'event', `event #${eventId} hạng ${r.placement}`, `event:${eventId}:${r.userId}`);
    db.prepare('UPDATE event_signups SET placement = ?, rewarded = 1 WHERE eventId = ? AND userId = ?').run(r.placement, eventId, r.userId);
  }
  db.prepare('UPDATE events SET rewardSpent = rewardSpent + ? WHERE id = ?').run(total, eventId);
  audit(guildId, actorId, 'event.reward', String(eventId), `${total} coin cho ${results.length} người`);
  return { ok: true, total, remaining: e.rewardBudget - e.rewardSpent - total };
});
function finishEvent(guildId, eventId, status) {
  return db.prepare("UPDATE events SET status = ? WHERE guildId = ? AND id = ? AND status = 'open'").run(status, guildId, eventId).changes > 0;
}
const eventStats = (guildId, eventId) => {
  const r = roster(eventId);
  return { signups: r.length, checkedIn: r.filter((x) => x.checkedIn).length, rewarded: r.filter((x) => x.rewarded).length };
};

/* ================= Thành viên & báo cáo ================= */
const logMember = (guildId, userId, kind) => db.prepare('INSERT INTO member_log (guildId, userId, kind, createdAt) VALUES (?, ?, ?, ?)').run(guildId, userId, kind, now());
function memberFlow(guildId, days = 7) {
  const since = now() - days * 86400000;
  const r = db.prepare("SELECT kind, COUNT(*) n FROM member_log WHERE guildId = ? AND createdAt >= ? GROUP BY kind").all(guildId, since);
  return { joins: r.find((x) => x.kind === 'join')?.n ?? 0, leaves: r.find((x) => x.kind === 'leave')?.n ?? 0 };
}
function activeMembers(guildId, days = 7) {
  const since = now() - days * 86400000;
  return db.prepare('SELECT COUNT(*) n FROM levels WHERE guildId = ? AND lastMessageAt >= ?').get(guildId, since).n;
}
function moderationStats(guildId, days = 30) {
  const since = now() - days * 86400000;
  return {
    byType: db.prepare('SELECT type, COUNT(*) n FROM mod_cases WHERE guildId = ? AND createdAt >= ? GROUP BY type').all(guildId, since),
    reports: db.prepare('SELECT status, COUNT(*) n FROM reports WHERE guildId = ? AND createdAt >= ? GROUP BY status').all(guildId, since),
    appeals: db.prepare('SELECT status, COUNT(*) n FROM appeals WHERE guildId = ? AND createdAt >= ? GROUP BY status').all(guildId, since),
    tickets: db.prepare('SELECT category, COUNT(*) n FROM tickets WHERE guildId = ? AND createdAt >= ? GROUP BY category').all(guildId, since)
  };
}
function memberSearch(guildId, text, limit = 10) {
  const like = `%${text.replace(/[%_]/g, '')}%`;
  return db.prepare('SELECT userId FROM levels WHERE guildId = ? AND userId LIKE ? LIMIT ?').all(guildId, like, limit).map((r) => r.userId);
}

/* ================= Xuất CSV (chỉ cột được phép) ================= */
const csvCell = (v) => {
  let s = v === null || v === undefined ? '' : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; // chống CSV injection
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const toCsv = (rows, cols) => '﻿' + [cols.join(','), ...rows.map((r) => cols.map((c) => csvCell(r[c])).join(','))].join('\n');
/** Thống kê boost (đọc từ boost_events của module Booster Appreciation). */
const boostsSince = (guildId, days = 7) =>
  db.prepare('SELECT COUNT(*) AS n FROM boost_events WHERE guildId = ? AND status != \'LINKED\' AND createdAt >= ?').get(guildId, now() - days * 86400000).n;
const boostCount = (guildId, userId) =>
  db.prepare('SELECT COUNT(*) AS n FROM boost_events WHERE guildId = ? AND userId = ? AND status != \'LINKED\'').get(guildId, userId).n;

function exportData(guildId, type, days = 30) {
  const since = now() - days * 86400000;
  if (type === 'ledger') {
    return toCsv(db.prepare('SELECT id, userId, amount, balanceAfter, source, createdAt FROM coin_ledger WHERE guildId = ? AND createdAt >= ? ORDER BY id').all(guildId, since),
      ['id', 'userId', 'amount', 'balanceAfter', 'source', 'createdAt']);
  }
  if (type === 'moderation') {
    return toCsv(db.prepare('SELECT id, userId, modId, type, reason, durationMs, revoked, createdAt FROM mod_cases WHERE guildId = ? AND createdAt >= ? ORDER BY id').all(guildId, since),
      ['id', 'userId', 'modId', 'type', 'reason', 'durationMs', 'revoked', 'createdAt']);
  }
  if (type === 'events') {
    return toCsv(db.prepare('SELECT e.id AS eventId, e.title, s.userId, s.team, s.checkedIn, s.placement, s.rewarded FROM events e JOIN event_signups s ON s.eventId = e.id WHERE e.guildId = ? AND e.createdAt >= ? ORDER BY e.id').all(guildId, since),
      ['eventId', 'title', 'userId', 'team', 'checkedIn', 'placement', 'rewarded']);
  }
  if (type === 'boosts') {
    return toCsv(db.prepare('SELECT id, userId, status, source, coins, createdAt FROM boost_events WHERE guildId = ? AND createdAt >= ? ORDER BY id').all(guildId, since),
      ['id', 'userId', 'status', 'source', 'coins', 'createdAt']);
  }
  return null;
}

module.exports = {
  addCase, getCase, userCases, revokeCase, activeWarnCount, addNote, listNotes,
  createAppeal, getAppeal, pendingAppeals, reviewAppeal,
  createReport, getReport, setReportMessage, updateReport,
  addTask, listTasks, completeTask, staffStats,
  openTicketOf, createTicket, ticketByChannel, claimTicket, closeTicket,
  createEvent, getEvent, setEventMessage, listEvents, signupCount, roster, joinEvent, leaveEvent, checkIn, makeTeams, rewardEvent, finishEvent, eventStats,
  boostsSince, boostCount, logMember, memberFlow, activeMembers, moderationStats, memberSearch, exportData, toCsv
};
