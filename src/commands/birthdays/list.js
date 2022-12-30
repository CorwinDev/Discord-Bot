const Discord = require('discord.js');

const Schema = require("../../database/models/birthday");

module.exports = async (client, interaction, args) => {
    const rawBirthdayboard = await Schema.find({ Guild: interaction.guild.id })

    if (rawBirthdayboard.length < 1) return client.errNormal({ 
        error: "Pas d'anniversaires trouvés !",
        type: 'editreply' 
    }, interaction);

    const lb = rawBirthdayboard.map(e => `${client.emotes.normal.birthday} | **<@!${e.User}>** - ${e.Birthday} `);

    await client.createLeaderboard(`<:uo_party:1015552073405841458>・Anniversaires - ${interaction.guild.name}`, lb, interaction);
}

 
