const gzw = require('../config/gzw');
const eco = require('../database/economy');

/**
 * Cấp thành tích (lưu DB vĩnh viễn) rồi gán role cùng tên nếu role tồn tại trong server.
 * Trả về { granted, def, roleAssigned }.
 */
async function awardAchievement(guild, userId, achievementId, grantedBy = null) {
  const def = gzw.achievements.find((a) => a.id === achievementId);
  if (!def) return { granted: false, def: null, roleAssigned: false };

  const granted = eco.grantAchievement(guild.id, userId, achievementId, grantedBy);
  let roleAssigned = false;

  // Gán role kể cả khi thành tích đã có từ trước (phòng khi role được tạo sau)
  const role = guild.roles.cache.find((r) => r.name === def.role);
  if (role) {
    const member = await guild.members.fetch(userId).catch(() => null);
    if (member && !member.roles.cache.has(role.id)) {
      roleAssigned = await member.roles.add(role, `GZW achievement: ${def.name}`).then(() => true).catch(() => false);
    }
  }
  return { granted, def, roleAssigned };
}

/** Kiểm tra các thành tích tự động (auto:true) theo trạng thái hiện tại của thành viên. */
async function checkAutoAchievements(guild, userId, { level = null } = {}) {
  const earned = [];
  for (const a of gzw.achievements.filter((x) => x.auto)) {
    let ok = false;
    if (a.rule === 'level') ok = level !== null && level >= a.value;
    if (a.rule === 'firstQuest') ok = eco.hasEverCompletedQuest(guild.id, userId);
    if (a.rule === 'predictions') ok = eco.countPredictionsCorrect(guild.id, userId) >= a.value;
    if (a.rule === 'supporter') ok = eco.countSupportActions(guild.id, userId) >= a.value;
    if (a.rule === 'duels') ok = eco.countFinishedDuels(guild.id, userId) >= a.value;
    if (!ok) continue;
    const res = await awardAchievement(guild, userId, a.id);
    if (res.granted) earned.push(res.def);
  }
  return earned;
}

/** Gửi thông báo ngắn tự xoá sau vài giây (tránh làm rác kênh chat). */
async function flashNotice(channel, content, ms = 10000) {
  const msg = await channel.send({ content, allowedMentions: { parse: [] } }).catch(() => null);
  if (msg) setTimeout(() => msg.delete().catch(() => {}), ms);
}

module.exports = { awardAchievement, checkAutoAchievements, flashNotice };
