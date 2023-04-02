const Discord = require('discord.js');

const Schema = require("../../database/models/economy");

module.exports = async (client, interaction, args) => {
    let user = interaction.user;
    var result = Math.ceil(Math.random() * 12);

    Schema.findOne({ Guild: interaction.guild.id, User: user.id }, async (err, data) => {
        if (data) {
            let money = parseInt(interaction.options.getNumber('amount'));
            if (!money) return client.errUsage({ usage: "crash [amount]", type: 'editreply' }, interaction);

            if (money > data.Money) return client.errNormal({ error: `Vous pariez plus que vous ne l'avez fait!`, type: 'editreply' }, interaction);

            const row = new Discord.ActionRowBuilder()
                .addComponents(
                    new Discord.ButtonBuilder()
                        .setCustomId('crash_stop')
                        .setEmoji("🛑")
                        .setStyle(Discord.ButtonStyle.Danger),
                )

            const disableRow = new Discord.ActionRowBuilder()
                .addComponents(
                    new Discord.ButtonBuilder()
                        .setCustomId('crash_stop')
                        .setEmoji("🛑")
                        .setStyle(Discord.ButtonStyle.Danger)
                        .setDisabled(true),
                )

            client.embed({
                desc: `Crash a commencé par ${user}・Réagir 🛑 pour s'arrêter`,
                fields: [
                    {
                        name: `Multiplicateur`,
                        value: `1x`,
                        inline: true,
                    },
                    {
                        name: `profit`,
                        value: `**0**`,
                        inline: true,
                    }
                ],
                components: [row],
                type: 'editreply'
            }, interaction).then(msg => {
                let multiplier = 1;
                let index = 0;

                let times = result + 1;
                let timer = 2000 * times;

                setInterval(() => {
                    if (index === result + 1) { return }
                    else if (index === result) {

                        Schema.findOne({ Guild: interaction.guild.id, User: user.id }, async (err, data) => {
                            if (data) {
                                data.Money -= money;
                                data.save();
                            }
                        })

                        return client.embed({
                            title: `Crash Résultats de ${user}`,
                            desc: `${msg}`,
                            type: 'edit',
                            fields: [
                                {
                                    name: `Perte`,
                                    value: `**${money}**`,
                                    inline: false,
                                }
                            ]
                        }, msg)

                    }
                    else {
                        index += 1;
                        multiplier += 0.20;

                        let calc = money * multiplier;
                        let profit = calc - money;

                        client.embed({
                            desc: `Crash a commencé par ${user}・Réagir 🛑 pour s'arrêter`,
                            type: 'edit',
                            fields: [
                                {
                                    name: `Multiplicateur`,
                                    value: `${multiplier.toFixed(1)}x`,
                                    inline: true,
                                },
                                {
                                    name: `profit`,
                                    value: `**$${profit.toFixed(2)}**`,
                                    inline: true,
                                }
                            ],
                            components: [row]
                        }, msg)
                    }
                }, 2000)

                const filter = i => i.user.id === interaction.user.id;
                interaction.channel.awaitMessageComponent({ filter, max: 1, time: timer })
                    .then(async i => {
                        if (i.customId == "crash_stop") {
                            i.deferUpdate();

                            index = result + 1;
                            profit = money * multiplier;

                            Schema.findOne({ Guild: interaction.guild.id, User: user.id }, async (err, data) => {
                                if (data) {
                                    data.Money += parseInt(profit);
                                    data.save();
                                }
                            })

                            return client.embed({
                                desc: `Crash Résultats de ${user}`,
                                fields: [
                                    {
                                        name: `Profit`,
                                        value: `**$${profit.toFixed(2)}**`,
                                        inline: false,
                                    }
                                ],
                                components: [disableRow],
                                type: 'edit'
                            }, msg)

                        }
                    })
                    .catch(async () => {
                        index = result + 1;

                        Schema.findOne({ Guild: interaction.guild.id, User: user.id },
                            async (err, data) => {
                                if (data) {
                                    data.Money -= money;
                                    data.save();
                                }
                            }
                        )
                        return client.embed({
                            desc: `Crash Résultats de ${user}`,
                            type: 'edit',
                            fields: [
                                {
                                    name: `Perte`,
                                    value: `**${money}**`,
                                    inline: false,
                                }
                            ],
                            components: [disableRow]
                        }, msg)

                    })
            })

        }
        else {
            client.errNormal({ error: `Tu n'as pas ${client.emotes.economy.coins}!`, type: 'editreply' }, interaction);
        }
    })
}