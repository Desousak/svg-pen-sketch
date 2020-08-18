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

    // Not being used at the moment
    resizeCanvas() {
        let bbox = this._element.node().getBoundingClientRect();
        this._element.attr("viewBox", "0 0 " + bbox.width + " " + bbox.height);
    }

    getPathAtPoint(x, y) {
        // Get any paths at a specified x and y location
        let elements = document.elementsFromPoint(x, y);
        for (let element of elements) {
            if (element.nodeName === "path") return element;
        }
        return undefined;
    }

    removePath(x, y) {
        // Removes a stroke at coordinates (x,y) 
        let strokePath = this.getPathAtPoint(x, y);
        if (strokePath != undefined) {
            let pathToRemove = d3.select(strokePath);
            pathToRemove.remove();
            return pathToRemove.node();
        }
        return null;
    }

    // Private functions
    _handlePointer() {
        // If the pointer is a pen - prevent the touch event
        if (d3.event.pointerType == "touch") {
            this._isPen = false;
        } else {
            this._isPen = true;
        }

        // Determine if the pen tip or eraser is being used
        switch (d3.event.button) {
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
                this._element.on("pointermove", _ => this._onDraw(strokePath, penCoords));
                this._element.on("pointerup", _ => this._stopDraw(strokePath));
                this._element.on("pointerleave", _ => this._stopDraw(strokePath));
                break;

            // Eraser
            case (5):
                // Create the erase event handlers
                this._element.on("pointermove", _ => this._onErase());
                this._element.on("pointerup", _ => this._stopErase());
                this._element.on("pointerleave", _ => this._stopErase());
                break;
        }
    }

    _onDraw(strokePath, penCoords) {
        if (d3.event.pointerType != "touch") {
            let canvasContainer = this.getElement().getBoundingClientRect();

            // Calculate the offset using the page location and the canvas' offset (also taking scroll into account)
            let x = d3.event.pageX - canvasContainer.x - document.scrollingElement.scrollLeft,
                y = d3.event.pageY - canvasContainer.y - document.scrollingElement.scrollTop;

            // Add the points to the path
            penCoords.push([x, y]);
            strokePath.attr('d', this._lineFunc(penCoords));
            
            // Call the callback
            if (this.penDownCallback != undefined) {
                this.penDownCallback(strokePath.node(), d3.event);
            }
        }
    }

    _stopDraw(strokePath) {
        // Remove the event handlers
        this._element.on("pointermove", null);
        this._element.on("pointerup", null);
        this._element.on("pointerleave", null);
        // Call the callback
        if (this.penUpCallback != undefined) {
            this.penUpCallback(strokePath.node(), d3.event);
        }
    }

    _onErase() {
        // Remove any paths in the way
        let removedPath = this.removePath(d3.event.pageX, d3.event.pageY);

        if (this.eraserDownCallback != undefined) {
            this.eraserDownCallback(removedPath, d3.event);
        }
    }

    _stopErase() {
        this._element.on("pointermove", null);
        this._element.on("pointerup", null);
        this._element.on("pointerleave", null);

        if (this.eraserUpCallback != undefined) {
            this.eraserUpCallback(d3.event);
        }
    }
}