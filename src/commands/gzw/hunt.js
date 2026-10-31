const {
  SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType
} = require('discord.js');
const eco = require('../../database/economy');
const { coin, colorFor, fmt } = require('../../services/gzwUi');
const { checkAutoAchievements } = require('../../services/gzwCore');
const gzw = require('../../config/gzw');
const safety = require('../../database/safety');

const SPOTS = [
  { id: 'bush',   label: 'Bụi rậm',  emoji: '🌿', text: 'Bạn lần theo dấu chân trong bụi rậm' },
  { id: 'stream', label: 'Bờ suối',  emoji: '💧', text: 'Bạn men theo bờ suối lúc trăng lên' },
  { id: 'cave',   label: 'Hang đá',  emoji: '⛰️', text: 'Bạn rón rén vào hang đá tối' }
];

module.exports = {
  group: 'GZW CORE',
  cooldown: 3,
  data: new SlashCommandBuilder().setName('hunt').setDescription('Mini-game săn mồi: chọn một hướng để nhận coin (không tốn coin)'),

  async execute(interaction) {
    const gid = interaction.guild.id, uid = interaction.user.id;
    const blocked = safety.gate(gid, uid, 'play', true);
    if (blocked) return interaction.reply({ content: blocked, ephemeral: true });
    const status = eco.playStatus(gid, uid);

    if (!status.ok) {
      const msg = status.reason === 'cooldown'
        ? `⏳ Đàn sói đang nghỉ. Thử lại sau **${status.waitSeconds}s**.`
        : `🌙 Hôm nay bạn đã đạt trần coin từ mini-game. Quay lại vào ngày mai nhé.`;
      return interaction.reply({ content: msg, ephemeral: true });
    }

    const row = new ActionRowBuilder().addComponents(
      SPOTS.map((s) => new ButtonBuilder().setCustomId(`play_${s.id}`).setLabel(s.label).setEmoji(s.emoji).setStyle(ButtonStyle.Secondary))
    );
    const intro = new EmbedBuilder()
      .setColor(gzw.brandColor)
      .setTitle('🐺 Săn mồi dưới trăng')
      .setDescription('Chọn một hướng để tìm mồi. Chơi miễn phí — không có rủi ro mất coin.');

    await interaction.reply({ embeds: [intro], components: [row] });
    const message = await interaction.fetchReply();

    const collector = message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      filter: (i) => i.user.id === uid,
      time: 30000,
      max: 1
    });

    collector.on('collect', async (btn) => {
      const spot = SPOTS.find((s) => `play_${s.id}` === btn.customId) || SPOTS[0];
      if (safety.gate(gid, uid, 'play', true)) return btn.update({ content: '🛑 Mini-game đang tạm dừng.', embeds: [], components: [] });
      const res = eco.doPlay(gid, uid);

      if (!res.ok) {
        return btn.update({ content: '⏳ Lượt chơi không còn hợp lệ (đang hồi hoặc đã đạt trần hôm nay).', embeds: [], components: [] });
      }

      const embed = new EmbedBuilder()
        .setColor(colorFor(eco.getWallet(gid, uid)))
        .setTitle(`${spot.emoji} ${spot.label}`)
        .setDescription(`${spot.text}… và tìm thấy **${coin(res.reward)}**${res.doubled ? ' ✨ (nhân đôi!)' : ''}\nSố dư: **${coin(res.balance)}**`);

      if (res.completedQuests.length) {
        embed.addFields({ name: 'Nhiệm vụ hoàn thành', value: res.completedQuests.map((q) => `✅ ${q.name} · +${fmt(q.reward)} ${gzw.currency.emoji}`).join('\n') });
      }
      const earned = await checkAutoAchievements(interaction.guild, uid);
      if (earned.length) embed.addFields({ name: 'Thành tích mới', value: earned.map((a) => `🏅 ${a.name}`).join('\n') });

      await btn.update({ embeds: [embed], components: [] });
    });

    collector.on('end', (collected) => {
      if (collected.size === 0) interaction.editReply({ content: '⌛ Hết giờ chọn hướng.', embeds: [], components: [] }).catch(() => {});
    });
  }
};
