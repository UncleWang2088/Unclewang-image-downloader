import { getFilterState } from "./state";

export async function filteringAllows(
    target: HTMLImageElement | Location
): Promise<boolean> {
    const [pageMatches, pageMustMatch, imageMatches, imageMustMatch] =
        await getFilterState();

    return target instanceof Location
        ? pageMatches(target.hostname) === pageMustMatch
        : imageMatches(new URL(target.src).hostname) === imageMustMatch;
}
