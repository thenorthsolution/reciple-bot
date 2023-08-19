import { BaseMessageOptions, ButtonBuilder, ButtonStyle, ComponentType, EmbedBuilder } from 'discord.js';
import { ContextMenuCommandBuilder } from 'reciple';
import { BaseModule } from '../BaseModule.js';
import Utility from '../Utils/Utility.js';
import Uwuifier from 'uwuifier';

export class Uwuify extends BaseModule {
    public formatter!: Uwuifier.default;
    public footerPrefix: string = '​​​​​';

    public async onStart(): Promise<boolean> {
        this.formatter = new (await import(('uwuifier'))).default();

        this.commands = [
            new ContextMenuCommandBuilder()
                .setName('Uwuify')
                .setType('Message')
                .setDMPermission(true)
                .setExecute(async ({ interaction, client }) => {
                    if (!interaction.isMessageContextMenuCommand()) return;

                    const message = interaction.targetMessage;
                    const channel = interaction.channel && !interaction.channel.isDMBased() ? interaction.channel : null;
                    const response: BaseMessageOptions = {
                        content: message.content ? this.formatter.uwuifySentence(message.content) : undefined,
                        files: message.attachments.toJSON(),
                        embeds: message.embeds,
                        allowedMentions: {
                            repliedUser: false,
                            parse: []
                        }
                    };

                    if (!channel) {
                        await interaction.reply({
                            ...response,
                            components: [
                                {
                                    type: ComponentType.ActionRow,
                                    components: [
                                        new ButtonBuilder()
                                            .setLabel(`View Original Message`)
                                            .setURL(message.url)
                                            .setStyle(ButtonStyle.Link)
                                    ]
                                }
                            ]
                        });
                        return;
                    }

                    await interaction.deferReply({ ephemeral: true });

                    const parentChannel = channel.isThread() ? channel.parent : channel;
                    const webhook = (await parentChannel?.fetchWebhooks().catch(() => null))?.find(w => w.owner?.id === client.user?.id) ?? await parentChannel?.createWebhook({ name: 'Uwuifier' });

                    if (!webhook) {
                        await interaction.editReply(Utility.createErrorMessage('Unable to send message'));
                        return;
                    }

                    const reply = await webhook.send({
                        ...response,
                        username: message.member?.displayName ?? message.author.displayName,
                        avatarURL: message.member?.displayAvatarURL() ?? message.author.displayAvatarURL(),
                        embeds: [
                            ...(response.embeds ?? []).filter(e => !EmbedBuilder.from(e).data.footer?.text.startsWith(this.footerPrefix)),
                            new EmbedBuilder()
                                .setDescription(`**[View Original Message](${message.url})**`)
                                .setFooter({ text: `${this.footerPrefix}Requested by ${interaction.user.displayName}` })
                        ]
                    });

                    await interaction.editReply({
                        components: [
                            {
                                type: ComponentType.ActionRow,
                                components: [
                                    new ButtonBuilder()
                                        .setLabel(`View Message`)
                                        .setURL(reply.url)
                                        .setStyle(ButtonStyle.Link)
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