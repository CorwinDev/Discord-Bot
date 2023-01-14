const Schema = require("../../database/models/stats");

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

    client.on('guildMemberAdd', async (member) => {
        client.emit('updateMembers', member.guild);
        client.emit('updateBots', member.guild);
    })
    client.on('guildMemberRemove', async (member) => {
        client.emit('updateMembers', member.guild);
        client.emit('updateBots', member.guild);
    })

    client.on('channelCreate', async channel => {
        client.emit('updateChannels', channel, channel.guild);
        client.emit('updateNewsChannels', channel, channel.guild);
        client.emit('updateStageChannels', channel, channel.guild);
        client.emit('updateTextChannels', channel, channel.guild);
        client.emit('updateVoiceChannels', channel, channel.guild);
    })
    client.on('channelDelete', async channel => {
        client.emit('updateChannels', channel, channel.guild);
        client.emit('updateNewsChannels', channel, channel.guild);
        client.emit('updateStageChannels', channel, channel.guild);
        client.emit('updateTextChannels', channel, channel.guild);
        client.emit('updateVoiceChannels', channel, channel.guild);
    })

    client.on('roleCreate', async role => client.emit('updateRoles', role.guild))
    client.on('roleDelete', async role => client.emit('updateRoles', role.guild))

    client.on('guildMemberBoost', (booster) => client.emit('updateBoosts', booster.guild))
    client.on('guildMemberUnboost', (booster) => client.emit('updateBoosts', booster.guild))

    client.on('guildBoostLevelUp', (tier) => client.emit('updateTier', tier.guild))
    client.on('guildBoostLevelDown', (tier) => client.emit('updateTier', tier.guild))

    client.on('emojiCreate', (emoji) => {
        client.emit('updateEmojis', emoji, emoji.guild);
        client.emit('updateAEmojis', emoji, emoji.guild);
        client.emit('updateSEmojis', emoji, emoji.guild);
    })
    client.on('emojiDelete', (emoji) => {
        client.emit('updateEmojis', emoji, emoji.guild);
        client.emit('updateAEmojis', emoji, emoji.guild);
        client.emit('updateSEmojis', emoji, emoji.guild);
    })

    client.on('ready', async client => client.emit('updateClock'))
}

 