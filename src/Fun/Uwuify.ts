import { BaseMessageOptions, ButtonBuilder, ButtonStyle, ComponentType, EmbedBuilder, GuildMember, Message, TextBasedChannel, User } from 'discord.js';
import { ContextMenuCommandBuilder, SlashCommandBuilder } from 'reciple';
import { BaseModule } from '../BaseModule.js';
import Utility from '../Utils/Utility.js';
import Uwuifier from 'uwuifier';
import { ParseMessageURLData, parseMessageURL, resolveFromCachedCollection } from '@reciple/utils';

export class Uwuify extends BaseModule {
    public formatter!: Uwuifier.default;
    public footerPrefix: string = '​​​​​';

    public async onStart(): Promise<boolean> {
        this.formatter = new (await import(('uwuifier'))).default();

        this.commands = [
            new SlashCommandBuilder()
                .setName('uwuify')
                .setDescription('Uwuify some message')
                .addStringOption(message => message
                    .setName('message')
                    .setDescription('Message ID or URL of your target message')
                    .setRequired(true)
                )
                .setExecute(async ({ interaction, client }) => {
                    const messageResolvable = interaction.options.getString('message', true);

                    await interaction.deferReply({ ephemeral: true })

                    const messageData: ParseMessageURLData = Utility.isSnowflake(messageResolvable) ? { channelId: interaction.channelId, messageId: messageResolvable, guildId: interaction.guildId } : parseMessageURL(messageResolvable);
                    const channel = await resolveFromCachedCollection(messageData.channelId, client.channels);

                    if (!channel || !channel.isTextBased()) {
                        await interaction.editReply(Utility.createErrorMessage('Unable to send message to this channel'));
                        return;
                    }

                    const message = await resolveFromCachedCollection(messageData.messageId, channel.messages);
                    const reply = await this.sendUwuifiedMessage(message, channel, { requestedBy: interaction.user });

                    await interaction.editReply(reply ? Utility.createSuccessMessage('Message uwuified') : Utility.createErrorMessage('Unable to send message to this channel'));
                }),
            new ContextMenuCommandBuilder()
                .setName('Uwuify')
                .setType('Message')
                .setDMPermission(true)
                .setExecute(async ({ interaction, client }) => {
                    if (!interaction.isMessageContextMenuCommand()) return;

                    const message = interaction.targetMessage;
                    const channel = interaction.channel;

                    await interaction.deferReply({ ephemeral: true })

                    if (!channel) {
                        await interaction.editReply(Utility.createErrorMessage('Unable to send message to this channel'));
                        return;
                    }

                    const reply = await this.sendUwuifiedMessage(message, channel, { requestedBy: interaction.user });

                    await interaction.editReply(reply ? Utility.createSuccessMessage('Message uwuified') : Utility.createErrorMessage('Unable to send message to this channel'));
                })
        ];

        return true;
    }

    public async sendUwuifiedMessage(message: Message, channel: TextBasedChannel, { useWebhook, requestedBy }: { useWebhook?: boolean; requestedBy?: User|GuildMember; } = {}): Promise<Message|null> {
        const response: BaseMessageOptions = {
            content: message.content ? this.formatter.uwuifySentence(message.content) : undefined,
            files: message.attachments.toJSON(),
            embeds: message.embeds,
            allowedMentions: {
                repliedUser: false,
                parse: []
            }
        };

        if (channel.isDMBased() || useWebhook === false) {
            return channel.send({
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
        }

        const parentChannel = channel.isThread() ? channel.parent : channel;
        const webhook = (await parentChannel?.fetchWebhooks().catch(() => null))?.find(w => w.owner?.id === channel.client.user.id) ?? await parentChannel?.createWebhook({ name: 'Uwuifier' });
        if (!webhook) return null;

        return webhook.send({
            ...response,
            username: message.member?.displayName ?? message.author.displayName,
            avatarURL: message.member?.displayAvatarURL() ?? message.author.displayAvatarURL(),
            embeds: [
                ...(response.embeds ?? []).filter(e => !EmbedBuilder.from(e).data.author?.name.startsWith(this.footerPrefix)),
                ...(requestedBy
                    ? [
                        new EmbedBuilder()
                            .setAuthor({ name: requestedBy.displayName, iconURL: requestedBy.displayAvatarURL() })
                    ] : []
                )
            ],
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
    }
}

export default new Uwuify();