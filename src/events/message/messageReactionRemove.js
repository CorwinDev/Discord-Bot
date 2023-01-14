const Discord = require("discord.js");

const StarBoard = require("../../database/models/starboardChannels");

module.exports = async (client, reaction, user) => {
  if (reaction.message.partial) await reaction.message.fetch().catch(() => { });
  if (reaction.partial) await reaction.fetch().catch(() => { });

  if (reaction.emoji.name === "⭐") {
    if (reaction.message.author.id === user.id) return;
    if (reaction.message.author.bot) return;

    const data = await StarBoard.findOne({ Guild: reaction.message.guild.id });
    if (!data) return;

    const starboardChannel = reaction.message.guild.channels.cache.get(data.Channel);
    if (!starboardChannel) return;

    const fetch = await starboardChannel.messages.fetch({ limit: 100 });
    const stars = fetch.find(m =>
      m.embeds[0] &&
      m.embeds[0].footer &&
      m.embeds[0].footer.text.endsWith(reaction.message.id)
    );

    if (stars) {
      const foundStar = stars.embeds[0];
      const image = reaction.message.attachments.size > 0 ? await extension(reaction, reaction.message.attachments.first()?.url) : "";
      const starMsg = await starboardChannel.messages.fetch(stars.id);
      
      if (reaction.count <= 0) {
        starMsg.delete();
      }
      else {
        client.embed({
          title: `⭐・Starboard`,
          desc: foundStar.description,
          image: image,
          fields: [
            {
              name: `⭐┇Stars`,
              value: `${reaction.count}`,
              inline: true
            },
            {
              name: `🗨️┇Message`,
              value: `[Jump to the message](${reaction.message.url})`,
              inline: true
            },
            {
              name: `👤┇Author`,
              value: `${reaction.message.author} (${reaction.message.author.tag})`,
              inline: true
            }
          ],
          footer: `${client.config.discord.footer} | ${reaction.message.id}`,
          type: 'edit'
        }, starMsg)
      }
    }
  }
};

function extension(reaction, attachment) {
  const imageLink = attachment.split(".");
  const typeOfImage = imageLink[imageLink.length - 1];
  const image = /(jpg|jpeg|png|gif)/gi.test(typeOfImage);
  if (!image) return "";
  return attachment;
}

 
