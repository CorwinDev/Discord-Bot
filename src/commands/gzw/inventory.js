const {
  SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ComponentType
} = require('discord.js');
const eco = require('../../database/economy');
const { colorFor } = require('../../services/gzwUi');

function buildView(gid, uid) {
  const wallet = eco.getWallet(gid, uid);
  const inv = eco.getInventory(gid, uid);
  const equippedTitle = wallet.equippedTitle && eco.findItem(wallet.equippedTitle);
  const equippedFrame = wallet.equippedFrame && eco.findItem(wallet.equippedFrame);

  const embed = new EmbedBuilder()
    .setColor(colorFor(wallet))
    .setTitle('🎒 Kho đồ')
    .addFields(
      { name: 'Đang trang bị', value: `Danh hiệu: ${equippedTitle ? `${equippedTitle.emoji} ${equippedTitle.name}` : '—'}\nKhung: ${equippedFrame ? `${equippedFrame.emoji} ${equippedFrame.name}` : '—'}` },
      { name: `Vật phẩm (${inv.length})`, value: inv.length ? inv.map((r) => `${r.item.emoji} ${r.item.name}`).join('\n') : 'Trống. Ghé `/shop` nhé.' }
    );

  const equippable = inv.filter((r) => ['title', 'frame'].includes(r.item.type));
  const components = [];
  if (equippable.length) {
    components.push(new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder().setCustomId('inv_equip').setPlaceholder('Chọn để trang bị')
        .addOptions(equippable.map((r) => ({ label: r.item.name, value: r.item.id, emoji: r.item.emoji, description: r.item.type === 'title' ? 'Danh hiệu' : 'Khung hồ sơ' })))
    ));
    components.push(new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('inv_unequip_title').setLabel('Gỡ danh hiệu').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('inv_unequip_frame').setLabel('Gỡ khung').setStyle(ButtonStyle.Secondary)
    ));
  }
  return { embeds: [embed], components };
}

module.exports = {
  group: 'GZW CORE',
  cooldown: 5,
  data: new SlashCommandBuilder().setName('inventory').setDescription('Xem và trang bị vật phẩm của bạn'),

  async execute(interaction) {
    const gid = interaction.guild.id, uid = interaction.user.id;
    await interaction.reply({ ...buildView(gid, uid), ephemeral: true });
    const message = await interaction.fetchReply();
    const collector = message.createMessageComponentCollector({ filter: (i) => i.user.id === uid, time: 90000 });

    collector.on('collect', async (i) => {
      if (i.componentType === ComponentType.StringSelect && i.customId === 'inv_equip') eco.equip(gid, uid, i.values[0]);
      if (i.customId === 'inv_unequip_title') eco.unequip(gid, uid, 'title');
      if (i.customId === 'inv_unequip_frame') eco.unequip(gid, uid, 'frame');
      await i.update(buildView(gid, uid));
    });
    collector.on('end', () => interaction.editReply({ components: [] }).catch(() => {}));
  }
};
