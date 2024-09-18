const Discord = require('discord.js');

module.exports = async (client, interaction, args) => {
    const player = client.player.players.get(interaction.guild.id);

    const channel = interaction.member.voice.channel;
    if (!channel) return client.errNormal({
        error: `Vous n'êtes pas dans un canal vocal!`,
        type: 'editreply'
    }, interaction);

    if (player && (channel.id !== player?.voiceChannel)) return client.errNormal({
        error: `Vous n'êtes pas dans le même canal vocal!`,
        type: 'editreply'
    }, interaction);

    if (!player || !player.queue.current) return client.errNormal({
        error: "Il n'y a pas de chansons qui jouent dans ce serveur",
        type: 'editreply'
    }, interaction);

    if (player.queue.size <= 1) return client.errNormal({
        error: `Il n'y a qu'une seule chanson dans la file d'attente!`,
        type: 'editreply'
    }, interaction);

    player.queue.clear()

    client.succNormal({
        text: "La file d'attente vient d'être ** supprimée **!",
        type: 'editreply'
    }, interaction);
}

 