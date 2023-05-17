import { MessageCommandBuilder, RecipleClient, RecipleModule, recursiveDefaults } from 'reciple';
import { BaseModule } from '../BaseModule.js';
import Doc, { DocElement, DocType } from 'discord.js-docs';
import Utils from '../utils/Utils.js';

export class DocsParser extends BaseModule {
    public client!: RecipleClient;
    public clientDocs!: Doc.default;
    public recipleDocs!: Doc.default;

    public async onStart(client: RecipleClient<false>, module: RecipleModule): Promise<boolean> {
        this.client = client;

        this.devCommands = [
            new MessageCommandBuilder()
                .setName('fetch-docs')
                .addAliases('fd')
                .setDescription('Fetch and update docs data')
                .setDmPermission(true)
                .setExecute(async ({ message }) => {
                    if (!Utils.parseDevIds().includes(message.author.id)) return;

                    const links = `- ${this.createRawDocJsonURL('client', 'main')}\n` +
                                `- ${this.createRawDocJsonURL('reciple', 'main')}`;

                    const reply = await message.reply(
                        `Fetching docs data from:\n` + links
                    );

                    await this.fetchDocsData();
                    await reply.edit(`Updated docs data from:\n${links}`);
                })
        ];

        return true;
    }

    public createDocsLink(doc: DocElement, parent?: DocElement): string {
        const { repo, branch } = doc.doc;

        if (doc.docType === 'method' || doc.docType === 'prop') {
            if (!parent) throw new Error('Parent is required');

            return `https://reciple.js.org/docs/${repo}/${branch}/${this.parseDocType(parent.docType)}/${parent.name}#${doc.name}`;
        } else {
            return `https://reciple.js.org/docs/${repo}/${branch}/${this.parseDocType(doc.docType)}/${doc.name}`;
        }
    }

    public parseDocType(type: DocType): string {
        switch(type) {
            case 'class': return 'classes';
            case 'typedef': return 'typedefs';
            case 'interface': return 'typedefs';
            case 'event': return 'events';
            default: return 'unknown';
        }
    }

    public getTypeEmoji(type: DocType): string {
        switch(type) {
            case 'class': return '<:class:1103949796609359942>';
            case 'typedef': return '<:interface:1103951315996000337>';
            case 'interface': return '<:interface:1103951315996000337>';
            case 'method': return '<:method:1103950583540498515>';
            case 'prop': return '<:property:1103950574635982898>';
            default: return '';
        }
    }

    public getDocsData(pkg: 'client'|'reciple'): Doc.default {
        return pkg === 'client' ? this.clientDocs : this.recipleDocs;
    }

    public createRawDocJsonURL<P extends string, T extends string>(pkg: P, tag: T): `https://raw.githubusercontent.com/FalloutStudios/Reciple/docs/${P}/${T}.json` {
        return `https://raw.githubusercontent.com/FalloutStudios/Reciple/docs/${pkg}/${tag}.json`;
    }

    public async fetchDocsData(): Promise<void> {
        const Doc = recursiveDefaults(await import('discord.js-docs'))!;

        this.clientDocs = await Doc.fetch(this.createRawDocJsonURL('client', 'main'));
        this.recipleDocs = await Doc.fetch(this.createRawDocJsonURL('reciple', 'main'));
    }

    public async onLoad(client: RecipleClient<true>, module: RecipleModule): Promise<void> {
        await this.fetchDocsData();
    }
}

export default new DocsParser();