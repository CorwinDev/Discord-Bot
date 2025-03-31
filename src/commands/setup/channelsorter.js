const Discord = require('discord.js');
const Schema = require("../../database/models/channelActivity");

module.exports = async (client, interaction, args) => {
    const category = interaction.options.getChannel('category');
    
    if (category.type !== Discord.ChannelType.GuildCategory) {
        return client.errNormal({
            error: "The selected channel must be a category!",
            type: 'editreply'
        }, interaction);
    }

    // Sauvegarder la configuration dans la base de données
    await Schema.findOneAndUpdate(
        { Guild: interaction.guild.id, Category: category.id },
        { Guild: interaction.guild.id, Category: category.id, IsActive: true },
        { upsert: true }
    );

    client.succNormal({
        text: `Channel sorting has been successfully configured!`,
        fields: [
            {
                name: `📘┆Category`,
                value: `${category.name}`
            }
        ],
        type: 'editreply'
    }, interaction);
}