const Discord = require('discord.js');

module.exports = async (client, interaction, args) => {
    let row = new Discord.MessageActionRow()
        .addComponents(
            new Discord.MessageButton()
                .setLabel("Donatebot")
                .setURL("https://donatebot.io/checkout/735868402194710530")
                .setStyle("LINK"),
        );

    client.embed({
        title: `${client.user.username}・Donate`,
        desc: '_____ \n\nClick the button below for the donation page \n**Pay attention! Donating is not required**',
        thumbnail: client.user.avatarURL({ dynamic: true }),
        url: "https://donatebot.io/checkout/735868402194710530",
        components: [row],
        type: 'editreply'
    }, interaction)
}

 