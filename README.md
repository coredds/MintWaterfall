# MintWaterfall v0.8.6

[![CI](https://github.com/coredds/MintWaterfall/actions/workflows/basic-checks.yml/badge.svg?branch=main)](https://github.com/coredds/MintWaterfall/actions/workflows/basic-checks.yml)
[![Security Audit](https://github.com/coredds/MintWaterfall/actions/workflows/security.yml/badge.svg)](https://github.com/coredds/MintWaterfall/actions/workflows/security.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-0.8.6-blue.svg)](https://github.com/coredds/MintWaterfall/releases)
[![codecov](https://codecov.io/gh/coredds/MintWaterfall/branch/main/graph/badge.svg)](https://codecov.io/gh/coredds/MintWaterfall)

A production-ready TypeScript waterfall chart component built on D3.js v7. Provides comprehensive data processing capabilities, interactive features, and enterprise-grade performance with full type safety.

**[Live Demo](https://coredds.github.io/MintWaterfall/mintwaterfall-example.html)**

## Features

### Core Capabilities
- **Dual Chart Modes**: Traditional waterfall and stacked visualization
- **Advanced Data Processing**: Multi-dimensional grouping, temporal aggregation, cross-tabulation
- **Interactive Elements**: Tooltips, zoom/pan, click events, brush selection
- **Export Formats**: SVG, PNG, JSON, CSV
- **Accessibility**: WCAG 2.1 compliant with keyboard navigation

### Data Processing
- **D3.js Integration**: Native support for `d3.group()`, `d3.rollup()`, `d3.cross()`, `d3.index()`
- **Financial Analysis**: Variance analysis, period comparison, revenue breakdowns
- **Statistical Functions**: Mean, median, variance, quantiles with null-safe handling
- **Temporal Operations**: Time-series aggregation with D3.js time intervals

### TypeScript Architecture
- **Type Safety**: Complete TypeScript definitions with strict checking
- **Modular Design**: 12 specialized modules with clean separation
- **Performance Optimized**: Efficient algorithms for large datasets

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
import { waterfallChart } from 'mintwaterfall';
import * as d3 from 'd3';
```

## Quick Start

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
    .theme('default');

d3.select('#chart')
    .datum(data)
    .call(chart);
```

## Advanced Data Processing

### Multi-dimensional Analysis
```javascript
import { createDataProcessor } from 'mintwaterfall';

const processor = createDataProcessor();

// Group by multiple dimensions
const grouped = processor.groupBy(salesData, d => d.region, d => d.product);

// Aggregate with custom functions
const aggregated = processor.rollupBy(
    salesData, 
    values => d3.sum(values, d => d.revenue),
    d => d.region
);

// Temporal aggregation
const monthlyData = processor.aggregateByTime(salesData, {
    dateField: 'date',
    valueField: 'revenue',
    interval: 'month'
});
```

### Financial Analysis
```javascript
import { createVarianceWaterfall, createRevenueWaterfall } from 'mintwaterfall';

// Variance analysis (actual vs budget)
const varianceChart = createVarianceWaterfall(
    financialData, 
    'category', 
    'actual', 
    'budget'
);

// Multi-dimensional revenue breakdown
const revenueChart = createRevenueWaterfall(
    salesData,
    ['region', 'product'],
    'revenue'
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
```

### Interactive Features
```javascript
chart
    .enableTooltips(true)          // Hover tooltips
    .enableZoom(true)              // Zoom and pan
    .enableAccessibility(true)     // WCAG compliance
    .showTrendLine(true)           // Trend overlays
    .brush({                       // Data selection
        enabled: true,
        direction: 'x'
    })
```

### Event Handling
```javascript
chart.on("barClick", (event, d) => {
    console.log("Clicked:", d.label, d.value);
});

chart.on("brushEnd", (selection) => {
    console.log("Selected range:", selection);
});
```

## Data Format

```javascript
const waterfallData = [{
    label: "Category Name",
    stacks: [
        { value: 100, color: "#3498db", label: "Positive" },
        { value: -25, color: "#e74c3c", label: "Negative" }
    ]
}];

// For advanced processing
const businessData = [
    { region: 'North', product: 'Widget', revenue: 100000, date: '2024-01-15' },
    { region: 'South', product: 'Gadget', revenue: 85000, date: '2024-01-20' }
];
```

## Themes

Available themes: `default`, `dark`, `corporate`, `accessible`, `colorful`

```javascript
chart.theme('corporate');

// Custom theme
chart.themeConfig({
    background: '#ffffff',
    colors: ['#3498db', '#2ecc71', '#e74c3c'],
    text: '#2c3e50'
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
npm test              # Run test suite (208 tests)
npm run lint          # Code quality checks
npm run build         # TypeScript compilation and bundling
npm start             # Development server (localhost:8080)
```

### Build Output
- `dist/mintwaterfall.esm.js` - ES Module (193KB)
- `dist/mintwaterfall.umd.js` - UMD Bundle (215KB)  
- `dist/mintwaterfall.min.js` - Minified (70KB)
- `dist/mintwaterfall.cjs.js` - CommonJS (196KB)
- Type definitions included

### Test Coverage
- **208 total tests** across 13 test suites
- **38.3% coverage** for core data processing module
- **25 integration tests** for critical business logic
- **Performance benchmarks** for large datasets

## Browser Compatibility

**Requirements**: ES6 Modules, D3.js v7+, SVG support  
**Tested**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

## Recent Updates

### v0.8.6 (Current)
- Advanced D3.js data processing features
- Multi-dimensional grouping and temporal aggregation
- Financial analysis functions (variance, revenue breakdown)
- Enhanced error handling and data validation
- Improved test coverage (25 new integration tests)
- Complete TypeScript migration with strict type checking

### v0.8.5
- Comprehensive test suite (183 tests, 100% pass rate)
- Performance optimizations for large datasets
- Enhanced TypeScript support and type definitions

## Contributing

Contributions welcome. Requirements:
- TypeScript with strict type checking
- D3.js v7+ compatibility
- Test coverage for new features
- Zero linting errors
- Updated documentation

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT License - see [LICENSE](LICENSE) file for details.