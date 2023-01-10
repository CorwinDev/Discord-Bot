const Discord = require('discord.js');

const Schema = require("../../database/models/family");

module.exports = async (client, interaction, args) => {

    const target = interaction.options.getUser('user');
    const author = interaction.user;

    if (author.id == target.id) return client.errNormal({
        error: "Tu ne peux pas t'adopter toi-même",
        type: 'editreply'
    }, interaction);

    if (target.bot) return client.errNormal({
        error: "Tu ne peux pas adopter un robot",
        type: 'editreply'
    }, interaction);

    const familyMember = await Schema.findOne({ Guild: interaction.guild.id, User: target.id, Parent: author.id });
    const familyMember2 = await Schema.findOne({ Guild: interaction.guild.id, User: author.id, Parent: target.id });
    const familyMember3 = await Schema.findOne({ Guild: interaction.guild.id, User: author.id, Partner: target.id });

    if (familyMember || familyMember2 || familyMember3) {
        return client.errNormal({
            error: `Tu ne peux pas adopter un membre de ta famille !`,
            type: 'editreply'
        }, interaction);
    }

    const checkAdopt = await Schema.findOne({ Guild: interaction.guild.id, Children: target.username });
    if (checkAdopt) {
        return client.errNormal({
            error: `Cette personne a été adoptée !`,
            type: 'editreply'
        }, interaction);
    }

    const row = new Discord.MessageActionRow()
        .addComponents(
            new Discord.MessageButton()
                .setCustomId('adopt_yes')
                .setEmoji('✅')
                .setStyle('SUCCESS'),

            new Discord.MessageButton()
                .setCustomId('adopt_deny')
                .setEmoji('❌')
                .setStyle('DANGER'),
        );

    client.embed({
        title: `👪・Adoption`,
        desc: `${author} a demandé d'adopter ${target} ! \n${target}, clique sur un des boutons`,
        components: [row],
        content: `${target}`,
        type: 'editreply',
    }, interaction)

    const filter = i => i.user.id === target.id;

    interaction.channel.awaitMessageComponent({ filter, componentType: 'BUTTON', time: 60000 }).then(async i => {
        if (i.customId == "adopt_yes") {

            Schema.findOne({ Guild: interaction.guild.id, User: author.id }, async (err, data) => {
                if (data) {
                    data.Children.push(target.username);
                    data.save();
                }
                else {
                    new Schema({
                        Guild: interaction.guild.id,
                        User: author.id,
                        Children: target.username
                    }).save();
                }
            })

            Schema.findOne({ Guild: interaction.guild.id, User: target.id }, async (err, data) => {
                if (data) {
                    data.Parent.push(author.username);
                    data.save();
                }
                else {
                    new Schema({
                        Guild: interaction.guild.id,
                        User: target.id,
                        Parent: author.username
                    }).save();
                }
            })

            client.embed({
                title: `👪・Adoption acceptée`,
                desc: `${author} est maintenant l'heureux parent de ${target}! 🎉`,
                components: [],
                type: 'editreply'
            }, interaction);
        }

        if (i.customId == "adopt_deny") {
            client.embed({
                title: `👪・Adoption refusée`,
                desc: `${target} ne veut pas être adopté ${author}`,
                components: [],
                type: 'editreply'
            }, interaction);
        }
    }).catch(() => {
        client.embed({
            title: `👪・Adoption refusée`,
            desc: `${target} n'a pas répondu ! L'adoption a été annulée`,
            components: [],
            type: 'editreply'
        }, interaction);
    });
}

 
