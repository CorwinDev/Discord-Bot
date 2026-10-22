const { EmbedBuilder } = require('discord.js');
const config = require('../config/config');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member) {
    try { require('../database/management').logMember(member.guild.id, member.id, 'join'); } catch {}
    if (!config.welcome.enabled) return;

    // Auto-role
    if (config.welcome.autoRoleName) {
      const role = member.guild.roles.cache.find(r => r.name === config.welcome.autoRoleName);
      if (role) await member.roles.add(role).catch(() => {});
    }

    const channel = member.guild.channels.cache.find(
      c => c.name === config.welcome.channelName && c.isTextBased()
    );
    if (!channel) return;

    const embed = new EmbedBuilder()
      .setColor(config.colors.success)
      .setTitle('👋 Chào mừng thành viên mới!')
      .setDescription(`Chào mừng ${member} đến với **${member.guild.name}**!\nHiện server có **${member.guild.memberCount}** thành viên.`)
      .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
      .setTimestamp();

    channel.send({ embeds: [embed] }).catch(() => {});
  }
};
