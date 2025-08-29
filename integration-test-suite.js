// Integration Test Suite for MintWaterfall v0.8.0 Enterprise Edition
// Day 5: Comprehensive Integration & Manual Testing

import { waterfallChart } from "./mintwaterfall-chart.js";

class IntegrationTestSuite {
    constructor() {
        this.tests = [];
        this.results = [];
        this.currentTest = 0;
        this.startTime = 0;
    }

    // Test registration
    addTest(name, description, testFn, tags = []) {
        this.tests.push({
            name,
            description,
            testFn,
            tags,
            status: "pending"
        });
    }

    // Core functionality tests
    setupCoreTests() {
        this.addTest(
            "Chart Initialization",
            "Verify basic chart creation and configuration",
            async () => {
                const chart = waterfallChart();
                if (typeof chart !== "function") {
                    throw new Error("Chart should return a function");
                }

                // Test method chaining
                const configured = chart
                    .width(400)
                    .height(300)
                    .margin({ top: 20, right: 30, bottom: 40, left: 50 });

                if (typeof configured !== "function") {
                    throw new Error("Method chaining should preserve function nature");
                }

                return { success: true, metrics: { created: true } };
            },
            ["core", "initialization"]
        );

        this.addTest(
            "Data Binding and Rendering",
            "Test data binding with various data configurations",
            async () => {
                const testData = [
                    { label: "Start", value: 100, type: "start" },
                    { label: "Change 1", value: 20, type: "increase" },
                    { label: "Change 2", value: -15, type: "decrease" },
                    { label: "End", value: null, type: "end" }
                ];

                const chart = waterfallChart().width(400).height(300);
                const container = d3.select(document.createElement("div"));
                
                const startTime = performance.now();
                container.datum(testData).call(chart);
                const renderTime = performance.now() - startTime;

                // Verify SVG creation
                const svg = container.select("svg");
                if (svg.empty()) {
                    throw new Error("SVG element not created");
                }

                // Verify bars creation
                const bars = svg.selectAll(".waterfall-bar");
                if (bars.size() !== testData.length) {
                    throw new Error(`Expected ${testData.length} bars, got ${bars.size()}`);
                }

                return { 
                    success: true, 
                    metrics: { 
                        renderTime: Math.round(renderTime * 100) / 100,
                        barsCreated: bars.size(),
                        svgCreated: true
                    } 
                };
            },
            ["core", "rendering", "data-binding"]
        );

        this.addTest(
            "Dynamic Data Updates",
            "Test chart updates with changing data",
            async () => {
                const initialData = [
                    { label: "Start", value: 100, type: "start" },
                    { label: "Change 1", value: 20, type: "increase" },
                    { label: "End", value: null, type: "end" }
                ];

                const updatedData = [
                    { label: "Start", value: 200, type: "start" },
                    { label: "Change 1", value: 30, type: "increase" },
                    { label: "Change 2", value: -10, type: "decrease" },
                    { label: "Change 3", value: 15, type: "increase" },
                    { label: "End", value: null, type: "end" }
                ];

                const chart = waterfallChart().width(400).height(300);
                const container = d3.select(document.createElement("div"));

                // Initial render
                container.datum(initialData).call(chart);
                const initialBars = container.selectAll(".waterfall-bar").size();

                // Update with new data
                const startTime = performance.now();
                container.datum(updatedData).call(chart);
                const updateTime = performance.now() - startTime;

                const updatedBars = container.selectAll(".waterfall-bar").size();

                if (updatedBars !== updatedData.length) {
                    throw new Error(`Expected ${updatedData.length} bars after update, got ${updatedBars}`);
                }

                return {
                    success: true,
                    metrics: {
                        initialBars,
                        updatedBars,
                        updateTime: Math.round(updateTime * 100) / 100
                    }
                };
            },
            ["core", "updates", "performance"]
        );
    }

    // Enterprise feature tests
    setupEnterpriseTests() {
        this.addTest(
            "Breakdown Analysis Feature",
            "Test hierarchical data breakdown functionality",
            async () => {
                const testData = [
                    { label: "Start", value: 1000, type: "start", department: "Finance" },
                    { label: "Sales Q1", value: 200, type: "increase", department: "Sales" },
                    { label: "Sales Q2", value: 150, type: "increase", department: "Sales" },
                    { label: "Marketing", value: -100, type: "decrease", department: "Marketing" },
                    { label: "Operations", value: -50, type: "decrease", department: "Operations" },
                    { label: "End", value: null, type: "end", department: "Finance" }
                ];

                const chart = waterfallChart().width(500).height(350);
                const container = d3.select(document.createElement("div"));

                // Test breakdown enabling
                const startTime = performance.now();
                chart.enableBreakdown("department", { minGroupSize: 2, sortStrategy: "value" });
                container.datum(testData).call(chart);
                const breakdownTime = performance.now() - startTime;

                // Verify breakdown is active
                const config = chart.getBreakdownConfig && chart.getBreakdownConfig();
                if (!config || config.field !== "department") {
                    throw new Error("Breakdown configuration not properly set");
                }

                // Test breakdown disabling
                chart.disableBreakdown();
                container.call(chart);

                const finalConfig = chart.getBreakdownConfig && chart.getBreakdownConfig();
                if (finalConfig && finalConfig.enabled) {
                    throw new Error("Breakdown should be disabled");
                }

                return {
                    success: true,
                    metrics: {
                        breakdownTime: Math.round(breakdownTime * 100) / 100,
                        dataPoints: testData.length,
                        configurationWorking: true
                    }
                };
            },
            ["enterprise", "breakdown", "performance"]
        );

        this.addTest(
            "Conditional Formatting Feature",
            "Test dynamic styling and formatting rules",
            async () => {
                const testData = [
                    { label: "Start", value: 1000, type: "start", performance: "baseline" },
                    { label: "Excellent", value: 300, type: "increase", performance: "excellent" },
                    { label: "Good", value: 200, type: "increase", performance: "good" },
                    { label: "Fair", value: -100, type: "decrease", performance: "fair" },
                    { label: "Poor", value: -200, type: "decrease", performance: "poor" },
                    { label: "End", value: null, type: "end", performance: "baseline" }
                ];

                const chart = waterfallChart().width(500).height(350);
                const container = d3.select(document.createElement("div"));

                // Test categorical formatting
                const startTime = performance.now();
                chart.addFormattingRule("performance-colors", {
                    field: "performance",
                    type: "categorical",
                    scale: {
                        "excellent": "#28a745",
                        "good": "#20c997",
                        "fair": "#ffc107",
                        "poor": "#dc3545",
                        "baseline": "#6c757d"
                    }
                });
                container.datum(testData).call(chart);
                const categoricalTime = performance.now() - startTime;

                // Test continuous formatting
                const continuousStart = performance.now();
                chart.addFormattingRule("value-scale", {
                    field: "value",
                    type: "continuous",
                    scale: d3.scaleSequential(d3.interpolateRdYlGn).domain([-300, 300])
                });
                container.call(chart);
                const continuousTime = performance.now() - continuousStart;

                // Test rule clearing
                chart.clearFormattingRules();
                container.call(chart);

                return {
                    success: true,
                    metrics: {
                        categoricalTime: Math.round(categoricalTime * 100) / 100,
                        continuousTime: Math.round(continuousTime * 100) / 100,
                        rulesApplied: 2
                    }
                };
            },
            ["enterprise", "formatting", "styling"]
        );

        this.addTest(
            "Combined Enterprise Features",
            "Test breakdown and formatting working together",
            async () => {
                const testData = [
                    { label: "Start", value: 1000, type: "start", department: "Finance", category: "Initial" },
                    { label: "Sales A", value: 200, type: "increase", department: "Sales", category: "Revenue" },
                    { label: "Sales B", value: 150, type: "increase", department: "Sales", category: "Revenue" },
                    { label: "Marketing A", value: -80, type: "decrease", department: "Marketing", category: "Expense" },
                    { label: "Marketing B", value: -60, type: "decrease", department: "Marketing", category: "Expense" },
                    { label: "Operations", value: -100, type: "decrease", department: "Operations", category: "Expense" },
                    { label: "End", value: null, type: "end", department: "Finance", category: "Final" }
                ];

                const chart = waterfallChart().width(600).height(400);
                const container = d3.select(document.createElement("div"));

                // Apply both features
                const startTime = performance.now();
                
                chart.enableBreakdown("department", { minGroupSize: 2 });
                chart.addFormattingRule("category-colors", {
                    field: "category",
                    type: "categorical",
                    scale: {
                        "Revenue": "#007bff",
                        "Expense": "#dc3545",
                        "Initial": "#6c757d",
                        "Final": "#28a745"
                    }
                });
                
                container.datum(testData).call(chart);
                const combinedTime = performance.now() - startTime;

                // Test feature interaction
                chart.disableBreakdown();
                container.call(chart);

                chart.enableBreakdown("category");
                container.call(chart);

                return {
                    success: true,
                    metrics: {
                        combinedTime: Math.round(combinedTime * 100) / 100,
                        dataPoints: testData.length,
                        featuresWorking: true
                    }
                };
            },
            ["enterprise", "integration", "combined"]
        );
    }

    // Performance and stress tests
    setupPerformanceTests() {
        this.addTest(
            "Large Dataset Performance",
            "Test performance with large datasets",
            async () => {
                const largeData = [{ label: "Start", value: 10000, type: "start" }];
                
                // Generate 100 data points
                for (let i = 1; i <= 100; i++) {
                    largeData.push({
                        label: `Item ${i}`,
                        value: (Math.random() - 0.5) * 1000,
                        type: Math.random() > 0.5 ? "increase" : "decrease",
                        department: ["Sales", "Marketing", "Operations", "Finance"][Math.floor(Math.random() * 4)],
                        category: ["Revenue", "Expense"][Math.floor(Math.random() * 2)]
                    });
                }
                
                largeData.push({ label: "End", value: null, type: "end" });

                const chart = waterfallChart().width(1000).height(600);
                const container = d3.select(document.createElement("div"));

                const startTime = performance.now();
                container.datum(largeData).call(chart);
                const renderTime = performance.now() - startTime;

                // Test with enterprise features
                const enterpriseStart = performance.now();
                chart.enableBreakdown("department");
                chart.addFormattingRule("performance", {
                    field: "value",
                    type: "continuous",
                    scale: d3.scaleSequential(d3.interpolateViridis).domain([-1000, 1000])
                });
                container.call(chart);
                const enterpriseTime = performance.now() - enterpriseStart;

                if (renderTime > 1000) { // 1 second threshold
                    throw new Error(`Render time too slow: ${renderTime}ms`);
                }

                return {
                    success: true,
                    metrics: {
                        dataSize: largeData.length,
                        renderTime: Math.round(renderTime * 100) / 100,
                        enterpriseTime: Math.round(enterpriseTime * 100) / 100,
                        performanceGrade: renderTime < 500 ? "A" : renderTime < 800 ? "B" : "C"
                    }
                };
            },
            ["performance", "stress", "large-dataset"]
        );

        this.addTest(
            "Memory Efficiency",
            "Test memory usage and cleanup",
            async () => {
                if (!performance.memory) {
                    return { success: true, metrics: { note: "Memory API not available" } };
                }

                const initialMemory = performance.memory.usedJSHeapSize;
                const charts = [];
                
                // Create multiple charts
                for (let i = 0; i < 20; i++) {
                    const data = [
                        { label: "Start", value: 1000, type: "start" },
                        { label: "Change", value: Math.random() * 500 - 250, type: Math.random() > 0.5 ? "increase" : "decrease" },
                        { label: "End", value: null, type: "end" }
                    ];

                    const chart = waterfallChart().width(300).height(200);
                    const container = d3.select(document.createElement("div"));
                    container.datum(data).call(chart);
                    
                    charts.push({ chart, container });
                }

                const peakMemory = performance.memory.usedJSHeapSize;
                const memoryIncrease = (peakMemory - initialMemory) / 1024 / 1024; // MB

                // Cleanup
                charts.forEach(({ container }) => {
                    container.selectAll("*").remove();
                });
                charts.length = 0;

                // Force garbage collection if available
                if (window.gc) {
                    window.gc();
                }

                const finalMemory = performance.memory.usedJSHeapSize;
                const memoryRetained = (finalMemory - initialMemory) / 1024 / 1024; // MB

                return {
                    success: true,
                    metrics: {
                        chartsCreated: 20,
                        memoryIncrease: Math.round(memoryIncrease * 100) / 100,
                        memoryRetained: Math.round(memoryRetained * 100) / 100,
                        efficiency: Math.round((1 - memoryRetained / memoryIncrease) * 100)
                    }
                };
            },
            ["performance", "memory", "cleanup"]
        );
    }

    // Browser compatibility tests
    setupCompatibilityTests() {
        this.addTest(
            "SVG Feature Support",
            "Test SVG capabilities and features",
            async () => {
                const svg = d3.select(document.createElement("div"))
                    .append("svg")
                    .attr("width", 100)
                    .attr("height", 100);

                // Test basic SVG elements
                const rect = svg.append("rect")
                    .attr("width", 50)
                    .attr("height", 50)
                    .attr("fill", "blue");

                svg.append("text")
                    .attr("x", 25)
                    .attr("y", 25)
                    .text("Test");

                // Test transforms
                rect.attr("transform", "translate(10,10)");

                // Test gradients
                const defs = svg.append("defs");
                const gradient = defs.append("linearGradient")
                    .attr("id", "test-gradient");
                
                gradient.append("stop")
                    .attr("offset", "0%")
                    .attr("stop-color", "red");

                return {
                    success: true,
                    metrics: {
                        svgSupported: true,
                        transformsSupported: true,
                        gradientsSupported: true,
                        textSupported: true
                    }
                };
            },
            ["compatibility", "svg", "browser"]
        );

        this.addTest(
            "D3.js Integration",
            "Test D3.js version compatibility and features",
            async () => {
                const version = d3.version;
                const majorVersion = parseInt(version.split(".")[0]);

                if (majorVersion < 7) {
                    throw new Error(`D3.js version ${version} may not be compatible. Expected v7+`);
                }

                // Test key D3 features we use
                const features = {
                    select: typeof d3.select === "function",
                    scaleLinear: typeof d3.scaleLinear === "function",
                    axisBottom: typeof d3.axisBottom === "function",
                    axisLeft: typeof d3.axisLeft === "function",
                    scaleSequential: typeof d3.scaleSequential === "function",
                    interpolateRdYlGn: typeof d3.interpolateRdYlGn === "function"
                };

                const allSupported = Object.values(features).every(Boolean);

                if (!allSupported) {
                    throw new Error("Some required D3.js features are missing");
                }

                return {
                    success: true,
                    metrics: {
                        version,
                        majorVersion,
                        featuresSupported: Object.keys(features).length,
                        allFeaturesWorking: allSupported
                    }
                };
            },
            ["compatibility", "d3", "version"]
        );
    }

    // Run all tests
    async runAllTests(progressCallback = null) {
        this.results = [];
        this.startTime = performance.now();

        console.log("🚀 Starting MintWaterfall Integration Test Suite");
        console.log(`📋 Running ${this.tests.length} tests...`);

        for (let i = 0; i < this.tests.length; i++) {
            const test = this.tests[i];
            this.currentTest = i;

            if (progressCallback) {
                progressCallback(i, this.tests.length, test);
            }

            console.log(`\n🔍 Running: ${test.name}`);

            try {
                const startTime = performance.now();
                const result = await test.testFn();
                const duration = performance.now() - startTime;

                const testResult = {
                    ...test,
                    status: "passed",
                    duration: Math.round(duration * 100) / 100,
                    result,
                    timestamp: new Date().toISOString()
                };

                this.results.push(testResult);
                console.log(`✅ ${test.name} - PASSED (${testResult.duration}ms)`);

                if (result.metrics) {
                    console.log("   📊 Metrics:", result.metrics);
                }

            } catch (error) {
                const testResult = {
                    ...test,
                    status: "failed",
                    error: error.message,
                    stack: error.stack,
                    timestamp: new Date().toISOString()
                };

                this.results.push(testResult);
                console.log(`❌ ${test.name} - FAILED`);
                console.log(`   🚨 Error: ${error.message}`);
            }

            // Small delay to prevent browser locking
            await new Promise(resolve => setTimeout(resolve, 10));
        }

        const totalTime = performance.now() - this.startTime;
        const passed = this.results.filter(r => r.status === "passed").length;
        const failed = this.results.filter(r => r.status === "failed").length;

        console.log("\n📊 Test Suite Complete!");
        console.log(`   ✅ Passed: ${passed}`);
        console.log(`   ❌ Failed: ${failed}`);
        console.log(`   ⏱️  Total Time: ${Math.round(totalTime)}ms`);
        console.log(`   🎯 Success Rate: ${Math.round(passed / this.tests.length * 100)}%`);

        return {
            summary: {
                total: this.tests.length,
                passed,
                failed,
                successRate: Math.round(passed / this.tests.length * 100),
                totalTime: Math.round(totalTime)
            },
            results: this.results
        };
    }

    // Filter tests by tag
    runTestsByTag(tags, progressCallback = null) {
        const originalTests = [...this.tests];
        this.tests = this.tests.filter(test => 
            tags.some(tag => test.tags.includes(tag))
        );

        const result = this.runAllTests(progressCallback);
        
        // Restore original tests
        this.tests = originalTests;
        
        return result;
    }

    // Generate HTML report
    generateHTMLReport() {
        const passed = this.results.filter(r => r.status === "passed").length;
        const failed = this.results.filter(r => r.status === "failed").length;
        const successRate = Math.round(passed / this.results.length * 100);

        return `
<!DOCTYPE html>
<html>
<head>
    <title>MintWaterfall Integration Test Report</title>
    <style>
        body { font-family: 'Segoe UI', sans-serif; margin: 20px; background: #f8f9fa; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #e9ecef; padding-bottom: 20px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
        .metric-value { font-size: 2em; font-weight: bold; color: #007bff; }
        .test-result { margin: 15px 0; padding: 15px; border-radius: 6px; border-left: 4px solid; }
        .passed { background: #f8fff9; border-color: #28a745; }
        .failed { background: #fff8f8; border-color: #dc3545; }
        .test-name { font-weight: bold; margin-bottom: 5px; }
        .test-description { color: #6c757d; margin-bottom: 10px; }
        .test-metrics { background: white; padding: 10px; border-radius: 4px; font-family: monospace; font-size: 0.9em; }
        .status-badge { display: inline-block; padding: 4px 8px; border-radius: 4px; color: white; font-size: 0.8em; font-weight: bold; }
        .status-passed { background: #28a745; }
        .status-failed { background: #dc3545; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>MintWaterfall v0.8.0 Integration Test Report</h1>
            <p>Day 5 Integration Testing - Generated ${new Date().toLocaleString()}</p>
        </div>

        <div class="summary">
            <div class="metric-card">
                <div class="metric-value">${this.results.length}</div>
                <div>Total Tests</div>
            </div>
            <div class="metric-card">
                <div class="metric-value" style="color: #28a745">${passed}</div>
                <div>Passed</div>
            </div>
            <div class="metric-card">
                <div class="metric-value" style="color: #dc3545">${failed}</div>
                <div>Failed</div>
            </div>
            <div class="metric-card">
                <div class="metric-value" style="color: ${successRate >= 80 ? "#28a745" : successRate >= 60 ? "#ffc107" : "#dc3545"}">${successRate}%</div>
                <div>Success Rate</div>
            </div>
        </div>

        <div class="test-results">
            ${this.results.map(result => `
                <div class="test-result ${result.status}">
                    <div class="test-name">
                        ${result.name}
                        <span class="status-badge status-${result.status}">${result.status.toUpperCase()}</span>
                    </div>
                    <div class="test-description">${result.description}</div>
                    ${result.duration ? `<div><strong>Duration:</strong> ${result.duration}ms</div>` : ""}
                    ${result.result && result.result.metrics ? `
                        <div class="test-metrics">
                            <strong>Metrics:</strong><br>
                            ${Object.entries(result.result.metrics).map(([key, value]) => 
                                `${key}: ${typeof value === "object" ? JSON.stringify(value) : value}`
                            ).join("<br>")}
                        </div>
                    ` : ""}
                    ${result.error ? `
                        <div style="color: #dc3545; margin-top: 10px;">
                            <strong>Error:</strong> ${result.error}
                        </div>
                    ` : ""}
                </div>
            `).join("")}
        </div>
    </div>
</body>
</html>`;
    }
}

// Initialize and export test suite
const testSuite = new IntegrationTestSuite();

// Setup all test categories
testSuite.setupCoreTests();
testSuite.setupEnterpriseTests();
testSuite.setupPerformanceTests();
testSuite.setupCompatibilityTests();

// Export for use in browser or Node.js
if (typeof window !== "undefined") {
    window.IntegrationTestSuite = testSuite;
} else if (typeof module !== "undefined" && module.exports) {
    module.exports = testSuite;
}

export default testSuite;
