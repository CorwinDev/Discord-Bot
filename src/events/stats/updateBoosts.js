const Discord = require('discord.js');

const Schema = require("../../database/models/stats");

module.exports = async (client, guild) => {
    try {
        var channelName = await client.getTemplate(guild);
        channelName = channelName.replace(`{emoji}`, "💎")
        channelName = channelName.replace(`{name}`, `Boosts: ${guild.premiumSubscriptionCount || '0'}`)

        const data = await Schema.findOne({ Guild: guild.id });
        const channel = guild.channels.cache.get(data.Boost)
        await channel.setName(channelName)
    }
    catch { }
};