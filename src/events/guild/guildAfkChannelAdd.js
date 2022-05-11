const Discord = require('discord.js');

module.exports = async (client, guild, afkChannel) => {
    const logsChannel = await client.getLogs(guild.id);
    if (!logsChannel) return;

    client.embed({
        title: `🛑・New AFK channel`,
        desc: `An AFK channel has been added to the server`,
        fields: [
            {
                name: `> Channel`,
                value: `- ${afkChannel}`
            },
            {
                name: `> Name`,
                value: `- ${afkChannel.name}`
            },
            {
                name: `> ID`,
                value: `- ${afkChannel.id}`
            }
        ]
    }, logsChannel).catch(() => { })
};