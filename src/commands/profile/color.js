const Schema = require("../../database/models/profile");
const isHexcolor = require("is-hexcolor");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const color = interaction.options.getString("color");

  Schema.findOne({ User: interaction.user.id }).then(async (data) => {
    if (data) {
      if (!isHexcolor(color))
        return client.errNormal(
          {
            error: "You did not specify an hex color! Example: #ff0000",
            type: "editreply",
          },
          interaction,
        );

      data.Color = color;
      data.save();

      client.succNormal(
        {
          text: "Your favorite color is set",
          fields: [
            {
              name: "🎨┆Color",
              value: `\`\`\`${color}\`\`\``,
              inline: true,
            },
          ],
          type: "editreply",
        },
        interaction,
      );
    } else {
      return client.errNormal(
        {
          error: "No profile found! Open a profile with createprofile",
          type: "editreply",
        },
        interaction,
      );
    }
  });
};
