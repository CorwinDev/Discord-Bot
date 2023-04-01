const {
    AudioPlayerStatus,
    createAudioPlayer,
    entersState,
    VoiceConnectionDisconnectReason,
    VoiceConnectionStatus,
    createAudioResource,
    StreamType
} = require('@discordjs/voice');
const { setTimeout } = require('timers');
const { promisify } = require('util');
const ytdl = require('ytdl-core');
const { MessageEmbed } = require('discord.js');
const wait = promisify(setTimeout);

class TriviaPlayer {
    constructor() {
        this.connection = null;
        this.audioPlayer = createAudioPlayer();
        this.score = new Map();
        this.queue = [];
        this.textChannel;
        this.wasTriviaEndCalled = false;
    }

    passConnection(connection) {
        this.connection = connection;
        this.connection.on('stateChange', async (_, newState) => {
            if (newState.status === VoiceConnectionStatus.Disconnected) {
                if (
                    newState.reason === VoiceConnectionDisconnectReason.WebSocketClose &&
                    newState.closeCode === 4014
                ) {
                    try {
                        await entersState(
                            this.connection,
                            VoiceConnectionStatus.Connecting,
                            5000
                        );
                    } catch {
                        this.connection.destroy();
                    }
                } else if (this.connection.rejoinAttemps < 5) {
                    await wait((this.connection.rejoinAttemps + 1) * 5000);
                    this.connection.rejoin();
                } else {
                    this.connection.destroy();
                }
            } else if (newState.status === VoiceConnectionStatus.Destroyed) {
                // when destroying connection (stop-trivia)
                this.stop();
            } else if (
                newState.status === VoiceConnectionStatus.Connecting ||
                newState.status === VoiceConnectionStatus.Signalling
            ) {
                try {
                    await entersState(
                        this.connection,
                        VoiceConnectionStatus.Ready,
                        20000
                    );
                } catch {
                    if (this.connection.state.status !== VoiceConnectionStatus.Destroyed)
                        this.connection.destroy();
                }
            }
        });

        this.audioPlayer.on('stateChange', (oldState, newState) => {
            if (
                newState.status === AudioPlayerStatus.Idle &&
                oldState.status !== AudioPlayerStatus.Idle
            ) {
                this.queue.shift();
                // Finished playing audio
                if (this.queue.length) {
                    // play next song
                    this.process(this.queue);
                } else {
                    const sortedScoreMap = new Map(
                        [...this.score.entries()].sort(function (a, b) {
                            return b[1] - a[1];
                        })
                    );

                    if (this.wasTriviaEndCalled) return;

                    this.textChannel.client.embed({
                        title: `🎶・Music Quiz - Results`,
                        desc: getLeaderBoard(Array.from(sortedScoreMap.entries())),
                        edit: true
                    }, this.textChannel)

                    // leave channel close connection and subscription
                    if (this.connection._state.status !== 'destroyed') {
                        this.connection.destroy();
                        this.textChannel.client.triviaManager.delete(
                            this.textChannel.guildId
                        );
                    }
                }
            } else if (newState.status === AudioPlayerStatus.Playing) {
                // trivia logic
                let songNameFound = false;
                let songSingerFound = false;

                let skipCounter = 0;
                const skippedArray = [];

                const collector = this.textChannel.createMessageCollector({
                    time: 30000
                });

                collector.on('collect', msg => {
                    if (!this.score.has(msg.author.username)) return;
                    let guess = normalizeValue(msg.content);
                    let title = normalizeValue(this.queue[0].title);
                    let singer = normalizeValue(this.queue[0].singer);

                    if (guess === 'skip') {
                        if (skippedArray.includes(msg.author.username)) {
                            return;
                        }
                        skippedArray.push(msg.author.username);
                        skipCounter++;
                        if (skipCounter > this.score.size * 0.6) {
                            return collector.stop();
                        }
                        return;
                    }

                    // if user guessed both singer and song name
                    if (guess.includes(singer) && guess.includes(title)) {
                        if (
                            (songSingerFound && !songNameFound) ||
                            (songNameFound && !songSingerFound)
                        ) {
                            this.score.set(
                                msg.author.username,
                                this.score.get(msg.author.username) + 1
                            );
                            msg.react('☑');
                            return collector.stop();
                        }
                        this.score.set(
                            msg.author.username,
                            this.score.get(msg.author.username) + 2
                        );
                        msg.react('☑');
                        return collector.stop();
                    }
                    // if user guessed only the singer
                    else if (guess.includes(singer)) {
                        if (songSingerFound) return; // already been found
                        songSingerFound = true;
                        if (songNameFound && songSingerFound) {
                            this.score.set(
                                msg.author.username,
                                this.score.get(msg.author.username) + 1
                            );
                            msg.react('☑');
                            return collector.stop();
                        }

                        this.score.set(
                            msg.author.username,
                            this.score.get(msg.author.username) + 1
                        );
                        msg.react('☑');
                    }
                    // if user guessed song name
                    else if (guess.includes(title)) {
                        if (songNameFound) return; // if song name has already been found
                        songNameFound = true;

                        if (songNameFound && songSingerFound) {
                            this.score.set(
                                msg.author.username,
                                this.score.get(msg.author.username) + 1
                            );
                            msg.react('☑');
                            return collector.stop();
                        }
                        this.score.set(
                            msg.author.username,
                            this.score.get(msg.author.username) + 1
                        );
                        msg.react('☑');
                    } else {
                        // wrong answer
                        return msg.react('❌');
                    }
                });

                collector.on('end', () => {
                    /*
                      The reason for this if statement is that we don't want to get an
                      empty embed returned via chat by the bot if end-trivia command was called
                      */
                    if (this.wasTriviaEndCalled) {
                        this.wasTriviaEndCalled = false;
                        return;
                    }

                    this.audioPlayer.stop();

                    const sortedScoreMap = new Map(
                        [...this.score.entries()].sort(function (a, b) {
                            return b[1] - a[1];
                        })
                    );

                    const song = `${capitalize_Words(
                        this.queue[0].singer
                    )}: ${capitalize_Words(this.queue[0].title)}`;

                    this.textChannel.client.embed({
                        title: `🎶・Music Quiz`,
                        desc: `The song was:  ${song} \n\n${getLeaderBoard(Array.from(sortedScoreMap.entries()))}`,
                        edit: true
                    }, this.textChannel)
                    return;
                });
            }
        });

        this.audioPlayer.on('error', error => {
            console.error(error);
        });

        this.connection.subscribe(this.audioPlayer);
    }

    stop() {
        this.queue.length = 0;
        this.audioPlayer.stop(true);
    }

    async process(queue) {
        const song = this.queue[0];
        try {
            const stream = ytdl(song.url, {
                filter: 'audio',
                quality: 'highestaudio',
                highWaterMark: 1 << 25
            });
            const resource = createAudioResource(stream, {
                inputType: StreamType.Arbitrary
            });
            this.audioPlayer.play(resource);
        } catch (err) {
            console.log(err.message)
            if (err.message === 'FFmpeg/avconv not found!') {
                this.textChannel.client.embed({
                    title: `🎶・Music Quiz`,
                    desc: `FFmpg/avconv not found!`,
                    edit: true
                }, this.textChannel)
                return this.stop();
            } else {
                return this.process(queue);
            }
        }
    }
}

var getLeaderBoard = arr => {
    if (!arr) return;
    if (!arr[0]) return;
    let leaderBoard = '';

    leaderBoard = `👑   **${arr[0][0]}:** ${arr[0][1]}  points`;

    if (arr.length > 1) {
        for (let i = 1; i < arr.length; i++) {
            leaderBoard =
                leaderBoard + `\n\n   ${i + 1}: ${arr[i][0]}: ${arr[i][1]}  points`;
        }
    }
    return leaderBoard;
};

var capitalize_Words = str => {
    return str.replace(/\w\S*/g, function (txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
};

var normalizeValue = value =>
    value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // remove diacritics
        .replace(/[^0-9a-zA-Z\s]/g, '') // remove non-alphanumeric characters
        .trim()
        .replace(/\s+/g, ' ')
        .toLowerCase(); // remove duplicate spaces

module.exports = TriviaPlayer;
