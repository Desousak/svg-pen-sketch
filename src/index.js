import * as d3 from "d3";
import { path } from "d3";
import MathExtas from "./MathExtras.js";
import PathExtras from "./PathExtras.js";

// Default settings
const defStrokeParam = {
  // Line function for drawing (must convert coordinates to a valid path string)
  lineFunc: PathExtras.coordsToPath,
  // Minimum distance between points that is allowed (longer will be interpolated)
  minDist: 2,
  // Max time between events (done to somewhat keep a stable sample rate)
  maxTimeDelta: 5,
};

const defEraserParam = {
  eraserMode: "object", // Can use "object" or "pixel"
  eraserSize: 20, // NOTE: Small eraser sizes will cause skipping isses - will need to be fixed
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
      // Handles scaling of parent components
      this.parentScale = 1;
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

  // Gets the path elements in a specified range
  // Uses their bounding boxes, so we can't tell if we're actually hitting the stroke with this
  // Just to determine if a stroke is close
  getPathsinRange(x, y, range = 1) {
    // The eraser bounds
    let x1 = x - range,
      x2 = x + range,
      y1 = y - range,
      y2 = y + range;
    let paths = [];

    for (let path of this._element.node().querySelectorAll("path")) {
      // Get the bounding boxes for all elements on page
      let bbox = PathExtras.getCachedPathBBox(path);

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

  // Remove a stroke if it's within range and the mouse is over it
  removePaths(x, y, eraserSize = 1) {
    // Prep variables
    let removedPathIDs = [];

    // Get paths in the eraser's range
    let paths = this.getPathsinRange(x, y, eraserSize);

    // For each path found, remove it
    for (let path of paths) {
      let pathCoords = PathExtras.pathToCoords(path.getAttribute("d"));
      if (
        PathExtras.pathCoordHitTest(pathCoords, x, y, eraserSize).length > 0
      ) {
        let pathToRemove = d3.select(path);
        removedPathIDs.push(pathToRemove.attr("id"));
        pathToRemove.remove();
      }
    }
    return removedPathIDs;
  }

  // Edit (erase) a portion of a stroke
  erasePaths(x, y, eraserSize = 1) {
    // The paths within the bounds
    let paths = this.getPathsinRange(x, y, eraserSize);

    // The resultant edited paths
    let pathElements = [];

    for (let originalPath of paths) {
      let pathCoords = PathExtras.pathToCoords(originalPath.getAttribute("d"));

      let newPaths = []; // The series of stroke coordinates to add
      let indicies = PathExtras.pathCoordHitTest(pathCoords, x, y, eraserSize);

      if (indicies.length > 0) {
        // Add the path before the eraser
        newPaths.push(pathCoords.slice(0, indicies[0]));
        // Add the in-between parts of the edited path
        for (let i = 0; i < indicies.length - 1; i++) {
          if (indicies[i + 1] - indicies[i] > 1) {
            newPaths.push(pathCoords.slice(indicies[i], indicies[i + 1]));
          }
        }
        // Add the path after the eraser
        newPaths.push(
          pathCoords.slice(indicies[indicies.length - 1] + 1, pathCoords.length)
        );

        // Remove paths of only 1 coordinate
        newPaths = newPaths.filter((p) => (p.length > 2 ? true : false));

        // Add the new paths if they have two or more sets of coordinates
        // Prevents empty paths from being added
        for (let newPath of newPaths) {
          let strokePath = this._createPath();

          // Copy the styles of the original stroke
          strokePath.attr("d", this.strokeParam.lineFunc(newPath));
          strokePath.attr("style", originalPath.getAttribute("style"));
          strokePath.attr("class", originalPath.getAttribute("class"));
          pathElements.push(strokePath.node());
        }

        // Remove the original path
        originalPath.remove();
      }
    }

    return pathElements;
  }

  // Private functions
  _createEraserHandle(x, y) {
    // Prep the eraser hover element
    this._eraserHandle = this._element.append("rect");
    this._eraserHandle.attr("class", "eraserHandle");
    this._eraserHandle.attr("width", this.eraserParam.eraserSize);
    this._eraserHandle.attr("height", this.eraserParam.eraserSize);
    this._eraserHandle.attr("x", x - this.eraserParam.eraserSize / 2);
    this._eraserHandle.attr("y", y - this.eraserParam.eraserSize / 2);

    // Hide the mouse cursor
    this._element.style("cursor", "none");

    // Apply all user-desired styles
    for (let styleName in this.eraserStyles) {
      this._eraserHandle.style(styleName, this.eraserStyles[styleName]);
    }
  }

  _moveEraserHandle(x, y) {
    if (this._eraserHandle) {
      this._eraserHandle.attr("x", x - this.eraserParam.eraserSize / 2);
      this._eraserHandle.attr("y", y - this.eraserParam.eraserSize / 2);
    }
  }

  _removeEraserHandle() {
    if (this._eraserHandle) {
      this._eraserHandle.remove();
      this._eraserHandle = null;
      this._element.style("cursor", null);
    }
  }

  // Handles the different pointers
  // Also allows for pens to be used on modern browsers
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
            this._handleDownEvent((_) => this._onDraw(strokePath, penCoords))
          );
          this._element.on("pointerup", (_) =>
            this._handleUpEvent((_) => this._stopDraw(strokePath, penCoords))
          );
          this._element.on("pointerleave", (_) =>
            this._handleUpEvent((_) => this._stopDraw(strokePath, penCoords))
          );
          break;

        // Eraser
        default:
        case 5:
          // Create the location arrays
          let [x, y] = this._getMousePos(d3.event);
          let eraserCoords = [[x, y]];

          // Create the eraser handle
          this._createEraserHandle(x, y);

          // Call the eraser event once for the initial on-click
          this._handleDownEvent((_) => this._onErase(eraserCoords));

          // Create the erase event handlers
          this._element.on("pointermove", (_) => {
            this._handleDownEvent((_) => this._onErase(eraserCoords));
          });
          this._element.on("pointerup", (_) =>
            this._handleUpEvent((_) => this._stopErase())
          );
          this._element.on("pointerleave", (_) =>
            this._handleUpEvent((_) => this._stopErase())
          );
          break;
      }
    }
  }

  // Creates a new pointer event that can be modified
  _createEvent() {
    let newEvent = {};
    let features = [
      "screenX",
      "screenY",
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
  // Also interpolates between events if needed to keep a particular sample rate
  _handleDownEvent(callback) {
    if (this._prevPointerEvent) {
      let timeDelta = d3.event.timeStamp - this._prevPointerEvent.timeStamp;

      if (timeDelta > this.strokeParam.maxTimeDelta * 2) {
        // Calculate how many interpolated samples we need
        let numSteps =
          Math.floor(timeDelta / this.strokeParam.maxTimeDelta) + 1;
        let step = timeDelta / numSteps / timeDelta;

        // For each step
        for (let i = step; i < 1; i += step) {
          // Make a new event based on the current event
          let newEvent = this._createEvent();
          for (let feat in newEvent) {
            // For every feature (that is a number)
            if (!isNaN(parseFloat(newEvent[feat]))) {
              // Linearly interpolate it
              newEvent[feat] = MathExtas.lerp(
                this._prevPointerEvent[feat],
                newEvent[feat],
                i
              );
            }
          }
          // Set it and call the callback
          this._currPointerEvent = newEvent;
          callback();
        }
      }
    }

    // Call the proper callback with the "real" event
    this._currPointerEvent = this._createEvent();
    callback();
    this._prevPointerEvent = this._currPointerEvent;
  }

  // Handles the removal of this._currPointerEvent and this._prevPointerEvent
  _handleUpEvent(callback) {
    // Run the up callback
    this._currPointerEvent = this._createEvent();
    callback();

    // Cleanup the previous pointer events
    this._prevPointerEvent = null;
    this._currPointerEvent = null;
  }

  // Creates a new path on the screen
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

  // Gets the mouse position on the canvas
  _getMousePos(event) {
    let canvasContainer = this.getElement().getBoundingClientRect();

    // Calculate the offset using the page location and the canvas' offset (also taking scroll into account)
    let x =
        (event.pageX - canvasContainer.x) / this.parentScale - document.scrollingElement.scrollLeft,
      y = (event.pageY - canvasContainer.y) / this.parentScale - document.scrollingElement.scrollTop;

    return [x, y];
  }

  // Handle the drawing
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

  // Interpolate coordinates in the paths in order to keep a min distance
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
    strokePath.attr("d", this.strokeParam.lineFunc(newPath));
  }

  // Stop the drawing
  _stopDraw(strokePath, penCoords) {
    // Remove the event handlers
    this._element.on("pointermove", null);
    this._element.on("pointerup", null);
    this._element.on("pointerleave", null);

    // Interpolate the path if needed
    this._interpolateStroke(strokePath, penCoords);

    // Call the callback
    if (this.penUpCallback != undefined) {
      this.penUpCallback(strokePath.node(), this._currPointerEvent);
    }
  }

  // Handle the erasing
  _onErase(eraserCoords) {
    if (this._currPointerEvent.pointerType != "touch") {
      let [x, y] = this._getMousePos(this._currPointerEvent);
      let affectedPaths = null;

      // Move the eraser cursor
      this._moveEraserHandle(x, y);

      // Add the points
      eraserCoords.push([x, y]);

      switch (this.eraserParam.eraserMode) {
        case "object":
          // Remove any paths in the way
          affectedPaths = this.removePaths(
            x,
            y,
            this.eraserParam.eraserSize / 2
          );
          break;
        case "pixel":
          affectedPaths = this.erasePaths(
            x,
            y,
            this.eraserParam.eraserSize / 2
          );
          break;
        default:
          console.error("ERROR: INVALID ERASER MODE");
          break;
      }

      if (this.eraserDownCallback != undefined) {
        this.eraserDownCallback(affectedPaths, this._currPointerEvent);
      }
    }
  }

  // Stop the erasing
  _stopErase() {
    // Remove the eraser icon and add the cursor
    this._removeEraserHandle();

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
