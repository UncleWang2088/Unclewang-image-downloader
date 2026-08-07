import {
    Settings,
    monitor,
    passesShiftKeySetting,
    passesSizeRestrictions,
} from "../../common";
import { isImage } from "../dom";
import { filteringAllows } from "../filtering";
import { hover } from "./hover-tracking";
import * as layout from "./layout";

async function adaptToHoveredElement(
    settings: Settings,
    event: MouseEvent
): Promise<void> {
    // can't mouse over anything else
    const eventTarget = event.target as Element;

    if (isImage(eventTarget)) {
        const allowedByAllSettings =
            passesShiftKeySetting(event, settings) &&
            passesSizeRestrictions(eventTarget, settings) &&
            (await filteringAllows(location)) &&
            (await filteringAllows(eventTarget));

        if (allowedByAllSettings) {
            layout.attachTo(eventTarget);
        } else {
            layout.remove();
        }
    } else {
        if (!settings.persist) {
            layout.remove();
        }
    }
}

let listenerToken: symbol | null = null;

function actualizeState(settings: Settings): void {
    if (settings.singleClickEnabled) {
        if (listenerToken == null) {
            listenerToken = hover.subscribe((event) => {
                adaptToHoveredElement(settings, event).catch(console.error);
            }, "move button onto hovered image");
        }
    } else {
        if (listenerToken != null) {
            hover.unsubscribe(listenerToken);
            listenerToken = null;
        }

        // the setting might have changed while the button was displayed
        layout.remove();
    }
}

export function armHoverButton(settings: Settings): void {
    layout.init(settings);
    actualizeState(settings);

    layout.updateVisualsOnChanges();
    monitor("singleClickEnabled", (st) => actualizeState(st));
}
