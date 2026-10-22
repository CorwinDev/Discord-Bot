const gzw = require('../config/gzw');
const db = require('../database/db');
const T = require('../database/tournaments');
const { fmt, coin } = require('./gzwUi');

const STATUS = {
  DRAFT: '📝 Nháp (chưa công bố)', OPEN: '🟢 Đang mở đăng ký', RUNNING: '⚔️ Đang diễn ra',
  FINISHED: '🏁 Đã kết thúc', CANCELLED: '⛔ Đã huỷ'
};
const MATCH_ICON = { WAITING: '⏳', PENDING: '🕹️', REPORTED: '📨', DISPUTED: '⚠️', DONE: '✅', BYE: '➖' };
const CASH_STATUS = {
  PLANNED: 'dự kiến', BUDGET_CONFIRMED: 'đã xác nhận ngân sách', RECIPIENT_CONFIRMED: 'đã xác nhận người nhận',
  PAID: 'đã thanh toán', CANCELLED: 'đã huỷ'
};
const PLACE = { 1: '🥇 Hạng 1', 2: '🥈 Hạng 2', 3: '🥉 Hạng 3 (đồng hạng)' };

const ts = (ms) => `<t:${Math.floor(ms / 1000)}:f>`;

function roundName(round, total) {
  const left = total - round;
  if (left === 0) return 'Chung kết';
  if (left === 1) return 'Bán kết';
  if (left === 2) return 'Tứ kết';
  return `Vòng ${round}`;
}

/** Nhập "2026-11-01 20:00" (giờ theo utcOffsetHours của bot, mặc định UTC+7). Trả null nếu sai định dạng. */
function parseLocalDateTime(text) {
  const m = String(text).trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})[ T](\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const [y, mo, d, h, mi] = m.slice(1).map(Number);
  const utc = Date.UTC(y, mo - 1, d, h, mi);
  const chk = new Date(utc);
  if (chk.getUTCMonth() !== mo - 1 || chk.getUTCDate() !== d || h > 23 || mi > 59) return null;
  return utc - gzw.utcOffsetHours * 3600000;
}

const entrantLabel = (e) => (e ? `**${e.name}**` : '*(chờ kết quả)*');
const mentions = (ids) => ids.map((id) => `<@${id}>`).join(' ');

/** Các field embed mô tả nhánh đấu, mỗi vòng một nhóm (tự chia nhỏ để không vượt giới hạn 1024 ký tự). */
function bracketFields(tournamentId) {
  const entrants = new Map(T.getEntrants(tournamentId).map((e) => [e.id, e]));
  const matches = T.getMatches(tournamentId);
  const total = T.roundCount(tournamentId);
  const fields = [];
  for (let r = 1; r <= total; r++) {
    const lines = matches.filter((m) => m.round === r).map((m) => {
      const a = entrants.get(m.entrantA), b = entrants.get(m.entrantB);
      if (m.status === 'BYE') return `${MATCH_ICON.BYE} ${entrantLabel(a || b)} — được miễn vòng`;
      const score = m.scoreA !== null && m.scoreB !== null ? ` ${m.scoreA}–${m.scoreB} ` : ' vs ';
      return `${MATCH_ICON[m.status]} \`#${m.id}\` ${entrantLabel(a)}${score}${entrantLabel(b)}`;
    });
    let chunk = '', part = 0;
    const flush = () => {
      if (!chunk) return;
      fields.push({ name: part === 0 ? roundName(r, total) : `${roundName(r, total)} (tiếp)`, value: chunk });
      chunk = ''; part++;
    };
    for (const l of lines) {
      if ((chunk + '\n' + l).length > 1000) flush();
      chunk += (chunk ? '\n' : '') + l;
    }
    flush();
  }
  return fields.slice(0, 24);
}

function prizeText(t) {
  const prizes = JSON.parse(t.coinPrizes || '{}');
  const lines = Object.entries(prizes).map(([p, c]) => `${PLACE[p]}: **${coin(c)}**${t.teamSize > 1 ? ' / thành viên' : ''}`);
  const cash = T.listCashPrizes(t.id).filter((c) => c.status !== 'CANCELLED');
  for (const c of cash) lines.push(`💵 ${PLACE[c.placement]}: **${fmt(c.amountVnd)}đ**${c.description ? ` (${c.description})` : ''} — ${CASH_STATUS[c.status]}`);
  return lines.length ? lines.join('\n') : 'Chưa công bố giải thưởng.';
}

/** Gửi tin vào kênh log của server (nếu đã cấu hình) để ban tổ chức thấy việc cần duyệt. */
function notifyStaff(guild, content) {
  const row = db.prepare('SELECT logChannelId FROM guild_settings WHERE guildId = ?').get(guild.id);
  const ch = row?.logChannelId && guild.channels.cache.get(row.logChannelId);
  return ch ? ch.send({ content, allowedMentions: { parse: [] } }).catch(() => {}) : Promise.resolve();
}

module.exports = { STATUS, MATCH_ICON, CASH_STATUS, PLACE, ts, roundName, parseLocalDateTime, entrantLabel, mentions, bracketFields, prizeText, notifyStaff };
