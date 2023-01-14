const discord = require('discord.js');

module.exports = async (client, user, mod) => {
    const logsChannel = await client.getLogs(user.guild.id);
    if (!logsChannel) return;

    client.embed({
        title: `🔨・Member unwarned`,
        desc: `A user has been unwarned`,
        fields: [
            {
                name: `> User`,
                value: `- ${user}`
            },
            {
                name: `> Tag`,
                value: `- ${user.user.username}#${user.user.discriminator}`
            },
            {
                name: `> ID`,
                value: `${user.id}`
            },
            {
                name: `> Moderator`,
                value: `${mod} (${mod.id})`
            }
        ]
    }, logsChannel).catch(() => { })
};