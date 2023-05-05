import { Collection, SlashCommandSubcommandBuilder } from 'discord.js';
import { BaseModule } from '../BaseModule.js';
import { RecipleClient, RecipleModule, SlashCommandBuilder } from 'reciple';
import DocsParser from './DocsParser.js';
import { DocElement } from 'discord.js-docs';
import { limitString } from 'fallout-utility';
import Utils from '../utils/Utils.js';

export class Docs extends BaseModule {
    public async onStart(client: RecipleClient<false>, module: RecipleModule): Promise<boolean> {
        this.commands = [
            new SlashCommandBuilder()
                .setName('docs')
                .setDescription('Display docs for certain package')
                .addSubcommand(reciple => this.subcommandOptions(reciple)
                    .setName('reciple')
                    .setDescription('Display docs for reciple')
                )
                .addSubcommand(reciple => this.subcommandOptions(reciple)
                    .setName('client')
                    .setDescription('Display docs for @reciple/client')
                )
                .setDMPermission(true)
                .setExecute(async ({ interaction }) => {
                    const subcommand = interaction.options.getSubcommand() as 'client'|'reciple';
                    const query = interaction.options.getString('query', true).replace('()', '');
                    const hidden = interaction.options.getBoolean('hide') || false;
                    const target = interaction.options.getUser('target');
                    const docs = DocsParser.getDocsData(subcommand);

                    const [parentQuery, childQuery] = (query.includes('#')
                        ? query.split('#')
                        : query.includes('.')
                            ? query.split('.')
                            : [query]) as [string|undefined, string|undefined];

                    const parent: DocElement|undefined = (parentQuery ? docs.get(parentQuery) : null) || undefined;
                    const child: DocElement|undefined = (childQuery && parent ? new Collection<string, DocElement>(parent.children.entries()).find(d => d.name === childQuery) : null) || undefined;
                    const data = (child || parent)!;
                    const name = parent!.name + (child ? ('#' + child.name) : '');

                    if (!parent || childQuery && !child) {
                        await interaction.reply({ content: `No results found`, ephemeral: true });
                        return;
                    }

                    const docsUrl = child ? DocsParser.createDocsLink(child, parent) : DocsParser.createDocsLink(parent);
                    const targetMessage = target && !hidden ? `*Documentation suggestion for ${target}*\n` : '';

                    await interaction.reply({
                        content: `${targetMessage + DocsParser.getTypeEmoji(data.docType)} [__**${name}**__](<${docsUrl}>)\n${limitString(data.description ?? '', 1800)}`,
                        ephemeral: hidden
                    });
                })
        ];

        return true;
    }

    public async onLoad(client: RecipleClient<true>, module: RecipleModule): Promise<void> {
        client.on('interactionCreate', async interaction => {
            if (!interaction.isAutocomplete()) return;

            const command = interaction.commandName;
            const subcommand = interaction.options.getSubcommand(false) as 'client'|'reciple';
            const option = interaction.options.getFocused(true);
            const query = option.value.trim();

            if (command !== 'docs' || option.name !== 'query') return;

            const docs = DocsParser.getDocsData(subcommand);
            const results = docs.search(query, { excludePrivateElements: true }) || [];

            await interaction.respond(
                results.map(r => {
                    return {
                        name: r.formattedName,
                        value: r.formattedName
                    };
                })
            ).catch(() => {});
        });
    }

    public subcommandOptions(subcommand: SlashCommandSubcommandBuilder): SlashCommandSubcommandBuilder {
        return Utils.commonSlashCommandOptions(subcommand
            .addStringOption(query => query
                .setName('query')
                .setDescription('Search the docs for classes, functions, or typedefs')
                .setRequired(true)
                .setAutocomplete(true)
            ));
    }
}

export default new Docs();