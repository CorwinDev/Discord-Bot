const db = require('./db');
const core = require('../config/core');

const LOCAL_OFFSET_MS = core.utcOffsetHours * 3600000;

function localPeriodKeys(timestamp) {
  const local = new Date(timestamp + LOCAL_OFFSET_MS);
  const year = local.getUTCFullYear();
  const month = String(local.getUTCMonth() + 1).padStart(2, '0');
  const day = String(local.getUTCDate()).padStart(2, '0');
  const weekdayFromMonday = (local.getUTCDay() + 6) % 7;
  const weekStart = new Date(Date.UTC(year, local.getUTCMonth(), local.getUTCDate() - weekdayFromMonday));
  return {
    day: `${year}-${month}-${day}`,
    week: weekStart.toISOString().slice(0, 10),
    nextDayAt: Date.UTC(year, local.getUTCMonth(), local.getUTCDate() + 1) - LOCAL_OFFSET_MS
  };
}

function splitVoiceDuration(startAt, endAt) {
  const segments = [];
  let cursor = startAt;
  while (cursor < endAt) {
    const periods = localPeriodKeys(cursor);
    const segmentEnd = Math.min(endAt, periods.nextDayAt);
    segments.push({ day: periods.day, week: periods.week, duration: segmentEnd - cursor });
    cursor = segmentEnd;
  }
  return segments;
}

function addVoicePeriods(guildId, userId, startAt, endAt) {
  if (endAt <= startAt) return;
  const add = db.prepare(`INSERT INTO voice_activity_periods (guildId, userId, periodType, periodKey, totalMs)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT (guildId, userId, periodType, periodKey) DO UPDATE SET totalMs = totalMs + excluded.totalMs`);
  for (const segment of splitVoiceDuration(startAt, endAt)) {
    add.run(guildId, userId, 'day', segment.day, segment.duration);
    add.run(guildId, userId, 'week', segment.week, segment.duration);
  }
}

function recordChat(guildId, userId) {
  const periods = localPeriodKeys(Date.now());
  db.transaction(() => {
    db.prepare(`INSERT INTO chat_activity (guildId, userId, messageCount) VALUES (?, ?, 1)
      ON CONFLICT (guildId, userId) DO UPDATE SET messageCount = messageCount + 1`).run(guildId, userId);
    const add = db.prepare(`INSERT INTO chat_activity_periods (guildId, userId, periodType, periodKey, messageCount)
      VALUES (?, ?, ?, ?, 1)
      ON CONFLICT (guildId, userId, periodType, periodKey) DO UPDATE SET messageCount = messageCount + 1`);
    add.run(guildId, userId, 'day', periods.day);
    add.run(guildId, userId, 'week', periods.week);
  })();
}

function startVoice(guildId, userId, channelId, joinedAt = Date.now()) {
  db.prepare(`INSERT OR IGNORE INTO voice_sessions (guildId, userId, channelId, joinedAt, lastHeartbeatAt, periodizedAt)
    VALUES (?, ?, ?, ?, ?, ?)`).run(guildId, userId, channelId, joinedAt, joinedAt, joinedAt);
}

function finishVoice(guildId, userId, endedAt = Date.now()) {
  const session = db.prepare('SELECT * FROM voice_sessions WHERE guildId = ? AND userId = ?').get(guildId, userId);
  if (!session) return 0;
  const elapsed = Math.max(0, endedAt - session.joinedAt);
  db.transaction(() => {
    addVoicePeriods(guildId, userId, session.periodizedAt ?? session.joinedAt, endedAt);
    db.prepare(`INSERT INTO voice_totals (guildId, userId, totalMs) VALUES (?, ?, ?)
      ON CONFLICT (guildId, userId) DO UPDATE SET totalMs = totalMs + excluded.totalMs`).run(guildId, userId, elapsed);
    db.prepare('DELETE FROM voice_sessions WHERE guildId = ? AND userId = ?').run(guildId, userId);
  })();
  return elapsed;
}

function onVoiceStateUpdate(oldState, newState) {
  const user = newState.member?.user || oldState.member?.user;
  if (!user || user.bot || oldState.channelId === newState.channelId) return;
  const guildId = newState.guild.id;
  const now = Date.now();
  if (oldState.channelId) finishVoice(guildId, user.id, now);
  if (newState.channelId) startVoice(guildId, user.id, newState.channelId, now);
}

function recoverVoiceSessions(client) {
  db.transaction(() => {
    const sessions = db.prepare('SELECT * FROM voice_sessions').all();
    const add = db.prepare(`INSERT INTO voice_totals (guildId, userId, totalMs) VALUES (?, ?, ?)
      ON CONFLICT (guildId, userId) DO UPDATE SET totalMs = totalMs + excluded.totalMs`);
    for (const session of sessions) {
      add.run(session.guildId, session.userId, Math.max(0, session.lastHeartbeatAt - session.joinedAt));
      addVoicePeriods(session.guildId, session.userId, session.periodizedAt ?? session.joinedAt, session.lastHeartbeatAt);
    }
    db.prepare('DELETE FROM voice_sessions').run();

    const insert = db.prepare(`INSERT OR IGNORE INTO voice_sessions (guildId, userId, channelId, joinedAt, lastHeartbeatAt, periodizedAt)
      VALUES (?, ?, ?, ?, ?, ?)`);
    const now = Date.now();
    for (const guild of client.guilds.cache.values()) {
      for (const state of guild.voiceStates.cache.values()) {
        const user = state.member?.user;
        if (state.channelId && user && !user.bot) insert.run(guild.id, user.id, state.channelId, now, now, now);
      }
    }
  })();
}

function startVoiceHeartbeat(client) {
  recoverVoiceSessions(client);
  const timer = setInterval(() => {
    const now = Date.now();
    const sessions = db.prepare('SELECT * FROM voice_sessions').all();
    db.transaction(() => {
      for (const session of sessions) {
        addVoicePeriods(session.guildId, session.userId, session.periodizedAt, now);
        db.prepare('UPDATE voice_sessions SET lastHeartbeatAt = ?, periodizedAt = ? WHERE guildId = ? AND userId = ?')
          .run(now, now, session.guildId, session.userId);
      }
    })();
  }, 60000);
  timer.unref();
  return timer;
}

function voicePeriodLeaderboard(guildId, periodType, periodKey, now = Date.now()) {
  const totals = new Map(db.prepare(`SELECT userId, totalMs FROM voice_activity_periods
    WHERE guildId = ? AND periodType = ? AND periodKey = ?`).all(guildId, periodType, periodKey)
    .map((row) => [row.userId, row.totalMs]));
  for (const session of db.prepare('SELECT userId, periodizedAt FROM voice_sessions WHERE guildId = ?').all(guildId)) {
    for (const segment of splitVoiceDuration(session.periodizedAt, now)) {
      const key = periodType === 'day' ? segment.day : segment.week;
      if (key === periodKey) totals.set(session.userId, (totals.get(session.userId) || 0) + segment.duration);
    }
  }
  return [...totals.entries()].map(([userId, totalMs]) => ({ userId, totalMs }))
    .sort((left, right) => right.totalMs - left.totalMs).slice(0, 10);
}

function currentPeriodKey(periodType, timestamp = Date.now()) {
  return localPeriodKeys(timestamp)[periodType];
}

module.exports = { recordChat, onVoiceStateUpdate, recoverVoiceSessions, startVoiceHeartbeat, currentPeriodKey, voicePeriodLeaderboard };