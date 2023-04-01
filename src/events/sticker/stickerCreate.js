const discord = require('discord.js');

module.exports = async (client, sticker) => {
    const logsChannel = await client.getLogs(sticker.guild.id);
    if (!logsChannel) return;

    client.embed({
        title: `😜・Sticker created`,
        desc: `A sticker has been created`,
        fields: [
            {
                name: `> Name`,
                value: `- ${sticker.name}`
            },
            {
                name: `> ID`,
                value: `- ${sticker.id}`
            },
            {
                name: `> Url`,
                value: `${sticker.url}`
            }
        ]
    }, logsChannel).catch(() => { })
};