const Discord = require('discord.js');

const Schema = require("../../database/models/family");

module.exports = async (client, interaction, args) => {

    const target = interaction.options.getUser('membre');
    const author = interaction.user;
    const guild = { Guild: interaction.guild.id };

    if (author.id == target.id) return client.errNormal({
        error: "Tu ne peux pas te renier toi-même",
        type: 'editreply'
    }, interaction);

    if (target.bot) return client.errNormal({
        error: "Tu ne peux pas renier un robot",
        type: 'editreply'
    }, interaction);

    Schema.findOne({ Guild: interaction.guild.id, Parent: target.id }, async (err, data) => {
        if (data) {
            Schema.findOne({ Guild: interaction.guild.id, User: data.Parent }, async (err, data2) => {
                if (data2) {
                    client.embed({ title: `👪・Renié`, desc: `${author} a renié <@!${data.Parent}>`, type: 'editreply' }, interaction);
                    let tempArray = data.Parent;
                    const index = tempArray.indexOf(target.id);
                    const x = myArray.splice(index, 1);
                    
                    data.Parent = x;
                    data.save();
                }
            })
        }
        else {
            Schema.findOne({ Guild: interaction.guild.id, User: author.id }, async (err, data) => {
                if (data) {
                    if (data.Children.includes(target.id)) {
                        const filtered = data.Children.filter((user) => user !== target.id);

                        await Schema.findOneAndUpdate(guild, {
                            Guild: interaction.guild.id,
                            User: author.id,
                            Children: filtered
                        });

                        Schema.findOne({ Guild: interaction.guild.id, Parent: author.id }, async (err, data) => {
                            if (data) {
                                let tempArray = data.Parent;
                                const index = tempArray.indexOf(target.id);
                                const x = myArray.splice(index, 1);

                                data.Parent = x;
                                data.save();
                            }
                        })

                        client.embed({ title: `👪・Renié`, desc: `${author} a renié <@!${target.id}>`, type: 'editreply' }, interaction);
                    }
                    else {
                        client.errNormal({ error: "Tu n'as pas d'enfants/parents pour le moment", type: 'editreply' }, interaction);
                    }
                }
                else {
                    client.errNormal({ error: "Tu n'as pas d'enfants/parents pour le moment", type: 'editreply' }, interaction);
                }
            })
        }
    })
}

 
