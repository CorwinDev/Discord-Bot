const Discord = require('discord.js');

const Schema = require('../../database/models/channelList');

module.exports = async (client, interaction, args) => {
    const type = interaction.options.getString('type');
    const channel = interaction.options.getChannel('channel');

    if (type == "add") {
        Schema.findOne({ Guild: interaction.guild.id }, async (err, data) => {
            if (data) {
                if (data.Channels.includes(channel.id)) {
                    return client.errNormal({
                        error: 'Ce canal ${channel} est déjà dans la base de données!',
                        type: 'editreply'
                    }, interaction);
                }

                data.Channels.push(channel.id);
                data.save();
            }
            else {
                new Schema({
                    Guild: interaction.guild.id,
                    Channels: channel.id
                }).save();
            }
        })

        client.succNormal({
            text: 'Le Canal a été ajouté à la liste blanche !',
            fields: [
                {
                    name: '<:uo_BotEvent:1015565719330627584> ┆ Canal',
                    value: '${channel} (${channel.name})'
                }
            ],
            type: 'editreply'
        }, interaction);
    }
    else if (type == "remove") {
        Schema.findOne({ Guild: interaction.guild.id }, async (err, data) => {
            if (data) {
                if (!data.Channels.includes(channel.id)) {
                    return client.errNormal({
                        error: 'Ce canal ${channel} n'existe pas dans la base de données !',
                        type: 'editreply'
                    }, interaction);
                }

                const filtered = data.Channels.filter((target) => target !== channel.id);

                await Schema.findOneAndUpdate({ Guild: interaction.guild.id }, {
                    Guild: interaction.guild.id,
                    Channels: filtered
                });


                client.succNormal({
                    text: 'Le canal a été retiré de la liste blanche !',
                    fields: [
                        {
                            name: '<:uo_BotEvent:1015565719330627584> ┆ Canal',
                            value: '${channel} (${channel.name})'
                        }
                    ],
                    type: 'editreply'
                }, interaction);
            }
            else {
                return client.errNormal({
                    error: 'Ce serveur ne possède pas de données !',
                    type: 'editreply'
                }, interaction);
            }
        })
    }
}

 
