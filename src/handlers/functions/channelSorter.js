const Schema = require("../../database/models/channelActivity");
const Discord = require('discord.js');

module.exports = (client) => {
    async function sortChannels(client, guildId, categoryId) {
        try {
            const guild = await client.guilds.fetch(guildId);
            if (!guild) return;

            const category = await guild.channels.fetch(categoryId);
            if (!category) return;

            // Récupérer tous les salons textuels de la catégorie
            const textChannels = category.children.cache.filter(
                channel => channel.type === Discord.ChannelType.GuildText
            );

            // Trier les salons par dernier message
            const sortedChannels = await Promise.all(
                [...textChannels.values()].map(async channel => {
                    const lastMessage = (await channel.messages.fetch({ limit: 1 })).first();
                    return {
                        channel: channel,
                        lastMessageTime: lastMessage ? lastMessage.createdTimestamp : 0
                    };
                })
            );

            // Trier par timestamp décroissant
            sortedChannels.sort((a, b) => b.lastMessageTime - a.lastMessageTime);

            // Réorganiser les positions des salons
            for (let i = 0; i < sortedChannels.length; i++) {
                await sortedChannels[i].channel.setPosition(i);
            }

            // Mettre à jour le timestamp de dernière vérification
            await Schema.findOneAndUpdate(
                { Guild: guildId, Category: categoryId },
                { LastCheck: new Date() }
            );
        } catch (error) {
            console.error(`Erreur lors du tri des salons pour la catégorie ${categoryId}:`, error);
        }
    }

    return {
        sortChannels
    };
};