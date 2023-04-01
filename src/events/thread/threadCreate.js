const discord = require('discord.js');

module.exports = async (client, channel) => {
    let types = {
        GUILD_NEWS_THREAD: "News Thread",
        GUILD_PUBLIC_THREAD: "Public Thread",
        GUILD_PRIVATE_THREAD: "Private Thread",
    }

    const logsChannel = await client.getLogs(channel.guild.id);
    if (!logsChannel) return;

    client.embed({
        title: `📖・Thread created`,
        desc: `A thread has been created`,
        fields: [
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
                value: `${channel.parent}`
            },
            {
                name: `> Channel`,
                value: `<#${channel.id}>`
            },
            {
                name: `> Type`,
                value: `${types[channel.type]}`
            }
        ]
    }, logsChannel).catch(() => { })
};