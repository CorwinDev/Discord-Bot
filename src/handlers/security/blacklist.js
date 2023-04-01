const Discord = require('discord.js');

const BlackList = require("../../database/models/blacklist");
const { blacklistedWords } = require("../../Collection");

module.exports = async (client) => {
    client.on('messageCreate', async (message) => {
        if (message.channel.type === 'DM') return;

        try {
            BlackList.findOne({ Guild: message.guild.id }, async (err, data) => {
            if (data) {
                const lowerMsg = message.content.toLowerCase();
                const splittedMsg = lowerMsg.split(' ');

                let deleting = false;

                await Promise.all(
                    splittedMsg.map((content) => {
                        try {
                            if (blacklistedWords.get(message.guild.id).includes(content.toLowerCase())) deleting = true;
                        }
                        catch { }
                    })
                )

                if (deleting) return message.delete({ timeout: 1000 });
            }
        })
        }
        catch { }
    }).setMaxListeners(0);

    client.on('messageUpdate', async (oldMessage, newMessage) => {
        if (oldMessage.content === newMessage.content) {
            return;
        }

        try {
            BlackList.findOne({ Guild: oldMessage.guild.id }, async (err, data) => {
            if (data) {
                const lowerMsg = newMessage.content.toLowerCase();
                const splittedMsg = lowerMsg.split(' ');

                let deleting = false;

                await Promise.all(
                    splittedMsg.map((content) => {
                        try {
                            if (blacklistedWords.get(newMessage.guild.id).includes(content.toLowerCase())) deleting = true;
                        }
                        catch { }
                    })
                )

                if (deleting) return newMessage.delete();
            }
        })
        }
        catch { }
    }).setMaxListeners(0);
}