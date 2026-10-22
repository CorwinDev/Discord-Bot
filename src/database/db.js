const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const DB_DIR = path.join(__dirname, '..', '..', 'data');
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

const db = new Database(path.join(DB_DIR, 'bot.sqlite'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS levels (
    guildId TEXT NOT NULL,
    userId TEXT NOT NULL,
    xp INTEGER NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 0,
    lastMessageAt INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (guildId, userId)
  );

  CREATE TABLE IF NOT EXISTS warnings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guildId TEXT NOT NULL,
    userId TEXT NOT NULL,
    moderatorId TEXT NOT NULL,
    reason TEXT,
    createdAt INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS guild_settings (
    guildId TEXT PRIMARY KEY,
    logChannelId TEXT,
    welcomeChannelId TEXT,
    autoRoleId TEXT
  );

  -- ===== GZW CORE =====
  CREATE TABLE IF NOT EXISTS wallets (
    guildId TEXT NOT NULL,
    userId TEXT NOT NULL,
    balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
    streak INTEGER NOT NULL DEFAULT 0,
    lastDailyDay INTEGER NOT NULL DEFAULT -1,
    lastPlayAt INTEGER NOT NULL DEFAULT 0,
    equippedTitle TEXT,
    equippedFrame TEXT,
    PRIMARY KEY (guildId, userId)
  );

  -- Sổ cái: mọi lần cộng/trừ coin đều được ghi lại (không sửa, không xoá)
  CREATE TABLE IF NOT EXISTS coin_ledger (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guildId TEXT NOT NULL,
    userId TEXT NOT NULL,
    amount INTEGER NOT NULL,
    balanceAfter INTEGER NOT NULL,
    source TEXT NOT NULL,
    reason TEXT,
    createdAt INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_ledger_user ON coin_ledger (guildId, userId, createdAt);

  CREATE TABLE IF NOT EXISTS inventory (
    guildId TEXT NOT NULL,
    userId TEXT NOT NULL,
    itemId TEXT NOT NULL,
    acquiredAt INTEGER NOT NULL,
    PRIMARY KEY (guildId, userId, itemId)
  );

  CREATE TABLE IF NOT EXISTS quest_progress (
    guildId TEXT NOT NULL,
    userId TEXT NOT NULL,
    questId TEXT NOT NULL,
    periodKey INTEGER NOT NULL,
    progress INTEGER NOT NULL DEFAULT 0,
    completed INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (guildId, userId, questId, periodKey)
  );

  CREATE TABLE IF NOT EXISTS achievements (
    guildId TEXT NOT NULL,
    userId TEXT NOT NULL,
    achievementId TEXT NOT NULL,
    earnedAt INTEGER NOT NULL,
    grantedBy TEXT,
    PRIMARY KEY (guildId, userId, achievementId)
  );
`);

const guildSettingsCols = db.prepare('PRAGMA table_info(guild_settings)').all().map((column) => column.name);
if (!guildSettingsCols.includes('welcomeMessage')) {
  db.exec('ALTER TABLE guild_settings ADD COLUMN welcomeMessage TEXT');
}
if (!guildSettingsCols.includes('welcomeTitle')) {
  db.exec('ALTER TABLE guild_settings ADD COLUMN welcomeTitle TEXT');
}

// ===== Migration: idempotency cho sổ cái (refId) =====
const ledgerCols = db.prepare("PRAGMA table_info(coin_ledger)").all().map((c) => c.name);
if (!ledgerCols.includes('refId')) db.exec('ALTER TABLE coin_ledger ADD COLUMN refId TEXT');

db.exec(`
  -- Mỗi (source, refId) chỉ được ghi 1 lần -> chống cộng thưởng trùng (vd. cùng một đơn nạp coin)
  CREATE UNIQUE INDEX IF NOT EXISTS uq_ledger_ref ON coin_ledger (source, refId) WHERE refId IS NOT NULL;

  -- Sổ cái bất biến: không cho UPDATE/DELETE. Sửa sai = tạo bút toán điều chỉnh mới.
  CREATE TRIGGER IF NOT EXISTS trg_ledger_no_update BEFORE UPDATE ON coin_ledger
    BEGIN SELECT RAISE(ABORT, 'coin_ledger là bất biến'); END;
  CREATE TRIGGER IF NOT EXISTS trg_ledger_no_delete BEFORE DELETE ON coin_ledger
    BEGIN SELECT RAISE(ABORT, 'coin_ledger là bất biến'); END;

  -- ===== GZW Management (nhân sự, xử phạt, kháng nghị, báo cáo, sự kiện, ticket) =====
CREATE TABLE IF NOT EXISTS appeals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guildId TEXT NOT NULL,
    caseId INTEGER NOT NULL,
    userId TEXT NOT NULL,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',  -- pending | accepted | denied
    reviewerId TEXT,
    reviewNote TEXT,
    createdAt INTEGER NOT NULL,
    reviewedAt INTEGER
  );
  CREATE UNIQUE INDEX IF NOT EXISTS idx_appeal_one ON appeals (caseId) WHERE status = 'pending';

CREATE TABLE IF NOT EXISTS event_signups (
    eventId INTEGER NOT NULL,
    userId TEXT NOT NULL,
    team INTEGER,
    checkedIn INTEGER NOT NULL DEFAULT 0,
    placement INTEGER,
    rewarded INTEGER NOT NULL DEFAULT 0,
    joinedAt INTEGER NOT NULL,
    PRIMARY KEY (eventId, userId)
  );

CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guildId TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    startsAt INTEGER NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 0,     -- 0 = không giới hạn
    status TEXT NOT NULL DEFAULT 'open',     -- open | finished | cancelled
    rewardBudget INTEGER NOT NULL DEFAULT 0,
    rewardSpent INTEGER NOT NULL DEFAULT 0,
    createdBy TEXT NOT NULL,
    channelId TEXT,
    messageId TEXT,
    createdAt INTEGER NOT NULL
  );

CREATE TABLE IF NOT EXISTS member_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guildId TEXT NOT NULL,
    userId TEXT NOT NULL,
    kind TEXT NOT NULL,                      -- join | leave
    createdAt INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_memberlog ON member_log (guildId, createdAt);

CREATE TABLE IF NOT EXISTS member_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guildId TEXT NOT NULL,
    userId TEXT NOT NULL,
    authorId TEXT NOT NULL,
    note TEXT NOT NULL,
    createdAt INTEGER NOT NULL
  );

CREATE TABLE IF NOT EXISTS mod_cases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guildId TEXT NOT NULL,
    userId TEXT NOT NULL,
    modId TEXT NOT NULL,
    type TEXT NOT NULL,               -- warn | timeout | kick | ban | unban
    reason TEXT,
    durationMs INTEGER,
    revoked INTEGER NOT NULL DEFAULT 0,
    createdAt INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_cases_user ON mod_cases (guildId, userId);

CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guildId TEXT NOT NULL,
    reporterId TEXT NOT NULL,
    targetId TEXT NOT NULL,
    reason TEXT NOT NULL,
    link TEXT,
    status TEXT NOT NULL DEFAULT 'open',     -- open | claimed | resolved | dismissed
    handlerId TEXT,
    messageId TEXT,
    channelId TEXT,
    createdAt INTEGER NOT NULL,
    closedAt INTEGER
  );

CREATE TABLE IF NOT EXISTS staff_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guildId TEXT NOT NULL,
    assigneeId TEXT NOT NULL,
    assignerId TEXT NOT NULL,
    title TEXT NOT NULL,
    dueAt INTEGER,
    status TEXT NOT NULL DEFAULT 'open',     -- open | done
    createdAt INTEGER NOT NULL,
    doneAt INTEGER
  );

CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guildId TEXT NOT NULL,
    userId TEXT NOT NULL,
    channelId TEXT,
    category TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',     -- open | closed
    claimedBy TEXT,
    closedBy TEXT,
    createdAt INTEGER NOT NULL,
    closedAt INTEGER
  );

  -- ===== Booster Appreciation =====
  CREATE TABLE IF NOT EXISTS boost_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guildId TEXT NOT NULL,
    userId TEXT NOT NULL,
    messageId TEXT NOT NULL UNIQUE,   -- ID tin nhắn hệ thống của Discord -> chống ghi trùng
    status TEXT NOT NULL,             -- REWARDED | PENDING (chưa có chính sách thưởng, chờ admin) | LINKED (cùng một sự kiện đã tính)
    coins INTEGER NOT NULL DEFAULT 0,
    approvedBy TEXT,
    createdAt INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_boost_user ON boost_events (guildId, userId, createdAt);

`);

// ===== Booster status (theo dõi đang boost / đã ngừng) =====
db.exec(`
  -- Chính sách thưởng Boost do admin cấu hình (ghi đè giá trị mặc định trong config)
  CREATE TABLE IF NOT EXISTS booster_policy (
    guildId TEXT PRIMARY KEY,
    coinsPerBoost INTEGER NOT NULL,
    enabled INTEGER NOT NULL DEFAULT 1,
    updatedBy TEXT,
    updatedAt INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS booster_status (
    guildId TEXT NOT NULL,
    userId TEXT NOT NULL,
    active INTEGER NOT NULL DEFAULT 1,
    since INTEGER NOT NULL,
    endedAt INTEGER,
    PRIMARY KEY (guildId, userId)
  );
`);

// ===== GZW Tournament =====
db.exec(`
  CREATE TABLE IF NOT EXISTS tournaments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guildId TEXT NOT NULL,
    name TEXT NOT NULL,
    game TEXT NOT NULL,
    format TEXT NOT NULL DEFAULT 'single_elimination',
    teamSize INTEGER NOT NULL DEFAULT 1,
    maxEntrants INTEGER NOT NULL,
    registerUntil INTEGER NOT NULL,
    startsAt INTEGER,
    schedule TEXT,
    rules TEXT NOT NULL,
    winCondition TEXT NOT NULL,
    coinPrizes TEXT NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'DRAFT',   -- DRAFT | OPEN | RUNNING | FINISHED | CANCELLED
    createdBy TEXT NOT NULL,
    createdAt INTEGER NOT NULL,
    finishedAt INTEGER
  );
  CREATE INDEX IF NOT EXISTS idx_tour_guild ON tournaments (guildId, status);

  CREATE TABLE IF NOT EXISTS tournament_entrants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tournamentId INTEGER NOT NULL,
    name TEXT NOT NULL,
    captainId TEXT NOT NULL,
    createdAt INTEGER NOT NULL
  );
  CREATE UNIQUE INDEX IF NOT EXISTS uq_entrant_name ON tournament_entrants (tournamentId, name COLLATE NOCASE);

  -- Một người chỉ ở một đội trong cùng một giải
  CREATE TABLE IF NOT EXISTS tournament_members (
    tournamentId INTEGER NOT NULL,
    entrantId INTEGER NOT NULL,
    userId TEXT NOT NULL,
    PRIMARY KEY (tournamentId, userId)
  );

  CREATE TABLE IF NOT EXISTS tournament_matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tournamentId INTEGER NOT NULL,
    round INTEGER NOT NULL,
    idx INTEGER NOT NULL,
    entrantA INTEGER,
    entrantB INTEGER,
    scoreA INTEGER,
    scoreB INTEGER,
    winnerId INTEGER,
    status TEXT NOT NULL,   -- WAITING | PENDING | REPORTED | DISPUTED | DONE | BYE
    reportedBy TEXT,
    evidence TEXT,
    note TEXT,
    approvedBy TEXT,
    updatedAt INTEGER NOT NULL,
    UNIQUE (tournamentId, round, idx)
  );

  CREATE TABLE IF NOT EXISTS tournament_placements (
    tournamentId INTEGER NOT NULL,
    entrantId INTEGER NOT NULL,
    placement INTEGER NOT NULL,
    PRIMARY KEY (tournamentId, entrantId)
  );

  -- Coin đã trao: mỗi người một lần cho mỗi giải (UNIQUE) + refId trong coin_ledger
  CREATE TABLE IF NOT EXISTS tournament_payouts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tournamentId INTEGER NOT NULL,
    entrantId INTEGER NOT NULL,
    userId TEXT NOT NULL,
    placement INTEGER NOT NULL,
    coins INTEGER NOT NULL,
    approvedBy TEXT NOT NULL,
    createdAt INTEGER NOT NULL,
    UNIQUE (tournamentId, userId)
  );

  -- Giải thưởng TIỀN MẶT: chỉ ghi nhận trạng thái, bot KHÔNG chuyển tiền, không nằm trong ví coin
  CREATE TABLE IF NOT EXISTS tournament_cash_prizes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tournamentId INTEGER NOT NULL,
    placement INTEGER NOT NULL,
    amountVnd INTEGER NOT NULL,
    description TEXT,
    recipientEntrantId INTEGER,
    status TEXT NOT NULL DEFAULT 'PLANNED', -- PLANNED | BUDGET_CONFIRMED | RECIPIENT_CONFIRMED | PAID | CANCELLED
    createdBy TEXT NOT NULL,
    budgetBy TEXT,
    recipientBy TEXT,
    paidBy TEXT,
    note TEXT,
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS tournament_audit (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tournamentId INTEGER NOT NULL,
    action TEXT NOT NULL,
    actorId TEXT,
    detail TEXT,
    createdAt INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_tour_audit ON tournament_audit (tournamentId, id);
`);

// ===== GZW CORE: Upgrade / Game Hub / Gift / Safety (gộp từ nhánh v2_1) =====
db.exec(`
  -- ===== GZW CORE: giai đoạn 2 (Upgrade) / 3 (Game Hub) / 4 (Gift) =====
  CREATE TABLE IF NOT EXISTS upgrades (
    guildId TEXT NOT NULL,
    userId TEXT NOT NULL,
    upgradeId TEXT NOT NULL,
    level INTEGER NOT NULL DEFAULT 0,
    updatedAt INTEGER NOT NULL,
    PRIMARY KEY (guildId, userId, upgradeId)
  );

  -- Nhật ký thao tác quản trị / nhạy cảm (chỉ thêm, không sửa, không xoá)
  CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guildId TEXT NOT NULL,
    actorId TEXT NOT NULL,
    action TEXT NOT NULL,
    targetId TEXT,
    detail TEXT,
    createdAt INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_audit_guild ON audit_logs (guildId, id);

  -- Giao dịch tặng coin / vật phẩm giữa thành viên (mã tra cứu = txId)
  CREATE TABLE IF NOT EXISTS transfers (
    txId TEXT PRIMARY KEY,
    guildId TEXT NOT NULL,
    fromId TEXT NOT NULL,
    toId TEXT NOT NULL,
    kind TEXT NOT NULL,          -- coin | item
    amount INTEGER NOT NULL DEFAULT 0,
    itemId TEXT,
    context TEXT,                -- donate | gift | spectator
    note TEXT,
    createdAt INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_transfers_from ON transfers (guildId, fromId, createdAt);
  CREATE INDEX IF NOT EXISTS idx_transfers_to ON transfers (guildId, toId, createdAt);

  -- Admin tạm dừng một module khi có sự cố / nghi gian lận
  CREATE TABLE IF NOT EXISTS module_pauses (
    guildId TEXT NOT NULL,
    module TEXT NOT NULL,
    reason TEXT,
    pausedBy TEXT,
    pausedAt INTEGER NOT NULL,
    PRIMARY KEY (guildId, module)
  );

  -- Thành viên tự tạm dừng tham gia game/tặng coin (không huỷ sớm được)
  CREATE TABLE IF NOT EXISTS self_pauses (
    guildId TEXT NOT NULL,
    userId TEXT NOT NULL,
    until INTEGER NOT NULL,
    PRIMARY KEY (guildId, userId)
  );

  CREATE TABLE IF NOT EXISTS game_matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guildId TEXT NOT NULL,
    channelId TEXT NOT NULL,
    messageId TEXT,
    game TEXT NOT NULL,
    p1 TEXT NOT NULL,
    p2 TEXT NOT NULL,
    status TEXT NOT NULL,        -- waiting | playing | finished | aborted
    score1 INTEGER NOT NULL DEFAULT 0,
    score2 INTEGER NOT NULL DEFAULT 0,
    winnerId TEXT,
    rewarded INTEGER NOT NULL DEFAULT 0,
    createdAt INTEGER NOT NULL,
    endedAt INTEGER
  );
  CREATE INDEX IF NOT EXISTS idx_matches_guild ON game_matches (guildId, status);

  -- Lượt xem: dự đoán miễn phí (không đặt coin) và cổ vũ
  CREATE TABLE IF NOT EXISTS spectator_actions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    matchId INTEGER NOT NULL,
    guildId TEXT NOT NULL,
    userId TEXT NOT NULL,
    kind TEXT NOT NULL,          -- predict | cheer
    value TEXT,                  -- predict: userId được chọn | cheer: emoji
    correct INTEGER,             -- predict: 1/0 sau khi trận kết thúc
    createdAt INTEGER NOT NULL
  );
  CREATE UNIQUE INDEX IF NOT EXISTS idx_predict_once ON spectator_actions (matchId, userId) WHERE kind = 'predict';
`);

// ===== Community: giveaway / suggestion / reaction role / sinh nhật (học từ ý tưởng của CorwinDev/Discord-Bot, MIT) =====
db.exec(`
  CREATE TABLE IF NOT EXISTS giveaways (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guildId TEXT NOT NULL,
    channelId TEXT NOT NULL,
    messageId TEXT,
    prize TEXT NOT NULL,
    winners INTEGER NOT NULL DEFAULT 1,
    hostId TEXT NOT NULL,
    endsAt INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'RUNNING',   -- RUNNING | ENDED | CANCELLED
    winnerIds TEXT,
    createdAt INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_giveaway_status ON giveaways (status, endsAt);
  CREATE TABLE IF NOT EXISTS giveaway_entries (
    giveawayId INTEGER NOT NULL,
    userId TEXT NOT NULL,
    PRIMARY KEY (giveawayId, userId)
  );

  CREATE TABLE IF NOT EXISTS suggestions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guildId TEXT NOT NULL,
    userId TEXT NOT NULL,
    content TEXT NOT NULL,
    channelId TEXT,
    messageId TEXT,
    status TEXT NOT NULL DEFAULT 'OPEN',      -- OPEN | APPROVED | DENIED
    decidedBy TEXT,
    note TEXT,
    createdAt INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS reaction_roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guildId TEXT NOT NULL,
    messageId TEXT NOT NULL,
    roleId TEXT NOT NULL,
    label TEXT NOT NULL,
    UNIQUE (messageId, roleId)
  );

  CREATE TABLE IF NOT EXISTS birthdays (
    guildId TEXT NOT NULL,
    userId TEXT NOT NULL,
    day INTEGER NOT NULL,
    month INTEGER NOT NULL,
    lastAnnouncedYear INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (guildId, userId)
  );
`);

// ===== Migration: boost_events (v10) =====
const boostCols = db.prepare('PRAGMA table_info(boost_events)').all().map((c) => c.name);
// source: 'message' (tin nhắn hệ thống Boost) | 'start' (thành viên bắt đầu Boost); linkedTo: sự kiện đã được tính từ nguồn còn lại
if (!boostCols.includes('source')) db.exec("ALTER TABLE boost_events ADD COLUMN source TEXT NOT NULL DEFAULT 'message'");
if (!boostCols.includes('linkedTo')) db.exec('ALTER TABLE boost_events ADD COLUMN linkedTo INTEGER');
db.exec("UPDATE boost_events SET status = 'PENDING' WHERE status = 'REVIEW'");

// ===== Migration: gỡ bảng thanh toán QR cũ (tính năng đã bị loại bỏ) =====
// Chỉ xoá khi bảng trống. Nếu còn dữ liệu đơn hàng cũ, GIỮ LẠI để bạn xuất/lưu trữ rồi tự xoá.
for (const t of ['payment_events', 'payment_orders']) {
  const exists = db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?").get(t);
  if (!exists) continue;
  const n = db.prepare(`SELECT COUNT(*) AS n FROM ${t}`).get().n;
  if (n === 0) db.exec(`DROP TABLE ${t}`);
  else console.warn(`⚠️  Bảng ${t} còn ${n} dòng dữ liệu cũ (tính năng thanh toán đã bị gỡ). Hãy sao lưu rồi xoá: DROP TABLE ${t};`);
}

module.exports = db;
