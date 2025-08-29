// Enterprise Feature Template - Standardized pattern for all enterprise features
// Ensures consistency, testability, and D3.js compatibility

export class EnterpriseFeatureTemplate {
    constructor(name, description, defaultConfig = {}) {
        this.name = name;
        this.description = description;
        this.defaultConfig = defaultConfig;
        this.enabled = false;
        this.config = { ...defaultConfig };
        this.dependencies = [];
        this.dataProcessors = [];
        this.renderHooks = [];
        this.eventHandlers = new Map();
        
        // D3.js compatibility
        this.chart = null;
        this.svg = null;
        this.data = null;
        this.scales = null;
    }
    
    // Standard lifecycle methods
    init(chart, config = {}) {
        this.chart = chart;
        this.config = { ...this.defaultConfig, ...config };
        this.enabled = this.config.enabled || false;  // Respect config.enabled
        
        // Extract D3.js components
        this.svg = chart.svg ? chart.svg() : null;
        this.data = chart.data ? chart.data() : null;
        this.scales = chart.scales ? chart.scales() : null;
        
        this.onInit();
        return this;
    }
    
    destroy() {
        this.onDestroy();
        this.enabled = false;
        this.chart = null;
        this.svg = null;
        this.data = null;
        this.scales = null;
        this.eventHandlers.clear();
        return this;
    }
    
    configure(config) {
        const oldConfig = { ...this.config };
        this.config = { ...this.config, ...config };
        
        // Update enabled flag if it changed
        if (config.hasOwnProperty("enabled")) {
            this.enabled = config.enabled;
        }
        
        this.onConfigChange(oldConfig, this.config);
        return this;
    }
    
    // Data processing
    processData(data) {
        if (!this.enabled) return data;
        
        let processedData = data;
        
        // Apply all registered data processors
        for (const processor of this.dataProcessors) {
            processedData = processor(processedData, this.config);
        }
        
        this.data = processedData;
        return processedData;
    }
    
    // Rendering
    render() {
        if (!this.enabled || !this.svg) return this;
        
        this.beforeRender();
        this.onRender();
        this.afterRender();
        
        return this;
    }
    
    update() {
        if (!this.enabled) return this;
        
        this.beforeUpdate();
        this.onUpdate();
        this.afterUpdate();
        
        return this;
    }
    
    // Event handling
    on(event, handler) {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, []);
        }
        this.eventHandlers.get(event).push(handler);
        return this;
    }
    
    off(event, handler) {
        if (this.eventHandlers.has(event)) {
            const handlers = this.eventHandlers.get(event);
            const index = handlers.indexOf(handler);
            if (index > -1) {
                handlers.splice(index, 1);
            }
        }
        return this;
    }
    
    emit(event, ...args) {
        if (this.eventHandlers.has(event)) {
            this.eventHandlers.get(event).forEach(handler => {
                try {
                    handler.apply(this, args);
                } catch (error) {
                    console.error(`Error in ${this.name} event handler for '${event}':`, error);
                }
            });
        }
        return this;
    }
    
    // Hook registration
    addDataProcessor(processor) {
        if (typeof processor === "function") {
            this.dataProcessors.push(processor);
        }
        return this;
    }
    
    addRenderHook(hook) {
        if (typeof hook === "function") {
            this.renderHooks.push(hook);
        }
        return this;
    }
    
    // Dependency management
    addDependency(featureName) {
        if (!this.dependencies.includes(featureName)) {
            this.dependencies.push(featureName);
        }
        return this;
    }
    
    checkDependencies(availableFeatures) {
        const missing = this.dependencies.filter(dep => !availableFeatures.includes(dep));
        if (missing.length > 0) {
            console.warn(`${this.name}: Missing dependencies:`, missing);
            return false;
        }
        return true;
    }
    
    // D3.js helper methods
    createSelection(selector) {
        return this.svg ? this.svg.select(selector) : null;
    }
    
    createGroup(className) {
        if (!this.svg) return null;
        
        let group = this.svg.select(`.${className}`);
        if (group.empty()) {
            group = this.svg.append("g").attr("class", className);
        }
        return group;
    }
    
    getScale(type) {
        return this.scales ? this.scales[type] : null;
    }
    
    // Animation helpers
    animate(selection, duration = 300) {
        return selection.transition()
            .duration(duration)
            .ease(d3.easeQuadInOut);
    }
    
    // Configuration validation
    validateConfig() {
        // Override in subclasses for specific validation
        return true;
    }
    
    getConfigSchema() {
        // Override in subclasses to provide configuration schema
        return {};
    }
    
    // Lifecycle hooks (override in subclasses)
    onInit() {
        // Called when feature is initialized
    }
    
    onDestroy() {
        // Called when feature is destroyed
    }
    
    onConfigChange() {
        // Called when configuration changes
    }
    
    beforeRender() {
        // Called before rendering
    }
    
    onRender() {
        // Main rendering logic - override in subclasses
    }
    
    afterRender() {
        // Called after rendering
    }
    
    beforeUpdate() {
        // Called before update
    }
    
    onUpdate() {
        // Main update logic - override in subclasses
    }
    
    afterUpdate() {
        // Called after update
    }
    
    // Utility methods
    generateId(prefix = "") {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 9);
        return `${prefix}${prefix ? "-" : ""}${timestamp}-${random}`;
    }
    
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    // Accessibility helpers
    addAriaLabels(selection, labelText) {
        return selection.attr("aria-label", labelText);
    }
    
    addRole(selection, role) {
        return selection.attr("role", role);
    }
    
    // Performance monitoring
    startPerformanceTimer(operation) {
        const timer = `${this.name}-${operation}`;
        console.time(timer);
        return timer;
    }
    
    endPerformanceTimer(timer) {
        console.timeEnd(timer);
    }
    
    // Export interface
    toJSON() {
        return {
            name: this.name,
            description: this.description,
            enabled: this.enabled,
            config: this.config,
            dependencies: this.dependencies
        };
    }
    
    static fromJSON(json) {
        const feature = new this(json.name, json.description, json.config);
        feature.enabled = json.enabled;
        feature.dependencies = json.dependencies || [];
        return feature;
    }
}

// Helper function to create enterprise features
export function createEnterpriseFeature(name, description, implementation) {
    class CustomEnterpriseFeature extends EnterpriseFeatureTemplate {
        constructor(config = {}) {
            super(name, description, config);
        }
        
        onRender() {
            if (implementation && typeof implementation.render === "function") {
                implementation.render.call(this);
            }
        }
        
        onUpdate() {
            if (implementation && typeof implementation.update === "function") {
                implementation.update.call(this);
            }
        }
        
        onInit() {
            if (implementation && typeof implementation.init === "function") {
                implementation.init.call(this);
            }
        }
        
        onDestroy() {
            if (implementation && typeof implementation.destroy === "function") {
                implementation.destroy.call(this);
            }
        }
    }
    
    return CustomEnterpriseFeature;
}

// Configuration schema validator
export class ConfigValidator {
    static validate(config, schema) {
        const errors = [];
        
        for (const [key, rules] of Object.entries(schema)) {
            const value = config[key];
            
            if (rules.required && (value === undefined || value === null)) {
                errors.push(`Required field '${key}' is missing`);
                continue;
            }
            
            if (value !== undefined && value !== null) {
                if (rules.type && typeof value !== rules.type) {
                    errors.push(`Field '${key}' must be of type ${rules.type}, got ${typeof value}`);
                }
                
                if (rules.enum && !rules.enum.includes(value)) {
                    errors.push(`Field '${key}' must be one of: ${rules.enum.join(", ")}`);
                }
                
                if (rules.min !== undefined && value < rules.min) {
                    errors.push(`Field '${key}' must be >= ${rules.min}`);
                }
                
                if (rules.max !== undefined && value > rules.max) {
                    errors.push(`Field '${key}' must be <= ${rules.max}`);
                }
                
                if (rules.validator && typeof rules.validator === "function") {
                    const result = rules.validator(value);
                    if (result !== true) {
                        errors.push(`Field '${key}': ${result}`);
                    }
                }
            }
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    }
}
