const Discord = require('discord.js');

module.exports = async (client, interaction, args) => {
    client.embed({
        title: `📻・Informations Radio`,
        desc: `Toutes les infos à propos de la radio de ce serveur`,
        fields: [{
            name: "👤┆Auditeurs du canal",
            value: `${interaction.member.voice.channel.members.size} listeners`,
            inline: true
        },
        {
            name: "📺┆Canal connecté",
            value: `${interaction.member.voice.channel} (${interaction.member.voice.channel.name})`,
            inline: true
        },
        {
            name: "🎶┆Station Radio",
            value: `[Radio 538](https://www.538.nl/)`,
            inline: true
        },
        ],
       type: 'editreply'
    }, interaction)
}

 
