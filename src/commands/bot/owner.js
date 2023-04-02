const Discord = require('discord.js');

module.exports = async (client, interaction, args) => {
    client.embed({
        title: `📘・Information du propriétaire`,
        desc: `____________________________`,
        thumbnail: client.user.avatarURL({ dynamic: true, size: 1024 }),
        fields: [{
            name: "👑┆Le nom du propriétaire",
            value: `Corwin`,
            inline: true,
        },
        {
            name: "🏷┆Étiquette de discorde",
            value: `</Corwin>#0001`,
            inline: true,
        },
        {
            name: "🏢┆Organisation",
            value: `CoreWare`,
            inline: true,
        },
        {
            name: "🌐┆Website",
            value: `[https://corwindev.nl](https://corwindev.nl)`,
            inline: true,
        }],
        type: 'editreply'
    }, interaction)
}

 