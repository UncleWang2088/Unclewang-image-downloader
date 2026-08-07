import {
    ClickType,
    Settings,
    passesShiftKeySetting,
    passesSizeRestrictions,
} from "../common";
import { findNearestImage, isLeftClick, isRightClick } from "./dom";
import { downloadImage } from "./downloads";
import { filteringAllows } from "./filtering";
import { UnreachableCaseError } from "ts-essentials";

type MouseEventListener = (event: MouseEvent) => void;
type ClickEventType = "click" | "dblclick" | "mouseup";

async function downloadClickedImage(
    settings: Settings,
    event: MouseEvent
): Promise<void> {
    // cant really click anything else
    const eventTarget = event.target as Element;

    if (
        passesShiftKeySetting(event, settings) &&
        (await filteringAllows(location))
    ) {
        // resolve the image even when nested in divs/links (e.g. Pinterest)
        const nearestImage = findNearestImage(eventTarget);

        if (nearestImage == null) {
            const inCanvas =
                eventTarget.closest("canvas") == null ? "否" : "是";
            // eslint-disable-next-line no-console
            console.info(
                "[王叔图片下载] 双击未命中图片 | 目标元素:",
                eventTarget.tagName,
                "| class:",
                eventTarget.className,
                "| 在 canvas 内:",
                inCanvas
            );
            return;
        }

        if (
            passesSizeRestrictions(nearestImage, settings) &&
            (await filteringAllows(nearestImage))
        ) {
            event.stopPropagation();
            await downloadImage(nearestImage, settings);
        }
    }
}

async function detectLeftClick(
    settings: Settings,
    event: MouseEvent
): Promise<void> {
    if (isLeftClick(event)) {
        await downloadClickedImage(settings, event);
    }
}

const detectRightClick: (
    settings: Settings,
    event: MouseEvent
) => Promise<void> = (() => {
    let lastRightClickTime = 0;

    return async (settings: Settings, event: MouseEvent) => {
        if (isRightClick(event)) {
            const now = Date.now();
            const previousRightClick = lastRightClickTime;
            lastRightClickTime = now;

            if (
                settings.triggerByClickType === ClickType.singleRight ||
                now - previousRightClick < settings.doubleRightClickMillis
            ) {
                await downloadClickedImage(settings, event);
            }
        }
    };
})();

function createListener(
    settings: Settings
): [ClickEventType, MouseEventListener] {
    switch (settings.triggerByClickType) {
        case ClickType.none:
            throw new Error("can't make dummy listener");

        case ClickType.singleLeft:
        case ClickType.doubleLeft: {
            const listener = (event: MouseEvent): void => {
                detectLeftClick(settings, event).catch(console.error);
            };
            const clickType =
                settings.triggerByClickType === ClickType.singleLeft
                    ? "click"
                    : "dblclick";
            return [clickType, listener];
        }

        case ClickType.singleRight:
        case ClickType.doubleRight: {
            const listener = (event: MouseEvent): void => {
                detectRightClick(settings, event).catch(console.error);
            };
            const clickType = "mouseup";
            return [clickType, listener];
        }

        default:
            throw new UnreachableCaseError(settings.triggerByClickType);
    }
}

export function monitorClicks(settings: Settings): void {
    if (settings.triggerByClickType === ClickType.none) {
        return;
    }

    const [clickType, listener] = createListener(settings);
    document.addEventListener(clickType, listener);
}
