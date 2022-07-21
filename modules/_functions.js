const { EmbedBuilder } = require('discord.js');
const { RecipleClient } = require('reciple');

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

    query = query.toLowerCase();

    docsData = docsData.filter(data => {
        if (data.name.toLowerCase().includes(query)) return true;
        if (Array.isArray(data?.sources) && data.sources.some(f => f.fileName.toLowerCase().includes(query))) return true;
        if (Array.isArray(data?.children) && data.children.some(d => d.name.toLowerCase().includes(query))) return true;
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

    return docsData;
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