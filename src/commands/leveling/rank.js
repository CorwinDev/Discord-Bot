const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUser, xpForNextLevel, getRank } = require('../../database/levels');
const config = require('../../config/config');

module.exports = {
  group: 'Leveling',
  cooldown: 3,
  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription('Xem cấp độ & XP của bạn hoặc người khác')
    .addUserOption(opt => opt.setName('user').setDescription('Thành viên muốn xem')),

  async execute(interaction) {
    const target = interaction.options.getUser('user') || interaction.user;
    const user = getUser(interaction.guild.id, target.id);
    const rank = getRank(interaction.guild.id, target.id);
    const needed = xpForNextLevel(user.level);

    const embed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle(`📊 Rank của ${target.username}`)
      .setThumbnail(target.displayAvatarURL())
      .addFields(
        { name: 'Hạng', value: `#${rank}`, inline: true },
        { name: 'Cấp độ', value: `${user.level}`, inline: true },
        { name: 'XP', value: `${user.xp} / ${needed}`, inline: true }
      );

    await interaction.reply({ embeds: [embed] });
  }
};
