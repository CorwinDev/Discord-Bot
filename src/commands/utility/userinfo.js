const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../config/config');

module.exports = {
  group: 'Tiện ích',
  cooldown: 3,
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Xem thông tin một thành viên')
    .addUserOption(opt => opt.setName('user').setDescription('Thành viên muốn xem')),

  async execute(interaction) {
    const target = interaction.options.getUser('user') || interaction.user;
    const member = await interaction.guild.members.fetch(target.id).catch(() => null);

    const embed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle(`👤 ${target.tag}`)
      .setThumbnail(target.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: 'ID', value: target.id, inline: true },
        { name: 'Tài khoản tạo lúc', value: `<t:${Math.floor(target.createdTimestamp / 1000)}:D>`, inline: true }
      );

    if (member) {
      embed.addFields(
        { name: 'Tham gia server lúc', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:D>`, inline: true },
        { name: 'Vai trò', value: member.roles.cache.filter(r => r.name !== '@everyone').map(r => r.toString()).join(' ') || 'Không có' }
      );
    }

    await interaction.reply({ embeds: [embed] });
  }
};
