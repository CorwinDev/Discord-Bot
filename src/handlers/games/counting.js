const Discord = require("discord.js");

const countSchema = require("../../database/models/countChannel");
const count = require("../../database/models/count");
const math = require('mathjs');

module.exports = async (client) => {
  client
    .on("messageCreate", async (message) => {
      if (message.author.bot || message.channel.type === Discord.ChannelType.DM) return;

      if (
        message.attachments.size > 0 ||
        message.type == Discord.MessageType.ChannelPinnedMessage ||
        message.stickers.size == 1
      )
        return;
      var content = message.content.toLowerCase();
      if(isNaN(content)) {
        try {
          const result = math.evaluate(content);
          content = result;
        } catch (error) {
          return;
        }        
        
      }

      const data = await countSchema.findOne({
        Guild: message.guild.id,
        Channel: message.channel.id,
      });
      const countData = await count.findOne({ Guild: message.guild.id });

      if (data && countData) {
        if (message.author.id == countData.User) {
          try {
            client.errNormal(
              {
                error:
                  "You cannot count twice in a row! Count starts again from 1",
                type: "reply",
              },
              message
            );

            countData.Count = 1;
            countData.User = " ";
            countData.save();
            return message.react(client.emotes.normal.error);
          } catch (error) {
            message.react(client.emotes.normal.error);
            console.log(error);
          }
        } else {
          if (content == countData.Count) {
            message.react(client.emotes.normal.check);
            countData.User = message.author.id;
            countData.Count += 1;
            countData.save();
          } else {
            try {
              client.errNormal(
                {
                  error: `The correct number was ${countData.Count}! Count starts again from 1`,
                  type: "reply",
                },
                message
              );

              countData.Count = 1;
              countData.User = " ";
              countData.save();
              return message.react(client.emotes.normal.error);
            } catch (error) {
              message.react(client.emotes.normal.error);
              console.log(error)
            }
          }
        }
      } else if (data) {
        if (content == 1) {
          message.react(client.emotes.normal.check);

          new count({
            Guild: message.guild.id,
            User: message.author.id,
            Count: 2,
          }).save();
        } else {
          return message.react(client.emotes.normal.error);
        }
      }
    })
    .setMaxListeners(0);

  client
    .on("messageDelete", async (message) => {
      try {
        if (message.author.bot || message.channel.type === Discord.ChannelType.DM) return;
        
        if (
          message.attachments.size > 0 ||
          message.type == Discord.MessageType.ChannelPinnedMessage ||
          message.stickers.size == 1
        )
          return;
        var content = message.content.toLowerCase();
        if(isNaN(content)) {
          try {
            const result = math.evaluate(content);
            content = result;
          } catch (error) {
            return;
          }        
          
        }

        const data = await countSchema.findOne({
          Guild: message.guild.id,
          Channel: message.channel.id,
        });
        const countData = await count.findOne({ Guild: message.guild.id });

        if (data && countData) {
          let lastCount = countData.Count - 1;
          if (content == lastCount) {
            client.simpleEmbed(
              {
                desc: `**${message.author.tag}**: ${content}`,
              },
              message.channel
            );
          }
        }
      } catch {}
    })
    .setMaxListeners(0);
};

 
