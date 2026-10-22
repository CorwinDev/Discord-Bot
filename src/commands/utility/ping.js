const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../config/config');

module.exports = {
  cooldown: 3,
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Kiểm tra độ trễ của bot'),

  async execute(interaction) {
    await interaction.reply({ content: '🏓 Đang đo...' });
    const sent = await interaction.fetchReply();
    const latency = sent.createdTimestamp - interaction.createdTimestamp;

    const embed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle('🏓 Pong!')
      .addFields(
        { name: 'Độ trễ tin nhắn', value: `${latency}ms`, inline: true },
        { name: 'Độ trễ API', value: `${Math.round(interaction.client.ws.ping)}ms`, inline: true }
      );

    await interaction.editReply({ content: null, embeds: [embed] });
  }
};
