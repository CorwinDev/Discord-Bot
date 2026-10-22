const {
  SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder
} = require('discord.js');
const eco = require('../../database/economy');
const safety = require('../../database/safety');
const { coin, colorFor, fmt } = require('../../services/gzwUi');
const gzw = require('../../config/gzw');

function view(gid, uid) {
  const wallet = eco.getWallet(gid, uid);
  const list = eco.getUpgradeStatus(gid, uid);
  const embed = new EmbedBuilder()
    .setColor(colorFor(wallet))
    .setTitle('⚙️ GZW Upgrade Center')
    .setDescription(`Số dư: **${coin(wallet.balance)}** · Cấp chat: **${list[0].playerLevel}**\nNâng cấp **vĩnh viễn**, lợi ích nhỏ, không tạo lợi thế thắng trong game.`);

  for (const s of list) {
    const d = s.def;
    const head = `${d.emoji} **${d.name}** · ${d.branch} · Cấp ${s.level}/${s.max}`;
    let body = `${d.desc}\nHiện tại: **${fmt(s.current)} ${d.unit}**`;
    if (s.maxed) body += '\n✅ Đã đạt cấp tối đa';
    else {
      body += ` → cấp sau: **${fmt(s.next)} ${d.unit}**\nGiá: **${coin(s.nextCost)}**`;
      if (s.nextMinLevel > 0) body += ` · Cần cấp chat ≥ ${s.nextMinLevel}${s.playerLevel >= s.nextMinLevel ? ' ✅' : ' ❌'}`;
    }
    embed.addFields({ name: head, value: body });
  }

  const options = list.filter((s) => !s.maxed).map((s) => ({
    label: `${s.def.name} → cấp ${s.level + 1} (${fmt(s.nextCost)} coin)`, value: s.def.id, emoji: s.def.emoji
  }));
  const components = options.length
    ? [new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId('up_select').setPlaceholder('Chọn nâng cấp để mua').addOptions(options))]
    : [];
  if (!options.length) embed.setFooter({ text: 'Bạn đã nâng cấp tối đa mọi nhánh 🎉' });
  return { embeds: [embed], components };
}

module.exports = {
  group: 'GZW CORE',
  cooldown: 5,
  data: new SlashCommandBuilder().setName('upgrade').setDescription('Mở Upgrade Center: nâng cấp vĩnh viễn bằng coin'),

  async execute(interaction) {
    const gid = interaction.guild.id, uid = interaction.user.id;
    await interaction.reply({ ...view(gid, uid), ephemeral: true });
    const message = await interaction.fetchReply();
    const collector = message.createMessageComponentCollector({ filter: (i) => i.user.id === uid, time: 90000 });
    let selected = null;

    collector.on('collect', async (i) => {
      if (i.customId === 'up_select') {
        const blocked = safety.gate(gid, uid, 'upgrade');
        if (blocked) return i.update({ content: blocked, ...view(gid, uid) });
        const s = eco.getUpgradeStatus(gid, uid).find((x) => x.def.id === i.values[0]);
        if (!s || s.maxed) return i.update(view(gid, uid));
        selected = s.def.id;
        const embed = new EmbedBuilder().setColor(gzw.brandColor).setTitle('Xác nhận nâng cấp?')
          .setDescription(`${s.def.emoji} **${s.def.name}**: cấp ${s.level} → **${s.level + 1}**\n${fmt(s.current)} → **${fmt(s.next)} ${s.def.unit}**\nGiá: **${coin(s.nextCost)}**`);
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('up_confirm').setLabel('Nâng cấp').setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId('up_cancel').setLabel('Huỷ').setStyle(ButtonStyle.Secondary)
        );
        return i.update({ content: '', embeds: [embed], components: [row] });
      }
      if (i.customId === 'up_cancel') { selected = null; return i.update({ content: '', ...view(gid, uid) }); }
      if (i.customId === 'up_confirm' && selected) {
        const id = selected; selected = null;
        const blocked = safety.gate(gid, uid, 'upgrade');
        if (blocked) return i.update({ content: blocked, ...view(gid, uid) });
        const res = eco.buyUpgrade(gid, uid, id);
        const note = res.ok ? `✅ **${res.def.name}** lên cấp **${res.level}**. Số dư: ${coin(res.balance)}`
          : res.reason === 'funds' ? `❌ Không đủ coin (cần ${coin(res.cost)}, bạn có ${coin(res.balance)}).`
          : res.reason === 'level' ? `❌ Cần đạt cấp chat ${res.needLv} để lên cấp này.`
          : res.reason === 'maxed' ? '❌ Đã đạt cấp tối đa.' : '❌ Không nâng cấp được.';
        return i.update({ content: note, ...view(gid, uid) });
      }
    });
    collector.on('end', () => interaction.editReply({ components: [] }).catch(() => {}));
  }
};
