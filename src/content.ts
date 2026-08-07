import {
    armHoverButton,
    listenForMessages,
    monitorClicks,
    monitorDrags,
    trackCursor,
    trackHovers,
} from "./_content";
import { load, monitorStorage, write } from "./common";
import browser from "webextension-polyfill";

load()
    .then(async (settings) => {
        const { version } = browser.runtime.getManifest();
        // the folder picker is the whole point of this build: force it on
        // even if a previous session stored the switch as off
        if (!settings.askWhereToSave) {
            await write({ askWhereToSave: true });
        }
        // eslint-disable-next-line no-console
        console.info(
            `[王叔图片下载 v${version}] content script 已加载 | askWhereToSave =`,
            settings.askWhereToSave,
            "| quickFolders =",
            settings.quickFolders
        );
        monitorClicks(settings);
        armHoverButton(settings);
        monitorDrags(settings);
        trackCursor(settings);

        trackHovers();
        listenForMessages();
        monitorStorage();
    })
    .catch(console.error);
