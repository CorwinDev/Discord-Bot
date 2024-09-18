const Discord = require('discord.js');

const Schema = require("../../database/models/triggers");

module.exports = async (client, interaction, args) => {
    const nom = interaction.options.getString('alias');

    Schema.findOne({ Guild: interaction.guild.id, alias: alias }, async (err, data) => {
        if (data) {
            if (!data.Triggers.alias == alias) {
                return client.errNormal({
                    error: `Ce trigger n'existe pas dans la base de données !`,
                    type: 'editreply'
                }, interaction);
            }

            //const filtered = data.Words.filter((target) => target !== word);

            await Schema.findOneAndDelete({Guild: interaction.guild.id, alias: alias });
            /*await Schema.findOneAndUpdate({  }, {
                Guild: interaction.guild.id,
                Words: filtered
            });*/

            client.succNormal({
                text: `Ce trigger a été ajouté`,
                fields: [
                    {
                        name: `:dart: ┆ Trigger`,
                        value: `${alias}`
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