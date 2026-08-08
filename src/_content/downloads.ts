import {
    DownloadChangedMessage,
    Settings,
    asMessage,
    load,
    pushFolderHistory,
    requestDownload,
} from "../common";
import { type PickerChoice, showDownloadPicker } from "./picker";
import browser from "webextension-polyfill";

const activeClass = "doubleclick-image-downloader-active";
const downloadingImages = new Map<number, HTMLImageElement>();

function markAsDownloading(
    image: HTMLImageElement,
    message: DownloadChangedMessage
): void {
    image.classList.add(activeClass);
    downloadingImages.set(message.downloadId, image);
}

async function startDownload(
    image: HTMLImageElement,
    choice?: PickerChoice
): Promise<void> {
    const sendMessage = browser.runtime
        .sendMessage(requestDownload(image, choice))
        .then(asMessage);

    const [response, settings] = await Promise.all([sendMessage, load()]);

    if (response.subject === "downloadStarted") {
        if (settings.greyOut) {
            markAsDownloading(image, response);
        }
    } else {
        throw new Error(`unexpected response ${JSON.stringify(response)}`);
    }
}

/**
 * Downloads an image through the folder picker when the setting is enabled,
 * or directly when it is not. Every download entry point should go through
 * this so no path can bypass the "ask where to save" flow.
 */
export async function downloadImage(
    image: HTMLImageElement,
    settings: Settings
): Promise<void> {
    // eslint-disable-next-line no-console
    console.info(
        "[王叔图片下载] downloadImage 被调用 | askWhereToSave =",
        settings.askWhereToSave,
        "| 图片 =",
        image.src.slice(0, 80)
    );
    if (settings.askWhereToSave) {
        const choice = await showDownloadPicker(image, settings);
        // eslint-disable-next-line no-console
        console.info("[王叔图片下载] 弹窗结果 =", JSON.stringify(choice));
        if (choice == null) {
            // user cancelled
            return;
        }
        if ("folder" in choice && choice.folder != null) {
            // remember the chosen folder so it becomes the default next time
            await pushFolderHistory(choice.folder);
        }
        await startDownload(image, choice);
    } else {
        await startDownload(image);
    }
}

export function completeDownload(message: DownloadChangedMessage): void {
    const image = downloadingImages.get(message.downloadId);
    if (image == null) {
        throw new Error(`unmatched image for download ${message.downloadId}`);
    }

    image.classList.remove(activeClass);
    downloadingImages.delete(message.downloadId);
}
