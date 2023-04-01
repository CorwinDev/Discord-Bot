const discord = require('discord.js');

module.exports = async (client, invite) => {
    const logsChannel = await client.getLogs(invite.guild.id);
    if (!logsChannel) return;

    client.embed({
        title: `📨・Invite deleted`,
        desc: `A invite has been deleted`,
        fields: [
            {
                name: `> Code`,
                value: `- ${invite.code}`
            },
            {
                name: `> Timestamp`,
                value: `- <t:${Math.floor(invite.createdTimestamp / 1000)}:R>`
            }
        ]
    }, logsChannel).catch(() => { })
};