import browser from "webextension-polyfill";

const DEFAULT_DIR_KEY = "did:default-download-dir";

export function isAbsolutePath(folder: string): boolean {
    return /^[a-zA-Z]:[\\/]/u.test(folder) || folder.startsWith("/");
}

function normalizeSlashes(path: string): string {
    return path.replace(/\\/gu, "/");
}

// extract the directory part of a filename
function folderOf(filename: string): string | null {
    const slash = Math.max(
        filename.lastIndexOf("/"),
        filename.lastIndexOf("\\")
    );
    return slash < 0 ? null : filename.substring(0, slash);
}

async function readCached(): Promise<string | null> {
    try {
        const cached = (await browser.storage.local.get(
            DEFAULT_DIR_KEY
        )) as Record<string, unknown>;
        const value = cached[DEFAULT_DIR_KEY];
        return typeof value == "string" ? normalizeSlashes(value) : null;
    } catch {
        return null;
    }
}

/**
 * Probes the browser's default download folder. Only callable from the
 * background context (downloads API); caches the result in storage.local.
 * Returns null when it cannot be determined.
 */
export async function getDefaultDownloadDir(): Promise<string | null> {
    const cached = await readCached();
    if (cached != null) {
        return cached;
    }

    try {
        // probe with a tiny throwaway download to learn where files land
        const id = await browser.downloads.download({
            filename: "__wangshu_probe__.txt",
            saveAs: false,
            url: "data:text/plain,probe",
        });
        const [item] = await browser.downloads.search({ id });
        if (item == null) {
            return null;
        }
        const dir = folderOf(item.filename);
        if (dir == null) {
            return null;
        }
        const normalized = normalizeSlashes(dir);
        await browser.storage.local
            .set({ [DEFAULT_DIR_KEY]: normalized })
            .catch(() => undefined);
        return normalized;
    } catch {
        return null;
    }
}

type DirQuery = () => Promise<string | null>;

/**
 * Turns a folder that may be an absolute path into a relative one when it
 * lives inside the default download dir, so downloads can go straight there
 * without popping the OS save-as dialog. Returns the input unchanged if it
 * is already relative or outside the default dir.
 */
export async function relativizeFolder(
    folder: string,
    queryDefaultDir: DirQuery = async () => {
        // content scripts have no downloads API; ask the background instead
        const response = (await browser.runtime.sendMessage({
            subject: "getDefaultDownloadDir",
        })) as { dir: string | null } | undefined;
        return response?.dir ?? null;
    }
): Promise<string> {
    if (folder.length === 0 || !isAbsolutePath(folder)) {
        return folder;
    }
    const defaultDir = await queryDefaultDir();
    if (defaultDir == null) {
        return folder;
    }
    const normalizedFolder = normalizeSlashes(folder);
    // exactly the default download dir itself → empty (default) is fine
    if (normalizedFolder === defaultDir) {
        return "";
    }
    if (normalizedFolder.startsWith(`${defaultDir}/`)) {
        const relative = normalizedFolder.substring(defaultDir.length + 1);
        return relative.length > 0 ? relative : "";
    }
    return folder;
}
