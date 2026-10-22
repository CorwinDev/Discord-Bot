const { EmbedBuilder } = require('discord.js');
const config = require('../config/config');

const DEFAULT_TITLE = '✉️ Chào mừng {user} đến với {server}';

function render(template, member) {
  const values = {
    mention: `<@${member.id}>`,
    user: member.user.username,
    server: member.guild.name,
    count: String(member.guild.memberCount),
    id: member.id
  };

  return template.replace(/\{(mention|user|server|count|id)\}/g, (_, key) => values[key]);
}

function createWelcomePayload(member, settings = {}) {
  const title = render(settings.welcomeTitle || DEFAULT_TITLE, member).slice(0, 256);
  const description = render(settings.welcomeMessage || config.welcome.defaultMessage, member).slice(0, 4096);
  const embed = new EmbedBuilder()
    .setColor(config.colors.success)
    .setTitle(title)
    .setDescription(description)
    .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
    .setFooter({ text: `${member.guild.name} • Thành viên thứ ${member.guild.memberCount}` })
    .setTimestamp();

  return {
    content: `✉️ Chào mừng <@${member.id}> đến với **${member.guild.name}**!`,
    embeds: [embed],
    allowedMentions: { users: [member.id] }
  };
}

module.exports = { DEFAULT_TITLE, createWelcomePayload };