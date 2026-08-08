import {
    SuggestionCallback,
    fileNamingSupport,
    finished,
    getDefaultDownloadDir,
    load,
    pushFolderHistory,
    relativizeFolder,
    renameFunctionally,
} from "../common";
import { notifyCompletion, notifyFailure } from "./notifications";
import {
    TabAndFrameId,
    getDownload,
    registerDownload,
    tickCounter,
    unregisterDownload,
} from "./state";
import browser, { Downloads, Tabs } from "webextension-polyfill";

function indicateFinished(
    source: TabAndFrameId,
    delta: Downloads.OnChangedDownloadDeltaType
): void {
    const [tabId, frameId] = source;
    void unregisterDownload(delta.id);
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
    // survives service-worker sleeps via the persisted registry
    const source = await getDownload(delta.id);
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
            // eslint-disable-next-line no-console
            console.info(
                "[王叔图片下载] 下载完成 | id:",
                delta.id,
                "| filename:",
                downloadItem?.filename,
                "| source[2]:",
                source[2]
            );
            if (downloadItem != null && source[2] == null) {
                const folder = folderOf(downloadItem.filename);
                // eslint-disable-next-line no-console
                console.info("[王叔图片下载] 提取目录:", folder);
                if (folder != null) {
                    // remember as a relative path when possible so the next
                    // download goes straight there without the save-as dialog;
                    // the default download dir itself is not worth remembering.
                    // pass the probe function explicitly: the default query
                    // sends a message that would loop back to this SW
                    const relative = await relativizeFolder(
                        folder,
                        getDefaultDownloadDir
                    );
                    // eslint-disable-next-line no-console
                    console.info("[王叔图片下载] 相对化:", relative);
                    if (relative.length > 0) {
                        await pushFolderHistory(relative);
                        // eslint-disable-next-line no-console
                        console.info("[王叔图片下载] 已记录历史:", relative);
                    }
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
    getDownload(downloadItem.id)
        .then((downloadData) => {
            if (downloadData == null) {
                // not a download from this addon!
                suggest();
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
                                ? downloadItem.filename.substring(
                                      folder.length + 1
                                  )
                                : downloadItem.filename;
                        const counter = await tickCounter(settings);
                        const renamed = renameFunctionally(
                            filePart,
                            () => counter,
                            {
                                imageUrl: new URL(downloadItem.url),
                                settings,
                                tab,
                            }
                        );

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
        })
        .catch(console.error);

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
    await registerDownload(downloadId, [tab.id, frameId, folder]);

    return downloadId;
}

export function monitorDownloads(): void {
    fileNamingSupport()?.addListener(determiningFilename);
    browser.downloads.onChanged.addListener((delta) => {
        handleEndOfDownload(delta).catch(console.error);
    });
}
