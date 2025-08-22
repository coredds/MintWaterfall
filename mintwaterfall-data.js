// MintWaterfall Data Processing Utilities
// Provides data transformation, aggregation, and manipulation functions

export function createDataProcessor() {
    
    function validateData(data) {
        if (!data || !Array.isArray(data)) {
            throw new Error('Data must be an array');
        }
        
        if (data.length === 0) {
            throw new Error('Data array cannot be empty');
        }
        
        const isValid = data.every((item, index) => {
            if (!item || typeof item !== 'object') {
                throw new Error(`Item at index ${index} must be an object`);
            }
            
            if (typeof item.label !== 'string') {
                throw new Error(`Item at index ${index} must have a string 'label' property`);
            }
            
            if (!Array.isArray(item.stacks)) {
                throw new Error(`Item at index ${index} must have an array 'stacks' property`);
            }
            
            if (item.stacks.length === 0) {
                throw new Error(`Item at index ${index} must have at least one stack`);
            }
            
            item.stacks.forEach((stack, stackIndex) => {
                if (typeof stack.value !== 'number' || isNaN(stack.value)) {
                    throw new Error(`Stack ${stackIndex} in item ${index} must have a numeric 'value'`);
                }
                
                if (typeof stack.color !== 'string') {
                    throw new Error(`Stack ${stackIndex} in item ${index} must have a string 'color'`);
                }
            });
            
            return true;
        });
        
        return isValid;
    }
    
    function aggregateData(data, aggregateBy = 'sum') {
        validateData(data);
        
        return data.map(item => {
            let aggregatedValue;
            
            switch (aggregateBy) {
                case 'sum':
                    aggregatedValue = item.stacks.reduce((sum, stack) => sum + stack.value, 0);
                    break;
                case 'average':
                    aggregatedValue = item.stacks.reduce((sum, stack) => sum + stack.value, 0) / item.stacks.length;
                    break;
                case 'max':
                    aggregatedValue = Math.max(...item.stacks.map(s => s.value));
                    break;
                case 'min':
                    aggregatedValue = Math.min(...item.stacks.map(s => s.value));
                    break;
                default:
                    aggregatedValue = item.stacks.reduce((sum, stack) => sum + stack.value, 0);
            }
            
            return {
                ...item,
                aggregatedValue,
                originalStacks: item.stacks
            };
        });
    }
    
    function sortData(data, sortBy = 'label', direction = 'ascending') {
        validateData(data);
        
        const sorted = [...data].sort((a, b) => {
            let valueA, valueB;
            
            switch (sortBy) {
                case 'label':
                    valueA = a.label.toLowerCase();
                    valueB = b.label.toLowerCase();
                    break;
                case 'total':
                    valueA = a.stacks.reduce((sum, stack) => sum + stack.value, 0);
                    valueB = b.stacks.reduce((sum, stack) => sum + stack.value, 0);
                    break;
                case 'maxStack':
                    valueA = Math.max(...a.stacks.map(s => s.value));
                    valueB = Math.max(...b.stacks.map(s => s.value));
                    break;
                case 'stackCount':
                    valueA = a.stacks.length;
                    valueB = b.stacks.length;
                    break;
                default:
                    valueA = a.label.toLowerCase();
                    valueB = b.label.toLowerCase();
            }
            
            if (direction === 'ascending') {
                return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
            } else {
                return valueA > valueB ? -1 : valueA < valueB ? 1 : 0;
            }
        });
        
        return sorted;
    }
    
    function filterData(data, filterFn) {
        validateData(data);
        
        if (typeof filterFn !== 'function') {
            throw new Error('Filter must be a function');
        }
        
        return data.filter(filterFn);
    }
    
    function transformStacks(data, transformFn) {
        validateData(data);
        
        if (typeof transformFn !== 'function') {
            throw new Error('Transform function must be a function');
        }
        
        return data.map(item => ({
            ...item,
            stacks: item.stacks.map(transformFn)
        }));
    }
    
    function normalizeValues(data, targetMax = 100) {
        validateData(data);
        
        // Find the maximum absolute value across all stacks
        let maxAbsValue = 0;
        data.forEach(item => {
            item.stacks.forEach(stack => {
                maxAbsValue = Math.max(maxAbsValue, Math.abs(stack.value));
            });
        });
        
        if (maxAbsValue === 0) {
            return data; // Avoid division by zero
        }
        
        const scaleFactor = targetMax / maxAbsValue;
        
        return transformStacks(data, stack => ({
            ...stack,
            value: stack.value * scaleFactor,
            originalValue: stack.value
        }));
    }
    
    function groupByCategory(data, categoryExtractor) {
        validateData(data);
        
        if (typeof categoryExtractor !== 'function') {
            throw new Error('Category extractor must be a function');
        }
        
        const grouped = {};
        
        data.forEach(item => {
            const category = categoryExtractor(item);
            if (!grouped[category]) {
                grouped[category] = [];
            }
            grouped[category].push(item);
        });
        
        return grouped;
    }
    
    function calculatePercentages(data) {
        validateData(data);
        
        return data.map(item => {
            const total = item.stacks.reduce((sum, stack) => sum + Math.abs(stack.value), 0);
            
            if (total === 0) {
                return {
                    ...item,
                    stacks: item.stacks.map(stack => ({
                        ...stack,
                        percentage: 0
                    }))
                };
            }
            
            return {
                ...item,
                stacks: item.stacks.map(stack => ({
                    ...stack,
                    percentage: (Math.abs(stack.value) / total) * 100
                }))
            };
        });
    }
    
    function interpolateData(data1, data2, t) {
        // Simple linear interpolation between two datasets
        // t should be between 0 and 1
        if (data1.length !== data2.length) {
            throw new Error('Datasets must have the same length for interpolation');
        }
        
        return data1.map((item1, index) => {
            const item2 = data2[index];
            
            if (item1.stacks.length !== item2.stacks.length) {
                throw new Error(`Items at index ${index} must have the same number of stacks`);
            }
            
            return {
                label: item1.label, // Use first dataset's label
                stacks: item1.stacks.map((stack1, stackIndex) => {
                    const stack2 = item2.stacks[stackIndex];
                    return {
                        ...stack1,
                        value: stack1.value + (stack2.value - stack1.value) * t
                    };
                })
            };
        });
    }
    
    function generateSampleData(categories = 5, maxStacks = 3, valueRange = [10, 100]) {
        const colors = ['#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6', '#1abc9c'];
        const data = [];
        
        for (let i = 0; i < categories; i++) {
            const stackCount = Math.floor(Math.random() * maxStacks) + 1;
            const stacks = [];
            
            for (let j = 0; j < stackCount; j++) {
                const value = Math.random() * (valueRange[1] - valueRange[0]) + valueRange[0];
                const isNegative = Math.random() < 0.2; // 20% chance of negative values
                
                stacks.push({
                    value: isNegative ? -Math.abs(value) : value,
                    color: colors[j % colors.length],
                    label: Math.round(value).toString()
                });
            }
            
            data.push({
                label: `Category ${i + 1}`,
                stacks: stacks
            });
        }
        
        return data;
    }
    
    return {
        validateData,
        aggregateData,
        sortData,
        filterData,
        transformStacks,
        normalizeValues,
        groupByCategory,
        calculatePercentages,
        interpolateData,
        generateSampleData
    };
}

// Create a global data processor instance
export const dataProcessor = createDataProcessor();
