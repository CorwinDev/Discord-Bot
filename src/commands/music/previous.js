const Discord = require('discord.js');

module.exports = async (client, interaction, args) => {
    const player = client.player.players.get(interaction.guild.id);

    const channel = interaction.member.voice.channel;
    if (!channel) return client.errNormal({
        error: `You're not in a voice channel!`,
        type: 'editreply'
    }, interaction);

    if (player && (channel.id !== player?.voiceChannel)) return client.errNormal({
        error: `You're not in the same voice channel!`,
        type: 'editreply'
    }, interaction);

    if (!player || !player.queue.previous) return client.errNormal({
        error: "There are no songs was played previously",
        type: 'editreply'
    }, interaction);

    const track = player.queue.previous;

    let row = new Discord.MessageActionRow()
        .addComponents(
            new Discord.MessageButton()
                .setEmoji("⏮️")
                .setCustomId("Bot-musicprev")
                .setStyle("PRIMARY"),

            new Discord.MessageButton()
                .setEmoji("⏸️")
                .setCustomId("Bot-musicpause")
                .setStyle("PRIMARY"),

            new Discord.MessageButton()
                .setEmoji("⏹️")
                .setCustomId("Bot-musicstop")
                .setStyle("PRIMARY"),

            new Discord.MessageButton()
                .setEmoji("⏭️")
                .setCustomId("Bot-musicnext")
                .setStyle("PRIMARY"),
        );

    client.embed({
        title: `${client.emotes.normal.music}・${track.title}`,
        url: track.uri,
        desc: `Music started in <#${player.voiceChannel}>!`,
        thumbnail: track.thumbnail,
        fields: [
            {
                name: `👤┆Requested By`,
                value: `${track.requester}`,
                inline: true
            },
            {
                name: `${client.emotes.normal.clock}┆Ends at`,
                value: `<t:${((Date.now() / 1000) + (track.duration / 1000)).toFixed(0)}:f>`,
                inline: true
            },
            {
                name: `🎬┆Author`,
                value: `${track.author}`,
                inline: true
            }
        ],
        components: [row],
        type: 'editreply'
    }, interaction)

    player.play(player.queue.previous)
}

 