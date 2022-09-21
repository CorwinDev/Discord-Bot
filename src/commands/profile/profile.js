const model = require('../../database/models/badge');
const Schema = require('../../database/models/profile');
const CreditsSchema = require("../../database/models/votecredits");

module.exports = async (client, interaction, args) => {

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
  DISCORD_EMPLOYEE: "<:discordEmployee:992385182273372210>",
  DISCORD_PARTNER: "<a:discord_Discord_Partner_disc:992385380865294386>",
  BUGHUNTER_LEVEL_1: "<:bughunter_level_1:992385588328144927> ",
  BUGHUNTER_LEVEL_2: "<:bughunter_level_2:992385753596305468>",
  HYPESQUAD_EVENTS: "<:hypesquad_events:992385931703222303>",
  HOUSE_BRAVERY: "<:house_bravery:992387170943909980>",
  HOUSE_BRILLIANCE: "<:house_brilliance:992387318012985374>",
  HOUSE_BALANCE: "<:HOUSE_BALANCE:992439438988812408> ",
  EARLY_SUPPORTER: "<:early_supporter:992387546246029422>",
  SYSTEM: "<a:verified_developer:992387826572333056>",
  VERIFIED_BOT: "Verified Bot <:verified_bot:992387663875297360>",
  VERIFIED_DEVELOPER: "<a:verified_developer:992387826572333056>",
  NITRO: "<:Nitro:1006219187825426444>",
  BOOSTER_1: "<a:ex_booster:1006210639158579371>",
  BOOSTER_2: "<a:ex_booster:1006210639158579371>",
  BOOSTER_3: "<a:ex_booster:1006210639158579371>",
  BOOSTER_4: "<a:ex_booster:1006210639158579371>",
  BOOSTER_5: "<a:ex_booster:1006210639158579371>",
  BOOSTER_6: "<a:ex_booster:1006210639158579371>",
  BOOSTER_7: "<a:ex_booster:1006210639158579371>",
  BOOSTER_8: "<a:ex_booster:1006210639158579371>",
  BOOSTER_9: "<a:ex_booster:1006210639158579371>",
};

    const user = interaction.options.getUser('user') || interaction.user;

    Schema.findOne({ User: user.id }, async (err, data) => {
        if (data) {
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
            return client.errNormal({ error: "No profile found! Open a profile with createprofile", type:'editreply' }, interaction);
        }
    })
}

 