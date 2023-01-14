const Discord = require('discord.js');

const Schema = require("../../database/models/functions");

const usersMap = new Map();
const LIMIT = 5;
const TIME = 10000;
const DIFF = 3000;

module.exports = async (client) => {
    client.on('messageCreate', async (message) => {
        if (message.author.bot || message.channel.type === 'DM') return;

        Schema.findOne({ Guild: message.guild.id }, async (err, data) => {
            if (data) {
                if (data.AntiSpam == true) {
                    if (usersMap.has(message.author.id)) {
                        const userData = usersMap.get(message.author.id);
                        const { lastMessage, timer } = userData;
                        const difference = message.createdTimestamp - lastMessage.createdTimestamp;
                        let msgCount = userData.msgCount;

                        if (difference > DIFF) {
                            clearTimeout(timer);
                            userData.msgCount = 1;
                            userData.lastMessage = message;
                            userData.timer = setTimeout(() => {
                                usersMap.delete(message.author.id);
                            }, TIME);
                            usersMap.set(message.author.id, userData)
                        }
                        else {
                            ++msgCount;
                            if (parseInt(msgCount) === LIMIT) {
                                message.delete();

                                client.embed({
                                    title: `${client.emotes.normal.error}・Moderator`,
                                    desc: `It is not allowed to spam in this server!`,
                                    color: client.config.colors.error,
                                    content: `${message.author}`
                                }, message.channel)
                            } else {
                                userData.msgCount = msgCount;
                                usersMap.set(message.author.id, userData);
                            }
                        }
                    }
                    else {
                        let fn = setTimeout(() => {
                            usersMap.delete(message.author.id);
                        }, TIME);
                        usersMap.set(message.author.id, {
                            msgCount: 1,
                            lastMessage: message,
                            timer: fn
                        });
                    }
                }
            }
        })
    }).setMaxListeners(0);
}