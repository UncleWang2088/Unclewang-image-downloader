import { FilenameVariables, Settings } from "./settings";
import type { Tabs } from "webextension-polyfill";

function pad(counter: number, counterPadding: number): string {
    const nr = String(counter);
    return "0".repeat(Math.max(0, counterPadding - nr.length)) + nr;
}

function separateExtension(filename: string): [string, string | null] {
    const dotIndex = filename.lastIndexOf(".");

    return dotIndex < 0
        ? [filename, null]
        : [filename.substring(0, dotIndex), filename.substring(dotIndex + 1)];
}

interface TechnicalContext {
    counterPadding: number;
    tabUrl: URL;
    tabTitle: string;
    imageUrl: URL;
    counter: number;
}

export function renameTechnically(
    filename: string,
    pattern: string,
    { counterPadding, tabUrl, tabTitle, imageUrl, counter }: TechnicalContext
): string {
    const [name, extension] = separateExtension(filename);
    const now = new Date();

    // replace in order of unlikeliness to accidentally create new %xyz% patterns, i.e. most predictable first
    let newName = pattern;
    const replace = (flag: FilenameVariables, value: number | string): void => {
        newName = newName.replace(
            new RegExp(flag, "gu"),
            typeof value == "string" ? value : String(value)
        );
    };

    replace(FilenameVariables.counter, pad(counter, counterPadding));

    replace(FilenameVariables.year, now.getFullYear());
    replace(FilenameVariables.month, pad(now.getMonth() + 1, 2));
    replace(FilenameVariables.day, pad(now.getDate(), 2));
    replace(FilenameVariables.hour, pad(now.getHours(), 2));
    replace(FilenameVariables.minute, pad(now.getMinutes(), 2));
    replace(FilenameVariables.second, pad(now.getSeconds(), 2));
    replace(FilenameVariables.millisecond, pad(now.getMilliseconds(), 3));

    replace(FilenameVariables.tabDomain, tabUrl.hostname);
    replace(FilenameVariables.tabDirs, tabUrl.pathname.substring(1));
    replace(
        FilenameVariables.tabPath,
        tabUrl.pathname.substring(1).replace(/\//gu, ".")
    );

    replace(FilenameVariables.imageDomain, imageUrl.hostname);
    replace(FilenameVariables.imageDirs, imageUrl.pathname.substring(1));
    replace(
        FilenameVariables.imagePath,
        imageUrl.pathname.substring(1).replace(/\//gu, ".")
    );

    // these last since they may contain % patterns
    replace(FilenameVariables.inferred, name);
    replace(FilenameVariables.tabTitle, tabTitle);

    return extension == null ? newName : `${newName}.${extension}`;
}

interface FunctionalContext {
    settings: Settings;
    tab: Tabs.Tab;
    imageUrl: URL;
}

export function renameFunctionally(
    filename: string,
    counter: (st: Settings) => number,
    { imageUrl, settings, tab }: FunctionalContext
): string {
    if (tab.url == null) {
        throw new Error("missing url on tab?");
    }
    const tabUrl = new URL(tab.url);
    if (tab.title == null) {
        throw new Error("missing title on tab?");
    }

    return renameTechnically(filename, settings.fileNamePattern, {
        counter: counter(settings),
        counterPadding: settings.counterPadding,
        imageUrl,
        tabTitle: tab.title,
        tabUrl,
    });
}
