const Discord = require('discord.js');

module.exports = async (client, interaction, args) => {
    let row = new Discord.ActionRowBuilder()
        .addComponents(
            new Discord.ButtonBuilder()
                .setLabel("OukingK")
                .setURL("https://streamlabs.com/oukingkza")
                .setStyle(Discord.ButtonStyle.Link),
        );

    client.embed({
        title: `${client.user.username}・Donate`,
        desc: '_____ \n\nThanks for helping me out \n**Thanks for the donation**',
        thumbnail: client.user.avatarURL({ dynamic: true }),
        url: "https://www.youtube.com/@OUKINGKYT",
        components: [row],
        type: 'editreply'
    }, interaction)
}

 
