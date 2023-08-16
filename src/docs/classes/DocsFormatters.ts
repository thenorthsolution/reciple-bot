import { ClassMethodParser, ClassParser, ClassPropertyParser, CommentParser, EnumMemberParser, EnumParser, FunctionParser, InterfaceMethodParser, InterfaceParser, InterfacePropertyParser, ProjectParser, SearchResult, SignatureParser, TypeAliasParser, TypeParameterParser, VariableParser } from 'typedoc-json-parser';
import { DocsParser } from './DocsParser.js';
import { slug } from 'github-slugger';

export enum DocsElementTypeEmoji {
    Class = '<:class:1103949796609359942>',
    Type = '<:interface:1103951315996000337>',
    Enum = '<:enum:1141377321782214676>',
    Method = '<:method:1103950583540498515>',
    Property = '<:property:1103950574635982898>'
}

export class DocsFormatters {
    public static docsBaseURL = 'https://reciple.js.org/docs';

    public static createElementDescription(parser: DocsParser, tag: string, element: SearchResult): string {
        let baseURL = this.docsBaseURL + `/${parser.options.package}/${tag}`;

        const project = parser.cache.get(tag)!;
        const parent = 'parentId' in element ? project.find(element.parentId) : null;
        const displayName = this.formatName(project, element);
        const emoji = this.getElementTypeEmoji(element);
        const fragment = 'parentId' in element ? slug(element.name) : null;
        const slugType = 'parentId' in element
            ? parent
                ? this.getElementSlugType(parent)
                : element.parentId
            : this.getElementSlugType(element);

        baseURL += `/${slugType}:${parent?.name ?? element.name}${fragment ? ('#' + fragment) : ''}`;

        const title = `${emoji ?? ''} [**${displayName}**](<${baseURL}>)`;

        return `${title}\n${!(element instanceof TypeParameterParser) ? (this.getElementDescription(element) ?? '') : ''}`;
    }

    public static getElementTypeEmoji(element: SearchResult): string|null {
        if (element instanceof ClassParser) {
            return DocsElementTypeEmoji.Class;
        } else if (element instanceof EnumParser || element instanceof EnumMemberParser) {
            return DocsElementTypeEmoji.Enum;
        } else if (element instanceof InterfaceParser || element instanceof TypeAliasParser) {
            return DocsElementTypeEmoji.Type;
        } else if (element instanceof FunctionParser || element instanceof ClassMethodParser || element instanceof InterfaceMethodParser) {
            return DocsElementTypeEmoji.Method;
        } else if (element instanceof VariableParser || element instanceof ClassPropertyParser || element instanceof InterfacePropertyParser) {
            return DocsElementTypeEmoji.Property;
        }

        return null;
    }

    public static getElementSlugType(element: SearchResult) {
        if (element instanceof ClassParser) {
            return 'classes';
        } else if (element instanceof EnumParser) {
            return 'enums';
        } else if (element instanceof InterfaceParser) {
            return 'interfaces';
        } else if (element instanceof TypeAliasParser) {
            return 'typeAliases';
        } else if (element instanceof FunctionParser) {
            return 'functions';
        } else if (element instanceof VariableParser) {
            return 'variables';
        }

        return null;
    }

    public static formatName(project: ProjectParser, element: SearchResult): string {
        if (!('parentId' in element)) return element.name;

        const parent = project.find(element.parentId);
        if (!parent) return element.name;

        const isStatic = (element instanceof ClassMethodParser || element instanceof ClassPropertyParser) && element.static;

        return `${parent.name}${isStatic ? '.' : '#'}${element.name}`;
    }

    public static getElementDescription(element: { comment: CommentParser; }|{ signatures: SignatureParser[]; }): string|null {
        return ('signatures' in element ? element.signatures.find(s => s.comment.description)?.comment.description : ('comment' in element && element.comment?.description)) || null;
    }

    public static isElementDeprecated(element: { comment: CommentParser; }|{ signatures: SignatureParser[]; }): boolean {
        return 'signatures' in element
            ? element.signatures.some(s => this.isElementDeprecated(s))
            : 'comment' in element && (element.comment?.deprecated || element.comment?.blockTags.some(c => c.name === 'deprecated'));
    }

    public static getElementBlocktag(element: { comment: CommentParser; }|{ signatures: SignatureParser[]; }|{ comment: CommentParser; signatures: SignatureParser[]; }, tag: string): string|null {
        if ('comment' in element) {
            const bTag = element.comment.blockTags.find(t => t.name === tag)?.text ?? null;
            if (bTag || !('signatures' in element)) return bTag;
        }

        const sig = 'signatures' in element ? element.signatures.find(t => t.comment.blockTags.some(b => b.name === tag)) : null;
        return sig ? this.getElementBlocktag(sig, tag) : null;
    }
}