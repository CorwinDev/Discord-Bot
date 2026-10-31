const { SlashCommandBuilder, EmbedBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');
const db = require('../../database/db');
const gzw = require('../../config/gzw');
const mg = require('../../config/management');
const perm = require('../../services/perm');
const { DEFAULT_TITLE, createWelcomePayload } = require('../../services/welcome');

function saveSetting(guildId, column, value) {
  const allowedColumns = ['welcomeChannelId', 'welcomeMessage', 'welcomeTitle', 'autoRoleId'];
  if (!allowedColumns.includes(column)) throw new Error('Unsupported welcome setting');
  db.prepare(`INSERT INTO guild_settings (guildId, ${column}) VALUES (?, ?)
    ON CONFLICT(guildId) DO UPDATE SET ${column} = excluded.${column}`).run(guildId, value);
}

function getSettings(guildId) {
  return db.prepare('SELECT welcomeChannelId, welcomeMessage, welcomeTitle, autoRoleId FROM guild_settings WHERE guildId = ?').get(guildId) || {};
}

module.exports = {
  group: 'Quản trị',
  cooldown: 3,
  data: new SlashCommandBuilder()
    .setName('welcome')
    .setDescription('Cấu hình lời chào thành viên mới cho server')
    .setDMPermission(false)
    .addSubcommand((subcommand) => subcommand.setName('channel').setDescription('Chọn kênh gửi lời chào')
      .addChannelOption((option) => option.setName('channel').setDescription('Kênh văn bản').addChannelTypes(ChannelType.GuildText).setRequired(true)))
    .addSubcommand((subcommand) => subcommand.setName('title').setDescription('Đặt tiêu đề embed welcome')
      .addStringOption((option) => option.setName('text').setDescription('Hỗ trợ {user}, {server}, {count}, {mention}, {id}').setRequired(true).setMaxLength(256)))
    .addSubcommand((subcommand) => subcommand.setName('message').setDescription('Đặt nội dung lời chào')
      .addStringOption((option) => option.setName('text').setDescription('Hỗ trợ {user}, {server}, {count}, {mention}, {id}').setRequired(true).setMaxLength(1000)))
    .addSubcommand((subcommand) => subcommand.setName('preview').setDescription('Xem trước embed welcome'))
    .addSubcommand((subcommand) => subcommand.setName('autorole').setDescription('Tự gán role cho thành viên mới')
      .addRoleOption((option) => option.setName('role').setDescription('Role muốn gán').setRequired(true)))
    .addSubcommand((subcommand) => subcommand.setName('clear-autorole').setDescription('Tắt gán role tự động'))
    .addSubcommand((subcommand) => subcommand.setName('status').setDescription('Xem cấu hình welcome hiện tại')),

  async execute(interaction) {
    const denied = perm.require(interaction, 'admin');
    if (denied) return interaction.reply({ content: denied, ephemeral: true });

    const guildId = interaction.guild.id;
    const subcommand = interaction.options.getSubcommand();
    const response = (content) => interaction.reply({ content, ephemeral: true });

    if (subcommand === 'channel') {
      const channel = interaction.options.getChannel('channel');
      const me = interaction.guild.members.me;
      if (!channel.permissionsFor(me)?.has([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks])) {
        return response(`Bot cần quyền View Channel, Send Messages và Embed Links tại ${channel}.`);
      }
      saveSetting(guildId, 'welcomeChannelId', channel.id);
      return response(`✅ Welcome sẽ được gửi vào ${channel}.`);
    }

    if (subcommand === 'title' || subcommand === 'message') {
      const column = subcommand === 'title' ? 'welcomeTitle' : 'welcomeMessage';
      saveSetting(guildId, column, interaction.options.getString('text'));
      return response(subcommand === 'title' ? '✅ Đã lưu tiêu đề welcome.' : '✅ Đã lưu lời chào welcome.');
    }

    if (subcommand === 'preview') {
      return interaction.reply({ ...createWelcomePayload(interaction.member, getSettings(guildId)), ephemeral: true });
    }

    if (subcommand === 'autorole') {
      const role = interaction.options.getRole('role');
      const me = interaction.guild.members.me;
      const hasDangerousPermissions = mg.dangerousPerms.some((permission) => role.permissions.has(PermissionFlagsBits[permission]));
      if (role.id === guildId || role.managed || mg.staffRoles[role.name] || hasDangerousPermissions || role.position >= me.roles.highest.position || !me.permissions.has(PermissionFlagsBits.ManageRoles)) {
        return response('❌ Role không thể tự động gán: không dùng role quản trị/nhân sự; role thường phải thấp hơn role cao nhất của bot và bot cần quyền Manage Roles.');
      }
      saveSetting(guildId, 'autoRoleId', role.id);
      return response(`✅ Thành viên mới sẽ nhận role ${role}.`);
    }

    if (subcommand === 'clear-autorole') {
      saveSetting(guildId, 'autoRoleId', null);
      return response('✅ Đã tắt gán role tự động.');
    }

    const settings = getSettings(guildId);
    const channel = settings.welcomeChannelId ? interaction.guild.channels.cache.get(settings.welcomeChannelId) : null;
    const role = settings.autoRoleId ? interaction.guild.roles.cache.get(settings.autoRoleId) : null;
    const embed = new EmbedBuilder().setColor(gzw.brandColor).setTitle('✉️ Cấu hình welcome')
      .addFields(
        { name: 'Kênh', value: channel ? `${channel}` : 'Chưa đặt', inline: true },
        { name: 'Role tự động', value: role ? `${role}` : 'Tắt', inline: true },
        { name: 'Tiêu đề', value: settings.welcomeTitle || DEFAULT_TITLE },
        { name: 'Lời chào', value: settings.welcomeMessage || 'Lời chào mặc định' }
      );
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }
};