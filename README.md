# MintWaterfall

[![CI](https://github.com/coredds/MintWaterfall/actions/workflows/basic-checks.yml/badge.svg?branch=main)](https://github.com/coredds/MintWaterfall/actions/workflows/basic-checks.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A powerful, D3.js-compatible waterfall chart component with stacking capabilities.

## Features

- **D3.js Compatible**: Full integration with D3.js ecosystem
- **Stacked & Waterfall Modes**: Toggle between visualization types
- **Smooth Animations**: Configurable transitions and easing
- **Interactive Controls**: Dynamic data updates and mode switching
- **Responsive Design**: Adapts to different screen sizes
- **Method Chaining**: Fluent API for easy configuration

## Quick Start

```html
<!DOCTYPE html>
<html>
<head>
    <script src="https://d3js.org/d3.v7.min.js"></script>
</head>
<body>
    <svg id="chart" width="800" height="400"></svg>
    
    <script type="module">
        import { waterfallChart } from './mintwaterfall-chart.js';
        
        const data = [
            {
                label: "Q1 Sales",
                stacks: [
                    { value: 45, color: "#3498db", label: "45" },
                    { value: 25, color: "#2ecc71", label: "25" }
                ]
            },
            {
                label: "Q2 Growth",
                stacks: [
                    { value: 30, color: "#e74c3c", label: "30" }
                ]
            }
        ];
        
        const chart = d3.waterfallChart()
            .width(800)
            .height(400)
            .showTotal(true)
            .stacked(true);
        
        d3.select('#chart')
            .datum(data)
            .call(chart);
    </script>
</body>
</html>
```

## API Reference

### Configuration Methods

- `.width(value)` - Set chart width
- `.height(value)` - Set chart height
- `.showTotal(boolean)` - Show/hide total bar
- `.stacked(boolean)` - Toggle stacked/waterfall mode
- `.duration(ms)` - Animation duration
- `.barPadding(value)` - Space between bars
- `.totalLabel(string)` - Label for total bar
- `.totalColor(color)` - Color for total bar

### Data Format

```javascript
const data = [
    {
        label: "Category Name",
        stacks: [
            { value: 100, color: "#3498db", label: "100" },
            { value: -25, color: "#e74c3c", label: "-25" }
        ]
    }
];
```

## Example

![MintWaterfall Demo](example.png)


## Browser Support

- Modern browsers with ES6 module support
- D3.js v7+
- SVG support required

## License

MIT License - see package.json for details.

## Contributing

MintWaterfall is open to contributions. Please ensure all changes maintain D3.js compatibility and include appropriate examples.

## Roadmap

### Short Term (v1.1 - v1.3)

#### **Enhanced Interactivity**
- **Tooltips**: Rich hover tooltips with formatted values and custom content
- **Click Events**: Configurable click handlers for bars and stacks
- **Brush Selection**: D3 brush integration for zooming and filtering
- **Crossfilter Integration**: Connect with crossfilter.js for linked visualizations

#### **Visual Enhancements**
- **Themes**: Predefined color schemes (corporate, accessibility, dark mode)
- **Gradients**: Support for gradient fills and advanced styling
- **Patterns**: SVG patterns for accessibility and printing
- **Custom Markers**: Configurable markers for special data points

#### **Data & Formatting**
- **Number Formatting**: Internationalization support (currency, percentages, units)
- **Date Axes**: Time-based x-axis with automatic formatting
- **Data Validation**: Built-in data validation and error handling
- **Missing Data**: Graceful handling of null/undefined values

### Medium Term (v1.4 - v1.6)

#### **Advanced Visualizations**
- **Horizontal Mode**: Horizontal waterfall charts
- **Grouped Charts**: Multiple waterfall series side-by-side
- **Subcategory Drilling**: Expandable/collapsible hierarchical data
- **Comparison Mode**: Before/after or variance analysis views

#### **Performance & Scalability**
- **Virtual Scrolling**: Handle thousands of data points efficiently
- **WebGL Rendering**: Optional WebGL backend for large datasets
- **Data Streaming**: Real-time data updates and streaming support
- **Memory Optimization**: Efficient DOM management for large charts

#### **Developer Experience**
- **TypeScript Definitions**: Full TypeScript support with type definitions
- **React Wrapper**: React component wrapper for easy integration
- **Vue/Angular Support**: Framework-specific bindings
- **CDN Distribution**: NPM package and CDN availability

### Long Term (v2.0+)

#### **Advanced Analytics**
- **Statistical Overlays**: Trend lines, confidence intervals, forecasting
- **Annotations**: Rich text annotations with arrows and callouts
- **Variance Analysis**: Automatic variance detection and highlighting
- **Goal Lines**: Target/benchmark line overlays

#### **Enterprise Features**
- **Export Options**: PNG, SVG, PDF export with custom styling
- **Print Optimization**: Print-friendly layouts and styling
- **Accessibility**: Full WCAG 2.1 AA compliance
- **Multi-language**: RTL support and internationalization

#### **Integration Ecosystem**
- **Observable Integration**: Observable notebook compatibility
- **Jupyter Support**: Python wrapper for Jupyter notebooks
- **BI Tool Plugins**: Tableau, Power BI, Qlik integration
- **Database Connectors**: Direct database query support

### Technical Improvements

#### **API Enhancements**
- **Plugin System**: Extensible plugin architecture
- **Event System**: Comprehensive event handling (zoom, pan, select)
- **Configuration Validation**: Runtime configuration validation
- **Performance Monitoring**: Built-in performance metrics

#### **Testing & Quality**
- **Unit Tests**: Comprehensive test suite with Jest/Vitest
- **Visual Regression**: Automated visual testing
- **Browser Testing**: Cross-browser compatibility testing
- **Performance Benchmarks**: Automated performance testing

#### **Documentation & Examples**
- **Interactive Docs**: Live code examples and playground
- **Video Tutorials**: Step-by-step implementation guides
- **Use Case Gallery**: Real-world implementation examples
- **Migration Guides**: Version upgrade documentation

### Data Integration

#### **Data Sources**
- **CSV/JSON Import**: Direct file import capabilities
- **API Integration**: REST API data fetching
- **Real-time Data**: WebSocket and SSE support
- **Database Integration**: SQL query builders

#### **Data Processing**
- **Aggregation Functions**: Built-in data aggregation
- **Filtering**: Advanced filtering and search capabilities
- **Sorting**: Multi-level sorting options
- **Transformations**: Data transformation pipelines

### Design System

#### **Customization**
- **CSS Variables**: Full CSS custom property support
- **Design Tokens**: Systematic design token implementation
- **Brand Integration**: Easy brand color and font integration
- **Component Variants**: Pre-built chart variations

---

### **Priority Matrix**

| Feature | Impact | Effort | Priority |
|---------|--------|--------|----------|
| Tooltips | High | Low | Critical |
| TypeScript | High | Medium | Critical |
| Themes | Medium | Low | High |
| Horizontal Mode | Medium | Medium | High |
| Export Options | High | High | Medium |
| Real-time Data | High | High | Medium |

### **Community Contributions Welcome**

We especially welcome contributions in these areas:
- **Design**: New themes and visual enhancements
- **Testing**: Unit tests and browser compatibility
- **Documentation**: Examples and tutorials
- **Accessibility**: ARIA labels and screen reader support
- **Integrations**: Framework wrappers and plugins

---

*Want to contribute? Check our [API Compatibility Guide](mintwaterfall-api-compatibility.md) and start with a small feature or bug fix!*
