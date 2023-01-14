const Discord = require('discord.js');

module.exports = (client, player, track) => {
    let row = new Discord.MessageActionRow()
        .addComponents(
            new Discord.MessageButton()
                .setEmoji(client.emotes.music.previous)
                .setCustomId("Bot-musicprev")
                .setStyle("SECONDARY"),

            new Discord.MessageButton()
                .setEmoji(client.emotes.music.pause)
                .setCustomId("Bot-musicpause")
                .setStyle("SECONDARY"),

            new Discord.MessageButton()
                .setEmoji(client.emotes.music.stop)
                .setCustomId("Bot-musicstop")
                .setStyle("SECONDARY"),

            new Discord.MessageButton()
                .setEmoji(client.emotes.music.next)
                .setCustomId("Bot-musicnext")
                .setStyle("SECONDARY"),
        );

    const channel = client.channels.cache.get(player.textChannel);

    client.embed({
        title: '${client.emotes.normal.music}・${track.title}',
        url: track.uri,
        desc: 'Musique lancée dans <#${player.voiceChannel}>!',
        thumbnail: track.thumbnail,
        fields: [
            {
                name: '👤┆Demandée par',
                value: '${track.requester}',
                inline: true
            },
            {
                name: '${client.emotes.normal.clock}┆Fin',
                value: 'Terminée <t:${((Date.now() / 1000) + (track.duration / 1000)).toFixed(0)}:R>',
                inline: true
            },
            {
                name: '🎬┆Auteur',
                value: '${track.author}',
                inline: true
            }
        ],
        components: [row],
    }, channel)
};
