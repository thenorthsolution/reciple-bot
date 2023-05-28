import { MessageCommandBuilder, RecipleClient, RecipleModule, SlashCommandBuilder } from 'reciple';
import { BaseModule } from '../BaseModule.js';
import { fileURLToPath } from 'url';
import path from 'path';
import { Collection } from 'discord.js';
import { readFileSync, readdirSync } from 'fs';
import yml from 'yaml';
import Utils from '../utils/Utils.js';

export interface Tag {
    id: string;
    name: string;
    pinned?: boolean;
    keywords?: string[];
    content: string;
}

export class Tags extends BaseModule {
    public tags: Collection<string, Tag> = new Collection();
    public tagsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../tags');

    public async onStart(client: RecipleClient<false>, module: RecipleModule): Promise<boolean> {
        this.commands = [
            Utils.commonSlashCommandOptions(new SlashCommandBuilder()
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
                    const hidden = interaction.options.getBoolean('hide') || false;
                    const target = interaction.options.getUser('target');

                    const tag = this.search(query)[0];
                    const targetMessage = target && !hidden ? `*Tag suggestion for ${target}*\n` : '';

                    if (!tag) {
                        await interaction.reply({ content: 'No tag found', ephemeral: true });
                        return;
                    }

                    await interaction.reply({
                        content: `${targetMessage}\n${tag.content}`,
                        ephemeral: hidden
                    });
                })
        ];

        this.devCommands = [
            new MessageCommandBuilder()
                .setName('load-tags')
                .addAliases('lt')
                .setDescription('Load and update tags')
                .setDmPermission(true)
                .setExecute(async ({ message }) => {
                    const reply = await message.reply(`Updating tags!`);

                    await this.parseTagsDir();
                    await reply.edit(`Loaded **${this.tags.size}** tags`);
                })
        ];

        return true;
    }

    public async onLoad(client: RecipleClient<true>, module: RecipleModule): Promise<void> {
        this.parseTagsDir();

        client.on('interactionCreate', async interaction => {
            if (!interaction.isAutocomplete()) return;

            const command = interaction.commandName;
            const option = interaction.options.getFocused(true);
            const query = option.value.trim();
            if (command !== 'tag') return;

            const results = this.search(query, false);

            await interaction.respond(
                results.map(r => {
                    return {
                        name: r.name,
                        value: r.id
                    };
                }).splice(0, 20)
            ).catch(() => {});
        });
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

    public parseTagsDir(dir?: string): Tag[] {
        const basedir = dir ?? this.tagsDir;

        const tags: Tag[] = [];
        const files = readdirSync(basedir).filter(t => t.endsWith('.yml')).map(t => path.join(basedir, t));

        this.tags.clear();

        for (const file of files) {
            const data: Omit<Tag, 'id'> & { id?: string; } = yml.parse(readFileSync(file, 'utf-8'));

            if (!data.id) data.id = path.parse(file).name;

            console.log(data);

            this.tags.set(data.id, data as Tag);
            tags.push(data as Tag);
        }

        return tags;
    }
}

export default new Tags();