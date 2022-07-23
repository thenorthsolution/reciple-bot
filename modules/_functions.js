const { EmbedBuilder } = require('discord.js');
const { trimChars, escapeRegExp } = require('fallout-utility');

const emojis = {
    "Class": "<:class:1000314887261667408>",
    "Interface": "<:typeinterface:1000314891304968285>",
    "Function": "<:methodfunction:1000314893813162015>",
    "Method": "<:methodfunction:1000314893813162015>",
    "Enumeration": "<:enum:1000314889644015636>",
    "Variable": "<:variable:1000314895889354902>",
    "Type alias": "<:typeinterface:1000314891304968285>",
    "Other": "<:word:1000319654339825744>"
};

const aliases = {
    "Class": "classes/",
    "Interface": "interfaces/",
    "Function": "modules.html#",
    "Enumeration": "enums/",
    "Variable": "modules.html#",
    "Type alias": "modules.html#"
}

module.exports.searchDocs = (query) => {
    let { docsData } = require('./docs');
    let oneResult = query.startsWith('+');
    
    query = trimChars(query.toLowerCase(), escapeRegExp("+"));

    docsData = docsData.filter(data => {
        if (data.name.toLowerCase().includes(query)) return true;
        if (!oneResult && Array.isArray(data?.sources) && data.sources.some(f => f.fileName.toLowerCase().includes(query))) return true;
        if (!oneResult && Array.isArray(data?.children) && data.children.some(d => d.name.toLowerCase().includes(query))) return true;
    });

    docsData = docsData.sort((a,b) => {
        if (a.name == query) return -3;
        if (a.name.includes(query)) return -2;
        if (a.kindString == "Class") return -1;
        if (a.kindString == "Interface") return 1;
        if (a.kindString == "Function") return 2;
        if (a.kindString == "Enumerations") return 3;
        if (a.kindString == "Variable") return 4;
        if (a.kindString == "Type alias") return 5;

        return 0;
    });

    return oneResult ? docsData.slice(0, 1) : docsData;
}

module.exports.resultsEmbed = (results, client) => {
    const { docsVersion } = require('./docs');
    const pages = [];

    const embed = new EmbedBuilder()
        .setAuthor({ name: `Reciple ${docsVersion}`, iconURL: client?.user.displayAvatarURL(), url: 'https://reciple.js.org' })
        .setColor('Blurple')
        .setTimestamp();
    
    let description = '';
    let count = 0;
    let page = 1;

    for (const data of results) {
        const emoji = emojis[data.kindString] ?? emojis.Other;
        const alias = aliases[data.kindString] ?? '';

        description += `${emoji} [**${data.name}**](https://reciple.js.org/${alias ? alias + data.name : ''})\n`;
        count++;

        if (count >= 10) {
            embed.setFooter({ text: `Page ${page}` });
            embed.setDescription(description || ' ');
            pages.push(new EmbedBuilder(embed.data));

            count = 0;
            description = '';
            page++;
        }
    }

    return pages;
}

module.exports.getInfoEmbed = (data, client) => {
    const { docsVersion } = require('./docs');
    const emoji = emojis[data.kindString] ?? emojis.Other;
    const alias = aliases[data.kindString] ?? '';
    const url = `https://reciple.js.org/${alias ? alias + data.name : ''}`;
    const embed = new EmbedBuilder()
        .setAuthor({ name: `Reciple ${docsVersion}`, iconURL: client?.user.displayAvatarURL(), url: 'https://reciple.js.org' })
        .setColor('Blurple');

    embed.setDescription(data?.signatures[0]?.comment.shortText || ' ')
    embed.setTitle(data.name);
    embed.setURL(url);
    embed.addFields([
        {
            name: `Kind`,
            value: `${emoji} **${data.kindString}**`
        },
        {
            name: `Source`,
            value: `<:github:788814141510516777> [${data.sources[0].fileName}:${data.sources[0].line}:${data.sources[0].character}](https://github.com/FalloutStudios/Reciple/tree/${trimChars(docsVersion, "v")}/${data.sources[0].fileName}#L${data.sources[0].line})`
        },
        {
            name: `Docs`,
            value: `<:rjs:1000254196274176141> [${url}](${url})`
        }
    ]);

    return [embed];
}