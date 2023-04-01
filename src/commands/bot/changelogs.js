const Discord = require('discord.js');

module.exports = async (client, interaction, args) => {
    client.embed({
        title: "📃・Changelogs",
        desc: `_____`,
        thumbnail: client.user.avatarURL({ size: 1024 }),
        fields: [{
            name: "📃┆Changelogs",
                value: '15/3/2023 Updated dependencies',
                inline: false,
            },
        ],
        type: 'editreply'
    }, interaction)
}

 
