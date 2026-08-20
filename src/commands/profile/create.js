const Schema = require("../../database/models/profile");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  Schema.findOne({ User: interaction.user.id }).then(async (data) => {
    if (data) {
      return client.errNormal(
        { error: "You already have a Bot profile", type: "editreply" },
        interaction,
      );
    } else {
      new Schema({
        User: interaction.user.id,
      }).save();

      client.succNormal(
        {
          text: "Profile created! View your profile by running \`profile\`",
          type: "editreply",
        },
        interaction,
      );
    }
  });
};
