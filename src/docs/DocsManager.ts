import { Collection, italic } from 'discord.js';
import { BaseModule } from '../BaseModule.js';
import { DocsParser, DocsParserOptions } from './classes/DocsParser.js';
import { ProjectParser, TypeParameterParser } from 'typedoc-json-parser';
import { SlashCommandBuilder } from 'reciple';
import { SlashCommandSubcommandBuilder } from 'discord.js';
import Utility from '../Utils/Utility.js';
import { InteractionListenerType } from 'reciple-interaction-events';
import { DocsFormatters } from './classes/DocsFormatters.js';

export class DocsManager extends BaseModule {
    public packages: Collection<string, DocsParser> = new Collection();

    public static defaultParserOptions: Omit<DocsParserOptions, 'package'|'npm'> = {
        repository: 'FalloutStudios/reciple',
        branch: 'tags',
        defaultTag: 'main'
    };

    private updateDocsTimeout?: NodeJS.Timeout;

    public async onStart(): Promise<boolean> {
        this.packages.set('reciple', new DocsParser({ ...DocsManager.defaultParserOptions, package: 'reciple', npm: 'reciple' }));
        this.packages.set('client', new DocsParser({ ...DocsManager.defaultParserOptions, package: 'client', npm: '@reciple/client' }));
        this.packages.set('utils', new DocsParser({ ...DocsManager.defaultParserOptions, package: 'utils', npm: '@reciple/utils' }));
        this.packages.set('npm-loader', new DocsParser({ ...DocsManager.defaultParserOptions, package: 'npm-loader', npm: '@reciple/npm-loader' }));
        this.packages.set('update-checker', new DocsParser({ ...DocsManager.defaultParserOptions, package: 'update-checker', npm: '@reciple/update-checker' }));
        this.packages.set('docgen', new DocsParser({ ...DocsManager.defaultParserOptions, package: 'docgen', npm: '@reciple/docgen' }));

        const command = new SlashCommandBuilder()
            .setName('docs')
            .setDescription('Search Reciple docs');

        for (const pkg of this.packages.keys()) {
            command.addSubcommand(this.createPackageSubcommand(pkg));
        }

        this.commands = [
            command
                .setExecute(async ({ interaction }) => {
                    const parser = this.findParser(interaction.options.getSubcommand(true));
                    const elementId = interaction.options.getInteger('query', true);
                    const tag = interaction.options.getString('tag') ?? parser?.options.defaultTag ?? 'main';
                    const target = interaction.options.getUser('target');

                    if (!parser) {
                        await interaction.reply({ content: Utility.createErrorMessage('Unable to find package data'), ephemeral: true });
                        return;
                    }

                    await interaction.deferReply({ ephemeral: interaction.options.getBoolean('hidden') ?? false });

                    const data = await parser.resolveDocs(tag);
                    const element = data.find(elementId);

                    if (!element) {
                        await interaction.editReply({ content: Utility.createErrorMessage('Unable to find docs element') });
                        return;
                    }

                    await interaction.editReply({
                        content: `${target ? italic('Docs suggestion for ' + target.toString()) : ''}\n${DocsFormatters.createElementDescription(parser, tag, element)}`
                    });
                })
        ];

        this.interactionListeners = [
            {
                type: InteractionListenerType.Autocomplete,
                commandName: 'docs',
                execute: async interaction => {
                    const parser = this.findParser(interaction.options.getSubcommand(true));
                    const focused = interaction.options.getFocused(true);
                    const query = focused.value.toLowerCase().trim();

                    if (!parser) {
                        await interaction.respond([]);
                        return;
                    }

                    if (focused.name === 'tag') {
                        await parser?.resolveTags();
                        await interaction.respond(
                            parser?.tags
                                .filter(t => !query || t.toLowerCase().includes(query))
                                .map(t => ({ name: t, value: t }))
                                .splice(0, 25)
                            ?? []
                        );

                        return;
                    }

                    if (focused.name === 'query') {
                        const data = await parser.resolveDocs(interaction.options.getString('tag') || null);
                        const results = data.search(query);

                        await interaction.respond(
                            results
                                .filter(r => !(!(r instanceof TypeParameterParser) ? DocsFormatters.isElementDeprecated(r) : true))
                                .map(r => ({ name: DocsFormatters.formatName(data, r), value: r.id }))
                                .splice(0, 25)
                        );

                        return;
                    }
                }
            }
        ];

        return true;
    }

    public async onLoad(): Promise<void> {
        await this.resolveAll();

        this.createUpdateDocsTimeout();
    }

    public createUpdateDocsTimeout(time: number = 60 * 1000 * 60 * 24): NodeJS.Timeout {
        if (this.updateDocsTimeout) clearInterval(this.updateDocsTimeout);
        return this.updateDocsTimeout = setInterval(() => this.resolveAll().catch(() => null), time).unref();
    }

    public async resolveAll(force: boolean = false): Promise<void> {
        await Promise.all(this.packages.map((d, t) => this.resolveDocs(t, { force })));
        await Promise.all(this.packages.map((d, t) => this.resolveDocs(t, { force })));
    }

    public async resolveDocs(pkg: string, options: { tag?: string; force?: boolean; } = {}): Promise<ProjectParser|undefined> {
        const parser = this.findParser(pkg);
        if (!parser) return;

        if (options.force) {
            await parser.fetchTags();
            await parser.fetchDocs(options.tag);
        } else {
            await parser.resolveTags();
            await parser.resolveDocs(options.tag);
        }

        return parser.cache.get(options.tag ?? parser.options.defaultTag ?? 'main');
    }

    public createPackageSubcommand(pkg: string): SlashCommandSubcommandBuilder {
        const parser = this.packages.get(pkg);

        return Utility.commonSlashCommandOptions(
            new SlashCommandSubcommandBuilder()
                .setName(pkg)
                .setDescription(`Get docs for ${parser?.options.npm ?? pkg}`)
                .addIntegerOption(query => query
                    .setName('query')
                    .setDescription('Class or Class#method combination to search for')
                    .setAutocomplete(true)
                    .setRequired(true)
                )
                .addStringOption(tag => tag
                    .setName('tag')
                    .setDescription('Get docs from a specific version of ' + (parser?.options.npm ?? pkg))
                    .setAutocomplete(true)
                )
        )
    }

    public findParser(find: string): DocsParser|undefined {
        return this.packages.find((p, k) => k === find || p.options.npm === find);
    }
}

export default new DocsManager();