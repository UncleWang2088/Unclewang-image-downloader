import {
    AdvancedNotificationOptions,
    tryCreateFancyNotification,
} from "../common";
import { notifications } from "./state";
import browser, { Downloads, Notifications } from "webextension-polyfill";

async function inspectDownload(
    notificationId: string,
    buttonIndex: number
): Promise<void> {
    const downloadId = notifications.get(notificationId);

    if (downloadId == null) {
        throw new Error(
            `missing download id for notification ${notificationId}`
        );
    }

    switch (buttonIndex) {
        case 0:
            return browser.downloads.open(downloadId);
        case 1:
            await browser.downloads.show(downloadId);
            break;
        default:
            throw new Error(`unknown button: ${buttonIndex}`);
    }
}

export function monitorNotifications(): void {
    browser.notifications.onButtonClicked.addListener((id, index) => {
        inspectDownload(id, index).catch(console.error);
    });
    browser.notifications.onClosed.addListener((id) =>
        notifications.delete(id)
    );
}

const iconUrl = "images/icon-128.png";

export async function notifyCompletion(
    downloadItem: Downloads.DownloadItem
): Promise<void> {
    const basicOptions: Notifications.CreateNotificationOptions = {
        iconUrl,
        message: downloadItem.filename,
        title: "Image downloaded",
        type: "basic",
    };

    const advancedOptions: AdvancedNotificationOptions = {
        buttons: [
            {
                title: "View image",
            },
            {
                title: "Open folder",
            },
        ],
        imageUrl: downloadItem.filename,
        type: "image",
    };

    const id = await tryCreateFancyNotification(basicOptions, advancedOptions);
    notifications.set(id, downloadItem.id);
}

export async function notifyNoImageForHotkey(): Promise<void> {
    await browser.notifications.create({
        iconUrl,
        message: "No image found under cursor.",
        title: "Hotkey activated",
        type: "basic",
    });
}

export async function notifyFailure(
    download: Downloads.DownloadItem
): Promise<void> {
    const { os } = await browser.runtime.getPlatformInfo();
    const separator = os === "win" ? "\\" : "";
    const filename = download.filename.slice(
        download.filename.lastIndexOf(separator) + 1
    );

    await browser.notifications.create({
        iconUrl: "images/error-128.png",
        message: `Reason: ${download.error}\nFile: ${filename}`,
        title: "Double-click download failed!",
        type: "basic",
    });
}
