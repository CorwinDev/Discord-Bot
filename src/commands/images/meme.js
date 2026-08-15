const fetch = require("node-fetch");
const Discord = require("discord.js");
/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  fetch(`https://www.reddit.com/r/memes` + `.json?sort=top&t=week&limit=100`)
    .then((res) => res.json())
    .then(async (json) => {
      let i = Math.floor(Math.random() * json.data.children.length);
      let image = json.data.children[i].data.url;
      let caption = json.data.children[i].data.title;
      let embed = new Discord.EmbedBuilder()
        .setTitle(caption)
        .setImage(image)
        .setColor(client.config.colors.normal)
        .setFooter({
          text: `👍 ${json.data.children[i].data.ups} | 💬 ${json.data.children[i].data.num_comments}`,
        });
      interaction.editReply({ embeds: [embed] });
    })
    .catch({});
};
