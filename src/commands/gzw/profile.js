const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const eco = require('../../database/economy');
const { getUser, xpForNextLevel, getRank } = require('../../database/levels');
const { coin, colorFor } = require('../../services/gzwUi');

module.exports = {
  group: 'GZW CORE',
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('Xem hồ sơ GZW')
    .addUserOption((o) => o.setName('user').setDescription('Thành viên muốn xem')),

  async execute(interaction) {
    const target = interaction.options.getUser('user') || interaction.user;
    if (target.bot) return interaction.reply({ content: 'Bot không có hồ sơ GZW.', ephemeral: true });
    const gid = interaction.guild.id;

    const wallet = eco.getWallet(gid, target.id);
    const lv = getUser(gid, target.id);
    const title = wallet.equippedTitle && eco.findItem(wallet.equippedTitle);
    const inv = eco.getInventory(gid, target.id);
    const slots = eco.upgradeValue(gid, target.id, 'showcase');
    const allBadges = inv.filter((r) => r.item.type === 'badge');
    const badges = allBadges.slice(0, slots).map((r) => r.item.emoji).join(' ')
      + (allBadges.length > slots ? ` (+${allBadges.length - slots} ẩn)` : '');
    const ach = eco.listAchievements(gid, target.id);

    const embed = new EmbedBuilder()
      .setColor(colorFor(wallet))
      .setAuthor({ name: `${target.username}${title ? ` · ${title.emoji} ${title.name}` : ''}`, iconURL: target.displayAvatarURL() })
      .setThumbnail(target.displayAvatarURL())
      .addFields(
        { name: 'Cấp độ', value: `${lv.level} (${lv.xp}/${xpForNextLevel(lv.level)} XP) · Hạng #${getRank(gid, target.id) || '—'}`, inline: false },
        { name: 'Coin', value: coin(wallet.balance), inline: true },
        { name: 'Chuỗi daily', value: `${wallet.streak} ngày`, inline: true },
        { name: 'Vật phẩm', value: `${inv.length}${badges ? ` · ${badges}` : ''}`, inline: true },
        { name: `Thành tích (${ach.length})`, value: ach.length ? ach.map((a) => a.def.name).join(' · ') : 'Chưa có' }
      );
    await interaction.reply({ embeds: [embed] });
  }
};
