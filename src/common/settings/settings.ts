import { Settings, correct, read, write } from "./io";
import { deepEqual } from "fast-equals";

export async function load(): Promise<Settings> {
    const raw = await read();
    return correct(raw);
}

export async function validate(): Promise<boolean> {
    const raw = await read();
    const validated = correct(raw);

    if (deepEqual(validated, raw)) {
        return true;
    } else {
        await write(validated);
        return false;
    }
}

export function passesShiftKeySetting(
    event: MouseEvent,
    settings: Settings
): boolean {
    return !settings.requireShift || event.shiftKey;
}

export function passesSizeRestrictions(
    image: HTMLImageElement,
    settings: Settings
): boolean {
    return (
        image.width > settings.minimumImageSize &&
        image.height > settings.minimumImageSize
    );
}
