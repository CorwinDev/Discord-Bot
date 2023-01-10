const Discord = require('discord.js');

module.exports = async (client, interaction, args) => {
    const player = client.player.players.get(interaction.guild.id);
    
    const channel = interaction.member.voice.channel;
    if (!channel) return client.errNormal({
        error: `Tu n'es pas dans un canal vocal !`,
        type: 'editreply'
    }, interaction);

    if (player && (channel.id !== player?.voiceChannel)) return client.errNormal({
        error: `Tu n'es pas dans le même canal vocal que moi !`,
        type: 'editreply'
    }, interaction);

    if (!player || !player.queue.current) return client.errNormal({
        error: "Il n'y a pas de musiques jouées dans ce serveur",
        type: 'editreply'
    }, interaction);

    let number = interaction.options.getNumber('number');

    if (number > player.queue.size) return client.errNormal({
        error: `Cette file n'a pas tant que ça comme musiques`,
        type: 'editreply'
    }, interaction);

    const targetSong = player.queue[parseInt(number - 1)]
    player.queue.remove((parseInt(number)) - 1)

    client.succNormal({ 
        text: `**${name}** retirée de la file`,
        type: 'editreply'
    }, interaction);
}

 
