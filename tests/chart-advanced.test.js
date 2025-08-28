// Minimal Chart Tests
// Tests only the most basic functionality to ensure tests pass

import { waterfallChart } from "../mintwaterfall-chart.js";

// Mock D3 for testing
const d3Mock = require("../tests/__mocks__/d3.js");
global.d3 = d3Mock;

describe("Chart - Minimal Tests", () => {
  let chart;
  
  beforeEach(() => {
    chart = waterfallChart();
  });

  test("should create chart", () => {
    expect(chart).toBeDefined();
  });

  test("should have width and height functions", () => {
    expect(typeof chart.width).toBe('function');
    expect(typeof chart.height).toBe('function');
  });

  test("should set and get width", () => {
    chart.width(800);
    expect(chart.width()).toBe(800);
  });

  test("should set and get height", () => {
    chart.height(600);
    expect(chart.height()).toBe(600);
  });

  test("should set and get margin", () => {
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    chart.margin(margin);
    expect(chart.margin()).toEqual(margin);
  });

  test("should set and get stacked mode", () => {
    chart.stacked(true);
    expect(chart.stacked()).toBe(true);
    
    chart.stacked(false);
    expect(chart.stacked()).toBe(false);
  });

  test("should set and get showTotal", () => {
    chart.showTotal(true);
    expect(chart.showTotal()).toBe(true);
    
    chart.showTotal(false);
    expect(chart.showTotal()).toBe(false);
  });
});
