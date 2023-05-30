import { AnySlashCommandBuilder, SlashCommandBuilder } from 'reciple';
import { BaseModule } from '../BaseModule.js';
import { SlashCommandSubcommandBuilder } from 'discord.js';
import DevCommands from '../DevCommands.js';

export class Utils extends BaseModule {
    public async onStart(): Promise<boolean> {
        DevCommands.devUsers = this.parseDevIds();

        return true;
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
}

export default new Utils();