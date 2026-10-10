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

// Themes and color helpers
export {
  themes,
  applyTheme,
  createSequentialScale,
  createDivergingScale,
  getConditionalColor,
  createWaterfallColorScale,
  interpolateThemeColor,
  getAdvancedBarColor,
} from "./themes.js";

// Scales
export { createScaleSystem } from "./scales.js";

// Shapes (confidence bands and milestones used by the chart)
export {
  createShapeGenerators,
  createWaterfallConfidenceBands,
  createWaterfallMilestones,
} from "./shapes.js";

// Statistical analysis
export {
  createStatisticalSystem,
  analyzeWaterfallStatistics,
} from "./statistics.js";

// Advanced data processing
export { createAdvancedDataProcessor } from "./data/advanced.js";

// Accessibility, tooltip and export building blocks
export { createAccessibilitySystem } from "./accessibility.js";
export { createTooltipSystem, escapeHtml } from "./tooltip.js";
export { createExportSystem } from "./export.js";

// Public chart types
export type {
  ChartData,
  StackData,
  ProcessedData,
  WaterfallChart,
  MarginConfig,
  ChartEventType,
  ChartEventName,
  ChartEventMap,
  ChartExportFormat,
  ThemeName,
  TrendLineType,
  TrendLineStyle,
  BarKind,
  Orientation,
  TooltipContentFn,
  ValueLabelFn,
} from "./chart/config.js";

// Supporting types referenced by the public API
export type { BrushOptions, TooltipConfig, ExportConfig, ZoomConfig } from "./chart/config.js";
export type { Theme, ThemeCollection, ChartWithTheme } from "./themes.js";
export type { XPosition, SymbolConfig, ShapeGeneratorSystem } from "./shapes.js";
export type { StatisticalSystem, StatisticalSummary, DataQualityAssessment, VarianceAnalysis } from "./statistics.js";
export type { DataProcessor } from "./data/pipeline.js";
export type { DataItem } from "./data/validation.js";
export type { GroupByFunction } from "./data/advanced.js";
export type { AccessibilitySystem } from "./accessibility.js";
export type { AnimationSystem } from "./animations.js";
export type { ScaleFactory } from "./scales.js";
export type { TooltipSystem } from "./tooltip.js";
export type { ExportSystem } from "./export.js";
// Brush/zoom systems, performance, interactions and layouts moved to
// "mintwaterfall/experimental" in 2.0.0.

// Version information (kept in sync with package.json by scripts/sync-version.mjs)
export { version } from "./version.js";

// Default export
import { waterfallChart } from "./chart/chart.js";
export default waterfallChart;