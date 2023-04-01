const Schema = require("../../database/models/stats");
const Discord = require('discord.js');

module.exports = async (client) => {
    client.getTemplate = async (guild) => {
        try {
            const data = await Schema.findOne({ Guild: guild.id });

            if (data && data.ChannelTemplate) {
                return data.ChannelTemplate;
            }
            else {
                return `{emoji} {name}`
            }
        }
        catch {
            return `{emoji} {name}`
        }
    }

    client.on(Discord.Events.GuildMemberAdd, async (member) => {
        client.emit('updateMembers', member.guild);
        client.emit('updateBots', member.guild);
    })
    client.on(Discord.Events.GuildMemberRemove, async (member) => {
        client.emit('updateMembers', member.guild);
        client.emit('updateBots', member.guild);
    })

    client.on(Discord.Events.ChannelCreate, async channel => {
        client.emit('updateChannels', channel, channel.guild);
        client.emit('updateNewsChannels', channel, channel.guild);
        client.emit('updateStageChannels', channel, channel.guild);
        client.emit('updateTextChannels', channel, channel.guild);
        client.emit('updateVoiceChannels', channel, channel.guild);
    })
    client.on(Discord.Events.ChannelDelete, async channel => {
        client.emit('updateChannels', channel, channel.guild);
        client.emit('updateNewsChannels', channel, channel.guild);
        client.emit('updateStageChannels', channel, channel.guild);
        client.emit('updateTextChannels', channel, channel.guild);
        client.emit('updateVoiceChannels', channel, channel.guild);
    })

    client.on(Discord.Events.RoleCreate, async role => client.emit('updateRoles', role.guild))
    client.on(Discord.Events.RoleDelete, async role => client.emit('updateRoles', role.guild))

    client.on(Discord.Events.GuildMemberBoost, (booster) => client.emit('updateBoosts', booster.guild))
    client.on(Discord.Events.GuildMemberUnboost, (booster) => client.emit('updateBoosts', booster.guild))

    client.on(Discord.Events.GuildBoostLevelUp, (tier) => client.emit('updateTier', tier.guild))
    client.on(Discord.Events.GuildBoostLevelDown, (tier) => client.emit('updateTier', tier.guild))

    client.on(Discord.Events.EmojiCreate, (emoji) => {
        client.emit('updateEmojis', emoji, emoji.guild);
        client.emit('updateAEmojis', emoji, emoji.guild);
        client.emit('updateSEmojis', emoji, emoji.guild);
    })
    client.on(Discord.Events.EmojiDelete, (emoji) => {
        client.emit('updateEmojis', emoji, emoji.guild);
        client.emit('updateAEmojis', emoji, emoji.guild);
        client.emit('updateSEmojis', emoji, emoji.guild);
    })

    client.on(Discord.Events.ClientReady, async client => client.emit('updateClock'))
}

 