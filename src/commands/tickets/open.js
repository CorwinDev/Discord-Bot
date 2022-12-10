const Discord = require('discord.js');

const ticketSchema = require("../../database/models/tickets");
const ticketChannels = require("../../database/models/ticketChannels");

module.exports = async (client, interaction, args) => {
    const perms = await client.checkUserPerms({
        flags: [Discord.PermissionsBitField.Flags.ManageMessages],
        perms: [Discord.PermissionsBitField.Flags.ManageMessages]
    }, interaction)

    if (perms == false) return;

    let type = 'reply';
    if (interaction.isCommand()) type = 'editreply';

    ticketChannels.findOne({ Guild: interaction.guild.id, channelID: interaction.channel.id }, async (err, ticketData) => {
        if (ticketData) {
            if (ticketData.resolved == false) return client.errNormal({
                error: "Ticket is already open!",
                type: 'ephemeraledit'
            }, interaction);

            ticketSchema.findOne({ Guild: interaction.guild.id }, async (err, data) => {
                if (data) {
                    const ticketCategory = interaction.guild.channels.cache.get(data.Category);

                    if (ticketCategory == undefined) {
                        return client.errNormal({
                            error: "Do the setup!",
                            type: type
                        }, interaction);
                    }

                    if (interaction.channel.parentId == ticketCategory.id) {
                        client.users.fetch(ticketData.creator).then(usr => {
                            interaction.channel.permissionOverwrites.edit(usr, {
                                ViewChannel: true,
                                SendMessages: true,
                                AttachFiles: true,
                                ReadMessageHistory: true,
                                AddReactions: true
                            });

                            var ticketid = String(ticketData.TicketID).padStart(4, 0);
                            interaction.channel.setName(`ticket-${ticketid}`);
                        })

                        ticketData.resolved = false;
                        ticketData.save();

                        return client.simpleEmbed({
                            desc: `Ticket opened by <@!${interaction.user.id}>`,
                            type: type
                        }, interaction)
                    }
                    else {
                        client.errNormal({
                            error: "This is not a ticket!",
                            type: type
                        }, interaction);

                    }
                }
                else {
                    return client.errNormal({
                        error: "Do the setup!",
                        type: type
                    }, interaction);
                }
            })
        }
    })
}

 