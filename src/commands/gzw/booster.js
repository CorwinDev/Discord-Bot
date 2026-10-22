const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const boosters = require('../../database/boosters');
const { coin } = require('../../services/gzwUi');
const gzw = require('../../config/gzw');

module.exports = {
  group: 'GZW CORE',
  cooldown: 5,
  data: new SlashCommandBuilder().setName('booster').setDescription('Xem trạng thái Booster và lịch sử thưởng Boost của bạn').setDMPermission(false),
  async execute(interaction) {
    const gid = interaction.guild.id, uid = interaction.user.id;
    const rows = boosters.listUser(gid, uid);
    const st = boosters.getStatus(gid, uid);
    if (!rows.length && !st) return interaction.reply({ content: 'Chưa ghi nhận lượt boost nào của bạn.', ephemeral: true });

    const lines = rows.map((r) => `<t:${Math.floor(r.createdAt / 1000)}:d> — ${r.status === 'REWARDED' ? `✅ +${coin(r.coins)}` : '🔎 chờ quản trị viên'}`);
    const perks = [
      gzw.booster.perkRoleName && `Role **${gzw.booster.perkRoleName}**`,
      ...gzw.booster.perkItems.map((i) => `${i.emoji} ${i.name}`)
    ].filter(Boolean).join(' · ');
    const embed = new EmbedBuilder().setColor(gzw.brandColor).setTitle('💜 Booster')
      .setDescription(lines.length ? lines.join('\n') : 'Chưa có lượt thưởng nào.')
      .addFields({ name: 'Quyền lợi theo trạng thái Boost', value: `${st?.active ? '✅ Đang có' : '⏸️ Tạm gỡ (Boost lại để nhận lại)'}: ${perks}` })
      .setFooter({ text: 'Coin đã nhận và huy hiệu Booster Supporter được giữ lại kể cả khi ngừng Boost.' });
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
