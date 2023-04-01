const Discord = require('discord.js');

module.exports = async (client, role, oldPerms, newPerms) => {

    const logsChannel = await client.getLogs(role.guild.id);
    if (!logsChannel) return;

    client.embed({
        title: `🧻・Role permissions updated`,
        desc: `A role has been updated`,
        fields: [
            {
                name: `> Role`,
                value: `- ${role}`
            },
            {
                name: `> Before`,
                value: `- ${new Discord.PermissionsBitField(oldPerms).toArray().toLocaleString().split(',').join(', ') || 'None'}`
            },
            {
                name: `> After`,
                value: `- ${new Discord.PermissionsBitField(newPerms).toArray().toLocaleString().split(',').join(', ') || 'None'}`
            },
            {
                name: `> ID`,
                value: `${role.id}`
            },
            {
                name: `> Timestamp`,
                value: `<t:${Math.floor(Date.now() / 1000)}:R>`
            }
        ]
    }, logsChannel).catch(() => { })
};