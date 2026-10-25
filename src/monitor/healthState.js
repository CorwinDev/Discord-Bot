'use strict';


const MAX_INCIDENTS = 50;

const state = {
  startedAt: Date.now(),
  firstReadyAt: null,
  lastReadyAt: null,
  lastDisconnectAt: null,
  recoveries: 0,        
  recoveryAttempts: 0,  
  lastRecoveryAt: null,
  errorCount: 0,
  warnCount: 0,
  dbOk: true,
  webhook: { configured: false, sent: 0, failed: 0, dropped: 0 },
  incidents: []
};


const TOKEN_RE = /[A-Za-z0-9_-]{23,28}\.[A-Za-z0-9_-]{6,7}\.[A-Za-z0-9_-]{27,}/g;
const WEBHOOK_RE = /https:\/\/(?:[a-z]+\.)?discord(?:app)?\.com\/api(?:\/v\d+)?\/webhooks\/\d+\/[\w-]+/gi;

function redact(input) {
  let text = String(input ?? '');
  for (const name of ['DISCORD_TOKEN', 'ERROR_WEBHOOK_URL', 'DASHBOARD_TOKEN']) {
    const secret = process.env[name];
    if (secret && secret.length >= 8) text = text.split(secret).join('[đã ẩn]');
  }
  return text.replace(WEBHOOK_RE, '[webhook đã ẩn]').replace(TOKEN_RE, '[token đã ẩn]');
}

function firstLine(text, max = 300) {
  const line = String(text ?? '').split('\n')[0].trim();
  return line.length > max ? `${line.slice(0, max - 1)}…` : line;
}

function addIncident({ level = 'info', type = 'system', message, isPublic = true }) {
  if (level === 'error') state.errorCount++;
  if (level === 'warn') state.warnCount++;
  state.incidents.push({
    ts: Date.now(),
    level,
    type,
    message: firstLine(redact(message)),
    isPublic
  });
  if (state.incidents.length > MAX_INCIDENTS) state.incidents.shift();
}

module.exports = { state, redact, firstLine, addIncident };