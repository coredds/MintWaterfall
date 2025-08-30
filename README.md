# MintWaterfall v0.8.1

[![CI](https://github.com/coredds/MintWaterfall/actions/workflows/basic-checks.yml/badge.svg?branch=main)](https://github.com/coredds/MintWaterfall/actions/workflows/basic-checks.yml)
[![Security Audit](https://github.com/coredds/MintWaterfall/actions/workflows/security.yml/badge.svg)](https://github.com/coredds/MintWaterfall/actions/workflows/security.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-0.8.1-blue.svg)](https://github.com/coredds/MintWaterfall/releases)
[![codecov](https://codecov.io/gh/coredds/MintWaterfall/branch/main/graph/badge.svg)](https://codecov.io/gh/coredds/MintWaterfall)

A production-ready, D3.js-compatible waterfall chart component with enterprise features including hierarchical layouts, advanced data processing, performance optimization, and Power BI integration capabilities.

**[Live Demo](https://coredds.github.io/MintWaterfall/mintwaterfall-example.html)**

## Features

### Core Functionality
- **Waterfall Charts**: Traditional waterfall and stacked visualization modes
- **Data Loading**: CSV, JSON, TSV support with HTTP URL loading and auto-detection
- **Export Options**: High-DPI PNG (2x), SVG, JPEG, PDF with quality controls
- **Trend Analysis**: Linear, moving average, and polynomial overlays
- **Accessibility**: WCAG 2.1 compliance with Forced Colors Mode support

### Enterprise Features
- **Breakdown Analysis**: Hierarchical data drill-down with smart grouping and interactive exploration
- **Conditional Formatting**: Dynamic styling based on values, thresholds, and custom business rules
- **Performance Dashboard**: Real-time monitoring with render time, memory usage, and FPS tracking

### Advanced Layouts (v0.8.1)
- **Hierarchical Layouts**: Complete D3.js layout system with treemap, partition, sunburst, and pack layouts
- **Advanced Data Processing**: Modern D3.js data structures (`d3.group`, `d3.rollup`) with transformation pipelines
- **Performance Optimization**: Handle large datasets (>500K data points) with virtualization and memory management

### Production Quality
- **210+ Test Cases**: Comprehensive test coverage with zero errors
- **Zero Lint Issues**: Perfect ESLint compliance with clean architecture
- **D3.js v7 Compatible**: Full integration with modern D3.js ecosystem
- **Power BI Ready**: Enhanced D3.js feature coverage for enterprise integration

## Quick Start

### Installation

```html
<!DOCTYPE html>
<html>
<head>
    <script src="https://d3js.org/d3.v7.min.js"></script>
    <script src="dist/mintwaterfall.min.js"></script>
</head>
<body>
    <svg id="chart"></svg>
    <script>
        // Your chart code here
    </script>
</body>
</html>
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

const chart = d3.waterfallChart()
    .width(1100)
    .height(600)
    .showTotal(true)
    .stacked(true);

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

## Hierarchical Layouts

### Treemap Chart

```javascript
const hierarchicalData = {
    name: "Budget",
    children: [
        {
            name: "Operations",
            children: [
                { name: "Payroll", value: 300000 },
                { name: "Facilities", value: 150000 }
            ]
        },
        {
            name: "Development", 
            children: [
                { name: "R&D", value: 200000 },
                { name: "Software", value: 120000 }
            ]
        }
    ]
};

const treemap = d3.treemapChart()
    .width(800)
    .height(400)
    .padding(1);

d3.select('#chart')
    .datum(hierarchicalData)
    .call(treemap);
```

### Partition Charts (Sunburst/Icicle)

```javascript
const sunburst = d3.partitionChart()
    .width(600)
    .height(600)
    .orientation("radial")
    .layoutType("sunburst");

d3.select('#chart')
    .datum(hierarchicalData)
    .call(sunburst);
```

## Advanced Data Processing

```javascript
// Group data by multiple levels
const grouped = d3.advancedDataProcessor.groupData(data, 
    d => d.region, 
    d => d.category
);

// Aggregate with rollup
const aggregated = d3.advancedDataProcessor.rollupData(data,
    values => d3.sum(values, d => d.sales),
    d => d.region
);

// Create cross-tabulation
const crosstab = d3.advancedDataProcessor.crossTabulate(data, 
    'region', 'category', 'sales'
);
```

## Performance Optimization

### Large Dataset Handling

```javascript
const chart = d3.waterfallChart()
    .enablePerformanceMonitoring(true)
    .performanceConfig({
        virtualizationThreshold: 10000,
        chunkSize: 5000,
        enableVirtualization: true
    });

// Generate large dataset for testing
const largeData = d3.largeDatasetUtils.generateSampleData(100000);

d3.select('#chart')
    .datum(largeData)
    .call(chart);

// Monitor performance
console.log(chart.getPerformanceMetrics());
```

## API Reference

### Core Configuration
```javascript
chart
    .width(800)                    // Chart width
    .height(400)                   // Chart height  
    .showTotal(true)               // Show total bar
    .stacked(true)                 // Toggle stacked/waterfall mode
    .margin({top: 20, right: 30, bottom: 40, left: 50})  // Chart margins
```

### Enterprise Configuration
```javascript
chart
    .breakdown(config)             // Configure breakdown analysis
    .conditionalFormatting(config) // Configure conditional formatting
    .showTrendLine(true)           // Enable trend line overlay
    .export('png', options)        // Export chart (PNG, SVG, JPEG, PDF)
```

### Performance Configuration
```javascript
chart
    .enablePerformanceMonitoring(true)    // Enable performance tracking
    .performanceConfig(config)            // Configure performance options
    .getPerformanceMetrics()              // Get current performance data
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
npm test              # Run comprehensive test suite
npm run lint          # Code quality checks
npm run build         # Build distribution files
npm run dev           # Development server (port 8080)
npm run demo          # Launch demo server
```

### Build Output
- `dist/mintwaterfall.esm.js` - ES Module (209KB)
- `dist/mintwaterfall.umd.js` - UMD Bundle (232KB)
- `dist/mintwaterfall.min.js` - Minified UMD (89KB)
- `dist/mintwaterfall.cjs.js` - CommonJS (210KB)

## Browser Support

**Minimum Requirements**: ES6 Modules, D3.js v7+, SVG Support  
**Tested Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Contributing

Contributions welcome! Please ensure:
- D3.js v7+ compatibility maintained
- Tests included for new features
- Zero linting errors (strict policy)
- Documentation updated

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## Changelog

### v0.8.1 (Current)
- **Hierarchical Layouts**: Complete D3.js layout system (treemap, partition, sunburst, pack)
- **Performance Optimization**: Large dataset handling with virtualization and memory management
- **Advanced Data Processing**: Modern D3.js data structures with transformation pipelines
- **Power BI Integration**: Enhanced D3.js feature coverage for enterprise integration

### v0.8.0
- **Enterprise Features**: Breakdown analysis and conditional formatting
- **Advanced Analytics**: Interactive drill-down with smart grouping
- **Production Quality**: 210+ tests passing, zero lint errors

### v0.6.0
- **Trend Analysis**: Linear, moving average, polynomial overlays
- **Data Loading**: CSV, JSON, TSV with HTTP URL support
- **High-DPI Export**: 2x scaling PNG, SVG, JPEG, PDF
- **Accessibility**: WCAG 2.1 compliance, Forced Colors Mode

For complete version history, see [CHANGELOG.md](CHANGELOG.md).