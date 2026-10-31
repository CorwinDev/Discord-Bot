const {
  SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
  ChannelType, PermissionFlagsBits
} = require('discord.js');
const config = require('../../config/config');

module.exports = {
  group: 'Tiện ích',
  cooldown: 10,
  data: new SlashCommandBuilder()
    .setName('ticket-setup')
    .setDescription('Gửi bảng tạo ticket hỗ trợ vào kênh hiện tại')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setDMPermission(false),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle('🎫 Hỗ trợ')
      .setDescription('Nhấn nút bên dưới để tạo kênh hỗ trợ riêng tư với đội ngũ quản trị.');

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('ticket_open').setLabel('Tạo ticket').setEmoji('🎫').setStyle(ButtonStyle.Success)
    );

    await interaction.channel.send({ embeds: [embed], components: [row] });
    await interaction.reply({ content: '✅ Đã gửi bảng ticket.', ephemeral: true });
  }
};
