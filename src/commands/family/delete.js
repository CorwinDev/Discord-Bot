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
                .setStyle('DANGER'),
        );

    client.embed({
        title: `${client.emotes.normal.error}・Reset family`,
        desc: `Are you sure you want to reset your family?`,
        components: [row],
        type: 'editreply'
    }, interaction);

    const filter = i => i.user.id === interaction.user.id;

    interaction.channel.awaitMessageComponent({ filter, time: 60000 })
        .then(async i => {
            if (i.customId == "family_delete") {
                i.message.delete();

                var remove = await Schema.findOneAndDelete({ Guild: interaction.guild.id, User: interaction.author.id });
                const parent = await Schema.findOne({ Guild: interaction.guild.id, Parent: interaction.author.id });
                const partner = await Schema.findOne({ Guild: interaction.guild.id, Partner: interaction.author.id });

                if (parent) {
                    parent.Parent = " ";
                    parent.save();
                }

                if (partner) {
                    partner.Partner = " ";
                    partner.save();
                }

                client.succNormal({ text: `Your family has been deleted!`, type: 'editreply' }, interaction);
            }

            if (i.customId == "family_stop") {
                i.message.delete();
            }
        })
        .catch((err) => {
            console.log(err)
            client.errNormal({ error: "Time's up! Cancelled backup loading!", type: 'editreply' }, interaction);
        });
}

 