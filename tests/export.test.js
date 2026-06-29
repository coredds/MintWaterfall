// Minimal Export System Tests
// Tests only the most basic functionality

import { createExportSystem } from "../dist/mintwaterfall.esm.js";

// Mock D3 for testing
const d3Mock = require("../tests/__mocks__/d3.js");
global.d3 = d3Mock;

describe("Export System", () => {
  test("should create export system", () => {
    const exportSystem = createExportSystem();
    expect(exportSystem).toBeDefined();
  });
});