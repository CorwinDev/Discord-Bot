const Discord = require('discord.js');

module.exports = async (client, interaction, args) => {
    client.embed({
        title: `📘・Owner information`,
        desc: `____________________________`,
        thumbnail: client.user.avatarURL({ dynamic: true, size: 1024 }),
        fields: [{
            name: "👑┆Owner name",
            value: `Met`,
            inline: true,
        },
        {
            name: "🏷┆Discord tag",
            value: `</metro_plex>#0000`,
            inline: true,
        },
        {
            name: "🏢┆Organization",
            value: `MetxLemon`,
            inline: true,
        },
        {
            name: "🌐┆Website",
            value: `[https://discord.com/](https://discord.com/)`,
            inline: true,
        }],
        type: 'editreply'
    }, interaction)
}

 