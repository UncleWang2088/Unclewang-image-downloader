import { isButton } from "./element";
import { makeTriggerable } from "@webextensions/common";

let lastHoveredElement: Element | null = null;

const { hide: hoverEvent, expose: hover } = makeTriggerable<MouseEvent>();
// will not trigger for the hoverbutton's image or the same image redundantly
export { hover };

export function trackHovers(): void {
    // is also triggered on pageload for element mouse is immediately on, no movement needed
    document.addEventListener("mouseover", (event) => {
        // can't mouse over much else
        const hovered = event.target as Element;

        if (!isButton(hovered) && hovered !== lastHoveredElement) {
            lastHoveredElement = hovered;
            hoverEvent.trigger(event);
        }
    });
}

export function getLastHoveredElement(): Element | null {
    return lastHoveredElement;
}
