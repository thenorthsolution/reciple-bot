const { EmbedBuilder } = require('discord.js');
const { trimChars, escapeRegExp } = require('fallout-utility');

const emojis = {
    "Class": "<:class:874569296821501952>",
    "Interface": "<:interface:874569310025179188>",
    "Function": "<:method:965916906311802930>",
    "Enumeration": "<:interface:874569310025179188>",
    "Variable": "<:property:874569322742308864>",
    "Type alias": "<:interface:874569310025179188>",
    "Other": "<:property:874569322742308864>"
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
    const embed = new EmbedBuilder()
        .setAuthor({ name: 'Reciple.js.org', iconURL: client?.user.displayAvatarURL(), url: 'https://reciple.js.org' })
        .setColor('Blurple');
    
    let description = '';
    results = results.length > 30 ? results.slice(0, 30) : results;

    for (const data of results) {
        const emoji = emojis[data.kindString] ?? emojis.Other;
        const alias = aliases[data.kindString] ?? '';

        description += `${emoji} [**${data.name}**](https://reciple.js.org/${alias ? alias + data.name : ''})\n`;
    }

    embed.setDescription(description || ' ');
    embed.setFooter({ text: `Reciple - ${docsVersion}` });
    embed.setTimestamp();

    return embed;
}

module.exports.getInfoEmbed = (data, client) => {
    const { docsVersion } = require('./docs');
    const emoji = emojis[data.kindString] ?? emojis.Other;
    const alias = aliases[data.kindString] ?? '';
    const url = `https://reciple.js.org/${alias ? alias + data.name : ''}`;
    const embed = new EmbedBuilder()
        .setAuthor({ name: 'Reciple.js.org', iconURL: client?.user.displayAvatarURL(), url: 'https://reciple.js.org' })
        .setColor('Blurple');

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

    return embed;
}