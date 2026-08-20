const Discord = require("discord.js");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  var list = "";
  client.guilds.cache.forEach((guild) => {
    list += `${guild.name} (${guild.id}) | ${guild.memberCount} members | Owner: ${guild.ownerId}\n`;
  });

  const output = new Discord.AttachmentBuilder(Buffer.from(list), {
    name: "servers.txt",
  });
  interaction.editReply({ files: [output] });
};
