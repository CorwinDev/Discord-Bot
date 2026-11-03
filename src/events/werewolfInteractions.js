module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    const isComponent = interaction.isButton() || interaction.isStringSelectMenu();
    if (!isComponent || !interaction.customId.startsWith('werewolf:')) return;

    try {
      await require('../services/werewolf').handleInteraction(interaction, client);
    } catch (error) {
      console.error('Lỗi khi xử lý thành phần Ma Sói:', error);
      const reply = { content: 'Không thể xử lý hành động Ma Sói. Hãy thử lại.', ephemeral: Boolean(interaction.guild) };
      if (interaction.replied || interaction.deferred) await interaction.followUp(reply).catch(() => {});
      else await interaction.reply(reply).catch(() => {});
    }
  }
};