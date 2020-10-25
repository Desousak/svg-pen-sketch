function coordsToPath(points) {
    // Function to reduce the points into a string
    let pathReduceFn = ( acc, cur )  => {return `${acc} L${cur[0]} ${cur[1]}`};

    // Add all the paths
    let pathStr = points.reduce(pathReduceFn, "");

    // Replace the first "L" in the string with a M and return the string
    return pathStr.replace("L", "M");
}

const PathExtras = {
    coordsToPath: coordsToPath
}

Object.freeze(PathExtras);
export default PathExtras;