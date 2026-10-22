const { Collection, EmbedBuilder } = require('discord.js');
const config = require('../config/config');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    if (!interaction.isChatInputCommand()) return;
    if (!interaction.inGuild() || !interaction.guild) {
      return interaction.reply({
        content: 'Bot chưa được thêm vào server này. Hãy mời bot vào server với scope `bot` và `applications.commands`, rồi thử lại.',
        ephemeral: true
      });
    }

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    // Cooldown đơn giản theo từng lệnh + user
    const cooldowns = client.cooldowns;
    if (!cooldowns.has(command.data.name)) cooldowns.set(command.data.name, new Collection());

    const now = Date.now();
    const timestamps = cooldowns.get(command.data.name);
    const cooldownAmount = (command.cooldown ?? 3) * 1000;

    if (timestamps.has(interaction.user.id)) {
      const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;
      if (now < expirationTime) {
        const timeLeft = ((expirationTime - now) / 1000).toFixed(1);
        return interaction.reply({
          content: `⏳ Vui lòng chờ ${timeLeft}s nữa trước khi dùng lại \`/${command.data.name}\`.`,
          ephemeral: true
        });
      }
    }
    timestamps.set(interaction.user.id, now);
    setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

    try {
      await command.execute(interaction, client);
    } catch (err) {
      console.error(`❌ Lỗi khi thực thi lệnh ${interaction.commandName}:`, err);
      const errorEmbed = new EmbedBuilder()
        .setColor(config.colors.danger)
        .setDescription('❌ Đã có lỗi xảy ra khi thực thi lệnh này.');

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ embeds: [errorEmbed], ephemeral: true }).catch(() => {});
      } else {
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true }).catch(() => {});
      }
    }
  }
};
