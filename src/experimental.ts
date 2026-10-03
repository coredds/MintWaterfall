// MintWaterfall — experimental entry point (`mintwaterfall/experimental`)
//
// These modules are not used by the chart and have limited test coverage. They are kept
// available for existing users but are not covered by semver stability guarantees:
// breaking changes may land in minor releases.

// Brush & zoom building blocks (the chart has its own built-in brush/zoom: enableBrush / enableZoom)
export { createBrushSystemFactory as createBrushSystem } from "./brush.js";
export { createZoomSystem } from "./zoom.js";

// Performance helpers
export {
  createPerformanceManager,
  createAdvancedPerformanceSystem,
  createWaterfallSpatialIndex,
  createVirtualWaterfallRenderer,
} from "./performance.js";

// Interaction helpers (drag, Voronoi hover, force simulation)
export {
  createAdvancedInteractionSystem,
  createWaterfallDragBehavior,
  createWaterfallVoronoiConfig,
  createWaterfallForceConfig,
} from "./interactions.js";

// Hierarchical layouts
export {
  createHierarchicalLayout,
  createHierarchicalLayoutSystem,
  createWaterfallTreemap,
  createWaterfallSunburst,
  createWaterfallBubbles,
} from "./layouts.js";
