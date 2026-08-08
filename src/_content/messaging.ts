import { Message, TriggeredMessage, asMessage, load } from "../common";
import { completeDownload, downloadImage } from "./downloads";
import { downloadHoveredImage } from "./hotkey";
import { getImagesInSelection } from "./selection";
import browser from "webextension-polyfill";

async function reactToMessage(
    msg: Message
): Promise<TriggeredMessage | undefined> {
    switch (msg.subject) {
        case "downloadStarted":
            throw new Error(
                "download start message should have been handled inline"
            );

        case "getImagesInSelection": {
            // 走 downloadImage 统一入口，否则会绕过"下载前询问保存位置"
            const settings = await load();
            const images = getImagesInSelection();

            if (settings.askWhereToSave) {
                // 需要弹目录选择器时逐个确认，避免多个弹窗互相重叠
                for (const image of images) {
                    await downloadImage(image, settings);
                }
            } else {
                await Promise.all(
                    images.map((image) => downloadImage(image, settings))
                );
            }
            return;
        }

        case "downloadFinished":
            completeDownload(msg);
            return;

        case "downloadRequested":
            throw new Error(
                "content script should not receive download request"
            );

        case "hotkeyTriggered":
            return downloadHoveredImage();

        default:
            throw new Error(`unrecognized message: ${JSON.stringify(msg)}`);
    }
}

export function listenForMessages(): void {
    browser.runtime.onMessage.addListener(async (data: unknown) =>
        reactToMessage(asMessage(data)).catch(console.error)
    );
}
