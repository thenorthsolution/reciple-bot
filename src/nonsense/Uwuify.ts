import { ContextMenuCommandBuilder, recursiveDefaults } from 'reciple';
import { BaseModule } from '../BaseModule.js';
import { escapeMarkdown } from 'discord.js';
import Uwuifier from 'uwuifier';

export class Uwuify extends BaseModule {
    public uwuifier!: Uwuifier.default;

    public async onStart(): Promise<boolean> {
        this.uwuifier = new (recursiveDefaults(await import('uwuifier')) as any)();

        this.commands = [
            new ContextMenuCommandBuilder()
                .setName('Uwuify')
                .setType('Message')
                .setExecute(async ({ interaction }) => {
                    if (!interaction.isMessageContextMenuCommand()) return;

                    const message = interaction.targetMessage;

                    await interaction.reply(escapeMarkdown(this.uwuifier.uwuifySentence(message.content || 'Message has no content')));
                })
        ];

        return true;
    }
}

export default new Uwuify();