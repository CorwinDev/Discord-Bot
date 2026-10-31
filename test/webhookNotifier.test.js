'use strict';

process.env.ERROR_WEBHOOK_URL = 'https://discord.com/api/webhooks/123456789012345678/abcDEF_ghi-123';
process.env.ALERT_MENTION_USER_ID = '987654321098765432';
process.env.DISCORD_TOKEN = 'MTIzNDU2Nzg5MDEyMzQ1Njc4OTA.GabcDE.abcdefghijklmnopqrstuvwxyz0123456789';

const test = require('node:test');
const assert = require('node:assert/strict');

const notifier = require('../src/monitor/webhookNotifier');
const { state } = require('../src/monitor/healthState');
const { reportError, installConsoleTap } = require('../src/monitor/errorReporter');

const fast = () => Object.assign(notifier._cfg, { minGapMs: 0, backoffBaseMs: 5, backoffMaxMs: 20, defaultDedupeMs: 60_000, staleDropMs: 30 * 60_000, staleNoteMs: 60_000 });

test.beforeEach(() => {
  notifier._reset();
  notifier._setTransport(null);
  fast();
  Object.assign(state.webhook, { sent: 0, failed: 0, dropped: 0, deduped: 0, lastError: null });
});

test('gửi embed đúng định dạng và flush chờ gửi xong', async () => {
  const calls = [];
  notifier._setTransport(async (url, payload) => { calls.push({ url, payload }); return { status: 204, body: '' }; });

  assert.equal(notifier.notify({ level: 'error', title: 'Có lỗi', description: 'chi tiết', fields: [{ name: 'A', value: 'B', inline: true }], ping: true }), true);
  assert.equal(await notifier.flush(2000), true);

  assert.equal(calls.length, 1);
  const { payload } = calls[0];
  assert.equal(payload.embeds[0].title, 'Có lỗi');
  assert.equal(payload.embeds[0].color, 0xed4245);
  assert.deepEqual(payload.embeds[0].fields, [{ name: 'A', value: 'B', inline: true }]);
  assert.equal(payload.content, '<@987654321098765432>');
  assert.deepEqual(payload.allowed_mentions, { parse: [], users: ['987654321098765432'] });
  assert.equal(state.webhook.sent, 1);
});

test('không ping khi không yêu cầu', async () => {
  const calls = [];
  notifier._setTransport(async (u, p) => { calls.push(p); return { status: 204, body: '' }; });
  notifier.notify({ title: 'x', dedupeMs: 0 });
  await notifier.flush(2000);
  assert.equal(calls[0].content, undefined);
  assert.deepEqual(calls[0].allowed_mentions, { parse: [], users: [] });
});

test('gộp tin trùng theo key, dedupeMs: 0 thì luôn gửi', async () => {
  const calls = [];
  notifier._setTransport(async (u, p) => { calls.push(p); return { status: 204, body: '' }; });

  assert.equal(notifier.notify({ title: 'a', key: 'k', dedupeMs: 60_000 }), true);
  assert.equal(notifier.notify({ title: 'a', key: 'k', dedupeMs: 60_000 }), false);
  assert.equal(notifier.notify({ title: 'a', key: 'k', dedupeMs: 0 }), true);
  await notifier.flush(2000);
  assert.equal(calls.length, 2);
  assert.equal(state.webhook.deduped, 1);
});

test('mất mạng: giữ tin, thử lại và gửi bù khi có mạng', async () => {
  let n = 0;
  const calls = [];
  notifier._setTransport(async (u, p) => {
    n++;
    if (n <= 3) { const e = new TypeError('fetch failed'); e.cause = { code: 'ENOTFOUND' }; throw e; }
    calls.push(p);
    return { status: 204, body: '' };
  });

  notifier.notify({ title: 'sau khi rớt mạng', dedupeMs: 0 });
  assert.equal(await notifier.flush(3000), true);
  assert.equal(n, 4);
  assert.equal(calls.length, 1);
  assert.equal(state.webhook.sent, 1);
  assert.equal(state.webhook.failed, 0);
  assert.equal(state.webhook.lastError, null);
});

test('mất mạng: lỗi được giải thích bằng tiếng Việt', async () => {
  notifier._setTransport(async () => { const e = new TypeError('fetch failed'); e.cause = { code: 'ENOTFOUND' }; throw e; });
  const r = await notifier.post({ at: Date.now(), msg: { title: 't' } });
  assert.equal(r.ok, false);
  assert.equal(r.retry, true);
  assert.match(r.error, /mất mạng hoặc lỗi DNS/);
});

test('429: chờ retry-after rồi gửi lại, không tính là thất bại', async () => {
  let n = 0;
  notifier._setTransport(async () => {
    n++;
    return n === 1 ? { status: 429, retryAfter: '0.01', body: '' } : { status: 204, body: '' };
  });
  notifier.notify({ title: 'rl', dedupeMs: 0 });
  assert.equal(await notifier.flush(3000), true);
  assert.equal(n, 2);
  assert.equal(state.webhook.sent, 1);
  assert.equal(state.webhook.failed, 0);
});

test('404: webhook bị xoá thì bỏ tin và nói rõ nguyên nhân, không lặp vô hạn', async () => {
  let n = 0;
  notifier._setTransport(async () => { n++; return { status: 404, body: '{"message":"Unknown Webhook"}' }; });
  notifier.notify({ title: 'x', dedupeMs: 0 });
  assert.equal(await notifier.flush(3000), true);
  assert.equal(n, 1);
  assert.equal(state.webhook.failed, 1);
  assert.match(state.webhook.lastError, /đã bị xoá/);
});

test('5xx: thử lại tối đa maxHttpAttempts rồi bỏ', async () => {
  let n = 0;
  notifier._setTransport(async () => { n++; return { status: 503, body: '' }; });
  notifier.notify({ title: 'x', dedupeMs: 0 });
  assert.equal(await notifier.flush(3000), true);
  assert.equal(n, notifier._cfg.maxHttpAttempts);
  assert.equal(state.webhook.failed, 1);
});

test('tin gửi trễ (do mất mạng) được ghi chú ở footer', () => {
  const late = notifier.buildPayload({ title: 't', description: 'd' }, Date.now() - 5 * 60_000);
  assert.match(late.embeds[0].footer.text, /gửi trễ 5 phút/);
  const fresh = notifier.buildPayload({ title: 't' }, Date.now());
  assert.doesNotMatch(fresh.embeds[0].footer.text, /gửi trễ/);
});

test('hàng đợi đầy: bỏ tin thường cũ, giữ tin lỗi', async () => {
  notifier._cfg.maxQueue = 3;
  const sent = [];
  let release;
  const gate = new Promise((r) => { release = r; });
  notifier._setTransport(async (u, p) => { await gate; sent.push(p.embeds[0].title); return { status: 204, body: '' }; });

  notifier.notify({ level: 'error', title: 'E1', dedupeMs: 0 });   // đang gửi (chờ cổng)
  notifier.notify({ level: 'success', title: 'S1', dedupeMs: 0 });
  notifier.notify({ level: 'error', title: 'E2', dedupeMs: 0 });
  notifier.notify({ level: 'error', title: 'E3', dedupeMs: 0 });    // đầy -> bỏ S1
  release();
  await notifier.flush(3000);
  notifier._cfg.maxQueue = 50;

  assert.deepEqual(sent, ['E1', 'E2', 'E3']);
  assert.equal(state.webhook.dropped, 1);
});

test('token Discord và URL webhook bị che', () => {
  const p = notifier.buildPayload({
    title: `token ${process.env.DISCORD_TOKEN}`,
    description: `url ${process.env.ERROR_WEBHOOK_URL}`,
    fields: [{ name: 'x', value: process.env.DISCORD_TOKEN }]
  }, Date.now());
  const text = JSON.stringify(p);
  assert.ok(!text.includes('GabcDE'));
  assert.ok(!text.includes('abcDEF_ghi-123'));
});

test('embed quá dài được cắt trong giới hạn của Discord', () => {
  const p = notifier.buildPayload({
    title: 'T'.repeat(500),
    description: 'D'.repeat(9000),
    fields: Array.from({ length: 40 }, (_, i) => ({ name: `f${i}`, value: 'V'.repeat(2000) }))
  }, Date.now());
  const e = p.embeds[0];
  assert.ok(e.title.length <= 256);
  assert.ok(e.description.length <= 4000);
  assert.ok(e.fields.length <= 25);
  assert.ok(e.fields.every((f) => f.value.length <= 1024));
  const total = e.title.length + e.description.length + e.footer.text.length + e.fields.reduce((n, f) => n + f.name.length + f.value.length, 0);
  assert.ok(total <= 6000, `tổng ${total} vượt 6000`);
});

test('reportError gửi stack đã che token; console.error được bắt, log nội bộ thì không', async () => {
  const titles = [];
  const bodies = [];
  notifier._setTransport(async (u, p) => { titles.push(p.embeds[0].title); bodies.push(p.embeds[0].description); return { status: 204, body: '' }; });

  reportError('Lỗi thử', new Error(`hỏng ${process.env.DISCORD_TOKEN}`), { key: 'test-unique-1' });
  installConsoleTap();
  const origWrite = process.stderr.write.bind(process.stderr);
  process.stderr.write = () => true; // im lặng log của console.error trong lúc test
  try {
    console.error('❌ Lỗi khi thực thi lệnh ping:', new Error('boom'));
    console.error('[webhook] nội bộ, không được gửi');
  } finally {
    process.stderr.write = origWrite;
  }
  await notifier.flush(3000);

  assert.ok(titles.includes('🚨 Lỗi thử'));
  assert.ok(titles.includes('🐞 Lỗi trong bot (console.error)'));
  assert.equal(titles.filter((t) => t.startsWith('🐞')).length, 1);
  assert.ok(bodies.every((b) => !b.includes('GabcDE')));
});