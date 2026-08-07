import { DOMAIN_NAME_FILTER_PATTERN, Settings, load, write } from "../common";

const excludedPageDomains = document.getElementById(
    "excludedPageDomains"
) as HTMLTextAreaElement;
const excludedSourceDomains = document.getElementById(
    "excludedSourceDomains"
) as HTMLTextAreaElement;
const invertExcludedPageDomains = document.getElementById(
    "invertExcludedPageDomains"
)!;
const invertExcludedSourceDomains = document.getElementById(
    "invertExcludedSourceDomains"
)!;
const minimumImageSize = document.getElementById(
    "minimumImageSize"
) as HTMLInputElement;
const requireShiftKey = document.getElementById(
    "requireShift"
) as HTMLInputElement;

function rigRequireShiftKey(settings: Settings): void {
    requireShiftKey.checked = settings.requireShift;

    requireShiftKey.addEventListener("change", () => {
        write({
            requireShift: requireShiftKey.checked,
        }).catch(console.error);
    });
}

function rigMinImageSize(settings: Settings): void {
    minimumImageSize.value = String(settings.minimumImageSize);

    minimumImageSize.addEventListener("input", () => {
        if (minimumImageSize.checkValidity()) {
            write({
                minimumImageSize: parseInt(minimumImageSize.value, 10),
            }).catch(console.error);
        }
    });
}

function rigExcludedPageDomains(settings: Settings): void {
    excludedPageDomains.value = settings.excludedPageDomains.join("\n");

    excludedPageDomains.addEventListener("input", () => {
        write({
            excludedPageDomains: excludedPageDomains.value
                .split("\n")
                .filter((line) => DOMAIN_NAME_FILTER_PATTERN.test(line)),
        }).catch(console.error);
    });

    // update display in case filtering changes value
    excludedPageDomains.addEventListener("blur", () => {
        load()
            .then(
                (liveSettings) =>
                    (excludedPageDomains.value =
                        liveSettings.excludedPageDomains.join("\n"))
            )
            .catch(console.error);
    });
}

function riginvertExcludedPageDomains(settings: Settings): void {
    const current = document.querySelector<HTMLInputElement>(
        `#invertExcludedPageDomains input[value='${settings.pageDomainsAreWhitelist}']`
    )!;
    current.checked = true;

    invertExcludedPageDomains.addEventListener("change", (event) => {
        const selected = event.target as HTMLInputElement;
        write({
            pageDomainsAreWhitelist: selected.value === "true",
        }).catch(console.error);
    });
}

function rigExcludedImageDomains(settings: Settings): void {
    excludedSourceDomains.value = settings.excludedSourceDomains.join("\n");

    excludedSourceDomains.addEventListener("input", () => {
        write({
            excludedSourceDomains: excludedSourceDomains.value
                .split("\n")
                .filter((line) => DOMAIN_NAME_FILTER_PATTERN.test(line)),
        }).catch(console.error);
    });

    // update display in case filtering changes value
    excludedSourceDomains.addEventListener("blur", () => {
        load()
            .then(
                (liveSettings) =>
                    (excludedSourceDomains.value =
                        liveSettings.excludedSourceDomains.join("\n"))
            )
            .catch(console.error);
    });
}

function rigInvertExcludedSourceDomains(settings: Settings): void {
    const current = document.querySelector<HTMLInputElement>(
        `#invertExcludedSourceDomains input[value='${settings.sourceDomainsAreWhitelist}']`
    )!;
    current.checked = true;

    invertExcludedSourceDomains.addEventListener("change", (event) => {
        const selected = event.target as HTMLInputElement;
        write({
            sourceDomainsAreWhitelist: selected.value === "true",
        }).catch(console.error);
    });
}

export function rigRestrictions(settings: Settings): void {
    rigRequireShiftKey(settings);
    rigMinImageSize(settings);
    rigExcludedPageDomains(settings);
    riginvertExcludedPageDomains(settings);
    rigExcludedImageDomains(settings);
    rigInvertExcludedSourceDomains(settings);
}
