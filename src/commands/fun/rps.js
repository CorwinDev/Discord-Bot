const { SlashCommandBuilder } = require('discord.js');

const NAME = { rock: '✊ Búa', paper: '✋ Bao', scissors: '✌️ Kéo' };
const BEATS = { rock: 'scissors', paper: 'rock', scissors: 'paper' };

module.exports = {
  group: 'Giải trí',
  cooldown: 3,
  data: new SlashCommandBuilder().setName('rps').setDescription('Oẳn tù tì với bot (chơi cho vui, không tốn coin)')
    .addStringOption((o) => o.setName('chon').setDescription('Bạn ra gì?').setRequired(true)
      .addChoices({ name: 'Búa', value: 'rock' }, { name: 'Bao', value: 'paper' }, { name: 'Kéo', value: 'scissors' })),
  async execute(interaction) {
    const me = interaction.options.getString('chon');
    const bot = Object.keys(NAME)[Math.floor(Math.random() * 3)];
    const result = me === bot ? 'Hoà!' : BEATS[me] === bot ? 'Bạn thắng! 🎉' : 'Bot thắng! 🐺';
    await interaction.reply(`Bạn: ${NAME[me]} · Bot: ${NAME[bot]}\n**${result}**`);
  }
};
