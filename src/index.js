import * as d3 from "d3";
import "./index.css";

export default class SvgPenSketch {
    constructor(element = null, strokeStyles = { "stroke": "black", "stroke-width": "1px" }) {
        // If the element is a valid 
        if (element != null && typeof (element) === "object" && element.nodeType) {
            // Private variables
            // The root SVG element
            this._element = d3.select(element);
            // Line function for drawing
            this._lineFunc = d3.line()
                .x((d) => d[0])
                .y((d) => d[1])
                .curve(d3.curveBasis);
            // Variable for if the pointer event is a pen
            this._isPen = false;
            // Resize the canvas viewbox on window resize
            // TODO: Need to implement a proper fix to allow paths to scale 
            // window.onresize = _ => {
            //     this.resizeCanvas();
            // };
            // Prep the canvas for drawing
            this._element.on("pointerdown", _ => this._handlePointer());
            // Stop touch scrolling
            this._element.on("touchstart", _ => {
                if (this._isPen) d3.event.preventDefault();
            });

            // Public variables
            // Forces the use of the eraser - even if the pen isn't tilted over
            this.forceEraser = false;
            // Styles for the stroke
            this.strokeStyles = { ...strokeStyles };
            // Pen Callbacks
            this.penDownCallback = _ => { };
            this.penUpCallback = _ => { };
            // Eraser Callbacks
            this.eraserDownCallback = _ => { };
            this.eraserUpCallback = _ => { };
        } else {
            throw new Error("svg-pen-sketch needs a svg element in the constructor to work");
        }
    }

    // Public functions
    getElement() { return this._element.node(); }
    toggleForcedEraser() { this.forceEraser = !this.forceEraser; }

    // Not being used at the moment
    resizeCanvas() {
        let bbox = this._element.node().getBoundingClientRect();
        this._element.attr("viewBox", "0 0 " + bbox.width + " " + bbox.height);
    }

    getPathsAtPoint(x, y) {
        // Get any paths at a specified x and y location
        let elements = document.elementsFromPoint(x, y);
        let paths = [];
        for (let element of elements) {
            if (element.nodeName === "path") paths.push(element);
        }
        return paths;
    }

    removePaths(x, y, eraserSize = 1) {
        let removedPathIDs = [];
        eraserSize -= 1;

        if (eraserSize >= 0) {
            // Iterate through a (eraserSize)x(eraserSize) grid with the mouse-pos as the center
            for (let newX = x - eraserSize; newX <= x + eraserSize; newX++) {
                for (let newY = y - eraserSize; newY <= y + eraserSize; newY++) {
                    // Removes a stroke at coordinates (x,y) 
                    let strokePaths = this.getPathsAtPoint(newX, newY);
                    for (let path of strokePaths) {
                        let pathToRemove = d3.select(path);
                        removedPathIDs.push(pathToRemove.attr("id"));
                        pathToRemove.remove();
                    }
                }
            }
        }
        return removedPathIDs;
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
            switch (pointerButton) {
                // Pen
                default:
                case (0):
                    // Create the path/coordinate arrays and set event handlers
                    let penCoords = [];
                    let strokePath = this._element.append("path");

                    // Generate a random ID for the stroke
                    let strokeID = Math.random().toString(32).substr(2, 9);
                    strokePath.attr("id", strokeID);

                    // Apply all user-desired styles
                    for (let styleName in this.strokeStyles) {
                        strokePath.style(styleName, this.strokeStyles[styleName]);
                    }

                    // Create the drawing event handlers
                    this._element.on("pointermove", _ => this._onDraw(d3.event, strokePath, penCoords));
                    this._element.on("pointerup", _ => this._stopDraw(d3.event, strokePath));
                    this._element.on("pointerleave", _ => this._stopDraw(d3.event, strokePath));
                    break;

                // Eraser
                case (5):
                    // Create the erase event handlers
                    this._element.on("pointermove", _ => this._onErase(d3.event));
                    this._element.on("pointerup", _ => this._stopErase(d3.event));
                    this._element.on("pointerleave", _ => this._stopErase(d3.event));
                    break;
            }
        }
    }

    _getMousePos(event) {
        let canvasContainer = this.getElement().getBoundingClientRect();

        // Calculate the offset using the page location and the canvas' offset (also taking scroll into account)
        let x = event.pageX - canvasContainer.x - document.scrollingElement.scrollLeft,
            y = event.pageY - canvasContainer.y - document.scrollingElement.scrollTop;

        return [x, y];
    }

    _onDraw(event, strokePath, penCoords) {
        if (event.pointerType != "touch") {
            let [x, y] = this._getMousePos(event);

            // Add the points to the path
            penCoords.push([x, y]);
            strokePath.attr('d', this._lineFunc(penCoords));

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

    _onErase(event) {
        if (event.pointerType != "touch") {
            let x = event.clientX,
                y = event.clientY;

            // Remove any paths in the way
            // TODO: Make this user-customizable 
            let removedPaths = this.removePaths(x, y, 10);

            if (this.eraserDownCallback != undefined) {
                this.eraserDownCallback(removedPaths, event);
            }
        }
    }

    _stopErase(event) {
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