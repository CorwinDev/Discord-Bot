const Discord = require('discord.js');

const Schema = require("../../database/models/reactionRoles");

module.exports = async (client, interaction, args) => {
    const category = interaction.options.getString('category');
    const channel = interaction.options.getChannel('channel') || interaction.channel;

    const lower = category.toLowerCase();
    const upper = lower.charAt(0).toUpperCase() + lower.substring(1);

    Schema.findOne({ Guild: interaction.guild.id, Category: category }, async (err, data) => {
        if (!data) return client.errNormal({ 
            error: `No data found!`,
            type: 'editreply'
        }, interaction);

        const mapped = Object.keys(data.Roles)
            .map((value, index) => {
                const role = interaction.guild.roles.cache.get(data.Roles[value][0]);

                return `${data.Roles[value][1].raw} | ${role}`;
            }).join("\n");

        const reactions = Object.values(data.Roles).map((val) => val[1].raw);
        var sendComponents = await client.buttonReactions("id", reactions)

        client.embed({
            title: `${upper}・Roles`,
            desc: `_____ \n\nChoose your roles by pressing the button! \n\n${mapped}`,
            components: sendComponents
        }, channel).then((msg) => {
            data.Message = msg.id;
            data.save();
        })

        client.succNormal({ 
            text: "Reaction panel successfully created!",
            type: 'ephemeraledit'
        }, interaction);
    })
}

 