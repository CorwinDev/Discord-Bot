const discord = require('discord.js');

module.exports = async (client, channel, oldTopic, newTopic) => {
    let types = {
        GUILD_TEXT: "Text Channel",
        GUILD_VOICE: "Voice Channel",
        GUILD_CATEGORY: "Category",
        UNKNOWN: "No Type",
        GUILD_NEWS: "News Channel",
        GUILD_STAGE_VOICE: "Stage Channel",
        GUILD_STORE: "Store Channel",
        GUILD_NEWS_THREAD: "News Thread",
        GUILD_PUBLIC_THREAD: "Public Thread",
        GUILD_PRIVATE_THREAD: "Private Thread",
    }

    const logsChannel = await client.getLogs(channel.guild.id);
    if (!logsChannel) return;

    client.embed({
        title: `🔧・Channel topic adjusted`,
        desc: `One channel topic modified`,
        fields: [
            {
                name: `> Old Topic`,
                value: `- ${oldTopic}`
            },
            {
                name: `> New Topic`,
                value: `- ${newTopic}`
            },
            {
                name: `> Name`,
                value: `- ${channel.name}`
            },
            {
                name: `> ID`,
                value: `- ${channel.id}`
            },
            {
                name: `> Category`,
                value: `- ${channel.parent}`
            },
            {
                name: `> Channel`,
                value: `- <#${channel.id}>`
            },
            {
                name: `> Type`,
                value: `- ${types[channel.type]}`
            }
        ]
    }, logsChannel).catch(() => { })
};