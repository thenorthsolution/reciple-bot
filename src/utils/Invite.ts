import { RecipleClient, RecipleModule, SlashCommandBuilder } from 'reciple';
import { BaseModule } from '../BaseModule.js';
import { ButtonBuilder, ButtonStyle, ComponentType } from 'discord.js';

export class Invite extends BaseModule {
    public async onStart(client: RecipleClient<false>, module: RecipleModule): Promise<boolean> {
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
                                        .setLabel('Invite')
                                        .setStyle(ButtonStyle.Link)
                                        .setURL(`https://discord.com/api/oauth2/authorize?client_id=${client.user?.id}&permissions=0&scope=applications.commands`)
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