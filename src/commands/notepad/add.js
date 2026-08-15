const Discord = require("discord.js");
const generator = require("generate-password");

const Schema = require("../../database/models/notes");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const code = generator.generate({
    length: 4,
    lowercase: false,
    uppercase: false,
    numbers: true,
  });

  let note = interaction.options.getString("note");

  Schema.findOne({ Guild: interaction.guild.id, Code: code }).then(
    async (data) => {
      if (!data) {
        new Schema({
          Guild: interaction.guild.id,
          User: interaction.user.id,
          Code: code,
          Note: note,
        }).save();

        client.succNormal(
          {
            text: "Note has been added! \`/notepad notes\` to see all your notes",
            type: "editreply",
          },
          interaction,
        );
      }
    },
  );
};
