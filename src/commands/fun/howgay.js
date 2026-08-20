/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  var result = Math.ceil(Math.random() * 100);

  client.embed(
    {
      title: `🏳️‍🌈・Gay rate`,
      desc: `You are ${result}% gay!`,
      type: "editreply",
    },
    interaction,
  );
};
