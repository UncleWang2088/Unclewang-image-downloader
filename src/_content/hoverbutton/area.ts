export interface Area {
    height: number;
    width: number;
}

export function ofViewport(): Area {
    const height = Math.max(
        document.documentElement.clientHeight,
        document.body.clientHeight
    );
    const width = Math.max(
        document.documentElement.clientWidth,
        document.body.clientWidth
    );

    return { height, width };
}

export function matching(element: Element): Area {
    const { height, width } = element.getBoundingClientRect();
    return { height, width };
}

export function shrink(area: Area, size: number): Area {
    return { height: area.height - size, width: area.width - size };
}
