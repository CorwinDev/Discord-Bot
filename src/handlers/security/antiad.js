const Discord = require("discord.js");

const Schema = require("../../database/models/functions");
const Schema2 = require("../../database/models/channelList");

module.exports = (client) => {
    client.on('messageCreate', async (message) => {
        if (message.channel.type === 'DM') return;

        Schema.findOne({ Guild: message.guild.id }, async (err, data) => {
            if (data) {
                if (data.AntiInvite == true) {
                    const { guild, member, content } = message

                    const code = content.split('discord.gg/')[1]
                    if (code) {
                        Schema2.findOne({ Guild: message.guild.id }, async (err, data2) => {
                            if (data2) {
                                if (data2.Channels.includes(message.channel.id) || message.member.permissions.has(Discord.Permissions.FLAGS.MANAGE_MESSAGES)) {
                                    return;
                                }

                                message.delete();

                                client.embed({
                                    title: `${client.emotes.normal.error}・Moderator`,
                                    desc: `Discord links are not allowed in this server!`,
                                    color: client.config.colors.error,
                                    content: `${message.author}`
                                }, message.channel)
                            }
                            else {
                                message.delete();

                                client.embed({
                                    title: `${client.emotes.normal.error}・Moderator`,
                                    desc: `Discord links are not allowed in this server!`,
                                    color: client.config.colors.error,
                                    content: `${message.author}`
                                }, message.channel)
                            }
                        })
                    }
                }
                else if (data.AntiLinks == true) {
                    const { guild, member, content } = message

                    if (content.includes('http://') || content.includes('https://') || content.includes('www.')) {
                        Schema2.findOne({ Guild: message.guild.id }, async (err, data2) => {
                            if (data2) {
                                if (data2.Channels.includes(message.channel.id) || message.member.permissions.has(Discord.Permissions.FLAGS.MANAGE_MESSAGES)) {
                                    return;
                                }

                                message.delete();

                                client.embed({
                                    title: `${client.emotes.normal.error}・Moderator`,
                                    desc: `Links are not allowed in this server!`,
                                    color: client.config.colors.error,
                                    content: `${message.author}`
                                }, message.channel)
                            }
                            else {
                                message.delete();
                               
                                client.embed({
                                    title: `${client.emotes.normal.error}・Moderator`,
                                    desc: `Links are not allowed in this server!`,
                                    color: client.config.colors.error,
                                    content: `${message.author}`
                                }, message.channel)
                            }
                        })
                    }
                }
            }
        })
    }).setMaxListeners(0);

    client.on('messageUpdate', async (oldMessage, newMessage) => {
        if (oldMessage.content === newMessage.content) {
            return;
        }

        Schema.findOne({ Guild: newMessage.guild.id }, async (err, data) => {
            if (data) {
                if (data.AntiInvite == true) {
                    const { guild, member, content } = newMessage

                    const code = content.split('discord.gg/')[1]
                    if (code) {
                        Schema2.findOne({ Guild: newMessage.guild.id }, async (err, data2) => {
                            if (data2) {
                                if (data2.Channels.includes(newMessage.channel.id) || newMessage.member.permissions.has(Discord.Permissions.FLAGS.MANAGE_MESSAGES)) {
                                    return;
                                }

                                newMessage.delete();
                                let error = new Discord.MessageEmbed()
                                    .setTitle(`${client.emotes.normal.error}・Moderator`)
                                    .setAuthor(client.user.username, client.user.avatarURL())
                                    .setDescription(`Discord links are not allowed in this server!`)
                                    .setColor(client.config.colors.error)
                                    .setFooter(client.config.discord.footer)
                                    .setTimestamp();
                                newMessage.channel.send({ content: `${newMessage.author}`, embeds: [error] })
                            }
                            else {
                                newMessage.delete();
                                let error = new Discord.MessageEmbed()
                                    .setTitle(`${client.emotes.normal.error}・Moderator`)
                                    .setAuthor(client.user.username, client.user.avatarURL())
                                    .setDescription(`Discord links are not allowed in this server!`)
                                    .setColor(client.config.colors.error)
                                    .setFooter(client.config.discord.footer)
                                    .setTimestamp();
                                newMessage.channel.send({ content: `${newMessage.author}`, embeds: [error] })
                            }
                        })
                    }
                }
                else if (data.AntiLinks == true) {
                    const { guild, member, content } = newMessage

                    if (content.includes('http://') || content.includes('https://') || content.includes('www.')) {
                        Schema2.findOne({ Guild: newMessage.guild.id }, async (err, data2) => {
                            if (data2) {
                                if (data2.Channels.includes(newMessage.channel.id) || newMessage.member.permissions.has(Discord.Permissions.FLAGS.MANAGE_MESSAGES)) {
                                    return;
                                }

                                newMessage.delete();
                                var error = new Discord.MessageEmbed()
                                    .setTitle(`${client.emotes.normal.error}・Moderator`)
                                    .setAuthor(client.user.username, client.user.avatarURL())
                                    .setDescription(`Links are not allowed in this server!`)
                                    .setColor(client.config.colors.error)
                                    .setFooter(client.config.discord.footer)
                                    .setTimestamp();
                                newMessage.channel.send({ content: `${newMessage.author}`, embeds: [error] })
                            }
                            else {
                                newMessage.delete();
                                var error = new Discord.MessageEmbed()
                                    .setTitle(`${client.emotes.normal.error}・Moderator`)
                                    .setAuthor(client.user.username, client.user.avatarURL())
                                    .setDescription(`Links are not allowed in this server!`)
                                    .setColor(client.config.colors.error)
                                    .setFooter(client.config.discord.footer)
                                    .setTimestamp();
                                newMessage.channel.send({ content: `${newMessage.author}`, embeds: [error] })
                            }
                        })
                    }
                }
            }
        })
    }).setMaxListeners(0);
}