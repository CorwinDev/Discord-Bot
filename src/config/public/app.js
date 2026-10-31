(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const TOKEN_KEY = 'dashboardToken';
  const REFRESH_MS = 5000;
  const MAX_POINTS = 60;

  const STATUS_TEXT = {
    online: 'Đang hoạt động bình thường',
    degraded: 'Đang hoạt động nhưng có cảnh báo',
    reconnecting: 'Mất kết nối, đang tự kết nối lại',
    offline: 'Mất kết nối, cần kiểm tra',
    starting: 'Đang khởi động'
  };
  const LEVEL_TEXT = { error: 'Lỗi', warn: 'Cảnh báo', recovered: 'Đã khắc phục', info: 'Thông tin' };

  let token = '';
  try { token = localStorage.getItem(TOKEN_KEY) || ''; } catch { /* trình duyệt chặn storage */ }

  const pings = [];
  let timer = null;

  function duration(sec) {
    sec = Math.max(0, Math.floor(sec));
    const d = Math.floor(sec / 86400);
    const h = Math.floor((sec % 86400) / 3600);
    const m = Math.floor((sec % 3600) / 60);
    if (d) return `${d} ngày ${h} giờ`;
    if (h) return `${h} giờ ${m} phút`;
    if (m) return `${m} phút`;
    return `${sec} giây`;
  }

  const fmtNumber = (n) => new Intl.NumberFormat('vi-VN').format(n);
  const fmtTime = (ts) => new Date(ts).toLocaleString('vi-VN', { hour12: false });

  function setText(id, value) { $(id).textContent = value; }

  function listItem(parent, build) {
    const li = document.createElement('li');
    build(li);
    parent.appendChild(li);
  }

  function drawTrace() {
    const path = $('tracePath');
    const valid = pings.filter((p) => p !== null);
    if (valid.length < 2) { path.setAttribute('d', ''); return; }
    const top = Math.max(100, ...valid);
    const step = 600 / (MAX_POINTS - 1);
    const offset = (MAX_POINTS - pings.length) * step;
    let d = '';
    pings.forEach((p, i) => {
      if (p === null) return;
      const x = offset + i * step;
      const y = 88 - (p / top) * 76;
      d += `${d && pings[i - 1] !== null ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`;
    });
    path.setAttribute('d', d);
    setText('traceNote', `Ping cao nhất trong ${pings.length} lần đo gần đây: ${Math.max(...valid)}ms.`);
  }

  function render(data) {
    $('login').hidden = true;
    $('content').hidden = false;

    document.body.dataset.status = data.status;
    document.title = `${STATUS_TEXT[data.status] || 'Tình hình bot'} · ${data.bot ? data.bot.tag : 'Bot'}`;
    setText('botName', data.bot ? data.bot.tag : 'Bot Discord');
    setText('botSub', data.view === 'full' ? 'Chế độ xem đầy đủ' : 'Chế độ xem công khai');
    setText('statusText', STATUS_TEXT[data.status] || data.status);

    pings.push(typeof data.ping === 'number' ? data.ping : null);
    if (pings.length > MAX_POINTS) pings.shift();
    drawTrace();

    setText('sPing', data.ping === null ? '–' : `${data.ping} ms`);
    setText('sUptime', duration(data.uptime.processSec));
    setText('sConnected', data.uptime.connectedSec ? duration(data.uptime.connectedSec) : '–');
    setText('sGuilds', fmtNumber(data.guilds));
    setText('sMembers', fmtNumber(data.members));
    setText('sCommands', fmtNumber(data.commands));
    setText('sMem', `${data.memory.rssMB} MB`);
    setText('sRecoveries', fmtNumber(data.recovery.recoveries));

    const shards = $('shards');
    shards.replaceChildren();
    if (!data.shards.length) {
      listItem(shards, (li) => { li.className = 'empty'; li.textContent = 'Chưa có kết nối nào.'; });
    }
    for (const shard of data.shards) {
      listItem(shards, (li) => {
        const name = document.createElement('span');
        name.textContent = `Shard ${shard.id}`;
        const st = document.createElement('span');
        st.className = shard.status === 'Ready' ? '' : 'muted';
        st.textContent = shard.status === 'Ready' ? 'Sẵn sàng' : shard.status;
        li.append(name, st);
      });
    }

    const system = $('system');
    system.replaceChildren();
    const rows = [
      ['Cơ sở dữ liệu', data.database.ok ? 'Bình thường' : 'Lỗi'],
      ['Tự sửa lỗi', data.recovery.autoFix ? 'Bật' : 'Tắt'],
      ['Thông báo webhook', data.alerts.webhookConfigured ? `Bật (${data.alerts.sent} đã gửi)` : 'Chưa cấu hình'],
      ['Node.js', data.node]
    ];
    for (const [label, value] of rows) {
      listItem(system, (li) => {
        const a = document.createElement('span');
        a.textContent = label;
        const b = document.createElement('span');
        b.className = 'muted';
        b.textContent = value;
        li.append(a, b);
      });
    }

    const incidents = $('incidents');
    incidents.replaceChildren();
    if (!data.incidents.length) {
      listItem(incidents, (li) => { li.className = 'empty'; li.textContent = 'Chưa có sự cố nào kể từ lần khởi động này.'; });
    }
    for (const item of data.incidents) {
      listItem(incidents, (li) => {
        li.dataset.level = item.level;
        const time = document.createElement('time');
        time.dateTime = new Date(item.ts).toISOString();
        time.textContent = `${fmtTime(item.ts)} · ${LEVEL_TEXT[item.level] || item.level}`;
        const p = document.createElement('p');
        p.textContent = item.message;
        li.append(time, p);
      });
    }

    setText('updated', `Cập nhật lúc ${fmtTime(data.generatedAt)}. Tự làm mới mỗi ${REFRESH_MS / 1000} giây.`);
  }

  function showLogin(message) {
    $('content').hidden = true;
    $('login').hidden = false;
    document.body.dataset.status = 'starting';
    setText('statusText', 'Cần mật khẩu');
    setText('botSub', 'Trang này được bảo vệ');
    setText('loginError', message || '');
    $('token').focus();
  }

  async function load() {
    try {
      const res = await fetch('/api/status', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        cache: 'no-store'
      });
      if (res.status === 401) {
        token = '';
        try { localStorage.removeItem(TOKEN_KEY); } catch { /* bỏ qua */ }
        showLogin($('login').hidden ? '' : 'Mật khẩu chưa đúng, thử lại.');
        return;
      }
      if (res.status === 429) { setText('updated', 'Bạn gửi quá nhiều yêu cầu, trang sẽ thử lại sau ít phút.'); return; }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      render(await res.json());
    } catch {
      document.body.dataset.status = 'offline';
      setText('statusText', 'Không tải được trạng thái (có thể bot hoặc máy chủ đang tắt)');
      pings.push(null);
      if (pings.length > MAX_POINTS) pings.shift();
      drawTrace();
    }
  }

  $('login').addEventListener('submit', (event) => {
    event.preventDefault();
    token = $('token').value.trim();
    if (!token) return;
    try { localStorage.setItem(TOKEN_KEY, token); } catch { /* bỏ qua */ }
    load();
  });

  function schedule() {
    clearInterval(timer);
    timer = setInterval(() => { if (!document.hidden) load(); }, REFRESH_MS);
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) load(); });

  load();
  schedule();
})();