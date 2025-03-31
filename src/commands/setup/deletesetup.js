const Discord = require('discord.js');

const Counting = require("../../database/models/countChannel");
const GTN = require("../../database/models/guessNumber");
const GTW = require("../../database/models/guessWord");
const WordSnake = require("../../database/models/wordsnake");
const Birthdays = require("../../database/models/birthdaychannels");
const Chatbot = require("../../database/models/chatbot-channel");
const Review = require("../../database/models/reviewChannels");
const Suggestion = require("../../database/models/suggestionChannels");
const logs = require("../../database/models/logChannels");
const boostLogs = require("../../database/models/boostChannels");
const levelLogs = require("../../database/models/levelChannels");
const voiceSchema = require("../../database/models/voice");
const ticketSchema = require("../../database/models/tickets");
const welcomeChannel = require("../../database/models/welcomeChannels");
const leaveChannel = require("../../database/models/leaveChannels");
const welcomeRole = require("../../database/models/joinRole");
const ChannelSorter = require('../../database/models/channelActivity');

module.exports = async (client, interaction, args) => {
    const options = {
        tickets: ticketSchema,
        customvoice: voiceSchema,
        serverlogs: logs,
        levellogs: levelLogs,
        boostlogs: boostLogs,
        birthdays: Birthdays,
        chatbot: Chatbot,
        reviews: Review,
        suggestions: Suggestion,
        counting: Counting,
        gtn: GTN,
        gtw: GTW,
        welcomechannel: welcomeChannel,
        leavechannel: leaveChannel,
        welcomerole: welcomeRole,
        wordsnake: WordSnake,
        channelsorter: ChannelSorter
    };

    const choice = interaction.options.getString('setup');

    if (choice === 'channelsorter') {
        // Pour le channel sorter, on demande quelle catégorie supprimer
        const categories = await ChannelSorter.find({ Guild: interaction.guild.id });
        
        if (categories.length === 0) {
            return client.errNormal({ 
                error: `No channel sorter configuration found!`,
                type: 'editreply'
            }, interaction);
        }

        // Créer un menu de sélection avec les catégories
        const row = new Discord.ActionRowBuilder()
            .addComponents(
                new Discord.StringSelectMenuBuilder()
                    .setCustomId('delete_channelsorter')
                    .setPlaceholder('Select category to remove from auto-sort')
                    .addOptions(
                        categories.map(cat => {
                            const channel = interaction.guild.channels.cache.get(cat.Category);
                            return {
                                label: channel ? channel.name : 'Unknown Category',
                                value: cat.Category,
                                description: `Remove auto-sort from this category`
                            };
                        })
                    )
            );

        const response = await interaction.editReply({
            content: `Select which category to remove from auto-sort:`,
            components: [row]
        });

        try {
            const confirmation = await response.awaitMessageComponent({ 
                filter: i => i.user.id === interaction.user.id,
                time: 60000 
            });

            await ChannelSorter.findOneAndDelete({ 
                Guild: interaction.guild.id, 
                Category: confirmation.values[0] 
            });

            await confirmation.update({
                content: `Channel sorter has been removed from the selected category!`,
                components: []
            });
        } catch (e) {
            await interaction.editReply({
                content: 'No category selected within 1 minute, operation cancelled.',
                components: []
            });
        }
    } else {
        // Comportement normal pour les autres options
        options[choice].findOneAndDelete({ Guild: interaction.guild.id }).then(() => {
            client.succNormal({ 
                text: `Setup successfully deleted!`,
                type: 'editreply'
            }, interaction);
        });
    }
}
 