const Discord = require('discord.js');

module.exports = async (client, guild, url) => {
    const logsChannel = await client.getLogs(guild.id);
    if (!logsChannel) return;

    client.embed({
        title: `🔗・New Vanity URL`,
        desc: `The server vanity URL has been updated`,
        fields: [
            {
                name: `> URL`,
                value: `- ${url}`
            },
            {
                name: `> Timestamp`,
                value: `- <t:${Math.floor(Date.now() / 1000)}:R>`
            }
        ]
    }, logsChannel).catch(() => { })
};