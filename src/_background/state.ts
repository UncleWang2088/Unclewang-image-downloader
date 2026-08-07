import type { Settings } from "../common";
import browser from "webextension-polyfill";

export type TabAndFrameId = [number, number | null, string | undefined];

// download -> [tab, frame, folder]
export const downloads = new Map<number, TabAndFrameId>();
// notification -> download
export const notifications = new Map<string, number>();

// the counter survives service-worker sleeps via storage
const COUNTER_KEY = "renameCounter";

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
