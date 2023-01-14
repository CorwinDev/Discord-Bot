const discord = require('discord.js');

module.exports = async (client, sticker) => {
    const logsChannel = await client.getLogs(sticker.guild.id);
    if (!logsChannel) return;

    client.embed({
        title: `😜・Sticker deleted`,
        desc: `A sticker has been deleted`,
        fields: [
            {
                name: `> Name`,
                value: `- ${sticker.name}`
            },
            {
                name: `> ID`,
                value: `- ${sticker.id}`
            }
        ]
    }, logsChannel).catch(() => { })
};