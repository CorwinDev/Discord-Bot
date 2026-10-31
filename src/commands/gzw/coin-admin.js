const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const eco = require('../../database/economy');
const { coin } = require('../../services/gzwUi');
const gzw = require('../../config/gzw');
const safety = require('../../database/safety');
const perm = require('../../services/perm');

module.exports = {
  group: 'GZW CORE (Quản trị)',
  cooldown: 3,
  data: new SlashCommandBuilder()
    .setName('coin-admin')
    .setDescription('Cộng/trừ coin cho thành viên (có ghi sổ)')
    .addStringOption((o) => o.setName('hanh-dong').setDescription('Cộng hay trừ').setRequired(true)
      .addChoices({ name: 'Cộng coin', value: 'give' }, { name: 'Trừ coin', value: 'take' }))
    .addUserOption((o) => o.setName('user').setDescription('Thành viên').setRequired(true))
    .addIntegerOption((o) => o.setName('so-luong').setDescription('Số coin').setRequired(true).setMinValue(1).setMaxValue(1000000))
    .addStringOption((o) => o.setName('ly-do').setDescription('Lý do (bắt buộc, được ghi vào sổ)').setRequired(true).setMaxLength(100)),

  async execute(interaction) {
    const denied = perm.require(interaction, 'economy');
    if (denied) return interaction.reply({ content: denied, ephemeral: true });
    const action = interaction.options.getString('hanh-dong');
    const user = interaction.options.getUser('user');
    const amount = interaction.options.getInteger('so-luong');
    const reason = `${interaction.options.getString('ly-do')} (bởi ${interaction.user.id})`;
    if (user.bot) return interaction.reply({ content: '❌ Không áp dụng cho bot.', ephemeral: true });

    const res = action === 'give'
      ? eco.addCoins(interaction.guild.id, user.id, amount, 'admin', reason)
      : eco.spendCoins(interaction.guild.id, user.id, amount, 'admin', reason);

    if (!res.ok) return interaction.reply({ content: `❌ ${user.username} chỉ có ${coin(res.balance)}, không đủ để trừ.`, ephemeral: true });

    safety.audit(interaction.guild.id, interaction.user.id, `coin.${action}`, user.id, `${amount} · ${interaction.options.getString('ly-do')}`);
    const embed = new EmbedBuilder()
      .setColor(gzw.brandColor)
      .setDescription(`${action === 'give' ? '➕ Đã cộng' : '➖ Đã trừ'} **${coin(amount)}** ${action === 'give' ? 'cho' : 'của'} ${user}\nSố dư mới: **${coin(res.balance)}**`);
    await interaction.reply({ embeds: [embed], allowedMentions: { parse: [] } });
  }
};
