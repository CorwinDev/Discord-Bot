const Discord = require('discord.js');

module.exports = async (client, interaction, args) => {
    const player = client.player.players.get(interaction.guild.id);

    const levels = {
        0: 0.0,
        1: 0.50,
        2: 1.0,
        3: 2.0,
    };

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

    let level = interaction.options.getString('level');

    const bands = new Array(3)
        .fill(null)
        .map((_, i) =>
            ({ band: i, gain: levels[level] })
        );

    player.setEQ(...bands);

    client.succNormal({
        text: `Niveau de boost de basse ajusté au niveau ** ${level}**`,
        type: 'editreply'
    }, interaction);
}

 