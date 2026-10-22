const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');
const perm = require('../../services/perm');
const { audit } = require('../../database/safety');
const { runChecks, format } = require('../../services/serverCheck');
const mg = require('../../config/management');
const gzw = require('../../config/gzw');

const roleOpts = (s, n = 5) => { for (let i = 1; i <= n; i++) s.addRoleOption((o) => o.setName(`role${i}`).setDescription(`Role ${i}`).setRequired(i === 1)); return s; };

module.exports = {
  group: 'GZW Management',
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('server')
    .setDescription('Quản lý cấu trúc server và cấu hình bot (admin)')
    .setDMPermission(false)
    .addSubcommand((s) => s.setName('check').setDescription('Kiểm tra cấu hình quan trọng của bot'))
    .addSubcommand((s) => s.setName('overview').setDescription('Danh sách danh mục, kênh và vai trò'))
    .addSubcommand((s) => roleOpts(s.setName('rolemenu').setDescription('Gửi role menu (game/sở thích/thông báo) vào kênh này')
      .addStringOption((o) => o.setName('tieu-de').setDescription('Tiêu đề menu').setRequired(true).setMaxLength(80)))),

  async execute(interaction) {
    const err = perm.require(interaction, 'admin');
    if (err) return interaction.reply({ content: err, ephemeral: true });
    const guild = interaction.guild;
    const sub = interaction.options.getSubcommand();

    if (sub === 'check') {
      const list = runChecks(guild);
      const worst = list.some((x) => x.level === 'error') ? 0xed4245 : list.some((x) => x.level === 'warn') ? 0xfee75c : 0x57f287;
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(worst).setTitle('🛡️ Kiểm tra cấu hình').setDescription(format(list))], ephemeral: true });
    }

    if (sub === 'overview') {
      await guild.channels.fetch().catch(() => {});
      const cats = guild.channels.cache.filter((c) => c.type === ChannelType.GuildCategory).sort((a, b) => a.position - b.position);
      const lines = [];
      for (const [, cat] of cats) {
        const kids = guild.channels.cache.filter((c) => c.parentId === cat.id).sort((a, b) => a.position - b.position);
        lines.push(`**${cat.name}** (${kids.size})\n${kids.map((c) => `└ ${c.type === ChannelType.GuildVoice ? '🔊' : '#'}${c.name}`).join('\n')}`);
      }
      const loose = guild.channels.cache.filter((c) => !c.parentId && c.type !== ChannelType.GuildCategory);
      if (loose.size) lines.push(`**(không danh mục)**\n${loose.map((c) => `└ #${c.name}`).join('\n')}`);
      const roles = guild.roles.cache.filter((r) => r.id !== guild.id).sort((a, b) => b.position - a.position).map((r) => r.name);
      const e = new EmbedBuilder().setColor(gzw.brandColor).setTitle(`🗺️ ${guild.name}`)
        .setDescription(lines.join('\n\n').slice(0, 3800) || '—')
        .addFields({ name: `Vai trò (${roles.length})`, value: roles.join(' · ').slice(0, 1000) || '—' });
      return interaction.reply({ embeds: [e], ephemeral: true });
    }

    if (sub === 'rolemenu') {
      const roles = [1, 2, 3, 4, 5].map((i) => interaction.options.getRole(`role${i}`)).filter(Boolean);
      const unique = [...new Map(roles.map((r) => [r.id, r])).values()];
      const botTop = guild.members.me.roles.highest.position;
      const actorTop = interaction.member.roles.highest.position;
      const isOwner = guild.ownerId === interaction.user.id;
      const bad = [];
      for (const r of unique) {
        if (r.id === guild.id || r.managed) bad.push(`${r.name} (role hệ thống/bot)`);
        else if (r.position >= botTop) bad.push(`${r.name} (cao hơn bot)`);
        else if (!isOwner && r.position >= actorTop) bad.push(`${r.name} (cao hơn bạn)`);
        else if (mg.dangerousPerms.some((p) => r.permissions.has(PermissionFlagsBits[p]))) bad.push(`${r.name} (có quyền quản trị/kiểm duyệt)`);
        else if (mg.staffRoles[r.name] || r.name === gzw.booster.perkRoleName || gzw.achievements.some((a) => a.role === r.name)) bad.push(`${r.name} (role nhân sự/booster/thành tích)`);
      }
      if (bad.length) return interaction.reply({ content: `❌ Không đưa vào role menu được:\n${bad.map((b) => `• ${b}`).join('\n')}`, ephemeral: true });

      const menu = new StringSelectMenuBuilder().setCustomId('rolemenu').setPlaceholder('Chọn role để bật/tắt')
        .setMinValues(1).setMaxValues(unique.length).addOptions(unique.map((r) => ({ label: r.name.slice(0, 100), value: r.id })));
      const e = new EmbedBuilder().setColor(gzw.brandColor).setTitle(interaction.options.getString('tieu-de'))
        .setDescription(`Chọn role để **bật/tắt**:\n${unique.map((r) => `• ${r.name}`).join('\n')}`);
      await interaction.channel.send({ embeds: [e], components: [new ActionRowBuilder().addComponents(menu)] });
      audit(guild.id, interaction.user.id, 'rolemenu.create', interaction.channel.id, unique.map((r) => r.name).join(', '));
      return interaction.reply({ content: '✅ Đã gửi role menu.', ephemeral: true });
    }
  }
};
