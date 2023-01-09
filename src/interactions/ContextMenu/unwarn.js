const { CommandInteraction, Client } = require('discord.js');
const { ContextMenuCommandBuilder } = require('discord.js');
const Discord = require('discord.js');

const Schema = require("../../database/models/warnings");

module.exports = {
    data: new ContextMenuCommandBuilder()
        .setName('Unwarn')
        .setType(2),

    /** 
     * @param {Client} client
     * @param {CommandInteraction} interaction
     * @param {String[]} args
     */

    run: async (client, interaction, args) => {
        const perms = await client.checkPerms({
            flags: [Discord.PermissionsBitField.Flags.ManageMessages],
            perms: [Discord.PermissionsBitField.Flags.ManageMessages]
        }, interaction)

        if (perms == false) {
            client.errNormal({
                error: "You don't have the required permissions to use this command!",
                type: 'ephemeral'
            }, interaction);
            return;
        }
        await interaction.deferReply({ ephemeral: true });

        const member = interaction.guild.members.cache.get(interaction.targetId);

        Schema.findOne({ Guild: interaction.guild.id, User: member.id }, async (err, data) => {
            if (data) {
                const menu = new Discord.StringSelectMenuBuilder()
                    .setCustomId('unwarn')
                    .setPlaceholder('Select a warning to remove');
                // Get all warnings and add them to a stringselectmenu 
                data.Warnings.forEach(element => {
                    menu.addOptions({
                        label: `Case ${element.Case}`,
                        value: element.Case.toString(),
                        description: "Reason: " + element.Reason
                    })
                });
                // Create a new message with the menu
                client.embed({
                    title: `🔨・Unwarn`,
                    desc: `Select a warning to remove from **${member.user.tag}**`,
                    components: [new Discord.ActionRowBuilder().addComponents(menu)],
                    type: 'ephemeraledit'
                }, interaction);

                // Create a new collector for the menu
                const filter = i => i.user.id === interaction.user.id;
                const collector = interaction.channel.createMessageComponentCollector({ filter, time: 15000 });

                collector.on('collect', async i => {
                    if (i.customId === 'unwarn') {
                        // Remove the warning from the database
                        data.Warnings.splice(data.Warnings.findIndex(element => element.Case == i.values[0]), 1);
                        data.save();
                        // Remove the menu from the message
                        i.update({
                            components: []
                        });
                        // Send a success message
                        client.succNormal({
                            text: `The warning has been successfully removed`,
                            fields: [
                                {
                                    name: "👤┆User",
                                    value: `${member}`,
                                    inline: true
                                }
                            ],
                            type: 'ephemeraledit'
                        }, interaction);
                        client.emit('warnRemove', member, interaction.user)
                        client.embed({
                            title: `🔨・Unwarn`,
                            desc: `You've been unwarned in **${interaction.guild.name}**`,
                            fields: [
                                {
                                    name: "👤┆Moderator",
                                    value: interaction.user.tag,
                                    inline: true
                                },
                            ]
                        }, member).catch(() => { })
                    }
                });
            } else {
                client.errNormal({
                    error: "User has no warnings!",
                    type: 'ephemeraledit'
                }, interaction);
            }
        })
    },
};