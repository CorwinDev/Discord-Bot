const Discord = require("discord.js");
const fetch = require("node-fetch");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  fetch(`https://some-random-api.com/facts/dog`)
    .then((res) => res.json())
    .catch({})
    .then(async (json) => {
      client.embed(
        {
          title: `💡・Random dog fact`,
          desc: json.fact,
          type: "editreply",
        },
        interaction,
      );
    })
    .catch({});
};
