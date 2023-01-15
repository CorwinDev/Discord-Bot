const Discord = require('discord.js');

const Schema = require("../../database/models/family");

module.exports = async (client, interaction, args) => {

    const target = interaction.options.getUser('membre');
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

    const checkAdopt = await Schema.findOne({ Guild: interaction.guild.id, Children: target.id });
    if (checkAdopt) {
        return client.errNormal({
            error: `Cette personne a déjà été adoptée par <@!${checkAdopt.Parent}>!`,
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
                .setStyle('SECONDARY'),
        );

    client.embed({
        title: `👪・Adoption`,
        desc: `${author} a demandé d'adopter ${target} ! \n${target}, clique sur un des boutons`,
        components: [row],
        content: `${target}`,
        image: 'https://media2.giphy.com/media/y7XmH8QgILhS5tXCCk/giphy.gif',
        type: 'editreply',
    }, interaction)

    const filter = i => i.user.id === target.id;

    interaction.channel.awaitMessageComponent({ filter, componentType: 'BUTTON', time: 60000 }).then(async i => {
        if (i.customId == "adopt_yes") {

            Schema.findOne({ Guild: interaction.guild.id, User: author.id }, async (err, data) => {
                if (data) {
                    data.Children.push(target.id);
                    data.save();
                }
                else {
                    new Schema({
                        Guild: interaction.guild.id,
                        User: author.id,
                        Children: target.id
                    }).save();
                }
            })

            Schema.findOne({ Guild: interaction.guild.id, User: target.id }, async (err, data) => {
                if (data) {
                    data.Parent.push(author.id);
                    data.save();
                }
                else {
                    new Schema({
                        Guild: interaction.guild.id,
                        User: target.id,
                        Parent: author.id
                    }).save();
                }
            })

            client.embed({
                title: `👪・Adoption acceptée`,
                desc: `${author} est maintenant l'heureux parent de ${target}! 🎉`,
                components: [],
                image: 'https://media.tenor.com/OiIGlFVeuuwAAAAC/im-adopted-tom-hiddleston.gif',
                type: 'editreply'
            }, interaction);
        }

        if (i.customId == "adopt_deny") {
            client.embed({
                title: `👪・Adoption refusée`,
                desc: `${target} ne veut pas être adopté.e ${author}`,
                components: [],
                image: 'https://media0.giphy.com/media/ISOckXUybVfQ4/giphy.gif',
                type: 'editreply'
            }, interaction);
        }
    }).catch(() => {
        client.embed({
            title: `👪・Adoption refusée`,
            desc: `${target} n'a pas répondu ! L'adoption a été annulée`,
            components: [],
            image: 'https://media.tenor.com/-Rngjigx2HAAAAAd/alone.gif',
            type: 'editreply'
        }, interaction);
    });
}

 
