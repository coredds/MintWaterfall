# MintWaterfall

[![CI](https://github.com/coredds/MintWaterfall/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/coredds/MintWaterfall/actions/workflows/ci.yml)
[![Security Audit](https://github.com/coredds/MintWaterfall/actions/workflows/security.yml/badge.svg)](https://github.com/coredds/MintWaterfall/actions/workflows/security.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/coredds/MintWaterfall/releases)
[![codecov](https://codecov.io/gh/coredds/MintWaterfall/branch/main/graph/badge.svg)](https://codecov.io/gh/coredds/MintWaterfall)

A TypeScript waterfall chart library built on D3.js v7. Features data processing, statistical analysis, interactive visualizations, themes, accessibility, and tree-shakeable modules with full type safety.

**[Live Demo](https://coredds.github.io/MintWaterfall/mintwaterfall-example.html)**

## Features

### Core Visualization

- **Dual Chart Modes**: Traditional waterfall and stacked visualization
- **Interactive Elements**: Drag interactions, enhanced hover detection, force simulation
- **Advanced Animations**: Smooth transitions with customizable duration and easing
- **Export Capabilities**: SVG, PNG, JSON, CSV with high-resolution support
- **Accessibility**: WCAG 2.1 compliant with keyboard navigation and screen reader support

### Statistical Analysis

- **Comprehensive Statistics**: Mean, median, variance, quartiles, outlier detection
- **Trend Analysis**: Linear regression with confidence intervals and forecasting
- **Data Quality Assessment**: Completeness, validity, accuracy metrics with recommendations
- **Variance Analysis**: ANOVA-style analysis with between/within group variance

### Advanced Data Processing

- **D3.js Integration**: Native support for grouping, rollup, cross-tabulation, and indexing
- **Multi-dimensional Operations**: Complex data transformations and aggregations
- **Temporal Processing**: Time-series aggregation with configurable intervals
- **Financial Analysis**: Revenue breakdown, variance analysis, period comparisons

### Performance & Architecture

- **TypeScript**: Complete type safety with strict checking across 16 modules
- **Optimized Build**: 4 bundle formats (ESM, UMD, CJS, Minified) with external D3 dependencies
- **Test Suite**: 334 tests across 16 test suites, 100% pass rate
- **Tree-shakeable**: Import only what you need — zero overhead for unused features

## Installation

```bash
npm install mintwaterfall
```

**CDN:**

```html
<script src="https://d3js.org/d3.v7.min.js"></script>
<script src="https://unpkg.com/mintwaterfall@latest/dist/mintwaterfall.min.js"></script>
```

**ES Modules:**

```javascript
import {
  waterfallChart,
  createDataProcessor,
  createStatisticalSystem,
} from "mintwaterfall";
import * as d3 from "d3";
```

## Quick Start

```javascript
const data = [
  {
    label: "Q1 Revenue",
    stacks: [{ value: 45000, color: "#3498db", label: "$45K" }],
    category: "revenue",
  },
  {
    label: "Q2 Growth",
    stacks: [{ value: 30000, color: "#2ecc71", label: "$30K" }],
    category: "revenue",
  },
  {
    label: "Expenses",
    stacks: [{ value: -15000, color: "#e74c3c", label: "-$15K" }],
    category: "expenses",
  },
];

const chart = waterfallChart()
  .width(800)
  .height(400)
  .showTotal(true)
  .theme("corporate")
  .enableAccessibility(true);

d3.select("#chart").datum(data).call(chart);
```

## Advanced Features

### Statistical Analysis

```javascript
import { createStatisticalSystem } from "mintwaterfall";

const stats = createStatisticalSystem();

// Comprehensive statistical summary
const summary = stats.calculateSummary([10, 20, 30, 40, 50]);
// Returns: { mean, median, mode, variance, quartiles, percentiles }

// Outlier detection with IQR method
const outliers = stats.detectOutliers(data, labels);
// Returns: { outliers, cleanData, method, threshold, statistics }

// Trend analysis with forecasting
const trend = stats.analyzeTrend([
  { x: 1, y: 10 },
  { x: 2, y: 20 },
]);
// Returns: { slope, intercept, correlation, rSquared, forecast }

// Data quality assessment
const quality = stats.assessDataQuality(rawData);
// Returns: { completeness, validity, accuracy, issues, recommendations }
```

### Interactive Systems

```javascript
import { createAdvancedInteractionSystem } from "mintwaterfall";

const interactions = createAdvancedInteractionSystem(container, data);

// Enable drag interactions with constraints
interactions.enableDrag({
  enabled: true,
  axis: "vertical",
  constraints: { minValue: -100, maxValue: 100 },
});

// Enhanced hover detection with Voronoi diagrams
interactions.enableEnhancedHover({
  enabled: true,
  extent: [
    [0, 0],
    [800, 400],
  ],
});

// Force simulation for dynamic layouts
interactions.startForceSimulation({
  enabled: true,
  forces: { collision: true, positioning: true },
  strength: { collision: 0.7, positioning: 0.5 },
});
```

### Advanced Data Processing

```javascript
import { createAdvancedDataProcessor } from "mintwaterfall";

const processor = createAdvancedDataProcessor();

// Multi-dimensional grouping
const grouped = processor.groupBy(salesData, (d) => d.region);

// Data rollup with custom reducers
const aggregated = processor.rollupBy(
  salesData,
  (values) => d3.sum(values, (d) => d.revenue),
  (d) => d.category,
);

// Cross-tabulation for dimensional analysis
const crossTab = processor.crossTabulate(
  categories,
  quarters,
  (cat, quarter) => ({ category: cat, quarter, key: `${cat}-${quarter}` }),
);

// Time-based aggregation
const timeAggregated = processor.aggregateByTime(
  timeSeriesData,
  (d) => new Date(d.date),
  (d) => d.value,
  "month",
);
```

## Configuration API

### Chart Configuration

```javascript
chart
  .width(800) // Chart dimensions
  .height(400)
  .margin({ top: 20, right: 30, bottom: 40, left: 50 })
  .showTotal(true) // Display total bar
  .stacked(false) // Toggle chart mode
  .barPadding(0.1) // Bar spacing
  .duration(750) // Animation duration
  .theme("corporate") // Theme selection
  .enableAccessibility(true); // WCAG compliance
```

### Accessibility Features

```javascript
import { createAccessibilitySystem } from "mintwaterfall";

const a11y = createAccessibilitySystem();

// Create accessible chart descriptions
const descriptionId = a11y.createChartDescription(container, data, {
  title: "Quarterly Revenue Analysis",
  summary: "Shows revenue trends across four quarters",
});

// Validate color contrast
const contrast = a11y.validateColorContrast("#3498db", "#ffffff");
// Returns: { ratio, passesAA, passesAAA, level }

// Handle keyboard navigation
a11y.handleChartKeydown(keyEvent, data, config);
```

### Event Handling

```javascript
chart.on("barClick", (event, d) => {
  console.log("Clicked:", d.label, d.value);
});

chart.on("brushEnd", (selection) => {
  console.log("Selected range:", selection);
});

// Advanced interaction events
interactions.on("dragStart", (event) => {
  console.log("Drag started:", event);
});

interactions.on("hoverEnter", (data) => {
  console.log("Hover detected:", data);
});
```

## Data Formats

### Basic Waterfall Data

```javascript
const waterfallData = [
  {
    label: "Category Name",
    stacks: [
      { value: 100, color: "#3498db", label: "Positive" },
      { value: -25, color: "#e74c3c", label: "Negative" },
    ],
    category: "revenue",
  },
];
```

### Advanced Processing Data

```javascript
const businessData = [
  {
    region: "North",
    product: "Widget",
    revenue: 100000,
    date: "2024-01-15",
    category: "sales",
  },
  {
    region: "South",
    product: "Gadget",
    revenue: 85000,
    date: "2024-01-20",
    category: "sales",
  },
];
```

## Themes

Available themes: `default`, `dark`, `corporate`, `accessible`, `colorful`, `financial`, `professional`

```javascript
chart.theme("corporate");

// Custom theme configuration
chart.themeConfig({
  background: "#ffffff",
  colors: ["#3498db", "#2ecc71", "#e74c3c"],
  text: "#2c3e50",
  grid: "#ecf0f1",
});
```

## Development

### Setup

```bash
git clone https://github.com/coredds/MintWaterfall.git
cd MintWaterfall
npm install
```

### Commands

```bash
npm test              # Run full test suite (334 tests)
npm run test:coverage # Tests with coverage
npm run lint          # ESLint code quality checks
npm run build         # Production build (4 bundle formats)
npm run build:ts      # TypeScript type-check only
npm start             # Development server (localhost:8080)
```

### Build Output

- `dist/mintwaterfall.esm.js` - ES Module bundle
- `dist/mintwaterfall.umd.js` - UMD bundle for browsers
- `dist/mintwaterfall.min.js` - Minified production bundle
- `dist/mintwaterfall.cjs.js` - CommonJS bundle for Node.js

### Test Coverage

- **334 total tests** across 16 test suites (100% pass rate)
- **18% overall coverage** with focus on data validation (96.9%) and transforms (73.2%)
- **Statistical Analysis: 89.6% coverage** (27 tests)
- **Accessibility: 89.6% coverage** (27 tests)
- **Critical Integration Tests: 21 tests** for regression prevention

### Performance Metrics

- **Build time: 5.8 seconds** (optimized Rollup configuration)
- **Test execution: 7.2 seconds** (full suite with coverage)
- **Bundle sizes optimized** with external D3 dependencies
- **Memory efficient** algorithms for large datasets

## Browser Compatibility

**Requirements**: ES6 Modules, D3.js v7+, SVG support, Node.js 18+  
**Tested**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

## Architecture

### Module Structure

- **Chart Factory**: `src/chart/chart.ts` — Composes config, render, lifecycle
- **Chart Config**: `src/chart/config.ts` — Types, defaults, margins, utilities
- **Rendering**: `src/chart/render.ts` — Grid, axes, bars, connectors, trend lines
- **Data Pipeline**: `src/data/pipeline.ts` — Unified data processor
- **Transforms**: `src/data/transforms.ts` — Aggregation, sorting, filtering, normalization
- **Advanced Data**: `src/data/advanced.ts` — D3 group/rollup/cross/index operations
- **Validation**: `src/data/validation.ts` — Input validation and summaries
- **Statistics**: `src/statistics.ts` — Statistical analysis functions
- **Interactions**: `src/interactions.ts` — Drag, hover, force simulation
- **Accessibility**: `src/accessibility.ts` — WCAG compliance features
- **Animations**: `src/animations.ts` — Transition and animation system
- **Themes**: `src/themes.ts` — Theme management and color scales
- **Export**: `src/export.ts` — SVG, PNG, JSON, CSV export
- **Layouts**: `src/layouts.ts` — Hierarchical and basic layouts
- **Performance**: `src/performance.ts` — Optimization and spatial indexing

## Recent Updates

### v1.0.0 (Current)

- **TypeScript migration complete** — all source files are `.ts`, entry point is `src/index.ts`
- **Module restructuring** — chart split into `src/chart/`, data split into `src/data/`
- **Consolidated modules** — merged advanced variants, dropped `mintwaterfall-` prefix
- **Removed D3 namespace mutation** — no more `window.d3.waterfallChart`
- **CI/CD consolidated** — 8 workflows → 4, added TypeScript type-check step
- **Demo replaced** — minimal working example replaces 4000-line demo
- **Added AGENTS.md** — development conventions, architecture, commands

### v0.8.10

- Security fix: resolved high-severity vulnerability in `@isaacs/brace-expansion`
- Updated dependencies: babel 7.29, eslint 9.39.2, prettier 3.8.1, rollup 4.57.1
- Modernized GitHub Actions: Node 22.x, replaced deprecated actions, added npm caching
- Fixed missing build step in `publish.yml` workflow
- Updated engine requirement to `>=18.0.0` to match actual toolchain minimum
- Corrected stale version references across configs and demo files

### v0.8.9

- Updated all dev dependencies to latest compatible versions
- Code formatting updated to comply with Prettier 3.7.4

### v0.8.7

- Complete statistical analysis system with 89.6% test coverage
- Advanced interaction system with drag, hover, and force simulation
- Comprehensive data processing with D3.js integration
- Full accessibility compliance with WCAG 2.1 support
- TypeScript strict mode with complete type definitions

## Contributing

Contributions welcome. Requirements:

- TypeScript with strict type checking
- D3.js v7+ compatibility
- Comprehensive test coverage for new features
- ESLint compliance (no errors, minimal warnings)
- Updated documentation and examples

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## License

MIT License - see [LICENSE](LICENSE) file for details.
