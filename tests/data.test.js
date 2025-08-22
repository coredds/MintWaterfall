// Data Processing Utilities Test Suite
import { dataProcessor } from '../mintwaterfall-data.js';

describe('MintWaterfall Data Processing', () => {
    const sampleData = [
        {
            label: 'Q1',
            stacks: [
                { value: 100, color: '#3498db', label: '100' },
                { value: 50, color: '#2ecc71', label: '50' }
            ]
        },
        {
            label: 'Q2',
            stacks: [
                { value: 75, color: '#3498db', label: '75' },
                { value: -25, color: '#e74c3c', label: '-25' }
            ]
        },
        {
            label: 'Q3',
            stacks: [
                { value: 200, color: '#3498db', label: '200' }
            ]
        }
    ];

    describe('validateData', () => {
        test('should validate correct data structure', () => {
            expect(() => dataProcessor.validateData(sampleData)).not.toThrow();
        });

        test('should throw error for non-array data', () => {
            expect(() => dataProcessor.validateData(null)).toThrow('Data must be an array');
            expect(() => dataProcessor.validateData({})).toThrow('Data must be an array');
        });

        test('should throw error for empty array', () => {
            expect(() => dataProcessor.validateData([])).toThrow('Data array cannot be empty');
        });

        test('should throw error for invalid item structure', () => {
            const invalidData = [{ label: 'Test' }]; // Missing stacks
            expect(() => dataProcessor.validateData(invalidData)).toThrow();
        });

        test('should throw error for invalid stack values', () => {
            const invalidData = [{
                label: 'Test',
                stacks: [{ value: 'invalid', color: '#000' }]
            }];
            expect(() => dataProcessor.validateData(invalidData)).toThrow();
        });
    });

    describe('aggregateData', () => {
        test('should aggregate by sum (default)', () => {
            const result = dataProcessor.aggregateData(sampleData);
            expect(result[0].aggregatedValue).toBe(150); // 100 + 50
            expect(result[1].aggregatedValue).toBe(50);  // 75 + (-25)
            expect(result[2].aggregatedValue).toBe(200); // 200
        });

        test('should aggregate by average', () => {
            const result = dataProcessor.aggregateData(sampleData, 'average');
            expect(result[0].aggregatedValue).toBe(75);  // (100 + 50) / 2
            expect(result[1].aggregatedValue).toBe(25);  // (75 + (-25)) / 2
            expect(result[2].aggregatedValue).toBe(200); // 200 / 1
        });

        test('should aggregate by max', () => {
            const result = dataProcessor.aggregateData(sampleData, 'max');
            expect(result[0].aggregatedValue).toBe(100); // max(100, 50)
            expect(result[1].aggregatedValue).toBe(75);  // max(75, -25)
            expect(result[2].aggregatedValue).toBe(200); // max(200)
        });

        test('should aggregate by min', () => {
            const result = dataProcessor.aggregateData(sampleData, 'min');
            expect(result[0].aggregatedValue).toBe(50);  // min(100, 50)
            expect(result[1].aggregatedValue).toBe(-25); // min(75, -25)
            expect(result[2].aggregatedValue).toBe(200); // min(200)
        });
    });

    describe('sortData', () => {
        test('should sort by label ascending (default)', () => {
            const result = dataProcessor.sortData(sampleData);
            expect(result[0].label).toBe('Q1');
            expect(result[1].label).toBe('Q2');
            expect(result[2].label).toBe('Q3');
        });

        test('should sort by label descending', () => {
            const result = dataProcessor.sortData(sampleData, 'label', 'descending');
            expect(result[0].label).toBe('Q3');
            expect(result[1].label).toBe('Q2');
            expect(result[2].label).toBe('Q1');
        });

        test('should sort by total value', () => {
            const result = dataProcessor.sortData(sampleData, 'total', 'ascending');
            expect(result[0].label).toBe('Q2'); // total: 50
            expect(result[1].label).toBe('Q1'); // total: 150
            expect(result[2].label).toBe('Q3'); // total: 200
        });

        test('should sort by max stack value', () => {
            const result = dataProcessor.sortData(sampleData, 'maxStack', 'ascending');
            expect(result[0].label).toBe('Q2'); // max: 75
            expect(result[1].label).toBe('Q1'); // max: 100
            expect(result[2].label).toBe('Q3'); // max: 200
        });
    });

    describe('filterData', () => {
        test('should filter data by function', () => {
            const result = dataProcessor.filterData(sampleData, item => 
                item.stacks.some(stack => stack.value > 100)
            );
            expect(result).toHaveLength(1);
            expect(result[0].label).toBe('Q3');
        });

        test('should throw error for non-function filter', () => {
            expect(() => dataProcessor.filterData(sampleData, 'not a function')).toThrow();
        });
    });

    describe('transformStacks', () => {
        test('should transform stack values', () => {
            const result = dataProcessor.transformStacks(sampleData, stack => ({
                ...stack,
                value: stack.value * 2
            }));
            
            expect(result[0].stacks[0].value).toBe(200); // 100 * 2
            expect(result[0].stacks[1].value).toBe(100); // 50 * 2
        });

        test('should throw error for non-function transform', () => {
            expect(() => dataProcessor.transformStacks(sampleData, 'not a function')).toThrow();
        });
    });

    describe('normalizeValues', () => {
        test('should normalize values to target max', () => {
            const result = dataProcessor.normalizeValues(sampleData, 50);
            const maxValue = Math.max(...result.flatMap(item => 
                item.stacks.map(stack => Math.abs(stack.value))
            ));
            expect(maxValue).toBe(50);
        });

        test('should preserve original values', () => {
            const result = dataProcessor.normalizeValues(sampleData, 50);
            expect(result[2].stacks[0].originalValue).toBe(200);
        });
    });

    describe('groupByCategory', () => {
        test('should group data by category function', () => {
            const testData = [
                ...sampleData,
                { label: 'Q1-extra', stacks: [{ value: 10, color: '#000', label: '10' }] }
            ];
            
            const result = dataProcessor.groupByCategory(testData, item => 
                item.label.startsWith('Q1') ? 'Quarter1' : 'Other'
            );
            
            expect(result.Quarter1).toHaveLength(2);
            expect(result.Other).toHaveLength(2);
        });

        test('should throw error for non-function extractor', () => {
            expect(() => dataProcessor.groupByCategory(sampleData, 'not a function')).toThrow();
        });
    });

    describe('calculatePercentages', () => {
        test('should calculate correct percentages', () => {
            const result = dataProcessor.calculatePercentages(sampleData);
            
            // Q1: 100 + 50 = 150 total
            expect(result[0].stacks[0].percentage).toBeCloseTo(100 * 100 / 150, 10); // ~66.67%
            expect(result[0].stacks[1].percentage).toBeCloseTo(50 * 100 / 150, 10);  // ~33.33%
            
            // Q2: |75| + |-25| = 100 total
            expect(result[1].stacks[0].percentage).toBe(75);  // 75%
            expect(result[1].stacks[1].percentage).toBe(25);  // 25%
        });

        test('should handle zero totals', () => {
            const zeroData = [{
                label: 'Zero',
                stacks: [{ value: 0, color: '#000', label: '0' }]
            }];
            
            const result = dataProcessor.calculatePercentages(zeroData);
            expect(result[0].stacks[0].percentage).toBe(0);
        });
    });

    describe('interpolateData', () => {
        test('should interpolate between two datasets', () => {
            const data1 = [{ label: 'A', stacks: [{ value: 0, color: '#000', label: '0' }] }];
            const data2 = [{ label: 'A', stacks: [{ value: 100, color: '#000', label: '100' }] }];
            
            const result = dataProcessor.interpolateData(data1, data2, 0.5);
            expect(result[0].stacks[0].value).toBe(50);
        });

        test('should throw error for mismatched data lengths', () => {
            const data1 = [{ label: 'A', stacks: [{ value: 0, color: '#000', label: '0' }] }];
            const data2 = [];
            
            expect(() => dataProcessor.interpolateData(data1, data2, 0.5)).toThrow();
        });
    });

    describe('generateSampleData', () => {
        test('should generate data with correct structure', () => {
            const result = dataProcessor.generateSampleData(3, 2);
            
            expect(result).toHaveLength(3);
            result.forEach(item => {
                expect(item).toHaveProperty('label');
                expect(item).toHaveProperty('stacks');
                expect(Array.isArray(item.stacks)).toBe(true);
                expect(item.stacks.length).toBeGreaterThan(0);
                expect(item.stacks.length).toBeLessThanOrEqual(2);
            });
        });

        test('should generate values within specified range', () => {
            const result = dataProcessor.generateSampleData(2, 1, [50, 100]);
            
            result.forEach(item => {
                item.stacks.forEach(stack => {
                    expect(Math.abs(stack.value)).toBeGreaterThanOrEqual(50);
                    expect(Math.abs(stack.value)).toBeLessThanOrEqual(100);
                });
            });
        });
    });
});
