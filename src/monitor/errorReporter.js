'use strict';


const util = require('util');
const notifier = require('./webhookNotifier');
const { addIncident, firstLine } = require('./healthState');

const originalConsoleError = console.error.bind(console);


const IGNORE = [
  /Unknown interaction/i,
  /Unknown Message/i,
  /Cannot send messages to this user/i,
  /Interaction has already been acknowledged/i
];

const codeBlock = (text) => `\`\`\`\n${String(text).replace(/```/g, "'''").slice(0, 3500)}\n\`\`\``;

function formatError(err) {
  if (err instanceof Error) return err.stack || `${err.name}: ${err.message}`;
  return typeof err === 'string' ? err : util.inspect(err, { depth: 3 });
}

function reportError(context, err, { ping = false } = {}) {
  const text = formatError(err);
  originalConsoleError(`❌ ${context}:`, err);
  if (IGNORE.some((re) => re.test(text))) return;
  addIncident({ level: 'error', type: 'runtime', isPublic: false, message: `${context}: ${firstLine(text)}` });
  notifier.notify({
    level: 'error',
    title: `❌ ${context}`,
    description: codeBlock(text),
    key: `${context}|${text.slice(0, 200)}`,
    ping
  });
}

let tapped = false;
let inTap = false;

function installConsoleTap() {
  if (tapped) return;
  tapped = true;
  console.error = (...args) => {
    originalConsoleError(...args);
    if (inTap) return;
    inTap = true;
    try {
      const text = util.format(...args);
      if (IGNORE.some((re) => re.test(text))) return;
      const head = firstLine(text, 200);
      addIncident({ level: 'error', type: 'runtime', isPublic: false, message: head });
      notifier.notify({
        level: 'error',
        title: '❌ Lỗi trong bot',
        description: codeBlock(text),
        key: `console|${text.slice(0, 200)}`
      });
    } catch { /* không để việc báo lỗi làm hỏng bot */ } finally {
      inTap = false;
    }
  };
}

module.exports = { installConsoleTap, reportError, originalConsoleError };