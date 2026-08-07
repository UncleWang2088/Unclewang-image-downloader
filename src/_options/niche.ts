import { ClickType, ConflictAction, Settings, write } from "../common";

const clickTypes = document.getElementById("clickTypes")!;
const conflictActions = document.getElementById("conflictActions")!;
const doubleRightClickTiming = document.getElementById(
    "doubleRightClickTiming"
) as HTMLInputElement;
const aggressiveCursorTracking = document.getElementById(
    "aggressiveCursorTracking"
) as HTMLInputElement;

function applyDisabledState(value: ClickType): void {
    doubleRightClickTiming.disabled = value !== ClickType.doubleRight;
}

function rigConflictAction(settings: Settings): void {
    const currentActionSelector = document.querySelector<HTMLInputElement>(
        `#conflictActions input[value='${settings.onFilenameConflict}']`
    )!;
    currentActionSelector.checked = true;

    conflictActions.addEventListener("change", (event) => {
        const newActionSelector = event.target as HTMLInputElement;
        write({
            onFilenameConflict: newActionSelector.value as ConflictAction,
        }).catch(console.error);
    });
}

function rigClickType(settings: Settings): void {
    const currentTypeSelector = document.querySelector<HTMLInputElement>(
        `#clickTypes input[value='${settings.triggerByClickType}']`
    )!;
    currentTypeSelector.checked = true;
    applyDisabledState(settings.triggerByClickType);

    clickTypes.addEventListener("change", (event) => {
        const input = event.target as HTMLInputElement;
        if (input.name !== "clickType") {
            // changed the ms setting
            return;
        }

        applyDisabledState(input.value as ClickType);
        write({
            triggerByClickType: input.value as ClickType,
        }).catch(console.error);
    });
}

function rigDoubleRightClickTiming(settings: Settings): void {
    doubleRightClickTiming.value = String(settings.doubleRightClickMillis);

    doubleRightClickTiming.addEventListener("input", () => {
        if (doubleRightClickTiming.checkValidity()) {
            write({
                doubleRightClickMillis: parseInt(
                    doubleRightClickTiming.value,
                    10
                ),
            }).catch(console.error);
        }
    });
}

function rigAggressiveCursorTracking(settings: Settings): void {
    aggressiveCursorTracking.checked = settings.aggressiveCursorTracking;

    aggressiveCursorTracking.addEventListener("change", () => {
        write({
            aggressiveCursorTracking: aggressiveCursorTracking.checked,
        }).catch(console.error);
    });
}

export function rigNiche(settings: Settings): void {
    rigConflictAction(settings);
    rigClickType(settings);
    rigDoubleRightClickTiming(settings);
    rigAggressiveCursorTracking(settings);
}
