import { HoverButtonPosition, Settings, load, monitor } from "../../common";
import { downloadImage } from "../downloads";
import { matching, ofViewport, shrink } from "./area";
import * as element from "./element";
import { add, constrainTo, relativeTo, topLeftOf } from "./offset";

let anchor: HTMLImageElement | null = null;
let makeup: {
    position: HoverButtonPosition;
    size: number;
} | null = null;

function alignToAnchor(): void {
    if (makeup == null) {
        throw new Error("button is not initialized yet");
    }
    if (anchor == null) {
        throw new Error("cannot align without anchor");
    }

    const offsetRelativeToAnchor = relativeTo(
        matching(anchor),
        makeup.position,
        makeup.size
    );
    const absoluteOffset = add(offsetRelativeToAnchor, topLeftOf(anchor));
    const whereButtonIsVisible = shrink(ofViewport(), makeup.size);
    const { left, top } = constrainTo(absoluteOffset, whereButtonIsVisible);

    element.setCoordinates(left, top);
}

function setSize(settings: Settings): void {
    if (makeup == null) {
        throw new Error("button is not initialized yet");
    }

    makeup.size = settings.buttonSize;
    element.setSize(makeup.size);

    if (element.isInserted()) {
        alignToAnchor();
    }
}

function setPosition(settings: Settings): void {
    if (makeup == null) {
        throw new Error("button is not initialized yet");
    }

    makeup.position = settings.buttonPosition;

    if (element.isInserted()) {
        alignToAnchor();
    }
}

function insert(): void {
    document.addEventListener("scroll", alignToAnchor);
    element.insert();
}

export function updateVisualsOnChanges(): void {
    monitor("buttonSize", (settings) => setSize(settings));
    monitor("buttonPosition", (settings) => setPosition(settings));

    monitor("buttonOpacity", (settings) => element.setOpacity(settings));
    monitor("oneClickStyle", (settings) => element.setSkin(settings));
}

export function remove(): void {
    if (element.isInserted()) {
        element.unsert();
        document.removeEventListener("scroll", alignToAnchor);
        anchor = null;
    }
}

export function attachTo(image: HTMLImageElement): void {
    if (!element.isInserted()) {
        insert();
    }

    anchor = image;
    alignToAnchor();
}

export function init(settings: Settings): void {
    makeup = {
        position: settings.buttonPosition,
        size: settings.buttonSize,
    };

    element.setSkin(settings);
    element.setOpacity(settings);
    setSize(settings);
    setPosition(settings);

    element.click.subscribe(() => {
        if (anchor == null) {
            throw new Error("button attached to nothing?");
        }
        load()
            .then(async (latest) => downloadImage(anchor!, latest))
            .catch(console.error);
    }, "download hovered image");
}
