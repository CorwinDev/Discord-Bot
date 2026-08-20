const Discord = require("discord.js");

const Schema = require("../../database/models/reactionRoles");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const category = interaction.options.getString("category");

  Schema.findOne({ Guild: interaction.guild.id, Category: category }).then(
    async (data) => {
      if (!data)
        return client.errNormal(
          {
            error: `No data found!`,
            type: "editreply",
          },
          interaction,
        );

      var remove = await Schema.deleteOne({
        Guild: interaction.guild.id,
        Category: category,
      });

      client.succNormal(
        {
          text: `**${category}** successfully deleted!`,
          type: "editreply",
        },
        interaction,
      );
    },
  );
};
