import {
    DefaultDirMessage,
    DownloadChangedMessage,
    Message,
    asMessage,
    defaultDirMessage,
    getDefaultDownloadDir,
    started,
} from "../common";
import { startDownload } from "./downloads";
import browser, { Runtime } from "webextension-polyfill";

async function reactToMessage(
    msg: Message,
    sender: Runtime.MessageSender
): Promise<DefaultDirMessage | DownloadChangedMessage> {
    switch (msg.subject) {
        case "getDefaultDownloadDir":
            return defaultDirMessage(await getDefaultDownloadDir());

        case "downloadRequested": {
            if (sender.tab == null) {
                throw new Error("starting a download headlessly?");
            }
            // eslint-disable-next-line no-console
            console.info(
                `[王叔图片下载 v${
                    browser.runtime.getManifest().version
                }] background 收到下载请求 | folder =`,
                msg.folder,
                "| saveAs =",
                msg.saveAs,
                "| url =",
                msg.imageUrl.slice(0, 80)
            );
            const downloadId = await startDownload(
                new URL(msg.imageUrl),
                sender.tab,
                sender.frameId ?? null,
                {
                    ...(msg.folder == null ? {} : { folder: msg.folder }),
                    ...(msg.saveAs === true ? { saveAs: true } : {}),
                }
            );
            return started(downloadId);
        }
        default:
            throw new Error(`unknown message: ${JSON.stringify(msg)}`);
    }
}

export function listenForMessages(): void {
    browser.runtime.onMessage.addListener(async (data: unknown, sender) =>
        reactToMessage(asMessage(data), sender)
    );
}
