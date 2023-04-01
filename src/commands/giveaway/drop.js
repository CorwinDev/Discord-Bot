const Discord = require('discord.js');
const ms = require('ms');

module.exports = async (client, interaction, args) => {
    const gchannel = interaction.options.getChannel('channel');
    const duration = interaction.options.getString('duration');
    const winnerCount = interaction.options.getNumber('winners');
    const prize = interaction.options.getString('prize');

    client.giveawaysManager.start(gchannel, {
        duration: ms(duration),
        prize: `${client.emotes.normal.gift} - ${prize}`,
        lastChance: {
            enabled: true,
            content: `${client.emotes.normal.error} **LAST CHANCE TO ENTER !** ${client.emotes.normal.error}`,
            threshold: 5000,
            embedColor: '#FF0000'
        },
        pauseOptions: {
            isPaused: true,
            content: '⚠️ **THIS GIVEAWAY IS PAUSED !** ⚠️',
            unPauseAfter: null,
            embedColor: '#FFFF00'
        },
        winnerCount: parseInt(winnerCount),
        hostedBy: interaction.user,
        thumbnail: interaction.guild.iconURL({ dynamic: true, size: 1024 }),
        isDrop: true,
        messages: {
            giveaway: `${client.emotes.normal.party} **GIVEAWAY** ${client.emotes.normal.party}`,
            giveawayEnded: `${client.emotes.normal.party} **GIVEAWAY ENDED** ${client.emotes.normal.party}`,
            drawing: `${client.emotes.normal.clock} - Ends at: **{timestamp}**!`,
            dropMessage: `Be the first to react with 🥳`,
            winMessage: "Congratulations {winners}! You just won the **{this.prize}** !",
            embedFooter: "Giveaway!",
            embedColor: client.config.colors.normal,
            noWinner: "Giveaway canceled, not enough participants. \n",
            hostedBy: `${client.emotes.normal.party} - Hosted by: {this.hostedBy}`,
            winners: `🏆 - Winner(s)`,
            endedAt: "Ends at:",
            units: {
                seconds: "seconds",
                minutes: "minutes",
                hours: "hours",
                days: "days",
                pluralS: false
            },
        },

    }).then((gData) => {
        client.succNormal({ 
            text: `Giveaway started in ${gchannel}`,
            type: 'ephemeraledit'
        }, interaction);
    });
}

 