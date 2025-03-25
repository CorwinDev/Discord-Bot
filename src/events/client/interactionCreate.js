const Discord = require('discord.js');
const Captcha = require("@haileybot/captcha-generator");

const reactionSchema = require("../../database/models/reactionRoles");
const banSchema = require("../../database/models/userBans");
const verify = require("../../database/models/verify");
const Commands = require("../../database/models/customCommand");
const CommandsSchema = require("../../database/models/customCommandAdvanced");
module.exports = async (client, interaction) => {
    // Commands
    if (interaction.isCommand() || interaction.isUserContextMenuCommand()) {
        banSchema.findOne({ User: interaction.user.id }, async (err, data) => {
            if (data) {
                return client.errNormal({
                    error: "You have been banned by the developers of this bot",
                    type: 'ephemeral'
                }, interaction);
            }
            else {
                const cmd = client.commands.get(interaction.commandName);
                if (!cmd){
                    const cmdd = await Commands.findOne({
                        Guild: interaction.guild.id,
                        Name: interaction.commandName,
                    });
                    if (cmdd) {
                        return interaction.channel.send({ content: cmdd.Responce });
                    }

                    const cmdx = await CommandsSchema.findOne({
                        Guild: interaction.guild.id,
                        Name: interaction.commandName,
                    });
                    if (cmdx) {
                        // Remove interaction
                        if (cmdx.Action == "Normal") {
                            return interaction.reply({ content: cmdx.Responce });
                        } else if (cmdx.Action == "Embed") {
                            return client.simpleEmbed(
                                {
                                    desc: `${cmdx.Responce}`,
                                    type: 'reply'
                                },
                                interaction,
                            );
                        } else if (cmdx.Action == "DM") {
                            await interaction.deferReply({ ephemeral: true });
                            interaction.editReply({ content: "I have sent you something in your DMs" });
                            return interaction.user.send({ content: cmdx.Responce }).catch((e) => {
                                client.errNormal(
                                    {
                                        error: "I can't DM you, maybe you have DM turned off!",
                                        type: 'ephemeral'
                                    },
                                    interaction,
                                );
                            });
                        }
                    }
                }
                if (interaction.options._subcommand !== null && interaction.options.getSubcommand() == "help") {
                    const commands = interaction.client.commands.filter(x => x.data.name == interaction.commandName).map((x) => x.data.options.map((c) => '`' + c.name + '` - ' + c.description).join("\n"));

                    return client.embed({
                        title: `❓・Help panel`,
                        desc: `Get help with the commands in \`${interaction.commandName}\` \n\n${commands}`,
                        type: 'reply'
                    }, interaction)
                }

                if(cmd) cmd.run(client, interaction, interaction.options._hoistedOptions).catch(err => {
                    client.emit("errorCreate", err, interaction.commandName, interaction)
                })
            }
        })
    }

    // Verify system with Math Captcha Modal
    if (interaction.isButton() && interaction.customId == "Bot_verify") {
        const data = await verify.findOne({ Guild: interaction.guild.id, Channel: interaction.channel.id });
        if (data) {
            // Generate a simple math question
            let num1 = Math.floor(Math.random() * 10) + 1;
            let num2 = Math.floor(Math.random() * 10) + 1;
            let correctAnswer = num1 + num2;

            // Create a modal
            const modal = new Discord.ModalBuilder()
                .setCustomId('math_verify')
                .setTitle('Verify Yourself')
                .addComponents(
                    new Discord.ActionRowBuilder().addComponents(
                        new Discord.TextInputBuilder()
                            .setCustomId('math_answer')
                            .setLabel(`What is ${num1} + ${num2}?`)
                            .setStyle(Discord.TextInputStyle.Short)
                    )
                );

            await interaction.showModal(modal);
            
            const filter = (i) => i.customId === 'math_verify' && i.user.id === interaction.user.id;
            interaction.awaitModalSubmit({ filter, time: 60000 })
                .then(async modalInteraction => {
                    let userAnswer = parseInt(modalInteraction.fields.getTextInputValue('math_answer'));

                    if (userAnswer === correctAnswer) {
                        let verifyUser = interaction.guild.members.cache.get(interaction.user.id);
                        verifyUser.roles.add(data.Role);
                        await modalInteraction.reply({ content: "✅ You have been successfully verified!", ephemeral: true });
                    } else {
                        await modalInteraction.reply({ content: "❌ Incorrect answer! Please try again.", ephemeral: true });
                    }
                })
                .catch(err => console.error(err));
        } else {
            client.errNormal({
                error: "Verify is disabled in this server! Or you are using the wrong channel!",
                type: 'ephemeral'
            }, interaction);
        }
    }

    // Reaction roles button
    if (interaction.isButton()) {
        var buttonID = interaction.customId.split("-");

        if (buttonID[0] == "reaction_button") {
            reactionSchema.findOne({ Message: interaction.message.id }, async (err, data) => {
                if (!data) return;

                const [roleid] = data.Roles[buttonID[1]];

                if (interaction.member.roles.cache.get(roleid)) {
                    interaction.guild.members.cache.get(interaction.user.id).roles.remove(roleid).catch(error => { })

                    interaction.reply({ content: `<@&${roleid}> was removed!`, ephemeral: true });
                }
                else {
                    interaction.guild.members.cache.get(interaction.user.id).roles.add(roleid).catch(error => { })

                    interaction.reply({ content: `<@&${roleid}> was added!`, ephemeral: true });
                }
            })
        }
    }

    // Reaction roles select
    if (interaction.isStringSelectMenu()) {
        if (interaction.customId == "reaction_select") {
            reactionSchema.findOne(
                { Message: interaction.message.id },
                async (err, data) => {
                    if (!data) return;

                    let roles = "";

                    for (let i = 0; i < interaction.values.length; i++) {
                        const [roleid] = data.Roles[interaction.values[i]];

                        roles += `<@&${roleid}> `;

                        if (interaction.member.roles.cache.get(roleid)) {
                            interaction.guild.members.cache
                                .get(interaction.user.id)
                                .roles.remove(roleid)
                                .catch((error) => { });
                        } else {
                            interaction.guild.members.cache
                                .get(interaction.user.id)
                                .roles.add(roleid)
                                .catch((error) => { });
                        }

                        if ((i + 1) === interaction.values.length) {
                            interaction.reply({
                                content: `I have updated the following roles for you: ${roles}`,
                                ephemeral: true,
                            });
                        }
                    }
                }
            );
        }
    }
    // Tickets
    if (interaction.customId == "Bot_openticket") {
        return require(`${process.cwd()}/src/commands/tickets/create.js`)(client, interaction);
    }

    if (interaction.customId == "Bot_closeticket") {
        return require(`${process.cwd()}/src/commands/tickets/close.js`)(client, interaction);
    }

    if (interaction.customId == "Bot_claimTicket") {
        return require(`${process.cwd()}/src/commands/tickets/claim.js`)(client, interaction);
    }

    if (interaction.customId == "Bot_transcriptTicket") {
        return require(`${process.cwd()}/src/commands/tickets/transcript.js`)(client, interaction);
    }

    if (interaction.customId == "Bot_openTicket") {
        return require(`${process.cwd()}/src/commands/tickets/open.js`)(client, interaction);
    }

    if (interaction.customId == "Bot_deleteTicket") {
        return require(`${process.cwd()}/src/commands/tickets/delete.js`)(client, interaction);
    }

    if (interaction.customId == "Bot_noticeTicket") {
        return require(`${process.cwd()}/src/commands/tickets/notice.js`)(client, interaction);
    }
}

 
