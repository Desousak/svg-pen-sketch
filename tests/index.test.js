let SvgPenSketch = require("../dist/svg-pen-sketch.js").default;

// Set up our document body
document.body.innerHTML = ` 
<div>
    <svg id="svgTest"></svg>
</div>
`;

test("Initialize the class with a DOM element", () => {
    expect(typeof (new SvgPenSketch(document.getElementById("svgTest")))).toBe("object");
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
    let tmp = new SvgPenSketch(document.getElementById("svgTest"));
    expect(tmp.getElement().nodeType).toBe(1);
});

test("Try getting a path at (x,y) from the svg canvas", () => {
    let tmp = new SvgPenSketch(document.getElementById("svgTest"));
    // We have to fake the elementsFromPoint function since this isn't a browser
    document.elementsFromPoint = (x,y) => {
        return [{nodeName : "other"},{nodeName : "path"}];
    };
    expect(tmp.getPathAtPoint(0,0).nodeName).toBe("path");
});

test("Try getting a non-existent path at (x,y) from the svg canvas (should return undefined)", () => {
    let tmp = new SvgPenSketch(document.getElementById("svgTest"));
    // We have to fake the elementsFromPoint function since this isn't a browser
    document.elementsFromPoint = (x,y) => {
        return [];
    };
    expect(tmp.getPathAtPoint(0,0)).toBe(undefined);
});

test("Try removing a a path from the svg canvas (should return undefined)", () => {
    let tmp = new SvgPenSketch(document.getElementById("svgTest"));
    // We have to fake the elementsFromPoint function since this isn't a browser
    document.elementsFromPoint = (x,y) => {
        return [];
    };
    expect(tmp.getPathAtPoint(0,0)).toBe(undefined);
});