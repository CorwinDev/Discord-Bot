const { PermissionFlagsBits } = require('discord.js');
const mg = require('../config/management');
const gzw = require('../config/gzw');

const NEED_PERMS = ['ManageRoles', 'ModerateMembers', 'KickMembers', 'BanMembers', 'ManageChannels', 'ManageMessages', 'ViewChannel', 'SendMessages', 'EmbedLinks'];

/** Kiểm tra cấu hình quan trọng. Trả về [{ level: 'ok'|'warn'|'error', text }]. */
function runChecks(guild) {
  const out = [];
  const me = guild.members.me;
  const add = (level, text) => out.push({ level, text });

  const missing = NEED_PERMS.filter((p) => !me?.permissions.has(PermissionFlagsBits[p]));
  add(missing.length ? 'error' : 'ok', missing.length ? `Bot thiếu quyền: ${missing.join(', ')}` : 'Bot đủ quyền cần thiết');

  const settings = require('../database/db').prepare('SELECT logChannelId, welcomeChannelId, autoRoleId FROM guild_settings WHERE guildId = ?').get(guild.id);
  for (const [label, id] of [
    ['Kênh log kiểm duyệt', settings?.logChannelId],
    ['Kênh sự kiện', null],
    ['Kênh chào mừng', settings?.welcomeChannelId]
  ]) {
    const channel = id && guild.channels.cache.get(id);
    add(channel ? 'ok' : 'info', channel ? `${label}: ${channel}` : `${label}: chưa cấu hình (tùy chọn)`);
  }
  const autoRole = settings?.autoRoleId && guild.roles.cache.get(settings.autoRoleId);
  add(autoRole ? 'ok' : 'info', autoRole ? `Role tự động: ${autoRole}` : 'Role tự động: chưa cấu hình (tùy chọn)');

  const botTop = me?.roles.highest.position ?? 0;
  const roleNames = [...Object.keys(mg.staffRoles), gzw.booster.perkRoleName, ...gzw.achievements.map((a) => a.role)].filter(Boolean);
  const noRole = [], tooHigh = [];
  for (const name of roleNames) {
    const r = guild.roles.cache.find((x) => x.name === name);
    if (!r) noRole.push(name); else if (r.position >= botTop) tooHigh.push(name);
  }
  add(noRole.length ? 'info' : 'ok', noRole.length ? `Role chưa tạo (tùy chọn): ${noRole.join(', ')}` : 'Đủ role nhân sự/booster/thành tích');
  if (tooHigh.length) add('info', `Bot chưa thể gán/gỡ các role đang cao hơn role bot: ${tooHigh.join(', ')}`);

  // Role có Administrator nhưng không phải role nhân sự đã biết -> bất thường
  const rogue = guild.roles.cache.filter((r) => !r.managed && r.id !== guild.id && r.permissions.has(PermissionFlagsBits.Administrator) && !mg.staffRoles[r.name]);
  if (rogue.size) add('warn', `Role có quyền Administrator ngoài danh sách nhân sự: ${rogue.map((r) => r.name).join(', ')}`);
  return out;
}
const ICON = { ok: '✅', info: 'ℹ️', warn: '⚠️', error: '❌' };
const format = (list) => list.map((x) => `${ICON[x.level]} ${x.text}`).join('\n');

module.exports = { runChecks, format };
