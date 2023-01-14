const discord = require('discord.js');

const Schema = require("../../database/models/stats");

module.exports = async (client, emoji, guild) => {
    if (emoji.animated) {
        try {
            let Animated = 0;

            function Emoji(id) {
                return client.emojis.cache.get(id).toString();
            }

            guild.emojis.cache.forEach((emoji) => {
                if (emoji.animated) {
                    Animated++;
                }
            });

            var channelName = await client.getTemplate(guild);
            channelName = channelName.replace(`{emoji}`, "🤡")
            channelName = channelName.replace(`{name}`, `Animated Emojis: ${Animated || '0'}`)

            const data = await Schema.findOne({ Guild: guild.id });
            const channel = guild.channels.cache.get(data.AnimatedEmojis)
            await channel.setName(channelName)
        }
        catch { }
    }
};