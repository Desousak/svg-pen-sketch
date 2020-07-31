# svg-pen-sketch
An easy-to-use JavaScript library aimed at making it easier to draw on SVG elements when using a digital pen (such as the Surface Pen). 

<img src="https://img.shields.io/npm/v/svg-pen-sketch?style=flat-square">

## How to use 
(Importing as a node module)
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

(Including the source in your project)

```html
<body>
    <script src="https://cdn.jsdelivr.net/npm/svg-pen-sketch"></script>
    <script> 
        let svgSketch = SvgPenSketch.default;
        
        // Prep the svg element to be drawn on  
        const canvas = new svgSketch(document.querySelector("svg"));

        // Callbacks can be set for various events
        canvas.penDownCallback = (path, event) => {};
        canvas.penUpCallback = (path, event) => {};

        // Same can be done for the eraser end of a pen (if it has one)
        canvas.eraserDownCallback = (removedPath, event) => {};
        canvas.eraserUpCallback = (event) => {};
    </script>
</body>
```

## Todo
- Tests need to be made
- Add some error checking for the element passed in the constructor
- Add some options to change stroke styles

