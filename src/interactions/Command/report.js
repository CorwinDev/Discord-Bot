const { CommandInteraction, Client } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const Discord = require('discord.js');

const webhookClient = new Discord.WebhookClient({
    id: "",
    token: "",
});

module.exports = {
    data: new SlashCommandBuilder()
        .setName('report')
        .setDescription('Report a bug or user to the developers')
        .addStringOption(option =>
            option.setName('type')
                .setDescription('The type of your report')
                .setRequired(true)
                .addChoice('Bug', 'bug')
                .addChoice('User', 'user')
        )
        .addStringOption(option =>
            option.setName('description')
                .setDescription('Description with your report')
                .setRequired(true)
        )
    ,

    /** 
     * @param {Client} client
     * @param {CommandInteraction} interaction
     * @param {String[]} args
     */

    run: async (client, interaction, args) => {
        const type = interaction.options.getString('type');
        const desc = interaction.options.getString('description');

        if (type == "bug") {
            const embed = new Discord.MessageEmbed()
                .setTitle(`📣・New bug report!`)
                .addField("Report category", "Bug", true)
                .addField("Submitted by", `${interaction.user.tag}`, true)
                .setDescription(`${desc}`)
                .setColor(client.config.colors.normal)
            webhookClient.send({
                username: 'Bot Reports',
                embeds: [embed],
            });

            client.succNormal({
                text: `Bug successfully sent to the developers!`,
                type: 'ephemeraledit'
            }, interaction);
        }
        else if (type == "user") {
            const embed = new Discord.MessageEmbed()
                .setTitle(`📣・New user report!`)
                .addField("Report category", "User", true)
                .addField("Submitted by", `${interaction.user.tag}`, true)
                .setDescription(`${desc}`)
                .setColor(client.config.colors.normal)
            webhookClient.send({
                username: 'Bot Reports',
                embeds: [embed],
            });

            client.succNormal({
                text: `User report successfully sent to the developers!`,
                type: 'ephemeraledit'
            }, interaction);
        }
    },
};

 