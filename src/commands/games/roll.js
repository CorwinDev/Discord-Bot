const Discord = require('discord.js');

module.exports = async (client, interaction, args) => {
    var result = Math.ceil(Math.random() * 6);

    client.embed({
        title: `🎲・Roll`,
        desc: `You rolled ${result}`,
        type: 'editreply'
    }, interaction);
}

 