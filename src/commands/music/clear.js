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

    if (!player || !player.queue.current) return client.errNormal({
        error: "There are no songs playing in this server",
        type: 'editreply'
    }, interaction);

    if (player.queue.size <= 1) return client.errNormal({
        error: `There is only one song in the queue!`,
        type: 'editreply'
    }, interaction);

    player.queue.clear()

    client.succNormal({
        text: "The queue has just been **removed**!",
        type: 'editreply'
    }, interaction);
}

 