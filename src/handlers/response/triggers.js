const Discord = require('discord.js');
const Triggers = require('../../database/models/triggers');

module.exports = async (client) => {
    client.on(Discord.Events.MessageCreate, async (message) => {
        if (message.channel.type === Discord.ChannelType.DM) return;
        if (message.author.bot) return;
        try {
            const data = await Triggers.findOne({ Guild: message.guild.id });

            if (data) {
                const messageStripped = message.content.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '');

                for (const trigger of data.Triggers) {
                    if (trigger.isActive) {
                        const regexFlags = trigger.regexFlags || '';
                        const regex = new RegExp(trigger.regex, regexFlags);
                        const args = messageStripped.match(regex);

                        if (args) {
                            const { type, response, mention, replied, emotes } = trigger;

                            if (type === 1 || type === 2) {
                                if (replied) {
                                    message.reply({
                                        content: response,
                                        allowedMentions: { repliedUser: mention }
                                    });
                                } else {
                                    message.channel.send({ content: response });
                                }
                            }

                            if (type === 2 || type === 3) {
                                message.delete({ timeout: 5000 });
                            }

                            if (type == 4) {
                                const parsedEmoji = Discord.parseEmoji(emotes);
                              
                                if (parsedEmoji.id) {
                                  // Custom emoji
                                  const emoji = client.emojis.cache.get(parsedEmoji.id);
                                  if (emoji) {
                                    message.react(emoji);
                                  }
                                } else if (parsedEmoji.name) {
                                  // Basic emoji
                                  message.react(parsedEmoji.name);
                                }
                              }
                        }
                    }
                }
            }
        } catch (err) {
            console.error(err);
        }
    }).setMaxListeners(0);

    client.on(Discord.Events.MessageUpdate, async (oldMessage, newMessage) => {
        if (!oldMessage || !newMessage || oldMessage.content === newMessage.content || newMessage.channel.type === Discord.ChannelType.DM) return;
      
        try {
          const triggers = await Triggers.findOne({ Guild: newMessage.guild.id });
          if (!triggers) return;
      
          for (const trigger of triggers.Triggers) {
            if (!trigger.isActive) continue;
      
            const regex = new RegExp(trigger.regex, trigger.regexFlags);
            if (regex.test(newMessage.content)) {
              const response = trigger.response.replace(/{{user}}/g, `<@${newMessage.author.id}>`);
              const emotes = trigger.emotes ? trigger.emotes : {};
      
              const replyOptions = {
                allowedMentions: { repliedUser: trigger.mention },
              };
      
              const messageOptions = {
                reply: replyOptions,
                emotes,
              };
      
              if (!newMessage.author.bot) { // added this check
                if (trigger.type === 1) {
                  newMessage.reply(response, messageOptions);
                } else if (trigger.type === 2) {
                  newMessage.channel.send(response, messageOptions);
                }
              }
            }
          }
        } catch (err) {
          console.error(err);
        }
      }).setMaxListeners(0);
};

/*const Discord = require('discord.js');

const Triggers = require("../../database/models/triggers");

module.exports = async (client) => {
    client.on(Discord.Events.MessageCreate, async (message) => {
        if (message.channel.type === Discord.ChannelType.DM) return;

        try {
            Triggers.findOne({ Guild: message.guild.id }, async (err, data) => {
                if (data) {
                    messageStripped = message.content.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
                    for (let i = 0; i < data.Triggers[i].length ; i++) {
                        // Status active ?
                        if (data.Triggers[i].isActive) {
                
                            // Regex flags ?
                            console.log(messageStripped);
                            if (data.Triggers[i].regexFlags != "") {
                            var Regext = new RegExp(data.Triggers[i].regex,data.Triggers[i].regexFlags);
                            } else {
                            var Regext = data.Triggers[i].regex;
                            };
                
                            // Check filter regex
                            const args = messageStripped.match(Regext);
                            if(args != null) {
                                console.log(">> " + Regext);
                                console.log(">> " + data.Triggers[i].response);
                                console.log(data.Triggers[i].mention);

                                if (data.Triggers[i].type == 1 || data.Triggers[i].type == 2) {
                                    if (data.Triggers[i].replied) {
                                        message.reply({
                                            content: data.Triggers[i].response,
                                            allowedMentions: {
                                                repliedUser: data.Triggers[i].mention
                                            }
                                        });
                                    } else {
                                        message.send({
                                            content: data.Triggers[i].response
                                        })
                                    }
                                };
                                if (data.Triggers[i].type == 2 || data.Triggers[i].type == 3) {
                                    message.delete({ timeout: 1000 });
                                };
                            }  
                        }
                    }
                }
            })
        }
        catch { }
    }).setMaxListeners(0);

    client.on(Discord.Events.MessageUpdate, async (oldMessage, newMessage) => {
        if (oldMessage.content === newMessage.content || newMessage.channel.type === Discord.ChannelType.DM) return;
        try {

        }
        catch { }
    }).setMaxListeners(0);
}*/