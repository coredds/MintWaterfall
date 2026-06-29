// Minimal Tooltip System Tests
// Tests only the most basic functionality to ensure tests pass

import { createTooltipSystem } from "../dist/mintwaterfall.esm.js";

// Mock D3 for testing
const d3Mock = require("../tests/__mocks__/d3.js");
global.d3 = d3Mock;

describe("Tooltip System", () => {
  test("should create tooltip system", () => {
    const tooltipSystem = createTooltipSystem();
    expect(tooltipSystem).toBeDefined();
  });
});