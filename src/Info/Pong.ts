import { SlashCommandBuilder } from 'reciple';
import { BaseModule } from '../BaseModule.js';
import Utility from '../Utils/Utility.js';
import { codeBlock } from 'discord.js';
import ms from 'ms';

export class Pong extends BaseModule {
    public async onStart(): Promise<boolean> {
        this.commands = [
            new SlashCommandBuilder()
                .setName('ping')
                .setDescription('Get bot pong')
                .setDMPermission(true)
                .setExecute(async ({ interaction, client }) => {
                    let wsLatency = client.ws.ping;
                    let restLatency = 0;

                    const reply = await interaction.reply({ content: Utility.createLabel('Pinging...', '🏓'), ephemeral: true });

                    restLatency = Date.now() - reply.createdTimestamp;

                    await interaction.editReply({
                        content: `🏓 **Pong**\n${codeBlock('yml', 'websocket: ' + ms(wsLatency, { long: true }) + '\nREST: ' + ms(restLatency, { long: true }))}`
                    });
                })
        ];

        return true;
    }
}

export default new Pong();