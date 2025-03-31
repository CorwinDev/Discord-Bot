const Discord = require('discord.js');
const Voice = require("../../database/models/voice");
const VoiceChannels = require("../../database/models/voiceChannels");

// Map pour stocker les intervalles par guild
const cleanupIntervals = new Map();

module.exports = async (client, oldState, newState) => {
    try {
        const guildId = oldState?.guild?.id || newState?.guild?.id;
        if (!guildId) return;

        const voiceData = await Voice.findOne({ Guild: guildId });
        if (!voiceData) return;

        // Fonction pour nettoyer les salons vocaux inoccupés dans la catégorie
        const cleanupEmptyChannels = async () => {
            const guild = client.guilds.cache.get(guildId);
            if (!guild) return;

            const category = guild.channels.cache.get(voiceData.Category);
            if (!category) return;

            // Récupère tous les salons vocaux de la catégorie
            const voiceChannels = category.children.cache.filter(channel => 
                channel.type === Discord.ChannelType.GuildVoice && 
                channel.id !== voiceData.Channel // Exclure le salon de création
            );

            for (const [_, channel] of voiceChannels) {
                if (channel.members.size === 0) {
                    try {
                        await channel.delete();
                        await VoiceChannels.deleteOne({ Channel: channel.id });
                        voiceData.ChannelCount = Math.max(0, voiceData.ChannelCount - 1);
                        await voiceData.save();
                    } catch (err) {
                        console.error("[Voice Manager] Error deleting empty channel:", err);
                    }
                }
            }
        };

        // Configurer le nettoyage périodique si pas déjà en place
        if (!cleanupIntervals.has(guildId)) {
            const interval = setInterval(async () => {
                try {
                    await cleanupEmptyChannels();
                } catch (err) {
                    console.error("[Voice Manager] Periodic cleanup error:", err);
                }
            }, 5 * 60 * 1000); // 5 minutes
            
            cleanupIntervals.set(guildId, interval);
        }

        // Si l'utilisateur rejoint le salon "quai" (salon de création)
        if (newState?.channelId === voiceData.Channel) {
            // Nettoyer d'abord les salons vides
            await cleanupEmptyChannels();

            const user = await client.users.fetch(newState.id);
            let channelName;
            
            if (voiceData.Theme === 'aprilfools') {
                const voiceChannelNames = [
                    "⇢᲼🐟 Le poisson",
                    "⇢᲼🐠・Le poisson rouge",
                    "⇢᲼🐡・Le poisson lune",
                    "⇢᲼🦈・Le requin",
                    "⇢᲼🐙・La pieuvre",
                    "⇢᲼🦞・Le homard",
                    "⇢᲼🦐・La crevette",
                    "⇢᲼🦀・Le crabe",
                    "⇢᲼🦑・Le calamar",
                    "⇢᲼🐬・Le dauphin",
                    "⇢᲼🐳・La baleine",
                ];

                // Récupérer tous les noms de canaux existants dans la catégorie
                const category = newState.guild.channels.cache.get(voiceData.Category);
                const existingNames = category.children.cache
                    .filter(ch => ch.type === Discord.ChannelType.GuildVoice && ch.id !== voiceData.Channel)
                    .map(ch => ch.name);

                // Trouver les noms disponibles
                const availableNames = voiceChannelNames.filter(name => !existingNames.includes(name));

                // Si des noms sont encore disponibles, en choisir un au hasard
                // Sinon, utiliser le nom par défaut
                channelName = availableNames.length > 0 
                    ? availableNames[Math.floor(Math.random() * availableNames.length)]
                    : "⇢᲼🐟 Le poisson";
            } else {
                channelName = voiceData.ChannelName
                    .replace('{emoji}', "🔊")
                    .replace('{channel name}', `Voice ${voiceData.ChannelCount + 1}`)
                    .replace('{channel count}', `${voiceData.ChannelCount + 1}`)
                    .replace('{member}', `${user.username}`)
                    .replace('{member tag}', `${user.tag}`);
            }

            try {
                const newChannel = await newState.guild.channels.create({
                    name: channelName,
                    type: Discord.ChannelType.GuildVoice,
                    parent: voiceData.Category,
                    permissionOverwrites: [
                        {
                            id: newState.guild.id,
                            allow: [Discord.PermissionsBitField.Flags.ViewChannel],
                        },
                        {
                            id: user.id,
                            allow: [
                                Discord.PermissionsBitField.Flags.ManageChannels,
                                Discord.PermissionsBitField.Flags.MuteMembers,
                                Discord.PermissionsBitField.Flags.DeafenMembers,
                                Discord.PermissionsBitField.Flags.MoveMembers
                            ]
                        }
                    ]
                });

                await new VoiceChannels({
                    Guild: guildId,
                    Channel: newChannel.id,
                    Owner: user.id,
                    CreatedAt: new Date()
                }).save();

                voiceData.ChannelCount += 1;
                await voiceData.save();

                await newState.setChannel(newChannel.id);
            } catch (err) {
                console.error("[Voice Manager] Error creating new channel:", err);
            }
        }

        // Nettoyer les salons vides quand quelqu'un quitte un salon
        if (oldState?.channelId) {
            await cleanupEmptyChannels();
        }

    } catch (err) {
        console.error("[Voice Manager] General error:", err);
    }
};

// Fonction pour nettoyer les intervalles quand le bot redémarre ou se déconnecte
module.exports.cleanup = () => {
    for (const [guildId, interval] of cleanupIntervals) {
        clearInterval(interval);
        cleanupIntervals.delete(guildId);
    }
};