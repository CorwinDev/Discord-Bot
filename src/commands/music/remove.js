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

    let number = interaction.options.getNumber('number');

    if (number > player.queue.size) return client.errNormal({
        error: `The queue doesn't have that much songs`,
        type: 'editreply'
    }, interaction);

    const targetSong = player.queue[parseInt(number - 1)]
    player.queue.remove((parseInt(number)) - 1)

    client.succNormal({ 
        text: `Removed **${targetSong.title}** from the queue`,
        type: 'editreply'
    }, interaction);
}

 
