# MintWaterfall v0.8.0

[![CI](https://github.com/coredds/MintWaterfall/actions/workflows/basic-checks.yml/badge.svg?branch=main)](https://github.com/coredds/MintWaterfall/actions/workflows/basic-checks.yml)
[![Security Audit](https://github.com/coredds/MintWaterfall/actions/workflows/security.yml/badge.svg)](https://github.com/coredds/MintWaterfall/actions/workflows/security.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-0.8.0-blue.svg)](https://github.com/coredds/MintWaterfall/releases)
[![codecov](https://codecov.io/gh/coredds/MintWaterfall/branch/main/graph/badge.svg)](https://codecov.io/gh/coredds/MintWaterfall)

A production-ready, D3.js-compatible waterfall chart component with enterprise features including breakdown analysis, conditional formatting, and advanced visualization capabilities.

**[Live Demo](https://coredds.github.io/MintWaterfall/mintwaterfall-example.html)**

## Key Features

### **Enterprise Edition**
- **Breakdown Analysis**: Hierarchical data drill-down with smart grouping and interactive exploration
- **Conditional Formatting**: Dynamic styling based on values, thresholds, and custom business rules
- **Advanced Analytics**: Fortune 500-level data visualization capabilities

### **Core Functionality**
- **Dual Visualization Modes**: Toggle between stacked and waterfall chart types
- **Advanced Export**: High-DPI PNG (2x), SVG, JPEG, PDF with quality controls
- **Data Loading**: CSV, JSON, TSV support with HTTP URL loading and auto-detection
- **Trend Analysis**: Linear, moving average, and polynomial overlays

### **Production Quality**
- **210 Comprehensive Tests**: Extensive test coverage with zero errors
- **Perfect Code Quality**: Zero ESLint warnings, clean architecture
- **D3.js v7 Compatible**: Full integration with modern D3.js ecosystem
- **Accessibility**: WCAG 2.1 compliance with Forced Colors Mode support

## Quick Start

### Installation

```html
<!DOCTYPE html>
<html>
<head>
    <script src="https://d3js.org/d3.v7.min.js"></script>
</head>
<body>
    <svg id="chart"></svg>
    <script type="module">
        import { waterfallChart } from './mintwaterfall-chart.js';
        // Your chart code here
    </script>
</body>
</html>
```

### Basic Usage

```javascript
import { waterfallChart } from './mintwaterfall-chart.js';

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
Hierarchical data drill-down with smart grouping and interactive visualization.

```javascript
const chart = waterfallChart()
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
Dynamic styling based on data values, thresholds, and custom business rules.

```javascript
const chart = waterfallChart()
    .conditionalFormatting({
        enabled: true,
        rules: [
            { condition: "value > 75000", color: "#27ae60", label: "Excellent" },
            { condition: "value > 50000", color: "#f39c12", label: "Good" },
            { condition: "value < 25000", color: "#e74c3c", label: "Poor" }
        ]
    });
```

## 📚 API Reference

### Core Methods
```javascript
// Configuration
.width(800)              // Chart width
.height(400)             // Chart height  
.showTotal(true)         // Show total bar
.stacked(true)           // Toggle stacked/waterfall mode

// Enterprise Features
.breakdown(config)       // Configure breakdown analysis
.conditionalFormatting(config)  // Configure conditional formatting

// Advanced Features
.showTrendLine(true)     // Enable trend line overlay
.export('png', options)  // Export chart (PNG, SVG, JPEG, PDF)

// Data Loading
loadData('data.csv')     // Load CSV, JSON, TSV files
```

### Event Handling
```javascript
chart.on("barClick", (event, d) => {
    console.log("Clicked:", d.label);
});
```

### Data Format
```javascript
const data = [{
    label: "Category Name",
    stacks: [
        { value: 100, color: "#3498db", label: "100" },
        { value: -25, color: "#e74c3c", label: "-25" }
    ]
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
npm test              # Run 210 comprehensive tests
npm run lint          # Code quality checks (zero errors)
npm run build         # Build distribution
npm run dev           # Development server (port 8080)
```

### Quality Standards
- **210 Test Cases**: Comprehensive coverage including enterprise features
- **Zero Lint Issues**: Perfect ESLint compliance
- **Production Ready**: Enterprise-grade code quality
- **D3.js v7 Compatible**: Full API compatibility validation

## Browser Support

**Minimum Requirements**: ES6 Modules, D3.js v7+, SVG Support  
**Tested**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

## 📜 License

MIT License - see [LICENSE](LICENSE) file for details.

## Contributing

Contributions welcome! Please ensure:
- D3.js v7+ compatibility maintained
- Tests included (we maintain 210+ test cases)
- Zero linting errors (strict policy)
- Documentation updated

See [Contributing Guide](CONTRIBUTING.md) for details.

## Changelog

### v0.8.0 (Current) - Enterprise Edition
- **Enterprise Features**: Breakdown analysis + conditional formatting
- **Advanced Analytics**: Interactive drill-down with smart grouping
- **Production Quality**: 210 tests passing, zero lint errors
- **Enhanced Rendering**: Fixed waterfall visualization issues
- **Clean Architecture**: Modular ES6 with full D3.js compatibility

### v0.6.0
- **Trend Analysis**: Linear, moving average, polynomial overlays
- **Data Loading**: CSV, JSON, TSV with HTTP URL support
- **High-DPI Export**: 2x scaling PNG, SVG, JPEG, PDF
- **Accessibility**: WCAG 2.1 compliance, Forced Colors Mode

For complete version history, see [Releases](https://github.com/coredds/MintWaterfall/releases).
