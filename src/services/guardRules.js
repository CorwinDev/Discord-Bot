/** Luật thuần (không phụ thuộc discord.js) cho GZW Guard — dễ kiểm thử. */

const INVITE_RE = /(?:discord\.gg|discord(?:app)?\.com\/invite)\/[a-z0-9-]+/i;
const isInviteLink = (text) => INVITE_RE.test(String(text || ''));

/** Quyền nguy hiểm: khi role được thêm các quyền này, cần báo cho admin. */
const DANGEROUS_PERMS = [
  'Administrator', 'ManageGuild', 'ManageRoles', 'ManageChannels',
  'BanMembers', 'KickMembers', 'MentionEveryone', 'ManageWebhooks', 'ModerateMembers'
];
const newlyDangerous = (oldPerms, newPerms) =>
  newPerms.filter((p) => DANGEROUS_PERMS.includes(p) && !oldPerms.includes(p));

/** Đếm số lần vi phạm trong một cửa sổ thời gian. */
class StrikeCounter {
  constructor(windowMs) { this.windowMs = windowMs; this.map = new Map(); }
  add(key, now = Date.now()) {
    const list = (this.map.get(key) || []).filter((t) => now - t < this.windowMs);
    list.push(now);
    this.map.set(key, list);
    return list.length;
  }
  reset(key) { this.map.delete(key); }
}

/** Phát hiện nhiều thành viên vào server dồn dập (raid). Báo tối đa 1 lần / cooldown. */
class RaidWatch {
  constructor({ joins, windowMs, cooldownMs }) { Object.assign(this, { joins, windowMs, cooldownMs }); this.map = new Map(); this.last = new Map(); }
  record(guildId, now = Date.now()) {
    const list = (this.map.get(guildId) || []).filter((t) => now - t < this.windowMs);
    list.push(now);
    this.map.set(guildId, list);
    if (list.length >= this.joins && now - (this.last.get(guildId) ?? -Infinity) >= this.cooldownMs) {
      this.last.set(guildId, now);
      return { raid: true, count: list.length };
    }
    return { raid: false, count: list.length };
  }
}

module.exports = { isInviteLink, newlyDangerous, DANGEROUS_PERMS, StrikeCounter, RaidWatch };
