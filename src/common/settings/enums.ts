export enum ClickType {
    none = "none",
    singleLeft = "singleLeft",
    doubleLeft = "doubleLeft",
    singleRight = "singleRight",
    doubleRight = "doubleRight",
}

export enum HoverButtonPosition {
    // corners
    topLeftNE = "1_2",
    topLeftSW = "1_3",
    topLeftSE = "1_4",

    topRightNW = "2_1",
    topRightSW = "2_3",
    topRightSE = "2_4",

    bottomLeftNW = "3_1",
    bottomleftNE = "3_2",
    bottomLeftSE = "3_4",

    bottomRightNW = "4_1",
    bottomRightNE = "4_2",
    bottomRightSW = "4_3",

    // axis
    northNorth = "1",
    north = "2",
    westWest = "3",
    west = "4",
    center = "5",
    east = "6",
    eastEast = "7",
    south = "8",
    southSouth = "9",
}

export enum HoverButtonSkin {
    original = "original",
    alt1 = "alt1",
}

export enum ConflictAction {
    autoUnique = "uniquify",
    // TODO firefox support
    prompt = "prompt",
    overwrite = "overwrite",
}

// *_DIRS = url path as nested dirs
// *_PATH = url path as 1 dot-concatenated dir
export enum FilenameVariables {
    tabDomain = "%pagedomain%",
    tabDirs = "%pagedirs%",
    tabPath = "%pagepath%",
    tabTitle = "%title%",

    imageDomain = "%imagedomain%",
    imageDirs = "%imagedirs%",
    imagePath = "%imagepath%",

    counter = "%counter%",
    inferred = "%original%",

    year = "%y%",
    month = "%M%",
    day = "%d%",
    hour = "%h%",
    minute = "%m%",
    second = "%s%",
    millisecond = "%ms%",
}
