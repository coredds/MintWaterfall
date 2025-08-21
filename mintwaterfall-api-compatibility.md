# MintWaterfall - D3.js API Compatibility Guide

This document outlines the conversion from the original waterfall chart implementation to a D3.js-compatible MintWaterfall component.

## Key API Changes

### 1. Constructor Pattern → Factory Function with Method Chaining

**Original:**
```javascript
// Constructor-based instantiation
new StackedWaterfallChart(svg, data, options)
```

**D3.js Compatible:**
```javascript
// MintWaterfall factory function with chainable methods
const chart = d3.waterfallChart()
    .width(800)
    .height(400)
    .showTotal(true)
    .stacked(true);

// Apply to selection
d3.select('#chart').datum(data).call(chart);
```

### 2. Data Binding and Selections

**Original:**
```javascript
// Direct DOM manipulation
const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
rect.setAttribute('x', x.toString());
rect.setAttribute('fill', color);
```

**D3.js Compatible:**
```javascript
// Data-driven selections
const bars = container.selectAll('.bar')
    .data(processedData)
    .enter()
    .append('rect')
    .attr('x', d => xScale(d.label))
    .attr('fill', d => d.color);
```

### 3. Scaling Systems

**Original:**
```javascript
// Manual scaling calculations
const yScale = (value) => {
    return this.height - this.margin.bottom - (value / max) * chartHeight;
};
```

**D3.js Compatible:**
```javascript
// D3 scale functions
const yScale = d3.scaleLinear()
    .domain([0, maxValue])
    .range([height - margin.bottom, margin.top]);

const xScale = d3.scaleBand()
    .domain(data.map(d => d.label))
    .range([margin.left, width - margin.right])
    .padding(0.1);
```

### 4. Axis Generation

**Original:**
```javascript
// Manual axis drawing
drawGrid(maxValue) {
    for (let i = 0; i <= numLines; i++) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        // ... manual line creation
    }
}
```

**D3.js Compatible:**
```javascript
// D3 axis generators
const xAxis = d3.axisBottom(xScale);
const yAxis = d3.axisLeft(yScale);

svg.append('g')
    .attr('transform', `translate(0,${height - margin.bottom})`)
    .call(xAxis);
```

### 5. Animation and Transitions

**Original:**
```javascript
// No built-in animation support
// Would require custom implementation
```

**D3.js Compatible:**
```javascript
// Built-in transition support
bars.transition()
    .duration(750)
    .ease(d3.easeQuadInOut)
    .attr('height', d => yScale(d.value))
    .attr('y', d => yScale(d.value));
```

### 6. Enter/Update/Exit Pattern

**Original:**
```javascript
// No built-in data update pattern
// Would require manual DOM manipulation for updates
```

**D3.js Compatible:**
```javascript
// Automatic enter/update/exit handling
const bars = container.selectAll('.bar').data(newData);

// Enter
bars.enter().append('rect').attr('class', 'bar');

// Update
bars.transition().attr('height', d => yScale(d.value));

// Exit
bars.exit().remove();
```

## New Features Enabled by D3.js

### 1. **Smooth Transitions**
- Animated data updates
- Configurable duration and easing
- Staggered animations

### 2. **Interactive Events**
```javascript
bars.on('mouseover', function(event, d) {
    d3.select(this).attr('opacity', 0.7);
    // Show tooltip
})
.on('mouseout', function(event, d) {
    d3.select(this).attr('opacity', 1);
    // Hide tooltip
});
```

### 3. **Dynamic Data Updates**
```javascript
// Easy data updates with automatic transitions
chart.data(newData);
selection.datum(newData).call(chart);
```

### 4. **Responsive Design**
```javascript
// Easy responsive updates
chart.width(newWidth).height(newHeight);
selection.call(chart);
```

### 5. **Composable Architecture**
```javascript
// Can be combined with other D3.js components
const brush = d3.brush().on('end', updateChart);
const zoom = d3.zoom().on('zoom', handleZoom);
```

## Usage Examples

### Basic Usage
```javascript
// Create chart
const chart = d3.waterfallChart()
    .width(800)
    .height(400)
    .showTotal(true);

// Apply to selection
d3.select('#chart')
    .datum(data)
    .call(chart);
```

### Dynamic Updates
```javascript
// Update data with animation
d3.select('#chart')
    .datum(newData)
    .call(chart);
```

### Configuration Changes
```javascript
// Toggle between stacked and waterfall modes
chart.stacked(false);
d3.select('#chart').call(chart);

// Adjust animation timing
chart.duration(1000).ease(d3.easeBounce);
d3.select('#chart').call(chart);
```

## Performance Benefits

1. **Efficient Updates**: Only changes what's necessary using D3's diff algorithm
2. **Optimized Animations**: Hardware-accelerated CSS transitions
3. **Memory Management**: Automatic cleanup of removed elements
4. **Scalability**: Better performance with large datasets

## API Compatibility Matrix

| Feature | Original | D3.js Version | Status |
|---------|----------|---------------|---------|
| Basic waterfall logic | ✅ | ✅ | ✅ Compatible |
| Stacked bars | ✅ | ✅ | ✅ Compatible |
| Total bar option | ✅ | ✅ | ✅ Compatible |
| Custom colors | ✅ | ✅ | ✅ Compatible |
| Connector lines | ✅ | ✅ | ✅ Compatible |
| Value labels | ✅ | ✅ | ✅ Compatible |
| Responsive sizing | ⚠️ Manual | ✅ | ✅ Enhanced |
| Animations | ❌ | ✅ | ✅ New feature |
| Data updates | ⚠️ Manual | ✅ | ✅ Enhanced |
| Event handling | ⚠️ Manual | ✅ | ✅ Enhanced |
| Method chaining | ❌ | ✅ | ✅ New feature |
| Scale management | ⚠️ Manual | ✅ | ✅ Enhanced |

## Migration Guide

1. **Replace constructor calls** with factory function and method chaining
2. **Update data format** (if needed) - current format is compatible
3. **Replace direct SVG manipulation** with D3 selections
4. **Add D3.js dependency** to your project
5. **Update styling** to use D3 class conventions
6. **Take advantage of new features** like animations and interactive events

The D3.js MintWaterfall version maintains full API compatibility while adding powerful new capabilities for animation, interactivity, and data updates.
