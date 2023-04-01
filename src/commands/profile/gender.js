const Schema = require('../../database/models/profile');
const Discord = require('discord.js');

module.exports = async (client, interaction, args) => {

    Schema.findOne({ User: interaction.user.id }, async (err, data) => {
        if (data) {
            const menu = new Discord.StringSelectMenuBuilder()
                .setCustomId('gender-setup')
                .setPlaceholder('❌┆Nothing selected')
                .addOptions(
                    {
                        emoji: "👨",
                        label: `Male`,
                        value: `Male`,
                    },
                    {
                        emoji: "👩",
                        label: `Female`,
                        value: `Female`,
                    },
                    {
                        emoji: "👪",
                        label: `Other`,
                        value: `Other`,
                    }
                );

            const row = new Discord.ActionRowBuilder()
                .addComponents(menu)

            client.embed({
                desc: `Select a gender`,
                type: 'editreply',
                components: [row],
            }, interaction).then(msg => {
                const filter = i => i.user.id === interaction.user.id;

                interaction.channel.awaitMessageComponent({ filter, max: 1, componentType: Discord.ComponentType.StringSelect }).then(i => {
                    if (i.customId == 'gender-setup') {
                        data.Gender = i.values[0];
                        data.save();

                        client.succNormal({
                            text: "Set your gender to " + i.values[0],
                            type: 'editreply',
                            components: [],
                        }, interaction);
                    }
                })
            })
        }
        else {
            return client.errNormal({ error: "No profile found! Open a profile with createprofile", type: 'editreply' }, interaction);
        }
    })
}

 