const Discord = require('discord.js');
const { model: AnnouncementChannels } = require('../../database/models/announcement-channels');

module.exports = async (client, interaction, args) => {
    try {
        let eventId = interaction.options.getString('event_id');
        
        // Si pas d'ID fourni, essayer de le trouver à partir du thread
        if (!eventId && interaction.channel.isThread()) {
            const threadData = await AnnouncementChannels.findOne({
                Guild: interaction.guildId,
                'EventThreads.threadId': interaction.channel.id
            });

            const eventThread = threadData?.EventThreads?.find(
                et => et.threadId === interaction.channel.id
            );

            if (eventThread) {
                eventId = eventThread.eventId;
                console.log(`Found event ID ${eventId} from thread ${interaction.channel.id}`);
            } else {
                return client.errNormal({
                    error: '❌ Ce thread n\'est pas associé à un événement. Veuillez fournir l\'ID de l\'événement.',
                    type: 'reply',
                    ephemeral: true
                }, interaction);
            }
        } else if (!eventId) {
            return client.errNormal({
                error: '❌ Veuillez fournir l\'ID de l\'événement ou utiliser cette commande dans le thread de l\'événement.',
                type: 'reply',
                ephemeral: true
            }, interaction);
        }
        
        // Récupérer l'événement avec toutes ses propriétés
        const events = await interaction.guild.scheduledEvents.fetch();
        const event = events.get(eventId);

        if (!event) {
            return client.errNormal({
                error: '❌ Événement non trouvé. Vérifiez l\'ID fourni.',
                type: 'reply',
                ephemeral: true
            }, interaction);
        }

        // Récupérer les détails complets de l'événement
        const fullEvent = await event.fetch();
        console.log('Event details:', {
            id: fullEvent.id,
            name: fullEvent.name,
            creatorId: fullEvent.creatorId,
            creator: fullEvent.creator ? {
                id: fullEvent.creator.id,
                username: fullEvent.creator.username
            } : null
        });

        // Récupérer les participants
        const subscribers = await fullEvent.fetchSubscribers();
        
        // Créer la liste des participants
        const participantsList = [];

        // Ajouter d'abord le créateur avec une couronne
        if (fullEvent.creatorId) {
            try {
                const creator = await interaction.guild.members.fetch(fullEvent.creatorId).catch(() => null);
                if (creator) {
                    participantsList.push(`<@${creator.id}> 👑`);
                } else if (fullEvent.creator) {
                    participantsList.push(`<@${fullEvent.creatorId}> 👑`);
                } else {
                    participantsList.push(`<@${fullEvent.creatorId}> 👑`);
                }
            } catch (error) {
                console.log(`Erreur lors de la récupération du créateur:`, error);
                participantsList.push(`<@${fullEvent.creatorId}> 👑`);
            }
        }

        // Ajouter les autres participants
        for (const [userId, user] of subscribers.entries()) {
            // Ne pas ajouter le créateur deux fois
            if (userId === fullEvent.creatorId) continue;

            try {
                const member = await interaction.guild.members.fetch(userId).catch(() => null);
                if (member) {
                    participantsList.push(`<@${userId}>`);
                } else if (user) {
                    participantsList.push(`<@${userId}>`);
                } else {
                    participantsList.push(`<@${userId}>`);
                }
            } catch (error) {
                console.log(`Erreur lors du traitement de l'utilisateur ${userId}:`, error);
                if (user) {
                    participantsList.push(`<@${userId}>`);
                } else {
                    participantsList.push(`<@${userId}>`);
                }
            }
        }

        // Vérifier s'il y a des participants à afficher
        if (participantsList.length === 0) {
            return client.embed({
                title: `📅 ${fullEvent.name}`,
                desc: 'Aucun participant disponible.',
                type: 'editreply'
            }, interaction);
        }

        // Envoyer la réponse avec un embed
        return client.embed({
            title: `Liste des participants (${participantsList.length})`,
            desc: participantsList.join('\n'),
            type: 'editreply'
        }, interaction);

    } catch (error) {
        console.error('Erreur lors de la récupération des participants:', error);
        return client.errNormal({
            error: '❌ Une erreur est survenue lors de la récupération des participants.',
            type: 'reply',
            ephemeral: true
        }, interaction);
    }
}; 