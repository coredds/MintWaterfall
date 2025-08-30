// MintWaterfall - Advanced D3.js data processing utilities
// Implements d3.group, d3.rollup, and other modern data transformation functions

/* global d3 */

// Ensure we're in a browser context with D3
if (typeof d3 === "undefined" && typeof require !== "undefined") {
     
    d3 = require("d3");
}

/**
 * Advanced data processor with modern D3.js data structures
 * @returns {Object} Data processor API
 */
export function createAdvancedDataProcessor() {
    
    /**
     * Groups data using d3.group with multiple levels
     * @param {Array} data - Input data array
     * @param {...Function} keys - Key accessor functions for grouping levels
     * @returns {Map} Grouped data structure
     */
    function groupData(data, ...keys) {
        if (!data || !Array.isArray(data)) {
            console.error("MintWaterfall: Invalid data provided to groupData");
            return new Map();
        }
        
        if (keys.length === 0) {
            console.warn("MintWaterfall: No grouping keys provided");
            return new Map();
        }
        
        return d3.group(data, ...keys);
    }
    
    /**
     * Rolls up data using d3.rollup with aggregation
     * @param {Array} data - Input data array
     * @param {Function} reducer - Aggregation function
     * @param {...Function} keys - Key accessor functions for grouping levels
     * @returns {Map} Rolled up data structure
     */
    function rollupData(data, reducer, ...keys) {
        if (!data || !Array.isArray(data)) {
            console.error("MintWaterfall: Invalid data provided to rollupData");
            return new Map();
        }
        
        if (!reducer || typeof reducer !== "function") {
            console.error("MintWaterfall: Invalid reducer function provided to rollupData");
            return new Map();
        }
        
        if (keys.length === 0) {
            console.warn("MintWaterfall: No grouping keys provided");
            return new Map();
        }
        
        return d3.rollup(data, reducer, ...keys);
    }
    
    /**
     * Creates a summary of grouped data
     * @param {Array} data - Input data array
     * @param {Object} options - Configuration options
     * @returns {Object} Summary statistics
     */
    function createDataSummary(data, options = {}) {
        if (!data || !Array.isArray(data)) {
            console.error("MintWaterfall: Invalid data provided to createDataSummary");
            return {};
        }
        
        const {
            valueField = "value",
            groupField = "category",
            includePercentages = true,
            includeCounts = true, // eslint-disable-line no-unused-vars
            includeStatistics = true
        } = options;
        
        // Group data by specified field
        const grouped = d3.group(data, d => d[groupField]);
        
        // Calculate summary for each group
        const summary = {
            groups: [],
            totals: {},
            metadata: {
                totalRecords: data.length,
                groupCount: grouped.size,
                fields: Object.keys(data[0] || {})
            }
        };
        
        let grandTotal = 0;
        
        for (const [key, values] of grouped) {
            const numericValues = values
                .map(d => +d[valueField])
                .filter(v => !isNaN(v));
                
            const groupSum = d3.sum(numericValues);
            grandTotal += groupSum;
            
            const groupSummary = {
                key,
                count: values.length,
                sum: groupSum
            };
            
            if (includeStatistics && numericValues.length > 0) {
                groupSummary.mean = d3.mean(numericValues);
                groupSummary.median = d3.median(numericValues);
                groupSummary.min = d3.min(numericValues);
                groupSummary.max = d3.max(numericValues);
                groupSummary.extent = d3.extent(numericValues);
            }
            
            summary.groups.push(groupSummary);
        }
        
        // Add percentages if requested
        if (includePercentages && grandTotal !== 0) {
            summary.groups.forEach(group => {
                group.percentage = (group.sum / grandTotal) * 100;
            });
        }
        
        // Add totals
        summary.totals = {
            sum: grandTotal,
            count: data.length,
            average: grandTotal / summary.groups.length
        };
        
        return summary;
    }
    
    /**
     * Transforms flat data into hierarchical structure for waterfall charts
     * @param {Array} data - Input data array
     * @param {Object} options - Configuration options
     * @returns {Array} Waterfall-compatible data
     */
    function transformToWaterfall(data, options = {}) {
        if (!data || !Array.isArray(data)) {
            console.error("MintWaterfall: Invalid data provided to transformToWaterfall");
            return [];
        }
        
        const {
            labelField = "label",
            valueField = "value",
            colorField = "color",
            groupField = null,
            aggregateFunction = d3.sum,
            defaultColor = "#3498db",
            sortBy = null,
            sortOrder = "desc" // 'asc' or 'desc'
        } = options;
        
        let processedData = [...data];
        
        // Group data if groupField is specified
        if (groupField) {
            const grouped = d3.rollup(
                data,
                values => aggregateFunction(values, d => +d[valueField]),
                d => d[groupField]
            );
            
            processedData = Array.from(grouped, ([key, value]) => ({
                [labelField]: key,
                [valueField]: value,
                [colorField]: defaultColor
            }));
        }
        
        // Sort data if requested
        if (sortBy) {
            processedData.sort((a, b) => {
                const aVal = a[sortBy];
                const bVal = b[sortBy];
                const comparison = typeof aVal === "string" ? 
                    aVal.localeCompare(bVal) : 
                    aVal - bVal;
                return sortOrder === "desc" ? -comparison : comparison;
            });
        }
        
        // Transform to waterfall format
        return processedData.map(item => ({
            label: item[labelField],
            stacks: [{
                value: +item[valueField],
                color: item[colorField] || defaultColor,
                label: item[valueField].toString()
            }]
        }));
    }
    
    /**
     * Creates cross-tabulation of data
     * @param {Array} data - Input data array
     * @param {string} rowField - Field for rows
     * @param {string} colField - Field for columns
     * @param {string} valueField - Field for values
     * @param {Function} aggregateFunction - Aggregation function
     * @returns {Object} Cross-tabulation result
     */
    function createCrosstab(data, rowField, colField, valueField, aggregateFunction = d3.sum) {
        if (!data || !Array.isArray(data)) {
            console.error("MintWaterfall: Invalid data provided to createCrosstab");
            return {};
        }
        
        // Get unique values for rows and columns
        const rowValues = [...new Set(data.map(d => d[rowField]))].sort();
        const colValues = [...new Set(data.map(d => d[colField]))].sort();
        
        // Create cross-tabulation
        const crosstab = {
            rows: rowValues,
            columns: colValues,
            data: {},
            totals: {
                rows: {},
                columns: {},
                grand: 0
            }
        };
        
        // Initialize data structure
        rowValues.forEach(row => {
            crosstab.data[row] = {};
            crosstab.totals.rows[row] = 0;
            colValues.forEach(col => {
                crosstab.data[row][col] = 0;
            });
        });
        
        colValues.forEach(col => {
            crosstab.totals.columns[col] = 0;
        });
        
        // Group data by row and column
        const grouped = d3.rollup(
            data,
            values => aggregateFunction(values, d => +d[valueField]),
            d => d[rowField],
            d => d[colField]
        );
        
        // Fill in the crosstab
        for (const [row, colMap] of grouped) {
            for (const [col, value] of colMap) {
                crosstab.data[row][col] = value;
                crosstab.totals.rows[row] += value;
                crosstab.totals.columns[col] += value;
                crosstab.totals.grand += value;
            }
        }
        
        return crosstab;
    }
    
    /**
     * Performs data aggregation with multiple metrics
     * @param {Array} data - Input data array
     * @param {Object} options - Configuration options
     * @returns {Array} Aggregated data
     */
    function aggregateData(data, options = {}) {
        if (!data || !Array.isArray(data)) {
            console.error("MintWaterfall: Invalid data provided to aggregateData");
            return [];
        }
        
        const {
            groupBy = [],
            metrics = {},
            includeCount = true
        } = options;
        
        if (groupBy.length === 0) {
            console.warn("MintWaterfall: No groupBy fields specified");
            return data;
        }
        
        // Create key accessors for grouping
        const keyAccessors = groupBy.map(field => 
            typeof field === "string" ? d => d[field] : field
        );
        
        // Group the data
        const grouped = d3.group(data, ...keyAccessors);
        
        // Aggregate each group
        const results = [];
        
        function processGroup(group, keys = []) {
            if (group instanceof Map) {
                for (const [key, subGroup] of group) {
                    processGroup(subGroup, [...keys, key]);
                }
            } else {
                // This is a leaf group (array of data items)
                const aggregated = {};
                
                // Add grouping keys
                groupBy.forEach((field, index) => {
                    const fieldName = typeof field === "string" ? field : `group_${index}`;
                    aggregated[fieldName] = keys[index];
                });
                
                // Add count if requested
                if (includeCount) {
                    aggregated.count = group.length;
                }
                
                // Calculate metrics
                for (const [metricName, config] of Object.entries(metrics)) {
                    const { field, aggregateFunction = d3.sum } = config;
                    const values = group.map(d => +d[field]).filter(v => !isNaN(v));
                    aggregated[metricName] = aggregateFunction(values);
                }
                
                results.push(aggregated);
            }
        }
        
        processGroup(grouped);
        return results;
    }
    
    /**
     * Creates time-series aggregation
     * @param {Array} data - Input data array
     * @param {Object} options - Configuration options
     * @returns {Array} Time-series data
     */
    function createTimeSeries(data, options = {}) {
        if (!data || !Array.isArray(data)) {
            console.error("MintWaterfall: Invalid data provided to createTimeSeries");
            return [];
        }
        
        const {
            dateField = "date",
            valueField = "value",
            interval = "day", // 'day', 'week', 'month', 'quarter', 'year'
            aggregateFunction = d3.sum,
            fillGaps = false
        } = options;
        
        // Parse dates and create time intervals
        const parseDate = d3.timeParse("%Y-%m-%d");
        const timeIntervals = {
            day: d3.timeDay,
            week: d3.timeWeek,
            month: d3.timeMonth,
            quarter: d3.timeMonth.every(3),
            year: d3.timeYear
        };
        
        const timeInterval = timeIntervals[interval] || d3.timeDay;
        
        // Group data by time interval
        const grouped = d3.rollup(
            data,
            values => aggregateFunction(values, d => +d[valueField]),
            d => {
                const date = d[dateField] instanceof Date ? 
                    d[dateField] : 
                    parseDate(d[dateField]);
                return timeInterval.floor(date);
            }
        );
        
        // Convert to array and sort by date
        let timeSeries = Array.from(grouped, ([date, value]) => ({
            date,
            value,
            [dateField]: date,
            [valueField]: value
        })).sort((a, b) => a.date - b.date);
        
        // Fill gaps if requested
        if (fillGaps && timeSeries.length > 1) {
            const [minDate, maxDate] = d3.extent(timeSeries, d => d.date);
            const allDates = timeInterval.range(minDate, timeInterval.offset(maxDate, 1));
            const dateValueMap = new Map(timeSeries.map(d => [d.date.getTime(), d.value]));
            
            timeSeries = allDates.map(date => ({
                date,
                value: dateValueMap.get(date.getTime()) || 0,
                [dateField]: date,
                [valueField]: dateValueMap.get(date.getTime()) || 0
            }));
        }
        
        return timeSeries;
    }
    
    // Public API
    return {
        group: groupData,
        rollup: rollupData,
        summary: createDataSummary,
        toWaterfall: transformToWaterfall,
        crosstab: createCrosstab,
        aggregate: aggregateData,
        timeSeries: createTimeSeries
    };
}

/**
 * Utility functions for working with grouped data
 */
export const dataUtils = {
    /**
     * Converts a Map to a nested object
     * @param {Map} map - Input map
     * @returns {Object} Nested object
     */
    mapToObject(map) {
        if (!(map instanceof Map)) {
            return map;
        }
        
        const obj = {};
        for (const [key, value] of map) {
            obj[key] = value instanceof Map ? this.mapToObject(value) : value;
        }
        return obj;
    },
    
    /**
     * Converts a Map to a flat array
     * @param {Map} map - Input map
     * @param {Array} keyNames - Names for the key columns
     * @param {string} valueName - Name for the value column
     * @returns {Array} Flat array
     */
    mapToArray(map, keyNames = ["key"], valueName = "value") {
        const results = [];
        
        function flatten(currentMap, keys = []) {
            if (!(currentMap instanceof Map)) {
                // This is a leaf value
                const obj = {};
                keyNames.forEach((name, index) => {
                    obj[name] = keys[index];
                });
                obj[valueName] = currentMap;
                results.push(obj);
            } else {
                // This is a nested Map
                for (const [key, value] of currentMap) {
                    flatten(value, [...keys, key]);
                }
            }
        }
        
        flatten(map);
        return results;
    },
    
    /**
     * Filters grouped data
     * @param {Map} groupedData - Grouped data
     * @param {Function} predicate - Filter function
     * @returns {Map} Filtered grouped data
     */
    filterGroups(groupedData, predicate) {
        const filtered = new Map();
        
        for (const [key, value] of groupedData) {
            if (value instanceof Map) {
                const filteredSubGroup = this.filterGroups(value, predicate);
                if (filteredSubGroup.size > 0) {
                    filtered.set(key, filteredSubGroup);
                }
            } else if (Array.isArray(value)) {
                const filteredArray = value.filter(predicate);
                if (filteredArray.length > 0) {
                    filtered.set(key, filteredArray);
                }
            } else if (predicate(value, key)) {
                filtered.set(key, value);
            }
        }
        
        return filtered;
    }
};

// Create a default instance
export const advancedDataProcessor = createAdvancedDataProcessor();

// Add to d3 namespace for compatibility
if (typeof d3 !== "undefined") {
    d3.advancedDataProcessor = advancedDataProcessor;
    d3.dataUtils = dataUtils;
}
