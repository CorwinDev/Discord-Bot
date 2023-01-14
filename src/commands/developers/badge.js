const Discord = require('discord.js');

const model = require('../../database/models/badge');

const webhookClientLogs = new Discord.WebhookClient({
    id: "",
    token: "",
});

module.exports = async (client, interaction, args) => {
    const badgeFlags = {
        DEVELOPER: client.emotes.badges.developer,
        EVENT: client.emotes.badges.event,
        BOOSTER: client.emotes.badges.booster,
        BUGS: client.emotes.badges.bug,
        MANAGEMENT: client.emotes.badges.management,
        PREMIUM: client.emotes.badges.premium,
        SUPPORTER: client.emotes.badges.supporter,
        TEAM: client.emotes.badges.team,
        BOOSTER: client.emotes.badges.booster,
        PARTNER: client.emotes.badges.partner,
        VOTER: client.emotes.badges.voter,
        SUPPORT: client.emotes.badges.support,
        MODERATOR: client.emotes.badges.moderator,
        DESIGNER: client.emotes.badges.designer,
        MARKETING: client.emotes.badges.marketing,
        ACTIVE: client.emotes.badges.active,
        VIP: client.emotes.badges.vip
    }

    const boolean = interaction.options.getBoolean('new');
    const member = interaction.options.getUser('user');
    const badge = interaction.options.getString('badge');

    let Badges = await model.findOne({ User: member.id });

    if (!badgeFlags[badge.toUpperCase()]) return client.errNormal({
        error: `I can't find that badge`,
        type: `editreply`
    }, interaction);

    if (boolean == true) {
        if (Badges) {
            if (Badges.FLAGS.includes(badge.toUpperCase())) return client.errNormal({
                error: `This users already has that badge!`,
                type: `editreply`
            }, interaction);

            let FLAG = badge.toUpperCase();
            let array = Badges.FLAGS;

            array.push(FLAG);

            model.findOne({ User: member.id }, async (err, data) => {
                if (err) throw err;
                data.FLAGS = array
                data.save();
            });

            client.succNormal({
                text: `Added the ${badgeFlags[badge.toUpperCase()]} (${badge.toUpperCase()}) badge!`,
                type: `editreply`
            }, interaction);
        } else {
            const newSettings = new model({ User: member.id, FLAGS: [badge.toUpperCase()] });
            await newSettings.save().catch(() => { });

            client.succNormal({
                text: `Added the ${badgeFlags[badge.toUpperCase()]} (${badge.toUpperCase()}) badge!`,
                type: `editreply`
            }, interaction)
        }

        let embedLogs = new Discord.MessageEmbed()
            .setTitle(`📛・Badge added`)
            .setDescription(`Added a new badge to ${member} (${member.id})`)
            .addField('👤┆Added By', `${interaction.user} (${interaction.user.tag})`, true)
            .addField(`📛┆Badge`, `${badgeFlags[badge.toUpperCase()]} (${badge.toUpperCase()})`, true)
            .setColor(client.config.colors.normal)
            .setFooter(client.config.discord.footer)
            .setTimestamp();
        webhookClientLogs.send({
            username: 'Bot Badges',
            embeds: [embedLogs],
        });
    }
    else if (boolean == false) {
        if (!Badges.FLAGS.includes(badge.toUpperCase())) return client.errNormal({
            error: `The user does not have this badge`,
            type: `editreply`
        }, interaction);

        let FLAG = badge.toUpperCase();
        let array = Badges.FLAGS;

        for (var i = 0; i < array.length; i++) {

            if (array[i] === FLAG) {
                array.splice(i, 1);
                i--;
            }
        }

        if (!array[0]) {
            let deleted = await model.deleteMany({ User: member.id });
            client.succNormal({
                text: `Removed the ${badgeFlags[badge.toUpperCase()]} (${badge.toUpperCase()}) badge, the user is now removed of the badge system, it has no badges left!`,
                type: 'editreply'
            }, interaction);

        } else {
            model.findOne(
                { User: member.id },
                async (err, data) => {
                    if (err) throw err;
                    data.FLAGS = array
                    data.save();
                }
            );
            client.succNormal({
                text: `Removed the ${badgeFlags[badge.toUpperCase()]} (${badge.toUpperCase()}) badge!`,
                type: 'editreply'
            }, interaction);
        }

        let embedLogs = new Discord.MessageEmbed()
            .setTitle(`📛・Badge removed`)
            .setDescription(`Removed a badge from ${member} (${member.id})`)
            .addField('👤┆Removed By', `${interaction.user} (${interaction.user.tag})`, true)
            .addField(`📛┆Badge`, `${badgeFlags[badge.toUpperCase()]} (${badge.toUpperCase()})`, true)
            .setColor(client.config.colors.normal)
            .setFooter(client.config.discord.footer)
            .setTimestamp();
        webhookClientLogs.send({
            username: 'Bot Badges',
            embeds: [embedLogs],
        });
    }
}

 