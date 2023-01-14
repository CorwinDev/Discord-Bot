const Discord = require('discord.js');

const Schema = require("../../database/models/family");

module.exports = async (client, interaction, args) => {

    const target = interaction.options.getUser('membre');
    const author = interaction.user;

    if (author.id == target.id) return client.errNormal({
        error: "Tu ne peux pas divorcer de toi-même",
        type: 'editreply'
    }, interaction);

    if (target.bot) return client.errNormal({
        error: "Tu ne peux pas divorcer d'un robot",
        type: 'editreply'
    }, interaction);

    const data = await Schema.findOne({ Guild: interaction.guild.id, User: author.id, Partner: target.id });
    if (data) {
        const data2 = await Schema.findOne({ Guild: interaction.guild.id, User: target.id });
        if (data2) {
            data2.Partner = null;
            data2.save();
        }

        data.Partner = null;
        data.save();

        client.embed({ 
            title: '👰・Divorcés', 
            desc: '${author} et ${target} viennent de divorcer', 
            type: 'editreply' 
        }, interaction);

    }
    else {
        client.errNormal({ 
            error: "Tu n'es pas marrier pour le moment", 
            type: 'editreply' 
        }, interaction);
    }
}

 
