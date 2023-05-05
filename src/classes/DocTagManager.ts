import { BaseManager, Collection } from 'discord.js';
import { DocsParser } from '../docs/DocsParser.js';
import axios from 'axios';
import Doc from 'discord.js-docs';

export interface APIGitHubContentPartial {
    name: string;
    path: string;
    sha: string;
    size: number;
    url: string;
    html_url: string;
    git_url: string;
    download_url: string;
    type: "file"|"dir";
}

export interface DocTag<HasContent extends boolean = boolean> {
    tag: string;
    jsonUrl: string;
    content: HasContent extends true
        ? Doc.default
        : HasContent extends false
            ? null
            : Doc.default|null;
}

export class DocTagManager extends BaseManager {
    readonly cache: Collection<string, DocTag> = new Collection();

    constructor(readonly pkg: string, readonly parser: DocsParser) {
        super(parser.client);
    }

    public async fetch(options?: { cache?: boolean; fetchContent?: boolean; }): Promise<DocTag[]> {
        const url = `https://api.github.com/repos/FalloutStudios/Reciple/contents/${this.pkg}?ref=docs`;
        const raw = await axios.get<APIGitHubContentPartial[]>(url, { responseType: 'json' });
        const data = await Promise.all(raw.data.map(async r => {
            return {
                tag: r.name.replace('.json', ''),
                jsonUrl: `https://raw.githubusercontent.com/FalloutStudios/Reciple/docs/${r.path}`,
                content: options?.fetchContent !== false
                    ? await this.fetchContent(r.name.replace('.json', '')) ?? null
                    : null
            } satisfies DocTag;
        }));

        if (options?.cache !== false) {
            for (const tag of data) {
                this.cache.set(tag.tag, tag);
            }
        }

        return data;
    }

    public async fetchContent(tag: string|DocTag): Promise<Doc.default|undefined> {
        const jsonUrl = typeof tag === 'string' ? this.cache.get(tag) : tag;
        if (!jsonUrl) return;

        const url = jsonUrl.jsonUrl;
        const doc = await Doc.default.fetch(url, { force: true });

        jsonUrl.content = doc;

        return doc;
    }
}