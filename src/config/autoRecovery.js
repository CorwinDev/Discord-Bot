'use strict';


const env = require('../config/env');
const notifier = require('./webhookNotifier');
const { reportError } = require('./errorReporter');
const { state, addIncident, firstLine } = require('./healthState');

const EXIT_CONFIG = 78; 
const EXIT_RESTART = 1;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const FATAL_CLOSE = {
  4004: 'Token bot không hợp lệ. Kiểm tra biến DISCORD_TOKEN (token có thể đã bị reset trong Developer Portal).',
  4010: 'Shard không hợp lệ.',
  4011: 'Bot cần sharding (quá nhiều server cho 1 shard).',
  4012: 'Phiên bản Gateway API không hợp lệ.',
  4013: 'Gateway Intents không hợp lệ.',
  4014: 'Chưa bật Privileged Gateway Intents. Vào Developer Portal → Bot → bật SERVER MEMBERS INTENT và MESSAGE CONTENT INTENT.'
};

function isFatalLoginError(err) {
  const code = err && err.code;
  if (['TokenInvalid', 'TokenMissing', 'DisallowedIntents', 'InvalidIntents'].includes(code)) return true;
  if (FATAL_CLOSE[code]) return true;
  return /invalid token|disallowed intents|invalid intents/i.test(String((err && err.message) || err));
}

function explainFatal(err) {
  const code = err && err.code;
  if (FATAL_CLOSE[code]) return FATAL_CLOSE[code];
  return /intents/i.test(String((err && err.message) || err)) ? FATAL_CLOSE[4014] : FATAL_CLOSE[4004];
}

const fmtDuration = (sec) => {
  const s = Math.max(0, Math.round(sec));
  if (s < 60) return `${s} giây`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} phút ${s % 60} giây`;
  return `${Math.floor(m / 60)} giờ ${m % 60} phút`;
};

function attach(client, token) {
  const ctl = {
    downSince: null,
    downNotified: false,
    recovering: false,
    attempts: 0,
    nextAttemptAt: 0,
    exiting: false,
    tickCount: 0,
    highPing: 0
  };

  async function shutdown(code, { level = 'error', title, description, ping = false } = {}) {
    if (ctl.exiting) return;
    ctl.exiting = true;
    if (title) notifier.notify({ level, title, description, ping, dedupeMs: 0 });
    await notifier.flush(5000);
    try { await Promise.race([Promise.resolve(client.destroy()), sleep(3000)]); } catch { /* bỏ qua */ }
    process.exit(code);
  }

  function markDown(why) {
    if (ctl.exiting || ctl.downSince) return;
    ctl.downSince = Date.now();
    ctl.downNotified = false;
    state.lastDisconnectAt = ctl.downSince;
    addIncident({ level: 'warn', type: 'connection', message: `Mất kết nối Discord: ${why}` });
  }

  function markUp(source) {
    if (ctl.exiting) return;
    const now = Date.now();
    state.lastReadyAt = now;
    if (!state.firstReadyAt) state.firstReadyAt = now;
    if (ctl.downSince) {
      const secs = (now - ctl.downSince) / 1000;
      state.recoveries++;
      state.lastRecoveryAt = now;
      addIncident({ level: 'recovered', type: 'connection', message: `Đã kết nối lại sau ${fmtDuration(secs)} (${source})` });
      if (ctl.downNotified) {
        notifier.notify({
          level: 'success',
          title: '✅ Bot đã kết nối lại',
          description: `Gián đoạn khoảng **${fmtDuration(secs)}**. Bot đã hoạt động bình thường trở lại.`,
          dedupeMs: 0
        });
      }
    }
    ctl.downSince = null;
    ctl.downNotified = false;
    ctl.attempts = 0;
    ctl.nextAttemptAt = 0;
    state.recoveryAttempts = 0;
  }

  function sendStartup() {
    const restarts = Number(process.env.SUPERVISOR_RESTARTS) || 0;
    const mb = Math.round(process.memoryUsage().rss / 1048576);
    addIncident({ level: 'info', type: 'system', message: restarts ? `Bot khởi động lại (lần ${restarts}) sau sự cố` : 'Bot đã khởi động' });
    notifier.notify({
      level: restarts ? 'warn' : 'success',
      title: restarts ? `🔄 Bot đã khởi động lại sau sự cố: ${client.user?.tag ?? ''}` : `🟢 Bot đã khởi động: ${client.user?.tag ?? ''}`,
      description: restarts ? `Supervisor đã chạy lại bot (lần thứ ${restarts} từ khi bật).` : 'Bot đã đăng nhập và sẵn sàng.',
      fields: [
        { name: 'Server', value: String(client.guilds?.cache?.size ?? '?') },
        { name: 'Lệnh', value: String(client.commands?.size ?? '?') },
        { name: 'RAM', value: `${mb} MB` },
        { name: 'Node', value: process.version },
        { name: 'Tự sửa lỗi', value: env.AUTO_FIX ? 'Bật' : 'Tắt' }
      ],
      dedupeMs: 0
    });
  }

  
  client.once('clientReady', () => {
    if (!state.firstReadyAt) state.firstReadyAt = Date.now();
    sendStartup();
  });
  client.on('shardReady', () => markUp('đăng nhập'));
  client.on('shardResume', () => markUp('resume phiên cũ'));
  client.on('shardReconnecting', () => markDown('đang kết nối lại'));

  client.on('shardDisconnect', (closeEvent, shardId) => {
    if (ctl.exiting) return;
    const code = closeEvent && closeEvent.code;
    if (FATAL_CLOSE[code]) {
      addIncident({ level: 'error', type: 'connection', message: `Discord đóng kết nối (code ${code}): ${FATAL_CLOSE[code]}` });
      shutdown(EXIT_CONFIG, {
        title: `🛑 Bot dừng: cần sửa cấu hình (code ${code})`,
        description: `${FATAL_CLOSE[code]}\n\nBot sẽ không tự khởi động lại cho tới khi bạn sửa xong.`,
        ping: true
      });
      return;
    }
    markDown(`shard ${shardId} đóng (code ${code ?? '?'})`);
  });

  client.on('shardError', (error, shardId) => {
    if (ctl.exiting) return;
    const msg = firstLine((error && error.message) || error);
    addIncident({ level: 'warn', type: 'connection', message: `Lỗi WebSocket shard ${shardId}: ${msg}` });
    notifier.notify({
      level: 'warn',
      title: `⚠️ Lỗi WebSocket (shard ${shardId})`,
      description: msg,
      key: 'shardError',
      dedupeMs: 5 * 60_000
    });
  });

  client.on('warn', (message) => {
    addIncident({ level: 'warn', type: 'discord', isPublic: false, message: String(message) });
  });

  
  client.on('invalidated', () => {
    addIncident({ level: 'error', type: 'connection', message: 'Phiên đăng nhập bị Discord vô hiệu hoá' });
    shutdown(EXIT_RESTART, {
      title: '🔁 Phiên Discord bị vô hiệu hoá',
      description: 'Bot sẽ thoát để chạy lại phiên mới (cần supervisor / Docker restart / PM2).',
      ping: true
    });
  });

  if (client.rest && typeof client.rest.on === 'function') {
    client.rest.on('rateLimited', (info) => {
      if (!info || !info.global) return;
      notifier.notify({
        level: 'warn',
        title: '⏱️ Bị rate limit toàn cục của Discord',
        description: `Tuyến ${info.method ?? ''} ${info.route ?? ''}, chờ khoảng ${Math.ceil((info.timeToReset ?? 0) / 1000)}s.`,
        key: 'globalRateLimit',
        dedupeMs: 5 * 60_000
      });
    });
    client.rest.on('invalidRequestWarning', (info) => {
      notifier.notify({
        level: 'warn',
        title: '🚨 Quá nhiều request không hợp lệ',
        description: `Đã có ${info?.count ?? '?'} request lỗi (401/403/429) trong 10 phút. Ở mức 10.000 Discord sẽ chặn IP tạm thời.`,
        key: 'invalidRequests',
        dedupeMs: 10 * 60_000
      });
    });
  }

  
  async function hardRecover() {
    if (ctl.recovering || ctl.exiting) return;
    ctl.recovering = true;
    ctl.attempts++;
    state.recoveryAttempts = ctl.attempts;

    if (ctl.attempts > env.RECOVERY_MAX_ATTEMPTS) {
      ctl.recovering = false;
      await shutdown(EXIT_RESTART, {
        title: '🛑 Không tự khắc phục được kết nối',
        description: `Đã thử ${env.RECOVERY_MAX_ATTEMPTS} lần nhưng vẫn mất kết nối. Bot sẽ thoát để tiến trình được chạy lại từ đầu.`,
        ping: true
      });
      return;
    }

    const backoff = Math.min(5 * 60_000, 30_000 * 2 ** (ctl.attempts - 1));
    ctl.nextAttemptAt = Date.now() + backoff;
    addIncident({ level: 'warn', type: 'recovery', message: `Tự sửa lỗi lần ${ctl.attempts}/${env.RECOVERY_MAX_ATTEMPTS}: làm mới kết nối` });
    notifier.notify({
      level: 'warn',
      title: `🔧 Tự khắc phục (lần ${ctl.attempts}/${env.RECOVERY_MAX_ATTEMPTS})`,
      description: 'Kết nối không tự phục hồi, bot đang đóng và đăng nhập lại.',
      dedupeMs: 0
    });

    try {
      try { await client.destroy(); } catch { /* bỏ qua */ }
      await sleep(2000);
      await client.login(token);
    } catch (err) {
      if (isFatalLoginError(err)) {
        ctl.recovering = false;
        await shutdown(EXIT_CONFIG, { title: '🛑 Bot dừng: không đăng nhập được', description: explainFatal(err), ping: true });
        return;
      }
      addIncident({ level: 'warn', type: 'recovery', message: `Đăng nhập lại thất bại: ${firstLine(err && err.message)}` });
    } finally {
      ctl.recovering = false;
    }
  }

  
  function slowChecks() {
    
    try {
      require('../database/db').prepare('SELECT 1').get();
      state.dbOk = true;
    } catch (err) {
      state.dbOk = false;
      addIncident({ level: 'error', type: 'database', isPublic: false, message: `Database lỗi: ${firstLine(err && err.message)}` });
      notifier.notify({
        level: 'error',
        title: '🗄️ Database SQLite không truy vấn được',
        description: firstLine(err && err.message),
        key: 'dbDown',
        dedupeMs: 30 * 60_000,
        ping: true
      });
    }

    
    const ping = client.ws && client.ws.ping;
    if (client.isReady() && ping > env.HIGH_PING_MS) ctl.highPing++;
    else ctl.highPing = 0;
    if (ctl.highPing === 3) {
      addIncident({ level: 'warn', type: 'connection', message: `Ping cao liên tục (${ping}ms)` });
      notifier.notify({
        level: 'warn',
        title: '🐢 Ping tới Discord cao',
        description: `Ping hiện tại **${ping}ms** (ngưỡng ${env.HIGH_PING_MS}ms) trong nhiều lần kiểm tra liên tiếp.`,
        key: 'highPing',
        dedupeMs: 15 * 60_000
      });
    }

    
    if (env.MAX_MEMORY_MB > 0) {
      const rss = Math.round(process.memoryUsage().rss / 1048576);
      if (rss > env.MAX_MEMORY_MB) {
        if (env.AUTO_FIX) {
          shutdown(EXIT_RESTART, {
            level: 'warn',
            title: '♻️ Khởi động lại do dùng quá nhiều RAM',
            description: `RAM hiện tại ${rss} MB, vượt ngưỡng ${env.MAX_MEMORY_MB} MB.`
          });
        } else {
          notifier.notify({
            level: 'warn',
            title: '💾 RAM vượt ngưỡng',
            description: `RAM hiện tại ${rss} MB, ngưỡng ${env.MAX_MEMORY_MB} MB.`,
            key: 'memory',
            dedupeMs: 30 * 60_000
          });
        }
      }
    }
  }

  function tick() {
    if (ctl.exiting) return;
    const now = Date.now();
    const graceMs = env.RECOVERY_GRACE_SECONDS * 1000;

    
    if (!client.isReady() && !ctl.downSince && (state.firstReadyAt || now - state.startedAt > graceMs)) {
      markDown('client không ở trạng thái sẵn sàng');
    }

    if (ctl.downSince) {
      const down = now - ctl.downSince;
      if (!ctl.downNotified && down > 20_000) {
        ctl.downNotified = true;
        notifier.notify({
          level: 'warn',
          title: '⚠️ Bot mất kết nối Discord',
          description: env.AUTO_FIX
            ? 'Bot đang tự kết nối lại. Nếu quá lâu, bot sẽ tự làm mới kết nối.'
            : 'Tự sửa lỗi đang tắt (AUTO_FIX=false), cần kiểm tra thủ công nếu kéo dài.',
          dedupeMs: 0
        });
      }
      if (env.AUTO_FIX && down > graceMs && now >= ctl.nextAttemptAt) hardRecover();
    }

    if (++ctl.tickCount % 6 === 0) slowChecks();
  }

  const timer = setInterval(tick, 5000);
  timer.unref();

  
  const crashes = [];
  process.on('uncaughtException', (err) => {
    reportError('Lỗi nghiêm trọng (uncaught exception)', err, { ping: true });
    const now = Date.now();
    crashes.push(now);
    while (crashes.length && now - crashes[0] > 5 * 60_000) crashes.shift();

    if (!env.AUTO_FIX) {
      shutdown(EXIT_RESTART, { title: '💥 Bot thoát do lỗi nghiêm trọng', description: 'AUTO_FIX đang tắt nên bot không tiếp tục chạy.' });
    } else if (crashes.length >= 3) {
      shutdown(EXIT_RESTART, {
        title: '💥 Quá nhiều lỗi nghiêm trọng liên tiếp',
        description: `Có ${crashes.length} lỗi trong 5 phút. Bot thoát để tiến trình được chạy lại sạch sẽ.`,
        ping: true
      });
    }
  });

  
  let signalled = false;
  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => {
      if (signalled) process.exit(0);
      signalled = true;
      addIncident({ level: 'info', type: 'system', message: `Bot nhận ${signal}, đang tắt` });
      shutdown(0, { level: 'warn', title: '⏹️ Bot đang tắt', description: `Nhận tín hiệu ${signal} (tắt thủ công hoặc nền tảng đang redeploy).` });
    });
  }

  
  async function loginWithRetry() {
    let n = 0;
    for (;;) {
      if (ctl.exiting) return;
      try {
        await client.login(token);
        return;
      } catch (err) {
        if (isFatalLoginError(err)) {
          await shutdown(EXIT_CONFIG, {
            title: '🛑 Bot dừng: không đăng nhập được',
            description: `${explainFatal(err)}\n\nBot sẽ không tự khởi động lại cho tới khi bạn sửa xong.`,
            ping: true
          });
          return;
        }
        n++;
        const msg = firstLine((err && err.message) || err);
        addIncident({ level: 'warn', type: 'connection', message: `Đăng nhập thất bại (lần ${n}): ${msg}` });
        if (!env.AUTO_FIX) {
          await shutdown(EXIT_RESTART, { title: '🛑 Đăng nhập thất bại', description: msg });
          return;
        }
        const wait = Math.min(60_000, 2000 * 2 ** Math.min(n, 5)) + Math.floor(Math.random() * 1000);
        if (n === 1 || n % 5 === 0) {
          notifier.notify({
            level: 'warn',
            title: '⚠️ Chưa đăng nhập được Discord',
            description: `Lần thử ${n}: ${msg}\nSẽ thử lại sau khoảng ${Math.round(wait / 1000)} giây.`,
            key: 'loginFail',
            dedupeMs: 5 * 60_000
          });
        }
        try { await client.destroy(); } catch { /* bỏ qua */ }
        await sleep(wait);
      }
    }
  }

  return { loginWithRetry, shutdown };
}

module.exports = { attach, EXIT_CONFIG, EXIT_RESTART };