const Discord = require('discord.js');

const Schema = require("../../database/models/family");

module.exports = async (client, interaction, args) => {

    const row = new Discord.MessageActionRow()
        .addComponents(
            new Discord.MessageButton()
                .setCustomId('family_delete')
                .setEmoji('✅')
                .setStyle('SUCCESS'),

            new Discord.MessageButton()
                .setCustomId('family_stop')
                .setEmoji('❌')
                .setStyle('Secondary'),
        );

    client.embed({
        title: `${client.emotes.normal.error}・Remise à zero`,
        desc: `Es-tu sûr de vouloir décimer ta famille ?`,
        components: [row],
        type: 'editreply'
    }, interaction);

    const filter = i => i.user.id === interaction.user.id;

    interaction.channel.awaitMessageComponent({ filter, time: 60000 })
        .then(async i => {
            if (i.customId == "family_delete") {
                i.message.delete();
                
                var remove = await Schema.findOne({ Guild: interaction.guild.id, User: interaction.author.id });
                const parent = await Schema.findOne({ Guild: interaction.guild.id, Parent: interaction.author.id });
                const partner = await Schema.findOne({ Guild: interaction.guild.id, Partner: interaction.author.id });
                //const children = await Schema.findOne({ Guild: interaction.guild.id, Children: interaction.author.id });
                
                /*if (children) {
                    for (let i = 0;children.Children.length > 0; i++) {
                        children.Children[i].Parent = " ";
                        children.Children[i].save();
                    };
                }*/
                if (remove) {
                    remove.Parent = [];
                    remove.Children = [];
                    remove.Partner = null;
                    remove.save();
                }
                
                if (parent) {
                    parent.Parent = " ";
                    parent.save();
                }

                if (partner) {
                    partner.Partner = " ";
                    partner.save();
                }

                client.succNormal({ text: `Ta famille a été décimée !`, type: 'editreply' }, interaction);
            }

            if (i.customId == "family_stop") {
                i.message.delete();
            }
        })
        .catch((err) => {
            console.log(err)
            client.errNormal({ error: "Time's up! Chargement de la backup!", type: 'editreply' }, interaction);
        });
}

 
