# MintWaterfall

[![CI](https://github.com/coredds/MintWaterfall/actions/workflows/basic-checks.yml/badge.svg?branch=main)](https://github.com/coredds/MintWaterfall/actions/workflows/basic-checks.yml)
[![Security Audit](https://github.com/coredds/MintWaterfall/actions/workflows/security.yml/badge.svg)](https://github.com/coredds/MintWaterfall/actions/workflows/security.yml)
[![Pages Deploy](https://github.com/coredds/MintWaterfall/actions/workflows/pages.yml/badge.svg)](https://github.com/coredds/MintWaterfall/actions/workflows/pages.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-0.5.5-blue.svg)](https://github.com/coredds/MintWaterfall/releases)
[![codecov](https://codecov.io/gh/coredds/MintWaterfall/branch/main/graph/badge.svg)](https://codecov.io/gh/coredds/MintWaterfall)

A powerful, production-ready D3.js-compatible waterfall chart component with comprehensive testing and automated CI/CD.

**[Live Demo](https://coredds.github.io/MintWaterfall/mintwaterfall-example.html)** - Try it out!

## Features

- **Production Ready**: 121 comprehensive tests with 57% code coverage
- **Automated CI/CD**: Full GitHub Actions pipeline with testing, security audits, and auto-deployment
- **D3.js Compatible**: Full integration with D3.js v7+ ecosystem
- **Dual Modes**: Toggle between stacked and waterfall visualizations
- **Smooth Animations**: Configurable transitions with custom easing functions
- **Interactive Controls**: Dynamic data updates and real-time mode switching
- **Responsive Design**: Adapts to different screen sizes and containers
- **Method Chaining**: Fluent API for intuitive configuration
- **Robust Validation**: Comprehensive data validation and error handling
- **Advanced Features**: Themes, custom formatting, event handling

## Quality & Testing

- **121 Test Cases**: Comprehensive test suite covering all major functionality
- **57% Code Coverage**: High-quality test coverage with ongoing improvements  
- **Zero Lint Issues**: Clean, maintainable code following best practices
- **Security Audits**: Automated dependency vulnerability scanning
- **Continuous Deployment**: Auto-deployment to GitHub Pages on updates

## Installation & Usage

### Browser (ES6 Modules)

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

### Node.js / NPM (Future Release)

```bash
npm install mintwaterfall
```

```javascript
import { waterfallChart } from 'mintwaterfall';
// or
const { waterfallChart } = require('mintwaterfall');
```

## Quick Start Example

```javascript
import { waterfallChart } from './mintwaterfall-chart.js';

const data = [
    {
        label: "Q1 Revenue",
        stacks: [
            { value: 45000, color: "#3498db", label: "$45K" },
            { value: 25000, color: "#2ecc71", label: "$25K" }
        ]
    },
    {
        label: "Q2 Growth", 
        stacks: [
            { value: 30000, color: "#f39c12", label: "$30K" }
        ]
    },
    {
        label: "Expenses",
        stacks: [
            { value: -15000, color: "#e74c3c", label: "-$15K" }
        ]
    }
];

const chart = d3.waterfallChart()
    .width(1100)
    .height(600)
    .showTotal(true)
    .totalLabel("Net Total")
    .stacked(true)
    .on("barClick", (event, d) => {
        console.log("Clicked bar:", d.label);
    });

d3.select('#chart')
    .datum(data)
    .call(chart);
```

## API Reference

### Core Configuration Methods

- `.width(value)` - Set chart width (default: 800)
- `.height(value)` - Set chart height (default: 400)  
- `.margin(object)` - Set margins `{top, right, bottom, left}` (default: 60, 80, 60, 80)
- `.showTotal(boolean)` - Show/hide total bar (default: false)
- `.stacked(boolean)` - Toggle stacked/waterfall mode (default: true)

### Styling & Animation

- `.duration(ms)` - Animation duration in milliseconds (default: 750)
- `.ease(function)` - D3 easing function (default: d3.easeQuadInOut)
- `.barPadding(value)` - Space between bars (default: 0.1)
- `.totalLabel(string)` - Label for total bar (default: "Total")
- `.totalColor(color)` - Color for total bar (default: "#95A5A6")
- `.theme(object)` - Apply theme object with colors and styles
- `.formatNumber(function)` - Number formatting function (default: d3.format(".0f"))

### Event Handling

- `.on(eventType, handler)` - Register event listeners
  - `"barClick"` - Bar click events
  - `"barMouseover"` - Bar hover events  
  - `"barMouseout"` - Bar leave events
  - `"chartUpdate"` - Chart update events

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

[![MintWaterfall Demo](example.png)](https://coredds.github.io/MintWaterfall/mintwaterfall-example.html)


## Development & Contributing

### Setup Development Environment

```bash
git clone https://github.com/coredds/MintWaterfall.git
cd MintWaterfall
npm install
```

### Available Scripts

```bash
npm test              # Run comprehensive test suite (121 tests)
npm run lint          # Run ESLint code quality checks  
npm run lint --fix    # Auto-fix lint issues
```

### Testing & Quality

- **Comprehensive Testing**: 121 test cases covering all major functionality
- **Code Coverage**: 57% coverage with detailed reporting
- **Automated CI**: GitHub Actions run tests on Node.js 18.x and 20.x
- **Security Audits**: Weekly automated dependency vulnerability scans
- **Zero Lint Issues**: Clean, maintainable code following best practices

### CI/CD Pipeline

Our GitHub Actions workflow includes:
- **Continuous Integration**: Automated testing and linting
- **Code Coverage**: Automated coverage reporting to Codecov
- **Security Audits**: Weekly dependency vulnerability scanning  
- **Auto-Deployment**: GitHub Pages updates on every push to main
- **Auto-Tagging**: Automatic git tags when package.json version changes
- **Release Automation**: Automated releases with changelog generation

## Browser Support & Requirements

### Minimum Requirements
- **ES6 Modules**: Modern browsers with import/export support
- **D3.js v7+**: Required peer dependency
- **SVG Support**: For chart rendering

### Tested Browsers
- **Chrome 90+** (Supported)
- **Firefox 88+** (Supported)  
- **Safari 14+** (Supported)
- **Edge 90+** (Supported)

### Performance
- **Small Bundle**: Lightweight ES6 modules
- **Efficient Rendering**: Optimized D3.js integration
- **Smooth Animations**: Hardware-accelerated CSS transitions

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Contributing

MintWaterfall welcomes contributions! Please ensure all changes:

- Maintain D3.js compatibility
- Include appropriate tests (we have 121+ test cases)
- Pass all linting checks (zero tolerance for lint issues)
- Include documentation updates
- Follow the existing code style

See our [Contributing Guide](CONTRIBUTING.md) for detailed guidelines.

## Changelog & Releases

### v0.5.5 (Current)
- **121 comprehensive test cases** with 57% code coverage
- **Enhanced functionality**: Fixed normalize/bounce buttons, improved UI/UX
- **Better visuals**: 1100px wide charts, centered layouts, visual feedback system
- **Complete CI/CD pipeline**: Automated testing, security audits, deployment
- **Code quality**: Zero lint issues, professional codebase
- **Documentation**: Updated README, API docs, and examples

For detailed version history, see [Releases](https://github.com/coredds/MintWaterfall/releases).
