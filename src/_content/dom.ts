export function isImage(element: Element): element is HTMLImageElement {
    return element.nodeName === "IMG";
}

/**
 * Resolve the image actually being pointed at. Many sites (e.g. Pinterest)
 * wrap images in nested divs/links, so the event target is often not the IMG
 * itself; climb up to find the nearest IMG, then fall back to a background
 * image if the element carries one. As a last resort, a canvas-backed app
 * (e.g. LibTV board) can be captured to a data URL.
 */
export function findNearestImage(element: Element): HTMLImageElement | null {
    if (isImage(element)) {
        return element;
    }

    const ancestor = element.closest("img");
    if (ancestor != null) {
        return ancestor;
    }

    const bg = getComputedStyle(element).backgroundImage;
    if (bg !== "none" && bg.includes("url(")) {
        const match = /url\((?:"?)(?<url>[^"')]+)(?:"?)\)/u.exec(bg);
        if (match?.groups != null) {
            const image = document.createElement("img");
            image.src = match.groups.url ?? "";
            return image;
        }
    }

    // canvas fallback: the whole canvas becomes the image to download
    const canvas = element.closest("canvas");
    if (canvas != null) {
        try {
            const image = document.createElement("img");
            image.src = canvas.toDataURL("image/png");
            return image;
        } catch {
            // tainted canvas; can't read pixels
            return null;
        }
    }

    return null;
}

export function isLeftClick(event: MouseEvent): boolean {
    return event.button === 0;
}

export function isRightClick(event: MouseEvent): boolean {
    return event.button === 2;
}
