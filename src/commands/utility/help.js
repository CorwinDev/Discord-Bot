const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../config/config');

module.exports = {
  cooldown: 3,
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Xem danh sách lệnh của bot'),

  async execute(interaction, client) {
    const byFolder = {};
    for (const [, cmd] of client.commands) {
      const group = cmd.group || 'Khác';
      byFolder[group] = byFolder[group] || [];
      byFolder[group].push(`\`/${cmd.data.name}\` — ${cmd.data.description}`);
    }

    const embed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle('📖 Danh sách lệnh')
      .setDescription(`Tổng cộng ${client.commands.size} lệnh khả dụng.`);

    for (const [group, list] of Object.entries(byFolder)) {
      embed.addFields({ name: group, value: list.join('\n') });
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
