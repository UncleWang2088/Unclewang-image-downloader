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
 * fetched the URL). Try fetching the image directly from the content
 * script context — this carries the page's session so an anti-hotlinking
 * site like huaban.com that checks cookies/Referer will serve it. Fall
 * back to canvas if that also fails.
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
    console.info("[王叔图片下载] 下载失败，尝试 fetch 兜底");
    const sourceUrl = image.currentSrc || image.src;
    try {
        let blob: Blob | null = null;
        // First try: fetch in the page context. credentials must be 'omit'
        // because most anti-hotlinking CDNs (e.g. huaban.com) return CORS
        // headers without 'Access-Control-Allow-Credentials: true' — using
        // 'include' would be rejected by the browser.
        try {
            const res = await fetch(sourceUrl, { credentials: "omit" });
            if (res.ok) {
                blob = await res.blob();
            }
        } catch (error) {
            // eslint-disable-next-line no-console
            console.info(
                "[王叔图片下载] fetch 兜底失败:",
                (error as Error).message
            );
        }
        // Fallback: canvas (works only when the image is not tainted, i.e.
        // the server served CORS headers; we still try in case the fetch
        // failed for a different reason)
        if (blob == null && image.naturalWidth > 0 && image.complete) {
            try {
                const canvas = document.createElement("canvas");
                canvas.width = image.naturalWidth;
                canvas.height = image.naturalHeight;
                const ctx = canvas.getContext("2d");
                if (ctx != null) {
                    ctx.drawImage(image, 0, 0);
                    blob = await new Promise<Blob | null>((resolve) => {
                        canvas.toBlob(resolve, "image/png");
                    });
                }
            } catch (error) {
                // eslint-disable-next-line no-console
                console.info(
                    "[王叔图片下载] canvas 兜底失败:",
                    (error as Error).message
                );
            }
        }
        if (blob == null) {
            // eslint-disable-next-line no-console
            console.info("[王叔图片下载] 兜底都失败，放弃");
            return;
        }
        const url = URL.createObjectURL(blob);
        const response = await browser.runtime
            .sendMessage(requestDownloadForUrl(url))
            .then(asMessage);
        // eslint-disable-next-line no-console
        console.info("[王叔图片下载] 兜底下载结果:", response.subject);
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error("[王叔图片下载] 兜底流程失败:", error);
    }
}
