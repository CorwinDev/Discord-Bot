const discord = require('discord.js');

module.exports = async (client, oldEvent, newEvent) => {
    const logsChannel = await client.getLogs(newEvent.guildId);
    if (!logsChannel) return;

    client.embed({
        title: `🎡・Event updated`,
        desc: `An event has been updated`,
        fields: [
            {
                name: `> Old Name`,
                value: `- ${oldEvent.name}`
            },
            {
                name: `> New Name`,
                value: `- ${newEvent.name}`
            },
            {
                name: `> Old Description`,
                value: `- ${oldEvent.description || 'None'}`
            },
            {
                name: `> New Description`,
                value: `- ${newEvent.description || 'None'}`
            },
            {
                name: `> Old Time`,
                value: `- <t:${(oldEvent.scheduledStartTimestamp / 1000).toFixed(0)}>`
            },
            {
                name: `> New Time`,
                value: `- <t:${(newEvent.scheduledStartTimestamp / 1000).toFixed(0)}>`
            },
            {
                name: `> Creator`,
                value: `- <@!${newEvent.creatorId}> (${newEvent.creatorId})`
            },
            {
                name: `> Timestamp`,
                value: `- <t:${Math.floor(Date.now() / 1000)}:R>`
            }
        ]
    }, logsChannel).catch(() => { })
};