const ROOT_ID = "did-folder-picker";
const OVERLAY_ID = `${ROOT_ID}-overlay`;
const PANEL_ID = `${ROOT_ID}-panel`;

export const CSS_IDS = { OVERLAY_ID, PANEL_ID, ROOT_ID };

const RULES = [
    `#${OVERLAY_ID} { position: fixed; inset: 0; z-index: 2147483646; display: flex; align-items: center; justify-content: center; background: rgba(0, 0, 0, 0.45); }`,
    `#${PANEL_ID} { box-sizing: border-box; width: min(340px, calc(100vw - 32px)); padding: 16px; border-radius: 10px; background: #fff; color: #222; font-family: system-ui, -apple-system, "Segoe UI", sans-serif; font-size: 13px; box-shadow: 0 8px 30px rgba(0, 0, 0, 0.25); }`,
    `#${PANEL_ID} h3 { margin: 0 0 4px; font-size: 14px; font-weight: 600; }`,
    `#${PANEL_ID} .did-picker-filename { margin: 0 0 12px; color: #777; font-size: 12px; word-break: break-all; }`,
    `#${PANEL_ID} .did-picker-label { display: block; margin: 10px 0 4px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; color: #999; }`,
    `#${PANEL_ID} .did-picker-select { box-sizing: border-box; width: 100%; padding: 8px 10px; border: 1px solid #ccc; border-radius: 6px; background: #fff; font-size: 13px; color: #222; }`,
    `#${PANEL_ID} .did-picker-select:focus { outline: none; border-color: #1a73e8; }`,
    `#${PANEL_ID} .did-picker-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 14px; }`,
    `#${PANEL_ID} .did-picker-actions button { padding: 6px 12px; border-radius: 6px; border: 1px solid #ccc; background: #fff; font-size: 12px; cursor: pointer; }`,
    `#${PANEL_ID} .did-picker-actions button:hover { background: #f0f0f0; }`,
    `#${PANEL_ID} .did-picker-primary { background: #1a73e8 !important; border-color: #1a73e8 !important; color: #fff; }`,
    `#${PANEL_ID} .did-picker-primary:hover { background: #1765cc !important; }`,
    `#${PANEL_ID} .did-picker-primary:disabled { background: #b8c4d0 !important; border-color: #b8c4d0 !important; color: #fff !important; cursor: not-allowed; opacity: 0.6; }`,
];

export function insertPickerCss(): void {
    // keep styles resident; multiple pickers may share them
    if (document.getElementById(`${ROOT_ID}-css`) != null) {
        return;
    }
    const style = document.createElement("style");
    style.id = `${ROOT_ID}-css`;
    document.head.appendChild(style);
    const sheet = style.sheet!;
    for (const rule of RULES) {
        sheet.insertRule(rule);
    }
}
