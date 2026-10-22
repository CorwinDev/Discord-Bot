const { EmbedBuilder } = require('discord.js');
const guard = require('../services/guard');
const safety = require('../database/safety');
const { newlyDangerous } = require('../services/guardRules');

module.exports = {
  name: 'roleUpdate',
  async execute(oldRole, newRole) {
    const added = newlyDangerous(oldRole.permissions.toArray(), newRole.permissions.toArray());
    if (!added.length) return;
    safety.audit(newRole.guild.id, 'system:discord', 'role.dangerous_perms', newRole.id, added.join(', '));
    guard.sendLog(newRole.guild, new EmbedBuilder().setColor(0xef4444).setTitle('⚠️ Role được thêm quyền nguy hiểm')
      .setDescription(`Role **${newRole.name}** vừa nhận: ${added.map((p) => `\`${p}\``).join(', ')}\nNếu đây không phải thay đổi của bạn, hãy kiểm tra Audit Log của Discord ngay.`)
      .setTimestamp());
  }
};
