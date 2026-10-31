const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  group: 'Giải trí',
  cooldown: 2,
  data: new SlashCommandBuilder().setName('flip').setDescription('Tung đồng xu vui (không liên quan GZW Coin)'),
  async execute(interaction) {
    await interaction.reply(`🪙 ${interaction.user} tung đồng xu: **${Math.random() < 0.5 ? 'Sấp' : 'Ngửa'}**`);
  }
};
