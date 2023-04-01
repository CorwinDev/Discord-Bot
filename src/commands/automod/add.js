const Discord = require('discord.js');

const Schema = require("../../database/models/blacklist");
const { blacklistedWords } = require("../../Collection");

module.exports = async (client, interaction, args) => {
    const word = interaction.options.getString('word');

    Schema.findOne({ Guild: interaction.guild.id }, async (err, data) => {
        if (data) {
            if (data.Words.includes(word)) {
                return client.errNormal({ 
                    error: `That word is already exists in the database!`,
                    type: 'editreply' 
                }, interaction);
            }
            data.Words.push(word);
            data.save();
            blacklistedWords.get(interaction.guild.id).push(word);
        }
        else {
            new Schema({
                Guild: interaction.guild.id,
                Words: word
            }).save();

            blacklistedWords.set(interaction.guild.id, [word]);
        }
    })

    client.succNormal({
        text: `Word is now blacklisted!`,
        fields: [
            {
                name: `💬┆Word`,
                value: `${word}`
            }
        ],
        type: 'editreply'
    }, interaction);
}

 