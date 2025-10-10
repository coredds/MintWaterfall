// Test setup file
// Polyfills for Node.js environment
global.TextEncoder = require("util").TextEncoder;
global.TextDecoder = require("util").TextDecoder;

const { JSDOM } = require("jsdom");

// Create a fake DOM for testing
const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
  url: "http://localhost",
  pretendToBeVisual: true,
  resources: "usable"
});

// Set up global objects
global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;

// Mock D3.js for testing
const d3Mock = require("./__mocks__/d3.js");
global.d3 = d3Mock;
global.d3 = {
  select: jest.fn(() => ({
    selectAll: jest.fn(() => ({
      data: jest.fn(() => ({
        enter: jest.fn(() => ({
          append: jest.fn(() => ({
            attr: jest.fn(() => ({})),
            style: jest.fn(() => ({})),
            text: jest.fn(() => ({}))
          }))
        })),
        exit: jest.fn(() => ({
          remove: jest.fn()
        }))
      })),
      attr: jest.fn(() => ({})),
      style: jest.fn(() => ({})),
      call: jest.fn(() => ({})),
      datum: jest.fn(() => ({}))
    })),
    attr: jest.fn(() => ({})),
    style: jest.fn(() => ({})),
    call: jest.fn(() => ({})),
    datum: jest.fn(() => ({}))
  })),
  scaleBand: jest.fn(() => ({
    domain: jest.fn(() => ({})),
    range: jest.fn(() => ({})),
    padding: jest.fn(() => ({})),
    bandwidth: jest.fn(() => 100)
  })),
  scaleLinear: jest.fn(() => ({
    domain: jest.fn(() => ({})),
    range: jest.fn(() => ({})),
    ticks: jest.fn(() => [0, 10, 20, 30, 40, 50])
  })),
  max: jest.fn(() => 100),
  format: jest.fn(() => jest.fn()),
  easeQuadInOut: jest.fn(),
  axisLeft: jest.fn(() => ({
    tickFormat: jest.fn(() => ({}))
  })),
  axisBottom: jest.fn(() => ({})),
  dispatch: jest.fn(() => ({
    on: jest.fn(),
    call: jest.fn()
  }))
};

// Add d3 to global scope
global.d3.waterfallChart = undefined; // Will be set by our module

// Mock Canvas API for export tests
const createMockCanvas = () => ({
  getContext: jest.fn(() => ({
    imageSmoothingEnabled: true,
    imageSmoothingQuality: "high",
    drawImage: jest.fn(),
    fillRect: jest.fn(),
    fillText: jest.fn(),
    measureText: jest.fn(() => ({ width: 100 })),
    save: jest.fn(),
    restore: jest.fn(),
    translate: jest.fn(),
    scale: jest.fn()
  })),
  toDataURL: jest.fn(() => "data:image/png;base64,mock-image-data"),
  width: 800,
  height: 400
});

// Mock HTMLCanvasElement
global.HTMLCanvasElement = jest.fn(() => createMockCanvas());
global.HTMLCanvasElement.prototype.getContext = jest.fn(() => createMockCanvas().getContext());
global.HTMLCanvasElement.prototype.toDataURL = jest.fn(() => "data:image/png;base64,mock-image-data");

// Mock document.createElement for canvas
const originalCreateElement = global.document.createElement;
global.document.createElement = jest.fn((tagName) => {
  if (tagName === "canvas") {
    return createMockCanvas();
  }
  if (tagName === "svg") {
    return createMockSVG();
  }
  return originalCreateElement.call(global.document, tagName);
});

// Mock SVG element for export tests
const createMockSVG = () => {
  const mockSVG = {
    tagName: "svg",
    cloneNode: jest.fn(() => createMockSVG()),
    insertBefore: jest.fn(),
    appendChild: jest.fn(),
    removeChild: jest.fn(),
    querySelector: jest.fn(),
    querySelectorAll: jest.fn(() => []),
    getAttribute: jest.fn(() => null),
    setAttribute: jest.fn(),
    style: {},
    outerHTML: "<svg></svg>",
    innerHTML: "",
    firstChild: null,
    children: [],
    childNodes: []
  };
  return mockSVG;
};

// Mock SVGElement
global.SVGElement = jest.fn(() => createMockSVG());
global.SVGElement.prototype.insertBefore = jest.fn();
global.SVGElement.prototype.appendChild = jest.fn();
global.SVGElement.prototype.cloneNode = jest.fn(() => createMockSVG());
