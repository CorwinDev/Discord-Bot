const Discord = require('discord.js');

module.exports = async (client, interaction, args) => {
    let row = new Discord.ActionRowBuilder()
        .addComponents(
            new Discord.ButtonBuilder()
                .setLabel("Serveur d'assistance")
                .setURL(client.config.discord.serverInvite)
                .setStyle(Discord.ButtonStyle.Link),
        );

    client.embed({
        title: `❓・Support`,
        desc: `Rendez votre serveur encore meilleur avec le bot!`,
        image: "https://cdn.discordapp.com/attachments/843487478881976381/874694194474668052/Bot_banner_invite.jpg",
        url: client.config.discord.serverInvite,
        components: [row],
        type: 'editreply'
    }, interaction)
}

 