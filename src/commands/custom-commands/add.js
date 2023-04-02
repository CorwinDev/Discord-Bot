const Discord = require('discord.js');
const Schema = require("../../database/models/customCommandAdvanced");

module.exports = async (client, interaction, args) => {
    const cmdname = interaction.options.getString('command');
    const cmdresponce = interaction.options.getString('text');

    Schema.findOne({ Guild: interaction.guild.id, Name: cmdname.toLowerCase() }, async (err, data) => {
        if (data) {
            client.errNormal({ error: "Ce nom de commande est déjà ajouté dans les commandes personnalisées de Guild!", type: 'editreply' }, interaction);
        }
        else {
            const row = new Discord.ActionRowBuilder()
                .addComponents(
                    new Discord.StringSelectMenuBuilder()
                        .setCustomId('customSelect')
                        .setPlaceholder('❌┆Rien de sélectionné')
                        .addOptions(
                            [
                                {
                                    label: `Encombrer`,
                                    description: `Envoyer un message dans une intégration`,
                                    value: "command-embed",
                                },
                                {
                                    label: `Normal`,
                                    description: `Envoyer un message comme d'habitude`,
                                    value: "command-normal",
                                },
                                {
                                    label: `Privée`,
                                    description: `Envoyer le message dans DM`,
                                    value: "command-dm",
                                },
                            ]
                        )
                );

            client.embed({ desc: `Quelle action doit être attachée à cette commande?`, components: [row], type: 'editreply' }, interaction)

            const filter = i => i.user.id === interaction.user.id;

            interaction.channel.awaitMessageComponent({ filter, max: 1 }).then(async i => {
                if (i.customId == 'customSelect') {
                    await i.deferUpdate();
                    if (i.values[0] === "command-embed") {
                        new Schema({
                            Guild: interaction.guild.id,
                            Name: cmdname.toLowerCase(),
                            Responce: cmdresponce,
                            Action: "Embed"
                        }).save();

                        client.succNormal({
                            text: `La commande a été ajoutée avec succès`,
                            fields: [{
                                name: "🔧┆Commande",
                                value: `\`\`\`${cmdname.toLowerCase()}\`\`\``,
                                inline: true,
                            }],
                            components: [],
                            type: 'editreply'
                        }, i);
                    }

                    if (i.values[0] === "command-normal") {
                        new Schema({
                            Guild: interaction.guild.id,
                            Name: cmdname.toLowerCase(),
                            Responce: cmdresponce,
                            Action: "Normal"
                        }).save();

                        client.succNormal({
                            text: `La commande a été ajoutée avec succès`,
                            fields: [{
                                name: "🔧┆Commande",
                                value: `\`\`\`${cmdname.toLowerCase()}\`\`\``,
                                inline: true,
                            }],
                            components: [],
                            type: 'editreply'
                        }, i);
                    }

                    if (i.values[0] === "command-dm") {
                        new Schema({
                            Guild: interaction.guild.id,
                            Name: cmdname.toLowerCase(),
                            Responce: cmdresponce,
                            Action: "DM"
                        }).save();

                        client.succNormal({
                            text: `La commande a été ajoutée avec succès`,
                            fields: [{
                                name: "🔧┆Commande",
                                value: `\`\`\`${cmdname.toLowerCase()}\`\`\``,
                                inline: true,
                            }],
                            components: [],
                            type: 'editreply'
                        }, i);
                    }

                    await interaction.guild.commands.create({
                        name: cmdname,
                        description: 'Commande de serveur personnalisé'
                    });
                }
            })
        }
    })

}

 