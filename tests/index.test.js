let SvgPenSketch = require("../dist/svg-pen-sketch.js").default;

// Set up our document body
document.body.innerHTML = ` 
<div>
    <svg></svg>
</div>
`;

test("Initialize the class with a DOM element", () => {
    expect(typeof (new SvgPenSketch(document.querySelector("svg")))).toBe("object");
});

test("Catch improper class initialization", () => {
    try {
        new SvgPenSketch("test");
        // Fail the test if the above code doesn't throw a error
        expect(true).toBe(false);
    } catch (e) {
        expect(e.message).toBe("svg-pen-sketch needs a svg element in the constructor to work");
    }
});

test("Get the DOM element from the class", () => {
    let tmp = new SvgPenSketch(document.querySelector("svg"));
    expect(tmp.getElement().nodeType).toBe(1);
});

test("Try getting a path at (x,y) from the svg canvas", () => {
    let tmp = new SvgPenSketch(document.querySelector("svg"));
    // We have to fake the elementsFromPoint function since this isn't a browser
    document.elementsFromPoint = (x,y) => {
        return [{nodeName : "other"},{nodeName : "path"}];
    };
    expect(tmp.getPathsAtPoint(0,0).length).toBe(1);
});

test("Try getting a non-existent path at (x,y) from the svg canvas", () => {
    let tmp = new SvgPenSketch(document.querySelector("svg"));
    // We have to fake the elementsFromPoint function since this isn't a browser
    document.elementsFromPoint = (x,y) => {
        return [];
    };
    expect(tmp.getPathsAtPoint(0,0).length).toBe(0);
});

test("Try removing a path from the svg canvas", () => {
    let svg = document.querySelector("svg");
    let tmp = new SvgPenSketch(svg);
    svg.innerHTML = `<path d="M10 10"/>`
    // We have to fake the elementsFromPoint function since this isn't a browser
    document.elementsFromPoint = (x,y) => {
        return document.querySelectorAll("svg path");
    };
    expect(tmp.removePaths(0,0).length).toBe(1);
});

test("Try removing a non-existent path from the svg canvas", () => {
    let tmp = new SvgPenSketch(document.querySelector("svg"));
    // We have to fake the elementsFromPoint function since this isn't a browser
    document.elementsFromPoint = (x,y) => {
        return [];
    };
    expect(tmp.removePaths(0,0).length).toBe(0);
});