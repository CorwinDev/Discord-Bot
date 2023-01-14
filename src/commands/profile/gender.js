const Schema = require('../../database/models/profile');
const Discord = require('discord.js');

module.exports = async (client, interaction, args) => {

    Schema.findOne({ User: interaction.user.id }, async (err, data) => {
        if (data) {
            const menu = new Discord.MessageSelectMenu()
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

            const row = new Discord.MessageActionRow()
                .addComponents(menu)

            client.embed({
                desc: `Select a gender`,
                type: 'editreply',
                components: [row],
            }, interaction).then(msg => {
                const filter = i => i.user.id === interaction.user.id;

                interaction.channel.awaitMessageComponent({ filter, max: 1, componentType: 'SELECT_MENU' }).then(async i => {
                    if (i.customId == 'gender-setup') {
                        data.Gender = i.values[0];
                        data.save();

                        client.api.interactions(i.id, i.token).callback.post({
                            data: {
                                type: 4,
                                data: {
                                    content: `Your gender is set`,
                                    embeds: [],
                                    flags: 64,
                                }
                            }
                        });
                    }
                })
            })
        }
        else {
            return client.errNormal({ error: "No profile found! Open a profile with createprofile", type: 'editreply' }, interaction);
        }
    })
}

 