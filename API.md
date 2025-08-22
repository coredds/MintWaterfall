# MintWaterfall API Documentation

## Overview

MintWaterfall is a production-ready, D3.js-compatible waterfall chart component with comprehensive testing (121 test cases, 57% coverage) that supports both stacked and waterfall visualization modes with smooth animations and extensive customization options.

## Installation & Setup

```javascript
// ES6 Module Import
import { waterfallChart } from './mintwaterfall-chart.js';

// Create chart instance  
const chart = d3.waterfallChart();
```

### Requirements
- D3.js v7+ (peer dependency)
- Modern browser with ES6 module support
- SVG-capable environment

## Quick Start

```javascript
// Enhanced sample data with real-world structure
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

// Create and configure chart with enhanced options
const chart = d3.waterfallChart()
    .width(1100)              // Enhanced width for better visibility
    .height(600)              // Enhanced height
    .showTotal(true)          // Show cumulative total
    .totalLabel("Net Total")  // Custom total label
    .stacked(true)            // Stacked mode
    .duration(750)            // Smooth animations
    .barPadding(0.1)          // Spacing between bars
    .on("barClick", (event, d) => {     // Event handling
        console.log("Clicked:", d.label);
    });

// Apply to SVG selection
d3.select('#chart')
    .datum(data)
    .call(chart);
```

## API Reference

### Configuration Methods

All configuration methods return the chart instance for method chaining. Extensively tested with 121 test cases ensuring robust API reliability.

#### `.width([value])`
- **Type**: `number` - Chart width in pixels
- **Default**: `800`
- **Returns**: Chart instance (setter) or current width (getter)
- **Validation**: Must be positive number > 0

```javascript
chart.width(600); // Set width to 600px
const currentWidth = chart.width(); // Get current width
```

#### `.height([value])`
- **Type**: `number` - Chart height in pixels  
- **Default**: `400`
- **Returns**: Chart instance (setter) or current height (getter)
- **Validation**: Must be positive number > 0

#### `.margin([value])`
- **Type**: `object` - Margin object with `{top, right, bottom, left}` properties
- **Default**: `{top: 60, right: 80, bottom: 60, left: 80}`
- **Returns**: Chart instance (setter) or current margin (getter)
- **Validation**: All values must be non-negative numbers

```javascript
chart.margin({top: 40, right: 60, bottom: 40, left: 60});
```

#### `.showTotal([value])`
- **Type**: `boolean` - Whether to show cumulative total bar
- **Default**: `false`
- **Returns**: Chart instance (setter) or current showTotal setting (getter)

#### `.totalLabel([value])`
- **Type**: `string` - Label text for total bar
- **Default**: `"Total"`
- **Returns**: Chart instance (setter) or current total label (getter)

#### `.totalColor([value])`
- **Type**: `string` - Color for total bar (CSS color or hex)
- **Default**: `"#95A5A6"`
- **Returns**: Chart instance (setter) or current total color (getter)

#### `.stacked([value])`
- **Type**: `boolean` - Toggle between stacked (true) and waterfall (false) modes
- **Default**: `true`
- **Returns**: Chart instance (setter) or current stacked setting (getter)
- **Note**: Waterfall mode shows cumulative flow, stacked mode shows individual segments

#### `.barPadding([value])`
- **Type**: `number` - Padding between bars as ratio (0-1)
- **Default**: `0.1`
- **Returns**: Chart instance (setter) or current bar padding (getter)
- **Validation**: Must be between 0 and 1

#### `.duration([value])`
- **Type**: `number` - Animation duration in milliseconds
- **Default**: `750`
- **Returns**: Chart instance (setter) or current duration (getter)
- **Validation**: Must be non-negative number

#### `.ease([value])`
- **Type**: `function` - D3 easing function for animations
- **Default**: `d3.easeQuadInOut`
- **Returns**: Chart instance (setter) or current easing function (getter)

```javascript
chart.duration(1000).ease(d3.easeBounce);
chart.ease(d3.easeLinear); // Linear animation
chart.ease(d3.easeElastic); // Elastic bounce effect
```

#### `.formatNumber([value])`
- **Type**: `function` - D3 number formatting function for value labels
- **Default**: `d3.format(".0f")`
- **Returns**: Chart instance (setter) or current number formatter (getter)

```javascript
chart.formatNumber(d3.format(",.2f")); // Two decimal places with commas
chart.formatNumber(d3.format("$,.0f")); // Currency format
chart.formatNumber(d3.format(".1%"));   // Percentage format
```

#### `.theme([value])`
- **Type**: `object` - Theme configuration object for styling
- **Default**: `null`
- **Returns**: Chart instance (setter) or current theme (getter)

### Event Handling & Interactivity

#### `.on(type, listener)`
Register event listeners for chart interactions. Comprehensive event system tested with 121 test cases.

**Available Events:**
- `"barClick"` - Fired when a bar segment is clicked
- `"barMouseover"` - Fired when mouse enters a bar segment  
- `"barMouseout"` - Fired when mouse leaves a bar segment
- `"chartUpdate"` - Fired when chart data or configuration is updated

**Event Data:**
All events receive `(event, data)` parameters where:
- `event`: DOM event object
- `data`: Associated data object for the bar/segment

```javascript
chart.on("barClick", function(event, data) {
    console.log("Bar clicked:", data.label, data.value);
    // Access full data context
    console.log("Stack info:", data.stacks);
})
.on("barMouseover", function(event, data) {
    // Show custom tooltip with rich information
    showTooltip(event, {
        label: data.label,
        value: data.value,
        formattedValue: chart.formatNumber()(data.value)
    });
})
.on("barMouseout", function(event, data) {
    hideTooltip();
})
.on("chartUpdate", function(event, data) {
    console.log("Chart updated with new data");
});
```

## Data Format & Validation

### Data Structure

The chart expects an array of data objects, each representing a category with one or more stack segments. This structure supports both simple single-value bars and complex multi-segment stacks.

```javascript
const data = [
    {
        label: "Category Name",     // Required: string - Display name for this data point
        stacks: [                  // Required: array of stack objects (at least 1)
            {
                value: 100,        // Required: number (positive or negative)
                color: "#3498db",  // Required: string (valid CSS color or hex)
                label: "100"       // Optional: string (custom display label)
            },
            {
                value: -25,        // Negative values for decreases/expenses
                color: "#e74c3c",
                label: "-$25K"
            }
        ]
    },
    {
        label: "Another Category",
        stacks: [
            {
                value: 150,
                color: "#2ecc71",
                label: "Growth: 150"
            }
        ]
    }
];
```

### Data Validation & Error Handling

The chart includes comprehensive data validation (tested with 121 test cases) that automatically handles:

- **Non-array data**: Logs error and renders empty chart
- **Empty data arrays**: Gracefully handles with appropriate messaging
- **Missing required properties**: Warns about missing `label` or `stacks`
- **Invalid data types**: Validates `value` as number, `color` as string
- **Malformed stacks**: Ensures `stacks` is array with valid objects

```javascript
// Valid data examples
const validData = [
    { label: "Revenue", stacks: [{ value: 1000, color: "#3498db" }] },
    { label: "Costs", stacks: [{ value: -200, color: "#e74c3c", label: "-$200" }] }
];

// Invalid data - handled gracefully
const invalidData = [
    { label: "Missing stacks" }, // Warning logged, item skipped
    { stacks: [{ value: 100, color: "#3498db" }] }, // Warning: missing label
    { label: "Bad value", stacks: [{ value: "not-a-number", color: "#3498db" }] } // Error: invalid value type
];
```

## Advanced Examples & Use Cases

### Financial Waterfall Chart

```javascript
const financialData = [
    { label: "Starting Cash", stacks: [{ value: 100000, color: "#2ecc71", label: "$100K" }] },
    { label: "Q1 Revenue", stacks: [{ value: 45000, color: "#3498db", label: "+$45K" }] },
    { label: "Q1 Expenses", stacks: [{ value: -25000, color: "#e74c3c", label: "-$25K" }] },
    { label: "Q2 Revenue", stacks: [{ value: 52000, color: "#3498db", label: "+$52K" }] },
    { label: "Q2 Expenses", stacks: [{ value: -28000, color: "#e74c3c", label: "-$28K" }] }
];

const chart = d3.waterfallChart()
    .width(1200)
    .height(600)
    .showTotal(true)
    .totalLabel("Ending Cash")
    .totalColor("#f39c12")
    .stacked(false)  // Waterfall mode for cumulative flow
    .formatNumber(d3.format("$,.0f"))
    .duration(1000)
    .barPadding(0.15);
```

### Multi-Stack Revenue Analysis

```javascript
const revenueData = [
    {
        label: "Product A",
        stacks: [
            { value: 30000, color: "#3498db", label: "Direct: $30K" },
            { value: 15000, color: "#9b59b6", label: "Channel: $15K" }
        ]
    },
    {
        label: "Product B", 
        stacks: [
            { value: 25000, color: "#3498db", label: "Direct: $25K" },
            { value: 20000, color: "#9b59b6", label: "Channel: $20K" },
            { value: 10000, color: "#1abc9c", label: "Online: $10K" }
        ]
    }
];

const chart = d3.waterfallChart()
    .stacked(true)  // Stacked mode for segment comparison
    .showTotal(true)
    .formatNumber(d3.format("$,.0f"))
    .on("barClick", function(event, data) {
        console.log(`Clicked ${data.label}: ${data.stacks.length} revenue streams`);
    });
```

### Custom Animation & Theming

```javascript
const chart = d3.waterfallChart()
    .duration(1500)
    .ease(d3.easeElastic)
    .formatNumber(d3.format(",.2f"))
    .margin({ top: 80, right: 100, bottom: 80, left: 100 })
    .on("barMouseover", function(event, data) {
        // Rich tooltip with animation
        const tooltip = d3.select("body")
            .append("div")
            .attr("class", "waterfall-tooltip")
            .style("opacity", 0)
            .style("position", "absolute")
            .style("background", "rgba(0,0,0,0.8)")
            .style("color", "white")
            .style("padding", "10px")
            .style("border-radius", "5px")
            .style("pointer-events", "none");
            
        tooltip.html(`
            <strong>${data.label}</strong><br/>
            Total Value: ${chart.formatNumber()(data.totalValue)}<br/>
            Segments: ${data.stacks.length}
        `)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 10) + "px")
        .transition()
        .duration(200)
        .style("opacity", 1);
    })
    .on("barMouseout", function() {
        d3.selectAll(".waterfall-tooltip")
            .transition()
            .duration(200)
            .style("opacity", 0)
            .remove();
    });
```

### Real-Time Data Updates

```javascript
// Initial chart setup
let chart = d3.waterfallChart()
    .width(800)
    .height(400)
    .duration(500)
    .on("chartUpdate", function() {
        console.log("Chart updated with new data");
    });

// Function to update chart with new data
function updateChartData(newData) {
    d3.select('#chart')
        .datum(newData)
        .transition()
        .duration(chart.duration())
        .call(chart);
}
        .style("top", event.pageY + "px")
        .text(data.label + ": " + data.value);
});
```

### Dynamic Updates

```javascript
// Update data
d3.select('#chart')
    .datum(newData)
    .call(chart);

// Change mode
chart.stacked(false);
d3.select('#chart').call(chart);
```

## Browser Support

- Modern browsers with ES6 module support
- D3.js v7+
- SVG support required

## Performance Notes

## Quality & Testing

- **Test Coverage**: 121 comprehensive test cases covering all API methods and edge cases
- **Code Coverage**: 57% code coverage ensuring robust functionality
- **Lint Status**: Zero ESLint warnings or errors (strict code quality)
- **Browser Support**: Modern browsers with ES6 module support
- **Dependencies**: D3.js v7+ (peer dependency)

## Performance Considerations

### Optimization Tips

```javascript
// For large datasets, consider reducing animation duration
const chart = d3.waterfallChart()
    .duration(300)  // Faster animations for better performance
    .ease(d3.easeLinear);  // Simpler easing function

// Batch data updates to avoid excessive re-renders
function batchUpdate(newDataArray) {
    // Process all data changes
    const finalData = newDataArray.reduce((acc, update) => {
        // Apply update logic
        return processUpdate(acc, update);
    }, currentData);
    
    // Single chart update
    d3.select('#chart').datum(finalData).call(chart);
}
```

### Memory Management

```javascript
// Proper cleanup when removing charts
function destroyChart() {
    d3.select('#chart').selectAll("*").remove();
    chart.on("barClick", null)  // Remove event listeners
         .on("barMouseover", null)
         .on("barMouseout", null)
         .on("chartUpdate", null);
}
```

## Development & Integration

### TypeScript Support

While the library is written in ES6 JavaScript, it provides excellent TypeScript integration:

```typescript
interface StackData {
    value: number;
    color: string;
    label?: string;
}

interface ChartData {
    label: string;
    stacks: StackData[];
}

// Usage with proper typing
const data: ChartData[] = [
    {
        label: "Revenue",
        stacks: [{ value: 1000, color: "#3498db", label: "$1K" }]
    }
];
```

### Framework Integration

#### React Integration

```jsx
import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { waterfallChart } from './mintwaterfall-chart.js';

function WaterfallChart({ data, width = 800, height = 400 }) {
    const chartRef = useRef();
    
    useEffect(() => {
        const chart = d3.waterfallChart()
            .width(width)
            .height(height)
            .showTotal(true);
            
        d3.select(chartRef.current)
            .datum(data)
            .call(chart);
            
        return () => {
            d3.select(chartRef.current).selectAll("*").remove();
        };
    }, [data, width, height]);
    
    return <svg ref={chartRef}></svg>;
}
```

#### Vue.js Integration

```vue
<template>
    <svg ref="chartContainer"></svg>
</template>

<script>
import * as d3 from 'd3';
import { waterfallChart } from './mintwaterfall-chart.js';

export default {
    props: ['data', 'width', 'height'],
    mounted() {
        this.renderChart();
    },
    watch: {
        data: 'renderChart'
    },
    methods: {
        renderChart() {
            const chart = d3.waterfallChart()
                .width(this.width || 800)
                .height(this.height || 400);
                
            d3.select(this.$refs.chartContainer)
                .datum(this.data)
                .call(chart);
        }
    }
};
</script>
```

## Troubleshooting

### Common Issues

1. **Chart not rendering**: Ensure D3.js v7+ is loaded and SVG element exists
2. **Animation issues**: Check that duration values are positive numbers
3. **Data not updating**: Use `.datum()` method to bind new data before calling chart
4. **Event handlers not firing**: Verify event names are correct and listeners properly attached

### Debug Mode

```javascript
// Enable detailed logging for debugging
const chart = d3.waterfallChart()
    .on("chartUpdate", function(event, data) {
        console.log("Chart update:", data);
        console.log("Current config:", {
            width: chart.width(),
            height: chart.height(),
            stacked: chart.stacked(),
            showTotal: chart.showTotal()
        });
    });
```

### Validation Helpers

```javascript
// Helper function to validate data structure
function validateChartData(data) {
    if (!Array.isArray(data)) {
        console.error("Data must be an array");
        return false;
    }
    
    return data.every((item, index) => {
        if (!item.label || typeof item.label !== 'string') {
            console.warn(`Item ${index}: missing or invalid label`);
            return false;
        }
        
        if (!Array.isArray(item.stacks) || item.stacks.length === 0) {
            console.warn(`Item ${index}: missing or empty stacks array`);
            return false;
        }
        
        return item.stacks.every((stack, stackIndex) => {
            if (typeof stack.value !== 'number') {
                console.warn(`Item ${index}, Stack ${stackIndex}: value must be a number`);
                return false;
            }
            
            if (!stack.color || typeof stack.color !== 'string') {
                console.warn(`Item ${index}, Stack ${stackIndex}: missing or invalid color`);
                return false;
            }
            
            return true;
        });
    });
}

// Usage
if (validateChartData(myData)) {
    d3.select('#chart').datum(myData).call(chart);
} else {
    console.error("Data validation failed");
}
```

---

*This documentation reflects MintWaterfall v0.5.5 with comprehensive testing coverage and professional CI/CD pipeline.*
