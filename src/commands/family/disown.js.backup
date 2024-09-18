const Discord = require('discord.js');

const Schema = require("../../database/models/family");

module.exports = async (client, interaction, args) => {

    const target = interaction.options.getUser('user');
    const author = interaction.user;
    const guild = { Guild: interaction.guild.id };

    if (author.id == target.id) return client.errNormal({
        error: "You cannot disown yourself",
        type: 'editreply'
    }, interaction);

    if (target.bot) return client.errNormal({
        error: "You cannot disown a bot",
        type: 'editreply'
    }, interaction);

    Schema.findOne({ Guild: interaction.guild.id, Parent: target.id }, async (err, data) => {
        if (data) {
            Schema.findOne({ Guild: interaction.guild.id, User: data.Parent }, async (err, data2) => {
                if (data2) {
                    client.embed({ title: `👪・Disowned`, desc: `${author} has disowned <@!${data.Parent}>`, type: 'editreply' }, interaction);

                    data.Parent = null;
                    data.save();
                }
            })
        }
        else {
            Schema.findOne({ Guild: interaction.guild.id, User: author.id }, async (err, data) => {
                if (data) {
                    if (data.Children.includes(target.username)) {
                        const filtered = data.Children.filter((user) => user !== target.username);

                        await Schema.findOneAndUpdate(guild, {
                            Guild: interaction.guild.id,
                            User: author.id,
                            Children: filtered
                        });

                        Schema.findOne({ Guild: interaction.guild.id, Parent: author.id }, async (err, data) => {
                            if (data) {
                                data.Parent = null;
                                data.save();
                            }
                        })

                        client.embed({ title: `👪・Disowned`, desc: `${author} has disowned <@!${target.id}>`, type: 'editreply' }, interaction);
                    }
                    else {
                        client.errNormal({ error: "You have no children/parents at the moment", type: 'editreply' }, interaction);
                    }
                }
                else {
                    client.errNormal({ error: "You have no children/parents at the moment", type: 'editreply' }, interaction);
                }
            })
        }
    })
}

 