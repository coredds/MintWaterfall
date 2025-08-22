// Tests for Enhanced D3.js Features
// Tests staggered animations, brush selection, and advanced scales

import { createScaleSystem } from "../mintwaterfall-scales.js";
import { createBrushSystem } from "../mintwaterfall-brush.js";
import { createAnimationSystem } from "../mintwaterfall-animations.js";

// Mock D3 for testing
const d3Mock = require("../tests/__mocks__/d3.js");
global.d3 = d3Mock;

describe("Enhanced D3.js Features", () => {
    
    describe("Scale System", () => {
        let scaleSystem;
        
        beforeEach(() => {
            scaleSystem = createScaleSystem();
        });
        
        test("should create adaptive scale for numeric data", () => {
            const data = [
                { label: "A", cumulativeTotal: 10 },
                { label: "B", cumulativeTotal: 20 },
                { label: "C", cumulativeTotal: 30 }
            ];
            
            const scale = scaleSystem.createAdaptiveScale(data, "y");
            expect(scale).toBeDefined();
        });
        
        test("should create time scale with proper domain", () => {
            const timeValues = [
                new Date("2023-01-01"),
                new Date("2023-02-01"),
                new Date("2023-03-01")
            ];
            
            const scale = scaleSystem.createTimeScale(timeValues);
            expect(scale).toBeDefined();
            
            // d3.extent returns the min/max timestamps, so we should check that
            const domain = scale.domain();
            expect(Array.isArray(domain)).toBe(true);
            expect(domain).toHaveLength(2); // [min, max]
        });
        
        test("should create ordinal scale with unique values", () => {
            const values = ["Category A", "Category B", "Category A", "Category C"];
            const scale = scaleSystem.createOrdinalScale(values);
            
            expect(scale).toBeDefined();
            expect(scale.domain()).toHaveLength(3); // Unique values only
        });
        
        test("should create band scale for categorical positioning", () => {
            const values = ["A", "B", "C"];
            const scale = scaleSystem.createBandScale(values);
            
            expect(scale).toBeDefined();
            expect(scale.domain()).toEqual(values);
            expect(typeof scale.bandwidth).toBe("function"); // Should have bandwidth method
        });
        
        test("should create linear scale with padding", () => {
            const values = [10, 20, 30, 40, 50];
            const options = { padding: 0.2, nice: true };
            
            const scale = scaleSystem.createLinearScale(values, options);
            expect(scale).toBeDefined();
        });
        
        test("should handle log scale with positive values", () => {
            const values = [1, 10, 100, 1000];
            const scale = scaleSystem.createLogScale(values);
            
            expect(scale).toBeDefined();
        });
        
        test("should fallback to linear scale for log scale with non-positive values", () => {
            const values = [0, -10, 5];
            const scale = scaleSystem.createLogScale(values);
            
            // Should fallback to linear scale
            expect(scale).toBeDefined();
        });
        
        test("should detect scale type correctly", () => {
            expect(scaleSystem.scaleUtils.detectScaleType([new Date(), new Date()])).toBe("time");
            expect(scaleSystem.scaleUtils.detectScaleType(["A", "B", "C"])).toBe("band");
            expect(scaleSystem.scaleUtils.detectScaleType([1, 2, 3])).toBe("linear");
        });
        
        test("should create appropriate axis for scale", () => {
            const mockScale = { domain: jest.fn(), range: jest.fn() };
            const axis = scaleSystem.scaleUtils.createAxis(mockScale, "bottom");
            
            expect(axis).toBeDefined();
        });
    });
    
    describe("Brush System", () => {
        let brushSystem;
        
        beforeEach(() => {
            brushSystem = createBrushSystem();
        });
        
        test("should create brush with default options", () => {
            const brush = brushSystem.createBrush();
            expect(brush).toBeDefined();
        });
        
        test("should create x-direction brush", () => {
            const brush = brushSystem.createBrush({ type: "x" });
            expect(brush).toBeDefined();
        });
        
        test("should create y-direction brush", () => {
            const brush = brushSystem.createBrush({ type: "y" });
            expect(brush).toBeDefined();
        });
        
        test("should create xy-direction brush", () => {
            const brush = brushSystem.createBrush({ type: "xy" });
            expect(brush).toBeDefined();
        });
        
        test("should filter data based on brush selection", () => {
            const data = [
                { label: "A", cumulativeTotal: 10 },
                { label: "B", cumulativeTotal: 20 },
                { label: "C", cumulativeTotal: 30 }
            ];
            
            // Create a proper mock scale function
            const mockScale = jest.fn((label) => {
                const positions = { "A": 0, "B": 100, "C": 200 };
                return positions[label] || 0;
            });
            mockScale.invert = jest.fn(x => x);
            mockScale.bandwidth = jest.fn(() => 50);
            
            const selection = [50, 150];
            const filteredData = brushSystem.filterDataByBrush(data, selection, mockScale);
            
            expect(Array.isArray(filteredData)).toBe(true);
        });
        
        test("should get selected indices", () => {
            const data = [
                { label: "A", cumulativeTotal: 10 },
                { label: "B", cumulativeTotal: 20 }
            ];
            
            // Create a proper mock scale function
            const mockScale = jest.fn((label) => {
                const positions = { "A": 0, "B": 100 };
                return positions[label] || 0;
            });
            mockScale.invert = jest.fn(x => x);
            mockScale.bandwidth = jest.fn(() => 50);
            
            const selection = [50, 150];
            const indices = brushSystem.getSelectedIndices(data, selection, mockScale);
            
            expect(Array.isArray(indices)).toBe(true);
        });
        
        test("should create selection summary", () => {
            const selectedData = [
                { cumulativeTotal: 10 },
                { cumulativeTotal: 20 },
                { cumulativeTotal: 30 }
            ];
            
            const summary = brushSystem.selectionUtils.createSelectionSummary(selectedData);
            
            expect(summary).toEqual({
                count: 3,
                sum: 60,
                average: 20,
                min: 10,
                max: 30,
                extent: [10, 30]
            });
        });
        
        test("should handle empty selection summary", () => {
            const summary = brushSystem.selectionUtils.createSelectionSummary([]);
            
            expect(summary).toEqual({
                count: 0,
                sum: 0,
                average: 0,
                min: 0,
                max: 0
            });
        });
        
        test("should register event handlers", () => {
            const startHandler = jest.fn();
            const moveHandler = jest.fn();
            const endHandler = jest.fn();
            
            brushSystem
                .onStart(startHandler)
                .onMove(moveHandler)
                .onEnd(endHandler);
            
            expect(brushSystem.onStart).toBeDefined();
            expect(brushSystem.onMove).toBeDefined();
            expect(brushSystem.onEnd).toBeDefined();
        });
    });
    
    describe("Enhanced Animation System", () => {
        let animationSystem;
        
        beforeEach(() => {
            animationSystem = createAnimationSystem();
        });
        
        test("should create staggered transition", async () => {
            const elements = [
                { id: 1 },
                { id: 2 },
                { id: 3 }
            ];
            
            const mockAnimationFn = jest.fn(() => Promise.resolve());
            const options = { delay: 100, duration: 500 };
            
            const result = animationSystem.createStaggeredTransition(elements, mockAnimationFn, options);
            expect(result).toBeInstanceOf(Promise);
        });
        
        test("should create custom tween function", () => {
            const startValue = 0;
            const endValue = 100;
            const interpolator = (start, end, t) => start + (end - start) * t * t;
            
            const tween = animationSystem.createCustomTween(startValue, endValue, interpolator);
            expect(typeof tween).toBe("function");
            
            // Test interpolation
            expect(tween(0.5)).toBe(25); // 0 + (100 - 0) * 0.5 * 0.5
        });
        
        test("should create custom tween with default linear interpolation", () => {
            const tween = animationSystem.createCustomTween(0, 100);
            expect(typeof tween).toBe("function");
            expect(tween(0.5)).toBe(50);
        });
        
        test("should create transition with events", () => {
            const config = {
                duration: 1000,
                onStart: jest.fn(),
                onEnd: jest.fn(),
                onInterrupt: jest.fn()
            };
            
            const transition = animationSystem.createTransitionWithEvents({}, config);
            
            expect(transition.start).toBeDefined();
            expect(transition.interrupt).toBeDefined();
            expect(transition.then).toBeDefined();
        });
        
        test("should handle transition interruption", () => {
            const config = {
                onInterrupt: jest.fn()
            };
            
            const transition = animationSystem.createTransitionWithEvents({}, config);
            transition.interrupt();
            
            expect(config.onInterrupt).toHaveBeenCalled();
        });
        
        test("should configure transition settings", () => {
            const config = animationSystem.transitionConfig;
            
            expect(config.staggerDelay).toBeDefined();
            expect(config.defaultDuration).toBeDefined();
            expect(config.defaultEase).toBeDefined();
        });
        
        test("should support easing functions", () => {
            const easings = animationSystem.easingFunctions;
            
            expect(easings.linear).toBeDefined();
            expect(easings.easeOutQuad).toBeDefined();
            expect(easings.easeInElastic).toBeDefined();
            expect(easings.easeOutBounce).toBeDefined();
            
            // Test linear easing
            expect(easings.linear(0.5)).toBe(0.5);
        });
    });
    
    describe("Integration Tests", () => {
        test("should work together for enhanced chart features", () => {
            const scaleSystem = createScaleSystem();
            const brushSystem = createBrushSystem();
            const animationSystem = createAnimationSystem();
            
            // Test that all systems are available
            expect(scaleSystem).toBeDefined();
            expect(brushSystem).toBeDefined();
            expect(animationSystem).toBeDefined();
            
            // Test basic integration
            const data = [
                { label: "A", cumulativeTotal: 10 },
                { label: "B", cumulativeTotal: 20 }
            ];
            
            const scale = scaleSystem.createLinearScale(data.map(d => d.cumulativeTotal));
            const brush = brushSystem.createBrush();
            
            expect(scale).toBeDefined();
            expect(brush).toBeDefined();
        });
    });
});
