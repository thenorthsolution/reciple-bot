const { ButtonPagination, ComponentButtonBuilder, PaginationButtonType, OnDisableAction } = require("@ghextercortes/djs-pagination");
const { InteractionType, ButtonBuilder, ButtonStyle } = require("discord.js");
const { RecipleScript, InteractionCommandBuilder, RecipleHaltedCommandReason, botHasExecutePermissions } = require("reciple");
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
            .setRequiredBotPermissions('ViewChannel', 'UseExternalEmojis')
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
                const pages = !data.length ? [] : data.length == 1 ? getInfoEmbed(data[0], command.client) : resultsEmbed(data, command.client);
                
                if (!pages.length) return interaction.reply('No results found');

                const pagination = new ButtonPagination({
                    buttons:
                        interaction.channel.permissionsFor(interaction.guild.members.me).has(command.builder.requiredBotPermissions) ?
                            new ComponentButtonBuilder()
                                .addButton(new ButtonBuilder().setLabel('Previous').setCustomId('prev').setStyle(ButtonStyle.Secondary), PaginationButtonType.PreviousPage)
                                .addButton(new ButtonBuilder().setLabel('Next').setCustomId('next').setStyle(ButtonStyle.Secondary), PaginationButtonType.NextPage)
                        : undefined,
                    onDisable: OnDisableAction.DeleteComponents,
                    singlePageNoButtons: true,
                    pages: pages
                });
                
                pagination.paginate(interaction).catch(err => command.client.logger.err(err));
            })
            .setHalt(async halt => {
                if (halt.reason == RecipleHaltedCommandReason.MissingBotPermissions) {
                    halt.executeData.interaction.reply('Not enought bot permissions').catch(() => {});
                    return true;
                }
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