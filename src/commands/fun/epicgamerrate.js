/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  var result = Math.ceil(Math.random() * 100);

  client.embed(
    {
      title: `🎮・Epic gamer rate`,
      desc: `You are ${result}% epic gamer!`,
      type: "editreply",
    },
    interaction,
  );
};
