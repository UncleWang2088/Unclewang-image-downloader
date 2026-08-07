import { HoverButtonSkin } from "../../common";
import browser from "webextension-polyfill";

export const HTML_BUTTON_ID = "singleclick-image-downloader";
export const SKIN_CLASSES: Record<HoverButtonSkin, string> = {
    [HoverButtonSkin.original]: `skin-${HoverButtonSkin.original}`,
    [HoverButtonSkin.alt1]: `skin-${HoverButtonSkin.alt1}`,
};

export function insertCss(): void {
    const style = document.createElement("style");
    // `sheet` is not available before insert
    document.head.appendChild(style);
    // https://github.com/Microsoft/TypeScript/issues/28098
    Object.values(HoverButtonSkin).forEach((skin) => {
        const activeImg = browser.runtime.getURL(
            `images/download_on_${skin}.png`
        );
        const inactiveImg = browser.runtime.getURL(
            `images/download_off_${skin}.png`
        );

        const skinclass = SKIN_CLASSES[skin];
        style.sheet!.insertRule(
            `#${HTML_BUTTON_ID}.${skinclass} {background-image: url('${inactiveImg}');}`,
            0
        );
        style.sheet!.insertRule(
            `#${HTML_BUTTON_ID}.${skinclass}:hover {background-image: url('${activeImg}');}`,
            1
        );
    });
}
