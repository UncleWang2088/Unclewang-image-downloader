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

function requestDownloadForUrl(
    url: string
): ReturnType<typeof requestDownload> {
    const img = new Image();
    img.src = url;
    return requestDownload(img);
}

/**
 * A download failed (e.g. huaban's auth_key expired by the time the browser
 * fetched the URL). The browser already decoded the image though - draw it
 * onto a canvas and download the resulting blob instead, bypassing the
 * network entirely.
 */
export async function retryViaCanvas(
    message: DownloadChangedMessage
): Promise<void> {
    const image = downloadingImages.get(message.downloadId);
    if (image == null) {
        return;
    }
    image.classList.remove(activeClass);
    downloadingImages.delete(message.downloadId);
    // eslint-disable-next-line no-console
    console.info("[王叔图片下载] 下载失败，尝试 canvas 兜底");
    try {
        if (image.naturalWidth === 0 || !image.complete) {
            // eslint-disable-next-line no-console
            console.info("[王叔图片下载] 图片未完全加载，无法 canvas 兜底");
            return;
        }
        const canvas = document.createElement("canvas");
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (ctx == null) {
            return;
        }
        ctx.drawImage(image, 0, 0);
        const blob = await new Promise<Blob | null>((resolve) => {
            canvas.toBlob(resolve, "image/png");
        });
        if (blob == null) {
            return;
        }
        const url = URL.createObjectURL(blob);
        const response = await browser.runtime
            .sendMessage(requestDownloadForUrl(url))
            .then(asMessage);
        // eslint-disable-next-line no-console
        console.info("[王叔图片下载] canvas 兜底下载结果:", response.subject);
        // revoke once the download has started
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error("[王叔图片下载] canvas 兜底失败:", error);
    }
}
