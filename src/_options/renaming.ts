import {
    FilenameVariables,
    Settings,
    fileNamingSupport,
    renameTechnically,
    write,
} from "../common";
import type { Writable } from "type-fest";

const TUMBLR_PAGE = new URL("https://photo-blog.tumblr.com/posts/1");
const TUMBLR_TITLE = "My photo album";
const IMGUR_FILENAME = "jean-doe.jpg";
const IMGUR_SRC = new URL(`https://cdn.imgur.com/avatars/${IMGUR_FILENAME}`);

const REDDIT_PAGE = new URL("https://reddit.com/r/browser_addons");
const REDDIT_TITLE = "WebExtensions are awesome!";
const GIPHY_FILENAME = "haha-yes.png";
const GIPHY_SRC = new URL(`https://giphy.com/reactions/${GIPHY_FILENAME}`);

const counterPadding = document.getElementById(
    "counterPadding"
) as HTMLInputElement;
const counterStart = document.getElementById(
    "counterStart"
) as HTMLInputElement;
const counterStep = document.getElementById("counterStep") as HTMLInputElement;
const enableFileRename = document.getElementById(
    "enableRename"
) as HTMLInputElement;
const filenamePattern = document.getElementById(
    "fileNamePattern"
) as HTMLInputElement;
const filenamePatternPreview1 = document.getElementById(
    "previewFileNamePattern1"
)!;
const filenamePatternPreview2 = document.getElementById(
    "previewFileNamePattern2"
)!;
const notSupported = document.getElementById("renamingSettingsNotSupported")!;
const renamingSettings = document.getElementById("renamingSettings")!;

function renderPatternPreview(): void {
    const start = parseInt(counterStart.value, 10);
    filenamePatternPreview1.textContent = renameTechnically(
        IMGUR_FILENAME,
        filenamePattern.value,
        {
            counter: start,
            counterPadding: parseInt(counterPadding.value, 10),
            imageUrl: IMGUR_SRC,
            tabTitle: TUMBLR_TITLE,
            tabUrl: TUMBLR_PAGE,
        }
    );

    const step = parseInt(counterStep.value, 10);
    filenamePatternPreview2.textContent = renameTechnically(
        GIPHY_FILENAME,
        filenamePattern.value,
        {
            counter: start + step,
            counterPadding: parseInt(counterPadding.value, 10),
            imageUrl: GIPHY_SRC,
            tabTitle: REDDIT_TITLE,
            tabUrl: REDDIT_PAGE,
        }
    );
}

function applyDisabledState(): void {
    const renamingEnabled = enableFileRename.checked;

    filenamePattern.required = renamingEnabled;
    filenamePattern.disabled = !renamingEnabled;

    counterPadding.required = renamingEnabled;
    counterPadding.disabled = !renamingEnabled;

    counterStart.required = renamingEnabled;
    counterStart.disabled = !renamingEnabled;

    counterStep.required = renamingEnabled;
    counterStep.disabled = !renamingEnabled;
}

function rigEnableFileRename(settings: Settings): void {
    enableFileRename.checked = settings.enableRename;

    enableFileRename.addEventListener("change", () => {
        const update: Partial<Writable<Settings>> = {
            enableRename: enableFileRename.checked,
        };

        if (
            enableFileRename.checked &&
            filenamePattern.value.trim().length === 0
        ) {
            update.fileNamePattern = FilenameVariables.inferred;
            filenamePattern.value = update.fileNamePattern;
            renderPatternPreview();
        }

        write(update).catch(console.error);
        applyDisabledState();
    });
}

function rigFilenamePattern(settings: Settings): void {
    filenamePattern.value = settings.fileNamePattern;

    filenamePattern.addEventListener("input", () => {
        if (filenamePattern.checkValidity()) {
            write({
                fileNamePattern: filenamePattern.value
                    .trim()
                    .replace(/\s+/gu, " "),
            }).catch(console.error);
            renderPatternPreview();
        }
    });
}

function rigCounterPadding(settings: Settings): void {
    counterPadding.value = String(settings.counterPadding);

    counterPadding.addEventListener("change", () => {
        if (counterPadding.checkValidity()) {
            write({
                counterPadding: parseInt(counterPadding.value, 10),
            }).catch(console.error);
            renderPatternPreview();
        }
    });
}

function rigCounterStart(settings: Settings): void {
    counterStart.value = String(settings.counterStart);

    counterStart.addEventListener("change", () => {
        if (counterStart.checkValidity()) {
            write({
                counterStart: parseInt(counterStart.value, 10),
            }).catch(console.error);
            renderPatternPreview();
        }
    });
}

function rigCounterStep(settings: Settings): void {
    counterStep.value = String(settings.counterStep);

    counterStep.addEventListener("change", () => {
        if (counterStep.checkValidity()) {
            write({
                counterStep: parseInt(counterStep.value, 10),
            }).catch(console.error);
            renderPatternPreview();
        }
    });
}

export function rigRenaming(settings: Settings): void {
    rigEnableFileRename(settings);
    rigFilenamePattern(settings);
    rigCounterPadding(settings);
    rigCounterStart(settings);
    rigCounterStep(settings);

    renderPatternPreview();
    applyDisabledState();

    if (fileNamingSupport() == null) {
        notSupported.classList.remove("display-none");

        for (const input of renamingSettings.getElementsByTagName("input")) {
            input.disabled = true;
        }
    }
}
