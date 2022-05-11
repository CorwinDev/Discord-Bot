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
        ]
    }, logsChannel).catch(() => { })
};