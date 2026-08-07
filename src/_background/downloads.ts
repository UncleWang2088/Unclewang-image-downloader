import {
    SuggestionCallback,
    fileNamingSupport,
    finished,
    load,
    pushFolderHistory,
    renameFunctionally,
} from "../common";
import { notifyCompletion, notifyFailure } from "./notifications";
import { TabAndFrameId, downloads, tickCounter } from "./state";
import browser, { Downloads, Tabs } from "webextension-polyfill";

function indicateFinished(
    source: TabAndFrameId,
    delta: Downloads.OnChangedDownloadDeltaType
): void {
    const [tabId, frameId] = source;
    downloads.delete(delta.id);
    browser.tabs
        .sendMessage(tabId, finished(delta.id), {
            frameId: frameId ?? undefined,
        })
        .catch(console.error);
}

// extract the directory part of a download filename, if any
function folderOf(filename: string): string | null {
    const slash = Math.max(
        filename.lastIndexOf("/"),
        filename.lastIndexOf("\\")
    );
    return slash < 0 ? null : filename.substring(0, slash);
}

async function handleEndOfDownload(
    delta: Downloads.OnChangedDownloadDeltaType
): Promise<void> {
    const source = downloads.get(delta.id);
    if (source == null) {
        // not a download from this addon!
        return;
    }

    const state = delta.state?.current as Downloads.State | null;

    switch (state) {
        case "complete": {
            indicateFinished(source, delta);

            // remember where a save-as download actually landed so it becomes
            // the default option next time
            const [downloadItem] = await browser.downloads.search({
                id: delta.id,
            });
            if (downloadItem != null && source[2] == null) {
                const folder = folderOf(downloadItem.filename);
                if (folder != null) {
                    await pushFolderHistory(folder);
                }
            }

            const settings = await load();

            if (settings.notify) {
                return downloadItem == null
                    ? undefined
                    : notifyCompletion(downloadItem);
            }

            break;
        }
        case "interrupted": {
            const [download] = await browser.downloads.search({
                id: delta.id,
            });
            if (download == null || download.error === "USER_CANCELED") {
                indicateFinished(source, delta);
            } else {
                await notifyFailure(download);
            }

            break;
        }
        default:
        // ignore
    }
}

function determiningFilename(
    downloadItem: Downloads.DownloadItem,
    suggest: SuggestionCallback
): true | undefined {
    const downloadData = downloads.get(downloadItem.id);
    if (downloadData == null) {
        // not a download from this addon!
        return;
    }

    load()
        .then(async (settings) => {
            if (settings.enableRename) {
                const [tabId, , folder] = downloadData;
                const tab = await browser.tabs.get(tabId);
                // keep a user-chosen folder prefix out of the rename pattern
                const filePart =
                    folder != null && folder.length > 0
                        ? downloadItem.filename.substring(folder.length + 1)
                        : downloadItem.filename;
                const counter = await tickCounter(settings);
                const renamed = renameFunctionally(filePart, () => counter, {
                    imageUrl: new URL(downloadItem.url),
                    settings,
                    tab,
                });

                suggest({
                    conflictAction: settings.onFilenameConflict,
                    filename:
                        folder != null && folder.length > 0
                            ? `${folder}/${renamed}`
                            : renamed,
                });
            } else {
                suggest();
            }
        })
        .catch((error: Error) => {
            console.error(error);
            suggest();
        });

    return true;
}

function basenameFromUrl(url: URL): string {
    const segments = url.pathname.split("/").filter(Boolean);
    return segments.pop() ?? "image";
}

export async function startDownload(
    img: URL,
    tab: Tabs.Tab,
    frameId: number | null,
    options?: { folder?: string; saveAs?: boolean }
): Promise<number> {
    const settings = await load();
    const folder = options?.folder;
    const saveAs = options?.saveAs === true;
    const downloadId = await browser.downloads.download({
        conflictAction: settings.onFilenameConflict,
        url: img.href,
        // saveAs works most reliably when a filename is suggested; a plain
        // saveAs without filename is flaky in MV3 service workers
        ...(saveAs
            ? {
                  filename: `${basenameFromUrl(img)}`,
                  saveAs: true,
              }
            : {}),
        ...(folder != null && folder.length > 0
            ? { filename: `${folder}/${basenameFromUrl(img)}` }
            : {}),
    });

    if (tab.id == null) {
        throw new Error("tab without id?");
    }
    downloads.set(downloadId, [tab.id, frameId, folder]);

    return downloadId;
}

export function monitorDownloads(): void {
    fileNamingSupport()?.addListener(determiningFilename);
    browser.downloads.onChanged.addListener((delta) => {
        handleEndOfDownload(delta).catch(console.error);
    });
}
