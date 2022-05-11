const Discord = require('discord.js');

module.exports = async (client, interaction, args) => {
    if (!interaction.member.voice.channel) return client.errNormal({
        error: `You're not in a voice channel!`,
        type: 'editreply'
    }, interaction);

    let channel = interaction.member.voice ? interaction.member.voice.channel : null;
    if (!channel) return client.errNormal({
        error: `The channel does not exist!`,
        type: 'editreply'
    }, interaction);

    let player = client.player.players.get(interaction.guild.id);

    if (player && (channel.id !== player?.voiceChannel)) return client.errNormal({
        error: `You are not in the same voice channel!`,
        type: 'editreply'
    }, interaction);

    if (!player) {
        player = client.player.create({
            guild: interaction.guild.id,
            voiceChannel: channel.id,
            textChannel: interaction.channel.id,
            selfDeafen: true
        });

        if (!channel.joinable) return client.errNormal({
            error: `That channel isn\'t joinable`,
            type: 'editreply'
        }, interaction);
        player.connect()

        setTimeout(() => {
            if (channel.type == "GUILD_STAGE_VOICE") {
                interaction.guild.me.voice.setSuppressed(false);
            }
        }, 500)
    }

    player = client.player.players.get(interaction.guild.id);
    if (player.state !== "CONNECTED") player.connect();

    var query = interaction.options.getString('song');

    client.simpleEmbed({
        desc: `🔎┆Searching...`,
        type: 'editreply'
    }, interaction)

    const res = await player.search(query, interaction.user);

    if (res.loadType === 'LOAD_FAILED') {
        if (!player.queue.current) player.destroy();
        return client.errNormal({
            error: `Error getting music. Please try again in a few minutes`,
            type: 'editreply'
        }, interaction);
    }

    switch (res.loadType) {
        case 'NO_MATCHES': {
            if (!player.queue.current) player.destroy()
            await client.errNormal({
                error: `No music was found`,
                type: 'editreply'
            }, interaction);
            break;
        }

        case 'TRACK_LOADED': {
            const track = res.tracks[0];
            await player.queue.add(track);

            if (!player.playing && !player.paused) {
                player.play();
            }
            else {
                client.embed({
                    title: `${client.emotes.normal.music}・${track.title}`,
                    url: track.uri,
                    desc: `The song has been added to the queue!`,
                    thumbnail: track.thumbnail,
                    fields: [
                        {
                            name: `👤┆Requested By`,
                            value: `${track.requester}`,
                            inline: true
                        },
                        {
                            name: `${client.emotes.normal.clock}┆Ends at`,
                            value: `<t:${((Date.now() / 1000) + (track.duration / 1000)).toFixed(0)}:f>`,
                            inline: true
                        },
                        {
                            name: `🎬┆Author`,
                            value: `${track.author}`,
                            inline: true
                        }
                    ],
                    type: 'editreply'
                }, interaction)
            }
            break;
        }

        case 'PLAYLIST_LOADED': {
            await player.queue.add(res.tracks);
            if (!player.playing && !player.paused) player.play()
            else {

            }
            break;
        }

        case 'SEARCH_RESULT': {
            let max = 5, collected, filter = (i) => i.user.id === interaction.user.id;
            if (res.tracks.length < max) max = res.tracks.length;

            let row = new Discord.MessageActionRow()
                .addComponents(
                    new Discord.MessageButton()
                        .setEmoji("1️⃣")
                        .setCustomId("1")
                        .setStyle("SECONDARY"),

                    new Discord.MessageButton()
                        .setEmoji("2️⃣")
                        .setCustomId("2")
                        .setStyle("SECONDARY"),

                    new Discord.MessageButton()
                        .setEmoji("3️⃣")
                        .setCustomId("3")
                        .setStyle("SECONDARY"),

                    new Discord.MessageButton()
                        .setEmoji("4️⃣")
                        .setCustomId("4")
                        .setStyle("SECONDARY"),

                    new Discord.MessageButton()
                        .setEmoji("5️⃣")
                        .setCustomId("5")
                        .setStyle("SECONDARY"),
                );

            let row2 = new Discord.MessageActionRow()
                .addComponents(
                    new Discord.MessageButton()
                        .setEmoji("🛑")
                        .setLabel("Cancel")
                        .setCustomId("cancel")
                        .setStyle("DANGER"),
                );

            const results = res.tracks
                .slice(0, max)
                .map((track, index) => `**[#${++index}]**┆${track.title.length >= 45 ? `${track.title.slice(0, 45)}...` : track.title}`)
                .join('\n');

            client.embed({
                title: `🔍・Search Results`,
                desc: results,
                fields: [
                    {
                        name: `❓┆Cancel search?`,
                        value: `Press \`cancel\` to stop the search`,
                        inline: true
                    }
                ],
                components: [row, row2],
                type: 'editreply'
            }, interaction)

            try {
                i = await interaction.channel.awaitMessageComponent({ filter, max: 1, time: 30e3, componentType: 'BUTTON', errors: ['time'] });
            } catch (e) {
                if (!player.queue.current) player.destroy();
                return client.errNormal({
                    error: `You didn't provide a selection`,
                    type: 'editreply'
                }, interaction)
            }

            const first = i.customId;
            i.message.delete();
            i.deferUpdate();

            if (first.toLowerCase() === 'cancel') {
                if (!player.queue.current) player.destroy();
                return interaction.channel.send('Cancelled selection.');
            }

            const index = Number(first) - 1;
            if (index < 0 || index > max - 1) return client.errNormal({
                error: `The number you provided too small or too big (1-${max})`,
                type: 'editreply'
            }, interaction)

            const track = res.tracks[index];
            player.queue.add(track);

            if (!player.playing && !player.paused) {
                player.play();
            }
            else {
                client.embed({
                    title: `${client.emotes.normal.music}・${track.title}`,
                    url: track.uri,
                    desc: `The song has been added to the queue!`,
                    thumbnail: track.thumbnail,
                    fields: [
                        {
                            name: `👤┆Requested By`,
                            value: `${track.requester}`,
                            inline: true
                        },
                        {
                            name: `${client.emotes.normal.clock}┆Ends at`,
                            value: `<t:${((Date.now() / 1000) + (track.duration / 1000)).toFixed(0)}:f>`,
                            inline: true
                        },
                        {
                            name: `🎬┆Author`,
                            value: `${track.author}`,
                            inline: true
                        }
                    ],
                    type: 'editreply'
                }, interaction)
            }
        }
    }
}

 