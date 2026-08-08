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
        const result = (await browser.storage.local.get(
            DOWNLOADS_KEY
        )) as Record<string, unknown>;
        const stored = result[DOWNLOADS_KEY];
        return typeof stored == "object" && stored != null
            ? (stored as Record<string, unknown>)
            : {};
    } catch {
        return {};
    }
}

async function writeRegistry(registry: Record<string, unknown>): Promise<void> {
    try {
        await browser.storage.local.set({ [DOWNLOADS_KEY]: registry });
        // eslint-disable-next-line no-console
        console.info(
            `[王叔图片下载] 注册表已写入: ${JSON.stringify(registry)}`
        );
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error("[王叔图片下载] 注册表写入失败:", error);
    }
}

/** Remember a download so completion can be attributed after a SW sleep. */
export async function registerDownload(
    id: number,
    source: TabAndFrameId
): Promise<void> {
    downloads.set(id, source);
    const registry = await readRegistry();
    // normalize undefined folder to null so the array is JSON-serializable
    registry[id] = source.map((part) => part ?? null);
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
        const [tabId, frameId, folder] = stored as [
            number,
            number | null,
            string | null
        ];
        const source: TabAndFrameId = [
            tabId,
            frameId,
            folder == null ? undefined : folder,
        ];
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
