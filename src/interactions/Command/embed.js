const { CommandInteraction, Client } = require("discord.js");
const { SlashCommandBuilder } = require("discord.js");
const { ChannelType } = require("discord.js");
const Discord = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("embed")
    .setDescription("Generate an embed")
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("Channel where the embed should be")
        .setRequired(true)
        .addChannelTypes(ChannelType.GuildText)
    ),
  /**
   * @param {Client} client
   * @param {CommandInteraction} interaction
   * @param {String[]} args
   */

  run: async (client, interaction, args) => {
    await interaction.deferReply({ fetchReply: true });
    const perms = await client.checkPerms(
      {
        flags: [Discord.PermissionsBitField.Flags.ManageMessages],
        perms: [Discord.PermissionsBitField.Flags.ManageMessages],
      },
      interaction
    );

    if (perms == false) return;

    let row = new Discord.ActionRowBuilder().addComponents(
      new Discord.StringSelectMenuBuilder()
        .setCustomId("embedSelect")
        .setPlaceholder("Nothing selected")
        .addOptions([
          {
            emoji: "✏️",
            label: "Title",
            description: "Create a embed title",
            value: "title_embed",
          },
          {
            emoji: "💬",
            label: "Description",
            description: "Create a embed description",
            value: "description_embed",
          },
          {
            emoji: "🕵️",
            label: "Author",
            description: "Create a embed author",
            value: "author_embed",
          },
          {
            emoji: "🔻",
            label: "Footer",
            description: "Create a embed footer",
            value: "footer_embed",
          },
          {
            emoji: "🔳",
            label: "Thumbnail",
            description: "Create a embed thumbnail",
            value: "thumbnail_embed",
          },
          {
            emoji: "🕙",
            label: "Timestamp",
            description: "Create a embed timestamp",
            value: "timestamp_embed",
          },
          {
            emoji: "🖼️",
            label: "Image",
            description: "Create a embed image",
            value: "image_embed",
          },
          {
            emoji: "🌐",
            label: "URL",
            description: "Create a embed url",
            value: "url_embed",
          },
          {
            emoji: "🔵",
            label: "Color",
            description: "Create a embed color",
            value: "color_embed",
          },
        ])
    );

    let row2 = new Discord.ActionRowBuilder().addComponents(
      new Discord.ButtonBuilder()
        .setCustomId("send_embed")
        .setEmoji("✅")
        .setLabel("Send embed")
        .setStyle(Discord.ButtonStyle.Success)
    );

    let embed = new Discord.EmbedBuilder().setDescription(
      `Please select some options`
    );

    interaction.editReply({ embeds: [embed], components: [row, row2] });

    const filter = (i) => i.user.id === interaction.user.id;
    const collector = interaction.channel.createMessageComponentCollector({
      filter,
    });

    collector.on("collect", async (i) => {
      if (i.customId === "embedSelect") {
        i.deferUpdate();

        if (i.values == "title_embed") {
          interaction.channel
            .send({ content: "Please enter a title" })
            .then((message) => {
              const filterMessage = (m) =>
                m.author.id === interaction.user.id && !m.author.bot;
              interaction.channel
                .awaitMessages({
                  filterMessage,
                  max: 1,
                  time: 300000,
                  errors: ["time"],
                })
                .then(async (collected) => {
                  message.delete({ timeout: 1000 });
                  collected.delete({ timeout: 1000 });

                  embed.setTitle(`${collected.first().content}`);
                  await interaction.editReply({ embeds: [embed] });
                });
            });
        }

        if (i.values == "description_embed") {
          interaction.channel
            .send({ content: "Please enter a description" })
            .then((message) => {
              const filterMessage = (m) =>
                m.author.id === interaction.user.id && !m.author.bot;
              interaction.channel
                .awaitMessages({
                  filterMessage,
                  max: 1,
                  time: 300000,
                  errors: ["time"],
                })
                .then(async (collected) => {
                  message.delete({ timeout: 1000 });
                  collected.delete({ timeout: 1000 });

                  embed.setDescription(`${collected.first().content}`);
                  await interaction.editReply({ embeds: [embed] });
                });
            });
        }

        if (i.values == "author_embed") {
          interaction.channel
            .send({ content: "Please enter a author" })
            .then((message) => {
              const filterMessage = (m) =>
                m.author.id === interaction.user.id && !m.author.bot;
              interaction.channel
                .awaitMessages({
                  filterMessage,
                  max: 1,
                  time: 300000,
                  errors: ["time"],
                })
                .then(async (collected) => {
                  message.delete({ timeout: 1000 });
                  collected.delete({ timeout: 1000 });

                  embed.setAuthor({
                    name: `${collected.first().content}`,
                    iconURL: interaction.guild.iconURL({ size: 1024 }),
                  });
                  await interaction.editReply({ embeds: [embed] });
                });
            });
        }

        if (i.values == "footer_embed") {
          interaction.channel
            .send({ content: "Please enter a footer" })
            .then((message) => {
              const filterMessage = (m) =>
                m.author.id === interaction.user.id && !m.author.bot;
              interaction.channel
                .awaitMessages({
                  filterMessage,
                  max: 1,
                  time: 300000,
                  errors: ["time"],
                })
                .then(async (collected) => {
                  message.delete({ timeout: 1000 });
                  collected.delete({ timeout: 1000 });

                  embed.setFooter({
                    text: `${collected.first().content}`,
                  });
                  await interaction.editReply({ embeds: [embed] });
                });
            });
        }

        if (i.values == "thumbnail_embed") {
          interaction.channel
            .send({ content: "Please enter a thumbnail" })
            .then((message) => {
              const filterMessage = (m) =>
                m.author.id === interaction.user.id && !m.author.bot;
              interaction.channel
                .awaitMessages({
                  filterMessage,
                  max: 1,
                  time: 300000,
                  errors: ["time"],
                })
                .then(async (collected) => {
                  message.delete({ timeout: 1000 });
                  collected.delete({ timeout: 1000 });

                  if (
                    !collected.first().content.includes("http://") &&
                    !collected.first().content.includes("https://")
                  )
                    return interaction.channel.send({
                      content: "Incorrect thumbnail link!",
                    });
                  embed.setThumbnail(`${collected.first().content}`);
                  await interaction.editReply({ embeds: [embed] });
                });
            });
        }

        if (i.values == "thumbnail_embed") {
          embed.setTimestamp();
          interaction.editReply({ embeds: [embed] });
        }

        if (i.values == "image_embed") {
          interaction.channel
            .send({ content: "Please enter a image" })
            .then((message) => {
              const filterMessage = (m) =>
                m.author.id === interaction.user.id && !m.author.bot;
              interaction.channel
                .awaitMessages({
                  filterMessage,
                  max: 1,
                  time: 300000,
                  errors: ["time"],
                })
                .then(async (collected) => {
                  message.delete({ timeout: 1000 });
                  collected.delete({ timeout: 1000 });

                  if (
                    !collected.first().content.includes("http://") &&
                    !collected.first().content.includes("https://")
                  )
                    return interaction.channel.send({
                      content: "Incorrect image link!",
                    });
                  embed.setImage(`${collected.first().content}`);
                  await interaction.editReply({ embeds: [embed] });
                });
            });
        }

        if (i.values == "url_embed") {
          interaction.channel
            .send({ content: "Please enter a url" })
            .then((message) => {
              const filterMessage = (m) =>
                m.author.id === interaction.user.id && !m.author.bot;
              interaction.channel
                .awaitMessages({
                  filterMessage,
                  max: 1,
                  time: 300000,
                  errors: ["time"],
                })
                .then(async (collected) => {
                  message.delete({ timeout: 1000 });
                  collected.delete({ timeout: 1000 });

                  if (
                    !collected.first().content.includes("http://") &&
                    !collected.first().content.includes("https://")
                  )
                    return interaction.channel.send({
                      content: "Incorrect url!",
                    });
                  embed.setURL(`${collected.first().content}`);
                  await interaction.editReply({ embeds: [embed] });
                });
            });
        }

        if (i.values == "color_embed") {
          interaction.channel
            .send({ content: "Please enter a color. e.g. #FF0000" })
            .then((message) => {
              const filterMessage = (m) =>
                m.author.id === interaction.user.id && !m.author.bot;
              interaction.channel
                .awaitMessages({
                  filterMessage,
                  max: 1,
                  time: 300000,
                  errors: ["time"],
                })
                .then(async (collected) => {
                  message.delete({ timeout: 1000 });
                  collected.delete({ timeout: 1000 });

                  embed.setColor(`${collected.first().content}`);
                  await interaction.editReply({ embeds: [embed] });
                });
            });
        }
      }
      if (i.customId == "send_embed") {
        const channel = interaction.options.getChannel("channel");
        if (!channel)
          return client.errNormal(
            { error: `Channel not found` },
            collected.first().channel
          );

        channel
          .createWebhook({
            name: interaction.guild.name,
            avatar: interaction.guild.iconURL(),
          })
          .then(async (_webhook) => {
            await _webhook.send({ embeds: [embed] });

            client.succNormal(
              {
                text: `Embed successfully sent in ${channel}`,
                components: [],
                type: "editreply",
              },
              interaction
            );
            collector.stop();

            setTimeout(() => {
              _webhook.delete();
              i.message.delete();
            }, 5000);
          });
      }
    });
  },
};

 
