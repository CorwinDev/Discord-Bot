const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const eco = require('../../database/economy');
const { coin, colorFor } = require('../../services/gzwUi');
const gzw = require('../../config/gzw');

module.exports = {
  group: 'GZW CORE',
  cooldown: 3,
  data: new SlashCommandBuilder()
    .setName('balance')
    .setDescription('Xem số dư GZW Coin')
    .addUserOption((o) => o.setName('user').setDescription('Thành viên muốn xem')),

  async execute(interaction) {
    const target = interaction.options.getUser('user') || interaction.user;
    const w = eco.getWallet(interaction.guild.id, target.id);
    const embed = new EmbedBuilder()
      .setColor(colorFor(w))
      .setAuthor({ name: target.username, iconURL: target.displayAvatarURL() })
      .setTitle(`${gzw.currency.emoji} Số dư: ${coin(w.balance)}`)
      .setFooter({ text: 'Dùng /daily, /quests, /hunt để kiếm thêm coin' });
    await interaction.reply({ embeds: [embed] });
  }
};
