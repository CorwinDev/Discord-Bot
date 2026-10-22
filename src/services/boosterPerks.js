const gzw = require('../config/gzw');
const boosters = require('../database/boosters');
const { awardAchievement } = require('./gzwCore');

const perkRole = (guild) => (gzw.booster.perkRoleName ? guild.roles.cache.find((r) => r.name === gzw.booster.perkRoleName) : null);

/**
 * Gán quyền lợi khi thành viên đang Boost: role Booster, khung + danh hiệu độc quyền, huy hiệu lịch sử.
 * An toàn khi gọi nhiều lần (idempotent).
 */
async function grantPerks(guild, userId) {
  boosters.markBoosting(guild.id, userId);
  boosters.grantPerkItems(guild.id, userId);
  const badge = await awardAchievement(guild, userId, gzw.booster.badgeAchievementId, 'system:boost').catch(() => null);

  let roleAssigned = false;
  const role = perkRole(guild);
  if (role) {
    const member = await guild.members.fetch(userId).catch(() => null);
    if (member) {
      roleAssigned = member.roles.cache.has(role.id) ||
        (await member.roles.add(role, 'GZW Booster perks').then(() => true).catch(() => false));
    }
  }
  return { badge, roleAssigned };
}

/**
 * Khi hết Boost: gỡ role Booster và vật phẩm độc quyền. Coin đã nhận và huy hiệu lịch sử được GIỮ NGUYÊN (không thu hồi).
 */
async function revokePerks(guild, userId) {
  boosters.markEnded(guild.id, userId);
  boosters.revokePerkItems(guild.id, userId);
  const role = perkRole(guild);
  if (!role) return false;
  const member = await guild.members.fetch(userId).catch(() => null);
  if (!member || !member.roles.cache.has(role.id)) return false;
  return member.roles.remove(role, 'GZW Booster hết hạn').then(() => true).catch(() => false);
}

module.exports = { grantPerks, revokePerks };
