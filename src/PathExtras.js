function coordsToPath(points) {
  let pathStr = "";

  for (let point of points) {
    if (pathStr == "") {
      pathStr += "M";
    } else {
      pathStr += "L";
    }
    pathStr += `${point[0]} ${point[1]} `;
  }

  return pathStr.trim();
}

function pathToCoords(pathStr) {
  let commands = pathStr.split(/(?=[LMC])/);
  let points = commands.map(function (point) {
    if (point !== " ") {
      // If the string doesn't have a space at the end, add it
      // Usefule for the last coords
      if (point[point.length - 1] != " ") {
        point += " ";
      }

      // Trim the path string and convert it
      let coords = point.slice(1, -1).split(" ");

      // Convert the coords to a float
      coords[0] = parseFloat(coords[0]);
      coords[1] = parseFloat(coords[1]);
      return coords;
    }
  });
  return points;
}

function getCachedBoundingClientRect(ele) {
  if (!ele._boundingClientRect) {
    ele._boundingClientRect = ele.getBoundingClientRect();
  }
  return ele._boundingClientRect;
}

const PathExtras = {
  coordsToPath: coordsToPath,
  pathToCoords: pathToCoords,
  getCachedBoundingClientRect: getCachedBoundingClientRect,
};

Object.freeze(PathExtras);
export default PathExtras;
