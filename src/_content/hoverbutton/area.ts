export interface Area {
    height: number;
    width: number;
}

export function ofViewport(): Area {
    // 用 window.innerWidth/innerHeight 取真正的视口尺寸：
    // clientHeight 在长页面里可能等于整个文档高度，会把按钮约束到视口外
    return {
        height: window.innerHeight,
        width: window.innerWidth,
    };
}

export function matching(element: Element): Area {
    const { height, width } = element.getBoundingClientRect();
    return { height, width };
}

export function shrink(area: Area, size: number): Area {
    return { height: area.height - size, width: area.width - size };
}
