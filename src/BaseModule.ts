import { AnyCommandBuilder, AnyCommandData, RecipleClient, RecipleModule, RecipleModuleScript, RecipleModuleScriptUnloadData } from 'reciple';
import { AnyInteractionListener } from 'reciple-interaction-events';

export abstract class BaseModule implements RecipleModuleScript {
    public versions: string  = '^7';
    public commands: (AnyCommandBuilder | AnyCommandData)[] = [];
    public devCommands: (AnyCommandBuilder | AnyCommandData)[] = [];
    public interactionListeners: AnyInteractionListener[] = [];

    public abstract onStart(client: RecipleClient<false>, module: RecipleModule): Promise<boolean>;

    public async onLoad(client: RecipleClient<true>, module: RecipleModule): Promise<void> {}
    public async onUnload(unloadData: RecipleModuleScriptUnloadData): Promise<void> {}
}