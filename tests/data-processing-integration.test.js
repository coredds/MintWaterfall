/**
 * Data Processing Integration Test Suite
 * Tests critical business logic that's actually working in the current build
 * Focuses on high-value data transformation and validation
 */

const { createDataProcessor } = require("../dist/mintwaterfall.cjs.js");

describe("Data Processing Integration - Critical Business Logic", () => {
    let processor;
    let validWaterfallData;
    let rawBusinessData;
    
    beforeEach(() => {
        processor = createDataProcessor();
        
        validWaterfallData = [
            {
                label: "Q1 Revenue",
                stacks: [{ value: 1000000, color: "#27ae60", label: "$1M Revenue" }]
            },
            {
                label: "Operating Costs",
                stacks: [{ value: -300000, color: "#e74c3c", label: "$300K Costs" }]
            },
            {
                label: "Marketing",
                stacks: [{ value: -150000, color: "#f39c12", label: "$150K Marketing" }]
            },
            {
                label: "Net Profit",
                stacks: [{ value: 550000, color: "#3498db", label: "$550K Profit" }]
            }
        ];
        
        rawBusinessData = [
            { region: "North", product: "Widget", revenue: 100000, costs: 60000, quarter: "Q1", date: "2024-01-15" },
            { region: "North", product: "Gadget", revenue: 150000, costs: 80000, quarter: "Q1", date: "2024-01-20" },
            { region: "South", product: "Widget", revenue: 80000, costs: 50000, quarter: "Q1", date: "2024-01-25" },
            { region: "South", product: "Tool", revenue: 120000, costs: 70000, quarter: "Q2", date: "2024-04-10" },
            { region: "East", product: "Gadget", revenue: 200000, costs: 100000, quarter: "Q2", date: "2024-04-15" },
            { region: "West", product: "Widget", revenue: 90000, costs: 55000, quarter: "Q2", date: "2024-04-20" }
        ];
    });

    describe("Data Validation - Critical Business Rules", () => {
        test("should validate complete waterfall data structure", () => {
            expect(() => processor.validateData(validWaterfallData)).not.toThrow();
            expect(processor.validateData(validWaterfallData)).toBe(true);
        });

        test("should reject data missing required fields", () => {
            const invalidData = [
                { label: "Valid Item", stacks: [{ value: 100, color: "#000" }] },
                { /* missing label */ stacks: [{ value: 200, color: "#fff" }] },
                { label: "Missing Stacks" /* no stacks property */ },
                { label: "Invalid Stack", stacks: [{ /* missing value */ color: "#000" }] }
            ];
            
            expect(() => processor.validateData(invalidData)).toThrow();
        });

        test("should handle edge case numeric values correctly", () => {
            const edgeCaseData = [
                { label: "Zero Value", stacks: [{ value: 0, color: "#000" }] },
                { label: "Negative Value", stacks: [{ value: -1000000, color: "#e74c3c" }] },
                { label: "Large Value", stacks: [{ value: 999999999.99, color: "#27ae60" }] },
                { label: "Small Decimal", stacks: [{ value: 0.01, color: "#3498db" }] }
            ];
            
            expect(() => processor.validateData(edgeCaseData)).not.toThrow();
        });

        test("should reject non-numeric values", () => {
            const invalidNumericData = [
                { label: "String Value", stacks: [{ value: "not-a-number", color: "#000" }] },
                { label: "Null Value", stacks: [{ value: null, color: "#000" }] },
                { label: "Undefined Value", stacks: [{ value: undefined, color: "#000" }] },
                { label: "NaN Value", stacks: [{ value: NaN, color: "#000" }] }
            ];
            
            expect(() => processor.validateData(invalidNumericData)).toThrow();
        });

        test("should reject empty or null data arrays", () => {
            expect(() => processor.validateData([])).toThrow("Data array cannot be empty");
            expect(() => processor.validateData(null)).toThrow("Data must be an array");
            expect(() => processor.validateData(undefined)).toThrow("Data must be an array");
        });
    });

    describe("Data Transformation - Business Logic", () => {
        test("should transform raw business data to waterfall format", () => {
            const transformed = processor.transformToWaterfallFormat(rawBusinessData, {
                labelField: "region",
                valueField: "revenue",
                colorField: "product" // Use product to determine color
            });
            
            expect(Array.isArray(transformed)).toBe(true);
            expect(transformed.length).toBeGreaterThan(0);
            
            transformed.forEach(item => {
                expect(item).toHaveProperty("label");
                expect(item).toHaveProperty("stacks");
                expect(Array.isArray(item.stacks)).toBe(true);
                expect(item.stacks[0]).toHaveProperty("value");
                expect(item.stacks[0]).toHaveProperty("color");
                expect(typeof item.stacks[0].value).toBe("number");
                expect(typeof item.stacks[0].color).toBe("string");
            });
        });

        test("should handle missing fields gracefully in transformation", () => {
            const incompleteData = [
                { region: "North", revenue: 100000 }, // Missing other fields
                { product: "Widget", revenue: 50000 }, // Missing region
                { region: "South" }, // Missing revenue
                { invalid: "data" } // Completely wrong structure
            ];
            
            const transformed = processor.transformToWaterfallFormat(incompleteData, {
                labelField: "region",
                valueField: "revenue"
            });
            
            // Should filter out invalid entries but not crash
            expect(Array.isArray(transformed)).toBe(true);
        });

        test("should transform stacks with custom transformer function", () => {
            const transformedData = processor.transformStacks(validWaterfallData, (stack) => ({
                ...stack,
                value: Math.abs(stack.value), // Convert all to positive
                label: `Absolute: ${Math.abs(stack.value)}`
            }));
            
            transformedData.forEach(item => {
                item.stacks.forEach(stack => {
                    expect(stack.value).toBeGreaterThanOrEqual(0);
                    expect(stack.label).toContain("Absolute:");
                });
            });
        });

        test("should normalize values to target maximum", () => {
            const normalized = processor.normalizeValues(validWaterfallData, 100);
            
            const maxValue = Math.max(...normalized.flatMap(item => 
                item.stacks.map(stack => Math.abs(stack.value))
            ));
            
            expect(maxValue).toBeLessThanOrEqual(100);
            expect(maxValue).toBeGreaterThan(95); // Should be close to 100
        });
    });

    describe("Data Aggregation - Statistical Operations", () => {
        test("should aggregate data by sum correctly", () => {
            const aggregated = processor.aggregateData(validWaterfallData, "sum");
            
            expect(Array.isArray(aggregated)).toBe(true);
            aggregated.forEach(item => {
                expect(item).toHaveProperty("label");
                expect(item).toHaveProperty("aggregatedValue");
                expect(item).toHaveProperty("originalStacks");
                expect(typeof item.aggregatedValue).toBe("number");
                expect(Array.isArray(item.originalStacks)).toBe(true);
            });
        });

        test("should aggregate by different statistical methods", () => {
            const methods = ["sum", "average", "max", "min"];
            
            methods.forEach(method => {
                expect(() => {
                    const result = processor.aggregateData(validWaterfallData, method);
                    expect(Array.isArray(result)).toBe(true);
                }).not.toThrow();
            });
        });

        test("should calculate percentages correctly", () => {
            const withPercentages = processor.calculatePercentages(validWaterfallData);
            
            withPercentages.forEach(item => {
                item.stacks.forEach(stack => {
                    expect(stack).toHaveProperty("percentage");
                    expect(typeof stack.percentage).toBe("number");
                    expect(stack.percentage).toBeGreaterThanOrEqual(0);
                    expect(stack.percentage).toBeLessThanOrEqual(100);
                });
            });
        });
    });

    describe("Data Summary and Statistics", () => {
        test("should generate comprehensive data summary", () => {
            const summary = processor.getDataSummary(validWaterfallData);
            
            expect(summary).toHaveProperty("totalItems");
            expect(summary).toHaveProperty("totalStacks");
            expect(summary).toHaveProperty("valueRange");
            expect(summary).toHaveProperty("cumulativeTotal");
            expect(summary).toHaveProperty("stackColors");
            expect(summary).toHaveProperty("labels");
            
            expect(summary.totalItems).toBe(4);
            expect(summary.totalStacks).toBe(4);
            expect(summary.valueRange).toHaveProperty("min");
            expect(summary.valueRange).toHaveProperty("max");
            expect(Array.isArray(summary.stackColors)).toBe(true);
            expect(Array.isArray(summary.labels)).toBe(true);
        });

        test("should calculate correct cumulative totals", () => {
            const summary = processor.getDataSummary(validWaterfallData);
            
            // Manual calculation: 1000000 + (-300000) + (-150000) + 550000 = 1100000
            const expectedTotal = validWaterfallData.reduce((sum, item) => 
                sum + item.stacks.reduce((stackSum, stack) => stackSum + stack.value, 0), 0
            );
            
            expect(summary.cumulativeTotal).toBe(expectedTotal);
        });

        test("should identify all unique colors and labels", () => {
            const summary = processor.getDataSummary(validWaterfallData);
            
            const expectedColors = [...new Set(validWaterfallData.flatMap(item => 
                item.stacks.map(stack => stack.color)
            ))];
            const expectedLabels = validWaterfallData.map(item => item.label);
            
            expect(summary.stackColors).toEqual(expect.arrayContaining(expectedColors));
            expect(summary.labels).toEqual(expectedLabels);
        });
    });

    describe("Data Sorting and Filtering", () => {
        test("should sort data by different criteria", () => {
            const sortOptions = [
                { sortBy: "label", direction: "ascending" },
                { sortBy: "label", direction: "descending" },
                { sortBy: "totalValue", direction: "ascending" },
                { sortBy: "totalValue", direction: "descending" }
            ];
            
            sortOptions.forEach(({ sortBy, direction }) => {
                const sorted = processor.sortData(validWaterfallData, sortBy, direction);
                
                expect(Array.isArray(sorted)).toBe(true);
                expect(sorted.length).toBe(validWaterfallData.length);
                
                // Verify sorting order
                if (sortBy === "label") {
                    for (let i = 1; i < sorted.length; i++) {
                        const comparison = sorted[i-1].label.localeCompare(sorted[i].label);
                        if (direction === "ascending") {
                            expect(comparison).toBeLessThanOrEqual(0);
                        } else {
                            expect(comparison).toBeGreaterThanOrEqual(0);
                        }
                    }
                }
            });
        });

        test("should filter data with custom predicate", () => {
            const positiveValues = processor.filterData(validWaterfallData, (item) => 
                item.stacks.some(stack => stack.value > 0)
            );
            
            expect(positiveValues.length).toBeLessThanOrEqual(validWaterfallData.length);
            positiveValues.forEach(item => {
                expect(item.stacks.some(stack => stack.value > 0)).toBe(true);
            });
        });

        test("should handle empty filter results", () => {
            const impossibleFilter = processor.filterData(validWaterfallData, () => false);
            expect(impossibleFilter).toHaveLength(0);
        });
    });

    describe("Data Interpolation and Generation", () => {
        test("should interpolate between two datasets", () => {
            const dataset2 = validWaterfallData.map(item => ({
                ...item,
                stacks: item.stacks.map(stack => ({
                    ...stack,
                    value: stack.value * 1.5 // 50% increase
                }))
            }));
            
            const interpolated = processor.interpolateData(validWaterfallData, dataset2, 0.5);
            
            expect(interpolated).toHaveLength(validWaterfallData.length);
            
            // Values should be halfway between original and dataset2
            interpolated.forEach((item, i) => {
                item.stacks.forEach((stack, j) => {
                    const originalValue = validWaterfallData[i].stacks[j].value;
                    const targetValue = dataset2[i].stacks[j].value;
                    const expectedValue = originalValue + 0.5 * (targetValue - originalValue);
                    
                    expect(stack.value).toBeCloseTo(expectedValue, 2);
                });
            });
        });

        test("should generate sample data with correct structure", () => {
            const sampleData = processor.generateSampleData(5, 2, [100, 1000]);
            
            expect(sampleData).toHaveLength(5);
            sampleData.forEach(item => {
                expect(item).toHaveProperty("label");
                expect(item).toHaveProperty("stacks");
                expect(item.stacks).toHaveLength(2);
                
                item.stacks.forEach(stack => {
                    expect(stack).toHaveProperty("value");
                    expect(stack).toHaveProperty("color");
                    expect(stack.value).toBeGreaterThanOrEqual(100);
                    expect(stack.value).toBeLessThanOrEqual(1000);
                });
            });
        });
    });

    describe("Performance and Large Dataset Handling", () => {
        test("should handle large datasets efficiently", () => {
            const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
                label: `Item ${i}`,
                stacks: [{
                    value: Math.random() * 10000 - 5000, // Random values between -5000 and 5000
                    color: `#${Math.floor(Math.random()*16777215).toString(16)}`, // Random hex color
                    label: `Stack ${i}`
                }]
            }));
            
            const startTime = performance.now();
            
            expect(() => processor.validateData(largeDataset)).not.toThrow();
            
            const summary = processor.getDataSummary(largeDataset);
            const sorted = processor.sortData(largeDataset, "totalValue");
            const filtered = processor.filterData(largeDataset, item => 
                item.stacks[0].value > 0
            );
            
            const endTime = performance.now();
            
            expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
            expect(summary.totalItems).toBe(1000);
            expect(sorted).toHaveLength(1000);
            expect(filtered.length).toBeGreaterThan(0);
            expect(filtered.length).toBeLessThan(1000);
        });

        test("should maintain data integrity under stress", () => {
            const stressData = Array.from({ length: 100 }, (_, i) => ({
                label: `Stress Test ${i}`,
                stacks: Array.from({ length: 10 }, (_, j) => ({
                    value: Math.random() * 1000000 - 500000,
                    color: `#${j.toString(16).padStart(6, "0")}`,
                    label: `Stack ${j}`
                }))
            }));
            
            // Multiple operations should not corrupt data
            const operations = [
                () => processor.validateData(stressData),
                () => processor.getDataSummary(stressData),
                () => processor.sortData(stressData, "totalValue"),
                () => processor.aggregateData(stressData, "sum"),
                () => processor.calculatePercentages(stressData)
            ];
            
            operations.forEach(operation => {
                expect(() => operation()).not.toThrow();
            });
            
            // Original data should remain unchanged
            expect(stressData).toHaveLength(100);
            expect(stressData[0].stacks).toHaveLength(10);
        });
    });

    describe("Error Handling and Edge Cases", () => {
        test("should provide meaningful error messages", () => {
            const testCases = [
                { data: null, expectedError: "Data must be an array" },
                { data: [], expectedError: "Data array cannot be empty" },
                { data: [{}], expectedError: "must have a string 'label' property" },
                { data: [{ label: "test" }], expectedError: "must have an array 'stacks' property" },
                { data: [{ label: "test", stacks: [] }], expectedError: "must have at least one stack" }
            ];
            
            testCases.forEach(({ data, expectedError }) => {
                expect(() => processor.validateData(data)).toThrow(expectedError);
            });
        });

        test("should handle mixed data types gracefully", () => {
            const mixedData = [
                { label: "Valid", stacks: [{ value: 100, color: "#000" }] },
                null, // null item
                undefined, // undefined item
                "string", // string instead of object
                { label: 123, stacks: [{ value: "invalid", color: "#000" }] }, // wrong types
                { label: "Partial", stacks: [{ value: 200 }] } // missing color
            ];
            
            // Should throw validation error but not crash
            expect(() => processor.validateData(mixedData)).toThrow();
        });

        test("should handle mathematical edge cases", () => {
            const validMathData = [
                { label: "Zero", stacks: [{ value: 0, color: "#000" }] },
                { label: "NegZero", stacks: [{ value: -0, color: "#000" }] },
                { label: "Large", stacks: [{ value: Number.MAX_SAFE_INTEGER, color: "#000" }] },
                { label: "Small", stacks: [{ value: Number.MIN_SAFE_INTEGER, color: "#000" }] }
            ];
            
            // Valid mathematical edge cases should be accepted
            expect(() => processor.validateData(validMathData)).not.toThrow();
            
            // Invalid mathematical values should be rejected
            const invalidMathData = [
                { label: "NaN", stacks: [{ value: NaN, color: "#000" }] }
            ];
            
            expect(() => processor.validateData(invalidMathData)).toThrow();
        });
    });
});
