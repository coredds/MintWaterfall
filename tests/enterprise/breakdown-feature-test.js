// Comprehensive tests for Breakdown Feature
// Tests functionality, D3.js compatibility, and enterprise features

import { BreakdownFeature } from "../../src/enterprise/features/breakdown.js";
import { EnterpriseFeatureManager } from "../../src/enterprise/enterprise-core.js";
import { simpleBreakdownData } from "../data/breakdown-sample-data.js";

// Test suite for BreakdownFeature
console.log("=== Breakdown Feature Test Suite ===\n");

let testsPassed = 0;
let testsFailed = 0;

function runTest(name, testFunction) {
    try {
        const result = testFunction();
        if (result === true || result === undefined) {
            console.log(`✅ ${name}: PASS`);
            testsPassed++;
        } else {
            console.log(`❌ ${name}: FAIL - ${result}`);
            testsFailed++;
        }
    } catch (error) {
        console.log(`❌ ${name}: ERROR - ${error.message}`);
        testsFailed++;
    }
}

// Test 1: Feature Initialization
runTest("Feature Initialization", () => {
    const breakdown = new BreakdownFeature();
    return breakdown.name === "breakdown" && 
           breakdown.description.includes("Hierarchical") &&
           !breakdown.enabled;
});

// Test 2: Configuration Schema Validation
runTest("Configuration Schema", () => {
    const breakdown = new BreakdownFeature();
    const schema = breakdown.getConfigSchema();
    return schema.enabled && schema.enabled.type === "boolean" &&
           schema.maxBreakdowns && schema.maxBreakdowns.type === "number" &&
           schema.showOthers && schema.showOthers.type === "boolean" &&
           schema.otherLabel && schema.otherLabel.type === "string";
});

// Test 3: D3.js Getter/Setter Pattern
runTest("D3.js Getter/Setter Pattern", () => {
    const breakdown = new BreakdownFeature();
    
    // Test getter
    const currentMax = breakdown.maxBreakdowns();
    
    // Test setter and chaining
    const result = breakdown.maxBreakdowns(10);
    const newMax = breakdown.maxBreakdowns();
    
    return currentMax === 5 && // default value
           newMax === 10 &&     // updated value
           result === breakdown; // returns this for chaining
});

// Test 4: Data Processing
runTest("Data Processing with Breakdown", () => {
    const breakdown = new BreakdownFeature({
        enabled: true,  // Enable the feature for processing
        maxBreakdowns: 5,
        showOthers: true
    });
    
    // Initialize with enabled configuration
    breakdown.init({ 
        svg: () => null, 
        data: () => null, 
        scales: () => null 
    }, { enabled: true });
    
    const processedData = breakdown.processData(simpleBreakdownData, { enabled: true });
    
    // Check that metadata was added
    const hasMetadata = processedData.every(item => 
        item._breakdownId && 
        item._level !== undefined &&
        item._hasBreakdown !== undefined
    );
    
    // Check that breakdown items with children are detected
    const hasBreakdownItems = processedData.some(item => item._hasBreakdown);
    
    return hasMetadata && hasBreakdownItems;
});

// Test 5: Expand/Collapse Functionality
runTest("Expand/Collapse Operations", () => {
    const breakdown = new BreakdownFeature({
        enabled: true,  // Enable the feature
        maxBreakdowns: 5,
        showOthers: true
    });
    
    // Initialize with enabled configuration
    breakdown.init({ 
        svg: () => null, 
        data: () => null, 
        scales: () => null 
    }, { enabled: true });
    
    // Process data to set up breakdown structure
    const processedData = breakdown.processData(simpleBreakdownData, { enabled: true });
    breakdown.data = processedData;
    
    // Find an item with breakdown
    const itemWithBreakdown = processedData.find(item => item._hasBreakdown);
    if (!itemWithBreakdown) return "No breakdown items found";
    
    const itemId = itemWithBreakdown._breakdownId;
    
    // Test expand
    const expandResult = breakdown.expandItem(itemId);
    const isExpanded = breakdown.expandedItems.has(itemId);
    
    // Test collapse
    const collapseResult = breakdown.collapseItem(itemId);
    const isCollapsed = !breakdown.expandedItems.has(itemId);
    
    return expandResult && isExpanded && collapseResult && isCollapsed;
});

// Test 6: "Others" Grouping with Max Breakdowns
runTest("Others Grouping Logic", () => {
    const breakdown = new BreakdownFeature({
        enabled: true,
        maxBreakdowns: 3,
        showOthers: true,
        otherLabel: "Others",
        otherColor: "#95a5a6"
    });
    
    // Create test data with more items than maxBreakdowns
    // Add required breakdown metadata
    const testItems = [
        { label: "Item 1", stacks: [{ value: 100, color: "#000" }], _level: 1, _parent: "parent1" },
        { label: "Item 2", stacks: [{ value: 80, color: "#000" }], _level: 1, _parent: "parent1" },
        { label: "Item 3", stacks: [{ value: 60, color: "#000" }], _level: 1, _parent: "parent1" },
        { label: "Item 4", stacks: [{ value: 40, color: "#000" }], _level: 1, _parent: "parent1" },
        { label: "Item 5", stacks: [{ value: 20, color: "#000" }], _level: 1, _parent: "parent1" }
    ];
    
    const grouped = breakdown.applyGroupingStrategy(testItems);
    
    // Should have 3 items: top 2 + "Others"
    const hasCorrectCount = grouped.length === 3;
    const hasOthersItem = grouped.some(item => item._isOther);
    const othersItem = grouped.find(item => item._isOther);
    const othersValue = othersItem ? breakdown.getItemValue(othersItem) : 0;
    
    // Others should contain value of last 3 items (60 + 40 + 20 = 120)
    return hasCorrectCount && hasOthersItem && othersValue === 120;
});

// Test 7: Value Sorting Strategy
runTest("Value Sorting Strategy", () => {
    const breakdown = new BreakdownFeature({
        enabled: true,
        grouping: { strategy: "value", direction: "desc" }
    });
    
    const unsortedItems = [
        { label: "Small", stacks: [{ value: 10, color: "#000" }] },
        { label: "Large", stacks: [{ value: 100, color: "#000" }] },
        { label: "Medium", stacks: [{ value: 50, color: "#000" }] }
    ];
    
    const sorted = breakdown.applyGroupingStrategy(unsortedItems);
    
    return sorted[0].label === "Large" && 
           sorted[1].label === "Medium" && 
           sorted[2].label === "Small";
});

// Test 8: Alphabetical Sorting Strategy
runTest("Alphabetical Sorting Strategy", () => {
    const breakdown = new BreakdownFeature({
        enabled: true,
        grouping: { strategy: "alphabetical", direction: "asc" }
    });
    
    const unsortedItems = [
        { label: "Zebra", stacks: [{ value: 10, color: "#000" }] },
        { label: "Apple", stacks: [{ value: 20, color: "#000" }] },
        { label: "Banana", stacks: [{ value: 15, color: "#000" }] }
    ];
    
    const sorted = breakdown.applyGroupingStrategy(unsortedItems);
    
    return sorted[0].label === "Apple" && 
           sorted[1].label === "Banana" && 
           sorted[2].label === "Zebra";
});

// Test 9: Enterprise Manager Integration
runTest("Enterprise Manager Integration", () => {
    const manager = new EnterpriseFeatureManager();
    const breakdown = new BreakdownFeature();
    
    // Register feature (use correct method name)
    manager.register("breakdown", breakdown);
    
    // Check registration
    const features = manager.listFeatures();
    const hasBreakdown = features.includes("breakdown");
    
    // Configure feature
    manager.configure("breakdown", { enabled: true, maxBreakdowns: 7 });
    const config = manager.getConfig();
    const isConfigured = config.breakdown.enabled && config.breakdown.maxBreakdowns === 7;
    
    return hasBreakdown && isConfigured;
});

// Test 10: Keyboard Navigation Setup
runTest("Keyboard Navigation Setup", () => {
    // Mock SVG object with proper D3-like behavior
    const mockSvg = {
        attr: function(name, value) { 
            this[name] = value; 
            return this; 
        },
        on: function(event, handler) { 
            this.eventHandlers = this.eventHandlers || {};
            this.eventHandlers[event] = handler;
            return this; 
        },
        select: function() {
            return {
                empty: () => true,
                append: () => this,
                attr: () => this,
                node: () => ({ focus: () => {} })
            };
        },
        append: function() {
            return this;
        }
    };
    
    const breakdown = new BreakdownFeature({
        enabled: true,
        interaction: { keyboardNavigation: true }
    });
    
    breakdown.svg = mockSvg;
    breakdown.init({ 
        svg: () => mockSvg, 
        data: () => null, 
        scales: () => null 
    }, { enabled: true });
    
    // Check that keyboard navigation was set up
    const hasTabIndex = mockSvg.tabindex === 0;
    const hasEventHandler = mockSvg.eventHandlers && typeof mockSvg.eventHandlers.keydown === "function";
    
    return hasTabIndex && hasEventHandler;
});

// Test 11: Event Emission
runTest("Event Emission System", () => {
    const breakdown = new BreakdownFeature();
    let eventFired = false;
    let eventData = null;
    
    // Register event handler
    breakdown.on("itemExpanded", (data) => {
        eventFired = true;
        eventData = data;
    });
    
    // Emit event
    breakdown.emit("itemExpanded", "test-id");
    
    return eventFired && eventData === "test-id";
});

// Test 12: Export/Import State
runTest("Export/Import State", () => {
    const breakdown = new BreakdownFeature({
        enabled: true,
        maxBreakdowns: 15,
        showOthers: true
    });
    
    // Set up some state
    breakdown.expandedItems.add("item1");
    breakdown.expandedItems.add("item2");
    
    // Export state
    const exported = breakdown.export();
    
    // Create new instance and import
    const breakdown2 = new BreakdownFeature();
    breakdown2.import(exported);
    
    return breakdown2.config.maxBreakdowns === 15 &&
           breakdown2.expandedItems.has("item1") &&
           breakdown2.expandedItems.has("item2");
});

// Test 13: Performance Timer
runTest("Performance Monitoring", () => {
    const breakdown = new BreakdownFeature();
    
    // Mock console.time and console.timeEnd to capture calls
    let timerStarted = false;
    let timerEnded = false;
    
    const originalTime = console.time;
    const originalTimeEnd = console.timeEnd;
    
    console.time = () => { timerStarted = true; };
    console.timeEnd = () => { timerEnded = true; };
    
    // Test performance timing
    const timer = breakdown.startPerformanceTimer("test");
    breakdown.endPerformanceTimer(timer);
    
    // Restore original functions
    console.time = originalTime;
    console.timeEnd = originalTimeEnd;
    
    return timerStarted && timerEnded && timer.includes("breakdown-test");
});

// Test 14: Collapse All/Expand All
runTest("Collapse All / Expand All", () => {
    const breakdown = new BreakdownFeature({
        enabled: true,
        maxBreakdowns: 5,
        showOthers: true
    });
    breakdown.init({ svg: () => null, data: () => null, scales: () => null });
    
    // Process data and simulate some expanded items
    const processedData = breakdown.processData(simpleBreakdownData, { enabled: true });
    breakdown.data = processedData;
    
    // Add some expanded items
    breakdown.expandedItems.add("item1");
    breakdown.expandedItems.add("item2");
    
    // Test collapse all
    breakdown.collapseAll();
    const allCollapsed = breakdown.expandedItems.size === 0;
    
    // Note: expandAll would need breakdown data structure to test properly
    return allCollapsed;
});

// Test 15: Compatibility with v0.6.0 Data Format
runTest("v0.6.0 Data Format Compatibility", () => {
    const breakdown = new BreakdownFeature();
    
    // Standard v0.6.0 format (without breakdown)
    const v06Data = [
        {
            label: "Starting",
            stacks: [{ value: 100, color: "#3498db" }]
        },
        {
            label: "Change",
            stacks: [{ value: 25, color: "#2ecc71" }]
        }
    ];
    
    const processedData = breakdown.processData(v06Data, { enabled: false });
    
    // Should preserve original data when disabled
    return JSON.stringify(processedData) === JSON.stringify(v06Data);
});

// Test Summary
console.log("\n=== Test Summary ===");
console.log(`Tests Passed: ${testsPassed}`);
console.log(`Tests Failed: ${testsFailed}`);
console.log(`Total Tests: ${testsPassed + testsFailed}`);
console.log(`Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);

if (testsFailed === 0) {
    console.log("\n🎉 All Breakdown Feature tests passed!");
    console.log("✅ D3.js compatibility maintained");
    console.log("✅ Enterprise functionality working");
    console.log("✅ Ready for integration with main chart");
} else {
    console.log(`\n⚠️  ${testsFailed} test(s) failed. Review implementation.`);
}

console.log("\n=== Day 2 Complete: Breakdown Feature Ready ===");
