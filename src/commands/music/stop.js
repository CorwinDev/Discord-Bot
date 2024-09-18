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

    player.destroy()

    client.succNormal({ 
        text: `Arrêté la musique!`, 
        type: 'editreply'
    }, interaction);
}

 