const Discord = require('discord.js');

const Schema = require("../../database/models/family");

module.exports = async (client, interaction, args) => {

    const target = interaction.options.getUser('user') || interaction.user;

    const data = await Schema.findOne({ Guild: interaction.guild.id, User: target.id });
    const data2 = await Schema.findOne({ Guild: interaction.guild.id, User: data.Parent.id });
    
    client.embed({
        title: `👪・Famille de ${target.username}`,
        thumbnail: target.avatarURL({ size: 1024 }),
        fields: [
            {
                name: `Partenaire`,
                value: `${data && data.Partner ? `<@!${data.Partner}>` : `Cette personne n'est pas marriée`}`
            },
            {
                name: `Parent`,
                value: `${data && data.Parent.length > 0 ? `${data.Parent.join(", ")}` : `Cette personne n'a pas de parents`}`
            },
            {
                name: `Frères/Soeurs`,
                value: `${data && data2.Children.length > 0 ? `${data.Children.join(", ")}` : `Cette personne n'a pas d'enfants`}`
            },
            {
                name: `Enfants`,
                value: `${data && data.Children.length > 0 ? `${data.Children.join(", ")}` : `Cette personne n'a pas d'enfants`}`
            }
        ],
        type: 'editreply'
    }, interaction)
}

 
