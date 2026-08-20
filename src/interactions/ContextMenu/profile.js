const { CommandInteraction, Client } = require('discord.js');
const { ContextMenuCommandBuilder } = require('discord.js');
const Discord = require('discord.js');

const model = require('../../database/models/badge');
const Schema = require('../../database/models/profile');
const CreditsSchema = require("../../database/models/votecredits");

module.exports = {
    data: new ContextMenuCommandBuilder()
        .setName('Bot profile')
        .setType(2),

    /** 
     * @param {Client} client
     * @param {CommandInteraction} interaction
     * @param {String[]} args
     */

    run: async (client, interaction, args) => {
        const badgeFlags = {
            DEVELOPER: client.emotes.badges.developer,
            EVENT: client.emotes.badges.event,
            BOOSTER: client.emotes.badges.booster,
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
            MARKETING: client.emotes.badges.marketing,
            ACTIVE: client.emotes.badges.active,
            VIP: client.emotes.badges.vip
        }

        const flags = {
            ActiveDeveloper: "👨‍💻・Active Developer",
            BugHunterLevel1: "🐛・Discord Bug Hunter",
            BugHunterLevel2: "🐛・Discord Bug Hunter",
            CertifiedModerator: "👮‍♂️・Certified Moderator",
            HypeSquadOnlineHouse1: "🏠・House Bravery Member",
            HypeSquadOnlineHouse2: "🏠・House Brilliance Member",
            HypeSquadOnlineHouse3: "🏠・House Balance Member",
            HypeSquadEvents: "🏠・HypeSquad Events",
            PremiumEarlySupporter: "👑・Early Supporter",
            Partner: "👑・Partner",
            Quarantined: "🔒・Quarantined", // Not sure if this is still a thing
            Spammer: "🔒・Spammer", // Not sure if this one works
            Staff: "👨‍💼・Discord Staff",
            TeamPseudoUser: "👨‍💼・Discord Team",
            VerifiedBot: "🤖・Verified Bot",
            VerifiedDeveloper: "👨‍💻・(early)Verified Bot Developer",
        }


        const user = interaction.guild.members.cache.get(interaction.targetId);

        Schema.findOne({ User: user.id }).then(async (data) => {
            if (data) {
                await interaction.deferReply({ withResponse: true });
                let Badges = await model.findOne({ User: user.id });

                let credits = 0;
                const creditData = await CreditsSchema.findOne({ User: user.id });

                if (Badges && Badges.FLAGS.includes("DEVELOPER")) {
                    credits = "∞";
                }
                else if (creditData) {
                    credits = creditData.Credits;
                }

                if (!Badges) Badges = { User: user.id };

                const userFlags = user.flags ? user.flags.toArray() : [];

                client.embed({
                    title: `${client.user.username}・Profile`,
                    desc: '_____',
                    thumbnail: user.avatarURL({ dynamic: true }),
                    fields: [{
                        name: "👤┆User",
                        value: user.username,
                        inline: true
                    },
                    {
                        name: "📘┆Discriminator",
                        value: user.discriminator,
                        inline: true
                    },
                    {
                        name: "🆔┆ID",
                        value: user.id,
                        inline: true
                    },
                    {
                        name: "👨‍👩‍👦┆Gender",
                        value: `${data.Gender || 'Not set'}`,
                        inline: true
                    },
                    {
                        name: "🔢┆Age",
                        value: `${data.Age || 'Not set'}`,
                        inline: true
                    },
                    {
                        name: "🎂┆Birthday",
                        value: `${data.Birthday || 'Not set'}`,
                        inline: true
                    },
                    {
                        name: "🎨┆Favorite color",
                        value: `${data.Color || 'Not set'}`,
                        inline: true
                    },
                    {
                        name: "🐶┆Favorite pets",
                        value: `${data.Pets.join(', ') || 'Not set'}`,
                        inline: true
                    },
                    {
                        name: "🍕┆Favorite food",
                        value: `${data.Food.join(', ') || 'Not set'}`,
                        inline: true
                    },
                    {
                        name: "🎶┆Favorite songs",
                        value: `${data.Songs.join(', ') || 'Not set'}`,
                        inline: true
                    },
                    {
                        name: "🎤┆Favorite artists",
                        value: `${data.Artists.join(', ') || 'Not set'}`,
                        inline: true
                    },
                    {
                        name: "🎬┆Favorite movies",
                        value: `${data.Movies.join(', ') || 'Not set'}`,
                        inline: true
                    },
                    {
                        name: "👨‍🎤┆Favorite actors",
                        value: `${data.Actors.join(', ') || 'Not set'}`,
                        inline: true
                    },
                    {
                        name: "🏴┆Origin",
                        value: `${data.Orgin || 'Not set'}`,
                        inline: true
                    },
                    {
                        name: "🎮┆Hobby's",
                        value: `${data.Hobbys.join(', ') || 'Not set'}`,
                        inline: true
                    },
                    {
                        name: "😛┆Status",
                        value: `${data.Status || 'Not set'}`,
                        inline: true
                    },
                    {
                        name: "📛┆Bot Badges",
                        value: `${Badges.FLAGS ? Badges.FLAGS.map(flag => badgeFlags[flag]).join(' ') : 'None'}`,
                        inline: true
                    },
                    {
                        name: "🏷️┆Discord Badges",
                        value: `${userFlags.length ? userFlags.map(flag => flags[flag]).join(', ') : 'None' || 'None'}`,
                        inline: true
                    },
                    {
                        name: "💳┆Dcredits",
                        value: `${credits || 'None'}`,
                        inline: true
                    },
                    {
                        name: "ℹ️┆About me",
                        value: `${data.Aboutme || 'Not set'}`,
                        inline: false
                    },], type: 'editreply'
                }, interaction);
            }
            else {
                return client.errNormal({ error: "No profile found! Open a profile with /profile create", type: 'ephemeral' }, interaction);
            }
        })
    },
};

 