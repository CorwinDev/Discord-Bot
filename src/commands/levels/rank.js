const Discord = require('discord.js');
const Canvacord = require("canvacord");

const Functions = require("../../database/models/functions");
const Schema = require("../../database/models/levels");

module.exports = async (client, interaction, args) => {
    const data = await Functions.findOne({ Guild: interaction.guild.id });

    if (data && data.Levels == true) {
        const target = interaction.options.getUser('user') || interaction.user;
        const user = await client.fetchLevels(target.id, interaction.guild.id);
        if(!user || !user.xp) return client.errNormal({
            error: "This user has no levels!",
            type: 'editreply'
        }, interaction);
        let xpRequired = client.xpFor(user.level + 1);

        const rankCard = new Canvacord.Rank()
            .setAvatar(target.displayAvatarURL({ dynamic: false, extension: 'png' }))
            .setRequiredXP(xpRequired)
            .setCurrentXP(user.xp)
            .setLevel(user.level)
            .setProgressBar(client.config.colors.normal, "COLOR")
            .setUsername(target.username)
            .setDiscriminator(target.discriminator)
            .setStatus("dnd")
            .setRank(user.position)

        rankCard.build()
            .then(data => {
                const attachment = new Discord.AttachmentBuilder(data, { name: "RankCard.png" });
                interaction.editReply({ files: [attachment] });
            });
    }
    else {
        client.errNormal({
            error: "Levels are disabled in this guild!",
            type: 'editreply'
        }, interaction);
    }
}

