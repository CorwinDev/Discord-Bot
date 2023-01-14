const discord = require('discord.js');

module.exports = async (client, emoji) => {
    const logsChannel = await client.getLogs(emoji.guild.id);
    if (!logsChannel) return;

    client.embed({
        title: `😛・Emoji deleted`,
        desc: `An emoji has been deleted`,
        fields: [
            {
                name: `> Name`,
                value: `- ${emoji.name}`
            },
            {
                name: `> ID`,
                value: `- ${emoji.id}`
            }
        ]
    }, logsChannel).catch(() => { })
};