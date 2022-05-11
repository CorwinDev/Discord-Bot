const Discord = require('discord.js');

module.exports = (client, giveaway, member, reaction) => {
    client.succNormal({
        text: `Your entry into [this giveaway](https://discordapp.com/channels/${giveaway.message.guildId}/${giveaway.message.channelId}/${giveaway.message.id}) has been approved.`
    }, member).catch(() => { });
};