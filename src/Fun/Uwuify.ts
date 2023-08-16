import { ContextMenuCommandBuilder } from 'reciple';
import { ButtonBuilder, ButtonStyle, ComponentType } from 'discord.js';
import { BaseModule } from '../BaseModule.js';
import Uwuifier from 'uwuifier';
import Utility from '../Utils/Utility.js';

export class Uwuify extends BaseModule {
    public formatter!: Uwuifier.default;

    public async onStart(): Promise<boolean> {
        this.formatter = new (await import(('uwuifier'))).default();

        this.commands = [
            new ContextMenuCommandBuilder()
                .setName('Uwuify')
                .setType('Message')
                .setDMPermission(true)
                .setExecute(async ({ interaction }) => {
                    if (!interaction.isMessageContextMenuCommand()) return;

                    const message = interaction.targetMessage;

                    if (!message.content) {
                        await interaction.reply({
                            content: Utility.createErrorMessage('This message doesn\'t have a text content'),
                            ephemeral: true
                        });

                        return;
                    }

                    await interaction.reply({
                        content: this.formatter.uwuifySentence(message.content),
                        components: [
                            {
                                type: ComponentType.ActionRow,
                                components: [
                                    new ButtonBuilder()
                                        .setStyle(ButtonStyle.Link)
                                        .setURL(message.url)
                                        .setLabel('View Original')
                                ]
                            }
                        ]
                    });
                })
        ];

        return true;
    }
}

export default new Uwuify();