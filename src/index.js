// MintWaterfall - Main Entry Point
// D3.js-compatible waterfall chart component library with enhanced features

// Core chart functionality
export { waterfallChart } from "./mintwaterfall-chart.ts";

// Data processing - Core
export { createDataProcessor, dataProcessor } from "./mintwaterfall-data.ts";

// Data processing - Advanced D3.js Operations
export {
    // Standalone helper functions
    createRevenueWaterfall,
    createTemporalWaterfall,
    createVarianceWaterfall,
    groupWaterfallData,
    createComparisonWaterfall,
    transformTransactionData,
    
    // Financial utilities
    financialReducers,
    d3DataUtils
} from "./mintwaterfall-data.ts";

// Animation system
export { createAnimationSystem } from "./mintwaterfall-animations.ts";

// Themes
export { themes, applyTheme } from "./mintwaterfall-themes.ts";

// Enhanced D3.js features
export { createScaleSystem } from "./mintwaterfall-scales.ts";
export { createBrushSystemFactory as createBrushSystem } from "./mintwaterfall-brush.ts";

// NEW: Advanced color and shape features
export { 
    createSequentialScale,
    createDivergingScale, 
    getConditionalColor,
    createWaterfallColorScale,
    interpolateThemeColor,
    getAdvancedBarColor
} from "./mintwaterfall-themes.ts";

export { 
    createShapeGenerators,
    createWaterfallConfidenceBands,
    createWaterfallMilestones 
} from "./mintwaterfall-shapes.ts";

// NEW: Advanced statistical analysis features
export {
    createStatisticalSystem,
    analyzeWaterfallStatistics
} from "./mintwaterfall-statistics.ts";

// NEW: Advanced performance optimization features
export {
    createAdvancedPerformanceSystem,
    createWaterfallSpatialIndex,
    createVirtualWaterfallRenderer
} from "./mintwaterfall-advanced-performance.ts";

// NEW: MEDIUM PRIORITY - Advanced analytical enhancement features
export {
    createAdvancedDataProcessor,
    createWaterfallSequenceAnalyzer,
    createWaterfallTickGenerator
} from "./mintwaterfall-advanced-data.ts";

export {
    createAdvancedInteractionSystem,
    createWaterfallDragBehavior,
    createWaterfallVoronoiConfig,
    createWaterfallForceConfig
} from "./mintwaterfall-advanced-interactions.ts";

export {
    createHierarchicalLayoutSystem,
    createWaterfallTreemap,
    createWaterfallSunburst,
    createWaterfallBubbles
} from "./mintwaterfall-hierarchical-layouts.ts";

// Hierarchical Layout Features
export { createHierarchicalLayout } from "./mintwaterfall-layouts.ts";

// Performance
export { createPerformanceManager } from "./mintwaterfall-performance.ts";

// Accessibility & UX Features
export { createAccessibilitySystem } from "./mintwaterfall-accessibility.ts";
export { createTooltipSystem } from "./mintwaterfall-tooltip.ts";
export { createExportSystem } from "./mintwaterfall-export.ts";

// Interactivity Features  
export { createZoomSystem } from "./mintwaterfall-zoom.ts";

// Version information
export const version = "0.8.6"; // Updated for advanced data processing features

// Default exports for convenience
import { waterfallChart } from "./mintwaterfall-chart.ts";

// Export main chart as default
export default waterfallChart;

// Add to d3 namespace for compatibility
if (typeof window !== "undefined" && window.d3) {
    window.d3.waterfallChart = waterfallChart;
}
