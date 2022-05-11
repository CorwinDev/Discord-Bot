const Discord = require('discord.js');
const generator = require('generate-password');

const Schema = require("../../database/models/notes");

module.exports = async (client, interaction, args) => {

    let id = interaction.options.getString('id');

    Schema.findOne({ Guild: interaction.guild.id, Code: id }, async (err, data) => {
        if (data) {
            Schema.findOneAndDelete({ Guild: interaction.guild.id, Code: id }).then(() => {
                client.succNormal({ text: `Note **#${id}** has been deleted!`, type: 'editreply' }, interaction);
            })
        }
        else {
            client.errNormal({ error: `No note found with the id **#${id}**`, type: 'editreply' }, interaction);
        }
    })
}

 