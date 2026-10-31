'use strict';


const env = require('../config/env');
const { installConsoleTap } = require('./errorReporter');
const notifier = require('./webhookNotifier');

const warn = (msg) => process.stderr.write(`[monitor] ${msg}\n`);

function start(client, token) {
  if (env.CAPTURE_CONSOLE_ERRORS) {
    try { installConsoleTap(); } catch (err) { warn(`Không bật được bắt lỗi console: ${err.message}`); }
  }

  let recovery = null;
  try {
    recovery = require('./autoRecovery').attach(client, token);
  } catch (err) {
    warn(`Không bật được tự khắc phục: ${err.message}`);
  }

  try {
    require('./statusServer').start(client);
  } catch (err) {
    warn(`Không bật được web trạng thái: ${err.message}`);
  }

  console.log(`📡 Webhook báo lỗi: ${notifier.isConfigured() ? 'BẬT' : 'TẮT (đặt biến ERROR_WEBHOOK_URL để bật)'} | 🔧 Tự sửa lỗi: ${env.AUTO_FIX ? 'BẬT' : 'TẮT'}`);

  if (recovery) return recovery.loginWithRetry();
  return client.login(token);
}

module.exports = { start };