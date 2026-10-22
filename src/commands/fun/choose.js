const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  group: 'Giải trí',
  cooldown: 3,
  data: new SlashCommandBuilder().setName('choose').setDescription('Để bot chọn giúp một phương án')
    .addStringOption((o) => o.setName('lua-chon').setDescription('Các lựa chọn, cách nhau bằng dấu phẩy. Ví dụ: pizza, phở, bún').setRequired(true).setMaxLength(300)),
  async execute(interaction) {
    const opts = interaction.options.getString('lua-chon').split(',').map((s) => s.trim()).filter(Boolean);
    if (opts.length < 2) return interaction.reply({ content: '❌ Cho ít nhất 2 lựa chọn, cách nhau bằng dấu phẩy.', ephemeral: true });
    if (opts.length > 20) return interaction.reply({ content: '❌ Tối đa 20 lựa chọn.', ephemeral: true });
    await interaction.reply({ content: `🤔 Mình chọn: **${opts[Math.floor(Math.random() * opts.length)]}**`, allowedMentions: { parse: [] } });
  }
};
