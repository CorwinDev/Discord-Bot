const discord = require('discord.js');

module.exports = async (client, channel, oldName, newName) => {
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
        title: `🔧・Channel name adjusted`,
        desc: `One channel name modified`,
        fields: [
            {
                name: `> Old Name`,
                value: `- ${oldName}`
            },
            {
                name: `> New Name`,
                value: `- ${newName}`
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