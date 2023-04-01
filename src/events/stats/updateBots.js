const Discord = require('discord.js');

const Schema = require("../../database/models/stats");

module.exports = async (client, guild) => {
    try {
        const members = await guild.members.fetch();

        var channelName = await client.getTemplate(guild);
        channelName = channelName.replace(`{emoji}`, "🤖")
        channelName = channelName.replace(`{name}`, `Bots: ${members.filter(member => member.user.bot).size || 0}`)

        const data = await Schema.findOne({ Guild: guild.id });
        const channel = guild.channels.cache.get(data.Bots)
        await channel.setName(channelName)
    }
    catch { }
};