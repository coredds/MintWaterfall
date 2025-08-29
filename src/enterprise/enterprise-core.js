// Enterprise Feature Management System
// Manages optional enterprise features while maintaining D3.js compatibility

export class EnterpriseFeatureManager {
    constructor() {
        this.features = new Map();
        this.config = this.getDefaultConfig();
        this.enabled = false;
    }
    
    getDefaultConfig() {
        return {
            breakdown: { 
                enabled: false,
                maxBreakdowns: 5,
                showOthers: true,
                otherLabel: "Others",
                otherColor: "#95a5a6",
                animation: true
            },
            conditionalFormatting: { 
                enabled: false,
                rules: [],
                thresholds: []
            },
            variance: { 
                enabled: false,
                showPercentage: true,
                showAbsolute: true,
                autoCalculate: true,
                favorableColor: "#2ecc71",
                unfavorableColor: "#e74c3c"
            },
            drillDown: { 
                enabled: false,
                levels: ["summary", "detail"],
                breadcrumbs: true,
                navigation: {
                    showBackButton: true,
                    showBreadcrumbs: true,
                    autoNavigate: false
                }
            },
            multiSeries: { 
                enabled: false,
                grouping: "clustered",
                seriesSpacing: 0.1,
                showVariance: false,
                legend: {
                    enabled: true,
                    position: "top",
                    interactive: true
                }
            }
        };
    }
    
    register(name, feature) {
        if (!name || !feature) {
            console.warn(`EnterpriseFeatureManager: Invalid feature registration - ${name}`);
            return this;
        }
        
        this.features.set(name, feature);
        
        // Initialize feature with default config
        if (feature.initialize && typeof feature.initialize === "function") {
            feature.initialize(this.config[name] || {});
        }
        
        return this;
    }
    
    isEnabled(name) {
        return this.config[name]?.enabled || false;
    }
    
    hasAnyEnabled() {
        return Object.values(this.config).some(config => config.enabled);
    }
    
    // Utility methods for introspection
    listFeatures() {
        return Array.from(this.features.keys());
    }
    
    getConfig() {
        return { ...this.config };
    }
    
    getFeatureInfo(name) {
        const feature = this.features.get(name);
        if (!feature) return null;
        
        return {
            name,
            enabled: this.isEnabled(name),
            config: this.config[name] || {},
            hasRender: typeof feature.render === "function",
            hasProcess: typeof feature.processData === "function"
        };
    }
    
    configure(featureName, config) {
        if (!this.features.has(featureName)) {
            console.warn(`EnterpriseFeatureManager: Feature '${featureName}' not found`);
            return this;
        }
        
        // Merge with existing config
        this.config[featureName] = { ...this.config[featureName], ...config };
        
        // Notify feature of config change if it has a configure method
        const feature = this.features.get(featureName);
        if (feature && typeof feature.configure === "function") {
            feature.configure(config);
        }
        
        return this;
    }
    
    updateConfig(featureName, newConfig) {
        if (!this.config[featureName]) {
            console.warn(`EnterpriseFeatureManager: Unknown feature - ${featureName}`);
            return this;
        }
        
        this.config[featureName] = { 
            ...this.config[featureName], 
            ...newConfig 
        };
        
        // Update feature instance if it has an updateConfig method
        const feature = this.features.get(featureName);
        if (feature && feature.updateConfig && typeof feature.updateConfig === "function") {
            feature.updateConfig(this.config[featureName]);
        }
        
        return this;
    }
    
    process(data) {
        if (!this.hasAnyEnabled() || !data || !Array.isArray(data)) {
            return data;
        }
        
        let processedData = [...data]; // Don't mutate original data
        
        // Process each enabled feature in sequence
        for (const [name, feature] of this.features) {
            if (this.isEnabled(name) && feature.process && typeof feature.process === "function") {
                try {
                    processedData = feature.process(processedData, this.config[name]);
                } catch (error) {
                    console.error(`EnterpriseFeatureManager: Error processing feature '${name}':`, error);
                }
            }
        }
        
        return processedData;
    }
    
    render(container, data, scales, margins) {
        if (!this.hasAnyEnabled()) {
            return;
        }
        
        // Render each enabled feature
        for (const [name, feature] of this.features) {
            if (this.isEnabled(name) && feature.render && typeof feature.render === "function") {
                try {
                    feature.render(container, data, scales, margins, this.config[name]);
                } catch (error) {
                    console.error(`EnterpriseFeatureManager: Error rendering feature '${name}':`, error);
                }
            }
        }
    }
    
    handleEvent(eventType, eventData, scales, margins) {
        if (!this.hasAnyEnabled()) {
            return eventData;
        }
        
        let processedEvent = eventData;
        
        // Allow features to handle events
        for (const [name, feature] of this.features) {
            if (this.isEnabled(name) && feature.handleEvent && typeof feature.handleEvent === "function") {
                try {
                    processedEvent = feature.handleEvent(eventType, processedEvent, scales, margins, this.config[name]);
                } catch (error) {
                    console.error(`EnterpriseFeatureManager: Error handling event in feature '${name}':`, error);
                }
            }
        }
        
        return processedEvent;
    }
    
    getFeature(name) {
        return this.features.get(name);
    }
    
    getConfig(name) {
        return name ? this.config[name] : this.config;
    }
    
    destroy() {
        // Cleanup features
        for (const [name, feature] of this.features) {
            if (feature.destroy && typeof feature.destroy === "function") {
                try {
                    feature.destroy();
                } catch (error) {
                    console.error(`EnterpriseFeatureManager: Error destroying feature '${name}':`, error);
                }
            }
        }
        
        this.features.clear();
        this.config = this.getDefaultConfig();
    }
}
