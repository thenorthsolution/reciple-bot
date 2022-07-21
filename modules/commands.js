const { RecipleScript, InteractionCommandBuilder } = require("reciple");
const { searchDocs, resultsEmbed } = require('./_functions');

/**
 * @type {RecipleScript}
 */
const script = {
    versions: '3.0.x',
    commands: [
        new InteractionCommandBuilder()
            .setName('docs')
            .setDescription('Query Reciple docs.')
            .addStringOption(query => query
                .setName('query')
                .setDescription('Search docs.')
                .setRequired(true)
                .setAutocomplete(true)    
            )
            .setExecute(async command => {
                const interaction = command.interaction;
                const query = interaction.options.getString('query', true);
                const data = searchDocs(query);

                interaction.reply({ embeds: [resultsEmbed(data, command.client)] });
            })
    ],
    onStart() { return true; }
};

module.exports = script;