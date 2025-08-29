/**
 * MintWaterfall Conditional Formatting Feature
 * Day 3 Enterprise Feature Implementation
 * 
 * Provides dynamic styling capabilities based on data values and custom conditions.
 * Supports color scales, thresholds, data-driven styling, and custom formatters.
 */

class ConditionalFormattingFeature {
    constructor() {
        this.id = 'conditional-formatting';
        this.name = 'Conditional Formatting';
        this.version = '1.0.0';
        this.enabled = false;
        
        // Formatting rules and conditions
        this.rules = new Map();
        this.colorScales = new Map();
        this.thresholds = new Map();
        this.customFormatters = new Map();
        
        // Performance tracking
        this.metrics = {
            rulesApplied: 0,
            processingTime: 0,
            lastUpdate: null
        };
        
        // Default color scales
        this.initializeDefaultColorScales();
    }
    
    /**
     * Initialize the conditional formatting feature
     */
    initialize(chart) {
        this.chart = chart;
        this.enabled = true;
        
        // Add conditional formatting methods to chart API
        this.extendChartAPI();
        
        console.log(`✅ ${this.name} feature initialized`);
        return this;
    }
    
    /**
     * Extend the chart API with conditional formatting methods
     */
    extendChartAPI() {
        if (!this.chart) return;
        
        // Add getter/setter methods
        this.chart.colorScale = (scale) => {
            if (!arguments.length) return this.getColorScale();
            return this.setColorScale(scale);
        };
        
        this.chart.addRule = (rule) => {
            return this.addFormattingRule(rule);
        };
        
        this.chart.removeRule = (ruleId) => {
            return this.removeFormattingRule(ruleId);
        };
        
        this.chart.addThreshold = (threshold) => {
            return this.addThreshold(threshold);
        };
        
        this.chart.formatValue = (formatter) => {
            if (!arguments.length) return this.getCustomFormatter();
            return this.setCustomFormatter(formatter);
        };
    }
    
    /**
     * Initialize default color scales
     */
    initializeDefaultColorScales() {
        // Green-Red scale for positive/negative values
        this.colorScales.set('greenRed', {
            type: 'diverging',
            domain: [-1, 0, 1],
            range: ['#e74c3c', '#f39c12', '#2ecc71'],
            interpolation: 'linear'
        });
        
        // Blue scale for sequential data
        this.colorScales.set('blues', {
            type: 'sequential',
            domain: [0, 1],
            range: ['#ecf0f1', '#3498db'],
            interpolation: 'linear'
        });
        
        // Performance scale (red-yellow-green)
        this.colorScales.set('performance', {
            type: 'diverging',
            domain: [0, 0.5, 1],
            range: ['#e74c3c', '#f1c40f', '#2ecc71'],
            interpolation: 'linear'
        });
        
        // Viridis-inspired scale
        this.colorScales.set('viridis', {
            type: 'sequential',
            domain: [0, 1],
            range: ['#440154', '#31688e', '#35b779', '#fde725'],
            interpolation: 'linear'
        });
    }
    
    /**
     * Add a formatting rule
     */
    addFormattingRule(rule) {
        const ruleId = rule.id || `rule_${Date.now()}`;
        
        const formattingRule = {
            id: ruleId,
            condition: rule.condition,
            style: rule.style,
            priority: rule.priority || 0,
            enabled: rule.enabled !== false,
            created: new Date().toISOString()
        };
        
        this.rules.set(ruleId, formattingRule);
        this.metrics.rulesApplied++;
        
        return this.chart || this;
    }
    
    /**
     * Remove a formatting rule
     */
    removeFormattingRule(ruleId) {
        this.rules.delete(ruleId);
        return this.chart || this;
    }
    
    /**
     * Set color scale
     */
    setColorScale(scale) {
        if (typeof scale === 'string') {
            // Use predefined scale
            this.currentColorScale = this.colorScales.get(scale);
        } else {
            // Use custom scale
            this.currentColorScale = scale;
        }
        
        return this.chart || this;
    }
    
    /**
     * Get current color scale
     */
    getColorScale() {
        return this.currentColorScale;
    }
    
    /**
     * Add threshold-based formatting
     */
    addThreshold(threshold) {
        const thresholdId = threshold.id || `threshold_${Date.now()}`;
        
        this.thresholds.set(thresholdId, {
            id: thresholdId,
            value: threshold.value,
            operator: threshold.operator || '>=',
            style: threshold.style,
            priority: threshold.priority || 0
        });
        
        return this.chart || this;
    }
    
    /**
     * Set custom value formatter
     */
    setCustomFormatter(formatter) {
        if (typeof formatter === 'function') {
            this.customFormatter = formatter;
        }
        return this.chart || this;
    }
    
    /**
     * Get custom formatter
     */
    getCustomFormatter() {
        return this.customFormatter;
    }
    
    /**
     * Apply conditional formatting to data
     */
    applyFormatting(data) {
        const startTime = performance.now();
        
        if (!Array.isArray(data)) {
            return data;
        }
        
        const formattedData = data.map((item, index) => {
            const formattedItem = { ...item };
            
            // Apply color scale formatting
            if (this.currentColorScale) {
                formattedItem.computedColor = this.computeColor(item, index, data);
            }
            
            // Apply rule-based formatting
            formattedItem.appliedRules = this.applyRules(item, index, data);
            
            // Apply threshold formatting
            formattedItem.thresholdStyles = this.applyThresholds(item);
            
            // Apply custom formatting
            if (this.customFormatter) {
                formattedItem.formattedValue = this.customFormatter(item.value || item.stacks?.[0]?.value, item, index);
            }
            
            // Merge all styles
            formattedItem.conditionalStyle = this.mergeStyles([
                formattedItem.computedColor ? { color: formattedItem.computedColor } : {},
                ...formattedItem.appliedRules.map(rule => rule.style),
                ...formattedItem.thresholdStyles.map(t => t.style)
            ]);
            
            return formattedItem;
        });
        
        // Update metrics
        this.metrics.processingTime = performance.now() - startTime;
        this.metrics.lastUpdate = new Date().toISOString();
        
        return formattedData;
    }
    
    /**
     * Compute color based on color scale
     */
    computeColor(item, index, data) {
        if (!this.currentColorScale) return null;
        
        const value = item.value || item.stacks?.[0]?.value || 0;
        const scale = this.currentColorScale;
        
        // Normalize value to scale domain
        let normalizedValue;
        
        if (scale.type === 'sequential') {
            const min = Math.min(...data.map(d => d.value || d.stacks?.[0]?.value || 0));
            const max = Math.max(...data.map(d => d.value || d.stacks?.[0]?.value || 0));
            normalizedValue = (value - min) / (max - min);
        } else if (scale.type === 'diverging') {
            const values = data.map(d => d.value || d.stacks?.[0]?.value || 0);
            const max = Math.max(...values.map(Math.abs));
            normalizedValue = value / max;
        }
        
        // Interpolate color
        return this.interpolateColor(normalizedValue, scale);
    }
    
    /**
     * Interpolate color from scale
     */
    interpolateColor(value, scale) {
        const { domain, range } = scale;
        
        // Find position in domain
        for (let i = 0; i < domain.length - 1; i++) {
            if (value >= domain[i] && value <= domain[i + 1]) {
                const t = (value - domain[i]) / (domain[i + 1] - domain[i]);
                return this.blendColors(range[i], range[i + 1], t);
            }
        }
        
        // Handle edge cases
        if (value <= domain[0]) return range[0];
        if (value >= domain[domain.length - 1]) return range[range.length - 1];
        
        return range[0];
    }
    
    /**
     * Blend two colors
     */
    blendColors(color1, color2, t) {
        const hex1 = color1.replace('#', '');
        const hex2 = color2.replace('#', '');
        
        const r1 = parseInt(hex1.substr(0, 2), 16);
        const g1 = parseInt(hex1.substr(2, 2), 16);
        const b1 = parseInt(hex1.substr(4, 2), 16);
        
        const r2 = parseInt(hex2.substr(0, 2), 16);
        const g2 = parseInt(hex2.substr(2, 2), 16);
        const b2 = parseInt(hex2.substr(4, 2), 16);
        
        const r = Math.round(r1 + (r2 - r1) * t);
        const g = Math.round(g1 + (g2 - g1) * t);
        const b = Math.round(b1 + (b2 - b1) * t);
        
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
    
    /**
     * Apply formatting rules
     */
    applyRules(item, index, data) {
        const appliedRules = [];
        const value = item.value || item.stacks?.[0]?.value || 0;
        
        // Sort rules by priority
        const sortedRules = Array.from(this.rules.values())
            .filter(rule => rule.enabled)
            .sort((a, b) => b.priority - a.priority);
        
        for (const rule of sortedRules) {
            if (this.evaluateCondition(rule.condition, value, item, index, data)) {
                appliedRules.push(rule);
            }
        }
        
        return appliedRules;
    }
    
    /**
     * Apply threshold formatting
     */
    applyThresholds(item) {
        const appliedThresholds = [];
        const value = item.value || item.stacks?.[0]?.value || 0;
        
        for (const threshold of this.thresholds.values()) {
            if (this.evaluateThreshold(threshold, value)) {
                appliedThresholds.push(threshold);
            }
        }
        
        return appliedThresholds;
    }
    
    /**
     * Evaluate a condition
     */
    evaluateCondition(condition, value, item, index, data) {
        if (typeof condition === 'function') {
            return condition(value, item, index, data);
        }
        
        if (typeof condition === 'object') {
            const { operator, value: conditionValue } = condition;
            
            switch (operator) {
                case '>': return value > conditionValue;
                case '>=': return value >= conditionValue;
                case '<': return value < conditionValue;
                case '<=': return value <= conditionValue;
                case '==': return value == conditionValue;
                case '===': return value === conditionValue;
                case '!=': return value != conditionValue;
                case '!==': return value !== conditionValue;
                default: return false;
            }
        }
        
        return false;
    }
    
    /**
     * Evaluate a threshold
     */
    evaluateThreshold(threshold, value) {
        const { operator, value: thresholdValue } = threshold;
        
        switch (operator) {
            case '>': return value > thresholdValue;
            case '>=': return value >= thresholdValue;
            case '<': return value < thresholdValue;
            case '<=': return value <= thresholdValue;
            case '==': return value == thresholdValue;
            case '===': return value === thresholdValue;
            default: return value >= thresholdValue;
        }
    }
    
    /**
     * Merge multiple style objects
     */
    mergeStyles(styles) {
        return styles.reduce((merged, style) => ({ ...merged, ...style }), {});
    }
    
    /**
     * Get feature metrics
     */
    getMetrics() {
        return {
            ...this.metrics,
            rulesCount: this.rules.size,
            thresholdsCount: this.thresholds.size,
            colorScalesCount: this.colorScales.size
        };
    }
    
    /**
     * Export configuration
     */
    exportConfig() {
        return {
            rules: Array.from(this.rules.entries()),
            colorScales: Array.from(this.colorScales.entries()),
            thresholds: Array.from(this.thresholds.entries()),
            currentColorScale: this.currentColorScale
        };
    }
    
    /**
     * Import configuration
     */
    importConfig(config) {
        if (config.rules) {
            this.rules = new Map(config.rules);
        }
        
        if (config.colorScales) {
            this.colorScales = new Map(config.colorScales);
        }
        
        if (config.thresholds) {
            this.thresholds = new Map(config.thresholds);
        }
        
        if (config.currentColorScale) {
            this.currentColorScale = config.currentColorScale;
        }
        
        return this;
    }
    
    /**
     * Cleanup resources
     */
    cleanup() {
        this.rules.clear();
        this.thresholds.clear();
        this.customFormatter = null;
        this.enabled = false;
    }
}

// Export for both CommonJS and ES modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ConditionalFormattingFeature;
} else if (typeof window !== 'undefined') {
    window.ConditionalFormattingFeature = ConditionalFormattingFeature;
}

// ES module export
export default ConditionalFormattingFeature;
export { ConditionalFormattingFeature };
