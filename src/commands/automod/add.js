const Discord = require('discord.js');

const Schema = require("../../database/models/blacklist");

module.exports = async (client, interaction, args) => {
    const word = interaction.options.getString('word');

    Schema.findOne({ Guild: interaction.guild.id }, async (err, data) => {
        if (data) {
            if (data.Words.includes(word)) {
                return client.errNormal({ 
                    error: `Ce mot existe déjà dans la base de données!`,
                    type: 'editreply' 
                }, interaction);
            }
            if(!data.Words) data.Words = [];
            data.Words.push(word);
            data.save();
        }
        else {
            new Schema({
                Guild: interaction.guild.id,
                Words: word
            }).save();
        }
    })

    client.succNormal({
        text: `Le mot est maintenant sur liste noire!`,
        fields: [
            {
                name: `💬┆Mot`,
                value: `${word}`
            }
        ],
        type: 'editreply'
    }, interaction);
}

 