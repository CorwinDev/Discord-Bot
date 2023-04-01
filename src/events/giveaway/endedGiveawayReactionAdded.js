const Discord = require('discord.js');

module.exports = (client, giveaway, member, reaction) => {
    client.errNormal({
        error: `The giveaway has unfortunately ended! You can't participate anymore`
    }, member).catch(() => { });
};