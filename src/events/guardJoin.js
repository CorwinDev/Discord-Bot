const { EmbedBuilder } = require('discord.js');
const config = require('../config/config');
const guard = require('../services/guard');
const { RaidWatch } = require('../services/guardRules');

const watch = new RaidWatch(config.raid);

module.exports = {
  name: 'guildMemberAdd',
  async execute(member) {
    if (member.user.bot) return;
    const r = watch.record(member.guild.id);
    if (!r.raid) return;
    guard.sendLog(member.guild, new EmbedBuilder().setColor(0xef4444).setTitle('🚨 Nghi ngờ raid')
      .setDescription(`**${r.count}** thành viên mới vào trong ${config.raid.windowMs / 1000} giây. Hãy kiểm tra danh sách thành viên mới; cân nhắc bật mức xác minh cao hơn trong cài đặt server.`)
      .setTimestamp());
  }
};
