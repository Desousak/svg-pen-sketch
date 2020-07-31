import * as d3 from "d3";

export default class Canvas {
    constructor(element = null) {
        if (element === null) {
            console.error("CanvasDrawJS needs a svg element in the constructor to work");
        } else {
            this._element = d3.select(element);

            // Pen Callbacks
            this.penDownCallback = _ => { };
            this.penUpCallback = _ => { };

            // Eraser Callbacks
            this.eraserDownCallback = _ => { };
            this.eraserUpCallback = _ => { };

            // Line function for drawing
            this._lineFunc = d3.line()
                .x((d) => d[0])
                .y((d) => d[1])
                .curve(d3.curveBasis);

            // Variable for if the pointer event is a pen
            this._isPen = false;

            // Resize the canvas viewbox on window resize
            window.onresize = _ => {
                this.resizeCanvas()
            };

            // Prep the canvas for drawing
            this._element.on("pointerdown", _ => this.handlePointer());

            // Stop touch scrolling
            this._element.on("touchstart", _ => {
                if (this._isPen) d3.event.preventDefault();
            });
        }
    }

    getElement() { return this._element.node(); }

    resizeCanvas() {
        let bbox = this._element.node().getBoundingClientRect();
        this._element.attr("viewBox", "0 0 " + bbox.width + " " + bbox.height);
    }

    getPathAtPoint(x, y) {
        // Get any paths at a specified x and y location
        let elements = document.elementsFromPoint(x, y);
        for (let element of elements) {
            if (element.nodeName == "path") {
                return element;
            }
        }
        return undefined;
    }

    removePath(x, y) {
        // Removes a stroke at coordinates (x,y) 
        let strokePath = this.getPathAtPoint(x, y);
        if (strokePath != undefined) {
            d3.select(strokePath).remove();
            return true;
        }
        return false;
    }

    handlePointer() {
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
                let strokePath = this._element.append("path")
                    .style("stroke", "red")
                    .style("stroke-width", "1px");

                // Create the drawing event handlers
                this._element.on("pointermove", _ => this.onDraw(strokePath, penCoords));
                this._element.on("pointerup", _ => this.stopDraw(strokePath));
                this._element.on("pointerleave", _ => this.stopDraw(strokePath));
                break;

            // Eraser
            case (5):
                // Create the erase event handlers
                this._element.on("pointermove", _ => this.onErase());
                this._element.on("pointerup", _ => this.stopErase());
                this._element.on("pointerleave", _ => this.stopErase());
                break;
        }
    }

    onDraw(strokePath, penCoords) {
        if (d3.event.pointerType != "touch") {
            // Add the points to the path
            penCoords.push([d3.event.offsetX, d3.event.offsetY]);
            strokePath.attr('d', this._lineFunc(penCoords));
            // Call the callback
            if (this.penDownCallback != undefined) {
                this.penDownCallback(strokePath.node(), d3.event);
            }
        }
    }

    stopDraw(strokePath) {
        // Remove the event handlers
        this._element.on("pointermove", null);
        this._element.on("pointerup", null);
        this._element.on("pointerleave", null);
        // Call the callback
        if (this.penUpCallback != undefined) {
            this.penUpCallback(strokePath.node(), d3.event);
        }
    }

    onErase() {
        // Remove any paths in the way
        let removedPath = this.removePath(d3.event.pageX, d3.event.pageY);

        if (this.eraserDownCallback != undefined) {
            this.eraserDownCallback(removedPath, d3.event);
        }
    }

    stopErase() {
        this._element.on("pointermove", null);
        this._element.on("pointerup", null);
        this._element.on("pointerleave", null);

        if (this.eraserUpCallback != undefined) {
            this.eraserUpCallback(d3.event);
        }
    }
}