import { AnyCommandResolvable, RecipleModuleData, RecipleModuleLoadData, RecipleModuleStartData, RecipleModuleUnloadData } from 'reciple';
import { AnyInteractionListener } from 'reciple-interaction-events';

export abstract class BaseModule implements RecipleModuleData {
    public versions: string  = '^7';
    public commands: AnyCommandResolvable[] = [];
    public devCommands: AnyCommandResolvable[] = [];
    public interactionListeners: AnyInteractionListener[] = [];

    public abstract onStart(data: RecipleModuleStartData): Promise<boolean|string>;

    public async onLoad(data: RecipleModuleLoadData): Promise<void|string> {}
    public async onUnload(data: RecipleModuleUnloadData): Promise<void|string> {}
}