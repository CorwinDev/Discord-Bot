const { EmbedBuilder } = require('discord.js');
const config = require('../config/config');
const db = require('../database/db');
const { createWelcomePayload } = require('../services/welcome');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member) {
    try { require('../database/management').logMember(member.guild.id, member.id, 'join'); } catch {}
    if (!config.welcome.enabled) return;

    const settings = db.prepare('SELECT welcomeChannelId, autoRoleId, welcomeMessage, welcomeTitle FROM guild_settings WHERE guildId = ?').get(member.guild.id);
    if (settings?.autoRoleId) {
      const role = member.guild.roles.cache.get(settings.autoRoleId);
      if (role) await member.roles.add(role, 'Welcome auto-role').catch(() => {});
    }

    const channel = settings?.welcomeChannelId && member.guild.channels.cache.get(settings.welcomeChannelId);
    if (!channel?.isTextBased()) return;

    channel.send(createWelcomePayload(member, settings.welcomeMessage)).catch((error) => {
      console.warn(`⚠️ Không gửi được welcome trong guild ${member.guild.id}: ${error.message}`);
    });
  }
};
