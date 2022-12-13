const discord = require('discord.js');

module.exports = async (client, channel, time) => {
    let types = {
        0: "Text Channel",
        2: "Voice Channel",
        4: "Category",
        5: "News Channel",
        10: "News Thread",
        11: "Public Thread",
        12: "Private Thread",
        13: "Stage Channel",
        14: "Category",
    }

    const logsChannel = await client.getLogs(channel.guild.id);
    if (!logsChannel) return;

    client.embed({
        title: `🔧・Channel pins updated`,
        desc: `Channel pins have been updated`,
        fields: [
            {
                name: `> Name`,
                value: `- ${channel.name}`
            },
            {
                name: `> ID`,
                value: `- ${channel.id}`
            },
            {
                name: `> Category`,
                value: `- ${channel.parent}`
            },
            {
                name: `> Channel`,
                value: `- <#${channel.id}>`
            },
            {
                name: `> Type`,
                value: `- ${types[channel.type]}`
            },
            {
                name: `> Pinned at`,
                value: `- <t:${(time / 1000).toFixed(0)}>`
            }
        ]
    }, logsChannel).catch(() => { })
};