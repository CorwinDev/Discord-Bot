const Discord = require('discord.js');
const lyricsFinder = require("lyrics-finder");

module.exports = async (client, interaction, args) => {
    let search = "";

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

        if (!interaction.options.getString('song')) {
            search = player.queue.current.title;
        }
        else {
            search = interaction.options.getString('song');
        }

        let lyrics = "";

        try {
            lyrics = await lyricsFinder(search, "");
            if (!lyrics) lyrics = `Aucune paroles trouvées pour ${search} :x:`;
        } catch (error) {
            lyrics = `Aucune paroles trouvées pour ${search} :x:`;
        }

        client.embed({
            title: `${client.emotes.normal.music}・Paroles pour ${search}`,
            desc: lyrics,
            type: 'editreply'
        }, interaction)
}

 