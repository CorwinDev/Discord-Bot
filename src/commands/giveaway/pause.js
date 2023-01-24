const Discord = require('discord.js');
const ms = require('ms');

module.exports = async (client, interaction, args) => {
    const messageID = interaction.options.getString('message');
    const giveaway = client.giveawaysManager.giveaways.find((g) => g.guildId === interaction.guildId && g.messageId === messageID);
    if (!giveaway) return client.errNormal({ error: "This message ID is not from this guild", type: 'editreply' }, interaction)
    client.giveawaysManager.pause(messageID).then(() => {
        client.succNormal({ 
            text: `Giveaway paused!`, 
            type: 'editreply' 
        }, interaction);
    }).catch((err) => {
        client.errNormal({ 
            error: `I can't find the giveaway for ${messageID}!`, 
            type: 'editreply' 
        }, interaction)
    });
}

 