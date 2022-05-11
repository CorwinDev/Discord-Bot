const Discord = require('discord.js');

const Schema = require("../../database/models/economy");
const Schema2 = require("../../database/models/economyTimeout");

module.exports = async (client, interaction, args) => {

    let user = interaction.user;
    let timeout = 600000;

    Schema2.findOne({ Guild: interaction.guild.id, User: user.id }, async (err, dataTime) => {
        if (dataTime && dataTime.Crime !== null && timeout - (Date.now() - dataTime.Crime) > 0) {
            let time = (dataTime.Crime / 1000 + timeout / 1000).toFixed(0);
            return client.errWait({
                time: time,
                type: 'editreply'
            }, interaction);
        }
        else {

            let replies = ['Hacking', 'Burglary', 'Roberry', 'Murder', 'Dealing drugs', 'Child abuse', 'Arms trade', 'Street robbery'];

            let result = Math.floor((Math.random() * replies.length));
            let result2 = Math.floor((Math.random() * 10));
            let amount = Math.floor(Math.random() * 80) + 1;

            if (result2 > 7) {

                client.succNormal({
                    text: `Your crime went successfully!`,
                    fields: [
                        {
                            name: `🦹‍♂️┆Crime`,
                            value: `${replies[result]}`,
                            inline: true
                        },
                        {
                            name: `${client.emotes.economy.coins}┆Earned`,
                            value: `$${amount}`,
                            inline: true
                        }
                    ],
                    type: 'editreply'
                }, interaction);

                client.addMoney(interaction, user, amount);

                if (dataTime) {
                    dataTime.Crime = Date.now();
                    dataTime.save();
                }

                else {
                    new Schema2({
                        Guild: interaction.guild.id,
                        User: user.id,
                        Crime: Date.now()
                    }).save();
                }
            }
            else {
                client.errNormal({ error: `You were caught carrying out the crime ${replies[result]}`, type: 'editreply' }, interaction);

                if (dataTime) {
                    dataTime.Crime = Date.now();
                    dataTime.save();
                }
                else {
                    new Schema2({
                        Guild: interaction.guild.id,
                        User: user.id,
                        Crime: Date.now()
                    }).save();
                }
            }
        }
    })
}

 