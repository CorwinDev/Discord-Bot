const discord = require('discord.js');

const leaveSchema = require("../../database/models/leaveChannels");
const messages = require("../../database/models/inviteMessages");
const invitedBy = require("../../database/models/inviteBy");
const invites = require("../../database/models/invites");

module.exports = async (client, member) => {
    const messageData = await messages.findOne({ Guild: member.guild.id });
    const inviteByData = await invitedBy.findOne({ Guild: member.guild.id, User: member.id });
    const channelData = await leaveSchema.findOne({ Guild: member.guild.id });

    if (inviteByData) {
        const inviteData = await invites.findOne({ Guild: member.guild.id, User: inviteByData.inviteUser });

        if (inviteData) {
            inviteData.Invites -= 1;
            inviteData.Left += 1;
            inviteData.save();
        }

        if (channelData) {
            if (messageData && messageData.inviteLeave) {
                var leaveMessage = messageData.inviteLeave;
                leaveMessage = leaveMessage.replace(`{user:username}`, member.user.username)
                leaveMessage = leaveMessage.replace(`{user:discriminator}`, member.user.discriminator)
                leaveMessage = leaveMessage.replace(`{user:tag}`, member.user.tag)
                leaveMessage = leaveMessage.replace(`{user:mention}`, member)

                leaveMessage = leaveMessage.replace(`{inviter:mention}`, `<@!${inviteByData.inviteUser}>`)
                leaveMessage = leaveMessage.replace(`{inviter:invites}`, inviteData.Invites)
                leaveMessage = leaveMessage.replace(`{inviter:invites:left}`, inviteData.Left)

                leaveMessage = leaveMessage.replace(`{guild:name}`, member.guild.name)
                leaveMessage = leaveMessage.replace(`{guild:members}`, member.guild.memberCount)

                client.users.fetch(inviteData.inviteUser).then(async (user) => {
                    leaveMessage = leaveMessage.replace(`{inviter:username}`, user.username)
                    leaveMessage = leaveMessage.replace(`{inviter:discriminator}`, user.discriminator)
                    leaveMessage = leaveMessage.replace(`{inviter:tag}`, `${user.username}#${user.discriminator}`)

                    const channel = member.guild.channels.cache.get(channelData.Channel)

                    await client.embed({
                        title: `👋・Bye`,
                        desc: leaveMessage
                    }, channel).catch(() => { })
                }).catch(async () => {
                    if (channelData) {

                        const channel = member.guild.channels.cache.get(channelData.Channel)

                        await client.embed({
                            title: `👋・Bye`,
                            desc: `**${member.user.tag}** has left us`
                        }, channel).catch(() => { })
                    }
                })
            }
            else {
                client.users.fetch(inviteData.inviteUser).then(async (user) => {

                    const channel = member.guild.channels.cache.get(channelData.Channel)

                    await client.embed({
                        title: `👋・Bye`,
                        desc: `**${member.user.tag}** was invited by ${user.tag}`
                    }, channel).catch(() => { })

                }).catch(async () => {
                    if (channelData) {

                        const channel = member.guild.channels.cache.get(channelData.Channel)

                        await client.embed({
                            title: `👋・Bye`,
                            desc: `**${member.user.tag}** was invited by ${user.tag}`
                        }, channel).catch(() => { })
                    }
                })
            }
        }
    }
    else {
        if (channelData) {

            const channel = member.guild.channels.cache.get(channelData.Channel)

            await client.embed({
                title: `👋・Bye`,
                desc: `**${member.user.tag}** has left us`
            }, channel).catch(() => { })
        }
    }
};