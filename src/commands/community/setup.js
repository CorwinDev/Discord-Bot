const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, MessageFlags } = require('discord.js');
const db = require('../../database/db');
const { postSetupPanel } = require('../../services/werewolf');

module.exports = {
  group: 'Cộng đồng (Quản trị)',
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Cấu hình các kênh cộng đồng')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setDMPermission(false)
    .addSubcommand((subcommand) => subcommand.setName('social').setDescription('Cấu hình kênh confession và ghép đôi')
      .addChannelOption((option) => option.setName('confession-channel').setDescription('Kênh nhận confession').setRequired(true).addChannelTypes(ChannelType.GuildText))
      .addChannelOption((option) => option.setName('tinder-channel').setDescription('Kênh dùng /social discover').setRequired(true).addChannelTypes(ChannelType.GuildText))
      .addChannelOption((option) => option.setName('feedback-channel').setDescription('Kênh nhận feedback (tùy chọn)').addChannelTypes(ChannelType.GuildText)))
    .addSubcommand((subcommand) => subcommand.setName('werewolf').setDescription('Đăng bảng tạo game Ma Sói')
      .addChannelOption((option) => option.setName('kenh').setDescription('Kênh bảng Ma Sói').setRequired(true).addChannelTypes(ChannelType.GuildText))),

  async execute(interaction) {
    if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({ content: 'Bạn cần quyền Quản lý máy chủ để dùng lệnh setup.', flags: MessageFlags.Ephemeral });
    }

    const subcommand = interaction.options.getSubcommand();
    if (subcommand === 'werewolf') {
      const channel = interaction.options.getChannel('kenh');
      const me = interaction.guild.members.me || await interaction.guild.members.fetchMe().catch(() => null);
      const permissions = me && channel.permissionsFor(me);
      if (!permissions?.has([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks])) {
        return interaction.reply({ content: 'Bot cần View Channel, Send Messages và Embed Links trong kênh đã chọn.', flags: MessageFlags.Ephemeral });
      }
      db.prepare(`INSERT INTO werewolf_settings (guildId, channelId, updatedAt) VALUES (?, ?, ?)
        ON CONFLICT (guildId) DO UPDATE SET channelId = excluded.channelId, updatedAt = excluded.updatedAt`)
        .run(interaction.guildId, channel.id, Date.now());
      await postSetupPanel(interaction.guild, channel);
      return interaction.reply({ content: `✅ Đã cấu hình bảng Ma Sói tại ${channel}.`, flags: MessageFlags.Ephemeral });
    }
    if (subcommand !== 'social') return interaction.reply({ content: 'Subcommand không hợp lệ.', flags: MessageFlags.Ephemeral });
    const me = interaction.guild.members.me || await interaction.guild.members.fetchMe().catch(() => null);
    if (!me) return interaction.reply({ content: 'Bot chưa tải được thông tin thành viên trong server.', flags: MessageFlags.Ephemeral });
      const confessionChannel = interaction.options.getChannel('confession-channel');
      const tinderChannel = interaction.options.getChannel('tinder-channel');
      const feedbackChannel = interaction.options.getChannel('feedback-channel');
      if (!canPost(confessionChannel, me) || !canPost(tinderChannel, me) || (feedbackChannel && !canPost(feedbackChannel, me))) {
        return interaction.editReply('Bot cần View Channel, Send Messages và Embed Links trong các kênh đã chọn.');
      }
      db.prepare(`INSERT INTO social_settings (guildId, confessionChannelId, tinderChannelId, feedbackChannelId, updatedAt)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(guildId) DO UPDATE SET confessionChannelId = excluded.confessionChannelId,
          tinderChannelId = excluded.tinderChannelId, feedbackChannelId = excluded.feedbackChannelId, updatedAt = excluded.updatedAt`)
        .run(interaction.guildId, confessionChannel.id, tinderChannel.id, feedbackChannel?.id || null, Date.now());
    return interaction.reply({ content: `✅ Confession: ${confessionChannel}\n✅ Khám phá hồ sơ: ${tinderChannel}${feedbackChannel ? `\n✅ Feedback: ${feedbackChannel}` : ''}`, flags: MessageFlags.Ephemeral });
  }
};