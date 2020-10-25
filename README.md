# svg-pen-sketch
An easy-to-use JavaScript library aimed at making it easier to draw on SVG elements when using a digital pen (such as the Surface Pen). 

<a href="https://www.npmjs.com/package/svg-pen-sketch">
    <img src="https://img.shields.io/npm/v/svg-pen-sketch?style=flat-square">
</a>

<a href="https://github.com/Desousak/svg-pen-sketch/actions?query=workflow%3A%22Node.js+CI%22">
    <img src="https://img.shields.io/github/workflow/status/Desousak/svg-pen-sketch/Node.js%20CI?style=flat-square">
</a>

## How to use 
(Importing as a node module)
```javascript
import svgSketch from "svg-pen-sketch";

// Prep the svg element to be drawn on (custom path styles and parameters can be passed in optionally)
const strokeStyle =  {"stroke": "red", "stroke-width": "10px"};
const strokeParam = {"lineFunc": (points) => {return "M0 0 L1 1 L2 2"}, "minDist": 10};
const canvas = new svgSketch(document.querySelector("svg"), strokeStyle, strokeParam);

// The svg element that is being used can be returned with getElement()
canvas.getElement();

// The parameters of the paths can be updated by updating their respective objects
// NOTE: This will only affect new strokes drawn
canvas.strokeStyles = {"stroke": "black", "stroke-width": "1px"};
canvas.strokeParam = {"lineFunc": (points) => {return "M100 100 L0 0 L50 50"}, "minDist": 0};

// Callbacks can be set for various events
canvas.penDownCallback = (path, event) => {};
canvas.penUpCallback = (path, event) => {};

// Same can be done for the eraser end of a pen (if it has one)
canvas.eraserDownCallback = (removedPaths, event) => {};
canvas.eraserUpCallback = (event) => {};

// Toggles the use of the eraser
// Useful for when certain pens dont support the eraser
canvas.toggleForcedEraser();
```

(Including the source in your project)

```html
<body>
    <script src="https://cdn.jsdelivr.net/npm/svg-pen-sketch"></script>
    <script> 
        let svgSketch = SvgPenSketch.default;

        // Prep the svg element to be drawn on (custom path styles and parameters can be passed in optionally)
        const strokeStyle =  {"stroke": "red", "stroke-width": "10px"};
        const strokeParam = {"lineFunc": (points) => {return "M0 0 L1 1 L2 2"}, "minDist": 10};
        const canvas = new svgSketch(document.querySelector("svg"), strokeStyle, strokeParam);

        // The svg element that is being used can be returned with getElement()
        canvas.getElement();

        // The parameters of the paths can be updated by updating their respective objects
        // NOTE: This will only affect new strokes drawn
        canvas.strokeStyles = {"stroke": "black", "stroke-width": "1px"};
        canvas.strokeParam = {"lineFunc": (points) => {return "M100 100 L0 0 L50 50"}, "minDist": 0};

        // Callbacks can be set for various events
        canvas.penDownCallback = (path, event) => {};
        canvas.penUpCallback = (path, event) => {};

        // Same can be done for the eraser end of a pen (if it has one)
        canvas.eraserDownCallback = (removedPaths, event) => {};
        canvas.eraserUpCallback = (event) => {};

        // Toggles the use of the eraser
        // Useful for when certain pens dont support the eraser
        canvas.toggleForcedEraser();
    </script>
</body>
```

## Parameters:
### Stroke Styles:
- Any CSS style can be applied by adding the style name, and value, in the `strokeStyles` object
### Stroke Parameters:
- `lineFunc`: The screen coordinate to SVG Path function - can be overwritten to introduce functionality such as the use of splines (the function is given a array of coordinates)
- `minDist`: The minimum distance between the last and current points before the stroke is updated (can be increased to improve performance on weaker devices)

## Build Instructions
1) Clone the repository and run `npm install`
2) Run `npm run build` to generate a development build 
3) Run `npm run test` to generate and test a build (uses the tests located in `tests/`)

#### _Demos can be found in the `demos/` folder - make sure you build the project at least once before running them_ ####

## Todo
- More tests need to be made
- Try to fix the issue with strokes being cut off if the screen is resized
- ~~Add some error checking for the element passed in the constructor~~
- ~~Add some options to change stroke styles~~

