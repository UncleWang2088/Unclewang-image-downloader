import { HTML_BUTTON_ID } from "./hoverbutton/skinning";

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
    // 跳过悬浮下载按钮自身：它的背景图是扩展皮肤图标，不是要下载的图片
    if (bg !== "none" && bg.includes("url(") && element.id !== HTML_BUTTON_ID) {
        const match = /url\(["']?(?<url>[^"')]+)["']?\)/u.exec(bg);
        const url = match?.groups?.url?.trim();
        if (url != null && url.length > 0) {
            const image = document.createElement("img");
            image.src = url;
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
