# svg-pen-sketch
An easy-to-use JavaScript library aimed at making it easier to draw on SVG elements when using a digital pen (such as the Surface Pen). 

## How to use
```javascript
import svgSketch from "svg-pen-sketch";

// Prep the svg element to be drawn on
const canvas = new svgSketch(document.querySelector("svg"));


// Callbacks can be set for various events
canvas.penDownCallback = (path, event) => {};
canvas.penUpCallback = (path, event) => {};

// Same can be done for the eraser end of a pen (if it has one)
canvas.eraserDownCallback = (removedPath, event) => {};
canvas.eraserUpCallback = (event) => {};
```

## Todo
- Tests need to be made

<br>
<img src="https://img.shields.io/npm/v/svg-pen-sketch?style=flat-square">