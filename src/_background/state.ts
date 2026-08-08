import type { Settings } from "../common";
import browser from "webextension-polyfill";

export type TabAndFrameId = [number, number | null, string | undefined];

const DOWNLOADS_KEY = "did:active-downloads";
const COUNTER_KEY = "renameCounter";

// in-memory mirror of the persisted download registry; survives nothing
const downloads = new Map<number, TabAndFrameId>();
// notification -> download
export const notifications = new Map<string, number>();

// the registry must survive service-worker sleeps, so it is persisted too
async function readRegistry(): Promise<Record<string, unknown>> {
    try {
        return (await browser.storage.local.get(DOWNLOADS_KEY))[
            DOWNLOADS_KEY
        ] as Record<string, unknown>;
    } catch {
        return {};
    }
}

async function writeRegistry(registry: Record<string, unknown>): Promise<void> {
    try {
        await browser.storage.local.set({ [DOWNLOADS_KEY]: registry });
    } catch {
        // non-fatal
    }
}

/** Remember a download so completion can be attributed after a SW sleep. */
export async function registerDownload(
    id: number,
    source: TabAndFrameId
): Promise<void> {
    downloads.set(id, source);
    const registry = await readRegistry();
    registry[id] = source;
    await writeRegistry(registry);
}

/** Look up a download; checks memory first, then persisted storage. */
export async function getDownload(id: number): Promise<TabAndFrameId | null> {
    const cached = downloads.get(id);
    if (cached != null) {
        return cached;
    }
    const registry = await readRegistry();
    const stored = registry[id];
    if (Array.isArray(stored)) {
        const source = stored as TabAndFrameId;
        downloads.set(id, source);
        return source;
    }
    return null;
}

/** Forget a download once handled. */
export async function unregisterDownload(id: number): Promise<void> {
    downloads.delete(id);
    const registry = await readRegistry();
    const next: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(registry)) {
        if (key !== String(id)) {
            next[key] = value;
        }
    }
    await writeRegistry(next);
}

// the counter survives service-worker sleeps via storage
export async function tickCounter(settings: Settings): Promise<number> {
    const stored = await browser.storage.local.get(COUNTER_KEY);
    const previous = stored[COUNTER_KEY] as number | undefined;

    const next =
        typeof previous == "number" && !isNaN(previous)
            ? previous + settings.counterStep
            : settings.counterStart;

    await browser.storage.local.set({ [COUNTER_KEY]: next });
    return next;
}

export async function resetCounter(settings: Settings): Promise<void> {
    await browser.storage.local.set({
        [COUNTER_KEY]: settings.counterStart - settings.counterStep,
    });
}
