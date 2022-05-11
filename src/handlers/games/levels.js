const discord = require('discord.js');

const levels = require("../../database/models/levels");

module.exports = async (client) => {
    client.setXP = async function (userId, guildId, xp) {
        const user = await levels.findOne({ userID: userId, guildID: guildId });
        if (!user) return false;

        user.xp = xp;
        user.level = Math.floor(0.1 * Math.sqrt(user.xp));
        user.lastUpdated = new Date();

        user.save();

        return user;
    }

    client.setLevel = async function (userId, guildId, level) {
        const user = await levels.findOne({ userID: userId, guildID: guildId });
        if (!user) return false;

        user.level = level;
        user.xp = level * level * 100;
        user.lastUpdated = new Date();

        user.save();

        return user;
    }

    client.addXP = async function (userId, guildId, xp) {
        const user = await levels.findOne({ userID: userId, guildID: guildId });

        if (!user) {
            const newUser = new levels({
                userID: userId,
                guildID: guildId,
                xp: xp,
                level: Math.floor(0.1 * Math.sqrt(xp))
            }).save();

            return (Math.floor(0.1 * Math.sqrt(xp)) > 0);
        }

        user.xp += parseInt(xp, 10);
        user.level = Math.floor(0.1 * Math.sqrt(user.xp));
        user.lastUpdated = new Date();

        await user.save();

        return (Math.floor(0.1 * Math.sqrt(user.xp -= xp)) < user.level);
    }

    client.addLevel = async function (userId, guildId, level) {
        const user = await levels.findOne({ userID: userId, guildID: guildId });
        if (!user) return false;

        user.level += parseInt(level, 10);
        user.xp = user.level * user.level * 100;
        user.lastUpdated = new Date();

        user.save();

        return user;
    }

    client.fetchLevels = async function (userId, guildId, fetchPosition = true) {
        const user = await levels.findOne({
            userID: userId,
            guildID: guildId
        });
        if (!user) return false;

        if (fetchPosition === true) {
            const leaderboard = await levels.find({
                guildID: guildId
            }).sort([['xp', 'descending']]).exec();

            user.position = leaderboard.findIndex(i => i.userID === userId) + 1;
        }

        user.cleanXp = user.xp - client.xpFor(user.level);
        user.cleanNextLevelXp = client.xpFor(user.level + 1) - client.xpFor(user.level);

        return user;
    }

    client.xpFor = function (targetLevel) {
        return targetLevel * targetLevel * 100;
    }
}