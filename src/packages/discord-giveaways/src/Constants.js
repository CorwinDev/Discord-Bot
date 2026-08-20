const Discord = require('discord.js');

exports.DEFAULT_CHECK_INTERVAL = 15_000;
exports.DELETE_DROP_DATA_AFTER = 6.048e8; // 1 week

/**
 * The Giveaway messages that are used to display the giveaway content.
 * @typedef GiveawayMessages
 *
 * @property {string} [giveaway='🎉🎉 **GIVEAWAY** 🎉🎉'] Displayed above the giveaway embed when the giveaway is running.
 * @property {string} [giveawayEnded='🎉🎉 **GIVEAWAY ENDED** 🎉🎉'] Displayed above the giveaway embed when the giveaway has ended.
 * @property {string} [title='{this.prize}'] The title of the giveaway embed.<br>Will default to the prize of the giveaway if the value is not a string.
 * @property {string} [inviteToParticipate='React with 🎉 to participate!'] Displayed in the giveaway embed. Invite people to react to the giveaway.
 * @property {string|MessageObject} [winMessage='Congratulations, {winners}! You won **{this.prize}**!\n{this.messageURL}'] Sent in the channel when the giveaway is ended. "{winners}" will be replaced automatically with the mentions of the giveaway winners.
 * @property {string} [drawing='Drawing: {timestamp}'] Displayed below "inviteToParticipate" in the giveaway embed. "{timestamp}" will be replaced automatically with the time remaining.
 * @property {string} [dropMessage='Be the first to react with 🎉'] Displayed in the giveaway embed for drop giveaways.
 * @property {string|EmbedFooterObject} [embedFooter='{this.winnerCount} winner(s)'] The footer of the giveaway embed. An empty string can be used for "deactivation".
 * @property {string} [noWinner='Giveaway cancelled, no valid participations.'] Displayed in the giveaway embed when there is no valid winner for the giveaway.
 * @property {string} [winners='Winner(s):'] Displayed in the giveaway embed before the winners.
 * @property {string} [endedAt='Ended at'] Displayed as the embed footer, next to the giveaway end date, when the giveaway has ended.
 * @property {string} [hostedBy='Hosted by: {this.hostedBy}'] Below the "inviteToParticipate" message, in the description of the embed.
 */
exports.GiveawayMessages = {
    giveaway: '🎉🎉 **GIVEAWAY** 🎉🎉',
    giveawayEnded: '🎉🎉 **GIVEAWAY ENDED** 🎉🎉',
    title: '{this.prize}',
    inviteToParticipate: 'React with 🎉 to participate!',
    winMessage: 'Congratulations, {winners}! You won **{this.prize}**!\n{this.messageURL}',
    drawing: 'Drawing: {timestamp}',
    dropMessage: 'Be the first to react with 🎉 !',
    embedFooter: '{this.winnerCount} winner(s)',
    noWinner: 'Giveaway cancelled, no valid participations.',
    winners: 'Winner(s):',
    endedAt: 'Ended at',
    hostedBy: 'Hosted by: {this.hostedBy}'
};

/**
 * Embed Footer object.
 * @typedef EmbedFooterObject
 *
 * @property {string} [text] The text of the footer.
 * @property {string} [iconURL] The icon URL of the footer of ALL giveaway embeds.<br>"text" is required to be defined, when the icon is to be shown in the main embed.
 */

/**
 * Message object.
 * @typedef MessageObject
 *
 * @property {string} [content] The raw message
 * @property {Discord.JSONEncodable<Discord.APIEmbed>|Discord.APIEmbed} [embed] The embed
 * @property {Array<Discord.JSONEncodable<Discord.APIActionRowComponent<Discord.APIActionRowComponentTypes>>|Discord.APIActionRowComponent<Discord.APIActionRowComponentTypes>>} [components] The components.<br>"content" or "embed" is required to be defined.
 * @property {boolean} [replyToGiveaway] If the sent message should reply to the giveaway embed.
 */

/**
 * @typedef {Function} ExemptMembersFunction
 *
 * @param {Discord.GuildMember} member
 * @param {Giveaway} giveaway
 * @returns {Promise<boolean>|boolean}
 */

/**
 * The start options for new giveaways.
 * @typedef GiveawayStartOptions
 *
 * @property {number} duration The giveaway duration (milliseconds).
 * @property {number} winnerCount The number of winners for the giveaway.
 * @property {string} prize The giveaway prize.
 * @property {Discord.User} [hostedBy] The user who hosts the giveaway.
 * @property {boolean} [botsCanWin] If bots can win the giveaway.
 * @property {Discord.PermissionResolvable[]} [exemptPermissions] Members with any of these permissions will not be able to win a giveaway.
 * @property {ExemptMembersFunction} [exemptMembers] Function to filter members.<br>If true is returned, the member will not be able to win the giveaway.
 * @property {BonusEntry[]} [bonusEntries] An array of BonusEntry objects.
 * @property {Discord.ColorResolvable} [embedColor] The color of the giveaway embed when it is running.
 * @property {Discord.ColorResolvable} [embedColorEnd] The color of the giveaway embed when it has ended.
 * @property {Discord.EmojiIdentifierResolvable} [reaction] The reaction to participate in the giveaway.
 * @property {GiveawayMessages} [messages] The giveaway messages.
 * @property {string} [thumbnail] The URL appearing as the thumbnail on the giveaway embed.
 * @property {string} [image] The URL appearing as the image on the giveaway embed.
 * @property {any} [extraData] The extra data for this giveaway.
 * @property {LastChanceOptions} [lastChance] The options for the last chance system.
 * @property {PauseOptions} [pauseOptions] The options for the pause system.
 * @property {boolean} [isDrop] If the giveaway is a drop, or not. <br>Drop means that if the amount of valid entrants to the giveaway is the same as "winnerCount" then it immediately ends.
 * @property {Discord.MessageMentionOptions} [allowedMentions] Which mentions should be parsed from the giveaway messages content.
 */
exports.GiveawayStartOptions = {};

/**
 * @typedef {Function} BonusFunction
 *
 * @param {Discord.GuildMember} member
 * @param {Giveaway} giveaway
 * @returns {Promise<number>|number}
 */

/**
 * Bonus entry object.
 * @typedef BonusEntry
 *
 * @property {BonusFunction} bonus The filter function that takes one parameter, a member and returns the amount of entries.
 * @property {boolean} [cumulative] If the amount of entries from the function can get summed with other amounts of entries.
 */
exports.BonusEntry = {};

/**
 * The last chance options.
 * @typedef LastChanceOptions
 *
 * @property {boolean} [enabled=false] If the last chance system is enabled.
 * @property {string} [content='⚠️ **LAST CHANCE TO ENTER !** ⚠️'] The text of the embed when the last chance system is enabled.
 * @property {number} [threshold=5000] The number of milliseconds before the giveaway ends when the last chance system will be enabled.
 * @property {Discord.ColorResolvable} [embedColor='#FF0000'] The color of the embed when last chance is enabled.
 */
exports.LastChanceOptions = {
    enabled: false,
    content: '⚠️ **LAST CHANCE TO ENTER !** ⚠️',
    threshold: 10_000,
    embedColor: '#FF0000'
};

/**
 * The pause options.
 * @typedef PauseOptions
 *
 * @property {boolean} [isPaused=false] If the giveaway is paused.
 * @property {string} [content='⚠️ **THIS GIVEAWAY IS PAUSED !** ⚠️'] The text of the embed when the giveaway is paused.
 * @property {number} [unpauseAfter=null] The number of milliseconds, or a timestamp in milliseconds, after which the giveaway will automatically unpause.
 * @property {Discord.ColorResolvable} [embedColor='#FFFF00'] The color of the embed when the giveaway is paused.
 * @private @property {number} [durationAfterPause=null|giveaway.remainingTime] The remaining duration after the giveaway is unpaused.<br>⚠ This property gets set by the manager so that the pause system works properly. It is not recommended to set it manually!
 * @property {string} [infiniteDurationText='`NEVER`'] The text that gets displayed next to "GiveawayMessages#drawing" in the paused embed, when there is no "unpauseAfter".
 */
exports.PauseOptions = {
    isPaused: false,
    content: '⚠️ **THIS GIVEAWAY IS PAUSED !** ⚠️',
    unpauseAfter: null,
    embedColor: '#FFFF00',
    durationAfterPause: null,
    infiniteDurationText: '`NEVER`'
};

/**
 * The giveaways manager options.
 * @typedef GiveawaysManagerOptions
 *
 * @property {string} [storage='./giveaways.json'] The storage path for the giveaways.
 * @property {number} [forceUpdateEvery=null] Force the giveaway messages to be updated at a specific interval.
 * @property {number} [endedGiveawaysLifetime=null] The number of milliseconds after which ended giveaways should get deleted from the DB.<br>⚠ Giveaways deleted from the DB cannot get rerolled anymore!
 * @property {Object} [default] The default options for new giveaways.
 * @property {boolean} [default.botsCanWin=false] If bots can win giveaways.
 * @property {Discord.PermissionResolvable[]} [default.exemptPermissions=[]] Members with any of these permissions won't be able to win a giveaway.
 * @property {ExemptMembersFunction} [default.exemptMembers] Function to filter members.<br>If true is returned, the member won't be able to win a giveaway.
 * @property {Discord.ColorResolvable} [default.embedColor='#FF0000'] The color of the giveaway embeds when they are running.
 * @property {Discord.ColorResolvable} [default.embedColorEnd='#000000'] The color of the giveaway embeds when they have ended.
 * @property {Discord.EmojiIdentifierResolvable} [default.reaction='🎉'] The reaction to participate in giveaways.
 * @property {LastChanceOptions} [default.lastChance] The options for the last chance system.
 */
exports.GiveawaysManagerOptions = {
    storage: './giveaways.json',
    forceUpdateEvery: null,
    endedGiveawaysLifetime: null,
    default: {
        botsCanWin: false,
        exemptPermissions: [],
        exemptMembers: () => false,
        embedColor: '#FF0000',
        embedColorEnd: '#000000',
        reaction: '🎉',
        lastChance: {
            enabled: false,
            content: '⚠️ **LAST CHANCE TO ENTER !** ⚠️',
            threshold: 5000,
            embedColor: '#FF0000'
        }
    }
};

/**
 * The reroll method options.
 * @typedef GiveawayRerollOptions
 *
 * @property {number} [winnerCount=giveaway.winnerCount] The number of winners to pick.
 * @property {Object} [messages] The messages used in this method.
 * @property {string|MessageObject} [messages.congrat=':tada: New winner(s): {winners}! Congratulations, you won **{this.prize}**!\n{this.messageURL}'] The message used if there are new winners.
 * @property {string|MessageObject} [messages.error='No valid participations, no new winner(s) can be chosen!'] The message used if no new winner(s) could be chosen.
 * @property {boolean} [messages.replyWhenNoWinner=true] Whether or not to send the "error" message when there is no winner.
 */
exports.GiveawayRerollOptions = {
    winnerCount: null,
    messages: {
        congrat: ':tada: New winner(s): {winners}! Congratulations, you won **{this.prize}**!\n{this.messageURL}',
        error: 'No valid participations, no new winner(s) can be chosen!',
        replyWhenNoWinner: true
    }
};

/**
 * The edit method options.
 * @typedef GiveawayEditOptions
 *
 * @property {number} [newWinnerCount] The new number of winners.
 * @property {string} [newPrize] The new giveaway prize.
 * @property {number} [addTime] Number of milliseconds to add to the giveaway duration.
 * @property {number} [setEndTimestamp] The timestamp of the new end date.
 * @property {GiveawayMessages} [newMessages] The new giveaway messages.<br>Will get merged with the existing object, if there.
 * @property {string} [newThumbnail] The new thumbnail URL.
 * @property {string} [newImage] The new image URL.
 * @property {any} [newExtraData] The new extra data for this giveaway.
 * @property {BonusEntry[]} [newBonusEntries] The new BonusEntry objects.
 * @property {ExemptMembersFunction} [newExemptMembers] The new filter function to exempt members from winning the giveaway.
 * @property {LastChanceOptions} [newLastChance] The new options for the last chance system.<br>Will get merged with the existing object, if there.
 */
exports.GiveawayEditOptions = {};

/**
 * Raw giveaway object (used to store giveaways in the database).
 * @typedef GiveawayData
 *
 * @property {number} startAt The start date of the giveaway.
 * @property {number} endAt The end date of the giveaway.
 * @property {number} winnerCount The number of winners for the giveaway.
 * @property {boolean} ended If the giveaway has ended.
 * @property {GiveawayMessages} messages The giveaway messages.
 * @property {string} prize The giveaway prize.
 * @property {string} [thumbnail] The URL appearing as the thumbnail on the giveaway embed.
 * @property {string} [image] The URL appearing as the image on the giveaway embed.
 * @property {Discord.Snowflake} channelId The Id of the channel.
 * @property {Discord.Snowflake} guildId The Id of the guild.
 * @property {Discord.Snowflake[]} [winnerIds] The winner Ids of the giveaway after it ended.
 * @property {Discord.Snowflake} messageId The Id of the message.
 * @property {Discord.EmojiIdentifierResolvable} [reaction] The reaction to participate in the giveaway.
 * @property {boolean} [botsCanWin] If bots can win the giveaway.
 * @property {Discord.PermissionResolvable[]} [exemptPermissions] Members with any of these permissions will not be able to win the giveaway.
 * @property {string} [exemptMembers] Filter function to exempt members from winning the giveaway.
 * @property {string} [bonusEntries] The array of BonusEntry objects for the giveaway.
 * @property {Discord.ColorResolvable} [embedColor] The color of the giveaway embed when it is running.
 * @property {Discord.ColorResolvable} [embedColorEnd] The color of the giveaway embed when it has ended.
 * @property {string} [hostedBy] The mention of the user who hosts the giveaway.
 * @property {any} [extraData] The extra data for this giveaway.
 * @property {LastChanceOptions} [lastChance] The options for the last chance system.
 * @property {PauseOptions} [pauseOptions] The options for the pause system.
 * @property {boolean} [isDrop] If the giveaway is a drop, or not.<br>Drop means that if the amount of valid entrants to the giveaway is the same as "winnerCount" then it immediately ends.
 * @property {Discord.MessageMentionOptions} [allowedMentions] Which mentions should be parsed from the giveaway messages content.
 */
exports.GiveawayData = {};