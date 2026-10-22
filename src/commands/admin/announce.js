const {
  SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits
} = require('discord.js');
const config = require('../../config/config');

/**
 * Lệnh thông báo sự kiện với embed + nút bấm, cùng phong cách UI như ảnh ví dụ
 * ("Rạp phim đã bắt đầu") nhưng dùng cho nội dung hợp lệ của server: sự kiện,
 * buổi stream/voice chat của chính server, họp mặt cộng đồng, v.v.
 * KHÔNG dùng để phát/stream phim có bản quyền.
 */
module.exports = {
  group: 'Quản trị',
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('announce-event')
    .setDescription('Thông báo một sự kiện của server kèm nút tham gia')
    .addStringOption(opt => opt.setName('title').setDescription('Tiêu đề sự kiện').setRequired(true))
    .addStringOption(opt => opt.setName('description').setDescription('Mô tả sự kiện').setRequired(true))
    .addChannelOption(opt => opt.setName('voice_channel').setDescription('Kênh voice liên quan (tuỳ chọn)'))
    .addStringOption(opt => opt.setName('button_label').setDescription('Nhãn nút (mặc định: Tham gia ngay)'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setDMPermission(false),

  async execute(interaction) {
    const title = interaction.options.getString('title');
    const description = interaction.options.getString('description');
    const voiceChannel = interaction.options.getChannel('voice_channel');
    const buttonLabel = interaction.options.getString('button_label') || 'Tham gia ngay';

    const embed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle(`📢 ${title}`)
      .setDescription(description)
      .setTimestamp();

    if (voiceChannel) embed.addFields({ name: 'Kênh voice', value: `${voiceChannel}` });

    const row = new ActionRowBuilder();
    if (voiceChannel) {
      row.addComponents(
        new ButtonBuilder()
          .setLabel(buttonLabel)
          .setStyle(ButtonStyle.Link)
          .setURL(`https://discord.com/channels/${interaction.guild.id}/${voiceChannel.id}`)
      );
    }

    await interaction.reply({
      content: '@here',
      embeds: [embed],
      components: row.components.length ? [row] : []
    });
  }
};
