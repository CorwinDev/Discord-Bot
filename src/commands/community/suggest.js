const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../../database/db');
const gzw = require('../../config/gzw');

const STATUS = { OPEN: '🟡 Đang xem xét', APPROVED: '🟢 Được chấp nhận', DENIED: '🔴 Bị từ chối' };

function suggestionEmbed(s, author) {
  return new EmbedBuilder().setColor(s.status === 'APPROVED' ? 0x57f287 : s.status === 'DENIED' ? 0xed4245 : gzw.brandColor)
    .setTitle(`💡 Gợi ý #${s.id}`)
    .setDescription(s.content)
    .addFields({ name: 'Trạng thái', value: STATUS[s.status] + (s.note ? `\n${s.note}` : '') })
    .setFooter({ text: `Gửi bởi ${author}` });
}

module.exports = {
  group: 'Cộng đồng',
  cooldown: 30,
  suggestionEmbed,
  data: new SlashCommandBuilder()
    .setName('suggest')
    .setDescription('Gửi gợi ý cho server')
    .setDMPermission(false)
    .addStringOption((o) => o.setName('noi-dung').setDescription('Nội dung gợi ý').setRequired(true).setMinLength(10).setMaxLength(1000)),

  async execute(interaction) {
    const gid = interaction.guild.id;
    const channel = interaction.guild.channels.cache.find((c) => c.name === gzw.community.suggestionChannelName && c.isTextBased()) || interaction.channel;
    const info = db.prepare('INSERT INTO suggestions (guildId, userId, content, createdAt) VALUES (?, ?, ?, ?)')
      .run(gid, interaction.user.id, interaction.options.getString('noi-dung'), Date.now());
    const s = db.prepare('SELECT * FROM suggestions WHERE id = ?').get(info.lastInsertRowid);
    const msg = await channel.send({ embeds: [suggestionEmbed(s, interaction.user.username)], allowedMentions: { parse: [] } });
    await msg.react('👍').catch(() => {});
    await msg.react('👎').catch(() => {});
    db.prepare('UPDATE suggestions SET channelId = ?, messageId = ? WHERE id = ?').run(channel.id, msg.id, s.id);
    await interaction.reply({ content: `✅ Đã gửi gợi ý **#${s.id}** tới ${channel}.`, ephemeral: true });
  }
};
