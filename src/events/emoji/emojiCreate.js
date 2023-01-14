const discord = require('discord.js');

module.exports = async (client, emoji) => {
    const logsChannel = await client.getLogs(emoji.guild.id);
    if (!logsChannel) return;

    client.embed({
        title: `😛・Emoji created`,
        desc: `An emoji has been created`,
        fields: [
            {
                name: `> Emoji`,
                value: `- ${emoji}`
            },
            {
                name: `> Name`,
                value: `- ${emoji.name}`
            },
            {
                name: `> ID`,
                value: `- ${emoji.id}`
            },
            {
                name: `> Url`,
                value: `- ${emoji.url}`
            }
        ]
    }, logsChannel).catch(() => { })
};