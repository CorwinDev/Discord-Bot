const { CommandInteraction, Client } = require('discord.js');
const { ContextMenuCommandBuilder } = require('@discordjs/builders');
const Discord = require('discord.js');
const axios = require("axios");

const model = require('../../database/models/badge');

module.exports = {
    data: new ContextMenuCommandBuilder()
        .setName('Userinfo')
        .setType(2),

    /** 
     * @param {Client} client
     * @param {CommandInteraction} interaction
     * @param {String[]} args
     */

    run: async (client, interaction, args) => {
        const member = interaction.guild.members.cache.get(interaction.targetId);

        const badgeFlags = {
            DEVELOPER: client.emotes.badges.developer,
            BUGS: client.emotes.badges.bug,
            MANAGEMENT: client.emotes.badges.management,
            PREMIUM: client.emotes.badges.premium,
            SUPPORTER: client.emotes.badges.supporter,
            TEAM: client.emotes.badges.team,
            BOOSTER: client.emotes.badges.booster,
            PARTNER: client.emotes.badges.partner,
            VOTER: client.emotes.badges.voter,
            SUPPORT: client.emotes.badges.support,
            MODERATOR: client.emotes.badges.moderator,
            DESIGNER: client.emotes.badges.designer,
            MARKETING: client.emotes.badges.marketing
        }

        const flags = {
            DISCORD_EMPLOYEE: '<:discordstaff:868235527059537960>',
            DISCORD_PARTNER: '<:serverownerpartner:868235522139619418>',
            BUGHUNTER_LEVEL_1: '<:bughunter1:868235523167240342>',
            BUGHUNTER_LEVEL_2: '<:bughunter2:868235521099444374>',
            HYPESQUAD_EVENTS: '<:hypesquadevents:868235528103944232>',
            HOUSE_BRAVERY: '<:hypesquadbravery:868235530020716584>',
            HOUSE_BRILLIANCE: '<:hypesquadbrilliance:868235525834817536>',
            HOUSE_BALANCE: '<:hypesquadbalance:868235523657965579>',
            EARLY_SUPPORTER: '<:earlysupporter:868235524882722866>',
            SYSTEM: 'System',
            VERIFIED_BOT: '<:verifieBot:868235529039265842>',
            VERIFIED_DEVELOPER: '<:verifieBotdev:853642406121439273>'
        }

        let Badges = await model.findOne({ User: member.user.id });
        if (!Badges) Badges = { User: member.user.id }
        const roles = member.roles.cache
            .sort((a, b) => b.position - a.position)
            .map(role => role.toString())
            .slice(0, -1);
        const userFlags = member.user.flags ? member.user.flags.toArray() : [];

        const userBanner = await axios.get(`https://discord.com/api/users/${member.id}`, {
            headers: {
                Authorization: `Bot ${client.token}`,
            },
        })

        var nickName = member.nickname;

        const { banner } = userBanner.data;
        let url = "";

        if (banner) {
            const extension = banner.startsWith("a_") ? ".gif" : ".png";
            url = `https://cdn.discordapp.com/banners/${member.id}/${banner}${extension}?size=1024`;
        }

        return client.embed({
            title: `👤・User information`,
            desc: `Information about ${member.user.username}`,
            thumbnail: member.user.displayAvatarURL({ dynamic: true, size: 1024 }),
            image: url,
            fields: [
                {
                    name: "Username",
                    value: `${member.user.username}`,
                    inline: true,
                },
                {
                    name: "Discriminator",
                    value: `${member.user.discriminator}`,
                    inline: true,
                },
                {
                    name: "Nickname",
                    value: `${nickName || 'No nickname'}`,
                    inline: true,
                },
                {
                    name: "id",
                    value: `${member.user.id}`,
                    inline: true,
                },
                {
                    name: "Flags",
                    value: `${userFlags.length ? userFlags.map(flag => flags[flag]).join(', ') : 'None'}`,
                    inline: true,
                },
                {
                    name: "Badges",
                    value: `${Badges.FLAGS ? Badges.FLAGS.map(flag => badgeFlags[flag]).join(' ') : 'None'}`,
                    inline: true,
                },
                {
                    name: "Discord joined at",
                    value: `<t:${Math.round(member.user.createdTimestamp / 1000)}>`,
                    inline: true,
                },
                {
                    name: "Server joined at",
                    value: `<t:${Math.round(member.joinedAt / 1000)}>`,
                    inline: true,
                },
                {
                    name: `Roles [${roles.length}]`,
                    value: `${roles.join(', ')}`,
                    inline: false,
                }
            ],
            type: 'editreply'
        }, interaction)
    },
};

 