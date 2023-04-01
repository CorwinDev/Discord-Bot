const discord = require('discord.js');

module.exports = async (client, role, oldName, newName) => {
    const logsChannel = await client.getLogs(role.guild.id);
    if (!logsChannel) return;

    client.embed({
        title: `🧻・Role name updated`,
        desc: `A role has been updated`,
        fields: [
            {
                name: `> Role`,
                value: `- ${role}`
            },
            {
                name: `> Before`,
                value: `- ${oldName}`
            },
            {
                name: `> After`,
                value: `- ${newName}`
            },
            {
                name: `> ID`,
                value: `${role.id}`
            }
        ]
    }, logsChannel).catch(() => { })
};