const Discord = require('discord.js');

const Schema = require("../../database/models/family");

module.exports = async (client, interaction, args) => {

    const target = interaction.options.getUser('user');
    const author = interaction.user;
    const guild = { Guild: interaction.guild.id };

    if (author.id == target.id) return client.errNormal({ error: "Tu ne peux pas te marrier toi-même !", type: 'editreply' }, interaction);

    Schema.findOne({ Guild: interaction.guild.id, Partner: author.id }, async (err, data) => {
        if (data) {
            client.errNormal({ error: "Quelqu'un dans le couple est déjà marrié !", type: 'editreply' }, interaction);
        }
        else {
            Schema.findOne({ Guild: interaction.guild.id, Partner: target.id }, async (err, data) => {
                if (data) {
                    client.errNormal({ error: "Quelqu'un dans le couple est déjà marrié !", type: 'editreply' }, interaction);
                }
                else {
                    Schema.findOne({ Guild: interaction.guild.id, User: target.id, Parent: author.id }, async (err, data) => {
                        if (data) {
                            client.errNormal({ error: "Tu ne peux pas te marrier avec un membre de ta famille !", type: 'editreply' }, interaction);
                        }
                        else {
                            Schema.findOne({ Guild: interaction.guild.id, User: author.id, Parent: target.id }, async (err, data) => {
                                if (data) {
                                    client.errNormal({ error: "Tu ne peux pas te marrier avec un membre de ta famille !", type: 'editreply' }, interaction);
                                }
                                else {
                                    Schema.findOne({ Guild: interaction.guild.id, User: author.id }, async (err, data) => {
                                        if (data) {
                                            if (data.Children.includes(target.id)) {
                                                client.errNormal({ error: "Tu ne peux pas te marrier avec un membre de ta famille !", type: 'editreply' }, interaction);
                                            }
                                            else {
                                                propose();
                                            }
                                        }
                                        else {
                                            propose();
                                        }
                                    })
                                }
                            })
                        }
                    })
                }
            })
        }
    })

    function propose() {
        const row = new Discord.MessageActionRow()
            .addComponents(
                new Discord.MessageButton()
                    .setCustomId('propose_accept')
                    .setEmoji('✅')
                    .setStyle('SUCCESS'),

                new Discord.MessageButton()
                    .setCustomId('propose_deny')
                    .setEmoji('❌')
                    .setStyle('DANGER'),
            );

        client.embed({
            title: `👰・Demande en marriage`,
            desc: `${author} a demandé en marriage ${target} ! \n${target}, clique sur un des boutons`,
            components: [row],
            content: `${target}`,
            type: 'editreply'
        }, interaction);

        const filter = i => i.user.id === target.id;

        interaction.channel.awaitMessageComponent({ filter, componentType: 'BUTTON', time: 60000 }).then(async i => {
            if (i.customId == "propose_accept") {

                Schema.findOne({ Guild: interaction.guild.id, User: author.id }, async (err, data) => {
                    if (data) {
                        data.Partner = target.id
                        data.save();
                    }
                    else {
                        new Schema({
                            Guild: interaction.guild.id,
                            User: author.id,
                            Partner: target.id
                        }).save();
                    }
                })

                Schema.findOne({ Guild: interaction.guild.id, User: target.id }, async (err, data) => {
                    if (data) {
                        data.Partner = author.id
                        data.save();
                    }
                    else {
                        new Schema({
                            Guild: interaction.guild.id,
                            User: target.id,
                            Partner: author.id
                        }).save();
                    }
                })

                client.embed({
                    title: `👰・Marriage proposal - Approved`,
                    desc: `${author} et ${target} sont maintenant marrié ! 👰🎉`,
                    components: [],
                    content: `${target}`,
                    type: 'editreply'
                }, interaction);
            }

            if (i.customId == "propose_deny") {
                client.embed({
                    title: `👰・Demande en marriage refusée`,
                    desc: `${target} aime quelqu'un d'autre ou préfère resté seul et a décidé de ne pas se marrier avec ${author}`,
                    components: [],
                    content: `${target}`,
                    type: 'editreply'
                }, interaction);
            }
        }).catch(() => {
            client.embed({
                title: `👰・Demande en marriage refusée`,
                desc: `${target} n'a pas répondu ! Le marriage est annulé`,
                components: [],
                content: `${target}`,
                type: 'editreply'
            }, interaction);
        });
    }
}

 
