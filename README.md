# MintWaterfall v0.8.7

[![CI](https://github.com/coredds/MintWaterfall/actions/workflows/basic-checks.yml/badge.svg?branch=main)](https://github.com/coredds/MintWaterfall/actions/workflows/basic-checks.yml)
[![Security Audit](https://github.com/coredds/MintWaterfall/actions/workflows/security.yml/badge.svg)](https://github.com/coredds/MintWaterfall/actions/workflows/security.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-0.8.7-blue.svg)](https://github.com/coredds/MintWaterfall/releases)
[![codecov](https://codecov.io/gh/coredds/MintWaterfall/branch/main/graph/badge.svg)](https://codecov.io/gh/coredds/MintWaterfall)

A comprehensive TypeScript waterfall chart library built on D3.js v7. Features advanced data processing, statistical analysis, interactive visualizations, and enterprise-grade performance with complete type safety.

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
- **TypeScript**: Complete type safety with strict checking across 20+ modules
- **Optimized Build**: 4 bundle formats (ESM, UMD, CJS, Minified) with external D3 dependencies
- **Test Coverage**: 338 tests across 18 test suites with 26.5% overall coverage
- **Production Ready**: Robust error handling, edge case management, and performance optimization

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
import { waterfallChart, createDataProcessor, createStatisticalSystem } from 'mintwaterfall';
import * as d3 from 'd3';
```

## Quick Start

```javascript
const data = [
    {
        label: "Q1 Revenue",
        stacks: [{ value: 45000, color: "#3498db", label: "$45K" }],
        category: "revenue"
    },
    {
        label: "Q2 Growth", 
        stacks: [{ value: 30000, color: "#2ecc71", label: "$30K" }],
        category: "revenue"
    },
    {
        label: "Expenses",
        stacks: [{ value: -15000, color: "#e74c3c", label: "-$15K" }],
        category: "expenses"
    }
];

const chart = waterfallChart()
    .width(800)
    .height(400)
    .showTotal(true)
    .theme('corporate')
    .enableAccessibility(true);

d3.select('#chart')
    .datum(data)
    .call(chart);
```

## Advanced Features

### Statistical Analysis
```javascript
import { createStatisticalSystem } from 'mintwaterfall';

const stats = createStatisticalSystem();

// Comprehensive statistical summary
const summary = stats.calculateSummary([10, 20, 30, 40, 50]);
// Returns: { mean, median, mode, variance, quartiles, percentiles }

// Outlier detection with IQR method
const outliers = stats.detectOutliers(data, labels);
// Returns: { outliers, cleanData, method, threshold, statistics }

// Trend analysis with forecasting
const trend = stats.analyzeTrend([{x: 1, y: 10}, {x: 2, y: 20}]);
// Returns: { slope, intercept, correlation, rSquared, forecast }

// Data quality assessment
const quality = stats.assessDataQuality(rawData);
// Returns: { completeness, validity, accuracy, issues, recommendations }
```

### Interactive Systems
```javascript
import { createAdvancedInteractionSystem } from 'mintwaterfall';

const interactions = createAdvancedInteractionSystem(container, data);

// Enable drag interactions with constraints
interactions.enableDrag({
    enabled: true,
    axis: 'vertical',
    constraints: { minValue: -100, maxValue: 100 }
});

// Enhanced hover detection with Voronoi diagrams
interactions.enableEnhancedHover({
    enabled: true,
    extent: [[0, 0], [800, 400]]
});

// Force simulation for dynamic layouts
interactions.startForceSimulation({
    enabled: true,
    forces: { collision: true, positioning: true },
    strength: { collision: 0.7, positioning: 0.5 }
});
```

### Advanced Data Processing
```javascript
import { createAdvancedDataProcessor } from 'mintwaterfall';

const processor = createAdvancedDataProcessor();

// Multi-dimensional grouping
const grouped = processor.groupBy(salesData, d => d.region);

// Data rollup with custom reducers
const aggregated = processor.rollupBy(
    salesData, 
    values => d3.sum(values, d => d.revenue),
    d => d.category
);

// Cross-tabulation for dimensional analysis
const crossTab = processor.crossTabulate(
    categories, quarters,
    (cat, quarter) => ({ category: cat, quarter, key: `${cat}-${quarter}` })
);

// Time-based aggregation
const timeAggregated = processor.aggregateByTime(
    timeSeriesData,
    d => new Date(d.date),
    d => d.value,
    'month'
);
```

## Configuration API

### Chart Configuration
```javascript
chart
    .width(800)                    // Chart dimensions
    .height(400)
    .margin({top: 20, right: 30, bottom: 40, left: 50})
    .showTotal(true)               // Display total bar
    .stacked(false)                // Toggle chart mode
    .barPadding(0.1)               // Bar spacing
    .duration(750)                 // Animation duration
    .theme('corporate')            // Theme selection
    .enableAccessibility(true)     // WCAG compliance
```

### Accessibility Features
```javascript
import { createAccessibilitySystem } from 'mintwaterfall';

const a11y = createAccessibilitySystem();

// Create accessible chart descriptions
const descriptionId = a11y.createChartDescription(container, data, {
    title: "Quarterly Revenue Analysis",
    summary: "Shows revenue trends across four quarters"
});

// Validate color contrast
const contrast = a11y.validateColorContrast('#3498db', '#ffffff');
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
interactions.on('dragStart', (event) => {
    console.log('Drag started:', event);
});

interactions.on('hoverEnter', (data) => {
    console.log('Hover detected:', data);
});
```

## Data Formats

### Basic Waterfall Data
```javascript
const waterfallData = [{
    label: "Category Name",
    stacks: [
        { value: 100, color: "#3498db", label: "Positive" },
        { value: -25, color: "#e74c3c", label: "Negative" }
    ],
    category: "revenue"
}];
```

### Advanced Processing Data
```javascript
const businessData = [
    { 
        region: 'North', 
        product: 'Widget', 
        revenue: 100000, 
        date: '2024-01-15',
        category: 'sales'
    },
    { 
        region: 'South', 
        product: 'Gadget', 
        revenue: 85000, 
        date: '2024-01-20',
        category: 'sales'
    }
];
```

## Themes

Available themes: `default`, `dark`, `corporate`, `accessible`, `colorful`, `financial`, `professional`

```javascript
chart.theme('corporate');

// Custom theme configuration
chart.themeConfig({
    background: '#ffffff',
    colors: ['#3498db', '#2ecc71', '#e74c3c'],
    text: '#2c3e50',
    grid: '#ecf0f1'
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
npm test              # Run full test suite (338 tests)
npm run test:core     # Run core functionality tests (136 tests)
npm run test:fast     # Run tests with parallel execution
npm run lint          # ESLint code quality checks
npm run build         # Production build (4 bundle formats)
npm start             # Development server (localhost:8080)
```

### Build Output
- `dist/mintwaterfall.esm.js` - ES Module bundle
- `dist/mintwaterfall.umd.js` - UMD bundle for browsers
- `dist/mintwaterfall.min.js` - Minified production bundle
- `dist/mintwaterfall.cjs.js` - CommonJS bundle for Node.js
- `dist/index.d.ts` - TypeScript definitions

### Test Coverage
- **338 total tests** across 18 test suites (100% pass rate)
- **26.5% overall coverage** with high-value test focus
- **Statistical Analysis: 89.6% coverage** (27 tests)
- **Advanced Interactions: 42.4% coverage** (28 tests)
- **Advanced Data Processing: 25.9% coverage** (28 tests)
- **Critical Integration Tests: 21 tests** for regression prevention

### Performance Metrics
- **Build time: 5.8 seconds** (optimized Rollup configuration)
- **Test execution: 7.2 seconds** (full suite with coverage)
- **Bundle sizes optimized** with external D3 dependencies
- **Memory efficient** algorithms for large datasets

## Browser Compatibility

**Requirements**: ES6 Modules, D3.js v7+, SVG support  
**Tested**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

## Architecture

### Module Structure
- **Core Chart**: `mintwaterfall-chart.ts` - Main chart component
- **Data Processing**: `mintwaterfall-data.ts` - Data transformation utilities
- **Advanced Data**: `mintwaterfall-advanced-data.ts` - D3 integration and complex operations
- **Statistics**: `mintwaterfall-statistics.ts` - Statistical analysis functions
- **Interactions**: `mintwaterfall-advanced-interactions.ts` - Drag, hover, force simulation
- **Accessibility**: `mintwaterfall-accessibility.ts` - WCAG compliance features
- **Animations**: `mintwaterfall-animations.ts` - Transition and animation system
- **Themes**: `mintwaterfall-themes.ts` - Theme management
- **Export**: `mintwaterfall-export.ts` - Export functionality
- **Performance**: `mintwaterfall-performance.ts` - Optimization utilities

## Recent Updates

### v0.8.7 (Current)
- Complete statistical analysis system with 89.6% test coverage
- Advanced interaction system with drag, hover, and force simulation
- Comprehensive data processing with D3.js integration
- Full accessibility compliance with WCAG 2.1 support
- 338 tests across 18 test suites with 100% pass rate
- Optimized build pipeline with 5.8-second build times
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