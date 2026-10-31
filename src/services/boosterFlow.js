const { EmbedBuilder } = require('discord.js');
const boosters = require('../database/boosters');
const boosterPerks = require('./boosterPerks');
const { coin } = require('./gzwUi');
const { notifyStaffLog } = require('./boosterNotify');
const gzw = require('../config/gzw');

/**
 * Luồng chung cho mọi sự kiện Boost đã được Discord xác nhận:
 *   ghi nhận (chống trùng) -> thưởng coin theo chính sách -> gán quyền lợi -> cảm ơn.
 * @param key     mã sự kiện duy nhất
 * @param source  'message' | 'start'
 */
async function handleBoost(guild, userId, key, source, channel = null) {
  const res = boosters.recordBoost(guild.id, userId, key, source);

  // Quyền lợi gắn với trạng thái đang Boost luôn được đảm bảo (idempotent), kể cả khi sự kiện trùng/đã tính
  await boosterPerks.grantPerks(guild, userId).catch((e) => console.error('⚠️  grantPerks:', e));
  if (!res.ok) return res;

  const target = channel || guild.systemChannel;
  if (target) {
    const embed = new EmbedBuilder().setColor(gzw.brandColor).setTitle('💜 Cảm ơn Booster!').setDescription(
      res.status === 'REWARDED'
        ? `Cảm ơn <@${userId}> đã nâng cấp server. Bạn nhận **${coin(res.coins)}** theo chính sách thưởng Boost, cùng quyền lợi Booster!`
        : `Cảm ơn <@${userId}> đã nâng cấp server! Quyền lợi Booster đã được gán. Phần coin sẽ được cộng khi quản trị viên bật chính sách thưởng.`
    );
    await target.send({ embeds: [embed], allowedMentions: { users: [userId] } }).catch(() => {});
  }
  if (res.status === 'PENDING') {
    notifyStaffLog(guild, `🔎 Lượt boost #${res.id} của <@${userId}> chưa được thưởng (chính sách thưởng đang tắt). Đặt chính sách bằng \`/booster-admin policy\` rồi \`/booster-admin grant id:${res.id}\`.`);
  }
  return res;
}

module.exports = { handleBoost };
