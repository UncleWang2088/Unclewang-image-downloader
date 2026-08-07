import {
    HoverButtonPosition,
    HoverButtonSkin,
    Settings,
    write,
} from "../common";
import browser from "webextension-polyfill";

const dragDropSupported = document.getElementById(
    "supportDragDrop"
) as HTMLInputElement;
const hoverButtonEnabled = document.getElementById(
    "singleClickEnabled"
) as HTMLInputElement;
const hoverButtonOpacity = document.getElementById(
    "buttonOpacity"
) as HTMLInputElement;
const hoverButtonOpacityOutput = document.getElementById(
    "buttonOpacityOutput"
) as HTMLOutputElement;
const hoverButtonPositionPicker = document.getElementById(
    "positionPicker"
) as HTMLTableElement;
const hoverButtonSize = document.getElementById(
    "buttonSize"
) as HTMLInputElement;
const hoverButtonSkins = document.getElementById("oneClickStyles")!;
const persistHoverButton = document.getElementById(
    "persist"
) as HTMLInputElement;
const hoverButtonPreview = document.getElementById(
    "oneClickStyle-preview"
) as HTMLImageElement;

function previewButton(): void {
    const size = parseInt(hoverButtonSize.value, 10);
    const opacity = parseInt(hoverButtonOpacity.value, 10) / 100;
    const skin = [...hoverButtonSkins.getElementsByTagName("input")].filter(
        (input) => input.checked
    )[0]!.value;

    hoverButtonPreview.src = browser.runtime.getURL(
        `images/download_off_${skin}.png`
    );
    hoverButtonPreview.width = size;
    hoverButtonPreview.height = size;
    hoverButtonPreview.style.opacity = String(opacity);
}

function applyDisabledState(): void {
    const enabled = hoverButtonEnabled.checked;

    dragDropSupported.disabled = !enabled;

    hoverButtonSize.required = enabled;
    hoverButtonSize.disabled = !enabled;

    hoverButtonOpacity.required = enabled;
    hoverButtonOpacity.disabled = !enabled;

    [...hoverButtonSkins.getElementsByTagName("input")].forEach(
        (skinSelector) => (skinSelector.disabled = !enabled)
    );
    [...hoverButtonPositionPicker.getElementsByTagName("input")].forEach(
        (positionSelector) => (positionSelector.disabled = !enabled)
    );
}

function rigPersistHoverButton(settings: Settings): void {
    persistHoverButton.checked = settings.persist;

    persistHoverButton.addEventListener("change", () => {
        write({
            persist: persistHoverButton.checked,
        }).catch(console.error);
    });
}

function rigHoverButtonEnabled(settings: Settings): void {
    hoverButtonEnabled.checked = settings.singleClickEnabled;

    hoverButtonEnabled.addEventListener("change", () => {
        write({
            singleClickEnabled: hoverButtonEnabled.checked,
        }).catch(console.error);
        applyDisabledState();
    });
}

function rigSupportDragDrop(settings: Settings): void {
    dragDropSupported.checked = settings.supportDragDrop;

    dragDropSupported.addEventListener("change", () => {
        write({
            supportDragDrop: dragDropSupported.checked,
        }).catch(console.error);
    });
}

function rigHoverButtonSize(settings: Settings): void {
    hoverButtonSize.value = String(settings.buttonSize);

    hoverButtonSize.addEventListener("input", () => {
        if (hoverButtonSize.checkValidity()) {
            write({
                buttonSize: parseInt(hoverButtonSize.value, 10),
            }).catch(console.error);
            previewButton();
        }
    });
}

function rigHoverButtonOpacity(settings: Settings): void {
    hoverButtonOpacity.value = String(settings.buttonOpacity * 100);
    hoverButtonOpacityOutput.textContent = hoverButtonOpacity.value;

    hoverButtonOpacity.addEventListener("input", () => {
        hoverButtonOpacityOutput.textContent = hoverButtonOpacity.value;
        write({
            buttonOpacity: parseInt(hoverButtonOpacity.value, 10) / 100,
        }).catch(console.error);
        previewButton();
    });
}

function rigHoverButtonSkins(settings: Settings): void {
    const currentSkinSelector = document.querySelector<HTMLInputElement>(
        `#oneClickStyles input[value='${settings.oneClickStyle}']`
    )!;
    currentSkinSelector.checked = true;

    hoverButtonSkins.addEventListener("change", (event) => {
        const newSkinSelector = event.target as HTMLInputElement;
        write({
            oneClickStyle: newSkinSelector.value as HoverButtonSkin,
        }).catch(console.error);
        previewButton();
    });
}

function rigHoverButtonPosition(settings: Settings): void {
    const currentPositionSelector = document.querySelector<HTMLInputElement>(
        `#positionPicker input[value='${settings.buttonPosition}']`
    )!;
    currentPositionSelector.checked = true;

    hoverButtonPositionPicker.addEventListener("change", (event) => {
        const newPositionSelector = event.target as HTMLInputElement;
        write({
            buttonPosition: newPositionSelector.value as HoverButtonPosition,
        }).catch(console.error);
    });
}

export function rigHoverButton(settings: Settings): void {
    hoverButtonPreview.addEventListener(
        "mouseover",
        () =>
            (hoverButtonPreview.src = hoverButtonPreview.src.replace(
                "download_off",
                "download_on"
            ))
    );
    hoverButtonPreview.addEventListener(
        "mouseout",
        () =>
            (hoverButtonPreview.src = hoverButtonPreview.src.replace(
                "download_on",
                "download_off"
            ))
    );

    rigPersistHoverButton(settings);
    rigHoverButtonEnabled(settings);
    rigSupportDragDrop(settings);
    rigHoverButtonSize(settings);
    rigHoverButtonOpacity(settings);
    rigHoverButtonSkins(settings);
    rigHoverButtonPosition(settings);

    previewButton();
    applyDisabledState();
}
