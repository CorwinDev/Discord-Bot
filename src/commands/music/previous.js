const Discord = require('discord.js');

module.exports = async (client, interaction, args) => {
    const player = client.player.players.get(interaction.guild.id);

    const channel = interaction.member.voice.channel;
    if (!channel) return client.errNormal({
        error: 'Tu n'es pas dans un canal vocal !',
        type: 'editreply'
    }, interaction);

    if (player && (channel.id !== player?.voiceChannel)) return client.errNormal({
        error: 'Tu n'es pas dans le même canal vocal que moi !',
        type: 'editreply'
    }, interaction);

    if (!player || !player.queue.previous) return client.errNormal({
        error: "Il n'y a pas eu de musique jouée précedemment",
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
        title: '${client.emotes.normal.music}・${track.title}',
        url: track.uri,
        desc: 'La musique a été lancée dans <#${player.voiceChannel}>!',
        thumbnail: track.thumbnail,
        fields: [
            {
                name: '👤┆Demandée par',
                value: '${track.requester}',
                inline: true
            },
            {
                name: '${client.emotes.normal.clock}┆Ends at',
                value: '<t:${((Date.now() / 1000) + (track.duration / 1000)).toFixed(0)}:f>',
                inline: true
            },
            {
                name: '🎬┆Auteur',
                value: '${track.author}',
                inline: true
            }
        ],
        components: [row],
        type: 'editreply'
    }, interaction)

    player.play(player.queue.previous)
}

 
