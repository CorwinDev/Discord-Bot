const Discord = require('discord.js');
const fetch = require("node-fetch");

const Functions = require("../../database/models/functions");
const VoiceSchema = require("../../database/models/voiceChannels");

module.exports = async (client) => {
    //----------------------------------------------------------------//
    //                         Permissions                            //
    //----------------------------------------------------------------//
    // All bitfields to name
    client.bitfieldToName = function (bitfield) {
        const permissions = new Discord.PermissionsBitField(bitfield);
        return permissions.toArray();
    }
    client.checkPerms = async function ({
        flags: flags,
        perms: perms
    }, interaction) {
        for (let i = 0; i < flags.length; i++) {
            if (!interaction.member.permissions.has(flags[i])) {
                client.errMissingPerms({
                    perms: client.bitfieldToName(flags[i]) || flags[i],
                    type: 'editreply'
                }, interaction);

                return false
            }
            if (!interaction.guild.members.me.permissions.has(flags[i])) {
                client.errNoPerms({
                    perms: client.bitfieldToName(flags[i]) || flags[i],
                    type: 'editreply'
                }, interaction);

                return false
            }
        }
    }
    client.checkBotPerms = async function ({
        flags: flags,
        perms: perms
    }, interaction) {
        for (let i = 0; i < flags.length; i++) {
             if (!interaction.guild.members.me.permissions.has(flags[i])) {
                client.errNoPerms({
                    perms: client.bitfieldToName(flags[i]) || flags[i],
                    type: 'editreply'
                }, interaction);

                return false
            }
        }
    }
    client.checkUserPerms = async function ({
        flags: flags,
        perms: perms
    }, interaction) {
        for (let i = 0; i < flags.length; i++) {
            if (!interaction.member.permissions.has(flags[i])) {
                client.errMissingPerms({
                    perms: client.bitfieldToName(flags[i]) || flags[i],
                    type: 'editreply'
                }, interaction);

                return false
            }
        }
    }

    client.getChannel = function (channel, message) {
        return message.mentions.channels.first() || message.guild.channels.cache.get(channel) || message.guild.channels.cache.find(c => c.name == channel);
    }

    client.removeMentions = function (str) {
        return str.replaceAll('@', '@\u200b');
    }

    client.loadSubcommands = async function (client, interaction, args) {
        try {
            const data = await Functions.findOne({ Guild: interaction.guild.id });

            if (data.Beta == true) {
                return require(`${process.cwd()}/src/commands/${interaction.commandName}/${interaction.options.getSubcommand()}-beta`)(client, interaction, args).catch(err => {
                    client.emit("errorCreate", err, interaction.commandName, interaction)
                })
            }
            else {
                return require(`${process.cwd()}/src/commands/${interaction.commandName}/${interaction.options.getSubcommand()}`)(client, interaction, args).catch(err => {
                    client.emit("errorCreate", err, interaction.commandName, interaction)
                })
            }
        }
        catch {
            return require(`${process.cwd()}/src/commands/${interaction.commandName}/${interaction.options.getSubcommand()}`)(client, interaction, args).catch(err => {
                client.emit("errorCreate", err, interaction.commandName, interaction)
            })
        }
    }

    client.checkVoice = async function (guild, channel) {
        const data = await VoiceSchema.findOne({ Guild: guild.id, Channel: channel.id });
        if (data) {
            return true;
        }
        else {
            return false;
        }
    }

    client.generateEmbed = async function (start, end, lb, title, interaction) {
        const current = lb.slice(start, end + 10);
        const result = current.join("\n");

        let embed = client.templateEmbed()
            .setTitle(`${title}`)
            .setDescription(`${result.toString()}`)

        const functiondata = await Functions.findOne({ Guild: interaction.guild.id });

        if (functiondata && functiondata.Color) {
            embed.setColor(functiondata.Color)
        }

        return embed;
    }

    client.createLeaderboard = async function (title, lb, interaction) {
        interaction.editReply({ embeds: [await client.generateEmbed(0, 0, lb, title, interaction)], fetchReply: true }).then(async msg => {
            if (lb.length <= 10) return;

            let button1 = new Discord.ButtonBuilder()
                .setCustomId('back_button')
                .setEmoji('⬅️')
                .setStyle(Discord.ButtonStyle.Primary)
                .setDisabled(true);

            let button2 = new Discord.ButtonBuilder()
                .setCustomId('forward_button')
                .setEmoji('➡️')
                .setStyle(Discord.ButtonStyle.Primary);

            let row = new Discord.ActionRowBuilder()
                .addComponents(button1, button2);

            msg.edit({ embeds: [await client.generateEmbed(0, 0, lb, title, interaction)], components: [row] })

            let currentIndex = 0;
            const collector = interaction.channel.createMessageComponentCollector({ componentType: Discord.ComponentType.Button, time: 60000 });

            collector.on('collect', async (btn) => {
                if (btn.user.id == interaction.user.id && btn.message.id == msg.id) {
                    btn.customId === "back_button" ? currentIndex -= 10 : currentIndex += 10;

                    let btn1 = new Discord.ButtonBuilder()
                        .setCustomId('back_button')
                        .setEmoji('⬅️')
                        .setStyle(Discord.ButtonStyle.Primary)
                        .setDisabled(true);

                    let btn2 = new Discord.ButtonBuilder()
                        .setCustomId('forward_button')
                        .setEmoji('➡️')
                        .setStyle(Discord.ButtonStyle.Primary)
                        .setDisabled(true);

                    if (currentIndex !== 0) btn1.setDisabled(false);
                    if (currentIndex + 10 < lb.length) btn2.setDisabled(false);

                    let row2 = new Discord.ActionRowBuilder()
                        .addComponents(btn1, btn2);

                    msg.edit({ embeds: [await client.generateEmbed(currentIndex, currentIndex, lb, title, interaction)], components: [row2] });
                    btn.deferUpdate();
                }
            })

            collector.on('end', async (btn) => {
                let btn1Disable = new Discord.ButtonBuilder()
                    .setCustomId('back_button')
                    .setEmoji('⬅️')
                    .setStyle(Discord.ButtonStyle.Primary)
                    .setDisabled(true);

                let btn2Disable = new Discord.ButtonBuilder()
                    .setCustomId('forward_button')
                    .setEmoji('➡️')
                    .setStyle(Discord.ButtonStyle.Primary)
                    .setDisabled(true);

                let rowDisable = new Discord.ActionRowBuilder()
                    .addComponents(btn1Disable, btn2Disable);

                msg.edit({ embeds: [await client.generateEmbed(currentIndex, currentIndex, lb, title, interaction)], components: [rowDisable] });
            })
        })
    }

    client.generateActivity = function (id, name, channel, interaction) {
        fetch(`https://discord.com/api/v10/channels/${channel.id}/invites`, {
            method: "POST",
            body: JSON.stringify({
                max_age: 86400,
                max_uses: 0,
                target_application_id: id,
                target_type: 2,
                temporary: false,
                validate: null
            }),
            headers: {
                "Authorization": `Bot ${client.token}`,
                "Content-Type": "application/json"
            }
        }).then(res => res.json())
            .then(invite => {
                if (invite.error || !invite.code) return client.errNormal({ 
                    error: `Could not start **${name}**!`, 
                    type: 'editreply'
                }, interaction);

                const row = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setLabel("Start activity")
                            .setURL(`https://discord.gg/${invite.code}`)
                            .setStyle(Discord.ButtonStyle.Link),
                    );

                client.embed({
                    title: `${client.emotes.normal.tv}・Activities`,
                    desc: `Click on the **button** to start **${name}** in **${channel.name}**`,
                    components: [row],
                    type: 'editreply'
                }, interaction)
            })
            .catch(e => {
                console.log(e)
                client.errNormal({
                    error: `Could not start **${name}**!`,
                    type: 'editreply'
                }, interaction);
            })
    }
}

 