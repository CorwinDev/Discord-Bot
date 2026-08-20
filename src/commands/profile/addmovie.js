const Schema = require("../../database/models/profile");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const movie = interaction.options.getString("movie");

  Schema.findOne({ User: interaction.user.id }).then(async (data) => {
    if (data) {
      if (data && data.Movies) {
        if (data.Movies.includes(movie)) {
          return client.errNormal(
            {
              error: `That movie is already exists in your database!`,
              type: "editreply",
            },
            interaction,
          );
        }
        data.Movies.push(movie);
        data.save();
      } else {
        data.Movies = movie;
        data.save();
      }
      client.succNormal(
        {
          text: "Added your movie",
          fields: [
            {
              name: "🎬┆Movies",
              value: `\`\`\`${movie}\`\`\``,
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
