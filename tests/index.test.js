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