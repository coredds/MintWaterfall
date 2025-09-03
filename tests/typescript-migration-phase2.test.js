// Test for TypeScript data and scales modules
// Phase 2 TypeScript Migration Tests

import { describe, it, expect } from '@jest/globals';
import { 
    loadData, 
    transformToWaterfallFormat, 
    createDataProcessor,
    dataProcessor 
} from '../dist/mintwaterfall.esm.js';
import { 
    createScaleSystem, 
    createTimeScale, 
    createOrdinalScale,
    createBandScale,
    createLinearScale
} from '../dist/mintwaterfall.esm.js';

describe('TypeScript Data Module', () => {
    const sampleData = [
        { label: 'Start', stacks: [{ value: 100, color: '#0066cc', label: '+100' }] },
        { label: 'Change 1', stacks: [{ value: 20, color: '#00cc66', label: '+20' }] },
        { label: 'Change 2', stacks: [{ value: -15, color: '#cc6600', label: '-15' }] }
    ];

    describe('Data Processor Factory', () => {
        it('should create a data processor with all methods', () => {
            const processor = createDataProcessor();
            
            expect(typeof processor.validateData).toBe('function');
            expect(typeof processor.aggregateData).toBe('function');
            expect(typeof processor.sortData).toBe('function');
            expect(typeof processor.filterData).toBe('function');
            expect(typeof processor.getDataSummary).toBe('function');
            expect(typeof processor.transformData).toBe('function');
            expect(typeof processor.groupData).toBe('function');
        });

        it('should validate data correctly', () => {
            const processor = createDataProcessor();
            expect(() => processor.validateData(sampleData)).not.toThrow();
            expect(processor.validateData(sampleData)).toBe(true);
        });

        it('should aggregate data with type safety', () => {
            const processor = createDataProcessor();
            const aggregated = processor.aggregateData(sampleData, 'sum');
            
            expect(aggregated).toHaveLength(3);
            expect(aggregated[0].aggregatedValue).toBe(100);
            expect(aggregated[1].aggregatedValue).toBe(20);
            expect(aggregated[2].aggregatedValue).toBe(-15);
        });

        it('should provide data summary with correct types', () => {
            const processor = createDataProcessor();
            const summary = processor.getDataSummary(sampleData);
            
            expect(summary.totalItems).toBe(3);
            expect(summary.totalStacks).toBe(3);
            expect(summary.valueRange.min).toBe(-15);
            expect(summary.valueRange.max).toBe(100);
            expect(summary.cumulativeTotal).toBe(105);
            expect(Array.isArray(summary.stackColors)).toBe(true);
            expect(Array.isArray(summary.labels)).toBe(true);
        });
    });

    describe('Data Transformation', () => {
        it('should transform raw data to waterfall format', () => {
            const rawData = [
                { value: 100, label: 'Start', color: '#0066cc' },
                { value: 20, label: 'Change 1', color: '#00cc66' },
                { value: -15, label: 'Change 2', color: '#cc6600' }
            ];

            const transformed = transformToWaterfallFormat(rawData);
            
            expect(transformed).toHaveLength(3);
            expect(transformed[0].label).toBe('Start');
            expect(transformed[0].stacks[0].value).toBe(100);
            expect(transformed[0].stacks[0].color).toBe('#0066cc');
        });

        it('should handle data already in correct format', () => {
            const transformed = transformToWaterfallFormat(sampleData);
            expect(transformed).toEqual(sampleData);
        });
    });

    describe('Default Data Processor', () => {
        it('should provide working default instance', () => {
            expect(typeof dataProcessor.validateData).toBe('function');
            expect(() => dataProcessor.validateData(sampleData)).not.toThrow();
        });
    });
});

describe('TypeScript Scales Module', () => {
    const numericValues = [10, 20, 30, 40, 50];
    const categoricalValues = ['A', 'B', 'C', 'D'];
    const dateValues = [
        new Date('2023-01-01'),
        new Date('2023-02-01'),
        new Date('2023-03-01')
    ];

    describe('Scale System Factory', () => {
        it('should create a scale system with all methods', () => {
            const scaleSystem = createScaleSystem();
            
            expect(typeof scaleSystem.createAdaptiveScale).toBe('function');
            expect(typeof scaleSystem.createTimeScale).toBe('function');
            expect(typeof scaleSystem.createOrdinalScale).toBe('function');
            expect(typeof scaleSystem.createBandScale).toBe('function');
            expect(typeof scaleSystem.createLinearScale).toBe('function');
            expect(typeof scaleSystem.setDefaultRange).toBe('function');
            expect(typeof scaleSystem.getScaleInfo).toBe('function');
        });

        it('should create adaptive scales based on data type', () => {
            const scaleSystem = createScaleSystem();
            
            // Test with mock data for different types
            const numericData = numericValues.map(v => ({ cumulativeTotal: v }));
            const categoricalData = categoricalValues.map(v => ({ label: v }));
            
            const numericScale = scaleSystem.createAdaptiveScale(numericData, 'y');
            const categoricalScale = scaleSystem.createAdaptiveScale(categoricalData, 'x');
            
            expect(numericScale).toBeDefined();
            expect(categoricalScale).toBeDefined();
        });
    });

    describe('Specific Scale Types', () => {
        it('should create linear scales with proper typing', () => {
            const scale = createLinearScale(numericValues, { 
                range: [0, 100], 
                nice: true 
            });
            
            expect(scale).toBeDefined();
            expect(typeof scale.domain).toBe('function');
            expect(typeof scale.range).toBe('function');
            expect(Array.isArray(scale.domain())).toBe(true);
            expect(Array.isArray(scale.range())).toBe(true);
        });

        it('should create band scales for categorical data', () => {
            const scale = createBandScale(categoricalValues, {
                padding: 0.1
            });
            
            expect(scale).toBeDefined();
            expect(typeof scale.bandwidth).toBe('function');
            expect(typeof scale.step).toBe('function');
            expect(scale.domain()).toEqual(categoricalValues);
        });

        it('should create time scales with date handling', () => {
            const scale = createTimeScale(dateValues, {
                range: [0, 300],
                nice: true
            });
            
            expect(scale).toBeDefined();
            expect(scale.domain()[0]).toBeInstanceOf(Date);
            expect(scale.domain()[1]).toBeInstanceOf(Date);
        });

        it('should create ordinal scales with color mapping', () => {
            const scale = createOrdinalScale(categoricalValues, {
                range: ['#ff0000', '#00ff00', '#0000ff', '#ffff00'],
                unknown: '#cccccc'
            });
            
            expect(scale).toBeDefined();
            expect(scale.domain()).toEqual(categoricalValues);
            expect(typeof scale('A')).toBe('string');
        });
    });

    describe('Scale Information', () => {
        it('should extract scale information correctly', () => {
            const scaleSystem = createScaleSystem();
            const linearScale = createLinearScale(numericValues);
            const bandScale = createBandScale(categoricalValues);
            
            const linearInfo = scaleSystem.getScaleInfo(linearScale);
            const bandInfo = scaleSystem.getScaleInfo(bandScale);
            
            expect(linearInfo.type).toBe('linear');
            expect(Array.isArray(linearInfo.domain)).toBe(true);
            expect(Array.isArray(linearInfo.range)).toBe(true);
            
            expect(bandInfo.type).toBe('band');
            expect(typeof bandInfo.bandwidth).toBe('number');
            expect(typeof bandInfo.step).toBe('number');
        });
    });
});

describe('TypeScript Integration', () => {
    it('should work with mixed JavaScript/TypeScript environment', () => {
        // Test that TypeScript modules can be imported and used
        // alongside existing JavaScript modules
        const processor = createDataProcessor();
        const scaleSystem = createScaleSystem();
        
        const testData = [
            { label: 'Test', stacks: [{ value: 42, color: '#test', label: 'Test Stack' }] }
        ];
        
        expect(() => processor.validateData(testData)).not.toThrow();
        
        const scale = scaleSystem.createLinearScale([1, 2, 3, 4, 5]);
        expect(scale).toBeDefined();
    });

    it('should maintain backward compatibility', () => {
        // Ensure the default exports work as before
        expect(typeof dataProcessor).toBe('object');
        expect(typeof dataProcessor.validateData).toBe('function');
        
        // Test that the functions can be called in the same way
        const sampleData = [
            { label: 'Test', stacks: [{ value: 100, color: '#test', label: '+100' }] }
        ];
        
        expect(() => dataProcessor.validateData(sampleData)).not.toThrow();
    });
});
