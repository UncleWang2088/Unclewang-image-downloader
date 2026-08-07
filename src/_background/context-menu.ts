import { Settings, load, monitor, signal } from "../common";
import { startDownload } from "./downloads";
import { resetCounter } from "./state";
import { noop } from "ts-essentials";
import browser, { Menus, Tabs } from "webextension-polyfill";

const DOWNLOAD_IMAGE_ID = "doubleClickImageDownloader_DownloadImage";
const DOWNLOAD_SELECTED_IMAGES_ID =
    "doubleClickImageDownloader_DownloadImagesInSelection";
const RESET_COUNTER_ID = "doubleClickImageDownloader_ResetCounterVariable";

async function createContextMenu(
    options: Menus.CreateCreatePropertiesType
): Promise<void> {
    return new Promise((resolve, reject) => {
        browser.contextMenus.create(options, (): void => {
            if (browser.runtime.lastError == null) {
                resolve();
            } else {
                reject(new Error(browser.runtime.lastError.message));
            }
        });
    });
}

async function reactToMenuAction(
    contextMenuInfo: Menus.OnClickData,
    tab?: Tabs.Tab
): Promise<void> {
    if (tab == null) {
        throw new Error("clicked outside a tab?");
    }
    if (tab.id == null) {
        throw new Error("missing tab id?");
    }

    switch (contextMenuInfo.menuItemId) {
        case DOWNLOAD_IMAGE_ID: {
            if (contextMenuInfo.srcUrl == null) {
                throw new Error("missing src on image");
            }

            await startDownload(
                new URL(contextMenuInfo.srcUrl),
                tab,
                contextMenuInfo.frameId ?? null
            );

            return;
        }

        case DOWNLOAD_SELECTED_IMAGES_ID: {
            await browser.tabs.sendMessage(
                tab.id,
                signal("getImagesInSelection"),
                {
                    frameId: contextMenuInfo.frameId,
                }
            );

            return;
        }

        case RESET_COUNTER_ID: {
            const settings = await load();
            await resetCounter(settings);
            return;
        }

        default: {
            throw new Error(
                `received context menu ${contextMenuInfo.menuItemId} and tab ${tab.id}?`
            );
        }
    }
}

async function manageMenus(settings: Settings): Promise<void> {
    await browser.contextMenus.remove(DOWNLOAD_IMAGE_ID).catch(noop);
    await browser.contextMenus.remove(DOWNLOAD_SELECTED_IMAGES_ID).catch(noop);
    await browser.contextMenus.remove(RESET_COUNTER_ID).catch(noop);

    if (settings.enableImageContextMenu) {
        await createContextMenu({
            contexts: ["image"],
            documentUrlPatterns: ["*://*/*", "file:///*"],
            id: DOWNLOAD_IMAGE_ID,
            title: "Download image",
            type: "normal",
        });
    }

    if (settings.enableSelectionContextMenu) {
        await createContextMenu({
            contexts: ["selection"],
            documentUrlPatterns: ["*://*/*", "file:///*"],
            id: DOWNLOAD_SELECTED_IMAGES_ID,
            title: "Download images in selection",
            type: "normal",
        });
    }

    if (settings.enableRename && settings.enableResetCounterContextMenu) {
        await createContextMenu({
            contexts: ["image"],
            documentUrlPatterns: ["*://*/*", "file:///*"],
            id: RESET_COUNTER_ID,
            title: "Reset %counter% variable",
            type: "normal",
        });
    }
}

export function registerContextMenu(): void {
    browser.contextMenus.onClicked.addListener((clicked, tab) => {
        reactToMenuAction(clicked, tab).catch(console.error);
    });

    load().then(manageMenus).catch(console.error);

    monitor("enableImageContextMenu", (settings) => {
        manageMenus(settings).catch(console.error);
    });
    monitor("enableSelectionContextMenu", (settings) => {
        manageMenus(settings).catch(console.error);
    });
    monitor("enableResetCounterContextMenu", (settings) => {
        manageMenus(settings).catch(console.error);
    });
    monitor("enableRename", (settings) => {
        manageMenus(settings).catch(console.error);
    });
}
