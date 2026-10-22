const boosterPerks = require('../services/boosterPerks');
const { handleBoost } = require('../services/boosterFlow');

/**
 * Theo dõi thay đổi trạng thái Boost của thành viên (premiumSince), do Discord báo:
 *  - null -> có giá trị: thành viên BẮT ĐẦU Boost -> ghi nhận sự kiện (thưởng nếu chưa được tính từ tin nhắn hệ thống) + quyền lợi
 *  - có giá trị -> null: NGỪNG Boost -> gỡ role/vật phẩm gắn với trạng thái Boost; coin và huy hiệu được giữ
 */
module.exports = {
  name: 'guildMemberUpdate',
  async execute(oldMember, newMember) {
    if (oldMember.partial || newMember.user.bot) return;
    const was = !!oldMember.premiumSince, now = !!newMember.premiumSince;
    if (was === now) return;
    try {
      if (!was && now) {
        await handleBoost(newMember.guild, newMember.id, `start:${newMember.id}:${newMember.premiumSinceTimestamp}`, 'start');
      } else {
        await boosterPerks.revokePerks(newMember.guild, newMember.id);
      }
    } catch (err) {
      console.error('⚠️  Lỗi boosterStatus:', err);
    }
  }
};
