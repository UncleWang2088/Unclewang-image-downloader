import { Settings, load, monitor } from "../common";
import { findNearestImage } from "./dom";
import { downloadImage } from "./downloads";
import { drop } from "./hoverbutton";

let dragged: Element | null = null;

function setDragged(event: DragEvent): void {
    // can't drag much else
    dragged = event.target as Element;
}

function clearDragged(): void {
    dragged = null;
}

async function send(): Promise<void> {
    if (dragged == null) {
        // 不是拖图片触发的 drop（例如拖动文本/链接），忽略即可
        return;
    }

    const relevantImage = findNearestImage(dragged);

    if (relevantImage != null) {
        const settings = await load();
        await downloadImage(relevantImage, settings);
    }
}

const setUpOrTearDown: (settings: Settings) => void = (() => {
    let registration: symbol | null = null;

    return (settings: Settings) => {
        if (settings.supportDragDrop) {
            document.body.addEventListener("dragstart", setDragged);
            document.body.addEventListener("dragend", clearDragged);
            registration = drop.subscribe(() => {
                send().catch(console.error);
            }, "download dropped image");
        } else {
            if (registration != null) {
                drop.unsubscribe(registration);
                registration = null;
            }
            document.body.removeEventListener("dragend", clearDragged);
            document.body.removeEventListener("dragstart", setDragged);
        }
    };
})();

export function monitorDrags(settings: Settings): void {
    setUpOrTearDown(settings);
    monitor("supportDragDrop", (st) => setUpOrTearDown(st));
}
