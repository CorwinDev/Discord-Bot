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

    if (player.queue.size <= 1) return client.errNormal({
        error: `Il n'y a plus qu'une musique dans la file !`,
        type: 'editreply'
    }, interaction);

    player.queue.clear()

    client.succNormal({
        text: "La file vient d'être **vidée** !",
        type: 'editreply'
    }, interaction);
}

 
