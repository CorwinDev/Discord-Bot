const Discord = require("discord.js");

const Schema = require("../../database/models/channelList");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const type = interaction.options.getString("type");
  const channel = interaction.options.getChannel("channel");

  if (type == "add") {
    Schema.findOne({ Guild: interaction.guild.id }).then(async (data) => {
      if (data) {
        if (data.Channels.includes(channel.id)) {
          return client.errNormal(
            {
              error: `The channel ${channel} is already in the database!`,
              type: "editreply",
            },
            interaction,
          );
        }

        data.Channels.push(channel.id);
        data.save();
      } else {
        new Schema({
          Guild: interaction.guild.id,
          Channels: channel.id,
        }).save();
      }
    });

    client.succNormal(
      {
        text: `Channel has been added to the whitelist!`,
        fields: [
          {
            name: `📘┆Channel`,
            value: `${channel} (${channel.name})`,
          },
        ],
        type: "editreply",
      },
      interaction,
    );
  } else if (type == "remove") {
    Schema.findOne({ Guild: interaction.guild.id }).then(async (data) => {
      if (data) {
        if (!data.Channels.includes(channel.id)) {
          return client.errNormal(
            {
              error: `The channel ${channel} doesn't exist in the database!`,
              type: "editreply",
            },
            interaction,
          );
        }

        const filtered = data.Channels.filter(
          (target) => target !== channel.id,
        );

        await Schema.findOneAndUpdate(
          { Guild: interaction.guild.id },
          {
            Guild: interaction.guild.id,
            Channels: filtered,
          },
        );

        client.succNormal(
          {
            text: `Channel has been removed from the whitelist!`,
            fields: [
              {
                name: `📘┆Channel`,
                value: `${channel} (${channel.name})`,
              },
            ],
            type: "editreply",
          },
          interaction,
        );
      } else {
        return client.errNormal(
          {
            error: `This guild has not data!`,
            type: "editreply",
          },
          interaction,
        );
      }
    });
  }
};
