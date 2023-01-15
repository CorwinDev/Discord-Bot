const Discord = require('discord.js');

const Schema = require("../../database/models/family");

module.exports = async (client, interaction, args) => {

    const target = interaction.options.getUser('membre');
    const author = interaction.user;
    const guild = { Guild: interaction.guild.id };

    if (author.id == target.id) return client.errNormal({ error: "Tu ne peux pas te marier toi-même !", type: 'editreply' }, interaction);

    Schema.findOne({ Guild: interaction.guild.id, Partner: author.id }, async (err, data) => {
        if (data) {
            client.errNormal({ error: "Quelqu'un dans le couple est déjà marié.e !", type: 'editreply' }, interaction);
        }
        else {
            Schema.findOne({ Guild: interaction.guild.id, Partner: target.id }, async (err, data) => {
                if (data) {
                    client.errNormal({ error: "Quelqu'un dans le couple est déjà marié.e !", type: 'editreply' }, interaction);
                }
                else {
                    Schema.findOne({ Guild: interaction.guild.id, User: target.id, Parent: author.id }, async (err, data) => {
                        if (data) {
                            client.errNormal({ error: "Tu ne peux pas te marier avec un membre de ta famille !", type: 'editreply' }, interaction);
                        }
                        else {
                            Schema.findOne({ Guild: interaction.guild.id, User: author.id, Parent: target.id }, async (err, data) => {
                                if (data) {
                                    client.errNormal({ error: "Tu ne peux pas te marier avec un membre de ta famille !", type: 'editreply' }, interaction);
                                }
                                else {
                                    Schema.findOne({ Guild: interaction.guild.id, User: author.id }, async (err, data) => {
                                        if (data) {
                                            if (data.Children.includes(target.id)) {
                                                client.errNormal({ error: "Tu ne peux pas te marier avec un membre de ta famille !", type: 'editreply' }, interaction);
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
                    .setStyle('SECONDARY'),
            );

        client.embed({
            title: '👰・Demande en mariage',
            desc: '${author} a demandé en mariage ${target} ! \n${target}, clique sur un des boutons',
            components: [row],
            content: '${target}',
            image: 'https://media3.giphy.com/media/RjOtCFEUwmUiAavxOH/giphy.gif',
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
                    title: '👰・Demande en mariage acceptée',
                    desc: '${author} et ${target} sont maintenant marié.es ! 👰🎉',
                    components: [],
                    content: '${target}',
                    image: 'https://media4.giphy.com/media/10wwy1cJ8j2aD6/giphy.gif',
                    type: 'editreply'
                }, interaction);
            }

            if (i.customId == "propose_deny") {
                client.embed({
                    title: '👰・Demande en mariage refusée',
                    desc: '${target} aime quelqu'un d'autre ou préfère rester seul.e et a décidé.e de ne pas se marier avec ${author}',
                    components: [],
                    content: '${target}',
                    image: 'https://media4.giphy.com/media/3ohs7SYIm3yiUbL0yc/giphy.gif',
                    type: 'editreply'
                }, interaction);
            }
        }).catch(() => {
            client.embed({
                title: '👰・Demande en marriage refusée',
                desc: '${target} n'a pas répondu ! Le mariage est annulé',
                components: [],
                content: '${target}',
                image: 'https://media3.giphy.com/media/FKcC27kUBByAo/giphy.gif',
                type: 'editreply'
            }, interaction);
        });
    }
}

 
