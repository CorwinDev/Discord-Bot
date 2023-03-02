const Discord = require('discord.js');

const Schema = require("../../database/models/triggers");

module.exports = async (client, interaction, args) => {
    const nom = interaction.options.getString('nom');

    Schema.findOne({ Guild: interaction.guild.id, triggerName: nom }, async (err, data) => {
        if (data) {
            if (!data.triggerName == nom) {
                return client.errNormal({
                    error: `Ce trigger n'existe pas dans la base de données !`,
                    type: 'editreply'
                }, interaction);
            }

            //const filtered = data.Words.filter((target) => target !== word);
            
            await Schema.findOneAndDelete({Guild: interaction.guild.id, triggerName: nom });
            /*await Schema.findOneAndUpdate({  }, {
                Guild: interaction.guild.id,
                Words: filtered
            });*/

            client.succNormal({
                text: `Ce trigger a été ajouté`,
                fields: [
                    {
                        name: `:dart: ┆ Trigger`,
                        value: `${nom}`
                    }
                ],
                type: 'editreply'
            }, interaction);
        }
        else {
            client.errNormal({
                error: `Ce serveur ne possède pas de données!`,
                type: 'editreply'
            }, interaction);
        }
    })
}

 
