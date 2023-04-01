const discord = require('discord.js');

/**
 * @param {discord.Client} client 
 * @param {discord.GuildMember} user 
 * @param {discord.User} mod 
 * @param {string} reason 
 * @returns
 */
module.exports = async (client, user, mod, reason) => {
    const logsChannel = await client.getLogs(user.guild.id);
    if (!logsChannel) return;

    client.embed({
        title: `🔨・Member warned`,
        desc: `A user has been warned`,
        fields: [
            {
                name: `> User`,
                value: `- ${user}`
            },
            {
                name: `> Tag`,
                value: `- ${user.user.username}#${user.user.discriminator}`
            },
            {
                name: `> ID`,
                value: `${user.id}`
            },
            {
                name: `> Moderator`,
                value: `${mod} (${mod.id})`
            },
            {
                name: `> Reason`,
                value: `${reason}`
            }
        ]
    }, logsChannel).catch(() => {
        console.log
     })
};