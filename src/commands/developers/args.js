const Discord = require('discord.js');

module.exports = async (client, interaction, args) => {
    const message = interaction.options.getString('message');

    client.succNormal({
        text: `Message has been sent successfully!`,
        type: 'ephemeraledit'
    }, interaction);

    if (message == "information") {
        client.simpleEmbed({
            image: `https://cdn.discordapp.com/attachments/843487478881976381/874742689017520128/Bot_banner_information.jpg`
        }, interaction.channel).then(() => {
            client.embed({
                title: `ℹ️・Information`,
                thumbnail: client.user.avatarURL({ size: 1024 }),
                desc: `_____`,
                fields: [
                    {
                        name: `👋┆Welcome to ${interaction.guild.name}!`,
                        value: `Welcome to our hangout place! Meet new people here, play some games and participate in seasonal events! We are a server where we bring everyone together and we try to make it comfortable for everyone! Please be welcome and have some fun!`,
                    },
                    {
                        name: `❓┆What can I do here?`,
                        value: `- Meet new people! \n- Play many fun games! \n- Discover the seasons! \n- Participate in events! \nAnd…. Last but not least, choose your own roles at <#847867992044994561>!`,
                    },
                    {
                        name: `🎫┆How do I get help when needed?`,
                        value: `You can make a ticket in <#820308164322656327>! We are happy to help you with your questions here and offer support in your server!`,
                    },
                    {
                        name: `⚙️┆I want to help Bot Hangout to improve!`,
                        value: `- Go to applications and see what kind of jobs are available! \n- Or make a ticket and ask if you can help with certain things! \n\n**We wish you a very nice and happy time here!**`,
                    }
                ]
            }, interaction.channel)
        })
    }

    if (message == "rules") {
        client.simpleEmbed({
            image: `https://cdn.discordapp.com/attachments/843487478881976381/874742702393131038/Bot_banner_rules.jpg`
        }, interaction.channel).then(async () => {
            await client.embed({
                title: `📃・Rules`,
                thumbnail: client.user.avatarURL({ size: 1024 }),
                desc: `_____ \n\nThese are our server rules. Please stick to this to keep it fun for everyone. The Admins and Mods will Timeout/Kick/Ban per discretion`,
            }, interaction.channel)

            await client.embed({
                title: `1. Be respectful`,
                desc: `You must respect all users, regardless of your liking towards them. Treat others the way you want to be treated.`,
            }, interaction.channel)

            await client.embed({
                title: `2. No Inappropriate Language`,
                desc: `The use of profanity should be kept to a minimum. However, any derogatory language towards any user is prohibited.`,
            }, interaction.channel)

            await client.embed({
                title: `3. No spamming`,
                desc: `Don't send a lot of small messages right after each other. Do not disrupt chat by spamming.`,
            }, interaction.channel)

            await client.embed({
                title: `4. No pornographic/adult/other NSFW material`,
                desc: `This is a community server and not meant to share this kind of material.`,
            }, interaction.channel)

            await client.embed({
                title: `5. No advertisements`,
                desc: `We do not tolerate any kind of advertisements, whether it be for other communities or streams. You can post your content in the media channel if it is relevant and provides actual value (Video/Art)`,
            }, interaction.channel)

            await client.embed({
                title: `6. No offensive names and profile pictures`,
                desc: `You will be asked to change your name or picture if the staff deems them inappropriate.`,
            }, interaction.channel)

            await client.embed({
                title: `7. Server Raiding`,
                desc: `Raiding or mentions of raiding are not allowed.`,
            }, interaction.channel)

            await client.embed({
                title: `8. Direct & Indirect Threats`,
                desc: `Threats to other users of DDoS, Death, DoX, abuse, and other malicious threats are absolutely prohibited and disallowed.`,
            }, interaction.channel)

            await client.embed({
                title: `9. Follow the Discord Community Guidelines`,
                desc: `You can find them here: https://discordapp.com/guidelines`,
            }, interaction.channel)

            await client.embed({
                title: `10. Do not join voice chat channels without permissions of the people already in there`,
                desc: `If you see that they have a free spot it is alright to join and ask whether they have an open spot, but leave if your presence is not wanted by whoever was there first`,
            }, interaction.channel)
        })
    }

    if (message == "applications") {
        client.simpleEmbed({
            image: `https://cdn.discordapp.com/attachments/843487478881976381/874742737415581786/Bot_banner_applications.jpg`
        }, interaction.channel).then(() => {
            client.embed({
                title: `💼・Applications`,
                thumbnail: client.user.avatarURL({ size: 1024 }),
                desc: `_____ \n\nWhat could be more fun than working at the best bot/server? We regularly have spots for new positions that you can apply for \n\nBut... what can you expect?`,
                fields: [
                    {
                        name: `👥┆A very nice team`,
                        value: `In the Bot team there is always a pleasant atmosphere and everyone is treated equally!`,
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
                        value: `**Moderator** \nYou keep yourself busy with the server that everything is and remains fun for everyone! Chat with us and keep the overview \n\n**Marketing** \nWe also want to grow and we do that with a great marketing team! You know better than anyone how to make a server grow well \n\n**Organization** \nYou will ensure an even nicer atmosphere in the server! Together with a team you work on new and fun events to make the server even more fun!`,
                    },
                    {
                        name: `📃┆Apply?`,
                        value: `Create a ticket to receive your application!`,
                    }
                ]
            }, interaction.channel)
        })
    }

    if (message == "boosterperks") {
        client.simpleEmbed({
            image: `https://media.discordapp.net/attachments/843487478881976381/881396544195149874/Bot_banner_boosters.jpg`
        }, interaction.channel).then(() => {
            client.embed({
                title: `💎・Booster Perks`,
                thumbnail: client.user.avatarURL({ size: 1024 }),
                desc: `_____ \n\nMore options in the server? Become a real Bot Booster and get nice benefits for a nice experience. But what do you actually get?`,
                fields: [
                    {
                        name: `😛┆Use external stickers`,
                        value: `Use stickers from other servers in our server`,
                    },
                    {
                        name: `🔊┆Send TTS messages`,
                        value: `Send messages that have a sound attached`,
                    },
                    {
                        name: `🤔┆Access to the hidden lounge`,
                        value: `Get access to a private lounge and chat with other boosters!`,
                    },
                    {
                        name: `📛┆Change your nickname`,
                        value: `Change your name in the server. This is how you stand out in the server`,
                    },
                    {
                        name: `💭┆Create public/private threads`,
                        value: `Create a thread in our text channels`,
                    },
                    {
                        name: `🎉┆Private giveaways`,
                        value: `Get access to fun exclusive giveaways`,
                    },
                    {
                        name: `📂┆Send files in any channel`,
                        value: `Send files in all channels where you can talk`,
                    },
                    {
                        name: `📊┆Get access to a special promotional channel`,
                        value: `Get the opportunity to promote your own server in a special channel`,
                    },
                    {
                        name: `😜┆Custom role of your choice`,
                        value: `Create your own role that you can set yourself`,
                    },
                    {
                        name: `💎┆Get the booster role + badge`,
                        value: `Stand out with a nice booster role and a booster badge!`,
                    },
                    {
                        name: `💻┆Access to new bèta updates in Bot`,
                        value: `We'll give your server access to updates that aren't out yet! How nice is that?`,
                    }
                ]
            }, interaction.channel)
        })
    }

    if (message == "links") {
        client.simpleEmbed({
            image: `https://media.discordapp.net/attachments/843487478881976381/881396544195149874/Bot_banner_boosters.jpg`
        }, interaction.channel).then(() => {
            client.embed({
                title: `🔗・Links`,
                thumbnail: client.user.avatarURL({ size: 1024 }),
                desc: `_____ \n\nSee all the links from Bot Network!`,
                fields: [
                    {
                        name: `▬▬│Servers│▬▬`,
                        value: ``,
                    }
                ]
            }, interaction.channel)
        })
    }

    if (message == "rewards") {
        client.embed({
            title: `😜・Role Rewards`,
            thumbnail: client.user.avatarURL({ size: 1024 }),
            desc: `_____ \n\nDo you want some extras in the server? Or do you want to stand out more in the server? Look below for the rewards`,
            fields: [
                {
                    name: `🏆┆Levels`,
                    value: `- Level 5   | <@&833307296699908097>\n- Level 10  | <@&833307450437664838>\n- Level 15  | <@&833307452279226379>\n- Level 30 | <@&915290300757458964>\n- Level 40 | <@&915290324480430080>`,
                },
                {
                    name: `🥳┆Special`,
                    value: `- 1 server vote | <@&833959913742794772>\n- 1 boost | <@&744208324022501447>\n- 1 donate | <@&849554599371210793>`,
                },
                {
                    name: `💰┆Economy`,
                    value: `- $10.000 | <@&890720270086733854>\n- $15.000 | <@&833936202725720084>\n- $20.000 | <@&833936185167839232> \n- $25.000 | <@&928236333309255711> \n- $30.000 | <@&928235747100733450>`,
                }
            ]
        }, interaction.channel)
    }

    if (message == "ourbots") {
        client.simpleEmbed({
            image: `https://cdn.discordapp.com/attachments/843487478881976381/874742741224022016/Bot_banner_bot_info.jpg`
        }, interaction.channel).then(() => {
            client.embed({
                title: `🤖・Our bots`,
                thumbnail: client.user.avatarURL({ size: 1024 }),
                desc: `_____ \n\nOutside of a community we also maintain 2 public bots. These bots are all made to make your server better!`,
                fields: [
                    {
                        name: `📘┆What is Bot?`,
                        value: `Bot is a bot with which you can run your entire server! With no less than 400+ commands, we have a large bot with many options to improve your server! You know what else is beautiful? All of this is **FREE** to use!`,
                    },
                    {
                        name: `🎶┆What is Bot 2?`,
                        value: `Bot 2 was created for additional music. This way you never get in each other's way when someone is already listening to music. Furthermore, this bot contains a soundboard and a radio system`,
                    },
                    {
                        name: `📨┆How do I invite the bots?`,
                        value: `You can invite the bots by doing \`/invite\` or by clicking on the links below \n\n**Bot** - [Invite here](${client.config.discord.botInvite})`,
                    },
                    {
                        name: `🎫┆How do I get help when needed?`,
                        value: `You can make a ticket in <#820308164322656327>! We are happy to help you with your questions here and offer support in your server!`,
                    }
                ]
            }, interaction.channel)
        })
    }
}

 