import { TriggeredMessage, hotkeyTriggered, load } from "../common";
import { getLastPosition } from "./cursor-tracking";
import { findNearestImage } from "./dom";
import { downloadImage } from "./downloads";
import { getLastHoveredElement } from "./hoverbutton";

async function downloadHoverTracked(): Promise<boolean> {
    const lastHoveredElement = getLastHoveredElement();

    if (lastHoveredElement != null) {
        const image = findNearestImage(lastHoveredElement);
        if (image != null) {
            const settings = await load();
            await downloadImage(image, settings);
            return true;
        }
    }

    return false;
}

// this can find images where e.g. `pointer-events: none;` prevents hover tracking from working
async function downloadCursorTracked(): Promise<boolean> {
    const lastPosition = getLastPosition();

    if (lastPosition == null) {
        return false;
    }

    const pointingAt = document.elementsFromPoint(...lastPosition);
    const nestedImages = pointingAt
        .map((pointed) => findNearestImage(pointed))
        .filter((image): image is HTMLImageElement => image != null);

    if (nestedImages.length === 0) {
        return false;
    }

    const settings = await load();
    await downloadImage(nestedImages[0]!, settings);
    return true;
}

export async function downloadHoveredImage(): Promise<TriggeredMessage> {
    const imageFound =
        (await downloadHoverTracked()) || (await downloadCursorTracked());
    return hotkeyTriggered(imageFound);
}
