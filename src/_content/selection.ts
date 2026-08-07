export function getImagesInSelection(): HTMLImageElement[] {
    const selection = getSelection();

    if (selection == null) {
        throw new Error("too late to get the selection?");
    }

    return [...document.images].filter((link) => selection.containsNode(link));
}
