const { InteractionType } = require("discord.js");
const { RecipleScript, InteractionCommandBuilder } = require("reciple");
const { searchDocs, resultsEmbed, getInfoEmbed } = require('./_functions');

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

                interaction.reply({ embeds: [data.length == 1 ? getInfoEmbed(data[0], command.client) : resultsEmbed(data, command.client)] });
            })
    ],
    onStart(client) {
        client.on('interactionCreate', async interaction => {
            if (interaction.type !== InteractionType.ApplicationCommandAutocomplete || interaction.commandName !== 'docs') return;

            const query = interaction.options.getFocused();
            const data = searchDocs(query).slice(0, 15);
            
            interaction.respond(data.map(d => ({
                name: d.name,
                value: `+${d.name}`
            }))).catch(() => {});
        });

        return true;
    }
};

module.exports = script;