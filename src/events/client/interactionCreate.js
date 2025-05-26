const Discord = require('discord.js');
const Captcha = require("@haileybot/captcha-generator");

const reactionSchema = require("../../database/models/reactionRoles");
const banSchema = require("../../database/models/userBans");
const verify = require("../../database/models/verify");
const Commands = require("../../database/models/customCommand");
const CommandsSchema = require("../../database/models/customCommandAdvanced");
const { model: AnnouncementChannels } = require("../../database/models/announcement-channels");
const { ReminderManager, createManager } = require("../../handlers/functions/eventReminders");

module.exports = async (client, interaction) => {
    const reminderManager = createManager();

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

    // Verify system
    if (interaction.isButton() && interaction.customId == "Bot_verify") {
        const data = await verify.findOne({ Guild: interaction.guild.id, Channel: interaction.channel.id });
        if (data) {
            let captcha = new Captcha();

            try {
                var image = new Discord.AttachmentBuilder(captcha.JPEGStream, {name:"captcha.jpeg"});

                interaction.reply({ files: [image], fetchReply: true }).then(function (msg) {
                    const filter = s => s.author.id == interaction.user.id;

                    interaction.channel.awaitMessages({ filter, max: 1 }).then(response => {
                        if (response.first().content === captcha.value) {
                            response.first().delete();
                            msg.delete();

                            client.succNormal({
                                text: "You have been successfully verified!"
                            }, interaction.user).catch(error => { })

                            var verifyUser = interaction.guild.members.cache.get(interaction.user.id);
                            verifyUser.roles.add(data.Role);
                        }
                        else {
                            response.first().delete();
                            msg.delete();

                            client.errNormal({
                                error: "You have answered the captcha incorrectly!",
                                type: 'editreply'
                            }, interaction).then(msgError => {
                                setTimeout(() => {
                                    msgError.delete();
                                }, 2000)
                            })
                        }
                    })
                })
            }
            catch (error) {
                console.log(error)
            }
        }
        else {
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

    // Event reminders configuration
    if (interaction.customId === "event_reminders_enable" || interaction.customId === "event_reminders_disable") {
        const thread = interaction.channel;
        if (!thread.isThread()) return;

        try {
            const data = await AnnouncementChannels.findOne({
                Guild: interaction.guildId,
                'EventThreads.threadId': thread.id
            });

            const eventThread = data?.EventThreads?.find(et => et.threadId === thread.id);
            if (!eventThread) return;

            // Vérifier que l'utilisateur est le créateur de l'événement
            const event = await interaction.guild.scheduledEvents.fetch(eventThread.eventId).catch(() => null);
            if (!event || event.creatorId !== interaction.user.id) {
                return interaction.reply({
                    content: "❌ Seul le créateur de l'événement peut modifier les paramètres de rappel.",
                    ephemeral: true
                });
            }

            const enableReminders = interaction.customId === "event_reminders_enable";
            
            let updatedReminders;
            if (enableReminders) {
                // Réinitialiser les rappels en fonction de la date actuelle
                const reminderManager = new ReminderManager();
                updatedReminders = reminderManager.initializeReminderState(event.scheduledStartTimestamp);
            } else {
                // Désactiver tous les rappels
                updatedReminders = {
                    month: true,
                    week: true,
                    day: true
                };
            }

            // Mettre à jour la base de données
            await AnnouncementChannels.updateOne(
                { 
                    Guild: interaction.guildId,
                    'EventThreads.threadId': thread.id
                },
                { 
                    $set: { 
                        'EventThreads.$.sentReminders': updatedReminders
                    }
                }
            );

            // Créer le nouveau bouton
            const newRow = new Discord.ActionRowBuilder()
                .addComponents(
                    new Discord.ButtonBuilder()
                        .setCustomId(enableReminders ? 'event_reminders_disable' : 'event_reminders_enable')
                        .setLabel(enableReminders ? 'Désactiver les rappels' : 'Activer les rappels')
                        .setStyle(enableReminders ? Discord.ButtonStyle.Secondary : Discord.ButtonStyle.Success)
                        .setEmoji(enableReminders ? '🔕' : '🔔'),
                    new Discord.ButtonBuilder()
                        .setCustomId('event_delete')
                        .setLabel('Supprimer l\'événement')
                        .setStyle(Discord.ButtonStyle.Danger)
                        .setEmoji('🗑️')
                );

            // Mettre à jour le message
            const message = interaction.message;
            const embed = message.embeds[0];
            const newEmbed = new Discord.EmbedBuilder(embed.data)
                .setFields(
                    { 
                        name: '📝 Inviter des participants', 
                        value: 'N\'oubliez pas de mentionner (@) les rôles ou les personnes que vous souhaitez inviter dans ce fil de discussion.' 
                    },
                    { 
                        name: '⏰ Rappels automatiques', 
                        value: enableReminders ? 
                            'Les rappels sont activés. Ils seront envoyés automatiquement avant l\'événement.' :
                            'Les rappels sont désactivés. Vous pouvez les réactiver à tout moment.'
                    }
                );

            await interaction.update({ 
                embeds: [newEmbed], 
                components: [newRow]
            });

            // Envoyer une confirmation éphémère
            await interaction.followUp({
                content: enableReminders ? 
                    '🔔 Les rappels ont été réactivés pour cet événement.' :
                    '🔕 Les rappels ont été désactivés pour cet événement.',
                ephemeral: true
            });

        } catch (error) {
            console.error('Erreur lors de la configuration des rappels:', error);
            await interaction.reply({
                content: "❌ Une erreur est survenue lors de la modification des paramètres de rappel.",
                ephemeral: true
            });
        }
    }

    if (interaction.customId === "event_reminders_configure") {
        const thread = interaction.channel;
        if (!thread.isThread()) return;

        try {
            const data = await AnnouncementChannels.findOne({
                Guild: interaction.guildId,
                'EventThreads.threadId': thread.id
            });

            const eventThread = data?.EventThreads?.find(et => et.threadId === thread.id);
            if (!eventThread) return;

            // Vérifier que l'utilisateur est le créateur de l'événement
            const event = await interaction.guild.scheduledEvents.fetch(eventThread.eventId).catch(() => null);
            if (!event || event.creatorId !== interaction.user.id) {
                return interaction.reply({
                    content: "❌ Seul le créateur de l'événement peut configurer les rappels.",
                    ephemeral: true
                });
            }

            // Initialiser les rappels en fonction de la date de l'événement
            const initialReminders = reminderManager.initializeReminderState(event.scheduledStartTimestamp);

            // Save the thread ID and event ID to the database
            await AnnouncementChannels.updateOne(
                { Guild: event.guildId },
                { 
                    $push: { 
                        EventThreads: { 
                            eventName: event.name, 
                            eventId: event.id, 
                            threadId: thread.id,
                            followupMessageId: eventThread.followupMessageId,
                            scheduledStartTimestamp: event.scheduledStartTimestamp,
                            sentReminders: initialReminders
                        } 
                    } 
                }
            );

            // Calculer si les rappels sont disponibles
            const now = Date.now();
            const timeUntilEvent = event.scheduledStartTimestamp - now;
            const hasAvailableReminders = timeUntilEvent > (24 * 60 * 60 * 1000); // Plus d'un jour

            // Send a reminder message in the thread
            let components = [];
            if (hasAvailableReminders) {
                const row = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setCustomId('event_reminders_enable')
                            .setLabel('Activer les rappels')
                            .setStyle(Discord.ButtonStyle.Success)
                            .setEmoji('🔔'),
                        new Discord.ButtonBuilder()
                            .setCustomId('event_reminders_disable')
                            .setLabel('Désactiver les rappels')
                            .setStyle(Discord.ButtonStyle.Secondary)
                            .setEmoji('🔕')
                    );
                components.push(row);
            }

            const welcomeEmbed = new Discord.EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle('🎉 Configuration de l\'événement')
                .setDescription(`Bienvenue dans le fil de discussion de ton événement **${event.name}** !`)
                .addFields(
                    { 
                        name: '📝 Inviter des participants', 
                        value: 'N\'oubliez pas de mentionner (@) les rôles ou les personnes que vous souhaitez inviter dans ce fil de discussion.' 
                    },
                    { 
                        name: '⏰ Rappels automatiques', 
                        value: hasAvailableReminders ? 
                            'Par défaut, des rappels seront envoyés :\n• 1 mois avant\n• 1 semaine avant\n• 1 jour avant\n\nUtilisez les boutons ci-dessous pour gérer les rappels.' :
                            'Les rappels ne sont pas disponibles car l\'événement est trop proche.'
                    }
                )
                .setFooter(hasAvailableReminders ? 
                    { text: 'Vous pouvez configurer les rappels à tout moment' } :
                    { text: 'Les rappels ne sont pas disponibles pour cet événement' }
                );

            const welcomeMessage = await thread.send({
                content: `Ce message se supprimera <t:${Math.floor((Date.now() + 60000) / 1000)}:R>`,
                embeds: [welcomeEmbed],
                components: components
            });

            // Supprimer complètement le message après 60 secondes
            setTimeout(() => {
                welcomeMessage.delete().catch(() => {
                    console.log(`Failed to delete welcome message in thread ${thread.id}`);
                });
            }, 60000);

            // Envoyer une confirmation éphémère
            await interaction.followUp({
                content: "✅ Les rappels ont été configurés pour cet événement.",
                ephemeral: true
            });

        } catch (error) {
            console.error('Erreur lors de la configuration des rappels:', error);
            await interaction.reply({
                content: "❌ Une erreur est survenue lors de la configuration des rappels.",
                ephemeral: true
            });
        }
    }

    // Event deletion
    if (interaction.customId === "event_delete") {
        const thread = interaction.channel;
        if (!thread.isThread()) return;

        try {
            // Différer la réponse immédiatement
            await interaction.deferReply({ ephemeral: true });

            // Récupérer les données de l'événement
            const data = await AnnouncementChannels.findOne({
                Guild: interaction.guildId,
                'EventThreads.threadId': thread.id
            });

            const eventThread = data?.EventThreads?.find(et => et.threadId === thread.id);
            if (!eventThread) {
                return interaction.editReply({
                    content: "❌ Impossible de trouver les informations de l'événement.",
                });
            }

            // Vérifier que l'utilisateur est le créateur de l'événement
            const event = await interaction.guild.scheduledEvents.fetch(eventThread.eventId).catch(() => null);
            if (!event) {
                return interaction.editReply({
                    content: "❌ L'événement n'existe plus.",
                });
            }

            if (event.creatorId !== interaction.user.id) {
                return interaction.editReply({
                    content: "❌ Seul le créateur de l'événement peut le supprimer.",
                });
            }

            // Supprimer l'événement programmé
            await event.delete().catch(console.error);

            // Supprimer le message d'annonce
            const channel = await client.channels.fetch(data.Channel).catch(() => null);
            if (channel) {
                const messages = await channel.messages.fetch({ limit: 100 });
                const announcementMessage = messages.find(m => 
                    m.author.id === client.user.id && 
                    m.content.includes(event.name)
                );
                if (announcementMessage) {
                    await announcementMessage.delete().catch(console.error);
                }
            }

            // Archiver le thread
            await thread.setArchived(true).catch(console.error);

            // Supprimer la référence dans la base de données
            await AnnouncementChannels.updateOne(
                { Guild: interaction.guildId },
                { $pull: { EventThreads: { threadId: thread.id } } }
            );

            // Envoyer une confirmation
            await interaction.editReply({
                content: "✅ L'événement a été supprimé avec succès.",
            });

        } catch (error) {
            console.error('Erreur lors de la suppression de l\'événement:', error);
            // Si l'interaction est toujours valide, essayer d'envoyer un message d'erreur
            try {
                await interaction.editReply({
                    content: "❌ Une erreur est survenue lors de la suppression de l'événement.",
                });
            } catch (replyError) {
                console.error('Erreur lors de la réponse à l\'interaction:', replyError);
            }
        }
    }
}

 