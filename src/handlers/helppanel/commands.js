const Discord = require('discord.js');

module.exports = async (client) => {
    const fields = [
        {
            name: `📺┆Activities`,
            value: `\`/activities\``,
            inline: true
        },
        {
            name: `🚫┆AFK`,
            value: `\`/afk help\``,
            inline: true
        },
        {
            name: `📣┆Announcement`,
            value: `\`/announcement help\``,
            inline: true
        },
        {
            name: `👮‍♂️┆Auto mod`,
            value: `\`/automod help\``,
            inline: true
        },
        {
            name: `⚙️┆Auto setup`,
            value: `\`/autosetup help\``,
            inline: true
        },
        {
            name: `🎂┆Birthday`,
            value: `\`/birthdays help\``,
            inline: true
        },
        {
            name: `🤖┆Bot`,
            value: `\`/bot help\``,
            inline: true
        },
        {
            name: `🎰┆Casino`,
            value: `\`/casino help\``,
            inline: true
        },
        {
            name: `⚙┆Configuration`,
            value: `\`/config help\``,
            inline: true
        },
        {
            name: `💻┆Custom commands`,
            value: `\`/custom-commands help\``,
            inline: true
        },
        {
            name: `💳┆Dcredits`,
            value: `\`/dcredits help\``,
            inline: true
        },
        {
            name: `💰┆Economy`,
            value: `\`/economy help\``,
            inline: true
        },
        {
            name: `👪┆Family`,
            value: `\`/family help\``,
            inline: true
        },
        {
            name: `😂┆Fun`,
            value: `\`/fun help\``,
            inline: true
        },
        {
            name: `🎮┆Games`,
            value: `\`/games help\``,
            inline: true
        },
        {
            name: `🥳┆Giveaway`,
            value: `\`/giveaway help\``,
            inline: true
        },
        {
            name: `⚙️┆Guild settings`,
            value: `\`/guild help\``,
            inline: true
        },
        {
            name: `🖼┆Images`,
            value: `\`/images help\``,
            inline: true
        },
        {
            name: `📨┆Invites`,
            value: `\`/invites help\``,
            inline: true
        },
        {
            name: `🆙┆Leveling`,
            value: `\`/levels help\``,
            inline: true
        },
        {
            name: `💬┆Messages`,
            value: `\`/messages help\``,
            inline: true
        },
        {
            name: `👔┆Moderation`,
            value: `\`/moderation help\``,
            inline: true
        },
        {
            name: `🎶┆Music`,
            value: `\`/music help\``,
            inline: true
        },
        {
            name: `📓┆Notepad`,
            value: `\`/notepad help\``,
            inline: true
        },
        {
            name: `👤┆Profile`,
            value: `\`/profile help\``,
            inline: true
        },
        {
            name: `📻┆Radio`,
            value: `\`/radio help\``,
            inline: true
        },
        {
            name: `😛┆Reaction roles`,
            value: `\`/reactionroles help\``,
            inline: true
        },
        {
            name: `🔍┆Search`,
            value: `\`/search help\``,
            inline: true
        },
        {
            name: `📊┆Server stats`,
            value: `\`/serverstats help\``,
            inline: true
        },
        {
            name: `⚙️┆Setup`,
            value: `\`/setup help\``,
            inline: true
        },
        {
            name: `🎛┆Soundboard`,
            value: `\`/soundboard help\``,
            inline: true
        },
        {
            name: `🗨️┆Sticky messages`,
            value: `\`/stickymessages help\``,
            inline: true
        },
        {
            name: `💡┆Suggestions`,
            value: `\`/sugestions help\``,
            inline: true
        },
        {
            name: `🤝┆Thanks`,
            value: `\`/thanks help\``,
            inline: true
        },
        {
            name: `🎫┆Tickets`,
            value: `\`/tickets help\``,
            inline: true
        },
        {
            name: `⚒️┆Tools`,
            value: `\`/tools help\``,
            inline: true
        },
        {
            name: `🔊┆Voice`,
            value: `\`/voice help\``,
            inline: true
        },
    ];

    client.on('interactionCreate', async (interaction) => {
        if (!interaction.isStringSelectMenu()) return;

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
                            .setURL("https://discord.com/oauth2/authorize?&client_id=798144456528363550&scope=applications.commands+bot&permissions=8")
                            .setStyle("LINK"),

                        new Discord.MessageButton()
                            .setLabel("Support server")
                            .setURL("https://discord.gg/56FZySQaY7")
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
                    desc: `View all command categories in the bot here! \n\n[Website](https://corwindev.nl) | [Invite](${client.config.discord.botInvite}) | [Vote](https://top.gg/bot/798144456528363550/vote)`,
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
                                    desc: `View all command categories in the bot here! \n\n[Website](https://corwindev.nl) | [Invite](${client.config.discord.botInvite}) | [Vote](https://top.gg/bot/798144456528363550/vote)`,
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
                                    desc: `View all command categories in the bot here! \n\n[Website](https://corwindev.nl) | [Invite](${client.config.discord.botInvite}) | [Vote](https://top.gg/bot/798144456528363550/vote)`,
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

 