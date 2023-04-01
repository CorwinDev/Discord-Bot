const discord = require('discord.js');

module.exports = async (client, oldChannel, newChannel) => {
    let types = {
        GUILD_NEWS_THREAD: "News Thread",
        GUILD_PUBLIC_THREAD: "Public Thread",
        GUILD_PRIVATE_THREAD: "Private Thread",
    }

    const logsChannel = await client.getLogs(newChannel.guild.id);
    if (!logsChannel) return;

    client.embed({
        title: `📖・Thread created`,
        desc: `A thread has been created`,
        fields: [
            {
                name: `> Old name`,
                value: `- ${oldChannel.name}`
            },
            {
                name: `> New name`,
                value: `- ${newChannel.name}`
            },
            {
                name: `> ID`,
                value: `- ${newChannel.id}`
            },
            {
                name: `> Category`,
                value: `${newChannel.parent}`
            },
            {
                name: `> Channel`,
                value: `<#${newChannel.id}>`
            },
            {
                name: `> Type`,
                value: `${types[newChannel.type]}`
            }
        ]
    }, logsChannel).catch(() => { })
};