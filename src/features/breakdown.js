/**
 * Breakdown Feature - Enterprise Edition
 * Provides hierarchical data drill-down functionality for waterfall charts
 */

// Default configuration for breakdown feature
const defaultConfig = {
    enabled: false,
    maxBreakdowns: 5,
    showOthers: true,
    otherLabel: "Others",
    sortStrategy: "value-desc",
    threshold: 0.05
};

/**
 * Process breakdown data for a waterfall chart item
 * @param {Array} data - Chart data with breakdown information
 * @param {Object} config - Breakdown configuration
 * @returns {Array} Processed data with breakdown enhancements
 */
export function processBreakdownData(data, config = {}) {
    const settings = { ...defaultConfig, ...config };
    
    if (!settings.enabled) {
        return data;
    }

    return data.map(item => {
        if (!item.breakdown || !item.breakdown.data) {
            return item;
        }

        const breakdownData = item.breakdown.data.slice();
        
        // Sort breakdown data according to strategy
        if (settings.sortStrategy === 'value-desc') {
            breakdownData.sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
        } else if (settings.sortStrategy === 'value-asc') {
            breakdownData.sort((a, b) => Math.abs(a.value) - Math.abs(b.value));
        } else if (settings.sortStrategy === 'alphabetical') {
            breakdownData.sort((a, b) => a.name.localeCompare(b.name));
        }

        // Apply maxBreakdowns limit
        let processedBreakdown = breakdownData.slice(0, settings.maxBreakdowns);
        let others = breakdownData.slice(settings.maxBreakdowns);

        // Group remaining items into "Others" if enabled
        if (settings.showOthers && others.length > 0) {
            const othersValue = others.reduce((sum, item) => sum + item.value, 0);
            processedBreakdown.push({
                name: settings.otherLabel,
                value: othersValue,
                color: "#95a5a6",
                isOthers: true,
                items: others
            });
        }

        return {
            ...item,
            breakdown: {
                ...item.breakdown,
                processed: processedBreakdown,
                config: settings
            }
        };
    });
}

/**
 * Create breakdown configuration object
 * @param {Object} options - Configuration options
 * @returns {Object} Breakdown configuration
 */
export function createBreakdownConfig(options = {}) {
    return { ...defaultConfig, ...options };
}

/**
 * Validate breakdown data structure
 * @param {Array} data - Data to validate
 * @returns {Boolean} True if valid
 */
export function validateBreakdownData(data) {
    if (!Array.isArray(data)) return false;
    
    return data.every(item => {
        if (!item.breakdown) return true; // Optional feature
        
        return (
            item.breakdown.data &&
            Array.isArray(item.breakdown.data) &&
            item.breakdown.data.every(subItem => 
                subItem.name && 
                typeof subItem.value === 'number' && 
                subItem.color
            )
        );
    });
}

/**
 * Calculate breakdown statistics
 * @param {Object} item - Chart item with breakdown data
 * @returns {Object} Statistics about the breakdown
 */
export function calculateBreakdownStats(item) {
    if (!item.breakdown || !item.breakdown.data) {
        return null;
    }

    const data = item.breakdown.data;
    const total = data.reduce((sum, subItem) => sum + subItem.value, 0);
    const count = data.length;
    const average = total / count;
    const largest = Math.max(...data.map(d => Math.abs(d.value)));
    const smallest = Math.min(...data.map(d => Math.abs(d.value)));

    return {
        total,
        count,
        average,
        largest,
        smallest,
        coverage: (total / item.stacks.reduce((sum, stack) => sum + stack.value, 0)) * 100
    };
}

// Export the breakdown feature interface
export const breakdown = {
    processBreakdownData,
    createBreakdownConfig,
    validateBreakdownData,
    calculateBreakdownStats,
    defaultConfig
};

export default breakdown;
