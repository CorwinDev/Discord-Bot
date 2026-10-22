const { PermissionFlagsBits } = require('discord.js');
const mg = require('../config/management');
const gzw = require('../config/gzw');
const config = require('../config/config');

const NEED_PERMS = ['ManageRoles', 'ModerateMembers', 'KickMembers', 'BanMembers', 'ManageChannels', 'ManageMessages', 'ViewChannel', 'SendMessages', 'EmbedLinks'];

/** Kiểm tra cấu hình quan trọng. Trả về [{ level: 'ok'|'warn'|'error', text }]. */
function runChecks(guild) {
  const out = [];
  const me = guild.members.me;
  const add = (level, text) => out.push({ level, text });

  const missing = NEED_PERMS.filter((p) => !me?.permissions.has(PermissionFlagsBits[p]));
  add(missing.length ? 'error' : 'ok', missing.length ? `Bot thiếu quyền: ${missing.join(', ')}` : 'Bot đủ quyền cần thiết');

  const chan = (name) => guild.channels.cache.some((c) => c.name === name && c.isTextBased());
  for (const [label, name] of [['Kênh log kiểm duyệt', mg.channels.modLog], ['Kênh sự kiện', mg.channels.eventAnnounce], ['Kênh chào mừng', config.welcome.channelName]]) {
    add(chan(name) ? 'ok' : 'warn', chan(name) ? `${label}: #${name}` : `Thiếu ${label} (#${name})`);
  }

  const botTop = me?.roles.highest.position ?? 0;
  const roleNames = [...Object.keys(mg.staffRoles), gzw.booster.perkRoleName, ...gzw.achievements.map((a) => a.role)].filter(Boolean);
  const noRole = [], tooHigh = [];
  for (const name of roleNames) {
    const r = guild.roles.cache.find((x) => x.name === name);
    if (!r) noRole.push(name); else if (r.position >= botTop) tooHigh.push(name);
  }
  add(noRole.length ? 'warn' : 'ok', noRole.length ? `Chưa tạo role: ${noRole.join(', ')}` : 'Đủ role nhân sự/booster/thành tích');
  if (tooHigh.length) add('error', `Role bot đang THẤP hơn hoặc bằng các role: ${tooHigh.join(', ')} → bot không gán/gỡ được`);

  // Role có Administrator nhưng không phải role nhân sự đã biết -> bất thường
  const rogue = guild.roles.cache.filter((r) => !r.managed && r.id !== guild.id && r.permissions.has(PermissionFlagsBits.Administrator) && !mg.staffRoles[r.name]);
  if (rogue.size) add('warn', `Role có quyền Administrator ngoài danh sách nhân sự: ${rogue.map((r) => r.name).join(', ')}`);
  return out;
}
const ICON = { ok: '✅', warn: '⚠️', error: '❌' };
const format = (list) => list.map((x) => `${ICON[x.level]} ${x.text}`).join('\n');

module.exports = { runChecks, format };
