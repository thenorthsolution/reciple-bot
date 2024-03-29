import { SlashCommandBuilder } from 'reciple';
import { BaseModule } from '../BaseModule.js';
import { ButtonBuilder, ButtonStyle, ComponentType } from 'discord.js';

export class Invite extends BaseModule {
    public async onStart(): Promise<boolean> {
        this.commands = [
            new SlashCommandBuilder()
                .setName('invite')
                .setDescription('Get invite for Reciple.js bot')
                .setDMPermission(true)
                .setExecute(async ({ interaction, client }) => {
                    await interaction.reply({
                        components: [
                            {
                                type: ComponentType.ActionRow,
                                components: [
                                    new ButtonBuilder()
                                        .setLabel('Invite Bot')
                                        .setStyle(ButtonStyle.Link)
                                        .setURL(`https://discord.com/api/oauth2/authorize?client_id=${client.user?.id}&permissions=0&scope=applications.commands`),
                                    new ButtonBuilder()
                                        .setLabel('Support Server')
                                        .setStyle(ButtonStyle.Link)
                                        .setURL(`https://discord.gg/kajdev-1032785824686817291`)
                                ]
                            }
                        ],
                        ephemeral: true
                    });
                })
        ];

        return true;
    }
}

export default new Invite();