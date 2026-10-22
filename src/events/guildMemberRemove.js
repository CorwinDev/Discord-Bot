const { EmbedBuilder } = require('discord.js');
const config = require('../config/config');

module.exports = {
  name: 'guildMemberRemove',
  async execute(member) {
    try { require('../database/management').logMember(member.guild.id, member.id, 'leave'); } catch {}
    if (!config.welcome.enabled) return;

    const channel = member.guild.channels.cache.find(
      c => c.name === config.welcome.channelName && c.isTextBased()
    );
    if (!channel) return;

    const embed = new EmbedBuilder()
      .setColor(config.colors.danger)
      .setDescription(`👋 **${member.user.tag}** đã rời khỏi server.`)
      .setTimestamp();

    channel.send({ embeds: [embed] }).catch(() => {});
  }
};
