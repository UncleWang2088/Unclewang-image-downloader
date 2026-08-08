import { type Settings, readFolderHistory } from "../../common";
import { CSS_IDS, insertPickerCss } from "./style";

const { OVERLAY_ID, PANEL_ID } = CSS_IDS;

export type PickerChoice = { folder?: string } | { saveAs: true };

// only one picker at a time; a new one dismisses the previous
let activeSettle: ((choice: PickerChoice | null) => void) | null = null;

// value used for the "browser default download folder" option
const DEFAULT_FOLDER_VALUE = "";

// absolute paths can't be passed to chrome.downloads directly; route them
// through the save-as dialog. relative subfolders download straight away.
function choiceForFolder(folder: string): PickerChoice {
    if (folder.length === 0) {
        return {};
    }
    const isAbsolute =
        /^[a-zA-Z]:[\\/]/u.test(folder) || folder.startsWith("/");
    return isAbsolute ? { saveAs: true } : { folder };
}

function basenameFromUrl(url: string): string {
    try {
        const segments = new URL(url).pathname.split("/").filter(Boolean);
        return segments.pop() ?? "image";
    } catch {
        return "image";
    }
}

/**
 * Shows a small popup for choosing where to save the given image.
 * A dropdown lists the most recently used folders (most recent first) plus
 * the browser's default download folder as the bottom fallback.
 * Resolves with:
 *  - { folder }        download into a subfolder of the default download dir
 *  - { saveAs: true }  open the browser's native save-as dialog
 *  - null              user cancelled
 */
export async function showDownloadPicker(
    image: HTMLImageElement,
    settings: Settings
): Promise<PickerChoice | null> {
    insertPickerCss();

    // history (most recent first) merged with configured quick folders,
    // deduped, most recent still on top. Displayed exactly as stored: the
    // user picks what they see. Path conversion happens at download time.
    const history = await readFolderHistory();
    const folders = [
        ...history,
        ...settings.quickFolders.filter((folder) => !history.includes(folder)),
    ].slice(0, 5);

    return new Promise((resolve) => {
        let settled = false;
        // assigned below once all elements exist
        let cleanup: () => void = () => undefined;

        const settle = (choice: PickerChoice | null): void => {
            if (settled) {
                return;
            }
            settled = true;
            if (activeSettle === settle) {
                activeSettle = null;
            }
            cleanup();
            resolve(choice);
        };
        // dismiss any previous picker
        activeSettle?.(null);
        activeSettle = settle;

        const overlay = document.createElement("div");
        overlay.id = OVERLAY_ID;

        const panel = document.createElement("div");
        panel.id = PANEL_ID;

        const title = document.createElement("h3");
        title.textContent = "保存图片到…";
        panel.appendChild(title);

        const filename = document.createElement("div");
        filename.className = "did-picker-filename";
        filename.textContent = basenameFromUrl(image.src);
        panel.appendChild(filename);

        const label = document.createElement("label");
        label.className = "did-picker-label";
        label.textContent = "保存到";
        panel.appendChild(label);

        const select = document.createElement("select");
        select.className = "did-picker-select";

        // history + quick folders, most recent first; select the most recent
        for (const folder of folders) {
            const option = document.createElement("option");
            option.value = folder;
            option.textContent = folder;
            select.appendChild(option);
        }

        // default download folder, always the bottom fallback
        const defaultOption = document.createElement("option");
        defaultOption.value = DEFAULT_FOLDER_VALUE;
        defaultOption.textContent = "默认下载文件夹";
        select.appendChild(defaultOption);

        // most recent folder is preselected; otherwise the default one
        select.selectedIndex = folders.length > 0 ? 0 : folders.length;

        panel.appendChild(select);

        const actions = document.createElement("div");
        actions.className = "did-picker-actions";

        const browse = document.createElement("button");
        browse.type = "button";
        browse.textContent = "浏览…";
        browse.addEventListener("click", (event) => {
            event.stopPropagation();
            settle({ saveAs: true });
        });
        actions.appendChild(browse);

        const download = document.createElement("button");
        download.type = "button";
        download.className = "did-picker-primary";
        download.textContent = "下载";
        download.disabled = false;
        download.addEventListener("click", (event) => {
            event.stopPropagation();
            settle(choiceForFolder(select.value));
        });
        actions.appendChild(download);

        const cancel = document.createElement("button");
        cancel.type = "button";
        cancel.textContent = "取消";
        cancel.addEventListener("click", (event) => {
            event.stopPropagation();
            settle(null);
        });
        actions.appendChild(cancel);

        panel.appendChild(actions);
        overlay.appendChild(panel);
        document.body.appendChild(overlay);

        select.focus();

        const onKeydown = (event: KeyboardEvent): void => {
            if (event.key === "Escape") {
                event.stopPropagation();
                settle(null);
            } else if (event.key === "Enter") {
                event.stopPropagation();
                settle(choiceForFolder(select.value));
            }
        };
        const onOverlayClick = (event: MouseEvent): void => {
            if (event.target === overlay) {
                settle(null);
            }
        };
        document.addEventListener("keydown", onKeydown, true);
        overlay.addEventListener("click", onOverlayClick);

        cleanup = (): void => {
            document.removeEventListener("keydown", onKeydown, true);
            overlay.removeEventListener("click", onOverlayClick);
            overlay.remove();
        };
    });
}
