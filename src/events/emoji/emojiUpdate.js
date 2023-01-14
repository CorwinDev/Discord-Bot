const discord = require('discord.js');

module.exports = async (client, oldEmoji, newEmoji) => {
    const logsChannel = await client.getLogs(newEmoji.guild.id);
    if (!logsChannel) return;

    client.embed({
        title: `😛・Emoji updated`,
        desc: `An emoji has been updated`,
        fields: [
            {
                name: `> Emoji`,
                value: `- ${newEmoji}`
            },
            {
                name: `> Before`,
                value: `- ${oldEmoji.name}`
            },
            {
                name: `> After`,
                value: `- ${newEmoji.name}`
            },
            {
                name: `> ID`,
                value: `- ${newEmoji.id}`
            }
        ]
    }, logsChannel).catch(() => { })
};