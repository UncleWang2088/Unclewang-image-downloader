import { getFilterState } from "./state";

// `instanceof Location` is unreliable in isolated worlds, so detect by shape
function isLocation(target: HTMLImageElement | Location): target is Location {
    return (
        typeof (target as Location).hostname == "string" && !("src" in target)
    );
}

export async function filteringAllows(
    target: HTMLImageElement | Location
): Promise<boolean> {
    const [pageMatches, pageMustMatch, imageMatches, imageMustMatch] =
        await getFilterState();

    return isLocation(target)
        ? pageMatches(target.hostname) === pageMustMatch
        : imageMatches(new URL(target.src).hostname) === imageMustMatch;
}
