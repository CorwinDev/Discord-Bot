const { PermissionFlagsBits } = require('discord.js');
const mg = require('../config/management');
const { isSuper } = require('./superAdmin');

/** Tập năng lực của một GuildMember: admin|mod|support|events|economy|audit */
function capsOf(member) {
  const caps = new Set();
  if (!member) return caps;
  if (isSuper(member.id) || member.guild?.ownerId === member.id || member.permissions?.has(PermissionFlagsBits.Administrator)) {
    ['admin', 'mod', 'support', 'events', 'economy', 'audit'].forEach((c) => caps.add(c));
    return caps;
  }
  for (const [perm, list] of Object.entries(mg.discordPermCaps)) {
    if (member.permissions?.has(PermissionFlagsBits[perm])) list.forEach((c) => caps.add(c));
  }
  for (const role of member.roles?.cache?.values?.() ?? []) {
    const def = mg.staffRoles[role.name];
    if (def) def.caps.forEach((c) => caps.add(c));
  }
  return caps;
}
const has = (member, cap) => capsOf(member).has(cap);
const anyOf = (member, ...caps) => { const c = capsOf(member); return caps.some((x) => c.has(x)); };

/** Hạng nhân sự cao nhất của member (0 nếu không phải nhân sự). Chủ server = 1000. */
function rankOf(member) {
  if (!member) return 0;
  if (member.guild?.ownerId === member.id) return 1000;
  if (isSuper(member.id)) return 999;
  let best = member.permissions?.has(PermissionFlagsBits.Administrator) ? 90 : 0;
  for (const role of member.roles?.cache?.values?.() ?? []) best = Math.max(best, mg.staffRoles[role.name]?.rank ?? 0);
  return best;
}

/** Kiểm tra cap, trả về chuỗi lỗi hoặc null. */
function require_(interaction, cap) {
  if (has(interaction.member, cap)) return null;
  return `❌ Bạn cần quyền **${cap}** (vai trò nhân sự phù hợp) để dùng lệnh này.`;
}

/**
 * Có được phép xử lý `target` không? Không cho xử lý bản thân, bot, chủ server,
 * hoặc người có hạng/role cao hơn hoặc bằng mình.
 */
function canActOn(actor, target) {
  if (!target) return { ok: true }; // người không còn trong server (vd: ban theo ID)
  if (target.id === actor.id) return { ok: false, msg: '❌ Bạn không thể tự xử lý chính mình.' };
  if (target.user?.bot) return { ok: false, msg: '❌ Không áp dụng cho bot.' };
  if (target.guild.ownerId === target.id) return { ok: false, msg: '❌ Không thể xử lý chủ server.' };
  if (actor.guild.ownerId !== actor.id && !isSuper(actor.id)) {
    if (rankOf(target) >= rankOf(actor) && rankOf(target) > 0) return { ok: false, msg: '❌ Người này có cấp bậc nhân sự cao hơn hoặc bằng bạn.' };
    if (target.roles.highest.position >= actor.roles.highest.position) return { ok: false, msg: '❌ Role của người này cao hơn hoặc bằng bạn.' };
  }
  return { ok: true };
}

module.exports = { capsOf, has, anyOf, rankOf, require: require_, canActOn };
