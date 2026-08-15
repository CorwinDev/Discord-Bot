import { Client as DiscordClient, CommandInteraction, Collection } from 'discord.js';
import { Kazagumo } from 'kazagumo';

export type Client = DiscordClient & {
    commands: Collection<string, any>;
    player: Kazagumo;
    playerManager: Map<string, any>;
};

export type Command = (
    client: Client,
    interaction: CommandInteraction,
    args: string[]
) => Promise<any>;