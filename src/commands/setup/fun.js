const Discord = require('discord.js');

const Birthdays = require("../../database/models/birthdaychannels");
const Chatbot = require("../../database/models/chatbot-channel");
const Review = require("../../database/models/reviewChannels");
const Suggestion = require("../../database/models/suggestionChannels");
const StarBoard = require("../../database/models/starboardChannels");

module.exports = async (client, interaction, args) => {
    const choice = interaction.options.getString('setup');
    const channel = interaction.options.getChannel('channel');

    if (choice == "birthdays") {
        client.createChannelSetup(Birthdays, channel, interaction)
    }

    if (choice == "chatbot") {
        client.createChannelSetup(Chatbot, channel, interaction)
    }

    if (choice == "reviews") {
        client.createChannelSetup(Review, channel, interaction)
    }

    if (choice == "suggestions") {
        client.createChannelSetup(Suggestion, channel, interaction)
    }

    if (choice == "starboard") {
        client.createChannelSetup(StarBoard, channel, interaction)
    }
}

 