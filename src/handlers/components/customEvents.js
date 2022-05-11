const Schema = require("../../database/models/logChannels");

module.exports = async (client) => {
    client.getLogs = async function (guildId) {
        const data = await Schema.findOne({ Guild: guildId });
        if (data && data.Channel) {
            const channel = client.channels.cache.get(data.Channel);
            return channel;
        }
        else {
            return false;
        }
    }

    client.on('guildMemberUpdate', (oldMember, newMember) => {
        if (!oldMember.premiumSince && newMember.premiumSince) {
            client.emit('guildMemberBoost', newMember);
        }

        if (oldMember.premiumSince && !newMember.premiumSince) {
            client.emit('guildMemberUnboost', newMember);
        }
    })

    client.on('guildUpdate', (oldGuild, newGuild) => {
        if (oldGuild.premiumTier < newGuild.premiumTier) {
            client.emit('guildBoostLevelUp', newGuild, oldGuild.premiumTier, newGuild.premiumTier);
        }

        if (oldGuild.premiumTier > newGuild.premiumTier) {
            client.emit('guildBoostLevelDown', newGuild, oldGuild.premiumTier, newGuild.premiumTier);
        }

        if (!oldGuild.banner && newGuild.banner) {
            client.emit('guildBannerAdd', newGuild, newGuild.bannerURL({ size: 1024 }));
        }

        if (!oldGuild.afkChannel && newGuild.afkChannel) {
            client.emit('guildAfkChannelAdd', newGuild, newGuild.afkChannel);
        }

        if (!oldGuild.vanityURLCode && newGuild.vanityURLCode) {
            client.emit('guildVanityURLAdd', newGuild, newGuild.vanityURLCode);
        }

        if (oldGuild.vanityURLCode && !newGuild.vanityURLCode) {
            client.emit('guildVanityURLRemove', newGuild, oldGuild.vanityURLCode);
        }

        if (oldGuild.vanityURLCode !== newGuild.vanityURLCode) {
            client.emit('guildVanityURLUpdate', newGuild, oldGuild.vanityURLCode, newGuild.vanityURLCode);
        }
    })

    client.on('roleUpdate', (oldRole, newRole) => {
        if (oldRole.rawPosition !== newRole.rawPosition) {
            client.emit('rolePositionUpdate', newRole, oldRole.rawPosition, newRole.rawPosition);
        }

        if (oldRole.permissions.bitfield !== newRole.permissions.bitfield) {
            client.emit('rolePermissionsUpdate', newRole, oldRole.permissions.bitfield, newRole.permissions.bitfield);
        }

        if (oldRole.color !== newRole.color) {
            client.emit('roleColorUpdate', newRole, oldRole.color, newRole.color);
        }

        if (oldRole.name !== newRole.name) {
            client.emit('roleNameUpdate', newRole, oldRole.name, newRole.name);
        }
    })

    client.on('channelUpdate', (oldChannel, newChannel) => {
        if (oldChannel.type === 'GUILD_TEXT' && oldChannel.topic !== newChannel.topic) {
            client.emit('channelTopicUpdate', newChannel, oldChannel.topic, newChannel.topic);
        }

        if (oldChannel.name !== newChannel.name) {
            client.emit('channelNameUpdate', newChannel, oldChannel.name, newChannel.name);
        }
    })
}

 