import * as d3 from "d3";
import MathExtas from "./MathExtras.js";
import PathExtras from "./PathExtras.js";

// Default settings
const defStrokeParam = {
  // Line function for drawing (must convert coordinates to a valid path string)
  lineFunc: PathExtras.coordsToPath,
  // Minimum distance between points before the stroke is updated
  minDist: 5,
};

const defEraserParam = {
  eraserMode: "pixel",
  minDist: 5,
};

const defStrokeStyles = {
  stroke: "black",
  "stroke-width": "1px",
};

const defEraserStyles = {
  "pointer-events": "none",
  "z-index": 999,
  fill: "rgba(0,0,0, 0.5)",
};

export default class SvgPenSketch {
  constructor(
    element = null,
    strokeStyles = {},
    strokeParam = {},
    eraserParam = {},
    eraserStyles = {}
  ) {
    // If the element is a valid
    if (element != null && typeof element === "object" && element.nodeType) {
      // Private variables
      // The root SVG element
      this._element = d3.select(element);
      // Variable for if the pointer event is a pen
      this._isPen = false;
      // Resize the canvas viewbox on window resize
      // TODO: Need to implement a proper fix to allow paths to scale
      // window.onresize = _ => {
      //     this.resizeCanvas();
      // };
      // Prep the canvas for drawing
      this._element.on("pointerdown", (_) => this._handlePointer());
      // Stop touch scrolling
      this._element.on("touchstart", (_) => {
        if (this._isPen) d3.event.preventDefault();
      });
      // Stop the context menu from appearing
      this._element.on("contextmenu", (_) => {
        d3.event.preventDefault();
        d3.event.stopPropagation();
      });

      // Public variables
      // Forces the use of the eraser - even if the pen isn't tilted over
      this.forceEraser = false;
      // Stroke parameters
      this.strokeParam = { ...defStrokeParam, ...strokeParam };
      // Styles for the stroke
      this.strokeStyles = { ...defStrokeStyles, ...strokeStyles, fill: "none" };
      // Eraser paraneters
      this.eraserParam = { ...defEraserParam, ...eraserParam };
      // Styles for the Eraser
      this.eraserStyles = { ...defEraserStyles, ...eraserStyles };
      // Pen Callbacks
      this.penDownCallback = (_) => {};
      this.penUpCallback = (_) => {};
      // Eraser Callbacks
      this.eraserDownCallback = (_) => {};
      this.eraserUpCallback = (_) => {};
    } else {
      throw new Error(
        "svg-pen-sketch needs a svg element in the constructor to work"
      );
    }
  }

  // Public functions
  getElement() {
    return this._element.node();
  }
  toggleForcedEraser() {
    this.forceEraser = !this.forceEraser;
  }

  // Not being used at the moment
  resizeCanvas() {
    let bbox = this._element.node().getBoundingClientRect();
    this._element.attr("viewBox", "0 0 " + bbox.width + " " + bbox.height);
  }

  getPathsAtPoint(x1, y1, x2, y2) {
    let paths = [];

    // Iterate through the specified range
    for (let x = x1; x <= x2; x += 1) {
      for (let y = y1; y <= y2; y += 1) {
        // Get any paths at a specified x and y location
        let elements = document.elementsFromPoint(x, y);
        for (let element of elements) {
          if (element.nodeName === "path" && !paths.includes(element))
            paths.push(element);
        }
      }
    }
    return paths;
  }

  removePaths(x, y, eraserSize = 1) {
    // Prep variables
    let removedPathIDs = [];
    let xLowerBounds = x - eraserSize,
      xUpperBounds = x + eraserSize,
      yLowerBounds = y - eraserSize,
      yUpperBounds = y + eraserSize;

    // Get paths in the eraser's range
    let paths = this.getPathsAtPoint(
      xLowerBounds,
      yLowerBounds,
      xUpperBounds,
      yUpperBounds
    );

    // For each path found, remove it 
    for (let path of paths) {
      let pathToRemove = d3.select(path);
      removedPathIDs.push(pathToRemove.attr("id"));
      pathToRemove.remove();
    }
    return removedPathIDs;
  }

  editPaths(x, y, eraserSize = 1) {
    let xLowerBounds = x - eraserSize,
      xUpperBounds = x + eraserSize,
      yLowerBounds = y - eraserSize,
      yUpperBounds = y + eraserSize;

    let paths = this.getPathsAtPoint(
      xLowerBounds,
      yLowerBounds,
      xUpperBounds,
      yUpperBounds
    );

    for (let originalPath of paths) {
      let pathCoords = PathExtras.pathToCoords(originalPath.getAttribute("d"));

      let newPaths = []; // The series of stroke coordinates to add
      let tempPath = []; // A temporary stroke to hold coordinates

      for (let coords of pathCoords) {
        let xCoord = coords[0],
          yCoord = coords[1];

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
          if (tempPath.length > 0) {
            newPaths.push(tempPath);
            tempPath = [];
          }
        } else {
          tempPath.push(coords);
        }
      }
      // Add the last portion of the stroke if it wasn't added already
      if (tempPath.length > 0) newPaths.push(tempPath);

      // Add the new paths if they have two or more sets of coordinates
      // Prevents empty paths from being added
      for (let newPath of newPaths) {
        if (newPath.length > 1) {
          let strokePath = this._createPath();

          // Copy the styles of the original stroke
          strokePath.attr("d", PathExtras.coordsToPath(newPath));
          strokePath.attr("style", originalPath.getAttribute("style"));
          strokePath.attr("class", originalPath.className);
        }
      }

      originalPath.remove();
    }
  }

  // Private functions
  _handlePointer() {
    // If the pointer is a pen - prevent the touch event and run pointer handling code
    if (d3.event.pointerType == "touch") {
      this._isPen = false;
    } else {
      this._isPen = true;

      let pointerButton = d3.event.button;
      if (this.forceEraser) pointerButton = 5;

      // Determine if the pen tip or eraser is being used
      // ID 0 *should be* the pen tip, with anything else firing the eraser
      switch (pointerButton) {
        // Pen
        case 0:
          // Create the path/coordinate arrays and set event handlers
          let penCoords = [];
          let strokePath = this._createPath();

          // Create the drawing event handlers
          this._element.on("pointermove", (_) =>
            this._onDraw(d3.event, strokePath, penCoords)
          );
          this._element.on("pointerup", (_) =>
            this._stopDraw(d3.event, strokePath)
          );
          this._element.on("pointerleave", (_) =>
            this._stopDraw(d3.event, strokePath)
          );
          break;

        // Eraser
        default:
        case 5:
          // Create the location arrays
          let [x, y] = this._getMousePos(d3.event);
          let eraserCoords = [[x, y]];

          // Prep the eraser hover element
          let eraserHandle = this._element.append("circle");
          eraserHandle.attr("class", "eraserHandle");
          eraserHandle.attr("r", 10);
          eraserHandle.attr("cx", x);
          eraserHandle.attr("cy", y);

          // Apply all user-desired styles
          for (let styleName in this.eraserStyles) {
            eraserHandle.style(styleName, this.eraserStyles[styleName]);
          }

          // Create the erase event handlers
          this._element.on("pointermove", (_) =>
            this._onErase(d3.event, eraserHandle, eraserCoords)
          );
          this._element.on("pointerup", (_) =>
            this._stopErase(d3.event, eraserHandle)
          );
          this._element.on("pointerleave", (_) =>
            this._stopErase(d3.event, eraserHandle)
          );
          break;
      }
    }
  }

  _createPath() {
    let strokePath = this._element.append("path");

    // Generate a random ID for the stroke
    let strokeID = Math.random().toString(32).substr(2, 9);
    strokePath.attr("id", strokeID);

    // Apply all user-desired styles
    for (let styleName in this.strokeStyles) {
      strokePath.style(styleName, this.strokeStyles[styleName]);
    }

    return strokePath;
  }

  _getMousePos(event) {
    let canvasContainer = this.getElement().getBoundingClientRect();

    // Calculate the offset using the page location and the canvas' offset (also taking scroll into account)
    let x =
        event.pageX - canvasContainer.x - document.scrollingElement.scrollLeft,
      y = event.pageY - canvasContainer.y - document.scrollingElement.scrollTop;

    return [x, y];
  }

  _onDraw(event, strokePath, penCoords) {
    if (event.pointerType != "touch") {
      let updateStroke = true;
      let [x, y] = this._getMousePos(event);

      if (penCoords.length > 0) {
        // Get the distance from the last coordinates, if the distance is too small - dont update the stroke
        let [lastX, lastY] = penCoords.slice(-1)[0];
        let dist = MathExtas.getDist(lastX, lastY, x, y);
        if (dist < this.strokeParam.minDist) updateStroke = false;
      }

      if (updateStroke) {
        // Add the points to the path
        penCoords.push([x, y]);
        strokePath.attr("d", this.strokeParam.lineFunc(penCoords));
      }

      // Call the callback
      if (this.penDownCallback != undefined) {
        this.penDownCallback(strokePath.node(), event);
      }
    }
  }

  _stopDraw(event, strokePath) {
    // Remove the event handlers
    this._element.on("pointermove", null);
    this._element.on("pointerup", null);
    this._element.on("pointerleave", null);
    // Call the callback
    if (this.penUpCallback != undefined) {
      this.penUpCallback(strokePath.node(), event);
    }
  }

  _onErase(event, eraserHandle, eraserCoords) {
    if (event.pointerType != "touch") {
      let updateEraser = true;
      let [x, y] = this._getMousePos(event);

      // Move the eraser icon
      eraserHandle.attr("cx", x);
      eraserHandle.attr("cy", y);

      // Get the distance from the last coordinates, if the distance is too small - dont update the stroke
      let [lastX, lastY] = eraserCoords.slice(-1)[0];
      let dist = MathExtas.getDist(lastX, lastY, x, y);
      if (dist < this.eraserParam.minDist) updateEraser = false;

      if (updateEraser) {
        // Add the points
        eraserCoords.push([x, y]);

        switch (this.eraserParam.eraserMode) {
          case "stroke":
            // Remove any paths in the way
            let removedPaths = this.removePaths(x, y, 10);
            break;
          case "pixel":
            this.editPaths(x, y, 10);
            break;
          default:
            console.error("ERROR: INVALID ERASER MODE");
            break;
        }
      }

      if (this.eraserDownCallback != undefined) {
        this.eraserDownCallback([], event);
      }
    }
  }

  _stopErase(event, eraserHandle) {
    // Remove the eraser icon
    eraserHandle.remove();

    // Remove the event handlers
    this._element.on("pointermove", null);
    this._element.on("pointerup", null);
    this._element.on("pointerleave", null);
    // Call the callback
    if (this.eraserUpCallback != undefined) {
      this.eraserUpCallback(event);
    }
  }
}
