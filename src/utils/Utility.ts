import { AnySlashCommandBuilder, SlashCommandBuilder } from 'reciple';
import { SlashCommandSubcommandBuilder, inlineCode } from 'discord.js';
import { resolveEnvProtocol } from '@reciple/utils';
import { BaseModule } from '../BaseModule.js';
import DevCommands from './DevCommands.js';
import dotenv from 'dotenv';

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

    public resolveEnvValues<T extends Record<any, any>|string|Array<any>>(object: T, envFile?: string): T {
        if (envFile) dotenv.config({ path: envFile, override: true });
        if (typeof object !== 'object') return (typeof object === 'string' ? (resolveEnvProtocol(object) ?? object) : object) as T;
        if (Array.isArray(object)) return object.map(v => resolveEnvProtocol(v) ?? v) as T;

        const keys = object ? Object.keys(object) : [];
        const values = Object.values(object!);

        let newObject = {};
        let i = 0;

        for (const value of values) {
            newObject = {
                ...newObject,
                [keys[i]]: typeof value === 'string' || typeof value === 'object'
                    ? this.resolveEnvValues(value)
                    : value
            };

            i++;
        }

        return newObject as T;
    }
}

export default new Utils();