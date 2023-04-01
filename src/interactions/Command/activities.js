const { CommandInteraction, Client } = require('discord.js');
const { SlashCommandBuilder } = require('discord.js');
const Discord = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('activities')
        .setDescription('Start a activity')
        .addStringOption(option =>
            option.setName('activity')
                .setDescription('The activity that you want')
                .setRequired(true)
                .addChoices(
                    { name: 'Betrayal.io', value: 'betrayal' },
                    { name: 'Checkers in the Park', value: 'checkers' },
                    { name: 'Chess in the Park', value: 'chess' },
                    { name: 'Doodle Crew', value: 'doodlecrew' },
                    { name: 'Fishington.io', value: 'fishington' },
                    { name: 'Letter League', value: 'letterleague' },
                    { name: 'Ocho', value: 'ocho' },
                    { name: 'Poker Night', value: 'poker' },
                    { name: 'Sketch Heads', value: 'sketchheads' },
                    { name: 'Spell Cast', value: 'spellcast' },
                    { name: 'Word Snacks', value: 'wordsnacks' },
                    { name: 'Watch Together', value: 'watchtogether' }
                )
        )
    ,

    /** 
     * @param {Client} client
     * @param {CommandInteraction} interaction
     * @param {String[]} args
     */

    run: async (client, interaction, args) => {
        await interaction.deferReply({ fetchReply: true });
        const activity = interaction.options.getString('activity');

        const channel = interaction.member.voice.channel;
        if (!channel) return client.errNormal({ 
            error: `You're not in a voice channel!`, 
            type: 'editreply' 
        }, interaction);

        if (activity == "betrayal") {
            client.generateActivity("773336526917861400", "Betrayal.io", channel, interaction)
        }
        else if (activity == "checkers") {
            client.generateActivity("832013003968348200", "Checkers in the Park", channel, interaction)
        }
        else if (activity == "chess") {
            client.generateActivity("832012586023256104", "Chess in the Park", channel, interaction)
        }
        else if (activity == "doodlecrew") {
            client.generateActivity("878067389634314250", "Doodle Crew", channel, interaction)
        }
        else if (activity == "fishington") {
            client.generateActivity("814288819477020702", "Fishington.io", channel, interaction)
        }
        else if (activity == "lettertile") {
            client.generateActivity("879863686565621790", "Letter Tile", channel, interaction)
        }
        else if (activity == "poker") {
            client.generateActivity("755827207812677713", "Poker Night", channel, interaction)
        }
        else if (activity == "spellcast") {
            client.generateActivity("852509694341283871", "Spell Cast", channel, interaction)
        }
        else if (activity == "wordsnacks") {
            client.generateActivity("879863976006127627", "Word Snacks", channel, interaction)
        }
        else if (activity == "watchtogether") {
            client.generateActivity("880218394199220334", "Watch Together", channel, interaction)
        }
        else if (activity == "ocho") {
            client.generateActivity("832025144389533716", "Ocho", channel, interaction)
        }
        else if (activity == "sketchheads") {
            client.generateActivity("902271654783242291", "Sketch Heads", channel, interaction)
        }
        else if (activity == "letterleague") {
            client.generateActivity("879863686565621790", "Letter League", channel, interaction)
        }
    },
};

 