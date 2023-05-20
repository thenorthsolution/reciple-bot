import { ContextMenuCommandBuilder, RecipleClient, RecipleModule } from 'reciple';
import { BaseModule } from '../BaseModule.js';
import { Message } from 'discord.js';
import { create, BinFile } from 'sourcebin-wrapper';
import { trimChars } from 'fallout-utility';

export class SourceBin extends BaseModule {
    public async onStart(client: RecipleClient<false>, module: RecipleModule): Promise<boolean> {
        this.commands = [
            new ContextMenuCommandBuilder()
                .setName('Generate Sourcebin')
                .setType('Message')
                .setDMPermission(true)
                .setExecute(async ({ interaction }) => {
                    if (!interaction.isMessageContextMenuCommand()) return;

                    await interaction.deferReply();

                    const message = interaction.targetMessage;
                    const content = await this.getMessageContent(message);
                    if (!content) {
                        await interaction.editReply('Unable to fetch message content');
                        return;
                    }

                    const bin = await this.createSourceBin(content.content, {
                        lang: content?.type,
                        title: `Generated bin from ${message.author.tag}'s message`,
                        description: `Generated from: ${message.url}`
                    });

                    await interaction.editReply(`https://sourceb.in/${bin}`);
                })
        ];

        return true;
    }

    public async getMessageContent(message: Message): Promise<{ type?: string; content: string; }|undefined> {
        if (!message.attachments.size) return { content: trimChars(message.content, '`', '```') } || undefined;

        const attachment = message.attachments.find(a => a.contentType?.startsWith('text/') || a.contentType?.startsWith('application/'));
        const [_cntnt, type] = (attachment?.contentType?.split(';')[0]?.split('/') || []) as string[];
        if (!attachment || !_cntnt || !type) return;

        const request = await fetch(attachment.url);
        const content = request.ok ? await request.text() : undefined;
        return content ? { type, content } : undefined;
    }

    public async createSourceBin(content: string, options?: { lang?: string; title?: string; description?: string; }): Promise<string> {
        const bin = await create([
            new BinFile({
                content,
                languageId: options?.lang
            }),
        ],
        {
            description: options?.description,
            title: options?.title
        });

        return typeof bin === 'string' ? bin : bin.key;
    }
}

export default new SourceBin();