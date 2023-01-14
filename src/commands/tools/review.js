const Discord = require('discord.js');

const Schema = require("../../database/models/reviewChannels");

module.exports = async (client, interaction, args) => {
    const stars = interaction.options.getNumber('stars');
    const message = interaction.options.getString('message') || 'Not given';

    if (stars < 1 || stars > 5) return client.errNormal({
        error: `Stars must be a minimum of 1 and a maximum of 5`,
        type: 'editreply'
    }, interaction)

    Schema.findOne({ Guild: interaction.guild.id }, async (err, data) => {
        if (data) {
            const channel = interaction.member.guild.channels.cache.get(data.Channel);
            if (!channel) return  client.errNormal({
                error: `No review channel set! Do \`reviewchannel\``,
                type: 'editreply'
            }, interaction);
            
            let totalStars = "";
            for (let i = 0; i < stars; i++) {
                totalStars += ":star:";
            }

            client.succNormal({
                text: "Your review has been successfully submitted",
                fields: [
                    {
                        name: `⭐┇Stars`,
                        value: `${stars}`,
                        inline: true
                    },
                    {
                        name: `📘┇Channel`,
                        value: `<#${data.Channel}>`,
                        inline: true
                    }
                ],
                type: 'editreply'
            }, interaction);

            client.embed({
                title: `Review・${interaction.user.tag}`,
                desc: `A new review has been written!`,
                fields: [
                    {
                        name: "Stars",
                        value: `${totalStars}`,
                        inline: true,
                    },
                    {
                        name: "Note",
                        value: `${message}`,
                        inline: true,
                    },
                ]
            }, channel)

        }
        else {
            client.errNormal({
                error: `No review channel set! Do \`reviewchannel\``,
                type: 'editreply'
            }, interaction)
        }
    })
}

 