const Discord = require('discord.js');

module.exports = async (client, interaction, args) => {
    client.embed({
        title: `📘・Owner information`,
        desc: `____________________________`,
        thumbnail: client.user.avatarURL({ dynamic: true, size: 1024 }),
        fields: [{
            name: "👑┆Owner name",
            value: `Teun Hessels`,
            inline: true,
        },
        {
            name: "🏷┆Discord tag",
            value: `</TeunHessels#7570`,
            inline: true,
        },
        {
            name: "🏢┆Organization",
            value: `Rl-6`,
            inline: true,
        }],
        type: 'editreply'
    }, interaction)
}

 