import {
    rigContextMenu,
    rigGeneral,
    rigHoverButton,
    rigNiche,
    rigRenaming,
    rigRestrictions,
    rigSaveLocation,
} from "./_options";
import { load } from "./common";
import browser from "webextension-polyfill";

const versionDisplay = document.getElementById("extensionVersion");
if (versionDisplay != null) {
    versionDisplay.textContent = `版本 v${
        browser.runtime.getManifest().version
    }`;
}

load()
    .then((settings) => {
        rigGeneral(settings);
        rigContextMenu(settings);
        rigRestrictions(settings);
        rigHoverButton(settings);
        rigRenaming(settings);
        rigSaveLocation(settings);
        rigNiche(settings);
    })
    .catch(console.error);
