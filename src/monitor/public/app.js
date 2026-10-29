(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const TOKEN_KEY = 'dashboardToken';
  const REFRESH_MS = 5000;

  const STATUS_TEXT = {
    online: 'Đang hoạt động bình thường',
    degraded: 'Đang hoạt động nhưng có cảnh báo',
    reconnecting: 'Mất kết nối, đang tự kết nối lại',
    offline: 'Mất kết nối, cần kiểm tra',
    starting: 'Đang khởi động'
  };
  const LEVEL_TEXT = { error: 'Lỗi', warn: 'Cảnh báo', recovered: 'Đã khắc phục', info: 'Thông tin' };
  const REPORT_TEXT = { success: 'Không có lỗi', warn: 'Có cảnh báo', error: 'Có lỗi' };

  let token = '';
  try { token = localStorage.getItem(TOKEN_KEY) || ''; } catch { /* trình duyệt chặn storage */ }

  let timer = null;
  // Để đồng hồ chạy từng giây giữa hai lần tải số liệu
  let clockBase = null; // { totalSec, sessionSec, fetchedAt, running }

  const fmtNumber = (n) => new Intl.NumberFormat('vi-VN').format(n);
  const fmtTime = (ts) => new Date(ts).toLocaleString('vi-VN', { hour12: false });
  const fmtDate = (ts) => new Date(ts).toLocaleDateString('vi-VN');
  const setText = (id, value) => { $(id).textContent = value; };

  function parts(sec) {
    sec = Math.max(0, Math.floor(sec));
    return { h: Math.floor(sec / 3600), m: Math.floor((sec % 3600) / 60), s: sec % 60 };
  }

  function duration(sec) {
    const { h, m } = parts(sec);
    const d = Math.floor(h / 24);
    if (d) return `${d} ngày ${h % 24} giờ`;
    if (h) return `${h} giờ ${m} phút`;
    if (m) return `${m} phút`;
    return `${Math.floor(sec)} giây`;
  }

  function renderClock() {
    if (!clockBase) return;
    const extra = clockBase.running ? (Date.now() - clockBase.fetchedAt) / 1000 : 0;
    const t = parts(clockBase.totalSec + extra);
    const el = $('clock');
    el.replaceChildren();
    const add = (value, unit) => {
      el.append(document.createTextNode(fmtNumber(value)));
      const small = document.createElement('small');
      small.textContent = unit;
      el.append(small);
    };
    add(t.h, 'giờ');
    add(t.m, 'phút');
    add(t.s, 'giây');
    el.setAttribute('aria-label', `${t.h} giờ ${t.m} phút`);
  }

  function drawTrace(history) {
    const line = $('tracePath');
    const area = $('traceArea');
    const values = history.map((p) => p.ping);
    if (values.length < 2) {
      line.setAttribute('d', '');
      area.setAttribute('d', '');
      setText('traceNote', 'Đang chờ số liệu ping (bot đo mỗi 10 giây).');
      return;
    }
    const top = Math.max(100, ...values);
    const step = 600 / (values.length - 1);
    const pts = values.map((v, i) => [i * step, 100 - (v / top) * 88]);
    const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join('');
    line.setAttribute('d', d);
    area.setAttribute('d', `${d}L600 110L0 110Z`);
    const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
    setText('traceNote', `${values.length} lần đo gần đây: trung bình ${avg}ms, cao nhất ${Math.max(...values)}ms.`);
  }

  function row(parent, label, value, tone) {
    const li = document.createElement('li');
    const a = document.createElement('span');
    a.textContent = label;
    const b = document.createElement('span');
    b.className = `val ${tone || ''}`.trim();
    b.textContent = value;
    li.append(a, b);
    parent.appendChild(li);
  }

  function netText(n) {
    if (!n) return ['Chưa đo', 'muted'];
    if (n.ok) return [`Thông · ${n.ms}ms`, 'ok'];
    return [n.error || `Lỗi (HTTP ${n.status})`, 'bad'];
  }

  function render(data) {
    $('login').hidden = true;
    $('content').hidden = false;

    document.body.dataset.status = data.status;
    document.title = `${STATUS_TEXT[data.status] || 'Tình hình bot'} · ${data.bot ? data.bot.tag : 'Bot'}`;
    setText('botName', data.bot ? data.bot.tag : 'Bot Discord');
    setText('statusText', STATUS_TEXT[data.status] || data.status);

    const u = data.uptime;
    clockBase = {
      totalSec: u.totalOnlineSec,
      fetchedAt: Date.now(),
      running: data.status === 'online' || data.status === 'degraded'
    };
    renderClock();
    setText('heroSub', `Phiên hiện tại ${duration(u.processSec)}. Khởi động lần thứ ${fmtNumber(u.bootCount)}, tính từ ${fmtDate(u.firstOnlineAt)}. Số giờ này được sao lưu nên không mất khi bot khởi động lại.`);

    drawTrace(data.pingHistory || []);

    setText('sPing', data.ping === null ? '–' : `${data.ping} ms`);
    setText('sConnected', u.connectedSec ? duration(u.connectedSec) : '–');
    setText('sGuilds', fmtNumber(data.guilds));
    setText('sMembers', fmtNumber(data.members));
    setText('sCommands', fmtNumber(data.commands));
    setText('sMem', `${data.memory.rssMB} MB`);
    setText('sRecoveries', fmtNumber(data.recovery.recoveries));

    const system = $('system');
    system.replaceChildren();
    const [dTxt, dTone] = netText(data.network && data.network.discord);
    const [iTxt, iTone] = netText(data.network && data.network.internet);
    row(system, 'Kết nối tới Discord API', dTxt, dTone);
    row(system, 'Internet', iTxt, iTone);
    row(system, 'Cơ sở dữ liệu', data.database.ok ? 'Bình thường' : 'Lỗi', data.database.ok ? 'ok' : 'bad');

    const b = data.backup;
    if (!b.enabled) row(system, 'Sao lưu dữ liệu', 'Đang tắt', 'muted');
    else if (b.pendingRestore) row(system, 'Sao lưu dữ liệu', 'Đang chờ khôi phục dữ liệu', 'warn');
    else if (b.lastBackupAt) row(system, 'Sao lưu dữ liệu', `${fmtTime(b.lastBackupAt)} · ${b.sizeKB} KB`, b.failures && !b.count ? 'warn' : 'ok');
    else row(system, 'Sao lưu dữ liệu', 'Chưa có bản nào', 'warn');
    if (b.lastRestoreAt) row(system, 'Lần khôi phục gần nhất', fmtTime(b.lastRestoreAt), 'muted');

    row(system, 'Tự sửa lỗi', data.recovery.autoFix ? 'Bật' : 'Tắt', 'muted');
    row(system, 'Thông báo webhook', data.alerts.webhookConfigured ? `Bật · ${data.alerts.sent} đã gửi` : 'Chưa cấu hình', data.alerts.webhookConfigured ? '' : 'warn');
    row(system, 'Node.js', data.node, 'muted');

    const report = $('report');
    if (data.lastReport) {
      const r = data.lastReport;
      report.hidden = false;
      $('reportEmpty').hidden = true;
      report.dataset.level = r.level;
      setText('reportTitle', `${REPORT_TEXT[r.level] || ''} trong ${r.windowMin} phút qua`);
      setText('reportWhen', `${fmtTime(r.at)} · ${r.errors} lỗi, ${r.warnings} cảnh báo, ${r.disconnects} lần mất kết nối`);
    } else {
      report.hidden = true;
      $('reportEmpty').hidden = false;
    }

    const incidents = $('incidents');
    incidents.replaceChildren();
    if (!data.incidents.length) {
      const li = document.createElement('li');
      li.className = 'empty';
      li.textContent = 'Chưa có sự cố nào kể từ lần khởi động này.';
      incidents.appendChild(li);
    }
    for (const item of data.incidents) {
      const li = document.createElement('li');
      li.dataset.level = item.level;
      const time = document.createElement('time');
      time.dateTime = new Date(item.ts).toISOString();
      time.textContent = `${fmtTime(item.ts)} · ${LEVEL_TEXT[item.level] || item.level}`;
      const p = document.createElement('p');
      p.textContent = item.message;
      li.append(time, p);
      incidents.appendChild(li);
    }

    setText('updated', `Cập nhật lúc ${fmtTime(data.generatedAt)}. Tự làm mới mỗi ${REFRESH_MS / 1000} giây.`);
  }

  function showLogin(message) {
    $('content').hidden = true;
    $('login').hidden = false;
    document.body.dataset.status = 'starting';
    setText('statusText', 'Cần mật khẩu');
    setText('botName', 'Trang này được bảo vệ');
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
      setText('statusText', 'Không tải được trạng thái. Bot hoặc máy chủ có thể đang tắt.');
      if (clockBase) clockBase.running = false; // bot không phản hồi: dừng đồng hồ
      renderClock();
    }
  }

  $('login').addEventListener('submit', (event) => {
    event.preventDefault();
    token = $('token').value.trim();
    if (!token) return;
    try { localStorage.setItem(TOKEN_KEY, token); } catch { /* bỏ qua */ }
    load();
  });

  document.addEventListener('visibilitychange', () => { if (!document.hidden) load(); });

  timer = setInterval(() => { if (!document.hidden) load(); }, REFRESH_MS);
  setInterval(() => { if (!document.hidden) renderClock(); }, 1000);
  load();
})();