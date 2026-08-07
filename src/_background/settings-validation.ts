import { validate } from "../common";
import browser, { Runtime } from "webextension-polyfill";

async function showOptions(
    details: Runtime.OnInstalledDetailsType
): Promise<void> {
    if (details.reason === "install" || details.reason === "update") {
        const valid = await validate();
        return valid ? undefined : browser.runtime.openOptionsPage();
    }
}

export function fixSettingsOnUpdate(): void {
    browser.runtime.onInstalled.addListener((details) => {
        showOptions(details).catch(console.error);
    });
}
