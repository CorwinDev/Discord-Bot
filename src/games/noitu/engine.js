const fs = require('fs');
const path = require('path');
const db = require('../../database/db');

function normalizeVietnamese(input) {
  let value = String(input || '').toLocaleLowerCase('vi-VN').normalize('NFC').trim();
  const rules = [
    [/o[àáảãạ](?=$|[^\p{L}])/gu, (match) => ({ 'oà': 'òa', 'oá': 'óa', 'oả': 'ỏa', 'oã': 'õa', 'oạ': 'ọa' }[match])],
    [/u[ýỳỷỹỵ](?=$|[^\p{L}])/gu, (match, offset, text) => {
      if (text[offset - 1] === 'q') return match;
      return ({ 'uý': 'úy', 'uỳ': 'ùy', 'uỷ': 'ủy', 'uỹ': 'ũy', 'uỵ': 'ụy' }[match] || match);
    }],
    [/hoà(?=$|[^\p{L}])/gu, () => 'hòa'],
    [/toà(?=$|[^\p{L}])/gu, () => 'tòa']
  ];

  for (const [pattern, replace] of rules) value = value.replace(pattern, replace);
  return value.replace(/[^\p{L}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
}

const rawPairs = JSON.parse(fs.readFileSync(path.join(__dirname, 'assets', 'wordPairs.json'), 'utf8'));
const wordPairs = new Map();
for (const [first, seconds] of Object.entries(rawPairs)) {
  const key = normalizeVietnamese(first);
  const values = wordPairs.get(key) || new Set();
  for (const second of seconds) values.add(normalizeVietnamese(second));
  wordPairs.set(key, values);
}

const phrases = new Set();
for (const [first, seconds] of wordPairs) {
  for (const second of seconds) phrases.add(`${first} ${second}`);
}
const phraseList = [...phrases];

function getChannel(channelId) {
  return db.prepare('SELECT * FROM noitu_channels WHERE channelId = ?').get(channelId) || null;
}

function saveChannel(channel) {
  db.prepare(`INSERT INTO noitu_channels (channelId, guildId, mode, word, history, lastPlayerId, updatedAt)
    VALUES (@channelId, @guildId, @mode, @word, @history, @lastPlayerId, @updatedAt)
    ON CONFLICT(channelId) DO UPDATE SET guildId = excluded.guildId, mode = excluded.mode,
      word = excluded.word, history = excluded.history, lastPlayerId = excluded.lastPlayerId,
      updatedAt = excluded.updatedAt`).run({
    ...channel,
    history: JSON.stringify(channel.history || []),
    updatedAt: Date.now()
  });
}

function addChannel(channelId, guildId, mode = 'bot') {
  saveChannel({ channelId, guildId, mode, word: null, history: [], lastPlayerId: null });
}

function removeChannel(channelId) {
  return db.prepare('DELETE FROM noitu_channels WHERE channelId = ?').run(channelId).changes > 0;
}

function setMode(channelId, mode) {
  const channel = getChannel(channelId);
  if (!channel) return false;
  channel.mode = mode;
  channel.word = null;
  channel.history = [];
  channel.lastPlayerId = null;
  saveChannel(channel);
  return true;
}

function nextWords(lastSyllable, history) {
  const used = new Set(history);
  return [...(wordPairs.get(lastSyllable) || [])]
    .map((second) => `${lastSyllable} ${second}`)
    .filter((phrase) => !used.has(phrase));
}

function chooseBotWord(lastSyllable, history) {
  const options = nextWords(lastSyllable, history)
    .filter((phrase) => nextWords(phrase.split(' ')[1], [...history, phrase]).length > 0);
  return options.length ? options[Math.floor(Math.random() * options.length)] : null;
}

function startGame(channelId) {
  const channel = getChannel(channelId);
  if (!channel) return null;
  let word = null;
  for (let attempt = 0; attempt < 100; attempt++) {
    const candidate = phraseList[Math.floor(Math.random() * phraseList.length)];
    if (chooseBotWord(candidate.split(' ')[1], [candidate])) {
      word = candidate;
      break;
    }
  }
  if (!word) return null;
  channel.word = word;
  channel.history = [word];
  channel.lastPlayerId = null;
  saveChannel(channel);
  return word;
}

function recordMove(guildId, userId) {
  db.prepare(`INSERT INTO noitu_stats (guildId, userId, totalWords, currentStreak, bestStreak)
    VALUES (?, ?, 1, 1, 1)
    ON CONFLICT(guildId, userId) DO UPDATE SET
      totalWords = totalWords + 1,
      currentStreak = currentStreak + 1,
      bestStreak = MAX(bestStreak, currentStreak + 1)`)
    .run(guildId, userId);
}

function processMove(channelId, userId, input) {
  const channel = getChannel(channelId);
  if (!channel) return { type: 'ignored' };
  if (!channel.word) return { type: 'error', message: 'Chưa có ván nối từ. Dùng `/noitu-new` để bắt đầu.' };

  const phrase = normalizeVietnamese(input);
  const parts = phrase.split(' ');
  if (parts.length !== 2) return { type: 'error', message: 'Từ nối cần đúng 2 tiếng, ví dụ: `chân trời`.' };
  if (!phrases.has(phrase)) return { type: 'error', message: `Không tìm thấy **${phrase}** trong từ điển.` };
  if (parts[0] !== channel.word.split(' ').at(-1)) {
    return { type: 'error', message: `Từ tiếp theo cần bắt đầu bằng **${channel.word.split(' ').at(-1)}**.` };
  }

  const history = JSON.parse(channel.history || '[]');
  if (history.includes(phrase)) return { type: 'error', message: `Từ **${phrase}** đã được dùng trong ván này.` };
  if (channel.mode === 'pvp' && channel.lastPlayerId === userId) {
    return { type: 'error', message: 'Đợi người chơi khác nối từ trước nhé.' };
  }

  const previousPlayerId = channel.lastPlayerId;
  history.push(phrase);
  channel.word = phrase;
  channel.lastPlayerId = userId;
  recordMove(channel.guildId, userId);

  if (channel.mode === 'bot') {
    const botWord = chooseBotWord(parts[1], history);
    if (!botWord) {
      channel.word = null;
      channel.history = [];
      channel.lastPlayerId = null;
      saveChannel(channel);
      return { type: 'win', phrase, message: `✅ **${phrase}**\n🤖 Bot bí từ rồi! <@${userId}> thắng ván này. Dùng "/noitu-new" để chơi tiếp.` };
    }
    history.push(botWord);
    channel.word = botWord;
    channel.lastPlayerId = null;
    saveChannel({ ...channel, history });
    return { type: 'bot', phrase, botWord };
  }

  if (!nextWords(parts[1], history).length) {
    channel.word = null;
    channel.history = [];
    channel.lastPlayerId = null;
    saveChannel(channel);
    return { type: 'win', phrase, message: `✅ **${phrase}**\n🏆 Không còn từ để nối. <@${userId}> thắng ván này!` };
  }

  saveChannel({ ...channel, history });
  return { type: 'pvp', phrase };
}

function getHints(channelId, count = 3) {
  const channel = getChannel(channelId);
  if (!channel?.word) return [];
  const history = JSON.parse(channel.history || '[]');
  return nextWords(channel.word.split(' ').at(-1), history).slice(0, count);
}

function getStats(guildId, userId) {
  return db.prepare('SELECT totalWords, currentStreak, bestStreak FROM noitu_stats WHERE guildId = ? AND userId = ?').get(guildId, userId)
    || { totalWords: 0, currentStreak: 0, bestStreak: 0 };
}

function getLeaderboard(guildId, limit = 10) {
  return db.prepare('SELECT userId, totalWords, bestStreak FROM noitu_stats WHERE guildId = ? ORDER BY bestStreak DESC, totalWords DESC LIMIT ?')
    .all(guildId, limit);
}

module.exports = { addChannel, removeChannel, getChannel, setMode, startGame, processMove, getHints, getStats, getLeaderboard, normalizeVietnamese };