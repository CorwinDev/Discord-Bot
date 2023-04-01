const Discord = require('discord.js');
const Topgg = require(`@top-gg/sdk`);
const moment = require("moment");
require("moment-duration-format");

module.exports = async (client, interaction, args) => {
    let dbl = new Topgg.Api(process.env.TOPGG_TOKEN)

    let row = new Discord.ActionRowBuilder()
        .addComponents(
            new Discord.ButtonBuilder()
                .setLabel("Vote for me")
                .setURL("https://top.gg/bot/798144456528363550/vote")
                .setStyle(Discord.ButtonStyle.Link),
        );

    dbl.hasVoted(interaction.user.id).then(voted => {
        if (voted) {
            client.embed({
                title: `📨・Vote`,
                desc: `You have voted!`,
                image: `https://cdn.discordapp.com/attachments/843487478881976381/874694192755007509/Bot_banner_vote.jpg`,
                color: client.config.colors.succes,
                components: [row],
                type: 'editreply'
            }, interaction)
        }
        if (!voted) {
            client.embed({
                title: `📨・Vote`,
                desc: `You have not voted!`,
                image: `https://cdn.discordapp.com/attachments/843487478881976381/874694192755007509/Bot_banner_vote.jpg`,
                color: client.config.colors.error,
                components: [row],
                type: 'editreply'
            }, interaction)
        }
    }).catch(error => { client.errNormal({ text: `There was an error by checking this vote!`, editreply: true }, interaction) });
}

 