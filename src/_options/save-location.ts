import { Settings, write } from "../common";
import type { Writable } from "type-fest";

const askWhereToSave = document.getElementById(
    "askWhereToSave"
) as HTMLInputElement;
const quickFolders = document.getElementById(
    "quickFolders"
) as HTMLTextAreaElement;

function rigAskWhereToSave(settings: Settings): void {
    askWhereToSave.checked = settings.askWhereToSave;

    askWhereToSave.addEventListener("change", () => {
        const update: Partial<Writable<Settings>> = {
            askWhereToSave: askWhereToSave.checked,
        };
        write(update).catch(console.error);
    });
}

function rigQuickFolders(settings: Settings): void {
    quickFolders.value = settings.quickFolders.join("\n");

    quickFolders.addEventListener("change", () => {
        const folders = quickFolders.value
            .split("\n")
            .map((line) => line.trim())
            .filter((line) => line.length > 0);

        write({ quickFolders: folders }).catch(console.error);
    });
}

export function rigSaveLocation(settings: Settings): void {
    rigAskWhereToSave(settings);
    rigQuickFolders(settings);
}
