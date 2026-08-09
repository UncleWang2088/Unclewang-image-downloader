const signals = ["getImagesInSelection", "hotkeyTriggered"] as const;

export function signal<T extends (typeof signals)[number]>(
    subject: T
): { subject: T } {
    return { subject };
}

//

const topics = {
    afterHotkeyTriggered: "afterHotkeyTriggered",
    downloadFinished: "downloadFinished",
    downloadRequested: "downloadRequested",
    downloadStarted: "downloadStarted",
    getDefaultDownloadDir: "getDefaultDownloadDir",
} as const;

export type DownloadChangedMessage = {
    subject: typeof topics.downloadFinished | typeof topics.downloadStarted;
    downloadId: number;
};

export function started(downloadId: number): DownloadChangedMessage {
    return {
        downloadId,
        subject: topics.downloadStarted,
    };
}

export function finished(downloadId: number): DownloadChangedMessage {
    return {
        downloadId,
        subject: topics.downloadFinished,
    };
}

type RequestedMessage = {
    subject: typeof topics.downloadRequested;
    imageUrl: string;
    folder?: string;
    saveAs?: boolean;
};

// huaban.com serves images behind short-lived auth_key signed URLs; the
// thumbnail URL in src/currentSrc works but is tiny. Upgrading the size
// suffix to _fw1200 yields the full-resolution image using the same key.
function huabanFullImageUrl(url: string): string {
    if (!url.includes("huaban.com")) {
        return url;
    }
    // replace the size suffix (e.g. _sq75webp, _fw658webp) with _fw1200,
    // keeping any query string (auth_key) intact
    return url.replace(
        /_[a-z0-9]*(?:webp|png|jpg|jpeg)(?=[?&]|$)/iu,
        "_fw1200"
    );
}

export function requestDownload(
    image: HTMLImageElement,
    options?: { folder?: string; saveAs?: boolean }
): RequestedMessage {
    // currentSrc is the URL the browser actually loaded (carries any
    // auth_key/signature), unlike src which may be a placeholder
    const loaded = image.currentSrc || image.src;
    return {
        imageUrl: huabanFullImageUrl(loaded),
        subject: topics.downloadRequested,
        ...(options?.folder != null && options.folder.length > 0
            ? { folder: options.folder }
            : {}),
        ...(options?.saveAs === true ? { saveAs: true } : {}),
    };
}

export type TriggeredMessage = {
    subject: typeof topics.afterHotkeyTriggered;
    imageFound: boolean;
};

export function hotkeyTriggered(imageFound: boolean): TriggeredMessage {
    return {
        imageFound,
        subject: topics.afterHotkeyTriggered,
    };
}

export type DefaultDirMessage = {
    subject: typeof topics.getDefaultDownloadDir;
    dir: string | null;
};

export function defaultDirMessage(dir: string | null): DefaultDirMessage {
    return {
        dir,
        subject: topics.getDefaultDownloadDir,
    };
}

//

const subjects = [...signals, ...Object.values(topics)] as string[];

export type Message =
    | DefaultDirMessage
    | DownloadChangedMessage
    | RequestedMessage
    | ReturnType<typeof signal>
    | TriggeredMessage;

function hasSubject(value: {
    subject?: unknown;
}): value is { subject: string } {
    return typeof value.subject == "string";
}

function isMessage(value: unknown): value is Message {
    return (
        typeof value == "object" &&
        value != null &&
        hasSubject(value) &&
        subjects.includes(value.subject)
    );
}

export function asMessage(value: unknown): Message {
    if (isMessage(value)) {
        return value;
    } else {
        throw new Error(`${JSON.stringify(value)} is not a message`);
    }
}
