const Discord = require('discord.js');

module.exports = async (client, interaction, args) => {
    const text = interaction.options.getString('text');

    client.succNormal({
        text: `${text.split("").reverse().join("")}`,
        type: 'editreply'
    }, interaction)
}

 