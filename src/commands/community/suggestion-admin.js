const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../../database/db');
const safety = require('../../database/safety');
const { suggestionEmbed } = require('./suggest');

module.exports = {
  group: 'Cộng đồng (Quản trị)',
  cooldown: 2,
  data: new SlashCommandBuilder()
    .setName('suggestion-admin')
    .setDescription('Duyệt hoặc từ chối gợi ý của thành viên')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setDMPermission(false)
    .addIntegerOption((o) => o.setName('id').setDescription('ID gợi ý').setRequired(true).setMinValue(1))
    .addStringOption((o) => o.setName('quyet-dinh').setDescription('Quyết định').setRequired(true)
      .addChoices({ name: 'Chấp nhận', value: 'APPROVED' }, { name: 'Từ chối', value: 'DENIED' }))
    .addStringOption((o) => o.setName('ghi-chu').setDescription('Lý do / ghi chú').setMaxLength(300)),

  async execute(interaction, client) {
    const gid = interaction.guild.id;
    const s = db.prepare('SELECT * FROM suggestions WHERE id = ? AND guildId = ?').get(interaction.options.getInteger('id'), gid);
    if (!s) return interaction.reply({ content: '❌ Không tìm thấy gợi ý.', ephemeral: true });
    const status = interaction.options.getString('quyet-dinh');
    const note = interaction.options.getString('ghi-chu');
    db.prepare('UPDATE suggestions SET status = ?, decidedBy = ?, note = ? WHERE id = ?').run(status, interaction.user.id, note, s.id);
    safety.audit(gid, interaction.user.id, `suggestion.${status.toLowerCase()}`, String(s.id), note);

    const ch = s.channelId && await client.channels.fetch(s.channelId).catch(() => null);
    const msg = ch && await ch.messages.fetch(s.messageId).catch(() => null);
    const author = await client.users.fetch(s.userId).then((u) => u.username).catch(() => s.userId);
    await msg?.edit({ embeds: [suggestionEmbed({ ...s, status, note }, author)] }).catch(() => {});
    await interaction.reply({ content: `✅ Đã cập nhật gợi ý #${s.id}: ${status === 'APPROVED' ? 'chấp nhận' : 'từ chối'}.`, ephemeral: true });
  }
};
