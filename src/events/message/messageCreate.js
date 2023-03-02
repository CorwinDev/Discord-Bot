const Discord = require("discord.js");

const Functions = require("../../database/models/functions");
const afk = require("../../database/models/afk");
const chatBotSchema = require("../../database/models/chatbot-channel");
const messagesSchema = require("../../database/models/messages");
const messageSchema = require("../../database/models/levelMessages");
const messageRewards = require("../../database/models/messageRewards");
const Schema = require("../../database/models/stickymessages");
const levelRewards = require("../../database/models/levelRewards");
const levelLogs = require("../../database/models/levelChannels");
const Commands = require("../../database/models/customCommand");
const CommandsSchema = require("../../database/models/customCommandAdvanced");
const list = require('../../bot.js');

module.exports = async (client, message) => {
  const dmlog = new Discord.WebhookClient({
    id: client.webhooks.dmLogs.id,
    token: client.webhooks.dmLogs.token,
  });

  if (message.author.bot) return;

  if (message.channel.type === "DM") {
    let embedLogs = new Discord.MessageEmbed()
      .setTitle(`💬・New DM message!`)
      .setDescription(`Bot has received a new DM message!`)
      .addField("👤┆Send By", `${message.author} (${message.author.tag})`, true)
      .addField(`💬┆Message`, `${message.content || "None"}`, true)
      .setColor(client.config.colors.normal)
      .setTimestamp();

    if (message.attachments.size > 0)
      embedLogs.addField(
        `📃┆Attachments`,
        `${message.attachments.first()?.url}`,
        false
      );
    return dmlog.send({
      username: "Bot DM",
      embeds: [embedLogs],
    });
  }
    // Triggers
    messageStripped = message.content.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
    for (let i = 0; i < list.trigger.length ; i++) {
        // Status active ?
        if (list.trigger[i].Active) {
          
            // Regex flags ?
            console.log(messageStripped);
            if (list.trigger[i].RegexFlags != "") {
            var Regext = new RegExp(list.trigger[i].Regex,list.trigger[i].RegexFlags);
            } else {
            var Regext = list.trigger[i].Regex;
            };

            // Check filter regex
            const args = messageStripped.match(Regext);
            if(args != null) {
                console.log(">> " + Regext);
                console.log(">> " + list.trigger[i].Response);
                console.log(list.trigger[i].Mention);
                // Reply active ?
                message.reply({
                    content: list.trigger[i].Response,
                    allowedMentions: {
                        repliedUser: list.trigger[i].Mention
                    }
                });
    
                // Deleting active ?
                if (list.trigger[i].Deleting) {
                    message.delete({ timeout: 1000 });
                }
                
            }  
          }
        
    }
      

  // Levels
  Functions.findOne({ Guild: message.guild.id }, async (err, data) => {
    if (data) {
      if (data.Levels == true) {
        const randomXP = Math.floor(Math.random() * 9) + 1;
        const hasLeveledUp = await client.addXP(
          message.author.id,
          message.guild.id,
          randomXP
        );

        if (hasLeveledUp) {
          const user = await client.fetchLevels(
            message.author.id,
            message.guild.id
          );

          const levelData = await levelLogs.findOne({
            Guild: message.guild.id,
          });
          const messageData = await messageSchema.findOne({
            Guild: message.guild.id,
          });

          if (messageData) {
            var levelMessage = messageData.Message;
            levelMessage = levelMessage.replace(
              `{user:username}`,
              message.author.username
            );
            levelMessage = levelMessage.replace(
              `{user:discriminator}`,
              message.author.discriminator
            );
            levelMessage = levelMessage.replace(
              `{user:tag}`,
              message.author.tag
            );
            levelMessage = levelMessage.replace(
              `{user:mention}`,
              message.author
            );

            levelMessage = levelMessage.replace(`{user:level}`, user.level);
            levelMessage = levelMessage.replace(`{user:xp}`, user.xp);

            try {
              if (levelData) {
                await client.channels.cache
                  .get(levelData.Channel)
                  .send({ content: levelMessage })
                  .catch(() => {});
              } else {
                await message.channel.send({ content: levelMessage });
              }
            } catch {
              await message.channel.send({ content: levelMessage });
            }
          } else {
            try {
              if (levelData) {
                await client.channels.cache
                  .get(levelData.Channel)
                  .send({
                    content: `**GG** <@!${message.author.id}>, you are now level **${user.level}**`,
                  })
                  .catch(() => {});
              } else {
                message.channel.send({
                  content: `**GG** <@!${message.author.id}>, you are now level **${user.level}**`,
                });
              }
            } catch {
              message.channel.send({
                content: `**GG** <@!${message.author.id}>, you are now level **${user.level}**`,
              });
            }
          }

          levelRewards.findOne(
            { Guild: message.guild.id, Level: user.level },
            async (err, data) => {
              if (data) {
                message.guild.members.cache
                  .get(message.author.id)
                  .roles.add(data.Role)
                  .catch((e) => {});
              }
            }
          );
        }
      }
    }
  });

  // Message tracker system
  messagesSchema.findOne(
    { Guild: message.guild.id, User: message.author.id },
    async (err, data) => {
      if (data) {
        data.Messages += 1;
        data.save();

        messageRewards.findOne(
          { Guild: message.guild.id, Messages: data.Messages },
          async (err, data) => {
            if (data) {
              try {
                message.guild.members.cache
                  .get(message.author.id)
                  .roles.add(data.Role);
              } catch {}
            }
          }
        );
      } else {
        new messagesSchema({
          Guild: message.guild.id,
          User: message.author.id,
          Messages: 1,
        }).save();
      }
    }
  );

  // AFK system
  afk.findOne(
    { Guild: message.guild.id, User: message.author.id },
    async (err, data) => {
      if (data) {
        await afk.deleteOne({
          Guild: message.guild.id,
          User: message.author.id,
        });

        client
          .simpleEmbed(
            {
              desc: `${message.author} is no longer afk!`,
            },
            message.channel
          )
          .then(async (m) => {
            setTimeout(() => {
              m.delete();
            }, 5000);
          });

        if (message.member.displayName.startsWith(`[AFK] `)) {
          let name = message.member.displayName.replace(`[AFK] `, ``);
          message.member.setNickname(name).catch((e) => {});
        }
      }
    }
  );

  message.mentions.users.forEach(async (u) => {
    if (
      !message.content.includes("@here") &&
      !message.content.includes("@everyone")
    ) {
      afk.findOne(
        { Guild: message.guild.id, User: u.id },
        async (err, data) => {
          if (data) {
            client.simpleEmbed(
              { desc: `${u} is currently afk! **Reason:** ${data.Message}` },
              message.channel
            );
          }
        }
      );
    }
  });

  // Chat bot
  chatBotSchema.findOne({ Guild: message.guild.id }, async (err, data) => {
    if (!data) return;
    if (message.channel.id !== data.Channel) return;

    try {
      const input = message;
      try {
        fetch(
          `https://api.monkedev.com/fun/chat?msg=${encodeURIComponent(input)}`
        )
          .catch(() => {})
          .then((res) => res.json())
          .catch(() => {})
          .then(async (json) => {
            if (json) {
              if (
                json.response !== " " ||
                json.response !== undefined ||
                json.response !== "" ||
                json.response !== null
              ) {
                try {
                  return message
                    .reply({ content: json.response })
                    .catch(() => {});
                } catch {}
              }
            }
          })
          .catch(() => {});
      } catch {}
    } catch {}
  });

  // Sticky messages
  try {
    Schema.findOne(
      { Guild: message.guild.id, Channel: message.channel.id },
      async (err, data) => {
        if (!data) return;

        const lastStickyMessage = await message.channel.messages
          .fetch(data.LastMessage)
          .catch(() => {});
        if (!lastStickyMessage) return;
        await lastStickyMessage.delete({ timeout: 1000 });

        const newMessage = await client.simpleEmbed(
          { desc: `${data.Content}` },
          message.channel
        );

        data.LastMessage = newMessage.id;
        data.save();
      }
    );
  } catch {}

  // Prefix
  var guildSettings = await Functions.findOne({ Guild: message.guild.id });
  if (!guildSettings) {
    new Functions({
      Guild: message.guild.id,
      Prefix: client.config.discord.prefix,
    }).save();

    guildSettings = await Functions.findOne({ Guild: message.guild.id });
  }

  if (!guildSettings || !guildSettings.Prefix) {
    Functions.findOne({ Guild: message.guild.id }, async (err, data) => {
      data.Prefix = client.config.discord.prefix;
      data.save();
    });

    guildSettings = await Functions.findOne({ Guild: message.guild.id });
  }

  if (!guildSettings || !guildSettings.Prefix) {
    var prefix = client.config.Discord.prefix;
  } else {
    var prefix = guildSettings.Prefix;
  }

};

