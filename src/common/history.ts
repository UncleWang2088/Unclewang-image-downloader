import browser from "webextension-polyfill";

const HISTORY_KEY = "did:folder-history";
export const MAX_HISTORY = 5;

export async function readFolderHistory(): Promise<string[]> {
    try {
        const result = (await browser.storage.local.get(HISTORY_KEY)) as Record<
            string,
            unknown
        >;
        const value = result[HISTORY_KEY];
        return Array.isArray(value)
            ? value.filter((entry): entry is string => typeof entry == "string")
            : [];
    } catch {
        return [];
    }
}

/** Inserts a folder at the front of the history, deduped, capped. */
export async function pushFolderHistory(folder: string): Promise<void> {
    if (folder.length === 0) {
        return;
    }
    const history = await readFolderHistory();
    const next = [folder, ...history.filter((entry) => entry !== folder)].slice(
        0,
        MAX_HISTORY
    );
    try {
        await browser.storage.local.set({ [HISTORY_KEY]: next });
    } catch {
        // non-fatal
    }
}
