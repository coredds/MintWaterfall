// MintWaterfall - Main Entry Point
// D3.js-compatible waterfall chart component library with enhanced features

export { waterfallChart } from "../mintwaterfall-chart.js";
export { createDataProcessor, dataProcessor } from "../mintwaterfall-data.js";
export { createAnimationSystem, animationSystem } from "../mintwaterfall-animations.js";
export { themes, applyTheme, getThemeColorPalette } from "../mintwaterfall-themes.js";

// Enhanced D3.js features
export { createScaleSystem, createTimeScale, createOrdinalScale } from "../mintwaterfall-scales.js";
export { createBrushSystem, addQuickBrush } from "../mintwaterfall-brush.js";

// Phase 1: Critical Accessibility & UX Features
export { createAccessibilitySystem, accessibilitySystem, makeChartAccessible } from "../mintwaterfall-accessibility.js";
export { createTooltipSystem, createChartTooltip, tooltip } from "../mintwaterfall-tooltip.js";
export { createExportSystem, addExportToChart, exportSystem } from "../mintwaterfall-export.js";

// Phase 2: Enhanced Interactivity Features  
export { createZoomSystem, createZoomControls, addZoomToChart, zoomSystem } from "../mintwaterfall-zoom.js";

// Version information
export const version = "0.6.0";

// Default export for convenience
import { waterfallChart } from "../mintwaterfall-chart.js";
export default waterfallChart;
