const { Client, Events } = require('discord.js');
const announcementChannels = require('../../database/models/announcement-channels');

module.exports = async (client) => {
    client.on(Events.GuildScheduledEventCreate, async (event) => {
        try {
            // Clear old event references
            await clearOldEventReferences(client);

            const data = await announcementChannels.findOne({ Guild: event.guildId });

            console.log(`Guild ID: ${event.guildId}`);
            console.log(`Database query result: ${JSON.stringify(data)}`);

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
            const durationInMinutes = Math.ceil((eventDate - now) / (1000 * 60)) + 1440; // Event date + 1 day in minutes

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
            } catch (error) {
                console.error(`Failed to send message to channel ${data.Channel}: ${error.message}`);
                return;
            }

            // Create a private thread from the sent message
            try {
                const thread = await message.startThread({
                    name: `Event - ${event.name}`,
                    autoArchiveDuration: autoArchiveDuration,  // Auto archive thread based on calculated duration
                    type: 'PrivateThread', // Set thread type to private
                    invitable: false,  // Make the thread private
                    reason: `Thread for discussing the event ${event.name}`,
                });

                // Add the event creator to the thread
                await thread.members.add(event.creatorId).catch(() => null);

                // Send the event description in the thread if it exists
                if (event.description) {
                    await thread.send(`${event.description}`);
                }

                // Send a reminder message in the thread
                const reminderMessage = await thread.send(`<@${event.creatorId}>, n'oublie pas de tagguer les rôles ou les personnes que tu veux pour les inviter dans ce thread !`);
                setTimeout(() => reminderMessage.delete().catch(() => null), 60000); // Delete the message after 1 minute

                //event.setDescription(event.description + "\n\n<#" + thread.id + ">");

                // Save the thread ID and event ID to the database
                await announcementChannels.updateOne(
                    { Guild: event.guildId },
                    { $push: { EventThreads: { eventName: event.name, eventId: event.id, threadId: thread.id } } }
                );

                console.log(`Private thread created for event ${event.name} in guild ${event.guildId}`);
            } catch (error) {
                console.error(`Failed to create private thread for event ${event.name}: ${error.message}`);
            }

        } catch (error) {
            console.error(`Error handling GuildScheduledEventCreate event: ${error.message}`);
        }
    }).setMaxListeners(0);

    /*
    client.on(Events.GuildScheduledEventDelete, async (event) => {
        try {
            // Clear old event references
            await clearOldEventReferences(client);

            const data = await announcementChannels.findOne({ Guild: event.guildId });

            if (!data || !data.Events) return;

            const eventThread = data.Events.find(e => e.eventId === event.id);

            if (eventThread) {
                const thread = client.channels.cache.get(eventThread.threadId);
                if (thread) {
                    await thread.delete(`Event ${event.name} was canceled`);
                    console.log(`Thread for event ${event.name} deleted as the event was canceled.`);
                }

                await announcementChannels.updateOne(
                    { Guild: event.guildId },
                    { $pull: { Events: { eventId: event.id } } }
                );
            }
        } catch (error) {
            console.error(`Error handling GuildScheduledEventDelete event: ${error.message}`);
        }
    });
    */
    client.on(Events.GuildScheduledEventUserAdd, async (event, user) => {
        try {
            // Clear old event references
            await clearOldEventReferences(client);

            // Fetch the event details from the database
            const data = await announcementChannels.findOne({ Guild: event.guildId });
    
            if (!data || !data.EventThreads) return;
    
            // Find the corresponding thread for the event
            const eventThread = data.EventThreads.find(e => e.eventId === event.id);
    
            if (eventThread) {
                const thread = client.channels.cache.get(eventThread.threadId);
                if (thread && user.id != event.creatorId) {
                    // Tag the user in the thread
                    const interestedMessage = await thread.send(`Hey <@${user.id}>, tu es interessé. Voilà le thread associé à cet événement !`);
                    setTimeout(() => interestedMessage.delete().catch(() => null), 20000); // Delete the message after 20 seconds
                    console.log(`${user.username} was tagged in thread for event ${event.name}`);
                }
            } else {
                console.log(`No thread found for event ${event.name}`);
            }
        } catch (error) {
            console.error(`Error handling GuildScheduledEventUserAdd event: ${error.message}`);
        }
    });

    async function clearOldEventReferences(client) {
        try {
            const guilds = await announcementChannels.find();
            for (const guild of guilds) {
                // Ensure guild.EventThreads is an array
                if (!Array.isArray(guild.EventThreads)) {
                    guild.EventThreads = [];
                }
    
                const updatedEvents = [];
                for (const event of guild.EventThreads) {
                    try {
                        // Attempt to fetch the event
                        await client.guilds.cache.get(guild.Guild).scheduledEvents.fetch(event.eventId);
                        updatedEvents.push(event); // Event still exists, keep it
                    } catch (error) {
                        console.log(`Event ${event.eventId} no longer exists, removing reference.`);
                    }
                }
                guild.EventThreads = updatedEvents;
                await guild.save();
            }
        } catch (error) {
            console.error(`Error clearing old event references: ${error.message}`);
        }
    }
    

}