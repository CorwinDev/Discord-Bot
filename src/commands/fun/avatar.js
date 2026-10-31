const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const gzw = require('../../config/gzw');

module.exports = {
  group: 'Giải trí',
  cooldown: 3,
  data: new SlashCommandBuilder().setName('avatar').setDescription('Xem ảnh đại diện của một thành viên')
    .addUserOption((o) => o.setName('user').setDescription('Thành viên (mặc định là bạn)')),
  async execute(interaction) {
    const user = interaction.options.getUser('user') ?? interaction.user;
    await interaction.reply({ embeds: [new EmbedBuilder().setColor(gzw.brandColor).setTitle(`Avatar của ${user.username}`).setImage(user.displayAvatarURL({ size: 1024 }))] });
  }
};
