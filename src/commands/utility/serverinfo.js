const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../config/config');

module.exports = {
  group: 'Tiện ích',
  cooldown: 3,
  data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Xem thông tin server'),

  async execute(interaction) {
    const guild = interaction.guild;
    const embed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle(`🏠 ${guild.name}`)
      .setThumbnail(guild.iconURL({ size: 256 }))
      .addFields(
        { name: 'Chủ server', value: `<@${guild.ownerId}>`, inline: true },
        { name: 'Thành viên', value: `${guild.memberCount}`, inline: true },
        { name: 'Kênh', value: `${guild.channels.cache.size}`, inline: true },
        { name: 'Vai trò', value: `${guild.roles.cache.size}`, inline: true },
        { name: 'Tạo lúc', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:D>`, inline: true },
        { name: 'Boost', value: `Cấp ${guild.premiumTier} (${guild.premiumSubscriptionCount || 0} boost)`, inline: true }
      );

    await interaction.reply({ embeds: [embed] });
  }
};
