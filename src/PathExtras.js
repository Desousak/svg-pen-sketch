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

function pathCoordHitTest(pathCoords, x, y, range = 1) {
  // The bounds
  let xLowerBounds = x - range,
    xUpperBounds = x + range,
    yLowerBounds = y - range,
    yUpperBounds = y + range;
  // The indicies of the path coord array that the eraser is over
  let hitIndicies = [];

  for (let i = 0; i < pathCoords.length; i++) {
    let xCoord = pathCoords[i][0],
      yCoord = pathCoords[i][1];

    // If the particular point on the line is within the erasing area
    // Eraser area = eraser point +- eraserSize in the X and Y directions
    if (
      xLowerBounds <= xCoord &&
      xCoord <= xUpperBounds &&
      yLowerBounds <= yCoord &&
      yCoord <= yUpperBounds
    ) {
      // If we need to erase this point just create a seperation between the last two points
      // The seperation is done by creating two new paths
      hitIndicies.push(i);
    }
  }

  return hitIndicies;
}

const PathExtras = {
  coordsToPath: coordsToPath,
  pathToCoords: pathToCoords,
  getCachedBoundingClientRect: getCachedBoundingClientRect,
  pathCoordHitTest: pathCoordHitTest,
};

Object.freeze(PathExtras);
export default PathExtras;
