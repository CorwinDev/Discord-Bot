const Discord = require('discord.js');

const Schema = require("../../database/models/notes");

module.exports = async (client, interaction, args) => {
    let id = interaction.options.getString('id');
    let note = interaction.options.getString('note');

    Schema.findOne({ Guild: interaction.guild.id, Code: id }, async (err, data) => {
        if (data) {
            data.Note = note
            data.save();

            client.succNormal({ text: "Note has been edited!", type: 'editreply' }, interaction);
        }
        else {
            client.errNormal({ error: `No note found!`, type: 'editreply' }, interaction);
        }
    })
}

 