const Discord = require('discord.js');

const Schema = require("../../database/models/family");

module.exports = async (client, interaction, args) => {

    const target = interaction.options.getUser('user') || interaction.user;

    const data = await Schema.findOne({ Guild: interaction.guild.id, User: target.id });

    client.embed({
        title: `👪・${target.username}'s Family`,
        thumbnail: target.avatarURL({ size: 1024 }),
        fields: [
            {
                name: `Partner`,
                value: `${data && data.Partner ? `<@!${data.Partner}>` : `This user is not married`}`
            },
            {
                name: `Parent`,
                value: `${data && data.Parent.length > 0 ? `${data.Parent.join(", ")}` : `This user has no parents`}`
            },
            {
                name: `Children`,
                value: `${data && data.Children.length > 0 ? `${data.Children.join(", ")}` : `This user has no children`}`
            }
        ],
        type: 'editreply'
    }, interaction)
}

 