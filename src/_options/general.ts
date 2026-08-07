import { Settings, write } from "../common";

const greyOutDuringDownload = document.getElementById(
    "greyOut"
) as HTMLInputElement;
const notifyOnDownload = document.getElementById("notify") as HTMLInputElement;

function rigNotifyOnDownload(settings: Settings): void {
    notifyOnDownload.checked = settings.notify;

    notifyOnDownload.addEventListener("change", () => {
        write({
            notify: notifyOnDownload.checked,
        }).catch(console.error);
    });
}

function rigGreyOut(settings: Settings): void {
    greyOutDuringDownload.checked = settings.greyOut;

    greyOutDuringDownload.addEventListener("change", () => {
        write({
            greyOut: greyOutDuringDownload.checked,
        }).catch(console.error);
    });
}

export function rigGeneral(settings: Settings): void {
    rigNotifyOnDownload(settings);
    rigGreyOut(settings);
}
