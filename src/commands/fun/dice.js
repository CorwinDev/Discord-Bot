const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  group: 'Giải trí',
  cooldown: 2,
  data: new SlashCommandBuilder().setName('dice').setDescription('Tung xúc xắc')
    .addIntegerOption((o) => o.setName('so-mat').setDescription('Số mặt (mặc định 6)').setMinValue(2).setMaxValue(1000))
    .addIntegerOption((o) => o.setName('so-vien').setDescription('Số viên xúc xắc (mặc định 1)').setMinValue(1).setMaxValue(10)),
  async execute(interaction) {
    const sides = interaction.options.getInteger('so-mat') ?? 6;
    const count = interaction.options.getInteger('so-vien') ?? 1;
    const rolls = Array.from({ length: count }, () => 1 + Math.floor(Math.random() * sides));
    const sum = rolls.reduce((a, b) => a + b, 0);
    await interaction.reply(`🎲 ${interaction.user} tung **${count}d${sides}**: ${rolls.join(' + ')}${count > 1 ? ` = **${sum}**` : ''}`);
  }
};
