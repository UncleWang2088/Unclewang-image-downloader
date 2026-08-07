import { HoverButtonPosition } from "../../common";
import type { Area } from "./area";

type Calculator = (areaSize: number, selfSize: number) => number;

const MIN: Calculator = (_: number, self: number) => 0 - self;
const NEG: Calculator = () => 0;
const CENTER: Calculator = (area: number, self: number) => (area - self) / 2;
const POS: Calculator = (area: number, self: number) => area - self;
const MAX: Calculator = (area: number) => area;

const RELATIVE_DISTANCES: Record<
    HoverButtonPosition,
    [Calculator, Calculator]
> = {
    [HoverButtonPosition.topLeftSW]: [MIN, NEG],
    [HoverButtonPosition.westWest]: [MIN, CENTER],
    [HoverButtonPosition.bottomLeftNW]: [MIN, POS],

    [HoverButtonPosition.topLeftNE]: [NEG, MIN],
    [HoverButtonPosition.topLeftSE]: [NEG, NEG],
    [HoverButtonPosition.west]: [NEG, NEG],
    [HoverButtonPosition.bottomleftNE]: [NEG, POS],
    [HoverButtonPosition.bottomLeftSE]: [NEG, MAX],

    [HoverButtonPosition.northNorth]: [CENTER, MIN],
    [HoverButtonPosition.north]: [CENTER, NEG],
    [HoverButtonPosition.center]: [CENTER, CENTER],
    [HoverButtonPosition.south]: [CENTER, POS],
    [HoverButtonPosition.southSouth]: [CENTER, MAX],

    [HoverButtonPosition.topRightNW]: [POS, MIN],
    [HoverButtonPosition.topRightSW]: [POS, NEG],
    [HoverButtonPosition.east]: [POS, CENTER],
    [HoverButtonPosition.bottomRightNW]: [POS, POS],
    [HoverButtonPosition.bottomRightSW]: [POS, MAX],

    [HoverButtonPosition.topRightSE]: [MAX, NEG],
    [HoverButtonPosition.eastEast]: [MAX, CENTER],
    [HoverButtonPosition.bottomRightNE]: [MAX, POS],
};

interface Offset {
    // a.k.a. x or offset from left
    left: number;
    // a.k.a. y or offset from top
    top: number;
}

export function topLeftOf(element: Element): Offset {
    const { left, top } = element.getBoundingClientRect();
    return { left, top };
}

export function relativeTo(
    area: Area,
    position: HoverButtonPosition,
    buttonSize: number
): Offset {
    const distances = RELATIVE_DISTANCES[position];

    const left = distances[0](area.width, buttonSize);
    const top = distances[1](area.height, buttonSize);

    return { left, top };
}

export function add(offsetA: Offset, offsetB: Offset): Offset {
    return {
        left: offsetA.left + offsetB.left,
        top: offsetA.top + offsetB.top,
    };
}

export function constrainTo(offset: Offset, area: Area): Offset {
    const left = Math.max(0, Math.min(area.width, offset.left));
    const top = Math.max(0, Math.min(area.height, offset.top));

    return { left, top };
}
