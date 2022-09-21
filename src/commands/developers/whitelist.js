const Discord = require('discord.js');

const Schema = require('../../database/models/whitelist');

module.exports = async (client, interaction, args) => {
    const type = interaction.options.getString('type');
    const guild = interaction.options.getString('guild');

    if (interaction.author.id === "784649693363306518") {
        if (type == "add") {
            Schema.findOne({ Guild: guild }, async (err, data) => {
                if (data) {
                    data.Guild = guild;
                    data.save();
                }
                else {
                    new Schema({
                        Guild: guild
                    }).save();
                }
            })

            client.succNormal({
                text: `${guild} added to the bot whitelist`,
                type: 'editreply'
            }, interaction);
        }
        else if (type == "remove") {
            Schema.findOne({ Guild: guild }, async (err, data) => {
                if (data) {
                    Schema.findOneAndDelete({ Guild: guild }).then(() => {
                        client.succNormal({
                            text: `${guild} removed from the bot whitelist`,
                            type: 'editreply'
                        }, interaction);
                    })
                }
            })
        }
    }
    else {
        client.errNormal({
            error: "Only the Bot CEO are allowed to do this",
            type: 'editreply'
        }, interaction);
    }
}

 