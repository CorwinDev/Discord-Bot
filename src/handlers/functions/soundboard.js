const Discord = require('discord.js');
const { AudioPlayerStatus, createAudioResource, createAudioPlayer, NoSubscriberBehavior, joinVoiceChannel, StreamType, VoiceConnectionStatus } = require('@discordjs/voice');

var servers = {}

module.exports = (client) => {

    client.soundboard = async function (guild, interaction, url) {
        if (!servers[guild]) servers[guild] = {
            queue: []
        }

        var server = servers[guild];

        server.queue.push(url);

        const player = createAudioPlayer();

        const channel = interaction.member.voice.channel;
        const connection = await client.connectToChannel(channel);
        connection.subscribe(player);

        setTimeout(() => {
            if (channel.type == Discord.ChannelType.GuildStageVoice) {
                interaction.guild.members.me.voice.setSuppressed(false);
            }
        }, 500)

        client.play(connection, interaction, guild, player);
    }

    client.play = async function (connection, interaction, guild, player) {
        var server = servers[guild];

        const resource = createAudioResource(server.queue[0], { inputType: StreamType.Arbitrary });
        player.play(resource);

        server.queue.shift();

        player.on(AudioPlayerStatus.Idle, () => {
            if (server.queue[0]) {
                client.play(connection, interaction, guild, player);
            }
            else {
                connection.destroy();
            }
        });
    }
}