export type Action<T> = (data: T) => void;

export interface Triggerable<T> {
    expose: {
        unsubscribe: (key: symbol) => void;
        subscribe: (action: Action<T>, description: string) => symbol;
    };
    hide: {
        hasSubscribers: () => boolean;
        trigger: (data: T) => void;
    };
}
