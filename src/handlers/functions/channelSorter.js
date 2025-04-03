const Schema = require("../../database/models/channelActivity");
const Discord = require('discord.js');

// Map pour stocker les verrous par catégorie
const locks = new Map();

module.exports = (client) => {
    async function sortChannels(client, guildId, categoryId) {
        // Vérifier si un tri est déjà en cours pour cette catégorie
        const lockKey = `${guildId}-${categoryId}`;
        if (locks.get(lockKey)) {
            console.log(`Tri déjà en cours pour la catégorie ${categoryId}`);
            return;
        }

        try {
            // Poser le verrou
            locks.set(lockKey, true);

            const guild = await client.guilds.fetch(guildId);
            if (!guild) return;

            const category = await guild.channels.fetch(categoryId);
            if (!category) return;

            // Vérifier les permissions du bot
            const botMember = await guild.members.fetch(client.user.id);
            const requiredPermissions = [
                Discord.PermissionsBitField.Flags.ManageChannels,
                Discord.PermissionsBitField.Flags.ViewChannel
            ];

            const missingPermissions = category.permissionsFor(botMember).missing(requiredPermissions);
            if (missingPermissions.length > 0) {
                console.log(`Permissions manquantes dans la catégorie ${category.name} (${categoryId}): ${missingPermissions.join(', ')}`);
                // Désactiver le tri pour cette catégorie
                await Schema.findOneAndUpdate(
                    { Guild: guildId, Category: categoryId },
                    { IsActive: false }
                );
                return;
            }

            // Récupérer tous les salons textuels de la catégorie
            const textChannels = category.children.cache.filter(
                channel => channel.type === Discord.ChannelType.GuildText
            );

            // Vérifier les permissions pour chaque salon
            const channelsWithPermissions = textChannels.filter(channel => 
                channel.permissionsFor(botMember).has([
                    Discord.PermissionsBitField.Flags.ManageChannels,
                    Discord.PermissionsBitField.Flags.ViewChannel
                ])
            );

            // Trier les salons par dernier message avec plus de précision
            const sortedChannels = await Promise.all(
                [...channelsWithPermissions.values()].map(async channel => {
                    try {
                        const messages = await channel.messages.fetch({ limit: 1 });
                        const lastMessage = messages.first();
                        return {
                            channel: channel,
                            lastMessageTime: lastMessage ? lastMessage.createdTimestamp : 0,
                            lastMessageId: lastMessage ? lastMessage.id : '0'
                        };
                    } catch (error) {
                        console.error(`Erreur lors de la récupération des messages pour ${channel.name}:`, error);
                        return {
                            channel: channel,
                            lastMessageTime: 0,
                            lastMessageId: '0'
                        };
                    }
                })
            );

            // Trier par timestamp décroissant et utiliser l'ID comme second critère
            sortedChannels.sort((a, b) => {
                if (b.lastMessageTime === a.lastMessageTime) {
                    return b.lastMessageId.localeCompare(a.lastMessageId);
                }
                return b.lastMessageTime - a.lastMessageTime;
            });

            // Réorganiser les positions des salons de manière séquentielle
            for (let i = 0; i < sortedChannels.length; i++) {
                const channel = sortedChannels[i].channel;
                if (channel.position !== i) {
                    try {
                        await channel.setPosition(i);
                        // Petit délai entre chaque modification pour éviter les conflits
                        await new Promise(resolve => setTimeout(resolve, 100));
                    } catch (error) {
                        console.error(`Erreur lors du changement de position pour ${channel.name}:`, error);
                    }
                }
            }

            // Mettre à jour le timestamp de dernière vérification
            await Schema.findOneAndUpdate(
                { Guild: guildId, Category: categoryId },
                { LastCheck: new Date() }
            );

        } catch (error) {
            console.error(`Erreur lors du tri des salons pour la catégorie ${categoryId}:`, error);
        } finally {
            // Libérer le verrou
            locks.delete(lockKey);
        }
    }

    return {
        sortChannels
    };
};