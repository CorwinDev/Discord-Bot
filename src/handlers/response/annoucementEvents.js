const { Client, Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { model: AnnouncementChannels, getActivityEmoji } = require('../../database/models/announcement-channels');
const { ReminderManager, createManager } = require('../functions/eventReminders');
const { generateCalendarLinks } = require('../../assets/utils/calendar');
const Discord = require('discord.js');

module.exports = async (client) => {
    // Créer une instance du ReminderManager
    const reminderManager = createManager();
    
    client.on(Events.GuildScheduledEventCreate, async (event) => {
        if(event.entityMetadata && event.entityMetadata.location) {
            try {
                const data = await AnnouncementChannels.findOne({ Guild: event.guildId });

                console.log(`Guild ID: ${event.guildId}`);
                //console.log(`Database query result: ${JSON.stringify(data)}`);

                if (!data) {
                    console.log(`No announcement channel found in database for guild ${event.guildId}`);
                    return;
                }

                if (!data.Channel) {
                    console.log(`No channel set in the database entry for guild ${event.guildId}`);
                    return;
                }

                const channel = client.channels.cache.get(data.Channel);
                if (!channel) {
                    console.log(`Announcement channel with ID ${data.Channel} not found in the guild`);
                    return;
                }

                // Validate event URL scheme
                const validURL = event.url.startsWith('http') ? event.url : `https://${event.url}`;

                // Calculate autoArchiveDuration
                const now = new Date();
                const eventDate = new Date(event.scheduledStartTimestamp);
                const durationInMinutes = Math.ceil((eventDate - now) / (1000 * 60)) + 1440;

                // Find the closest valid autoArchiveDuration
                const validDurations = [60, 1440, 4320, 10080];
                let autoArchiveDuration = validDurations[0];
                for (let duration of validDurations) {
                    if (durationInMinutes <= duration) {
                        autoArchiveDuration = duration;
                        break;
                    }
                    autoArchiveDuration = duration;
                }

                // Send a formatted message to the announcement channel
                let message;
                try {
                    message = await channel.send({
                        content: `<@${event.creatorId}> a créé un nouvel événement [${event.name}](${validURL}) !\n`
                    });
                    message.crosspost()
                    .then(() => console.log('Crossposted message'))
                    .catch(console.error);
                } catch (error) {
                    console.error(`Failed to send message to channel ${data.Channel}: ${error.message}`);
                    return;
                }

                // Create a private thread from the sent message
                try {
                    const eventEmoji = getActivityEmoji(`${event.name} ${event.description}`);
                    const thread = await message.startThread({
                        name: `${eventEmoji}・${event.name}`,
                        autoArchiveDuration: autoArchiveDuration,  // Auto archive thread based on calculated duration
                        type: 'PrivateThread', // Set thread type to private
                        invitable: false,  // Make the thread private
                        reason: `Thread for discussing the event ${event.name}`,
                    });

                    // Add the event creator to the thread
                    await thread.members.add(event.creatorId).catch(() => null);

                    // Create and send the embed if there's a description
                    let followupMessageId = null;
                    //if (event.description) {
                        const embed = new EmbedBuilder()
                            .setTitle("\`📌\`  Informations importantes")
                            .setDescription(event.description || "Pas de description fournie pour le moment")
                            .setColor(0x0099FF)
                            .setTimestamp(new Date(event.scheduledStartTimestamp))
                            .setFooter({
                                text: event.creator.globalName,
                                iconURL: event.creator.avatarURL()
                            });
                        
                        const start = event.scheduledStartTimestamp;
                        const end = event.scheduledEndTimestamp || (start + 60 * 60 * 1000);
                        const calendarLinks = generateCalendarLinks({
                            title: event.name,
                            description: event.description,
                            location: event.entityMetadata.location,
                            startDate: new Date(start).toISOString(),
                            endDate: new Date(end).toISOString()
                        });
                        const calendarButton = new Discord.ActionRowBuilder()
                            .addComponents(
                                new Discord.ButtonBuilder()
                                    .setLabel('Ajouter à Google agenda')
                                    .setStyle(Discord.ButtonStyle.Link)
                                    .setURL(calendarLinks.google)
                            ).addComponents(
                                new Discord.ButtonBuilder()
                                .setLabel('Ajouter à Outlook')
                                .setStyle(Discord.ButtonStyle.Link)
                                .setURL(calendarLinks.outlook)
                            )

                        const followupMessage = await thread.send({ embeds: [embed], components: [calendarButton] });
                        followupMessageId = followupMessage.id;
                        // Pin le message de description
                        await followupMessage.pin().catch(error => {
                            console.error('Erreur lors du pin du message:', error);
                        });
                    //}

                    // Initialiser les rappels en fonction de la date de l'événement
                    const initialReminders = reminderManager.initializeReminderState(event.scheduledStartTimestamp);

                    // Save the thread ID and event ID to the database
                    await AnnouncementChannels.updateOne(
                        { Guild: event.guildId },
                        { 
                            $push: { 
                                EventThreads: { 
                                    eventName: event.name, 
                                    eventId: event.id, 
                                    threadId: thread.id,
                                    followupMessageId: followupMessageId,
                                    scheduledStartTimestamp: event.scheduledStartTimestamp,
                                    sentReminders: initialReminders
                                } 
                            } 
                        }
                    );

                    // Préparer le texte des rappels en fonction de leur état
                    let reminderText = '';
                    const hasAvailableReminders = !initialReminders.day || !initialReminders.week || !initialReminders.month
                    if (hasAvailableReminders) {
                        const remindersStatus = [
                            { time: '1 mois', active: !initialReminders.month },
                            { time: '1 semaine', active: !initialReminders.week },
                            { time: '1 jour', active: !initialReminders.day }
                        ];

                        const activeReminders = remindersStatus.filter(r => r.active);
                        
                        if (activeReminders.length > 0) {
                            reminderText = 'Les rappels suivants seront envoyés :\n' + 
                                activeReminders.map(r => `• ${r.time} avant`).join('\n');
                        } else {
                            reminderText = 'Tous les rappels ont déjà été envoyés ou sont désactivés.';
                        }
                    } else {
                        reminderText = 'Les rappels ne sont pas disponibles car l\'événement est trop proche.';
                    }

                    const welcomeEmbed = new Discord.EmbedBuilder()
                        .setColor(0x0099FF)
                        .setTitle('🎉 Hey !')
                        .setDescription(`Bienvenue dans le fil de discussion de ton événement **${event.name}** !`)
                        .addFields(
                            { 
                                name: '📝 Inviter des participants', 
                                value: 'N\'oubliez pas de mentionner les personnes que tu souhaites inviter dans ce fil de discussion.' 
                            },
                            { 
                                name: '📌 Description en épinglés', 
                                value: 'Modifie à tout moment la description pour garder les informations clés en épinglés' 
                            },
                            { 
                                name: '👁️‍🗨️ Créer des sondages', 
                                value: 'Tu peux également créer des sondages et vérifier la liste des participants (\`/event participants\`)'
                            },
                            { 
                                name: '⏰ Rappels automatiques', 
                                value: reminderText
                            }
                        )

                    const welcomeMessage = await thread.send({
                        content: `<@${event.creatorId}>, ce message se supprimera <t:${Math.floor((Date.now() + 60000) / 1000)}:R> <a:eliottSlide:974441004771967006>`,
                        embeds: [welcomeEmbed],
                        allowedMentions: { parse: [] }
                    });

                    // Supprimer complètement le message après 30 secondes
                    setTimeout(() => {
                        welcomeMessage.delete().catch(() => {
                            console.log(`Failed to delete welcome message in thread ${thread.id}`);
                        });
                    }, 60000);

                    console.log(`Private thread created for event ${event.name} in guild ${event.guildId}`);
                } catch (error) {
                    console.error(`Failed to create private thread for event ${event.name}: ${error.message}`);
                }

            } catch (error) {
                console.error(`Error handling GuildScheduledEventCreate event: ${error.message}`);
            }
        }
    }).setMaxListeners(0);

    client.on(Events.GuildScheduledEventUpdate, async (oldEvent, newEvent) => {
        if((newEvent.entityMetadata && newEvent.entityMetadata.location) || (oldEvent.entityMetadata && oldEvent.entityMetadata.location)) {
            try {
                // Récupérer les données de la base
                const data = await AnnouncementChannels.findOne({ Guild: newEvent.guildId });
                if (!data || !data.EventThreads) return;

                // Trouver l'événement correspondant
                const eventThread = data.EventThreads.find(e => e.eventId === newEvent.id);
                if (!eventThread || !eventThread.followupMessageId) return;

                // Récupérer le thread et le message
                const thread = await client.channels.fetch(eventThread.threadId).catch(() => null);
                if (!thread) {
                    console.log(`Thread ${eventThread.threadId} not found for event ${newEvent.name}`);
                    return;
                }

                try {
                    const followupMessage = await thread.messages.fetch(eventThread.followupMessageId);
                    if (!followupMessage) {
                        console.log(`Description message ${eventThread.followupMessageId} not found in thread ${eventThread.threadId}`);
                        return;
                    }

                    // Créer le nouvel embed
                    const embed = new EmbedBuilder()
                        .setTitle("\`📌\`  Informations importantes")
                        .setDescription(newEvent.description || "Pas de description fournie")
                        .setColor(0x0099FF)
                        .setTimestamp(new Date(newEvent.scheduledStartTimestamp))
                        .setFooter({
                            text: newEvent.creator.globalName,
                            iconURL: newEvent.creator.avatarURL()
                        });

                    // Générer les liens de calendrier
                    const start = newEvent.scheduledStartTimestamp;
                    const end = newEvent.scheduledEndTimestamp || (start + 60 * 60 * 1000);
                    const calendarLinks = generateCalendarLinks({
                        title: newEvent.name,
                        description: newEvent.description,
                        startDate: new Date(start).toISOString(),
                        endDate: new Date(end).toISOString()
                        });

                    const calendarButton = new Discord.ActionRowBuilder()
                        .addComponents(
                            new Discord.ButtonBuilder()
                                .setLabel('Ajouter à Google agenda')
                                .setStyle(Discord.ButtonStyle.Link)
                                .setURL(calendarLinks.google)
                        ).addComponents(
                            new Discord.ButtonBuilder()
                            .setLabel('Ajouter à Outlook')
                            .setStyle(Discord.ButtonStyle.Link)
                            .setURL(calendarLinks.outlook)
                        );

                    // Mettre à jour le message
                    await followupMessage.edit({ embeds: [embed], components: [calendarButton] });
                    // S'assurer que le message est toujours pin
                    if (!followupMessage.pinned) {
                        await followupMessage.pin().catch(error => {
                            console.error('Erreur lors du pin du message:', error);
                        });
                    }

                    // Mettre à jour le nom du thread si nécessaire
                    if (oldEvent.name !== newEvent.name) {
                        const eventEmoji = getActivityEmoji(`${newEvent.name} ${newEvent.description}`);
                        await thread.setName(`${eventEmoji}・${newEvent.name}`);
                    }

                    // Préparer les mises à jour de la base de données
                    const updates = {
                        'EventThreads.$.eventName': newEvent.name
                    };

                    // Si la date a changé, mettre à jour le timestamp et réinitialiser les rappels
                    if (oldEvent.scheduledStartTimestamp !== newEvent.scheduledStartTimestamp) {
                        const reminderManager = createManager();
                        const updatedReminders = reminderManager.initializeReminderState(newEvent.scheduledStartTimestamp);
                        
                        updates['EventThreads.$.scheduledStartTimestamp'] = newEvent.scheduledStartTimestamp;
                        updates['EventThreads.$.sentReminders'] = updatedReminders;

                        // Envoyer un message dans le thread pour informer du changement de date
                        const embed = new EmbedBuilder()
                                        .setColor(0xf03a17)
                                        .setTitle(` `)
                                        .setDescription(`\`⏰\`  La date de l'événement a été modifiée à <t:${Math.floor(newEvent.scheduledStartTimestamp/1000)}:F> !`)
                        await thread.send({ embeds: [embed] });
                    }

                    // Mettre à jour la base de données
                    await AnnouncementChannels.updateOne(
                        { 
                            Guild: newEvent.guildId,
                            'EventThreads.eventId': newEvent.id,
                            'EventThreads.eventName': newEvent.name
                        },
                        { $set: updates }
                    );

                } catch (error) {
                    console.error(`Error updating description message for event ${newEvent.name}:`, error);
                }
            } catch (error) {
                console.error('Error handling GuildScheduledEventUpdate event:', error);
            }
        }
    });

    client.on(Events.GuildScheduledEventUserAdd, async (event, user) => {
        if(event.entityMetadata && event.entityMetadata.location) {
            try {
                // Fetch the event details from the database
                const data = await AnnouncementChannels.findOne({ Guild: event.guildId });

                if (!data || !data.EventThreads) return;

                // Find the corresponding thread for the event
                const eventThread = data.EventThreads.find(e => e.eventId === event.id);

                if (eventThread) {
                    const thread = client.channels.cache.get(eventThread.threadId);
                    if (thread && user.id != event.creatorId) {
                        // Tag the user in the thread
                        // Add the event creator to the thread
                        await thread.members.add(user.id).catch(() => null);
                        //const interestedMessage = await thread.send(`Hey <@${user.id}>, tu es interessé. Voilà le thread associé à cet événement !`);
                        //setTimeout(() => interestedMessage.delete().catch(() => null), 20000); // Delete the message after 20 seconds
                        //console.log(`${user.username} was tagged in thread for event ${event.name}`);
                    }
                } else {
                    console.log(`No thread found for event ${event.name}`);
                }
            } catch (error) {
                console.error(`Error handling GuildScheduledEventUserAdd event: ${error.message}`);
            }
        }
    });

    async function clearOldEventReferences(client) {
        try {
            const guilds = await AnnouncementChannels.find();
            const ONE_MONTH = 30 * 24 * 60 * 60 * 1000; // 30 jours en millisecondes
            
            for (const guild of guilds) {
                if (!Array.isArray(guild.EventThreads)) {
                    guild.EventThreads = [];
                    await guild.save();
                    continue;
                }
    
                let hasChanges = false;
                const updatedEvents = [];

                // Récupérer l'objet guild Discord une seule fois
                const discordGuild = await client.guilds.fetch(guild.Guild).catch(error => {
                    if (error.code === 50001) { // Missing Access
                        console.log(`Bot lacks access to guild ${guild.Guild}, skipping cleanup`);
                        return null;
                    }
                    console.error(`Error fetching guild ${guild.Guild}:`, error);
                    return null;
                });

                if (!discordGuild) {
                    // Si on ne peut pas accéder à la guilde, on garde toutes les références
                    continue;
                }

                for (const event of guild.EventThreads) {
                    try {
                        const now = Date.now();
                        const timeSinceEvent = now - event.scheduledStartTimestamp;

                        // Si l'événement n'est pas passé depuis plus d'un mois, on le garde
                        if (timeSinceEvent < ONE_MONTH) {
                            updatedEvents.push(event);
                            continue;
                        }

                        // Vérifier si l'événement existe toujours dans Discord
                        const scheduledEvent = await discordGuild.scheduledEvents.fetch(event.eventId)
                            .catch(error => {
                                if (error.code === 10008) { // Unknown Event
                                    console.log(`Event ${event.eventId} no longer exists in guild ${guild.Guild}`);
                                    hasChanges = true;
                                    return null;
                                }
                                // Pour les autres erreurs, on garde l'événement par précaution
                                console.error(`Error fetching event ${event.eventId}:`, error);
                                return 'ERROR';
                            });

                        // Si l'événement existe encore dans Discord, on le garde malgré son ancienneté
                        if (scheduledEvent !== null) {
                            updatedEvents.push(event);
                            continue;
                        }

                        // Vérifier si le thread existe et appartient au bon serveur
                        const thread = await client.channels.fetch(event.threadId)
                            .catch(error => {
                                if (error.code === 10003) { // Unknown Channel
                                    console.log(`[EventCleaner] Thread ${event.threadId} no longer exists - Removing from database`);
                                    hasChanges = true;
                                    return null;
                                }
                                if (error.code === 50001) { // Missing Access
                                    return 'NO_ACCESS';
                                }
                                console.error(`[EventCleaner] Unexpected error fetching thread ${event.threadId}:`, error);
                                return 'ERROR';
                            });

                        // Si le thread existe encore ou qu'on n'y a pas accès, on garde l'événement
                        if (thread === 'NO_ACCESS' || thread === 'ERROR' || thread !== null) {
                            updatedEvents.push(event);
                        }
                        // Sinon l'événement est supprimé (en ne l'ajoutant pas à updatedEvents)

                    } catch (error) {
                        console.error(`Unexpected error processing event ${event.eventId}:`, error);
                        // En cas d'erreur inattendue, on garde l'événement par précaution
                        updatedEvents.push(event);
                    }
                }

                if (hasChanges || updatedEvents.length !== guild.EventThreads.length) {
                    try {
                guild.EventThreads = updatedEvents;
                await guild.save();
                        console.log(`Updated event references for guild ${guild.Guild} - Removed ${guild.EventThreads.length - updatedEvents.length} old events`);
                    } catch (error) {
                        console.error(`Failed to update database for guild ${guild.Guild}:`, error);
                    }
                }
            }
        } catch (error) {
            console.error('Error clearing old event references:', error);
        }
    }
    

}