const Discord = require('discord.js');
const Voice = require('@discordjs/voice');

const Schema = require("../../database/models/music");

const player = Voice.createAudioPlayer({
    behaviors: {
        noSubscriber: Voice.NoSubscriberBehavior.Play
    },
});

module.exports = (client) => {

    client.startStream = async function (url) {
        const resource = Voice.createAudioResource(url, {
            inputType: Voice.StreamType.Arbitrary,
        });

        console.log(resource);

        player.play(resource);

        return Voice.entersState(player, Voice.AudioPlayerStatus.Playing, 5e3).catch(() => { });
    }

    client.connectToChannel = async function (channel = Discord.VoiceChannel) {
        const connection = Voice.joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
        });

        setTimeout(() => {
            if (channel.type ==  Discord.ChannelType.GuildStageVoice) {
                channel.guild.members.me.voice.setSuppressed(false);
            }
        }, 500)

        try {
            await Voice.entersState(connection, Voice.VoiceConnectionStatus.Ready, 5e3).catch(() => { });
            return connection;
        } catch (error) {
            connection.destroy();
            client.emit("voiceError", error);
        }
    }

    client.radioStart = async function (channel) {
        try {
            const connection = await client.connectToChannel(channel);
    const resource = 
    Voice.createAudioResource('https://streams.ilovemusic.de/iloveradio8.mp3', {
        inlineVolume: true
    })

    const player2 = Voice.createAudioPlayer();
    console.log(player2);
    connection.subscribe(player2)
    player2.play(resource)
    player2.on('error', error => {
        console.error('Error in audio player:', error);
        client.emit("voiceError", error);
    });
    player2.on(Voice.AudioPlayerStatus.Idle, () => {
        console.log('Audio player is idle, restarting stream...');
        client.startStream(process.env.RADIO || "https://playerservices.streamtheworld.com/api/livestream-redirect/RADIO538");
    });
        }
        catch (error) { console.log("Failed to connect to channel", error) }
    }

    client.radioStop = async function (channel) {
        const connection = Voice.joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
        });

        connection.destroy();
    }

    player.on('stateChange', (oldState, newState) => {
        if (newState.status === Voice.AudioPlayerStatus.Idle) {
            client.startStream(process.env.RADIO || "https://playerservices.streamtheworld.com/api/livestream-redirect/RADIO538")
        }
    });

    player.on('error', error => {
        client.emit("voiceError", error);
        client.startStream(process.env.RADIO || "https://playerservices.streamtheworld.com/api/livestream-redirect/RADIO538");
    });

    client.on(Discord.Events.ClientReady, async () => {
        
        Schema.find().then(async (data) => {
            if (data) {
                for (var i = 0; i < data.length; i++) {
                    try {
                        const channel = await client.channels.fetch(data[i].Channel)
                        
                        if (channel) {
                            client.radioStart(channel);
                        }
                    }
                    catch (error) {
                        console.log("Failed to start radio in channel", data[i].Channel, error);
                    }
                }
            }
        })
        // client.startStream(process.env.RADIO || "https://playerservices.streamtheworld.com/api/livestream-redirect/RADIO538");
    });
}

 