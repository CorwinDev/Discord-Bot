const db = require('./db');
const gzw = require('../config/gzw');

/* ============ Audit log (chỉ thêm, không sửa/xoá) ============ */
function audit(guildId, actorId, action, targetId = null, detail = null) {
  db.prepare('INSERT INTO audit_logs (guildId, actorId, action, targetId, detail, createdAt) VALUES (?, ?, ?, ?, ?, ?)')
    .run(guildId, actorId ?? 'system', action, targetId, detail ? String(detail).slice(0, 500) : null, Date.now());
}
function recentAudit(guildId, limit = 10) {
  return db.prepare('SELECT * FROM audit_logs WHERE guildId = ? ORDER BY id DESC LIMIT ?').all(guildId, limit);
}

/* ============ Tạm dừng module (admin) ============ */
function pauseModule(guildId, module, reason, actorId) {
  db.prepare(`INSERT INTO module_pauses (guildId, module, reason, pausedBy, pausedAt) VALUES (?, ?, ?, ?, ?)
              ON CONFLICT(guildId, module) DO UPDATE SET reason = excluded.reason, pausedBy = excluded.pausedBy, pausedAt = excluded.pausedAt`)
    .run(guildId, module, reason, actorId, Date.now());
  audit(guildId, actorId, 'module.pause', module, reason);
}
function resumeModule(guildId, module, actorId) {
  const r = db.prepare('DELETE FROM module_pauses WHERE guildId = ? AND module = ?').run(guildId, module);
  if (r.changes) audit(guildId, actorId, 'module.resume', module, null);
  return r.changes > 0;
}
const getPause = (guildId, module) =>
  db.prepare('SELECT * FROM module_pauses WHERE guildId = ? AND module = ?').get(guildId, module);
const listPauses = (guildId) => db.prepare('SELECT * FROM module_pauses WHERE guildId = ?').all(guildId);

/* ============ Thành viên tự tạm dừng ============ */
function setSelfPause(guildId, userId, hours) {
  const now = Date.now();
  const cur = db.prepare('SELECT until FROM self_pauses WHERE guildId = ? AND userId = ?').get(guildId, userId);
  // Không rút ngắn được thời gian đang tạm dừng
  const until = Math.max(now + hours * 3600000, cur?.until ?? 0);
  db.prepare(`INSERT INTO self_pauses (guildId, userId, until) VALUES (?, ?, ?)
              ON CONFLICT(guildId, userId) DO UPDATE SET until = excluded.until`).run(guildId, userId, until);
  return until;
}
function selfPauseUntil(guildId, userId) {
  const r = db.prepare('SELECT until FROM self_pauses WHERE guildId = ? AND userId = ?').get(guildId, userId);
  return r && r.until > Date.now() ? r.until : null;
}

/**
 * Cổng kiểm tra dùng chung cho lệnh: trả về chuỗi lý do chặn, hoặc null nếu được phép.
 * @param {string} module  một trong gzw.modules
 * @param {boolean} respectSelfPause  game/tặng coin tôn trọng self-pause
 */
function gate(guildId, userId, module, respectSelfPause = false) {
  const p = getPause(guildId, module);
  if (p) return `🛑 Tính năng này đang được quản trị tạm dừng${p.reason ? `: ${p.reason}` : '.'}`;
  if (respectSelfPause) {
    const until = selfPauseUntil(guildId, userId);
    if (until) return `🌙 Bạn đang tự tạm dừng đến <t:${Math.floor(until / 1000)}:f> (<t:${Math.floor(until / 1000)}:R>).`;
  }
  return null;
}

/* ============ Thống kê kinh tế cho admin ============ */
function economyStats(guildId, days = 7) {
  const since = Date.now() - days * 86400000;
  const bySource = db.prepare(`
    SELECT source, SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) AS earned,
           SUM(CASE WHEN amount < 0 THEN -amount ELSE 0 END) AS spent, COUNT(*) AS n
    FROM coin_ledger WHERE guildId = ? AND createdAt >= ? GROUP BY source ORDER BY earned DESC`).all(guildId, since);
  const supply = db.prepare('SELECT COALESCE(SUM(balance),0) AS total, COUNT(*) AS wallets FROM wallets WHERE guildId = ?').get(guildId);
  return { bySource, supply, days };
}

module.exports = {
  audit, recentAudit, pauseModule, resumeModule, getPause, listPauses,
  setSelfPause, selfPauseUntil, gate, economyStats, modules: gzw.modules
};
