const Discord = require('discord.js');

const Schema = require('../../database/models/functions');

module.exports = async (client, interaction, args) => {
    const boolean = interaction.options.getBoolean('active');

    const data = await Schema.findOne({ Guild: interaction.guild.id });
    if (data) {
        data.AntiLinks = boolean;
        data.save();
    }
    else {
        new Schema({
            Guild: interaction.guild.id,
            AntiLinks: boolean,
        }).save();
    }

    client.succNormal({
        text: `Anti Links est maintenant **${boolean ? 'activé' : 'désactivé'}** dans ce serveur`,
        type: 'editreply'
    }, interaction);
}

 