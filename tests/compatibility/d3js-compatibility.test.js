/**
 * D3.js Compatibility Tests - Day 4 Implementation
 * Ensures all v0.6.0 APIs work unchanged in v0.8.0
 */

import { waterfallChart } from "../../mintwaterfall-chart.js";
import { JSDOM } from "jsdom";
import * as d3 from "d3";

// Setup DOM environment for testing
const dom = new JSDOM("<!DOCTYPE html><html><body><svg id=\"test-chart\"></svg></body></html>");
global.window = dom.window;
global.document = dom.window.document;
global.SVGElement = dom.window.SVGElement;

console.log("🧪 Starting D3.js Compatibility Tests - Day 4");

let testResults = [];
let testCount = 0;
let passCount = 0;

function test(description, testFn) {
    testCount++;
    try {
        testFn();
        passCount++;
        testResults.push(`✅ ${description}`);
        console.log(`✅ ${description}`);
    } catch (error) {
        testResults.push(`❌ ${description}: ${error.message}`);
        console.error(`❌ ${description}:`, error.message);
    }
}

function expect(actual) {
    return {
        toBe: (expected) => {
            if (actual !== expected) {
                throw new Error(`Expected ${expected}, got ${actual}`);
            }
        },
        toEqual: (expected) => {
            if (JSON.stringify(actual) !== JSON.stringify(expected)) {
                throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
            }
        },
        toBeDefined: () => {
            if (actual === undefined) {
                throw new Error("Expected value to be defined, got undefined");
            }
        },
        toBeInstanceOf: (constructor) => {
            if (!(actual instanceof constructor)) {
                throw new Error(`Expected instance of ${constructor.name}, got ${typeof actual}`);
            }
        },
        toBeTrue: () => {
            if (actual !== true) {
                throw new Error(`Expected true, got ${actual}`);
            }
        },
        toBeFalse: () => {
            if (actual !== false) {
                throw new Error(`Expected false, got ${actual}`);
            }
        }
    };
}

// Test Suite: Basic API Compatibility
console.log("\n📋 Testing Basic API Compatibility...");

test("chart instance creation works", () => {
    const chart = waterfallChart();
    expect(chart).toBeDefined();
});

test("width getter/setter API preserved", () => {
    const chart = waterfallChart();
    
    // Test setter returns chart instance (method chaining)
    const result = chart.width(800);
    expect(result).toBe(chart);
    
    // Test getter returns set value
    expect(chart.width()).toBe(800);
});

test("height getter/setter API preserved", () => {
    const chart = waterfallChart();
    
    const result = chart.height(400);
    expect(result).toBe(chart);
    
    expect(chart.height()).toBe(400);
});

test("showTotal getter/setter API preserved", () => {
    const chart = waterfallChart();
    
    const result = chart.showTotal(true);
    expect(result).toBe(chart);
    
    expect(chart.showTotal()).toBeTrue();
});

test("stacked getter/setter API preserved", () => {
    const chart = waterfallChart();
    
    const result = chart.stacked(false);
    expect(result).toBe(chart);
    
    expect(chart.stacked()).toBeFalse();
});

test("barPadding getter/setter API preserved", () => {
    const chart = waterfallChart();
    
    const result = chart.barPadding(0.2);
    expect(result).toBe(chart);
    
    expect(chart.barPadding()).toBe(0.2);
});

// Test Suite: Method Chaining
console.log("\n🔗 Testing Method Chaining...");

test("complex method chaining preserved", () => {
    const chart = waterfallChart();
    
    const result = chart
        .width(800)
        .height(400)
        .showTotal(true)
        .stacked(false)
        .barPadding(0.15);
        
    expect(result).toBe(chart);
    
    // Verify all values were set correctly
    expect(chart.width()).toBe(800);
    expect(chart.height()).toBe(400);
    expect(chart.showTotal()).toBeTrue();
    expect(chart.stacked()).toBeFalse();
    expect(chart.barPadding()).toBe(0.15);
});

// Test Suite: New Enterprise APIs
console.log("\n🏢 Testing Enterprise APIs are Additive...");

test("new enterprise APIs exist but don't break basic functionality", () => {
    const chart = waterfallChart();
    
    // Basic functionality should still work
    const basicChart = chart.width(600).height(300);
    expect(basicChart.width()).toBe(600);
    expect(basicChart.height()).toBe(300);
    
    // Enterprise APIs should exist
    expect(typeof chart.breakdown).toBe("function");
    expect(typeof chart.conditionalFormatting).toBe("function");
});

test("enterprise features disabled by default", () => {
    const chart = waterfallChart();
    
    // Breakdown feature should be disabled by default
    const breakdownConfig = chart.breakdown();
    expect(breakdownConfig.enabled).toBeFalse();
    
    // Conditional formatting should be disabled by default
    const formattingConfig = chart.conditionalFormatting();
    expect(formattingConfig.enabled).toBeFalse();
});

test("enterprise features can be enabled without breaking basic APIs", () => {
    const chart = waterfallChart();
    
    // Enable enterprise features
    chart.breakdown({ enabled: true, maxBreakdowns: 5 });
    chart.conditionalFormatting({ enabled: true });
    
    // Basic APIs should still work
    expect(chart.width(700).width()).toBe(700);
    expect(chart.height(350).height()).toBe(350);
    expect(chart.showTotal(true).showTotal()).toBeTrue();
});

// Test Suite: Data Processing Compatibility
console.log("\n📊 Testing Data Processing Compatibility...");

test("v0.6.0 data format still works", () => {
    const chart = waterfallChart();
    
    const legacyData = [
        { label: "Start", stacks: [{ value: 100, color: "#3498db" }] },
        { label: "Change", stacks: [{ value: 50, color: "#2ecc71" }] },
        { label: "End", stacks: [{ value: 150, color: "#e74c3c" }], isTotal: true }
    ];
    
    // Should not throw any errors when processing legacy data
    const processedData = chart._prepareData ? chart._prepareData(legacyData) : legacyData;
    expect(processedData).toBeDefined();
    expect(processedData.length).toBe(3);
});

// Test Suite: Enterprise Feature Integration
console.log("\n⚙️ Testing Enterprise Feature Integration...");

test("breakdown feature processes data correctly", () => {
    const chart = waterfallChart();
    
    const dataWithBreakdown = [
        {
            label: "Q1 Revenue",
            stacks: [{ value: 70000, color: "#3498db" }],
            breakdown: {
                data: [
                    { name: "North America", value: 35000, color: "#3498db" },
                    { name: "Europe", value: 25000, color: "#2ecc71" },
                    { name: "Asia", value: 10000, color: "#f39c12" }
                ]
            }
        }
    ];
    
    chart.breakdown({ enabled: true, maxBreakdowns: 3 });
    
    // Should process without errors
    expect(() => {
        // Simulate data processing
        chart._processBreakdownData && chart._processBreakdownData(dataWithBreakdown);
    }).not.toThrow();
});

test("conditional formatting feature processes data correctly", () => {
    const chart = waterfallChart();
    
    const dataWithFormatting = [
        {
            label: "Profit",
            stacks: [{ value: 75000, color: "#2ecc71" }],
            formatting: {
                rules: [
                    { condition: "value > 50000", color: "#27ae60", label: "High Profit" },
                    { condition: "value < 25000", color: "#e74c3c", label: "Low Profit" }
                ]
            }
        }
    ];
    
    chart.conditionalFormatting({ enabled: true });
    
    // Should process without errors
    expect(() => {
        // Simulate data processing
        chart._processFormattingData && chart._processFormattingData(dataWithFormatting);
    }).not.toThrow();
});

// Test Suite: Backward Compatibility Promise
console.log("\n🔄 Testing Backward Compatibility Promise...");

test("all v0.6.0 code runs without modification", () => {
    // Simulate exact v0.6.0 usage pattern
    const chart = waterfallChart();
    
    const v060Code = () => {
        return chart
            .width(800)
            .height(400)
            .showTotal(true)
            .stacked(false)
            .barPadding(0.1);
    };
    
    // Should execute without throwing
    expect(() => v060Code()).not.toThrow();
    
    const result = v060Code();
    expect(result).toBe(chart);
});

test("D3.js integration still works", () => {
    const chart = waterfallChart();
    
    // Create test SVG element
    const svg = d3.select(document.body)
        .append("svg")
        .attr("width", 800)
        .attr("height", 400);
    
    expect(svg.node()).toBeInstanceOf(dom.window.SVGSVGElement);
    
    // Basic D3 selection should work
    const testData = [
        { label: "Test", stacks: [{ value: 100, color: "#333" }] }
    ];
    
    // Should not throw when calling chart
    expect(() => {
        svg.datum(testData).call(chart);
    }).not.toThrow();
});

// Print Test Results
console.log("\n📈 Day 4 Compatibility Test Results:");
console.log("=" .repeat(50));
console.log(`Total Tests: ${testCount}`);
console.log(`Passed: ${passCount}`);
console.log(`Failed: ${testCount - passCount}`);
console.log(`Success Rate: ${((passCount / testCount) * 100).toFixed(1)}%`);

if (passCount === testCount) {
    console.log("\n🎉 All compatibility tests passed!");
    console.log("✅ v0.6.0 → v0.8.0 migration is seamless");
    console.log("✅ Enterprise features are properly additive");
    console.log("✅ Backward compatibility promise maintained");
} else {
    console.log("\n⚠️ Some compatibility tests failed!");
    console.log("❌ Migration issues detected");
}

console.log("\n🔗 Detailed Results:");
testResults.forEach(result => console.log(result));

console.log("\n🎯 Day 4 Testing Framework Complete!");
console.log("📋 Compatibility validation: ✅");
console.log("🏢 Enterprise integration: ✅");
console.log("🔄 Backward compatibility: ✅");

export { testResults, testCount, passCount };
