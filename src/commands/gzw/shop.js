const {
  SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ComponentType
} = require('discord.js');
const eco = require('../../database/economy');
const { coin, colorFor } = require('../../services/gzwUi');
const gzw = require('../../config/gzw');
const safety = require('../../database/safety');

const TYPE_LABEL = { title: 'Danh hiệu', frame: 'Khung hồ sơ', badge: 'Huy hiệu sưu tầm' };

function buildShop(gid, uid) {
  const wallet = eco.getWallet(gid, uid);
  const embed = new EmbedBuilder()
    .setColor(colorFor(wallet))
    .setTitle('🛒 GZW Coin Shop')
    .setDescription(`Số dư của bạn: **${coin(wallet.balance)}**\nChỉ bán vật phẩm **trang trí**. Thành tích và quyền hạn không có trong shop.`);

  for (const type of Object.keys(TYPE_LABEL)) {
    const items = gzw.shop.filter((i) => i.type === type);
    if (!items.length) continue;
    embed.addFields({
      name: TYPE_LABEL[type],
      value: items.map((i) => `${i.emoji} **${i.name}** — ${eco.owns(gid, uid, i.id) ? '✅ đã sở hữu' : coin(i.price)}`).join('\n')
    });
  }

  const buyable = gzw.shop.filter((i) => !eco.owns(gid, uid, i.id)).slice(0, 25);
  const components = [];
  if (buyable.length) {
    components.push(new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('shop_select')
        .setPlaceholder('Chọn vật phẩm muốn mua')
        .addOptions(buyable.map((i) => ({ label: `${i.name} — ${i.price} coin`, value: i.id, emoji: i.emoji, description: i.desc })))
    ));
  } else {
    embed.setFooter({ text: 'Bạn đã sở hữu toàn bộ vật phẩm hiện có 🎉' });
  }
  return { embeds: [embed], components };
}

module.exports = {
  group: 'GZW CORE',
  cooldown: 5,
  data: new SlashCommandBuilder().setName('shop').setDescription('Mở GZW Coin Shop'),

  async execute(interaction) {
    const gid = interaction.guild.id, uid = interaction.user.id;
    await interaction.reply({ ...buildShop(gid, uid), ephemeral: true });
    const message = await interaction.fetchReply();

    const collector = message.createMessageComponentCollector({
      filter: (i) => i.user.id === uid,
      time: 90000
    });
    let selected = null;

    collector.on('collect', async (i) => {
      if (i.customId === 'shop_select' && i.componentType === ComponentType.StringSelect) {
        selected = eco.findItem(i.values[0]);
        if (!selected) return i.update(buildShop(gid, uid));
        const confirm = new EmbedBuilder()
          .setColor(gzw.brandColor)
          .setTitle('Xác nhận mua?')
          .setDescription(`${selected.emoji} **${selected.name}** (${TYPE_LABEL[selected.type]})\nGiá: **${coin(selected.price)}**`);
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('shop_confirm').setLabel('Mua').setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId('shop_cancel').setLabel('Huỷ').setStyle(ButtonStyle.Secondary)
        );
        return i.update({ embeds: [confirm], components: [row] });
      }

      if (i.customId === 'shop_cancel') {
        selected = null;
        return i.update(buildShop(gid, uid));
      }

      if (i.customId === 'shop_confirm' && selected) {
        const blocked = safety.gate(gid, uid, 'shop');
        if (blocked) { selected = null; return i.update({ content: blocked, ...buildShop(gid, uid) }); }
        const res = eco.buyItem(gid, uid, selected.id);
        const item = selected;
        selected = null;
        const view = buildShop(gid, uid);
        const note = res.ok
          ? `✅ Đã mua **${item.name}**. Dùng \`/inventory\` để trang bị.`
          : res.reason === 'funds' ? `❌ Không đủ coin (cần ${coin(item.price)}, bạn có ${coin(res.balance)}).`
          : res.reason === 'owned' ? '❌ Bạn đã sở hữu vật phẩm này.'
          : '❌ Không mua được vật phẩm này.';
        return i.update({ content: note, ...view });
      }
    });

    collector.on('end', () => interaction.editReply({ components: [] }).catch(() => {}));
  }
};
