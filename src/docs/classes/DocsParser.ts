import axios from 'axios';
import semver from 'semver';
import { Collection } from 'discord.js';
import { ProjectParser } from 'typedoc-json-parser';

export interface DocsParserOptions {
    repository: string;
    branch?: string;
    package: string;
    defaultTag?: string;
    npm: string;

    tagFilter?: (tag: string) => boolean;
}

export interface DocsParserRaw extends ProjectParser.Json {
    parsedAt: number;
    customPages: {
        category: string;
        files: {
            id: string;
            name: string;
            content: string;
        }[];
    }[];
}

export interface APIGitHubRepositoryContent<Type extends 'file'|'dir' = 'file'|'dir'> {
    name: string;
    path: string;
    sha: string;
    size: number;
    url: string;
    html_url: string;
    git_url: string;
    download_url: string;
    type: Type,
    _links: {
        self: string;
        git: string;
        html: string;
    };
}

export class DocsParser {
    public cache: Collection<string, ProjectParser> = new Collection();
    public tags: string[] = [];

    constructor(readonly options: DocsParserOptions) {}

    public async fetchTags(): Promise<string[]> {
        const url = `https://api.github.com/repos/${this.options.repository}/contents/${this.options.package}?ref=${this.options.branch ?? 'docs'}`;
        const files = await axios.get<APIGitHubRepositoryContent<'file'>[]>(url).then(res => res.data).catch(() => []);
        const tags: string[] = [];

        if (!tags.length) return tags;

        let versions = files.filter(f => semver.valid(f.name.replace('.json', ''))).map(f => f.name.replace('.json', ''));
        let branches = files.filter(f => !versions.some(e => e === f.name.replace('.json', ''))).map(f => f.name.replace('.json', ''));

        const latestPatches: { [key: string]: number } = {};
        for (const version of versions) {
            const majorMinor = `${semver.major(version)}.${semver.minor(version)}`;
            const patch = semver.patch(version);
            if (patch < latestPatches[majorMinor]) continue;

            latestPatches[majorMinor] = patch;
        }

        for (const version of versions) {
            if (this.options.tagFilter && !this.options.tagFilter(version)) continue;

            const majorMinor = `${semver.major(version)}.${semver.minor(version)}`;
            const patch = semver.patch(version);
            if (patch < latestPatches[majorMinor]) continue;

            tags.push(version);
        }

        for (const branch of branches) {
            if (!this.options.tagFilter || this.options.tagFilter(branch)) tags.push(branch);
        }

        return this.tags = tags.reverse();
    }

    public async fetchDocs(tag?: string|null): Promise<ProjectParser> {
        tag = tag ?? this.options.defaultTag ?? 'main';

        const url = `https://raw.githubusercontent.com/${this.options.repository}/${this.options.branch ?? 'tags'}/${this.options.package}/${tag}.json`;
        const response = await axios.get<DocsParserRaw>(url).then(res => res.data);

        const data = new ProjectParser({ data: response });

        this.cache.set(tag, data);
        return data;
	}

    public async resolveTags(): Promise<string[]> {
        return this.tags.length ? this.tags : this.fetchTags();
    }

    public async resolveDocs(tag?: string|null): Promise<ProjectParser> {
        tag = tag ?? this.options.defaultTag ?? 'main';
        return this.cache.get(tag) ?? this.fetchDocs(tag);
    }
}