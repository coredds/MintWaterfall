// Compatibility Layer - Ensures v0.6.0 code works unchanged in v0.7.0+
// Monitors API usage and prevents breaking changes

export class CompatibilityLayer {
    static version = "0.8.0";
    static compatibleWith = "0.6.0";
    
    // Protected methods that must never change signature
    static protectedMethods = [
        'width', 'height', 'margin', 'showTotal', 'totalLabel',
        'totalColor', 'stacked', 'barPadding', 'duration', 'ease',
        'formatNumber', 'theme', 'on', 'enableBrush', 'brushOptions',
        'staggeredAnimations', 'staggerDelay', 'scaleType', 'showTrendLine',
        'trendLineColor', 'trendLineWidth', 'trendLineStyle', 'trendLineOpacity',
        'trendLineType', 'enableAccessibility', 'enableTooltips', 'tooltipConfig',
        'enableExport', 'exportConfig', 'enableZoom', 'zoomConfig'
    ];
    
    // New enterprise methods (additive only)
    static enterpriseMethods = [
        'breakdown', 'conditionalFormatting', 'variance', 'drillDown', 'multiSeries'
    ];
    
    static usageStats = {
        protectedMethodCalls: new Map(),
        enterpriseMethodCalls: new Map(),
        dataFormats: new Map()
    };
    
    static validateApiUsage(chart, method, args) {
        // Track usage for compatibility monitoring
        this.trackMethodUsage(method, args);
        
        if (this.protectedMethods.includes(method)) {
            return this.validateProtectedMethod(method, args);
        }
        
        if (this.enterpriseMethods.includes(method)) {
            return this.validateEnterpriseMethod(method, args);
        }
        
        return true;
    }
    
    static validateProtectedMethod(method, args) {
        // Ensure method signatures haven't changed
        const validationRules = {
            width: (args) => args.length <= 1 && (args.length === 0 || typeof args[0] === 'number'),
            height: (args) => args.length <= 1 && (args.length === 0 || typeof args[0] === 'number'),
            margin: (args) => args.length <= 1 && (args.length === 0 || typeof args[0] === 'object'),
            showTotal: (args) => args.length <= 1 && (args.length === 0 || typeof args[0] === 'boolean'),
            totalLabel: (args) => args.length <= 1 && (args.length === 0 || typeof args[0] === 'string'),
            totalColor: (args) => args.length <= 1 && (args.length === 0 || typeof args[0] === 'string'),
            stacked: (args) => args.length <= 1 && (args.length === 0 || typeof args[0] === 'boolean'),
            barPadding: (args) => args.length <= 1 && (args.length === 0 || typeof args[0] === 'number'),
            duration: (args) => args.length <= 1 && (args.length === 0 || typeof args[0] === 'number'),
            ease: (args) => args.length <= 1 && (args.length === 0 || typeof args[0] === 'function'),
            formatNumber: (args) => args.length <= 1 && (args.length === 0 || typeof args[0] === 'function'),
            theme: (args) => args.length <= 1 && (args.length === 0 || args[0] === null || typeof args[0] === 'object'),
            on: (args) => args.length >= 1 && typeof args[0] === 'string'
        };
        
        const rule = validationRules[method];
        if (rule && !rule(args)) {
            console.error(`CompatibilityLayer: Invalid arguments for protected method '${method}'`, args);
            return false;
        }
        
        return true;
    }
    
    static validateEnterpriseMethod(method, args) {
        // Validate enterprise method usage
        if (args.length > 1) {
            console.warn(`CompatibilityLayer: Enterprise method '${method}' should follow D3.js getter/setter pattern`);
        }
        
        if (args.length === 1 && typeof args[0] !== 'object') {
            console.warn(`CompatibilityLayer: Enterprise method '${method}' expects object configuration`);
        }
        
        return true;
    }
    
    static trackMethodUsage(method, args) {
        const isGetter = args.length === 0;
        const isSetter = args.length > 0;
        
        if (this.protectedMethods.includes(method)) {
            const stats = this.usageStats.protectedMethodCalls.get(method) || { getter: 0, setter: 0 };
            if (isGetter) stats.getter++;
            if (isSetter) stats.setter++;
            this.usageStats.protectedMethodCalls.set(method, stats);
        }
        
        if (this.enterpriseMethods.includes(method)) {
            const stats = this.usageStats.enterpriseMethodCalls.get(method) || { getter: 0, setter: 0 };
            if (isGetter) stats.getter++;
            if (isSetter) stats.setter++;
            this.usageStats.enterpriseMethodCalls.set(method, stats);
        }
    }
    
    static trackUsage(feature, enabled) {
        // Track which enterprise features are being used
        if (enabled) {
            console.log(`MintWaterfall: Enterprise feature '${feature}' enabled`);
        }
        
        // Update usage statistics
        const current = this.usageStats.enterpriseMethodCalls.get(feature) || { enabled: 0, disabled: 0 };
        if (enabled) {
            current.enabled++;
        } else {
            current.disabled++;
        }
        this.usageStats.enterpriseMethodCalls.set(feature, current);
    }
    
    static validateDataFormat(data) {
        if (!Array.isArray(data)) {
            console.error('CompatibilityLayer: Data must be an array');
            return false;
        }
        
        const isValidV06Format = data.every(item => 
            item && 
            typeof item.label === 'string' && 
            Array.isArray(item.stacks) &&
            item.stacks.every(stack => 
                typeof stack.value === 'number' && 
                typeof stack.color === 'string'
            )
        );
        
        if (!isValidV06Format) {
            console.error('CompatibilityLayer: Data format is not compatible with v0.6.0 format');
            return false;
        }
        
        // Track data format usage
        const hasBreakdown = data.some(item => item.breakdown);
        const hasVariance = data.some(item => item.actual !== undefined || item.budget !== undefined);
        const hasSeries = data.some(item => item.series);
        
        this.usageStats.dataFormats.set('hasBreakdown', hasBreakdown);
        this.usageStats.dataFormats.set('hasVariance', hasVariance);
        this.usageStats.dataFormats.set('hasSeries', hasSeries);
        
        return true;
    }
    
    static getUsageReport() {
        return {
            version: this.version,
            compatibleWith: this.compatibleWith,
            protectedMethodCalls: Object.fromEntries(this.usageStats.protectedMethodCalls),
            enterpriseMethodCalls: Object.fromEntries(this.usageStats.enterpriseMethodCalls),
            dataFormats: Object.fromEntries(this.usageStats.dataFormats)
        };
    }
    
    static resetUsageStats() {
        this.usageStats.protectedMethodCalls.clear();
        this.usageStats.enterpriseMethodCalls.clear();
        this.usageStats.dataFormats.clear();
    }
    
    static checkCompatibility() {
        // Perform compatibility check
        const issues = [];
        
        // Check for any breaking changes
        // This would be expanded as we identify potential issues
        
        if (issues.length > 0) {
            console.warn('CompatibilityLayer: Compatibility issues detected:', issues);
            return false;
        }
        
        return true;
    }
    
    static migrateData(data, fromVersion = "0.6.0", toVersion = "0.8.0") {
        // Handle any data format migrations if needed in the future
        // Currently no migration needed as we maintain full compatibility
        return data;
    }
    
    static wrapChart(chart) {
        // Wrap chart with compatibility monitoring
        const originalMethods = {};
        
        // Wrap all protected methods
        this.protectedMethods.forEach(method => {
            if (typeof chart[method] === 'function') {
                originalMethods[method] = chart[method];
                chart[method] = (...args) => {
                    this.validateApiUsage(chart, method, args);
                    return originalMethods[method].apply(chart, args);
                };
            }
        });
        
        return chart;
    }
}
