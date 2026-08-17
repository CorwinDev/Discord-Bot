const discord = require('discord.js');

/**
 * 
 * @param {import('../../typings.d').Client} client 
 * @param {discord.Invite} invite 
 * @returns 
 */
module.exports = async (client, invite) => {
    const logsChannel = await client.getLogs(invite.guild.id);
    if (!logsChannel) return;

    client.embed({
        title: `📨・Invite created`,
        desc: `A invite has been created`,
        fields: [
            {
                name: `> Code`,
                value: `- ${invite.code}`
            },
            {
                name: `> Inviter`,
                value: invite.inviter ? `- ${invite.inviter} (${invite.inviter.tag})` : `- Unknown`
            },
            {
                name: `> Timestamp`,
                value: `- <t:${Math.floor(invite.createdTimestamp / 1000)}:R>`
            }
        ]
    }, logsChannel).catch(() => { })
};