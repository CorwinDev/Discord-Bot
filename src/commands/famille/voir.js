const Discord = require('discord.js');

const Schema = require("../../database/models/family");

module.exports = async (client, interaction, args) => {

    const target = interaction.options.getUser('membre') || interaction.user;

    const data = await Schema.findOne({ Guild: interaction.guild.id, User: target.id });

    let temp = [];
    if (data && data.Parent.length > 0) {
        for (let i = 0; i < data.Parent.length; i++) {
            temp.push("<@!" + data.Parent[i] + ">");
        }
    }
    let temp2 = [];
    if (data && data.Children.length > 0) {

        for (let i = 0; i < data.Children.length; i++) {
            temp2.push("<@!" + data.Children[i] + ">");
        }
    }
    
    let fields = [{
                name: `Partenaire`,
                value: `${data && data.Partner ? `<@!${data.Partner}>` : `Cette personne n'est pas mariée`}`
            },
            {
                name: `Parents`,
                value: `${data && data.Parent.length > 0 ? `${temp.join(", ")}` : `Cette personne n'a pas de parents`}`
            }
        ];

        // Check siblings
        if (data && data.Parent.length > 0) {
            let temp3 = new Set();
            const parentPromises = data.Parent.map(async parent => {
                const dataParent = await Schema.findOne({ Guild: interaction.guild.id, User: parent });
                if (dataParent && dataParent.Children.length > 0) {
                    for (let i = 0; i < dataParent.Children.length; i++) {
                        if (target.id !== dataParent.Children[i]) temp3.add("<@!" + dataParent.Children[i] + ">");
                    }
                }
            });
            await Promise.all(parentPromises);
            if(data.Parent.length > 1) {
                temp3.add("\n");
            } 
            temp3 = [...temp3].join(", ");
            
        } else {
            let temp3 = `Cette personne n'a pas de frères et soeurs`;
        };
    
        fields.push({
            name: `Frères/Soeurs`,
            value: temp3
        });
        fields.push({
            name: `Enfants`,
            value: `${data && data.Children.length > 0 ? `${temp2.join(", ")}` : `Cette personne n'a pas d'enfants`}`
        });
    client.embed({
        title: `👪・Famille de ${target.username}`,
        thumbnail: target.avatarURL({ size: 1024 }),
        fields: fields,
        type: 'editreply'
    }, interaction, false)
}

 
