# MintWaterfall API Documentation

## Overview

MintWaterfall is a D3.js-compatible waterfall chart component that supports both stacked and waterfall visualization modes with smooth animations and extensive customization options.

## Installation

```javascript
// ES6 Module Import
import { waterfallChart } from './mintwaterfall-chart.js';

// Create chart instance
const chart = d3.waterfallChart();
```

## Basic Usage

```javascript
// Sample data
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

// Create and configure chart
const chart = d3.waterfallChart()
    .width(800)
    .height(400)
    .showTotal(true)
    .stacked(true);

// Apply to SVG selection
d3.select('#chart')
    .datum(data)
    .call(chart);
```

## API Reference

### Configuration Methods

All configuration methods return the chart instance for method chaining.

#### `.width([value])`
- **value**: `number` - Chart width in pixels
- **Default**: `800`
- **Returns**: Chart instance or current width

```javascript
chart.width(600); // Set width to 600px
const currentWidth = chart.width(); // Get current width
```

#### `.height([value])`
- **value**: `number` - Chart height in pixels  
- **Default**: `400`
- **Returns**: Chart instance or current height

#### `.margin([value])`
- **value**: `object` - Margin object with `{top, right, bottom, left}` properties
- **Default**: `{top: 60, right: 80, bottom: 60, left: 80}`
- **Returns**: Chart instance or current margin

```javascript
chart.margin({top: 40, right: 60, bottom: 40, left: 60});
```

#### `.showTotal([value])`
- **value**: `boolean` - Whether to show total bar
- **Default**: `false`
- **Returns**: Chart instance or current showTotal setting

#### `.totalLabel([value])`
- **value**: `string` - Label text for total bar
- **Default**: `"Total"`
- **Returns**: Chart instance or current total label

#### `.totalColor([value])`
- **value**: `string` - Color for total bar
- **Default**: `"#95A5A6"`
- **Returns**: Chart instance or current total color

#### `.stacked([value])`
- **value**: `boolean` - Toggle between stacked (true) and waterfall (false) modes
- **Default**: `true`
- **Returns**: Chart instance or current stacked setting

#### `.barPadding([value])`
- **value**: `number` - Padding between bars (0-1)
- **Default**: `0.1`
- **Returns**: Chart instance or current bar padding

#### `.duration([value])`
- **value**: `number` - Animation duration in milliseconds
- **Default**: `750`
- **Returns**: Chart instance or current duration

#### `.ease([value])`
- **value**: `function` - D3 easing function
- **Default**: `d3.easeQuadInOut`
- **Returns**: Chart instance or current easing function

```javascript
chart.duration(1000).ease(d3.easeBounce);
```

#### `.formatNumber([value])`
- **value**: `function` - D3 number formatting function
- **Default**: `d3.format(".0f")`
- **Returns**: Chart instance or current number formatter

```javascript
chart.formatNumber(d3.format(",.2f")); // Two decimal places with commas
chart.formatNumber(d3.format("$,.0f")); // Currency format
```

#### `.theme([value])`
- **value**: `object` - Theme configuration object
- **Default**: `null`
- **Returns**: Chart instance or current theme

### Event Handling

#### `.on(type, listener)`
Register event listeners for chart interactions.

**Available Events:**
- `"barClick"` - Fired when a bar is clicked
- `"barMouseover"` - Fired when mouse enters a bar
- `"barMouseout"` - Fired when mouse leaves a bar
- `"chartUpdate"` - Fired when chart is updated

```javascript
chart.on("barClick", function(event, data) {
    console.log("Bar clicked:", data);
})
.on("barMouseover", function(event, data) {
    // Show custom tooltip
    showTooltip(event, data);
})
.on("barMouseout", function(event, data) {
    // Hide tooltip
    hideTooltip();
});
```

## Data Format

### Data Structure

```javascript
const data = [
    {
        label: "Category Name",     // Required: string
        stacks: [                  // Required: array of stack objects
            {
                value: 100,        // Required: number (can be negative)
                color: "#3498db",  // Required: string (CSS color)
                label: "100"       // Optional: string (display label)
            }
        ]
    }
];
```

### Data Validation

The chart automatically validates data and logs warnings/errors for:
- Non-array data
- Empty data arrays
- Missing required properties
- Invalid data types

## Examples

### Currency Formatting

```javascript
const chart = d3.waterfallChart()
    .formatNumber(d3.format("$,.0f"))
    .totalLabel("Total Revenue");
```

### Custom Animation

```javascript
const chart = d3.waterfallChart()
    .duration(1200)
    .ease(d3.easeElastic);
```

### Event Handling with Tooltips

```javascript
chart.on("barMouseover", function(event, data) {
    d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("left", event.pageX + "px")
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

- Efficient for datasets up to 100-200 data points
- Uses D3's enter/update/exit pattern for optimal DOM updates
- Hardware-accelerated CSS transitions for smooth animations
- Automatic cleanup of removed elements

## Troubleshooting

### Common Issues

1. **Chart not rendering**: Check that D3.js is loaded and data format is correct
2. **Animation not smooth**: Reduce duration or use simpler easing function
3. **Data not updating**: Ensure you're calling the chart on the selection after data changes
4. **Performance issues**: Consider reducing animation duration or bar count

### Debug Mode

Enable console warnings for data validation:

```javascript
// The chart automatically logs warnings for invalid data
// Check browser console for validation messages
```
