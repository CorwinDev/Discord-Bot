const { EmbedBuilder } = require('discord.js');
const db = require('../database/db');

module.exports = {
  name: 'guildMemberRemove',
  async execute(member) {
    try { require('../database/management').logMember(member.guild.id, member.id, 'leave'); } catch {}
    const settings = db.prepare('SELECT welcomeChannelId FROM guild_settings WHERE guildId = ?').get(member.guild.id);
    const channel = settings?.welcomeChannelId && member.guild.channels.cache.get(settings.welcomeChannelId);
    if (!channel?.isTextBased()) return;

    const embed = new EmbedBuilder()
      .setColor(config.colors.danger)
      .setDescription(`👋 **${member.user.tag}** đã rời khỏi server.`)
      .setTimestamp();

    channel.send({ embeds: [embed] }).catch(() => {});
  }
};
