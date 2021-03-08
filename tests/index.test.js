let SvgPenSketch = require("../dist/svg-pen-sketch.js").default;

// Set up our document body
document.body.innerHTML = ` 
<div>
    <svg></svg>
</div>
`;

test("Initialize the class with a DOM element", () => {
  expect(typeof new SvgPenSketch(document.querySelector("svg"))).toBe("object");
});

test("Catch improper class initialization", () => {
  try {
    new SvgPenSketch("test");
    // Fail the test if the above code doesn't throw a error
    expect(true).toBe(false);
  } catch (e) {
    expect(e.message).toBe(
      "svg-pen-sketch needs a svg element in the constructor to work"
    );
  }
});

test("Get the DOM element from the class", () => {
  let tmp = new SvgPenSketch(document.querySelector("svg"));
  expect(tmp.getElement().nodeType).toBe(1);
});

test("Try getting a path at (x,y) from the svg canvas", () => {
  let tmp = new SvgPenSketch(document.querySelector("svg"));
  // We have to fake the querySelectorAll function since this isn't a browser
  tmp._element.node().querySelectorAll = (_) => {
    return [
      {
        _boundingClientRect: {
          height: 100,
          width: 100,
          x: 0,
          y: 0,
        },
      },
    ];
  };
  expect(tmp.getPathsinRange(0, 0).length).toBe(1);
});

test("Try getting a non-existent path at (x,y) from the svg canvas", () => {
  let tmp = new SvgPenSketch(document.querySelector("svg"));
  // We have to fake the querySelectorAll function since this isn't a browser
  tmp._element.node().querySelectorAll = (_) => {
    return [
      {
        _boundingClientRect: {
          height: 1000,
          width: 1000,
          x: 1000,
          y: 1000,
        },
      },
    ];
  };
  expect(tmp.getPathsinRange(0, 0).length).toBe(0);
});

test("Try removing a path from the svg canvas", () => {
  let svg = document.querySelector("svg");
  let tmp = new SvgPenSketch(svg);
  svg.innerHTML = `<path d="M0 0 L 20 20"/>`;
  // We have to fake the querySelectorAll function since this isn't a browser
  tmp._element.node().querySelectorAll = (_) => {
    return [
      {
        _boundingClientRect: {
          height: 20,
          width: 20,
          x: 0,
          y: 0,
        },
        getAttribute: _ => {
            return "M0 0 M10 10 L 20 20";
        }
      },
    ];
  };
  expect(tmp.removePaths(10, 10).length).toBe(1);
});

test("Try removing a non-existent path from the svg canvas", () => {
  let svg = document.querySelector("svg");
  let tmp = new SvgPenSketch(svg);
  svg.innerHTML = `<path d="M0 0 L 20 20"/>`;
  // We have to fake the querySelectorAll function since this isn't a browser
  tmp._element.node().querySelectorAll = (_) => {
    return [
      {
        _boundingClientRect: {
          height: 20,
          width: 20,
          x: 0,
          y: 0,
        },
        getAttribute: _ => {
            return "M0 0 M10 10 L 20 20";
        }
      },
    ];
  };
  expect(tmp.removePaths(100, 100).length).toBe(0);
});
