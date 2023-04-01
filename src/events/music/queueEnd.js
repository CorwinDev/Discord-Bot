const Discord = require('discord.js');

module.exports = (client, player, track) => {
    player.destroy(player.guild.id);

    const channel = client.channels.cache.get(player.textChannel);
    client.errNormal({
        error: "Queue is empty, Leaving voice channel"
    }, channel)
};