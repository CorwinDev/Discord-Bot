const discord = require('discord.js');

const Schema = require("../../database/models/stats");

module.exports = async (client, channel) => {
    try {
        var channelName = await client.getTemplate(channel.guild);
        channelName = channelName.replace(`{emoji}`, "🔧")
        channelName = channelName.replace(`{name}`, `Channels: ${channel.guild.channels.cache.size.toLocaleString()}`)

        const data = await Schema.findOne({ Guild: channel.guild.id });
        const changeChannel = channel.guild.channels.cache.get(data.Channels)
        await changeChannel.setName(channelName)
    }
    catch { }
};