const Discord = require('discord.js');

const Birthdays = require("../../database/models/birthdaychannels");
const Chatbot = require("../../database/models/chatbot-channel");
const Review = require("../../database/models/reviewChannels");
const Suggestion = require("../../database/models/suggestionChannels");
const StarBoard = require("../../database/models/starboardChannels");

module.exports = async (client, interaction, args) => {
    const choice = interaction.options.getString('setup');

    if (choice == "birthdays") {
        interaction.guild.channels.create("birthdays", {
            type: "GUILD_TEXT"
        }).then((ch) => {
            client.createChannelSetup(Birthdays, ch, interaction)
        })
    }

    if (choice == "chatbot") {
        interaction.guild.channels.create("chatbot", {
            type: "GUILD_TEXT"
        }).then((ch) => {
            client.createChannelSetup(Chatbot, ch, interaction)
        })
    }

    if (choice == "reviews") {
        interaction.guild.channels.create("reviews", {
            type: "GUILD_TEXT"
        }).then((ch) => {
            client.createChannelSetup(Review, ch, interaction)
        })
    }

    if (choice == "suggestions") {
        interaction.guild.channels.create("suggestions", {
            type: "GUILD_TEXT"
        }).then((ch) => {
            client.createChannelSetup(Suggestion, ch, interaction)
        })
    }

    if (choice == "starboard") {
        interaction.guild.channels.create("starboard", {
            type: "GUILD_TEXT"
        }).then((ch) => {
            client.createChannelSetup(StarBoard, ch, interaction)
        })
    }
}

 