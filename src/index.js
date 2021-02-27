import * as d3 from "d3";
import MathExtas from "./MathExtras.js";
import PathExtras from "./PathExtras.js";

// Default settings
const defStrokeParam = {
  // Line function for drawing (must convert coordinates to a valid path string)
  lineFunc: PathExtras.coordsToPath,
  // Minimum distance between points before the stroke is updated
  minDist: 4,
  maxDist: 10,
};

const defEraserParam = {
  eraserMode: "pixel",
  eraserSize: 10, // NOTE: Small eraser sizes will cause skipping isses - will need to be fixed
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

    for (let path of this._element.node().querySelectorAll("path")) {
      // Get the bounding boxes for all elements on page
      let bbox = PathExtras.getCachedBoundingClientRect(path);

      // If the eraser and the bounding box for the path overlap
      // and we havent included it already
      if (
        !(
          bbox.x > x2 ||
          bbox.y > y2 ||
          x1 > bbox.x + bbox.width ||
          y1 > bbox.y + bbox.height
        ) &&
        !paths.includes(path)
      ) {
        paths.push(path);
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
          strokePath.attr("class", originalPath.getAttribute("class"));
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
            this.handleDownEvent((_) => this._onDraw(strokePath, penCoords))
          );
          this._element.on("pointerup", (_) =>
            this.handleUpEvent((_) => this._stopDraw(strokePath, penCoords))
          );
          this._element.on("pointerleave", (_) =>
            this.handleUpEvent((_) => this._stopDraw(strokePath, penCoords))
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
          eraserHandle.attr("r", this.eraserParam.eraserSize / 2);
          eraserHandle.attr("cx", x);
          eraserHandle.attr("cy", y);

          // Hide the mouse cursor
          this._element.style("cursor", "none");

          // Apply all user-desired styles
          for (let styleName in this.eraserStyles) {
            eraserHandle.style(styleName, this.eraserStyles[styleName]);
          }

          // Create the erase event handlers
          this._element.on("pointermove", (_) => {
            this.handleDownEvent((_) =>
              this._onErase(eraserHandle, eraserCoords)
            );
          });
          this._element.on("pointerup", (_) =>
            this.handleUpEvent((_) => this._stopErase(eraserHandle))
          );
          this._element.on("pointerleave", (_) =>
            this.handleUpEvent((_) => this._stopErase(eraserHandle))
          );
          break;
      }
    }
  }

  // Creates a new pointer event that can be modified
  createEvent() {
    let newEvent = {};
    let features = [
      "clientX",
      "clientY",
      "offsetX",
      "offsetY",
      "pageX",
      "pageY",
      "pointerType",
      "pressure",
      "movementX",
      "movementY",
      "tiltX",
      "tiltY",
      "twistX",
      "twistY",
      "timeStamp",
    ];

    for (let feat of features) {
      newEvent[feat] = d3.event[feat];
    }
    return newEvent;
  }

  // Handles the creation of this._currPointerEvent and this._prevPointerEvent
  // Also interpolates between samples if needed
  handleDownEvent(callback) {
    let dist = Math.sqrt(
      Math.pow(d3.event.movementX, 2) + Math.pow(d3.event.movementY, 2)
    );

    if (this._prevPointerEvent && dist > this.strokeParam.maxDist * 2) {
      // Calculate how many interpolated samples we need
      let numSteps = Math.floor(dist / this.strokeParam.maxDist) + 1;
      let step = dist / numSteps / dist;

      // For each step
      for (let i = step; i < 1; i += step) {
        // Make a new event based on the current event
        let newEvent = this.createEvent();
        for (let feat in newEvent) {
          // For every feature (that is a number)
          if (!isNaN(parseFloat(newEvent[feat]))) {
            // Linearly interpolate it
            newEvent[feat] = MathExtas.lerp(
              this._prevPointerEvent[feat],
              d3.event[feat],
              i
            );
          }
        }
        // Set it and call the callback
        this._currPointerEvent = newEvent;
        callback();
      }
    }

    // Call the proper callback with the "real" event
    this._currPointerEvent = d3.event;
    callback();
    this._prevPointerEvent = this._currPointerEvent;
  }

  handleUpEvent(callback) {
    // Run the up callback
    this._currPointerEvent = this.createEvent();
    callback();

    // Cleanup the previous pointer events
    this._prevPointerEvent = null;
    this._currPointerEvent = null;
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

  _onDraw(strokePath, penCoords) {
    if (this._currPointerEvent.pointerType != "touch") {
      let [x, y] = this._getMousePos(this._currPointerEvent);

      // Add the points to the path
      penCoords.push([x, y]);
      strokePath.attr("d", this.strokeParam.lineFunc(penCoords));

      // Call the callback
      if (this.penDownCallback != undefined) {
        this.penDownCallback(strokePath.node(), this._currPointerEvent);
      }
    }
  }

  _interpolateStroke(strokePath, penCoords) {
    // Fill in the path if there are missing nodes
    let newPath = [];
    for (let i = 0; i <= penCoords.length - 2; i++) {
      // Get the current and next coordinates
      let currCoords = penCoords[i];
      let nextCoords = penCoords[i + 1];
      newPath.push(currCoords);

      // If the distance to the next coord is too large, interpolate between
      let dist = MathExtas.getDist(
        currCoords[0],
        currCoords[1],
        nextCoords[0],
        nextCoords[1]
      );
      if (dist > this.strokeParam.minDist * 2) {
        // Calculate how many interpolated samples we need
        let step = Math.floor((dist / this.strokeParam.minDist) * 2) + 1;
        // Loop through the interpolated samples needed - adding new coordinates
        for (let j = dist / step / dist; j < 1; j += dist / step / dist) {
          newPath.push([
            MathExtas.lerp(currCoords[0], nextCoords[0], j),
            MathExtas.lerp(currCoords[1], nextCoords[1], j),
          ]);
        }
      }

      // Add the final path
      if (i == penCoords.length - 2) {
        newPath.push(nextCoords);
      }
    }

    // Update the stroke
    strokePath.attr("d", PathExtras.coordsToPath(newPath));
  }

  _stopDraw(strokePath, penCoords) {
    // Remove the event handlers
    this._element.on("pointermove", null);
    this._element.on("pointerup", null);
    this._element.on("pointerleave", null);

    // Interpolate the path if needed
    this._interpolateStroke(strokePath, penCoords);

    // Cache the element's boundingclientrect
    // strokePath.attr("boundingClientRect", strokePath.node().getBoundingClientRect());
    // console.log(strokePath.attr("boundingClientRect"));

    // Call the callback
    if (this.penUpCallback != undefined) {
      this.penUpCallback(strokePath.node(), this._currPointerEvent);
    }
  }

  _onErase(eraserHandle, eraserCoords) {
    if (this._currPointerEvent.pointerType != "touch") {
      let updateEraser = true;
      let [x, y] = this._getMousePos(this._currPointerEvent);

      // Move the eraser icon
      eraserHandle.attr("cx", x);
      eraserHandle.attr("cy", y);

      // Get the distance from the last coordinates, if the distance is too small - dont update the eraser
      // Prevents multiple events being called at the same spot
      let [lastX, lastY] = eraserCoords.slice(-1)[0];
      let dist = MathExtas.getDist(lastX, lastY, x, y);
      if (dist < this.eraserParam.eraserSize / 2) updateEraser = false;

      if (updateEraser) {
        // Add the points
        eraserCoords.push([x, y]);

        switch (this.eraserParam.eraserMode) {
          case "stroke":
            // Remove any paths in the way
            let removedPaths = this.removePaths(
              x,
              y,
              this.eraserParam.eraserSize
            );
            break;
          case "pixel":
            this.editPaths(x, y, this.eraserParam.eraserSize);
            break;
          default:
            console.error("ERROR: INVALID ERASER MODE");
            break;
        }
      }

      if (this.eraserDownCallback != undefined) {
        this.eraserDownCallback([], this._currPointerEvent);
      }
    }
  }

  _stopErase(eraserHandle) {
    // Remove the eraser icon and add the cursor
    eraserHandle.remove();
    this._element.style("cursor", null);

    // Remove the event handlers
    this._element.on("pointermove", null);
    this._element.on("pointerup", null);
    this._element.on("pointerleave", null);
    // Call the callback
    if (this.eraserUpCallback != undefined) {
      this.eraserUpCallback(this._currPointerEvent);
    }
  }
}
