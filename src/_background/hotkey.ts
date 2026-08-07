import { asMessage, signal } from "../common";
import { notifyNoImageForHotkey } from "./notifications";
import browser from "webextension-polyfill";

async function downloadFocusedImage(): Promise<void> {
    const [tab] = await browser.tabs.query({
        active: true,
        currentWindow: true,
    });
    if (tab?.id == null) {
        throw new Error("missing tab id");
    }

    const response = await browser.tabs
        .sendMessage(tab.id, signal("hotkeyTriggered"))
        .then(asMessage);

    if (response.subject !== "afterHotkeyTriggered") {
        throw new Error(`unexpected response ${JSON.stringify(response)}`);
    }

    if (!response.imageFound) {
        await notifyNoImageForHotkey();
    }
}

export function monitorHotkey(): void {
    browser.commands.onCommand.addListener((command) => {
        switch (command) {
            case "download-focused":
                downloadFocusedImage().catch(console.error);
                break;
            default:
                throw new Error(`unknown hotkey command: ${command}`);
        }
    });
}
