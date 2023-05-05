import { RecipleClient, RecipleModule } from 'reciple';
import { BaseModule } from '../BaseModule.js';
import { Logger } from 'fallout-utility';

export class AntiCrash extends BaseModule {
    public logger?: Logger;

    public async onStart(client: RecipleClient<false>, module: RecipleModule): Promise<boolean> {
        this.logger = client.logger?.clone({ name: 'AntiCrash' });

        return true;
    }

    public async onLoad(client: RecipleClient<true>, module: RecipleModule): Promise<void> {
        client.on('error', err => this.logger?.error(err));
        client.on('shardError', err => this.logger?.error(err));
        client.on('debug', err => this.logger?.debug(err));
        client.on('warn', err => this.logger?.warn(err));

        process.on('uncaughtException', err => this.logger?.error(err));
        process.on('unhandledRejection', err => this.logger?.error(err));
        process.on('uncaughtExceptionMonitor', err => this.logger?.error(err));
    }
}

export default new AntiCrash();