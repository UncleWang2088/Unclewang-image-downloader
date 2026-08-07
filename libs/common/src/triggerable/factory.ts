import { Action, Triggerable } from "./types";

export function makeTriggerable<T = undefined>(): Triggerable<T> {
    const actions = new Map<symbol, Action<T>>();

    return {
        expose: {
            subscribe: (action, description) => {
                const key = Symbol(description);
                actions.set(key, action);
                return key;
            },
            unsubscribe: (key) => actions.delete(key),
        },
        hide: {
            hasSubscribers: () => actions.size > 0,
            trigger: (data) => actions.forEach((action) => action(data)),
        },
    };
}
