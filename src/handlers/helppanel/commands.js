const Discord = require('discord.js');

module.exports = async (client) => {
    const fields = [
        {
            name: `<:uo_tv:1015552829714341959> ┆ Activities`,
            value: `\`/activities\``,
            inline: true
        },
        {
            name: `<:blue_snowflake:1012018251284361326> ┆ AFK`,
            value: `\`/afk help\``,
            inline: true
        },
        {
            name: `<:mega_phone:1012037897857282098> ┆ Announcement`,
            value: `\`/announcement help\``,
            inline: true
        },
        {
            name: `<:mod_shield:1012017403892346921> ┆ Auto mod`,
            value: `\`/automod help\``,
            inline: true
        },
        {
            name: `<:settings:1012018247031328868> ┆ Auto setup`,
            value: `\`/autosetup help\``,
            inline: true
        },
        {
            name: `<:presentgift:1012018258137862275> ┆ Birthday`,
            value: `\`/birthdays help\``,
            inline: true
        },
        {
            name: `<:discord_bot:1012038552521031703> ┆ Bot`,
            value: `\`/bot help\``,
            inline: true
        },
        {
            name: `<:huge_smile:1012038461357817968> ┆ Casino`,
            value: `\`/casino help\``,
            inline: true
        },
        {
            name: `<:settings:1012018247031328868> ┆ Configuration`,
            value: `\`/config help\``,
            inline: true
        },
        {
            name: `<:blue_stars:1012018254174232596> ┆ Custom commands`,
            value: `\`/custom-commands help\``,
            inline: true
        },
        {
            name: `<:emoji_50:1015861852321874002> ┆ Dcredits`,
            value: `\`/dcredits help\``,
            inline: true
        },
        {
            name: `<:uo_dcoin:1015563002591842314> ┆ Economy`,
            value: `\`/economy help\``,
            inline: true
        },
        {
            name: ` <:blue_stars:1012018254174232596> ┆ Family`,
            value: `\`/family help\``,
            inline: true
        },
        {
            name: `<:huge_smile:1012038461357817968> ┆ Fun`,
            value: `\`/fun help\``,
            inline: true
        },
        {
            name: `<:to_space:1012038751729491968> ┆ Games`,
            value: `\`/games help\``,
            inline: true
        },
        {
            name: `<:uo_party:1015552073405841458> ┆ Giveaway`,
            value: `\`/giveaway help\``,
            inline: true
        },
        {
            name: `<:discord:1012017257158824027> ┆ Guild settings`,
            value: `\`/guild help\``,
            inline: true
        },
        {
            name: `<:image:1012017406572499075> ┆ Images`,
            value: `\`/images help\``,
            inline: true
        },
        {
            name: `<:add:1012018622912274502> ┆ Invites`,
            value: `\`/invites help\``,
            inline: true
        },
        {
            name: `<:to_space:1012038751729491968> ┆ Leveling`,
            value: `\`/levels help\``,
            inline: true
        },
        {
            name: `<:values:1012038654916579358> ┆ Messages`,
            value: `\`/messages help\``,
            inline: true
        },
        {
            name: `<:mod_shield:1012017403892346921> ┆ Moderation`,
            value: `\`/moderation help\``,
            inline: true
        },
        {
            name: ` <:musicnotes:1012017302755094609> ┆ Music`,
            value: `\`/music help\``,
            inline: true
        },
        {
            name: ` <:uo_paper:1015550831199789146> ┆ Notepad`,
            value: `\`/notepad help\``,
            inline: true
        },
        {
            name: `<:member:1012017243837702174> ┆ Profile`,
            value: `\`/profile help\``,
            inline: true
        },
        {
            name: `<:uo_voice_channel:1015566886303440906> ┆ Radio`,
            value: `\`/radio help\``,
            inline: true
        },
        {
            name: `<:huge_smile:1012038461357817968> ┆ Reaction roles`,
            value: `\`/reactionroles help\``,
            inline: true
        },
        {
            name: `<:ways:1012018245429121075> ┆ Search`,
            value: `\`/search help\``,
            inline: true
        },
        {
            name: `<:plane:1012017388440531015> ┆ Server stats`,
            value: `\`/serverstats help\``,
            inline: true
        },
        {
            name: `<:settings:1012018247031328868> ┆ Setup`,
            value: `\`/setup help\``,
            inline: true
        },
        {
            name: `<:ways:1012018245429121075> ┆ Soundboard`,
            value: `\`/soundboard help\``,
            inline: true
        },
        {
            name: `<:hashtag:1012018249854091415> ┆ Sticky messages`,
            value: `\`/stickymessages help\``,
            inline: true
        },
        {
            name: `<:heart_blue:1012017400314613761> ┆ Suggestions`,
            value: `\`/sugestions help\``,
            inline: true
        },
        {
            name: ` <:beIl:1012017395910594620> ┆ Thanks`,
            value: `\`/thanks help\``,
            inline: true
        },
        {
            name: `<:blue_ticket:1012017313878388816> ┆ Tickets`,
            value: `\`/tickets help\``,
            inline: true
        },
        {
            name: `<:blue_hammers:1012018248163786763> ┆ Tools`,
            value: `\`/tools help\``,
            inline: true
        },
        {
            name: `<:uo_voice_channel:1015566886303440906> ┆ Voice`,
            value: `\`/voice help\``,
            inline: true
        },
    ];

    client.on('interactionCreate', async (interaction) => {
        if (!interaction.isSelectMenu()) return;

        if (interaction.customId == "Bot-helppanel") {
            if (interaction.values == "commands-Bothelp") {
                interaction.deferUpdate();
                let page = 1;

                const row = new Discord.MessageActionRow()
                    .addComponents(
                        new Discord.MessageButton()
                            .setCustomId('helpPrev')
                            .setEmoji('⬅️')
                            .setStyle('SECONDARY'),

                        new Discord.MessageButton()
                            .setCustomId('helpNext')
                            .setEmoji('➡️')
                            .setStyle('SECONDARY'),

                        new Discord.MessageButton()
                            .setLabel("Invite")
                            .setURL("https://discord.com/oauth2/authorize?&client_id=960193514656919652&scope=applications.commands+bot&permissions=8")
                            .setStyle("LINK"),

                        new Discord.MessageButton()
                            .setLabel("Support server")
                            .setURL("https://discord.gg/pXRT2FusPb")
                            .setStyle("LINK"),
                    );

                const row2 = new Discord.MessageActionRow()
                    .addComponents(
                        new Discord.MessageSelectMenu()
                            .setCustomId('Bot-helppanel')
                            .setPlaceholder('❌┆Nothing selected')
                            .addOptions([
                                {
                                    label: `Commands`,
                                    description: `Show the commands of Bot!`,
                                    emoji: "💻",
                                    value: "commands-Bothelp",
                                },
                                {
                                    label: `Invite`,
                                    description: `Invite Bot to your server`,
                                    emoji: "📨",
                                    value: "invite-Bothelp",
                                },
                                {
                                    label: `Support server`,
                                    description: `Join the suppport server`,
                                    emoji: "❓",
                                    value: "support-Bothelp",
                                },
                                {
                                    label: `Changelogs`,
                                    description: `Show the bot changelogs`,
                                    emoji: "📃",
                                    value: "changelogs-Bothelp",
                                },
                            ]),
                    );

                client.embed({
                    title: `❓・Help panel`,
                    desc: `View all command categories in the bot here! \n\n[Invite](${client.config.discord.botInvite}) | [Vote](https://top.gg/bot/960193514656919652/vote) `,
                    image: "https://cdn.discordapp.com/attachments/843487478881976381/874694194474668052/Bot_banner_invite.jpg",
                    fields: fields.slice(0, 24),
                    components: [row2, row],
                    type: 'edit'
                }, interaction.message).then(msg => {
                    const filter = i => i.user.id === interaction.user.id;

                    const collector = interaction.channel.createMessageComponentCollector({ filter, time: 100000 });

                    collector.on('collect', async i => {
                        if (i.customId == "helpNext") {
                            if (page == 1) {
                                client.embed({
                                    title: `❓・Help panel`,
                                    desc: `View all command categories in the bot here! \n\n[Invite](${client.config.discord.botInvite}) | [Vote](https://top.gg/bot/960193514656919652/vote)`,
                                    fields: fields.slice(25, 49),
                                    components: [row2, row],
                                    type: 'update'
                                }, i)
                                page += 1;
                            }
                        }

                        else if (i.customId == "helpPrev") {
                            if (page == 2) {
                                client.embed({
                                    title: `❓・Help panel`,
                                    desc: `View all command categories in the bot here! \n\n[Invite](${client.config.discord.botInvite}) | [Vote](https://top.gg/bot/960193514656919652/vote)`,
                                    fields: fields.slice(0, 24),
                                    components: [row2, row],
                                    type: 'update'
                                }, i)
                                page -= 1;
                            }
                        }
                    });
                })
            }
        }
    }).setMaxListeners(0);
}

 