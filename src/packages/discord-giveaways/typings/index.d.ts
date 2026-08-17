import type { EventEmitter } from 'node:events';
import type {
    Client,
    Collection,
    ColorResolvable,
    EmojiIdentifierResolvable,
    GuildMember,
    Message,
    ActionRowBuilder,
    EmbedBuilder,
    MessageMentionOptions,
    MessageReaction,
    PermissionResolvable,
    Snowflake,
    User,
    Awaitable,
    APIEmbed,
    MessageActionRowComponentBuilder,
    GuildTextBasedChannel,
    JSONEncodable,
    APIActionRowComponent,
    APIMessageActionRowComponent,
    APIModalActionRowComponent
} from 'discord.js';

export const version: string;
export class GiveawaysManager<ExtraData = any> extends EventEmitter {
    constructor(client: Client, options?: GiveawaysManagerOptions<ExtraData>, init?: boolean);

    public client: Client;
    public giveaways: Giveaway<ExtraData>[];
    public options: GiveawaysManagerOptions<ExtraData>;
    public ready: boolean;

    public generateMainEmbed(giveaway: Giveaway<ExtraData>, lastChanceEnabled?: boolean): EmbedBuilder;
    public generateEndEmbed(giveaway: Giveaway<ExtraData>, winners: GuildMember[]): EmbedBuilder;
    public generateNoValidParticipantsEndEmbed(giveaway: Giveaway<ExtraData>): EmbedBuilder;
    public delete(messageId: Snowflake, doNotDeleteMessage?: boolean): Promise<Giveaway<ExtraData>>;
    public edit(messageId: Snowflake, options: GiveawayEditOptions<ExtraData>): Promise<Giveaway<ExtraData>>;
    public end(messageId: Snowflake, noWinnerMessage?: string | MessageObject): Promise<GuildMember[]>;
    public reroll(messageId: Snowflake, options?: GiveawayRerollOptions): Promise<GuildMember[]>;
    public start(
        channel: GuildTextBasedChannel,
        options: GiveawayStartOptions<ExtraData>
    ): Promise<Giveaway<ExtraData>>;
    public pause(
        messageId: Snowflake,
        options?: Omit<PauseOptions, 'isPaused' | 'durationAfterPause'>
    ): Promise<Giveaway<ExtraData>>;
    public unpause(messageId: Snowflake): Promise<Giveaway<ExtraData>>;
    protected getAllGiveaways(): Promise<Giveaway<ExtraData>[]>;
    protected editGiveaway(messageId: Snowflake, giveawayData: GiveawayData<ExtraData>): Promise<boolean>;
    protected saveGiveaway(messageId: Snowflake, giveawayData: GiveawayData<ExtraData>): Promise<boolean>;
    protected deleteGiveaway(messageId: Snowflake): Promise<boolean>;

    public on<K extends keyof GiveawaysManagerEvents<ExtraData>>(
        event: K,
        listener: (...args: GiveawaysManagerEvents<ExtraData>[K]) => void
    ): this;

    public once<K extends keyof GiveawaysManagerEvents<ExtraData>>(
        event: K,
        listener: (...args: GiveawaysManagerEvents<ExtraData>[K]) => void
    ): this;

    public emit<K extends keyof GiveawaysManagerEvents<ExtraData>>(
        event: K,
        ...args: GiveawaysManagerEvents<ExtraData>[K]
    ): boolean;
}
export interface BonusEntry<ExtraData> {
    bonus(member: GuildMember, giveaway: Giveaway<ExtraData>): Awaitable<number>;
    cumulative?: boolean;
}
export interface LastChanceOptions {
    enabled?: boolean;
    embedColor?: ColorResolvable;
    content?: string;
    threshold?: number;
}
export interface PauseOptions {
    isPaused?: boolean;
    content?: string;
    unpauseAfter?: number | null;
    embedColor?: ColorResolvable;
    durationAfterPause?: number | null;
    infiniteDurationText?: string;
}
export interface GiveawaysManagerOptions<ExtraData> {
    storage?: string;
    forceUpdateEvery?: number;
    endedGiveawaysLifetime?: number;
    default?: {
        botsCanWin?: boolean;
        exemptPermissions?: PermissionResolvable[];
        exemptMembers?: (member: GuildMember, giveaway: Giveaway<ExtraData>) => Awaitable<boolean>;
        embedColor?: ColorResolvable;
        embedColorEnd?: ColorResolvable;
        reaction?: EmojiIdentifierResolvable;
        lastChance?: LastChanceOptions;
    };
}
export interface GiveawayStartOptions<ExtraData> {
    prize: string;
    winnerCount: number;
    duration?: number; // can be null for drops
    hostedBy?: User;
    botsCanWin?: boolean;
    exemptPermissions?: PermissionResolvable[];
    exemptMembers?: (member: GuildMember, giveaway: Giveaway<ExtraData>) => Awaitable<boolean>;
    bonusEntries?: BonusEntry<ExtraData>[];
    embedColor?: ColorResolvable;
    embedColorEnd?: ColorResolvable;
    reaction?: EmojiIdentifierResolvable;
    messages?: GiveawayMessages;
    thumbnail?: string;
    image?: string;
    extraData?: ExtraData;
    lastChance?: LastChanceOptions;
    pauseOptions?: PauseOptions;
    isDrop?: boolean;
    allowedMentions?: Omit<MessageMentionOptions, 'repliedUser'>;
}
export interface GiveawayMessages {
    giveaway?: string;
    giveawayEnded?: string;
    title?: string;
    inviteToParticipate?: string;
    timeRemaining?: string;
    winMessage?: string | MessageObject;
    drawing?: string;
    dropMessage?: string;
    embedFooter?: string | { text?: string; iconURL?: string };
    noWinner?: string;
    winners?: string;
    endedAt?: string;
    hostedBy?: string;
}
export interface MessageObject {
    content?: string;
    embed?: JSONEncodable<APIEmbed> | APIEmbed;
    components?: (
        | JSONEncodable<APIActionRowComponent<APIMessageActionRowComponent | APIModalActionRowComponent>>
        | APIActionRowComponent<APIMessageActionRowComponent | APIModalActionRowComponent>
    )[];
    replyToGiveaway?: boolean;
}
export interface GiveawaysManagerEvents<ExtraData = any> {
    giveawayDeleted: [Giveaway<ExtraData>];
    giveawayEnded: [Giveaway<ExtraData>, GuildMember[]];
    giveawayRerolled: [Giveaway<ExtraData>, GuildMember[]];
    giveawayReactionAdded: [Giveaway<ExtraData>, GuildMember, MessageReaction];
    giveawayReactionRemoved: [Giveaway<ExtraData>, GuildMember, MessageReaction];
    endedGiveawayReactionAdded: [Giveaway<ExtraData>, GuildMember, MessageReaction];
}
export class Giveaway<ExtraData = any> extends EventEmitter {
    constructor(manager: GiveawaysManager<ExtraData>, options: GiveawayData<ExtraData>);

    public channelId: Snowflake;
    public client: Client;
    public endAt: number;
    public ended: boolean;
    public guildId: Snowflake;
    public hostedBy?: User;
    public manager: GiveawaysManager<ExtraData>;
    public message: Message | null;
    public messageId: Snowflake;
    public messages: Required<GiveawayMessages>;
    public thumbnail?: string;
    public image?: string;
    public extraData?: ExtraData;
    public options: GiveawayData<ExtraData>;
    public prize: string;
    public startAt: number;
    public winnerCount: number;
    public winnerIds: Snowflake[];
    public allowedMentions?: Omit<MessageMentionOptions, 'repliedUser'>;
    private endTimeout?: NodeJS.Timeout;
    private isEnding?: boolean;

    // getters calculated using default manager options
    readonly exemptPermissions: PermissionResolvable[];
    readonly embedColor: ColorResolvable;
    readonly embedColorEnd: ColorResolvable;
    readonly botsCanWin: boolean;
    readonly reaction: EmojiIdentifierResolvable;
    readonly lastChance: Required<LastChanceOptions>;

    // getters calculated using other values
    readonly remainingTime: number;
    readonly duration: number;
    readonly messageURL: string;
    readonly exemptMembersFunction: Function | null;
    readonly bonusEntries: BonusEntry<ExtraData>[];
    readonly data: GiveawayData<ExtraData>;
    readonly pauseOptions: Required<PauseOptions>;
    readonly isDrop: boolean;
    readonly messageReaction: MessageReaction | null;
    private ensureEndTimeout(): void;
    private checkWinnerEntry(user: User): Promise<boolean>;
    public checkBonusEntries(user: User): Promise<number>;
    public fetchAllEntrants(): Promise<Collection<Snowflake, User>>;
    public fillInString(string: string): string;
    public fillInString(string: unknown): string | null;
    public fillInEmbed(embed: JSONEncodable<APIEmbed> | APIEmbed): EmbedBuilder;
    public fillInEmbed(embed: unknown): EmbedBuilder | null;
    public fillInComponents(
        components: (
            | JSONEncodable<APIActionRowComponent<APIMessageActionRowComponent | APIModalActionRowComponent>>
            | APIActionRowComponent<APIMessageActionRowComponent | APIModalActionRowComponent>
        )[]
    ): ActionRowBuilder<MessageActionRowComponentBuilder>[];
    public fillInComponents(components: unknown): ActionRowBuilder<MessageActionRowComponentBuilder>[] | null;
    public exemptMembers(member: GuildMember): Promise<boolean>;
    public fetchMessage(): Promise<Message>;
    public edit(options: GiveawayEditOptions<ExtraData>): Promise<Giveaway<ExtraData>>;
    public end(noWinnerMessage?: string | MessageObject): Promise<GuildMember[]>;
    public reroll(options?: GiveawayRerollOptions): Promise<GuildMember[]>;
    public roll(winnerCount?: number): Promise<GuildMember[]>;
    public pause(options?: Omit<PauseOptions, 'isPaused' | 'durationAfterPause'>): Promise<Giveaway<ExtraData>>;
    public unpause(): Promise<Giveaway<ExtraData>>;
}
export interface GiveawayEditOptions<ExtraData> {
    newWinnerCount?: number;
    newPrize?: string;
    addTime?: number;
    setEndTimestamp?: number;
    newMessages?: GiveawayMessages;
    newThumbnail?: string;
    newImage?: string;
    newBonusEntries?: BonusEntry<ExtraData>[];
    newExemptMembers?: (member: GuildMember, giveaway: Giveaway<ExtraData>) => Awaitable<boolean>;
    newExtraData?: ExtraData;
    newLastChance?: LastChanceOptions;
}
export interface GiveawayRerollOptions {
    winnerCount?: number;
    messages?: {
        congrat?: string | MessageObject;
        error?: string | MessageObject;
        replyWhenNoWinner?: boolean;
    };
}
export interface GiveawayData<ExtraData = any> {
    startAt: number;
    endAt: number;
    winnerCount: number;
    messages: Required<GiveawayMessages>;
    prize: string;
    channelId: Snowflake;
    guildId: Snowflake;
    ended: boolean;
    winnerIds?: Snowflake[];
    messageId: Snowflake;
    reaction?: EmojiIdentifierResolvable;
    exemptPermissions?: PermissionResolvable[];
    exemptMembers?: string;
    bonusEntries?: string;
    embedColor?: ColorResolvable;
    embedColorEnd?: ColorResolvable;
    thumbnail?: string;
    image?: string;
    hostedBy?: string;
    extraData?: ExtraData;
    lastChance?: LastChanceOptions;
    pauseOptions?: PauseOptions;
    isDrop?: boolean;
    allowedMentions?: Omit<MessageMentionOptions, 'repliedUser'>;
}