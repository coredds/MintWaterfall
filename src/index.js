// MintWaterfall - Main Entry Point
// D3.js-compatible waterfall chart component library

export { waterfallChart } from "../mintwaterfall-chart.js";
export { createDataProcessor, dataProcessor } from "../mintwaterfall-data.js";
export { createAnimationSystem, animationSystem } from "../mintwaterfall-animations.js";
export { themes, applyTheme, getThemeColorPalette } from "../mintwaterfall-themes.js";

// Version information
export const version = "0.5.5";

// Default export for convenience
import { waterfallChart } from "../mintwaterfall-chart.js";
export default waterfallChart;
