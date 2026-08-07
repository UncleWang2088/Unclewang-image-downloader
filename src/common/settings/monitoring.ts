import { Settings, isSetting } from "./io";
import { load } from "./settings";
import browser, { Storage } from "webextension-polyfill";

type SettingListener = (settings: Settings) => void;
const callbacks = new Map<keyof Settings, SettingListener[]>();

async function triggerListeners(changes: (keyof Settings)[]): Promise<void> {
    const settings = await load();

    const cbs = changes
        .flatMap((property) => callbacks.get(property) ?? [])
        .map((cb) => cb(settings));

    await Promise.all(cbs);
}

function getOrSet<K, V>(map: Map<K, V>, key: K, fallback: V): V {
    const existing = map.get(key);
    if (existing == null) {
        map.set(key, fallback);
        return fallback;
    } else {
        return existing;
    }
}

export function monitor(
    setting: keyof Settings,
    listener: SettingListener
): void {
    getOrSet(callbacks, setting, []).push(listener);
}

async function inspectChanges(
    changes: Record<string, Storage.StorageChange | undefined>,
    area: string
): Promise<void> {
    if (area === "sync") {
        const keys = Object.keys(changes).flatMap((key) =>
            isSetting(key) ? [key] : []
        );
        await triggerListeners(keys);
    }
}

export function monitorStorage(): void {
    browser.storage.onChanged.addListener((changes, area) => {
        inspectChanges(changes, area).catch(console.error);
    });
}
