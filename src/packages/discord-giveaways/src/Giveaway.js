const { EventEmitter } = require('node:events');
const { setTimeout, clearTimeout } = require('node:timers');

const Discord = require('discord.js');
const { deepmerge, deepmergeCustom } = require('deepmerge-ts');
const serialize = require('serialize-javascript');

const {
    GiveawayEditOptions,
    GiveawayData,
    GiveawayMessages,
    GiveawayRerollOptions,
    LastChanceOptions,
    BonusEntry,
    PauseOptions,
    MessageObject,
    DEFAULT_CHECK_INTERVAL
} = require('./Constants.js');
const GiveawaysManager = require('./Manager.js');
const { validateEmbedColor } = require('./utils.js');

const customDeepmerge = deepmergeCustom({ mergeArrays: false });

/**
 * Represents a Giveaway.
 */
class Giveaway extends EventEmitter {
    /**
     * @param {GiveawaysManager} manager The giveaway manager.
     * @param {GiveawayData} options The giveaway data.
     */
    constructor(manager, options) {
        super();
        /**
         * The giveaway manager.
         * @type {GiveawaysManager}
         */
        this.manager = manager;
        /**
         * The end timeout for this giveaway
         * @private
         * @type {?NodeJS.Timeout}
         */
        this.endTimeout = null;
        /**
         * The Discord client.
         * @type {Discord.Client}
         */
        this.client = manager.client;
        /**
         * The giveaway prize.
         * @type {string}
         */
        this.prize = options.prize;
        /**
         * The start date of the giveaway.
         * @type {number}
         */
        this.startAt = options.startAt;
        /**
         * The end date of the giveaway.
         * @type {number}
         */
        this.endAt = options.endAt ?? Infinity;
        /**
         * Whether the giveaway is ended.
         * @type {boolean}
         */
        this.ended = options.ended ?? false;
        /**
         * The Id of the channel of the giveaway.
         * @type {Discord.Snowflake}
         */
        this.channelId = options.channelId;
        /**
         * The Id of the message of the giveaway.
         * @type {Discord.Snowflake}
         */
        this.messageId = options.messageId;
        /**
         * The Id of the guild of the giveaway.
         * @type {Discord.Snowflake}
         */
        this.guildId = options.guildId;
        /**
         * The number of winners for this giveaway.
         * @type {number}
         */
        this.winnerCount = options.winnerCount;
        /**
         * The winner Ids for this giveaway after it ended.
         * @type {string[]}
         */
        this.winnerIds = options.winnerIds ?? [];
        /**
         * The mention of the user who hosts this giveaway.
         * @type {string}
         */
        this.hostedBy = options.hostedBy;
        /**
         * The giveaway messages.
         * @type {GiveawayMessages}
         */
        this.messages = options.messages;
        /**
         * The URL appearing as the thumbnail on the giveaway embed.
         * @type {string}
         */
        this.thumbnail = options.thumbnail;
        /**
         * The URL appearing as the image on the giveaway embed.
         * @type {string}
         */
        this.image = options.image;
        /**
         * Extra data concerning this giveaway.
         * @type {any}
         */
        this.extraData = options.extraData;
        /**
         * Which mentions should be parsed from the giveaway messages content.
         * @type {Discord.MessageMentionOptions}
         */
        this.allowedMentions = options.allowedMentions;
        /**
         * The giveaway data.
         * @type {GiveawayData}
         */
        this.options = options;
        /**
         * The message instance of the embed of this giveaway.
         * @type {?Discord.Message}
         */
        this.message = null;
    }

    /**
     * The link to the giveaway message.
     * @type {string}
     * @readonly
     */
    get messageURL() {
        return `https://discord.com/channels/${this.guildId}/${this.channelId}/${this.messageId}`;
    }

    /**
     * The remaining time before the end of the giveaway.
     * @type {number}
     * @readonly
     */
    get remainingTime() {
        return this.endAt - Date.now();
    }

    /**
     * The total duration of the giveaway.
     * @type {number}
     * @readonly
     */
    get duration() {
        return this.endAt - this.startAt;
    }

    /**
     * The color of the giveaway embed.
     * @type {Discord.ColorResolvable}
     */
    get embedColor() {
        return this.options.embedColor ?? this.manager.options.default.embedColor;
    }

    /**
     * The color of the giveaway embed when it has ended.
     * @type {Discord.ColorResolvable}
     */
    get embedColorEnd() {
        return this.options.embedColorEnd ?? this.manager.options.default.embedColorEnd;
    }

    /**
     * The emoji used for the reaction on the giveaway message.
     * @type {Discord.EmojiIdentifierResolvable}
     */
    get reaction() {
        if (!this.options.reaction && this.message) {
            const emoji = Discord.resolvePartialEmoji(this.manager.options.default.reaction);
            if (!this.message.reactions.cache.has(emoji.id ?? emoji.name)) {
                const reaction = this.message.reactions.cache.reduce(
                    (prev, curr) => (curr.count > prev.count ? curr : prev),
                    { count: 0 }
                );
                this.options.reaction = reaction.emoji?.id ?? reaction.emoji?.name;
            }
        }
        return this.options.reaction ?? this.manager.options.default.reaction;
    }

    /**
     * If bots can win the giveaway.
     * @type {boolean}
     */
    get botsCanWin() {
        return typeof this.options.botsCanWin === 'boolean'
            ? this.options.botsCanWin
            : this.manager.options.default.botsCanWin;
    }

    /**
     * Members with any of these permissions will not be able to win a giveaway.
     * @type {Discord.PermissionResolvable[]}
     */
    get exemptPermissions() {
        return this.options.exemptPermissions ?? this.manager.options.default.exemptPermissions;
    }

    /**
     * The options for the last chance system.
     * @type {LastChanceOptions}
     */
    get lastChance() {
        return deepmerge(this.manager.options.default.lastChance, this.options.lastChance ?? {});
    }

    /**
     * Pause options for this giveaway
     * @type {PauseOptions}
     */
    get pauseOptions() {
        return deepmerge(PauseOptions, this.options.pauseOptions ?? {});
    }

    /**
     * The array of BonusEntry objects for the giveaway.
     * @type {BonusEntry[]}
     */
    get bonusEntries() {
        return eval(this.options.bonusEntries) ?? [];
    }

    /**
     * If the giveaway is a drop, or not.
     * Drop means that if the amount of valid entrants to the giveaway is the same as "winnerCount" then it immediately ends.
     * @type {boolean}
     */
    get isDrop() {
        return this.options.isDrop ?? false;
    }

    /**
     * The exemptMembers function of the giveaway.
     * @type {?Function}
     */
    get exemptMembersFunction() {
        return this.options.exemptMembers
            ? typeof this.options.exemptMembers === 'string' &&
              this.options.exemptMembers.includes('function anonymous')
                ? eval(`(${this.options.exemptMembers})`)
                : eval(this.options.exemptMembers)
            : null;
    }

    /**
     * The reaction on the giveaway message.
     * @type {?Discord.MessageReaction}
     */
    get messageReaction() {
        const emoji = Discord.resolvePartialEmoji(this.reaction);
        return (
            this.message?.reactions.cache.find((r) =>
                [r.emoji.name, r.emoji.id].filter(Boolean).includes(emoji?.name ?? emoji?.id)
            ) ?? null
        );
    }

    /**
     * Function to filter members. If true is returned, the member won't be able to win the giveaway.
     * @property {Discord.GuildMember} member The member to check
     * @returns {Promise<boolean>} Whether the member should get exempted
     */
    async exemptMembers(member) {
        if (typeof this.exemptMembersFunction === 'function') {
            try {
                const result = await this.exemptMembersFunction(member, this);
                return result;
            } catch (err) {
                console.error(
                    `Giveaway message Id: ${this.messageId}\n${serialize(this.exemptMembersFunction)}\n${err}`
                );
                return false;
            }
        }
        if (typeof this.manager.options.default.exemptMembers === 'function') {
            return await this.manager.options.default.exemptMembers(member, this);
        }
        return false;
    }

    /**
     * The raw giveaway object for this giveaway.
     * @type {GiveawayData}
     */
    get data() {
        return {
            messageId: this.messageId,
            channelId: this.channelId,
            guildId: this.guildId,
            startAt: this.startAt,
            endAt: this.endAt,
            ended: this.ended,
            winnerCount: this.winnerCount,
            prize: this.prize,
            messages: this.messages,
            thumbnail: this.thumbnail,
            image: this.image,
            hostedBy: this.options.hostedBy,
            embedColor: this.options.embedColor,
            embedColorEnd: this.options.embedColorEnd,
            botsCanWin: this.options.botsCanWin,
            exemptPermissions: this.options.exemptPermissions,
            exemptMembers:
                !this.options.exemptMembers || typeof this.options.exemptMembers === 'string'
                    ? this.options.exemptMembers || undefined
                    : serialize(this.options.exemptMembers),
            bonusEntries:
                !this.options.bonusEntries || typeof this.options.bonusEntries === 'string'
                    ? this.options.bonusEntries || undefined
                    : serialize(this.options.bonusEntries),
            reaction: this.options.reaction,
            winnerIds: this.winnerIds.length ? this.winnerIds : undefined,
            extraData: this.extraData,
            lastChance: this.options.lastChance,
            pauseOptions: this.options.pauseOptions,
            isDrop: this.options.isDrop || undefined,
            allowedMentions: this.allowedMentions
        };
    }

    /**
     * Ensure that an end timeout is created for this giveaway, in case it will end soon
     * @private
     * @returns {NodeJS.Timeout}
     */
    ensureEndTimeout() {
        if (this.endTimeout) return;
        if (this.remainingTime > (this.manager.options.forceUpdateEvery || DEFAULT_CHECK_INTERVAL)) return;
        this.endTimeout = setTimeout(
            () => this.manager.end.call(this.manager, this.messageId).catch(() => {}),
            this.remainingTime
        );
    }

    /**
     * Filles in a string with giveaway properties.
     * @param {string} string The string that should get filled in.
     * @returns {?string} The filled in string.
     */
    fillInString(string) {
        if (typeof string !== 'string') return null;
        [...new Set(string.match(/\{[^{}]{1,}\}/g))]
            .filter((match) => match?.slice(1, -1).trim() !== '')
            .forEach((match) => {
                let replacer;
                try {
                    replacer = eval(match.slice(1, -1));
                } catch {
                    replacer = match;
                }
                string = string.replaceAll(match, replacer);
            });
        return string.trim();
    }

    /**
     * Filles in a embed with giveaway properties.
     * @param {Discord.JSONEncodable<Discord.APIEmbed>|Discord.APIEmbed} embed The embed that should get filled in.
     * @returns {?Discord.EmbedBuilder} The filled in embed.
     */
    fillInEmbed(embed) {
        if (!embed || typeof embed !== 'object') return null;
        embed = Discord.EmbedBuilder.from(embed);
        embed.setTitle(this.fillInString(embed.data.title));
        embed.setDescription(this.fillInString(embed.data.description));
        if (typeof embed.data.author?.name === 'string')
            embed.data.author.name = this.fillInString(embed.data.author.name);
        if (typeof embed.data.footer?.text === 'string')
            embed.data.footer.text = this.fillInString(embed.data.footer.text);
        if (embed.data.fields?.length)
            embed.spliceFields(
                0,
                embed.data.fields.length,
                ...embed.data.fields.map((f) => {
                    f.name = this.fillInString(f.name);
                    f.value = this.fillInString(f.value);
                    return f;
                })
            );
        return embed;
    }

    /**
     * @param {Array<Discord.JSONEncodable<Discord.APIActionRowComponent<Discord.APIActionRowComponentTypes>>|Discord.APIActionRowComponent<Discord.APIActionRowComponentTypes>>} components The components that should get filled in.
     * @returns {?Array<Discord.ActionRowBuilder<Discord.MessageActionRowComponentBuilder>>} The filled in components.
     */
    fillInComponents(components) {
        if (!Array.isArray(components)) return null;
        return components.map((row) => {
            row = Discord.ActionRowBuilder.from(row);
            row.components = row.components.map((component) => {
                component.data.custom_id &&= this.fillInString(component.data.custom_id);
                component.data.label &&= this.fillInString(component.data.label);
                component.data.url &&= this.fillInString(component.data.url);
                component.data.placeholder &&= this.fillInString(component.data.placeholder);
                component.data.options &&= component.data.options.map((options) => {
                    options.label = this.fillInString(options.label);
                    options.value = this.fillInString(options.value);
                    options.description &&= this.fillInString(options.description);
                    return options;
                });
                return component;
            });
            return row;
        });
    }

    /**
     * Fetches the giveaway message from its channel.
     * @returns {Promise<Discord.Message>} The Discord message
     */
    async fetchMessage() {
        return new Promise(async (resolve, reject) => {
            let tryLater = true;
            const channel = await this.client.channels.fetch(this.channelId).catch((err) => {
                if (err.code === 10003) tryLater = false;
            });
            const message = await channel?.messages.fetch(this.messageId).catch((err) => {
                if (err.code === 10008) tryLater = false;
            });
            if (!message) {
                if (!tryLater) {
                    this.manager.giveaways = this.manager.giveaways.filter((g) => g.messageId !== this.messageId);
                    await this.manager.deleteGiveaway(this.messageId);
                }
                return reject(
                    'Unable to fetch message with Id ' + this.messageId + '.' + (tryLater ? ' Try later!' : '')
                );
            }
            resolve(message);
        });
    }

    /**
     * Fetches all users of the giveaway reaction, except bots, if not otherwise specified.
     * @returns {Promise<Discord.Collection<Discord.Snowflake, Discord.User>>} The collection of reaction users.
     */
    async fetchAllEntrants() {
        return new Promise(async (resolve, reject) => {
            const message = await this.fetchMessage().catch((err) => reject(err));
            if (!message) return;
            this.message = message;
            const reaction = this.messageReaction;
            if (!reaction) return reject('Unable to find the giveaway reaction.');

            let userCollection = await reaction.users.fetch().catch(() => {});
            if (!userCollection) return reject('Unable to fetch the reaction users.');

            while (userCollection.size % 100 === 0) {
                const newUsers = await reaction.users.fetch({ after: userCollection.lastKey() });
                if (newUsers.size === 0) break;
                userCollection = userCollection.concat(newUsers);
            }

            const users = userCollection
                .filter((u) => !u.bot || u.bot === this.botsCanWin)
                .filter((u) => u.id !== this.client.user.id);
            resolve(users);
        });
    }

    /**
     * Checks if a user fulfills the requirements to win the giveaway.
     * @private
     * @param {Discord.User} user The user to check.
     * @returns {Promise<boolean>} If the entry was valid.
     */
    async checkWinnerEntry(user) {
        if (this.winnerIds.includes(user.id)) return false;
        this.message ??= await this.fetchMessage().catch(() => {});
        const member = await this.message?.guild.members.fetch(user.id).catch(() => {});
        if (!member) return false;
        const exemptMember = await this.exemptMembers(member);
        if (exemptMember) return false;
        const hasPermission = this.exemptPermissions.some((permission) => member.permissions.has(permission));
        if (hasPermission) return false;
        return true;
    }

    /**
     * Checks if a user gets any additional entries for the giveaway.
     * @param {Discord.User} user The user to check.
     * @returns {Promise<number>} The highest bonus entries the user should get.
     */
    async checkBonusEntries(user) {
        this.message ??= await this.fetchMessage().catch(() => {});
        const member = await this.message?.guild.members.fetch(user.id).catch(() => {});
        if (!member) return 0;
        const entries = [0];
        const cumulativeEntries = [];

        if (this.bonusEntries.length) {
            for (const obj of this.bonusEntries) {
                if (typeof obj.bonus === 'function') {
                    try {
                        const result = await obj.bonus.apply(this, [member, this]);
                        if (Number.isInteger(result) && result > 0) {
                            if (obj.cumulative) cumulativeEntries.push(result);
                            else entries.push(result);
                        }
                    } catch (err) {
                        console.error(`Giveaway message Id: ${this.messageId}\n${serialize(obj.bonus)}\n${err}`);
                    }
                }
            }
        }

        if (cumulativeEntries.length) entries.push(cumulativeEntries.reduce((a, b) => a + b));
        return Math.max(...entries);
    }

    /**
     * Gets the giveaway winner(s).
     * @param {number} [winnerCount=this.winnerCount] The number of winners to pick.
     * @returns {Promise<Discord.GuildMember[]>} The winner(s).
     */
    async roll(winnerCount = this.winnerCount) {
        if (!this.message) return [];

        let guild = this.message.guild;

        // Fetch all guild members if the intent is available
        if (new Discord.IntentsBitField(this.client.options.intents).has(Discord.IntentsBitField.Flags.GuildMembers)) {
            // Try to fetch the guild from the client if the guild instance of the message does not have its shard defined
            if (this.client.shard && !guild.shard) {
                guild = (await this.client.guilds.fetch(guild.id).catch(() => {})) ?? guild;
                // "Update" the message instance too, if possible.
                this.message = (await this.fetchMessage().catch(() => {})) ?? this.message;
            }
            await guild.members.fetch().catch(() => {});
        }

        const users = await this.fetchAllEntrants().catch(() => {});
        if (!users?.size) return [];

        // Bonus Entries
        let userArray;
        if (!this.isDrop && this.bonusEntries.length) {
            userArray = [...users.values()]; // Copy all users once
            for (const user of userArray.slice()) {
                const isUserValidEntry = await this.checkWinnerEntry(user);
                if (!isUserValidEntry) continue;

                const highestBonusEntries = await this.checkBonusEntries(user);
                for (let i = 0; i < highestBonusEntries; i++) userArray.push(user);
            }
        }

        const randomUsers = (amount) => {
            if (!userArray || userArray.length <= amount) return users.random(amount);
            /**
             * Random mechanism like https://github.com/discordjs/collection/blob/master/src/index.ts
             * because collections/maps do not allow duplicates and so we cannot use their built in "random" function
             */
            return Array.from(
                {
                    length: Math.min(amount, users.size)
                },
                () => userArray.splice(Math.floor(Math.random() * userArray.length), 1)[0]
            );
        };

        const winners = [];

        for (const u of randomUsers(winnerCount)) {
            const isValidEntry = !winners.some((winner) => winner.id === u.id) && (await this.checkWinnerEntry(u));
            if (isValidEntry) winners.push(u);
            else {
                // Find a new winner
                for (let i = 0; i < users.size; i++) {
                    const user = randomUsers(1)[0];
                    const isUserValidEntry =
                        !winners.some((winner) => winner.id === user.id) && (await this.checkWinnerEntry(user));
                    if (isUserValidEntry) {
                        winners.push(user);
                        break;
                    }
                    users.delete(user.id);
                    userArray = userArray?.filter((u) => u.id !== user.id);
                }
            }
        }

        return await Promise.all(winners.map(async (user) => await guild.members.fetch(user.id).catch(() => {})));
    }

    /**
     * Edits the giveaway.
     * @param {GiveawayEditOptions} options The edit options.
     * @returns {Promise<Giveaway>} The edited giveaway.
     */
    edit(options = {}) {
        return new Promise(async (resolve, reject) => {
            if (this.ended) return reject('Giveaway with message Id ' + this.messageId + ' is already ended.');
            this.message ??= await this.fetchMessage().catch(() => {});
            if (!this.message) return reject('Unable to fetch message with Id ' + this.messageId + '.');

            // Update data
            if (options.newMessages && typeof options.newMessages === 'object') {
                this.messages = customDeepmerge(this.messages, options.newMessages);
            }
            if (typeof options.newThumbnail === 'string') this.thumbnail = options.newThumbnail;
            if (typeof options.newImage === 'string') this.image = options.newImage;
            if (typeof options.newPrize === 'string') this.prize = options.newPrize;
            if (options.newExtraData) this.extraData = options.newExtraData;
            if (Number.isInteger(options.newWinnerCount) && options.newWinnerCount > 0 && !this.isDrop) {
                this.winnerCount = options.newWinnerCount;
            }
            if (Number.isFinite(options.addTime) && !this.isDrop) {
                this.endAt = this.endAt + options.addTime;
                if (this.endTimeout) clearTimeout(this.endTimeout);
                this.ensureEndTimeout();
            }
            if (Number.isFinite(options.setEndTimestamp) && !this.isDrop) this.endAt = options.setEndTimestamp;
            if (Array.isArray(options.newBonusEntries) && !this.isDrop) {
                this.options.bonusEntries = options.newBonusEntries.filter((elem) => typeof elem === 'object');
            }
            if (typeof options.newExemptMembers === 'function') {
                this.options.exemptMembers = options.newExemptMembers;
            }
            if (options.newLastChance && typeof options.newLastChance === 'object' && !this.isDrop) {
                this.options.lastChance = deepmerge(this.options.lastChance || {}, options.newLastChance);
            }

            await this.manager.editGiveaway(this.messageId, this.data);
            if (this.remainingTime <= 0) this.manager.end(this.messageId).catch(() => {});
            else {
                const embed = this.manager.generateMainEmbed(this);
                await this.message
                    .edit({
                        content: this.fillInString(this.messages.giveaway),
                        embeds: [embed],
                        allowedMentions: this.allowedMentions
                    })
                    .catch(() => {});
            }
            resolve(this);
        });
    }

    /**
     * Ends the giveaway.
     * @param {?string|MessageObject} [noWinnerMessage=null] Sent in the channel if there is no valid winner for the giveaway.
     * @returns {Promise<Discord.GuildMember[]>} The winner(s).
     */
    end(noWinnerMessage = null) {
        return new Promise(async (resolve, reject) => {
            if (this.ended) return reject('Giveaway with message Id ' + this.messageId + ' is already ended');
            this.ended = true;

            // Always fetch the message in order to reject early
            this.message = await this.fetchMessage().catch((err) => {
                if (err.includes('Try later!')) this.ended = false;
                return reject(err);
            });
            if (!this.message) return;

            if (this.endAt < this.client.readyTimestamp || this.isDrop || this.options.pauseOptions?.isPaused) {
                this.endAt = Date.now();
            }
            if (this.options.pauseOptions?.isPaused) this.options.pauseOptions.isPaused = false;
            await this.manager.editGiveaway(this.messageId, this.data);
            const winners = await this.roll();

            const channel =
                this.message.channel.isThread() && !this.message.channel.sendable
                    ? this.message.channel.parent
                    : this.message.channel;

            if (winners.length > 0) {
                this.winnerIds = winners.map((w) => w.id);
                await this.manager.editGiveaway(this.messageId, this.data);
                const embed = this.manager.generateEndEmbed(this, winners);
                await this.message
                    .edit({
                        content: this.fillInString(this.messages.giveawayEnded),
                        embeds: [embed],
                        allowedMentions: this.allowedMentions
                    })
                    .catch(() => {});

                let formattedWinners = winners.map((w) => `<@${w.id}>`).join(', ');
                const winMessage = this.fillInString(this.messages.winMessage.content || this.messages.winMessage);
                const message = winMessage?.replace('{winners}', formattedWinners);
                const components = this.fillInComponents(this.messages.winMessage.components);

                if (message?.length > 2000) {
                    const firstContentPart = winMessage.slice(0, winMessage.indexOf('{winners}'));
                    if (firstContentPart.length) {
                        channel.send({
                            content: firstContentPart,
                            allowedMentions: this.allowedMentions,
                            reply: {
                                messageReference:
                                    typeof this.messages.winMessage.replyToGiveaway === 'boolean'
                                        ? this.messageId
                                        : undefined,
                                failIfNotExists: false
                            }
                        });
                    }
                    while (formattedWinners.length >= 2000) {
                        await channel.send({
                            content: formattedWinners.slice(0, formattedWinners.lastIndexOf(',', 1999)) + ',',
                            allowedMentions: this.allowedMentions
                        });
                        formattedWinners = formattedWinners.slice(
                            formattedWinners.slice(0, formattedWinners.lastIndexOf(',', 1999) + 2).length
                        );
                    }
                    channel.send({ content: formattedWinners, allowedMentions: this.allowedMentions });

                    const lastContentPart = winMessage.slice(winMessage.indexOf('{winners}') + 9);
                    if (lastContentPart.length) {
                        channel.send({
                            content: lastContentPart,
                            components:
                                this.messages.winMessage.embed && typeof this.messages.winMessage.embed === 'object'
                                    ? null
                                    : components,
                            allowedMentions: this.allowedMentions
                        });
                    }
                }

                if (this.messages.winMessage.embed && typeof this.messages.winMessage.embed === 'object') {
                    if (message?.length > 2000) formattedWinners = winners.map((w) => `<@${w.id}>`).join(', ');
                    const embed = this.fillInEmbed(this.messages.winMessage.embed);
                    const embedDescription = embed.data.description?.replace('{winners}', formattedWinners) ?? '';

                    if (embedDescription.length <= 4096) {
                        channel.send({
                            content: message?.length <= 2000 ? message : null,
                            embeds: [embed.setDescription(embedDescription)],
                            components,
                            allowedMentions: this.allowedMentions,
                            reply: {
                                messageReference:
                                    !(message?.length > 2000) &&
                                    typeof this.messages.winMessage.replyToGiveaway === 'boolean'
                                        ? this.messageId
                                        : undefined,
                                failIfNotExists: false
                            }
                        });
                    } else {
                        const firstEmbed = new Discord.EmbedBuilder(embed).setDescription(
                            embed.data.description.slice(0, embed.data.description.indexOf('{winners}')) || null
                        );
                        if (Discord.embedLength(firstEmbed.data)) {
                            channel.send({
                                content: message?.length <= 2000 ? message : null,
                                embeds: [firstEmbed],
                                allowedMentions: this.allowedMentions,
                                reply: {
                                    messageReference:
                                        !(message?.length > 2000) &&
                                        typeof this.messages.winMessage.replyToGiveaway === 'boolean'
                                            ? this.messageId
                                            : undefined,
                                    failIfNotExists: false
                                }
                            });
                        }

                        const tempEmbed = new Discord.EmbedBuilder().setColor(embed.data.color ?? null);
                        while (formattedWinners.length >= 4096) {
                            await channel.send({
                                embeds: [
                                    tempEmbed.setDescription(
                                        formattedWinners.slice(0, formattedWinners.lastIndexOf(',', 4095)) + ','
                                    )
                                ],
                                allowedMentions: this.allowedMentions
                            });
                            formattedWinners = formattedWinners.slice(
                                formattedWinners.slice(0, formattedWinners.lastIndexOf(',', 4095) + 2).length
                            );
                        }
                        channel.send({
                            embeds: [tempEmbed.setDescription(formattedWinners)],
                            allowedMentions: this.allowedMentions
                        });

                        const lastEmbed = tempEmbed.setDescription(
                            embed.data.description.slice(embed.data.description.indexOf('{winners}') + 9) || null
                        );
                        if (Discord.embedLength(lastEmbed.data)) {
                            channel.send({ embeds: [lastEmbed], components, allowedMentions: this.allowedMentions });
                        }
                    }
                } else if (message?.length <= 2000) {
                    channel.send({
                        content: message,
                        components,
                        allowedMentions: this.allowedMentions,
                        reply: {
                            messageReference:
                                typeof this.messages.winMessage.replyToGiveaway === 'boolean'
                                    ? this.messageId
                                    : undefined,
                            failIfNotExists: false
                        }
                    });
                }
                resolve(winners);
            } else {
                const message = this.fillInString(noWinnerMessage?.content || noWinnerMessage);
                const embed = this.fillInEmbed(noWinnerMessage?.embed);
                if (message || embed) {
                    channel.send({
                        content: message,
                        embeds: embed ? [embed] : null,
                        components: this.fillInComponents(noWinnerMessage?.components),
                        allowedMentions: this.allowedMentions,
                        reply: {
                            messageReference:
                                typeof noWinnerMessage?.replyToGiveaway === 'boolean' ? this.messageId : undefined,
                            failIfNotExists: false
                        }
                    });
                }

                await this.message
                    .edit({
                        content: this.fillInString(this.messages.giveawayEnded),
                        embeds: [this.manager.generateNoValidParticipantsEndEmbed(this)],
                        allowedMentions: this.allowedMentions
                    })
                    .catch(() => {});
                resolve([]);
            }
        });
    }

    /**
     * Rerolls the giveaway.
     * @param {GiveawayRerollOptions} [options] The reroll options.
     * @returns {Promise<Discord.GuildMember[]>}
     */
    reroll(options = {}) {
        return new Promise(async (resolve, reject) => {
            if (!this.ended) return reject('Giveaway with message Id ' + this.messageId + ' is not ended.');
            this.message ??= await this.fetchMessage().catch(() => {});
            if (!this.message) return reject('Unable to fetch message with Id ' + this.messageId + '.');
            if (this.isDrop) return reject('Drop giveaways cannot get rerolled!');
            if (!options || typeof options !== 'object') return reject(`"options" is not an object (val=${options})`);
            options = deepmerge(GiveawayRerollOptions, options);
            if (options.winnerCount && (!Number.isInteger(options.winnerCount) || options.winnerCount < 1)) {
                return reject(`options.winnerCount is not a positive integer. (val=${options.winnerCount})`);
            }

            const winners = await this.roll(options.winnerCount || undefined);
            const channel =
                this.message.channel.isThread() && !this.message.channel.sendable
                    ? this.message.channel.parent
                    : this.message.channel;

            if (winners.length > 0) {
                this.winnerIds = winners.map((w) => w.id);
                await this.manager.editGiveaway(this.messageId, this.data);
                const embed = this.manager.generateEndEmbed(this, winners);
                await this.message
                    .edit({
                        content: this.fillInString(this.messages.giveawayEnded),
                        embeds: [embed],
                        allowedMentions: this.allowedMentions
                    })
                    .catch(() => {});

                let formattedWinners = winners.map((w) => `<@${w.id}>`).join(', ');
                const congratMessage = this.fillInString(options.messages.congrat.content || options.messages.congrat);
                const message = congratMessage?.replace('{winners}', formattedWinners);
                const components = this.fillInComponents(options.messages.congrat.components);

                if (message?.length > 2000) {
                    const firstContentPart = congratMessage.slice(0, congratMessage.indexOf('{winners}'));
                    if (firstContentPart.length) {
                        channel.send({
                            content: firstContentPart,
                            allowedMentions: this.allowedMentions,
                            reply: {
                                messageReference:
                                    typeof options.messages.congrat.replyToGiveaway === 'boolean'
                                        ? this.messageId
                                        : undefined,
                                failIfNotExists: false
                            }
                        });
                    }

                    while (formattedWinners.length >= 2000) {
                        await channel.send({
                            content: formattedWinners.slice(0, formattedWinners.lastIndexOf(',', 1999)) + ',',
                            allowedMentions: this.allowedMentions
                        });
                        formattedWinners = formattedWinners.slice(
                            formattedWinners.slice(0, formattedWinners.lastIndexOf(',', 1999) + 2).length
                        );
                    }
                    channel.send({ content: formattedWinners, allowedMentions: this.allowedMentions });

                    const lastContentPart = congratMessage.slice(congratMessage.indexOf('{winners}') + 9);
                    if (lastContentPart.length) {
                        channel.send({
                            content: lastContentPart,
                            components:
                                options.messages.congrat.embed && typeof options.messages.congrat.embed === 'object'
                                    ? null
                                    : components,
                            allowedMentions: this.allowedMentions
                        });
                    }
                }

                if (options.messages.congrat.embed && typeof options.messages.congrat.embed === 'object') {
                    if (message?.length > 2000) formattedWinners = winners.map((w) => `<@${w.id}>`).join(', ');
                    const embed = this.fillInEmbed(options.messages.congrat.embed);
                    const embedDescription = embed.data.description?.replace('{winners}', formattedWinners) ?? '';
                    if (embedDescription.length <= 4096) {
                        channel.send({
                            content: message?.length <= 2000 ? message : null,
                            embeds: [embed.setDescription(embedDescription)],
                            components,
                            allowedMentions: this.allowedMentions,
                            reply: {
                                messageReference:
                                    !(message?.length > 2000) &&
                                    typeof options.messages.congrat.replyToGiveaway === 'boolean'
                                        ? this.messageId
                                        : undefined,
                                failIfNotExists: false
                            }
                        });
                    } else {
                        const firstEmbed = new Discord.EmbedBuilder(embed).setDescription(
                            embed.data.description.slice(0, embed.data.description.indexOf('{winners}')) || null
                        );
                        if (Discord.embedLength(firstEmbed.toJSON())) {
                            channel.send({
                                content: message?.length <= 2000 ? message : null,
                                embeds: [firstEmbed],
                                allowedMentions: this.allowedMentions,
                                reply: {
                                    messageReference:
                                        !(message?.length > 2000) &&
                                        typeof options.messages.congrat.replyToGiveaway === 'boolean'
                                            ? this.messageId
                                            : undefined,
                                    failIfNotExists: false
                                }
                            });
                        }

                        const tempEmbed = new Discord.EmbedBuilder().setColor(embed.data.color ?? null);
                        while (formattedWinners.length >= 4096) {
                            await channel.send({
                                embeds: [
                                    tempEmbed.setDescription(
                                        formattedWinners.slice(0, formattedWinners.lastIndexOf(',', 4095)) + ','
                                    )
                                ],
                                allowedMentions: this.allowedMentions
                            });
                            formattedWinners = formattedWinners.slice(
                                formattedWinners.slice(0, formattedWinners.lastIndexOf(',', 4095) + 2).length
                            );
                        }
                        channel.send({
                            embeds: [tempEmbed.setDescription(formattedWinners)],
                            allowedMentions: this.allowedMentions
                        });

                        const lastEmbed = tempEmbed.setDescription(
                            embed.data.description.slice(embed.data.description.indexOf('{winners}') + 9) || null
                        );
                        if (Discord.embedLength(lastEmbed.toJSON())) {
                            channel.send({ embeds: [lastEmbed], components, allowedMentions: this.allowedMentions });
                        }
                    }
                } else if (message?.length <= 2000) {
                    channel.send({
                        content: message,
                        components,
                        allowedMentions: this.allowedMentions,
                        reply: {
                            messageReference:
                                typeof options.messages.congrat.replyToGiveaway === 'boolean'
                                    ? this.messageId
                                    : undefined,
                            failIfNotExists: false
                        }
                    });
                }
                resolve(winners);
            } else {
                if (options.messages.replyWhenNoWinner !== false) {
                    const embed = this.fillInEmbed(options.messages.error.embed);
                    channel.send({
                        content: this.fillInString(options.messages.error.content || options.messages.error),
                        embeds: embed ? [embed] : null,
                        components: this.fillInComponents(options.messages.error.components),
                        allowedMentions: this.allowedMentions,
                        reply: {
                            messageReference:
                                typeof options.messages.error.replyToGiveaway === 'boolean'
                                    ? this.messageId
                                    : undefined,
                            failIfNotExists: false
                        }
                    });
                }
                resolve([]);
            }
        });
    }

    /**
     * Pauses the giveaway.
     * @param {PauseOptions} [options=giveaway.pauseOptions] The pause options.
     * @returns {Promise<Giveaway>} The paused giveaway.
     */
    pause(options = {}) {
        return new Promise(async (resolve, reject) => {
            if (this.ended) return reject('Giveaway with message Id ' + this.messageId + ' is already ended.');
            this.message ??= await this.fetchMessage().catch(() => {});
            if (!this.message) return reject('Unable to fetch message with Id ' + this.messageId + '.');
            if (this.pauseOptions.isPaused) {
                return reject('Giveaway with message Id ' + this.messageId + ' is already paused.');
            }
            if (this.isDrop) return reject('Drop giveaways cannot get paused!');
            if (this.endTimeout) clearTimeout(this.endTimeout);

            // Update data
            const pauseOptions = this.options.pauseOptions || {};
            if (typeof options.content === 'string') pauseOptions.content = options.content;
            if (Number.isFinite(options.unpauseAfter)) {
                if (options.unpauseAfter < Date.now()) {
                    pauseOptions.unpauseAfter = Date.now() + options.unpauseAfter;
                    this.endAt = this.endAt + options.unpauseAfter;
                } else {
                    pauseOptions.unpauseAfter = options.unpauseAfter;
                    this.endAt = this.endAt + options.unpauseAfter - Date.now();
                }
            } else {
                delete pauseOptions.unpauseAfter;
                pauseOptions.durationAfterPause = this.remainingTime;
                this.endAt = Infinity;
            }
            if (validateEmbedColor(options.embedColor)) {
                pauseOptions.embedColor = options.embedColor;
            }
            if (typeof options.infiniteDurationText === 'string') {
                pauseOptions.infiniteDurationText = options.infiniteDurationText;
            }
            pauseOptions.isPaused = true;
            this.options.pauseOptions = pauseOptions;

            await this.manager.editGiveaway(this.messageId, this.data);
            const embed = this.manager.generateMainEmbed(this);
            await this.message
                .edit({
                    content: this.fillInString(this.messages.giveaway),
                    embeds: [embed],
                    allowedMentions: this.allowedMentions
                })
                .catch(() => {});
            resolve(this);
        });
    }

    /**
     * Unpauses the giveaway.
     * @returns {Promise<Giveaway>} The unpaused giveaway.
     */
    unpause() {
        return new Promise(async (resolve, reject) => {
            if (this.ended) return reject('Giveaway with message Id ' + this.messageId + ' is already ended.');
            this.message ??= await this.fetchMessage().catch(() => {});
            if (!this.message) return reject('Unable to fetch message with Id ' + this.messageId + '.');
            if (!this.pauseOptions.isPaused) {
                return reject('Giveaway with message Id ' + this.messageId + ' is not paused.');
            }
            if (this.isDrop) return reject('Drop giveaways cannot get unpaused!');

            // Update data
            if (Number.isFinite(this.pauseOptions.durationAfterPause)) {
                this.endAt = Date.now() + this.pauseOptions.durationAfterPause;
            }
            delete this.options.pauseOptions.unpauseAfter;
            this.options.pauseOptions.isPaused = false;

            this.ensureEndTimeout();

            await this.manager.editGiveaway(this.messageId, this.data);
            const embed = this.manager.generateMainEmbed(this);
            await this.message
                .edit({
                    content: this.fillInString(this.messages.giveaway),
                    embeds: [embed],
                    allowedMentions: this.allowedMentions
                })
                .catch(() => {});
            resolve(this);
        });
    }
}

module.exports = Giveaway;