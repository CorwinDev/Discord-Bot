const Discord = require('discord.js');

module.exports = async (client, interaction, args) => {
    client.embed({
        title: `📘・Bot Moderator`,
        desc: `____________________________`,
        thumbnail: client.user.avatarURL({ dynamic: true, size: 1024 }),
        fields: [{
            name: "🏢┆Bot Moderator",
            value: `Bruzilla`,
            inline: true,
        },
        {
            name: "🏷┆Discord tag",
            value: `</Bruzilla>#6969`,
            inline: true,
        },
        {
            name: "👑┆King",
            value: `OuKingK`,
            inline: true,
        },
        {
            name: "🌐┆Channel",
            value: `[https://www.youtube.com/@OUKINGKYT](https://www.youtube.com/@OUKINGKYT)`,
            inline: true,
        }],
        type: 'editreply'
    }, interaction)
}

 
