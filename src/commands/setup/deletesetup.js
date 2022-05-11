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
        wordsnake: WordSnake
    };

    const choice = interaction.options.getString('setup');

    options[choice].findOneAndDelete({ Guild: interaction.guild.id }).then(() => {
        client.succNormal({ 
            text: `Setup successfully deleted!`,
            type: 'editreply'
        }, interaction);
    })
}

 