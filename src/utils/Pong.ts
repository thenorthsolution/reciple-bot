import { RecipleClient, RecipleModule, SlashCommandBuilder } from 'reciple';
import { BaseModule } from '../BaseModule.js';
import { codeBlock } from 'discord.js';
import ms from 'ms';

export class Pong extends BaseModule {
    public async onStart(client: RecipleClient, module: RecipleModule): Promise<boolean> {
        this.commands = [
            new SlashCommandBuilder()
                .setName('ping')
                .setDescription('Get bot pong')
                .setDMPermission(true)
                .setExecute(async ({ interaction }) => {
                    let wsLatency = client.ws.ping;
                    let restLatency = 0;

                    const defer = await interaction.deferReply({ ephemeral: true });

                    restLatency = Date.now() - defer.createdTimestamp;

                    await interaction.editReply({
                        content: `🏓 **Pong**\n${codeBlock('yml', 'websocket: ' + ms(wsLatency, { long: true }) + '\nrest: ' + ms(restLatency, { long: true }))}`
                    });
                })
        ];

        return true;
    }
}

export default new Pong();