const discord = require('discord.js');

module.exports = async (client, role) => {
    const logsChannel = await client.getLogs(role.guild.id);
    if (!logsChannel) return;

    client.embed({
        title: `🧻・Role created`,
        desc: `A role has been created`,
        fields: [
            {
                name: `> Role`,
                value: `- ${role}`
            },
            {
                name: `> Name`,
                value: `- ${role.name}`
            },
            {
                name: `> ID`,
                value: `- ${role.id}`
            },
            {
                name: `> Color`,
                value: `${role.hexColor}`
            },
            {
                name: `> Position`,
                value: `${role.position}`
            }
        ]
    }, logsChannel).catch(() => { })

};