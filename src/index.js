// MintWaterfall - Main Entry Point
// D3.js-compatible waterfall chart component library with enhanced features

export { waterfallChart } from "../mintwaterfall-chart.js";
export { createDataProcessor, dataProcessor } from "../mintwaterfall-data.js";
export { createAnimationSystem, animationSystem } from "../mintwaterfall-animations.js";
export { themes, applyTheme, getThemeColorPalette } from "../mintwaterfall-themes.js";

// Enhanced D3.js features
export { createScaleSystem, createTimeScale, createOrdinalScale } from "../mintwaterfall-scales.js";
export { createBrushSystem, addQuickBrush } from "../mintwaterfall-brush.js";

// Hierarchical Layout Features
export { 
    createHierarchicalLayout, 
    createHierarchy, 
    createHierarchyFromFlatData,
    extractLayoutData,
    convertToWaterfallFormat,
    hierarchyLayouts 
} from "../mintwaterfall-layouts.js";
export { treemapChart } from "../mintwaterfall-treemap.js";
export { partitionChart, sunburstChart } from "../mintwaterfall-partition.js";

// Advanced Data Processing Features
export { 
    createAdvancedDataProcessor, 
    advancedDataProcessor, 
    dataUtils 
} from "../mintwaterfall-data-advanced.js";

// Performance Optimization Features
export { 
    createPerformanceManager, 
    performanceManager, 
    largeDatasetUtils 
} from "../mintwaterfall-performance.js";

// Phase 1: Critical Accessibility & UX Features
export { createAccessibilitySystem, accessibilitySystem, makeChartAccessible } from "../mintwaterfall-accessibility.js";
export { createTooltipSystem, createChartTooltip, tooltip } from "../mintwaterfall-tooltip.js";
export { createExportSystem, addExportToChart, exportSystem } from "../mintwaterfall-export.js";

// Phase 2: Enhanced Interactivity Features  
export { createZoomSystem, createZoomControls, addZoomToChart, zoomSystem } from "../mintwaterfall-zoom.js";

// Version information
export const version = "0.8.1";

// Default exports for convenience
import { waterfallChart } from "../mintwaterfall-chart.js";
import { treemapChart } from "../mintwaterfall-treemap.js";
import { partitionChart } from "../mintwaterfall-partition.js";

// Export main chart as default
export default waterfallChart;

// Add to d3 namespace for compatibility
if (typeof window !== "undefined" && window.d3) {
    window.d3.waterfallChart = waterfallChart;
    window.d3.treemapChart = treemapChart;
    window.d3.partitionChart = partitionChart;
    window.d3.sunburstChart = partitionChart().orientation("radial");
}
