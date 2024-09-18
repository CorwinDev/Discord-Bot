const Discord = require('discord.js');

const Schema = require('../../database/models/afk');

module.exports = async (client, interaction, args) => {
    const rawboard = await Schema.find({ Guild: interaction.guild.id })

    if (rawboard.length < 1) return client.errNormal({ 
        error: "Aucune donnée disponible!",
        type: 'editreply'
    }, interaction);

    const lb = rawboard.map(e => `<@!${e.User}> - **Raison** ${e.Message}`);

    await client.createLeaderboard(`🚫・Utilisateurs AFK - ${interaction.guild.name}`, lb, interaction);
}

 