const Discord = require('discord.js');

const ticketSchema = require("../../database/models/tickets");
const ticketChannels = require("../../database/models/ticketChannels");
const ticketMessageConfig = require("../../database/models/ticketMessage");

module.exports = async (client, interaction, args) => {
    let reason = "Not given";
    if (interaction.options) reason = interaction.options.getString('reason') || "Not given";

    let type = 'reply';
    if (interaction.isCommand()) type = 'editreply';

    ticketChannels.findOne({ Guild: interaction.guild.id, creator: interaction.user.id, resolved: false }, async (err, data) => {
        if (data) {
            if (interaction.isCommand()) {
                return client.errNormal({
                    error: "Ticket limit reached. 1/1",
                    type: 'ephemeraledit'
                }, interaction);
            }
            else return client.errNormal({
                error: "Ticket limit reached. 1/1",
                type: 'ephemeral'
            }, interaction);
        }
        else {
            ticketSchema.findOne({ Guild: interaction.guild.id }, async (err, TicketData) => {
                if (TicketData) {
                    const logsChannel = interaction.guild.channels.cache.get(TicketData.Logs);
                    const ticketCategory = interaction.guild.channels.cache.get(TicketData.Category);
                    const ticketRole = interaction.guild.roles.cache.get(TicketData.Role);
                    let role = interaction.guild.roles.cache.find(r => r.id === ticketRole.id);

                    try {
                        var openTicket = "Thanks for creating a ticket! \nSupport will be with you shortly \n\n🔒 - Close ticket \n✋ - Claim ticket \n📝 - Save transcript \n🔔 - Send a notification";
                        let ticketMessageData = await ticketMessageConfig.findOne({ Guild: interaction.guild.id });
                        if (ticketMessageData) {
                            openTicket = ticketMessageData.openTicket;
                        }

                        const row = new Discord.MessageActionRow()
                            .addComponents(
                                new Discord.MessageButton()
                                    .setCustomId('Bot_closeticket')
                                    .setEmoji('🔒')
                                    .setStyle('PRIMARY'),

                                new Discord.MessageButton()
                                    .setCustomId('Bot_claimTicket')
                                    .setEmoji('✋')
                                    .setStyle('PRIMARY'),

                                new Discord.MessageButton()
                                    .setCustomId('Bot_transcriptTicket')
                                    .setEmoji('📝')
                                    .setStyle('PRIMARY'),

                                new Discord.MessageButton()
                                    .setCustomId('Bot_noticeTicket')
                                    .setEmoji('🔔')
                                    .setStyle('PRIMARY'),
                            );

                        client.embed({
                            title: `${client.emotes.animated.loading}・Progress`,
                            desc: `Your ticket is being created...`,
                            type: 'ephemeral'
                        }, interaction).then((msg) => {

                            if (TicketData.TicketCount) {
                                TicketData.TicketCount += 1;
                                TicketData.save();
                            }
                            else {
                                TicketData.TicketCount = 1;
                                TicketData.save();
                            }

                            if (ticketCategory == undefined) {
                                return client.errNormal({
                                    error: "Do the setup!",
                                    type: type
                                }, interaction);
                            }
                            else {

                                let category = interaction.guild.channels.cache.find(c => c.id === ticketCategory.id);

                                let permsToHave = [
                                    'VIEW_CHANNEL',
                                    'SEND_MESSAGES',
                                    'ATTACH_FILES',
                                    'READ_MESSAGE_HISTORY',
                                    'ADD_REACTIONS'
                                ]

                                var ticketid = String(TicketData.TicketCount).padStart(4, 0);;

                                interaction.guild.channels.create(`ticket-${ticketid}`, {
                                    permissionOverwrites: [
                                        {
                                            deny: 'VIEW_CHANNEL',
                                            id: interaction.guild.id
                                        },
                                        {
                                            allow: permsToHave,
                                            id: interaction.user.id
                                        },
                                        {
                                            allow: permsToHave,
                                            id: role.id
                                        },
                                    ],
                                    parent: category.id
                                }).then(async channel => {
                                    client.embed({
                                        title: `⚙️・System`,
                                        desc: `Ticket has been created`,
                                        fields: [
                                            {
                                                name: "👤┆Creator",
                                                value: `${interaction.user}`,
                                                inline: true
                                            },
                                            {
                                                name: "📂┆Channel",
                                                value: `${channel}`,
                                                inline: true
                                            },
                                            {
                                                name: "⏰┆Created at",
                                                value: `<t:${(Date.now() / 1000).toFixed(0)}:f>`,
                                                inline: true
                                            }
                                        ],
                                        type: type
                                    }, interaction)

                                    new ticketChannels({
                                        Guild: interaction.guild.id,
                                        TicketID: ticketid,
                                        channelID: channel.id,
                                        creator: interaction.user.id,
                                        claimed: "None"
                                    }).save();

                                    if (logsChannel) {
                                        client.embed({
                                            title: `📝・Open ticket`,
                                            desc: `A new ticket has been created`,
                                            fields: [
                                                {
                                                    name: "👤┆Creator",
                                                    value: `${interaction.user.tag} (${interaction.user.id})`,
                                                    inline: false
                                                },
                                                {
                                                    name: "📂┆Channel",
                                                    value: `${channel.name} is found at ${channel}`,
                                                    inline: false
                                                },
                                                {
                                                    name: "⏰┆Created at",
                                                    value: `<t:${(Date.now() / 1000).toFixed(0)}:F>`,
                                                    inline: false
                                                }
                                            ],
                                        }, logsChannel)
                                    }

                                    await client.embed({
                                        desc: openTicket,
                                        fields: [
                                            {
                                                name: "👤┆Creator",
                                                value: `${interaction.user}`,
                                                inline: true
                                            },
                                            {
                                                name: "📄┆Subject",
                                                value: `${reason}`,
                                                inline: true
                                            },
                                            {
                                                name: "⏰┆Created at",
                                                value: `<t:${(Date.now() / 1000).toFixed(0)}:F>`,
                                                inline: true
                                            }
                                        ],
                                        components: [row],
                                        content: `${interaction.user}, ${role}`
                                    }, channel)
                                })
                            }

                        })

                    }
                    catch (err) {
                        client.errNormal({
                            error: "Do the setup!",
                            type: type
                        }, interaction);
                        throw err;
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

 