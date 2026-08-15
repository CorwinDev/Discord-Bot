const Schema = require("../../database/models/profile");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const food = interaction.options.getString("food");
  const user = { User: interaction.user.id };

  Schema.findOne({ User: interaction.user.id }).then(async (data) => {
    if (data) {
      if (data && data.Food) {
        if (!data.Food.includes(food)) {
          return client.errNormal(
            {
              error: `That food doesn't exist in the database!`,
              type: "editreply",
            },
            interaction,
          );
        }

        const filtered = data.Food.filter((target) => target !== food);

        await Schema.findOneAndUpdate(user, {
          Food: filtered,
        });
      }
      client.succNormal(
        {
          text: "Removed your food",
          fields: [
            {
              name: "🥐┆Food",
              value: `\`\`\`${food}\`\`\``,
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
