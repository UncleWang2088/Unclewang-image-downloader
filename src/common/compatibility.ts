import browser, {
    Downloads,
    Events,
    Notifications,
} from "webextension-polyfill";

interface FilenameSuggestion {
    filename: string;
    conflictAction: Downloads.FilenameConflictAction;
}

// return true sync if calling `suggest` async
// https://developer.chrome.com/extensions/downloads#event-onDeterminingFilename
type DetermineFilename = (
    downloadItem: Downloads.DownloadItem,
    suggest: SuggestionCallback
) => true | undefined;
type DeterminingFilenameEvent = Events.Event<DetermineFilename>;

export type SuggestionCallback = (suggestion?: FilenameSuggestion) => void;

// TODO firefox support: https://bugzilla.mozilla.org/show_bug.cgi?id=1245652
export function fileNamingSupport(): DeterminingFilenameEvent | undefined {
    return (
        browser.downloads as {
            onDeterminingFilename?: DeterminingFilenameEvent;
        }
    ).onDeterminingFilename;
}

export interface AdvancedNotificationOptions {
    type: "image";
    imageUrl: string;
    buttons: { title: string }[];
}

// TODO firefox support
// https://bugzilla.mozilla.org/show_bug.cgi?id=1213455
// https://bugzilla.mozilla.org/show_bug.cgi?id=1190681
// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/notifications/NotificationOptions#imageUrl
export async function tryCreateFancyNotification(
    basicOptions: Notifications.CreateNotificationOptions,
    advancedOptions: AdvancedNotificationOptions
): Promise<string> {
    try {
        // this method throws an error immediately despite returning a promise
        // eslint-disable-next-line @typescript-eslint/return-await
        return browser.notifications.create({
            ...basicOptions,
            ...advancedOptions,
        });
    } catch (probablyUnsupportedParams) {
        // eslint-disable-next-line @typescript-eslint/return-await
        return browser.notifications.create(basicOptions);
    }
}
