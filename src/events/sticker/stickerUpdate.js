const discord = require('discord.js');

module.exports = async (client, oldSticker, newSticker) => {
    const logsChannel = await client.getLogs(newSticker.guild.id);
    if (!logsChannel) return;

    client.embed({
        title: `😜・Sticker updated`,
        desc: `A sticker has been updated`,
        fields: [
            {
                name: `> Before`,
                value: `- ${oldSticker.name}`
            },
            {
                name: `> After`,
                value: `- ${newSticker.name}`
            },
            {
                name: `> ID`,
                value: `- ${newSticker.id}`
            }
        ]
    }, logsChannel).catch(() => { })
};