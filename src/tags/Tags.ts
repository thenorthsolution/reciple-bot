import { Config, MessageCommandBuilder, RecipleClient, SlashCommandBuilder, yaml } from 'reciple';
import { ButtonBuilder, ButtonStyle, Collection, ComponentType, mergeDefault } from 'discord.js';
import { InteractionListenerType } from 'reciple-interaction-events';
import { readdir, readFile, writeFile } from 'fs/promises';
import { createReadFileAsync } from 'fallout-utility';
import { BaseModule } from '../BaseModule.js';
import Utility from '../Utils/Utility.js';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import path from 'path';

export interface TagsConfig {
    autosuggestChannels?: string[];
    autosuggestIgnoredRoles?: string[];
}

export interface Tag {
    id: string;
    name: string;
    pinned?: boolean;
    keywords?: string[];
    autosuggest?: (string[]|string)[];
    content: string;
}

export class Tags extends BaseModule {
    public tags: Collection<string, Tag> = new Collection();
    public tagsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../tags');

    public static defaultConfig: TagsConfig = {
        autosuggestChannels: [],
        autosuggestIgnoredRoles: []
    };

    public config: TagsConfig = Tags.defaultConfig;

    public async onStart(): Promise<boolean> {
        this.commands = [
            Utility.commonSlashCommandOptions(new SlashCommandBuilder()
                .setName('tag')
                .setDescription('Send a tag to chat')
                .setDMPermission(true)
                .addStringOption(query => query
                    .setName('query')
                    .setDescription('Search for tag to send')
                    .setRequired(true)
                    .setAutocomplete(true)
                ))
                .setExecute(async ({ interaction }) => {
                    const query = interaction.options.getString('query', true);
                    const hidden = interaction.options.getBoolean('hide') ?? false;
                    const target = interaction.options.getUser('target');

                    const tag = this.search(query)[0];
                    const targetMessage = target && !hidden ? `*Tag suggestion for ${target}*` : '';

                    if (!tag) {
                        await interaction.reply({ content: Utility.createErrorMessage('No tag found'), ephemeral: true });
                        return;
                    }

                    await interaction.reply({
                        content: `${targetMessage}\n${tag.content}`,
                        ephemeral: hidden
                    });
                }),
            new MessageCommandBuilder()
                .setName('tag')
                .setDescription('Send a tag to chat')
                .setValidateOptions(true)
                .setDmPermission(true)
                .addOption(query => query
                    .setName('query')
                    .setDescription('Search for tag to send')
                    .setRequired(true)
                )
                .setExecute(async ({ message, command }) => {
                    const query = command.args.join(' ');
                    const tag = this.search(query)[0];

                    if (!tag) {
                        await message.reply(Utility.createErrorMessage('No tag found'));
                        return;
                    }

                    await message.reply(tag.content);
                })
        ];

        this.devCommands = [
            new MessageCommandBuilder()
                .setName('rt')
                .setDescription('Reloads tags')
                .setExecute(async ({ message }) => {
                    const reply = await message.reply(Utility.createLabel('Loading...', '⌚'));

                    this.config = await this.loadConfig();

                    await this.parseTagsDir();
                    await reply.edit(Utility.createSuccessMessage(`Loaded **${this.tags.size}** tags`));
                })
        ];

        this.interactionListeners = [
            {
                type: InteractionListenerType.Autocomplete,
                commandName: 'tag',
                execute: async interaction => {
                    const option = interaction.options.getFocused(true);
                    const query = option.value.trim();

                    const results = this.search(query, false);

                    await interaction.respond(
                        results.map(r => {
                            return {
                                name: r.name,
                                value: r.id
                            };
                        }).splice(0, 20)
                    ).catch(() => {});
                }
            },
            {
                type: InteractionListenerType.Button,
                customId: i => i.customId.startsWith('hide-tag'),
                execute: async interaction => {
                    const userId = interaction.customId.split(' ')[1];

                    if (userId && userId !== interaction.user.id) {
                        await interaction.reply(Utility.createErrorMessage('This is not your tag suggestion'));
                        return;
                    }

                    await interaction.message.delete();
                }
            }
        ];

        this.config = await this.loadConfig();

        return true;
    }

    public async onLoad(client: RecipleClient<true>): Promise<void> {
        client.on('messageCreate', async message => {
            if (message.author.bot || message.author.system || !message.inGuild()) return;
            if (this.config.autosuggestChannels?.length && !this.config.autosuggestChannels.includes(message.channelId)) return;
            if (this.config.autosuggestIgnoredRoles?.length && message.member && this.config.autosuggestIgnoredRoles.some(r => message.member?.roles.cache.has(r))) return;

            const suggestedTag = this.findSuggestedTag(message.content);
            if (!suggestedTag) return;

            await message.reply({
                content: `*Tag suggestion for ${message.author}*\n${suggestedTag.content}`,
                components: [
                    {
                        type: ComponentType.ActionRow,
                        components: [
                            new ButtonBuilder()
                                .setCustomId(`hide-tag ${message.author.id}`)
                                .setLabel('Hide tag suggestion')
                                .setStyle(ButtonStyle.Secondary)
                        ]
                    }
                ]
            });
        });

        await this.parseTagsDir();
    }

    public findSuggestedTag(content: string): Tag|undefined {
        content = content.toLowerCase().trim();
        if (!content) return;

        const tokens = content.split(/(\s+)/).map(t => t.trim()).filter(Boolean);
        const tag = this.tags.find(t => {
            if (!t.autosuggest?.length) return false;

            const phrases = t.autosuggest;

            return phrases.some(words => {
                if (typeof words === 'string') return words.toLowerCase() === content;
                return words.map(w => w.toLowerCase()).every(word => tokens.includes(word) || content.includes(word));
            });
        });

        return tag;
    }

    public search(query: string, noPinned: boolean = true): Tag[] {
        query = query.toLowerCase();

        const tokens = query.trim().split(' ').filter(Boolean);

        let results = this.tags.filter(tag => {
                if (!query) return noPinned ? false : tag.pinned;

                if (tag.id.toLowerCase() === query) return true;
                if (tag.name.toLowerCase() === query) return true;

                const matchedKeywords = tag.keywords?.some(kw => tokens.every(tk => kw.toLowerCase().includes(tk)));

                if (matchedKeywords) return true;
                if (tokens.every(tk => tag.name.toLowerCase().includes(tk))) return true;

                return false;
            })
            .toJSON()
            .map(r => ({
                ...r,
                name: (!query && r.pinned ? '📌' : '🔎') + ' ' + r.name
            }));

        return results;
    }

    public async parseTagsDir(dir?: string): Promise<Tag[]> {
        const basedir = dir ?? this.tagsDir;
        if (!existsSync(basedir)) return [];

        const tags: Tag[] = [];
        const files = (await readdir(basedir)).filter(t => t.endsWith('.yml')).map(t => path.join(basedir, t));

        this.tags.clear();

        for (const file of files) {
            const data: Omit<Tag, 'id'> & { id?: string; } = yaml.parse(await readFile(file, 'utf-8'));
            if (!data.id) data.id = path.parse(file).name;

            this.tags.set(data.id, data as Tag);
            tags.push(data as Tag);
        }

        return tags;
    }

    public async loadConfig(): Promise<TagsConfig> {
        const file = path.join(process.cwd(), 'config/tags.yml');

        return createReadFileAsync(file, Tags.defaultConfig, {
            encodeFileData: data => yaml.stringify(data),
            formatReadData: async (data) => {
                this.config = Config.resolveEnvValues(mergeDefault(Tags.defaultConfig, yaml.parse(data.toString())) as TagsConfig);

                await writeFile(file!, yaml.stringify(this.config));

                return this.config;
            }
        })
    }
}

export default new Tags();