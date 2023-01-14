const Discord = require('discord.js');
const ms = require('ms');

module.exports = async (client, interaction, args) => {
    const messageID = interaction.options.getString('message');

    client.giveawaysManager.reroll(messageID).then(() => {
        client.succNormal({ 
            text: `Giveaway gererolled`, 
            type: 'editreply' 
        }, interaction);
    }).catch((err) => {
        client.errNormal({ 
            error: `I can't find the giveaway for ${messageID}!`, 
            type: 'editreply' 
        }, interaction)
    });
}

 