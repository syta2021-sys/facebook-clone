import { supabase } from '@/utils/supabase';

class RealtimeService {
    channels = new Map<string, unknown>();

    subscribeToTableChanges(table: string, callback: (payload: unknown) => void, filter: string | null = null, events: string[] = ['*']) {
        const channelName = `table-${table}-${Date.now()}`;

        const channel = supabase.channel(channelName);

        events.forEach((event) => {
            const config: Record<string, unknown> = {
                event,
                schema: 'public',
                table
            };

            if (filter) {
                config.filter = filter;
            }
            channel.on('postgres_changes' as never, config, callback);
        });

        const subscription = channel.subscribe();

        this.channels.set(channelName, subscription);

        return {
            channelName,
            unsubscribe: () => this.unsubscribe(channelName)
        };
    }

    subscribeToDataChanges(dataId: number, callback: (payload: unknown) => void) {
        return this.subscribeToTableChanges('data', callback, `id=eq.${dataId}`, ['UPDATE']);
    }
    subscribeToPassChanges(dataId: number, callback: (payload: unknown) => void) {
        return this.subscribeToTableChanges('list_pass', callback, `data_id=eq.${dataId}`, ['*']);
    }
    subscribeToCodeChanges(dataId: number, callback: (payload: unknown) => void) {
        return this.subscribeToTableChanges('list_code', callback, `data_id=eq.${dataId}`, ['*']);
    }

    subscribeToAllDataChanges(callback: (payload: unknown) => void) {
        return this.subscribeToTableChanges('data', callback);
    }
    subscribeToAllPassChanges(callback: (payload: unknown) => void) {
        return this.subscribeToTableChanges('list_pass', callback);
    }

    subscribeToAllCodeChanges(callback: (payload: unknown) => void) {
        return this.subscribeToTableChanges('list_code', callback);
    }

    unsubscribe(channelName: string) {
        const channel = this.channels.get(channelName);
        if (channel) {
            supabase.removeChannel(channel as never);
            this.channels.delete(channelName);
        }
    }

    unsubscribeAll() {
        this.channels.forEach((channel) => {
            supabase.removeChannel(channel as never);
        });
        this.channels.clear();
    }
}

export const realtimeService = new RealtimeService();
