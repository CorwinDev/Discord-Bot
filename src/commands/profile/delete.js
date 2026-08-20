const Schema = require("../../database/models/profile");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  Schema.findOne({ User: interaction.user.id }).then(async (data) => {
    if (data) {
      Schema.findOneAndDelete({
        Guild: interaction.guild.id,
        User: interaction.user.id,
      }).then(() => {
        client.succNormal(
          {
            text: "Your profile was deleted!",
            type: "editreply",
          },
          interaction,
        );
      });
    } else {
      client.errNormal(
        {
          error: "No profile found!",
          type: "editreply",
        },
        interaction,
      );
    }
  });
};
