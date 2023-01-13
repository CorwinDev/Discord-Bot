const Discord = require('discord.js');

const Schema = require("../../database/models/family");

module.exports = async (client, interaction, args) => {

    const target = interaction.options.getUser('user') || interaction.user;

    const data = await Schema.findOne({ Guild: interaction.guild.id, User: target.id });
    let temp = [];
    let temp2 = [];

    for (let i = 0; i < data.Parent.length; i++) {
        temp.push("<@!" + data.Parent[i] + ">");
    }

    for (let i = 0; i < data.Children.length; i++) {
        temp2.push("<@!" + data.Children[i] + ">");
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
        /*if (data && data.Parent.length > 0) {
            let temp3 = [];
            for (let i = 0; i < data.Parent.length; i++) {
                const dataParent = await Schema.findOne({ Guild: interaction.guild.id, User: data.Parent[i] });
                for (let j = 0; j < dataParent.Children.length; j++) {
                    temp3.push("<@!" + dataParent.Children[i] + ">");
                };
                temp3[j].concat("\n");
            };
            fields.push({
                name: `Frères/Soeurs`,
                value: `${temp3.join(", ")}`
            });
        };*/
        
        if (data && data.Parent.length > 0) {
            let temp3 = [];
            const parentPromises = data.Parent.map(async parent => {
                const dataParent = await Schema.findOne({ Guild: interaction.guild.id, User: parent });
                if (dataParent && dataParent.Children.length > 0) {
                    temp3.push(...dataParent.Children.map(child => "<@!" + child + ">"));
                }
            });
            await Promise.all(parentPromises);
            if(data.Parent.length > 1) {
                temp3[temp3.length - 1] = temp3[temp3.length - 1] + '\n';
            }
            fields.push({
                name: `Frères/Soeurs`,
                value: `${temp3.join(", ")}`
            });
        }

        fields.push({
                name: `Enfants`,
                value: `${data && data.Children.length > 0 ? `${temp2.join(", ")}` : `Cette personne n'a pas d'enfants`}`
            });
    client.embed({
        title: `👪・Famille de ${target.username}`,
        thumbnail: target.avatarURL({ size: 1024 }),
        fields: fields
        ],
        type: 'editreply'
    }, interaction, false)
}

 
