const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const db = require('../../database/db');
const config = require('../../config/config');
const guard = require('../../services/guard');
const safety = require('../../database/safety');
const perm = require('../../services/perm');

module.exports = {
  group: 'Quản trị',
  cooldown: 3,
  data: new SlashCommandBuilder()
    .setName('guard')
    .setDescription('GZW Guard: kênh nhật ký, automod, cảnh báo raid')
    .setDMPermission(false)
    .addSubcommand((s) => s.setName('log-channel').setDescription('Chọn kênh nhận nhật ký (nên là kênh riêng tư của staff)')
      .addChannelOption((o) => o.setName('kenh').setDescription('Kênh văn bản').addChannelTypes(ChannelType.GuildText).setRequired(true)))
    .addSubcommand((s) => s.setName('status').setDescription('Xem cấu hình hiện tại')),

  async execute(interaction) {
    const denied = perm.require(interaction, 'admin');
    if (denied) return interaction.reply({ content: denied, ephemeral: true });
    const gid = interaction.guild.id;
    if (interaction.options.getSubcommand() === 'log-channel') {
      const ch = interaction.options.getChannel('kenh');
      const me = interaction.guild.members.me;
      if (!ch.permissionsFor(me)?.has(['ViewChannel', 'SendMessages', 'EmbedLinks'])) return interaction.reply({ content: `❌ Bot chưa có quyền xem/gửi tin/nhúng link trong ${ch}.`, ephemeral: true });
      db.prepare('INSERT INTO guild_settings (guildId, logChannelId) VALUES (?, ?) ON CONFLICT(guildId) DO UPDATE SET logChannelId = excluded.logChannelId').run(gid, ch.id);
      safety.audit(gid, interaction.user.id, 'guard.log_channel', ch.id, null);
      return interaction.reply({ content: `✅ Nhật ký sẽ gửi vào ${ch}. Hãy để kênh này **chỉ staff xem được** vì có nội dung tin nhắn bị xoá/sửa.`, ephemeral: true });
    }
    const a = config.automod, r = config.raid, ch = guard.logChannel(interaction.guild);
    const embed = new EmbedBuilder().setColor(config.colors.info ?? 0x8b5cf6).setTitle('🛡️ GZW Guard').setDescription([
      `Kênh nhật ký: ${ch || '**chưa đặt** — dùng `/guard log-channel`'}`,
      `Automod: ${a.enabled ? 'bật' : 'tắt'} · tag tối đa ${a.maxMentions} · chặn link mời: ${a.blockInvites ? 'có' : 'không'}`,
      `Timeout sau ${a.strikesBeforeTimeout} vi phạm/${a.strikeWindowMs / 60000} phút (${a.timeoutMinutes} phút)`,
      `Cảnh báo raid: ${r.joins} người vào trong ${r.windowMs / 1000} giây`
    ].join('\n'));
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
