const Discord = require('discord.js');

module.exports = async (client, interaction, args) => {
    client.embed({
        title: `📘・Owner information`,
        desc: `____________________________`,
        thumbnail: client.user.avatarURL({ dynamic: true, size: 1024 }),
        fields: [{
            name: "👑┆Owner name",
            value: `Byte Noir`,
            inline: true,
        },
        {
            name: "🏷┆Discord tag",
            value: `</Bytenoir>#0000`,
            inline: true,
        },
        {
            name: "🏢┆Organization",
            value: `Thor eSports`,
            inline: true,
        },
        {
            name: "🌐┆Discord Server",
            value: `[.gg/thx](https://discord.gg/Mnyg7FbKhh )`,
            inline: true,
        }],
        type: 'editreply'
    }, interaction)
}

 