const Discord = require("discord.js");

const Schema = require("../../database/models/economy");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const user = interaction.options.getUser("user") || interaction.user;

  if (user.bot)
    return client.errNormal(
      {
        error: "You cannot see the balance of a bot!",
        type: "editreply",
      },
      interaction,
    );

  Schema.findOne({ Guild: interaction.guild.id, User: user.id }).then(
    async (data) => {
      if (data) {
        let total = data.Money + data.Bank;

        client.embed(
          {
            title: `${client.emotes.economy.coins}・Balance`,
            fields: [
              {
                name: `${client.emotes.economy.pocket}┆Wallet`,
                value: `$${data.Money}`,
                inline: true,
              },
              {
                name: `${client.emotes.economy.bank}┆Bank`,
                value: `$${data.Bank}`,
                inline: true,
              },
              {
                name: `💰┆Total`,
                value: `$${total}`,
                inline: true,
              },
            ],
            desc: `The current balance of \`${user.tag}\``,
            type: "editreply",
          },
          interaction,
        );
      } else {
        client.errNormal(
          {
            error: `The user doesn't have any money!`,
            type: "editreply",
          },
          interaction,
        );
      }
    },
  );
};
