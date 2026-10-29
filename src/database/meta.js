'use strict';

const db = require('./db');

// bot_meta: giá trị chung của bot (được backup cùng dữ liệu, sống sót qua restart)
// backup_state: trạng thái cục bộ của hệ thống backup (KHÔNG backup, KHÔNG khôi phục)
db.exec(`
  CREATE TABLE IF NOT EXISTS bot_meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS backup_state (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

const make = (table) => {
  const getStmt = db.prepare(`SELECT value FROM ${table} WHERE key = ?`);
  const setStmt = db.prepare(`INSERT INTO ${table} (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`);
  return {
    get: (key, def = null) => { const r = getStmt.get(key); return r ? r.value : def; },
    getNum: (key, def = 0) => { const r = getStmt.get(key); const n = r ? Number(r.value) : NaN; return Number.isFinite(n) ? n : def; },
    set: (key, value) => { setStmt.run(key, String(value)); }
  };
};

module.exports = { meta: make('bot_meta'), local: make('backup_state') };