import { AnySlashCommandBuilder, SlashCommandBuilder } from 'reciple';
import { BaseModule } from '../BaseModule.js';
import { SlashCommandSubcommandBuilder, Snowflake, inlineCode } from 'discord.js';
import DevCommands from './DevCommands.js';

export class Utils extends BaseModule {
    public async onStart(): Promise<boolean> {
        DevCommands.devUsers = this.parseDevIds();

        return true;
    }

    public createErrorMessage(message: string): string {
        return this.createLabel(message, '❌');
    }

    public createSuccessMessage(message: string): string {
        return this.createLabel(message, '✅');
    }

    public createWarningMessage(message: string): string {
        return this.createLabel(message, '⚠️');
    }

    public createLabel(message: string, emoji: string): string {
        return `${inlineCode(emoji)} ${message}`;
    }

    public parseDevIds(): string[] {
        const raw = process.env.DEV_IDS;
        if (!raw) return [];

        return raw.split(' ');
    }

    public commonSlashCommandOptions<T extends SlashCommandSubcommandBuilder|AnySlashCommandBuilder>(builder: T): T {
        return (builder as SlashCommandBuilder)
            .addUserOption(target => target
                .setName('target')
                .setDescription('User to mention')
            )
            .addBooleanOption(hide => hide
                .setName('hide')
                .setDescription('Hide command response')
            ) as T;
    }

    public isSnowflake(id: unknown): id is Snowflake {
        let isBigInt: boolean;

        try {
            BigInt(id as string);
            isBigInt = true;
        } catch(err) {
            isBigInt = false;
        }

        return typeof id === 'string' && isBigInt;
    }
}

export default new Utils();