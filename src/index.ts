// MintWaterfall - Main Entry Point
// D3.js-compatible waterfall chart component library with enhanced features

// Core chart functionality
export { waterfallChart } from "./chart/chart.js";

// Data processing - Core
export { createDataProcessor, dataProcessor } from "./data/pipeline.js";

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
  d3DataUtils,
} from "./data/pipeline.js";

// Animation system
export { createAnimationSystem } from "./animations.js";

// Themes
export { themes, applyTheme } from "./themes.js";

// Enhanced D3.js features
export { createScaleSystem } from "./scales.js";
export { createBrushSystemFactory as createBrushSystem } from "./brush.js";

// Advanced color and shape features
export {
  createSequentialScale,
  createDivergingScale,
  getConditionalColor,
  createWaterfallColorScale,
  interpolateThemeColor,
  getAdvancedBarColor,
} from "./themes.js";

export {
  createShapeGenerators,
  createWaterfallConfidenceBands,
  createWaterfallMilestones,
} from "./shapes.js";

// Advanced statistical analysis features
export {
  createStatisticalSystem,
  analyzeWaterfallStatistics,
} from "./statistics.js";

// Performance optimization features
export {
  createPerformanceManager,
  createAdvancedPerformanceSystem,
  createWaterfallSpatialIndex,
  createVirtualWaterfallRenderer,
} from "./performance.js";

// Advanced analytical enhancement features
export {
  createAdvancedDataProcessor,
  createWaterfallSequenceAnalyzer,
  createWaterfallTickGenerator,
} from "./data/advanced.js";

export {
  createAdvancedInteractionSystem,
  createWaterfallDragBehavior,
  createWaterfallVoronoiConfig,
  createWaterfallForceConfig,
} from "./interactions.js";

export {
  createHierarchicalLayout,
  createHierarchicalLayoutSystem,
  createWaterfallTreemap,
  createWaterfallSunburst,
  createWaterfallBubbles,
} from "./layouts.js";

// Accessibility & UX Features
export { createAccessibilitySystem } from "./mintwaterfall-accessibility.js";
export { createTooltipSystem } from "./mintwaterfall-tooltip.js";
export { createExportSystem } from "./mintwaterfall-export.js";

// Interactivity Features
export { createZoomSystem } from "./mintwaterfall-zoom.js";

// Version information
export const version = "0.8.10";

// Default export
import { waterfallChart } from "./chart/chart.js";
export default waterfallChart;
