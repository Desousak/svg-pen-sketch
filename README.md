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

// Prep the svg element to be drawn on (custom path styles can be passed in optionally)

const strokeStyle =  {"stroke": "red", "stroke-width": "10px"};
const canvas = new svgSketch(document.querySelector("svg"), strokeStyle);

// The svg element that is being used can be returned with getElement()
canvas.getElement();

// The styling of the paths can be updated by updating the strokeStyles object
// NOTE: This will only affect new strokes drawn
canvas.strokeStyles = {"stroke": "black", "stroke-width": "1px"};

// Callbacks can be set for various events
canvas.penDownCallback = (path, event) => {};
canvas.penUpCallback = (path, event) => {};

// Same can be done for the eraser end of a pen (if it has one)
canvas.eraserDownCallback = (editedPaths, event) => {};
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

        // Prep the svg element to be drawn on (custom path styles can be passed in optionally)
        const strokeStyle =  {"stroke": "red", "stroke-width": "10px"};
        const canvas = new svgSketch(document.querySelector("svg"), strokeStyle);

        // The svg element that is being used can be returned with getElement()
        canvas.getElement();

        // The styling of the paths can be updated by updating the strokeStyles object
        // NOTE: This will only affect new strokes drawn
        canvas.strokeStyles = {"stroke": "black", "stroke-width": "1px"};

        // Callbacks can be set for various events
        canvas.penDownCallback = (path, event) => {};
        canvas.penUpCallback = (path, event) => {};

        // Same can be done for the eraser end of a pen (if it has one)
        canvas.eraserDownCallback = (editedPaths, event) => {};
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
- `lineFunc`: A function that converts screen coordinates to an SVG Path - can be overwritten to introduce functionality such as the use of splines (various other D3 curve functions can be found <a href="http://bl.ocks.org/d3indepth/b6d4845973089bc1012dec1674d3aff8">here</a>)
- `minDist`: The minimum distance that is allowed between strokes (smaller values preferred for pixel-eraser functionality - but can be slow)
- `maxTimeDelta`: The maximum time allowed between samples (done to keep a stable sample rate somewhat). Keep in mind this is a ___maximum___, and quicker events can still occur.

## Eraser Parameters
- `eraserMode`: Which eraser mode to use when erasing. Currently supports `"object"` and `"pixel"` for the object and pixel erasers, respectively
- `eraserSize`: The size of the eraser handle. Note that small eraser sizes (i.e. 1) can cause skipping issues - it will be addressed in later versions)

## Build Instructions
1) Clone the repository and run `npm install`
2) Run `npm run build` to generate a development build 
3) Run `npm run test` to generate and test a build (uses the tests located in `tests/`)

#### _Demos can be found in the `demos/` folder - make sure you build the project at least once before running them_ ####

## Todo
- More tests need to be made
- Fix stroke recognition issues for the eraser (some portions of strokes are being missed)
- Try to fix the issue with strokes being cut off if the screen is resized
- ~~Add some error checking for the element passed in the constructor~~
- ~~Add some options to change stroke styles~~