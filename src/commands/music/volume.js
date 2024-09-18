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

    let amount = interaction.options.getNumber('amount');

    if (!amount) return client.simpleEmbed({
        desc: `${client.emotes.normal.volume}┆Le volume actuel est **${player.volume}%**`,
        type: 'editreply'
    }, interaction);

    if (isNaN(amount) || amount === 'Infinity') return client.errNormal({
        text: `S'il vous plait, entrez un nombre valide!`,
        type: 'editreply'
    }, interaction);

    if (Math.round(parseInt(amount)) < 1 || Math.round(parseInt(amount)) > 1000) return client.errNormal({
        text: "Le volume ne peut pas dépasser 1000%",
        type: 'editreply'
    }, interaction);

    player.setVolume(parseInt(amount))

    client.succNormal({
        text: `Volume réglé sur **${amount}%**`,
        type: 'editreply'
    }, interaction);
}

 