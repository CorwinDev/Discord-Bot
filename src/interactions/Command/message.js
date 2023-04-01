const { CommandInteraction, Client } = require('discord.js');
const { SlashCommandBuilder } = require('discord.js');
const Discord = require('discord.js');
const model = require('../../database/models/badge');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('message')
        .setDescription('Post preset messages')
        .addStringOption(option =>
            option.setName('message')
                .setDescription('Select a message')
                .setRequired(true)
                .addChoices(
                    { name: 'Information', value: 'information' },
                    { name: 'Rules', value: 'rules' },
                    { name: 'Applications', value: 'applications' },
                    { name: 'Helpdesk', value: 'helpdesk' },
                    { name: 'Network', value: 'network' },
                    { name: 'Bot-Info', value: 'botinfo' },
                    { name: 'Bot-Badges', value: 'badges' },
                    { name: 'Bot-Béta', value: 'beta' },
                    { name: 'Bot-Credits', value: 'credits' }
                )
        )
    ,

    /** 
     * @param {Client} client
     * @param {CommandInteraction} interaction
     * @param {String[]} args
     */

    run: async (client, interaction, args) => {
        await interaction.deferReply({ fetchReply: true });
        model.findOne({ User: interaction.user.id }, async (err, data) => {
            if (data && data.FLAGS.includes("DEVELOPER")) {

                const message = interaction.options.getString('message');

                client.succNormal({
                    text: `Message has been sent successfully!`,
                    type: 'ephemeraledit'
                }, interaction);

                if (message == "information") {
                    client.simpleEmbed({
                        image: `https://media.discordapp.net/attachments/937337957419999272/937338297036967946/techpoint_channel_banner_about.jpg?width=812&height=221`
                    }, interaction.channel).then(() => {
                        client.embed({
                            title: `ℹ️・Information`,
                            author: {
                                name: "TechPoint",
                                iconURL: "https://media.discordapp.net/attachments/937337957419999272/937797574440681472/techpoint_logo-min.jpg?width=812&height=812"
                            },
                            thumbnail: "https://media.discordapp.net/attachments/937337957419999272/937463192265846784/techpoint_logo_Bot.jpg?width=812&height=812",
                            fields: [
                                {
                                    name: `👋┆Welcome to Bot Support!`,
                                    value: `Welcome to your support server! We focus on our bots Bot & Bot 2. Stay up to date, ask your questions and test out our bots.`,
                                },
                                {
                                    name: `❓┆What can I do here?`,
                                    value: `- Read the latest bot news\n- Test bot commands\n- Ask questions\n- Get help with setting up the bot in your server`,
                                },
                                {
                                    name: `🤖┆What are Bot & Bot 2?`,
                                    value: `You can find this information in the <#897221483460444170> channel.`,
                                },
                                {
                                    name: `🔗┆Other servers from us`,
                                    value: `[Tech server](https://discord.gg/bEJhVa6Ttv) - Get help with code, tech and crypto while you read the latest news\n[Ban Appeal](https://discord.gg/htf9pHNRxA) - Got banned? Request an unban`,
                                },
                            ],
                            footer: {
                                text: `© TechPoint - 2022`,
                                iconURL: "https://media.discordapp.net/attachments/937337957419999272/937797574440681472/techpoint_logo-min.jpg?width=812&height=812"
                            }
                        }, interaction.channel)
                    })
                }

                if (message == "rules") {
                    client.simpleEmbed({
                        image: `https://media.discordapp.net/attachments/937337957419999272/937338297968123904/techpoint_channel_banner_rules.jpg?width=812&height=221`
                    }, interaction.channel).then(() => {
                        client.embed({
                            title: `📃・Rules`,
                            author: {
                                name: "TechPoint",
                                iconURL: "https://media.discordapp.net/attachments/937337957419999272/937797574440681472/techpoint_logo-min.jpg?width=812&height=812"
                            },
                            thumbnail: "https://media.discordapp.net/attachments/937337957419999272/937463192265846784/techpoint_logo_Bot.jpg?width=812&height=812",
                            desc: `These are our server rules. Please stick to this to keep it fun for everyone. The Admins and Mods will Timeout/Kick/Ban per discretion`,
                            fields: [
                                {
                                    name: `1. Be respectful`,
                                    value: `You must respect all users, regardless of your liking towards them. Treat others the way you want to be treated.`,
                                },
                                {
                                    name: `2. No Inappropriate Language`,
                                    value: `The use of profanity should be kept to a minimum. However, any derogatory language towards any user is prohibited.`,
                                },
                                {
                                    name: `3. No spamming`,
                                    value: `Don't send a lot of small messages right after each other. Do not disrupt chat by spamming.`,
                                }, {
                                    name: `4. No pornographic/adult/other NSFW material`,
                                    value: `This is a community server and not meant to share this kind of material.`,
                                },
                                {
                                    name: `5. No advertisements`,
                                    value: `We do not tolerate any kind of advertisements, whether it be for other communities or streams. You can post your content in the media channel if it is relevant and provides actual value (Video/Art)`,
                                },
                                {
                                    name: `6. No offensive names and profile pictures`,
                                    value: `You will be asked to change your name or picture if the staff deems them inappropriate.`,
                                },
                                {
                                    name: `7. Server Raiding`,
                                    value: `Raiding or mentions of raiding are not allowed.`,
                                },
                                {
                                    name: `8. Direct & Indirect Threats`,
                                    value: `Threats to other users of DDoS, Death, DoX, abuse, and other malicious threats are absolutely prohibited and disallowed.`,
                                },
                                {
                                    name: `9. Follow the Discord Community Guidelines`,
                                    value: `You can find them here: https://discordapp.com/guidelines`,
                                },
                                {
                                    name: `10. Do not join voice chat channels without permissions of the people already in there`,
                                    value: `If you see that they have a free spot it is alright to join and ask whether they have an open spot, but leave if your presence is not wanted by whoever was there first`,
                                }
                            ],
                            footer: {
                                text: `© TechPoint - 2022`,
                                iconURL: "https://media.discordapp.net/attachments/937337957419999272/937797574440681472/techpoint_logo-min.jpg?width=812&height=812"
                            }
                        }, interaction.channel)
                    })
                }

                if (message == "applications") {
                    client.simpleEmbed({
                        image: `https://media.discordapp.net/attachments/937337957419999272/938725909068918854/techpoint_channel_banner_applications.jpg?width=812&height=221`
                    }, interaction.channel).then(() => {
                        client.embed({
                            title: `💼・Applications`,
                            author: {
                                name: "TechPoint",
                                iconURL: "https://media.discordapp.net/attachments/937337957419999272/937797574440681472/techpoint_logo-min.jpg?width=812&height=812"
                            },
                            thumbnail: "https://media.discordapp.net/attachments/937337957419999272/937463192265846784/techpoint_logo_Bot.jpg?width=812&height=812",
                            desc: `What could be more fun than working at the best bot/server? We regularly have spots for new positions that you can apply for \n\nBut... what can you expect?`,
                            fields: [
                                {
                                    name: `👥┆A very nice team`,
                                    value: `In the Techpoint Network team there is always a pleasant atmosphere and everyone is treated equally!`,
                                },
                                {
                                    name: `🥳┆Access to the beta program`,
                                    value: `Get access to unreleased Bot features with your own server! You are a real Bot tester!`,
                                },
                                {
                                    name: `📛┆A nice rank and badge`,
                                    value: `You will get a nice rank in the server and a team badge in our userinfo command. Everyone can see that you contribute to the team`,
                                },
                                {
                                    name: `📖┆Learn and grow`,
                                    value: `We understand that you don't always understand everything right away! At Bot, we give you the opportunity to learn new things and get better at the position. You can also grow into the management team in the future!`,
                                },
                                {
                                    name: `📘┆What does everything mean?`,
                                    value: `**Moderator/Support** \nYou keep yourself busy with the server that everything is and remains fun for everyone! Chat with us and keep the overview and help people with their questions.\n\n**Marketing** \nWe also want to grow and we do that with a great marketing team! You know better than anyone how to make a server grow well`,
                                },
                                {
                                    name: `📃┆Apply?`,
                                    value: `Create a ticket to receive your application!`,
                                }
                            ],
                            footer: {
                                text: `© TechPoint - 2022`,
                                iconURL: "https://media.discordapp.net/attachments/937337957419999272/937797574440681472/techpoint_logo-min.jpg?width=812&height=812"
                            }
                        }, interaction.channel)
                    })
                }

                if (message == "helpdesk") {
                    client.simpleEmbed({
                        image: `https://media.discordapp.net/attachments/937337957419999272/938725908687233034/techpoint_channel_banner_helpdesk.jpg?width=812&height=221`
                    }, interaction.channel).then(() => {
                        client.embed({
                            title: `🎫・Helpdesk`,
                            author: {
                                name: "TechPoint",
                                iconURL: "https://media.discordapp.net/attachments/937337957419999272/937797574440681472/techpoint_logo-min.jpg?width=812&height=812"
                            },
                            thumbnail: "https://media.discordapp.net/attachments/937337957419999272/937463192265846784/techpoint_logo_Bot.jpg?width=812&height=812",
                            desc: `What could be more fun than working at the best bot/server? We regularly have spots for new positions that you can apply for \n\nBut... what can you expect?`,
                            fields: [
                                {
                                    name: `❓┆I have a question!`,
                                    value: `We advise you to ask your question in <#937486956697370674> first. Here there are often already team members or other people who can help you. If it still doesn't work, create a ticket.`,
                                },
                                {
                                    name: `📄┆Ticket Rules`,
                                    value: `**1.** Be patient so don't tag unnecessarily \n**2.** Only open a maximum of 1 ticket at a time \n**3.** No inappropriate behavior in tickets \n**4.** Don't make a ticket for nonsense`,
                                },
                                {
                                    name: `⏰┆Response time`,
                                    value: `**08:00 - 16:00** - (+/- 1 hour) \n**16:00 - 22:00** - (+/- 30 minutes) \n**22:00 - 08:00** - (+/- 1+ hour)`,
                                },
                            ],
                            footer: {
                                text: `© TechPoint - 2022`,
                                iconURL: "https://media.discordapp.net/attachments/937337957419999272/937797574440681472/techpoint_logo-min.jpg?width=812&height=812"
                            }
                        }, interaction.channel)
                    })

                }

                if (message == "network") {
                    client.simpleEmbed({
                        image: `https://media.discordapp.net/attachments/937337957419999272/938725909387698216/techpoint_channel_banner_network.jpg?width=812&height=221`
                    }, interaction.channel).then(() => {
                        client.embed({
                            title: `🏢・Network`,
                            thumbnail: "https://media.discordapp.net/attachments/937337957419999272/937463192265846784/techpoint_logo_Bot.jpg?width=812&height=812",
                            author: {
                                name: "TechPoint",
                                iconURL: "https://media.discordapp.net/attachments/937337957419999272/937797574440681472/techpoint_logo-min.jpg?width=812&height=812"
                            },
                            desc: `Techpoint Network is a network that consists of 3 servers. Each server has its own function. One is for tech/coding/crypto and the other for support. We also have 1 extra server for ban appeals, read all information below`,
                            fields: [
                                {
                                    name: `💻┇TechPoint`,
                                    value: `This is a server that mainly focused on everything that revolves around tech. For example, think of encryption, crypt or all new gadgets. Meet new people or learn more about tech yourself!. You can join this server by clicking [this](https://discord.gg/bEJhVa6Ttv) link`,
                                },
                                {
                                    name: `🤖┇Bot Support`,
                                    value: `This is the server you are currently on. All information about this server can be found in. You can get the link from this server to click on [this](https://discord.gg/GqhD6RNbzs) link`,
                                },
                                {
                                    name: `🔨┇TechPoint Ban Appeal`,
                                    value: `This server is for the people who are banned from a server or from the bots. You can create a ticket here to request an unban and to participate in the servers again or to be able to use the bots again. You can join this server by clicking [this](https://discord.gg/q9jZrDk9n6) link`,
                                },
                            ],
                            footer: {
                                text: `© TechPoint - 2022`,
                                iconURL: "https://media.discordapp.net/attachments/937337957419999272/937797574440681472/techpoint_logo-min.jpg?width=812&height=812"
                            }
                        }, interaction.channel)
                    })

                }

                if (message == "botinfo") {
                    client.simpleEmbed({
                        image: `https://media.discordapp.net/attachments/937337957419999272/938725909668691978/techpoint_channel_banner_Bot.jpg?width=812&height=221`
                    }, interaction.channel).then(() => {
                        client.embed({
                            title: `ℹ・Bot(s) Information`,
                            author: {
                                name: "TechPoint",
                                iconURL: "https://media.discordapp.net/attachments/937337957419999272/937797574440681472/techpoint_logo-min.jpg?width=812&height=812"
                            },
                            thumbnail: "https://media.discordapp.net/attachments/937337957419999272/937463192265846784/techpoint_logo_Bot.jpg?width=812&height=812",
                            desc: `Outside of a community we also maintain 2 public bots. These bots are all made to make your server better!`,
                            fields: [
                                {
                                    name: `🤖┆What is Bot?`,
                                    value: `Bot is a bot with which you can run your entire server! With no less than 400+ commands, we have a large bot with many options to improve your server and the best part is that it is completely in slash commands! You know what else is beautiful? All of this is **FREE** to use!`,
                                },
                                {
                                    name: `🎶┆What is Bot 2?`,
                                    value: `Bot 2 was created for additional music. This way you never get in each other's way when someone is already listening to music. Furthermore, this bot contains a soundboard and a radio system and the best part is that it is completely in slash commands!`,
                                },
                                {
                                    name: `📨┆How do I invite the bots?`,
                                    value: `You can invite the bots by doing \`/invite\` or by clicking on the links below\n\n**Bot Invite** - [Invite Here](https://discord.com/oauth2/authorize?&client_id=798144456528363550&scope=applications.commands+bot&permissions=8)\n**Bot 2 Invite** - [Invite Here](${client.config.discord.botInvite})`,
                                },
                                {
                                    name: `🎫┆How do I get help when needed?`,
                                    value: `You can ask your questions in the general chat or for further information you can take a look in <#897213893624102965>.`,
                                },
                            ],
                            footer: {
                                text: `© TechPoint - 2022`,
                                iconURL: "https://media.discordapp.net/attachments/937337957419999272/937797574440681472/techpoint_logo-min.jpg?width=812&height=812"
                            }
                        }, interaction.channel)
                    })

                }

                if (message == "badges") {
                    client.simpleEmbed({
                        image: `https://media.discordapp.net/attachments/937337957419999272/938725908028751882/techpoint_channel_banner_soon.jpg?width=813&height=221`
                    }, interaction.channel)
                    // .then(() => {
                    //     client.embed({
                    //         title: `🥇・Badges`,
                    //         thumbnail: "https://media.discordapp.net/attachments/937337957419999272/938725906728513576/techpoint_channel_banner_badges.jpg?width=813&height=221",
                    //         desc: `We at Bot have a special badge system! You can find your badge via the userinfo command. Read below what each badge means`,
                    //         fields: [
                    //             {
                    //                 name: `${client.emotes.badges.bot}┆Bot badge`,
                    //                 value: `This badge is only available for the Bot(s). This way you can see even better that they belong together.`,
                    //             },
                    //             {
                    //                 name: `${client.emotes.badges.developer}┆Developer badge`,
                    //                 value: `This badge is only available to Bot developers. This shows that they are official developers of the bots.`,
                    //             },
                    //             {
                    //                 name: `${client.emotes.badges.management}┆Management badge`,
                    //                 value: `You can get this badge if you are an official management member of team Bot.`,
                    //             },
                    //             {
                    //                 name: `${client.emotes.badges.team}┆Team badge`,
                    //                 value: `You can get this badge if you are an official team member of team Bot.`,
                    //             },
                    //             {
                    //                 name: `${client.emotes.badges.support}┆Support badge`,
                    //                 value: `You can get this badge if you are an official support member of team Bot.`,
                    //             },
                    //             {
                    //                 name: `${client.emotes.badges.moderator}┆Moderator badge`,
                    //                 value: `You can get this badge if you are an official moderator of team Bot.`,
                    //             },
                    //             {
                    //                 name: `${client.emotes.badges.marketing}┆Marketing badge`,
                    //                 value: `You can get this badge if you are an official marketing member of team Bot.`,
                    //             },
                    //             {
                    //                 name: `${client.emotes.badges.event}┆Organization badge`,
                    //                 value: `You can get this badge if you are an official organization member of team Bot.`,
                    //             },
                    //             {
                    //                 name: `${client.emotes.badges.designer}┆Designer badge`,
                    //                 value: `You can get this badge if you are an official designer of team Bot.`,
                    //             },
                    //             {
                    //                 name: `${client.emotes.badges.booster}┆Booster badge`,
                    //                 value: `You can get this badge if you have boosted a server within our network.`,
                    //             },
                    //             {
                    //                 name: `${client.emotes.badges.partner}┆Partner badge`,
                    //                 value: `You can get this badge if you are official partnerd with our server.`,
                    //             },
                    //             {
                    //                 name: `${client.emotes.badges.bug}┆Bug Hunter badge`,
                    //                 value: `You can get this badge if you have reported more than 5 bugs in our bot.`,
                    //             },
                    //             {
                    //                 name: `${client.emotes.badges.supporter}┆Supporter badge`,
                    //                 value: `You can get this badge if you have given something to Bot to improve the bot even more.`,
                    //             },
                    //             {
                    //                 name: `${client.emotes.badges.voter}┆Voter badge`,
                    //                 value: `You can get this badge if you have voted for our bots or servers.`,
                    //             },
                    //             {
                    //                 name: `${client.emotes.badges.vip}┆Vip badge`,
                    //                 value: `You can get this badge if you have bought the vip role in the economy system.`,
                    //             },
                    //             {
                    //                 name: `${client.emotes.badges.active}┆Active badge`,
                    //                 value: `You can get this badge if you have bought the active role in the economy system.`,
                    //             }
                    //         ],
                    //         footer: {
                    //             text: `© TechPoint - 2022`,
                    //             iconURL: "https://media.discordapp.net/attachments/937337957419999272/937797574440681472/techpoint_logo-min.jpg?width=812&height=812"
                    //         }
                    //     }, interaction.channel)
                    // })

                }

                if (message == "beta") {
                    client.simpleEmbed({
                        image: `https://media.discordapp.net/attachments/937337957419999272/938725907097604116/techpoint_channel_banner_beta.jpg?width=813&height=221`
                    }, interaction.channel).then(() => {
                        client.embed({
                            title: `🐞・Béta`,
                            author: {
                                name: "TechPoint",
                                iconURL: "https://media.discordapp.net/attachments/937337957419999272/937797574440681472/techpoint_logo-min.jpg?width=812&height=812"
                            },
                            thumbnail: "https://media.discordapp.net/attachments/937337957419999272/937463192265846784/techpoint_logo_Bot.jpg?width=812&height=812",
                            desc: `The Bot Beta program is a program for new updates that still contains some bugs. Because of this program there are fewer bugs at the release! Everything happens via another bot so that the current bot users are not bothered by the beta testing`,
                            fields: [
                                {
                                    name: `📃┆Requirements for participation`,
                                    value: `- Minimum 50 members in the server \n- No test servers \n- Following the Discord and Bot TOS \n- Active server`,
                                },
                                {
                                    name: `❓┆How does it work?`,
                                    value: `You are going to use a beta bot. This does mean that the bot does not work 100% on some points. Keep this in mind when you sign up!`,
                                },
                                {
                                    name: `💼┆I want to apply!`,
                                    value: `Nice that you want to participate in Bot! We ask you to create a ticket in us <#897213893624102965> We will send a form and possibly additional information \n\n**Pay attention!** When the update is out you will be removed from our program!`,
                                }
                            ],
                            footer: {
                                text: `© TechPoint - 2022`,
                                iconURL: "https://media.discordapp.net/attachments/937337957419999272/937797574440681472/techpoint_logo-min.jpg?width=812&height=812"
                            }
                        }, interaction.channel)
                    })

                }

                if (message == "credits") {
                    client.simpleEmbed({
                        image: `https://media.discordapp.net/attachments/937337957419999272/938725907659644928/techpoint_channel_banner_credits.png?width=813&height=221`
                    }, interaction.channel).then(() => {
                        client.embed({
                            title: `${client.user.username}・Dcredits`,
                            author: {
                                name: "TechPoint",
                                iconURL: "https://media.discordapp.net/attachments/937337957419999272/937797574440681472/techpoint_logo-min.jpg?width=812&height=812"
                            },
                            thumbnail: "https://media.discordapp.net/attachments/937337957419999272/937463192265846784/techpoint_logo_Bot.jpg?width=812&height=812",
                            fields: [
                                {
                                    name: `ℹ️┆What are Dcredits?`,
                                    value: `Dcredits are credits you get when you perform certain actions! You can exchange this for nice benefits for you and your server`,
                                },
                                {
                                    name: `❓┆How do you get Dcredits?`,
                                    value: `Currently you only get Dcredits when you vote on Bot. You can do this on top.gg! The credits will then be automatically added to your account!`,
                                },
                                {
                                    name: `💱┆What can you exchange Dcredits for?`,
                                    value: `- Bot background pack (8 credits per pack)\n- Bot logo pack (6 credits per pack)\n- Bot sticker pack (5 credits per pack)\n- Bot 1 year pack (10 credits per pack)`,
                                },
                                {
                                    name: `🎁┆How do I redeem Dcredits?`,
                                    value: `For a background pack: \`/dcredits backgroundpack\`\nFor a logo pack: \`/dcredits logopack\`\nFor a sticker pack: \`/dcredits stickerpack\`\nFor a 1 year pack: \`/dcredits 1yearpack\``,
                                },
                                {
                                    name: `🐞┆I have discovered a bug is the system`,
                                    value: `If something went wrong with your credits? Open a ticket in our <#897213893624102965> and we will solve this as soon as possible!`,
                                }
                            ],
                            footer: {
                                text: `© TechPoint - 2022`,
                                iconURL: "https://media.discordapp.net/attachments/937337957419999272/937797574440681472/techpoint_logo-min.jpg?width=812&height=812"
                            }
                        }, interaction.channel)
                    })

                }
            }
            else {
                return client.errNormal({ text: "Only Bot 2 developers are allowed to do this", editreply: true }, interaction);
            }
        })
    },
};

 