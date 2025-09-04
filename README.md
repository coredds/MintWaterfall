# MintWaterfall v0.8.5

[![CI](https://github.com/coredds/MintWaterfall/actions/workflows/basic-checks.yml/badge.svg?branch=main)](https://github.com/coredds/MintWaterfall/actions/workflows/basic-checks.yml)
[![Security Audit](https://github.com/coredds/MintWaterfall/actions/workflows/security.yml/badge.svg)](https://github.com/coredds/MintWaterfall/actions/workflows/security.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-0.8.5-blue.svg)](https://github.com/coredds/MintWaterfall/releases)
[![codecov](https://codecov.io/gh/coredds/MintWaterfall/branch/main/graph/badge.svg)](https://codecov.io/gh/coredds/MintWaterfall)

A production-ready, TypeScript-first waterfall chart component built on D3.js v7. Features comprehensive interactive capabilities including tooltips, themes, zoom, accessibility, and trend analysis with full type safety and enterprise-grade performance.

**[Live Demo](https://coredds.github.io/MintWaterfall/mintwaterfall-example.html)**

## Features

### Core Waterfall Charts
- **Dual Modes**: Traditional waterfall and stacked visualization
- **Interactive Elements**: Hover tooltips, click events, zoom and pan
- **Theming System**: Multiple built-in themes with custom color schemes
- **Accessibility**: WCAG 2.1 compliance with keyboard navigation and screen reader support
- **Export Capabilities**: SVG, PNG, JSON, and CSV export formats

### Advanced Analytics
- **Trend Analysis**: Linear regression, moving average, and polynomial curve fitting
- **Data Processing**: Built-in support for grouping, rollup, and cross-tabulation
- **Conditional Formatting**: Dynamic styling based on value thresholds
- **Breakdown Analysis**: Hierarchical drill-down with interactive exploration

### TypeScript Architecture
- **Full Type Safety**: Complete TypeScript definitions with strict type checking
- **Modular Design**: Clean separation of concerns across 12 specialized modules
- **D3.js Integration**: Native D3.js v7 compatibility with enhanced type support
- **Enterprise Ready**: Production-tested with comprehensive test coverage

## Quick Start

### Installation

**NPM/Yarn:**
```bash
npm install mintwaterfall
# or
yarn add mintwaterfall
```

**CDN:**
```html
<script src="https://d3js.org/d3.v7.min.js"></script>
<script src="https://unpkg.com/mintwaterfall@latest/dist/mintwaterfall.min.js"></script>
```

**ES Modules:**
```javascript
import { waterfallChart } from 'mintwaterfall';
import * as d3 from 'd3';
```

### Basic Usage

```javascript
const data = [
    {
        label: "Q1 Revenue",
        stacks: [{ value: 45000, color: "#3498db", label: "$45K" }]
    },
    {
        label: "Q2 Growth", 
        stacks: [{ value: 30000, color: "#2ecc71", label: "$30K" }]
    },
    {
        label: "Expenses",
        stacks: [{ value: -15000, color: "#e74c3c", label: "-$15K" }]
    }
];

const chart = waterfallChart()
    .width(800)
    .height(400)
    .showTotal(true)
    .stacked(false)
    .enableTooltips(true)
    .theme('default');

d3.select('#chart')
    .datum(data)
    .call(chart);
```

## Enterprise Features

### Breakdown Analysis

```javascript
const chart = d3.waterfallChart()
    .breakdown({
        enabled: true,
        maxBreakdowns: 5,
        showOthers: true,
        sortStrategy: 'value-desc'
    });

const dataWithBreakdown = [{
    label: "Q1 Revenue",
    stacks: [{ value: 100000, color: "#3498db" }],
    breakdown: {
        data: [
            { name: "Enterprise", value: 60000, color: "#2c3e50" },
            { name: "SMB", value: 30000, color: "#34495e" },
            { name: "Consumer", value: 10000, color: "#7f8c8d" }
        ]
    }
}];
```

### Conditional Formatting

```javascript
const chart = d3.waterfallChart()
    .conditionalFormatting({
        enabled: true,
        rules: [
            { condition: "value > 75000", color: "#27ae60", label: "Excellent" },
            { condition: "value > 50000", color: "#f39c12", label: "Good" },
            { condition: "value < 25000", color: "#e74c3c", label: "Poor" }
        ]
    });
```

## Interactive Features

### Tooltips and Themes

```javascript
const chart = waterfallChart()
    .enableTooltips(true)
    .tooltipConfig({ theme: 'light' })
    .theme('corporate');

// Available themes: default, dark, corporate, accessible, colorful
```

### Zoom and Pan

```javascript
const chart = waterfallChart()
    .enableZoom(true)
    .zoomConfig({
        scaleExtent: [0.5, 10],
        translateExtent: [[-100, -100], [width + 100, height + 100]]
    });
```

### Trend Lines

```javascript
const chart = waterfallChart()
    .showTrendLine(true)
    .trendLineType('polynomial')
    .trendLineColor('#e74c3c')
    .trendLineWidth(3)
    .trendLineDegree(2);

// Available types: linear, moving-average, polynomial
```

## API Reference

### Core Configuration
```javascript
chart
    .width(800)                    // Chart width
    .height(400)                   // Chart height  
    .showTotal(true)               // Show total bar
    .stacked(false)                // Toggle stacked/waterfall mode
    .margin({top: 20, right: 30, bottom: 40, left: 50})  // Chart margins
    .barPadding(0.1)               // Space between bars
    .duration(750)                 // Animation duration
```

### Interactive Features
```javascript
chart
    .enableTooltips(true)          // Enable hover tooltips
    .enableZoom(true)              // Enable zoom and pan
    .enableAccessibility(true)     // Enable accessibility features
    .theme('corporate')            // Apply theme
    .showTrendLine(true)           // Enable trend line overlay
    .trendLineType('linear')       // Set trend line algorithm
```

### Event Handling
```javascript
chart.on("barClick", (event, d) => {
    console.log("Clicked:", d.label);
});

chart.on("barHover", (event, d) => {
    console.log("Hovered:", d.label);
});
```

### Data Format
```javascript
const data = [{
    label: "Category Name",
    stacks: [
        { value: 100, color: "#3498db", label: "100" },
        { value: -25, color: "#e74c3c", label: "-25" }
    ],
    breakdown: {  // Optional for breakdown analysis
        data: [
            { name: "Subcategory", value: 50, color: "#2c3e50" }
        ]
    }
}];
```

## Development

### Setup
```bash
git clone https://github.com/coredds/MintWaterfall.git
cd MintWaterfall
npm install
```

### Scripts
```bash
npm test              # Run test suite (183 tests)
npm run lint          # ESLint code quality checks
npm run build         # Build TypeScript and bundle
npm start             # Development server (port 8080)
```

### Build Output
- `dist/mintwaterfall.esm.js` - ES Module (177KB)
- `dist/mintwaterfall.umd.js` - UMD Bundle (197KB)
- `dist/mintwaterfall.min.js` - Minified UMD (64KB)
- `dist/mintwaterfall.cjs.js` - CommonJS (179KB)
- `dist/index.d.ts` - TypeScript definitions

## Browser Support

**Minimum Requirements**: ES6 Modules, D3.js v7+, SVG Support  
**Tested Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Contributing

Contributions welcome! Please ensure:
- TypeScript compatibility with strict type checking
- D3.js v7+ compatibility maintained
- Tests included for new features (Jest framework)
- Zero linting errors (ESLint strict policy)
- Documentation updated

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## Changelog

### v0.8.5 (Current)
- **TypeScript Migration**: Complete TypeScript rewrite with full type safety
- **Interactive Features**: Working tooltips, themes, zoom, accessibility, and trend lines
- **Code Cleanup**: Removed unused legacy code, optimized bundle sizes
- **Test Coverage**: 183 tests passing with comprehensive coverage
- **Production Ready**: Zero lint errors, clean architecture

### v0.8.0
- **Enterprise Features**: Breakdown analysis and conditional formatting
- **Advanced Analytics**: Interactive drill-down with smart grouping
- **Production Quality**: Comprehensive test coverage

### v0.6.0
- **Trend Analysis**: Linear, moving average, polynomial overlays
- **Data Loading**: CSV, JSON, TSV with HTTP URL support
- **Export Capabilities**: SVG, PNG, JSON, CSV export formats
- **Accessibility**: WCAG 2.1 compliance with keyboard navigation

For complete version history, see [CHANGELOG.md](CHANGELOG.md).