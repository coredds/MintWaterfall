# MintWaterfall Hierarchical Layouts

This document provides information about the hierarchical layout features in MintWaterfall, which implement D3.js hierarchy, treemap, partition, and other layout algorithms.

## Overview

MintWaterfall now includes comprehensive support for hierarchical data visualization through the following components:

1. **Hierarchical Layout System** - Core layout engine that powers all hierarchical visualizations
2. **Treemap Chart** - Space-efficient visualization for hierarchical data using nested rectangles
3. **Partition Chart** - Hierarchical breakdown visualization in rectangular (icicle) or radial (sunburst) form
4. **Hierarchy Utilities** - Helper functions for working with hierarchical data

These components enable advanced breakdown visualizations as described in the D3_POWERBI_ASSESSMENT.md document.

## Installation

The hierarchical layout features are included in the main MintWaterfall package. No additional installation is required.

## Basic Usage

### Treemap Chart

```javascript
// Create a treemap chart
const treemap = d3.treemapChart()
    .width(800)
    .height(400)
    .padding(1)
    .valueField("value");

// Apply to selection with hierarchical data
d3.select("#chart")
    .datum(hierarchicalData)
    .call(treemap);
```

### Partition Chart (Icicle)

```javascript
// Create a partition chart (icicle layout)
const partition = d3.partitionChart()
    .width(800)
    .height(400)
    .orientation("horizontal")
    .padding(1)
    .valueField("value");

// Apply to selection with hierarchical data
d3.select("#chart")
    .datum(hierarchicalData)
    .call(partition);
```

### Sunburst Chart

```javascript
// Create a sunburst chart (radial partition)
const sunburst = d3.sunburstChart()
    .width(800)
    .height(400)
    .valueField("value");

// Apply to selection with hierarchical data
d3.select("#chart")
    .datum(hierarchicalData)
    .call(sunburst);
```

## Data Format

The hierarchical layout components accept data in two formats:

### Hierarchical JSON Format

```javascript
const hierarchicalData = {
    name: "Root",
    children: [
        {
            name: "Group A",
            children: [
                { name: "Item 1", value: 100 },
                { name: "Item 2", value: 150 }
            ]
        },
        {
            name: "Group B",
            children: [
                { name: "Item 3", value: 200 },
                { name: "Item 4", value: 120 }
            ]
        }
    ]
};
```

### Flat Array Format (with parent references)

```javascript
const flatData = [
    { id: "root", name: "Root", parent: null },
    { id: "groupA", name: "Group A", parent: "root" },
    { id: "groupB", name: "Group B", parent: "root" },
    { id: "item1", name: "Item 1", parent: "groupA", value: 100 },
    { id: "item2", name: "Item 2", parent: "groupA", value: 150 },
    { id: "item3", name: "Item 3", parent: "groupB", value: 200 },
    { id: "item4", name: "Item 4", parent: "groupB", value: 120 }
];
```

When using flat data, you need to specify the field names:

```javascript
const treemap = d3.treemapChart()
    .idField("id")
    .parentField("parent")
    .valueField("value")
    .labelField("name");
```

## Advanced Usage

### Hierarchical Layout System

For more control over the layout process, you can use the hierarchical layout system directly:

```javascript
import { createHierarchicalLayout, createHierarchy } from "mintwaterfall";

// Create a hierarchical layout
const layout = createHierarchicalLayout()
    .size([800, 400])
    .padding(5)
    .type("treemap"); // or "partition", "pack"

// Create a hierarchy from data
const hierarchy = createHierarchy(data, {
    idAccessor: d => d.id,
    parentAccessor: d => d.parent,
    valueAccessor: d => d.value
});

// Apply layout
const layoutData = layout(hierarchy);
```

### Converting to Waterfall Format

You can convert hierarchical layout data to waterfall chart format:

```javascript
import { convertToWaterfallFormat } from "mintwaterfall";

const waterfallData = convertToWaterfallFormat(layoutData, {
    includeInternal: true,
    maxDepth: 2,
    colorScale: d3.scaleOrdinal(d3.schemeCategory10)
});

// Use with waterfall chart
const waterfall = d3.waterfallChart();
d3.select("#chart")
    .datum(waterfallData)
    .call(waterfall);
```

## API Reference

### Treemap Chart

| Method | Description | Default |
|--------|-------------|---------|
| `width(value)` | Chart width | 800 |
| `height(value)` | Chart height | 400 |
| `margin(object)` | Chart margins | `{ top: 40, right: 10, bottom: 10, left: 10 }` |
| `padding(value)` | Cell padding | 1 |
| `paddingInner(value)` | Inner padding between cells | 0 |
| `paddingOuter(value)` | Outer padding | 0 |
| `paddingTop(value)` | Top padding for labels | 20 |
| `paddingRight(value)` | Right padding | 0 |
| `paddingBottom(value)` | Bottom padding | 0 |
| `paddingLeft(value)` | Left padding | 0 |
| `round(value)` | Round to exact pixels | false |
| `ratio(value)` | Desired aspect ratio | 1.618033988749895 (golden ratio) |
| `valueField(value)` | Field name for values | "value" |
| `labelField(value)` | Field name for labels | "name" |
| `idField(value)` | Field name for IDs | "id" |
| `parentField(value)` | Field name for parent IDs | "parent" |
| `colorScale(scale)` | D3 color scale | d3.scaleOrdinal(d3.schemeCategory10) |
| `maxDepth(value)` | Maximum depth to display | Infinity |
| `showLabels(value)` | Show cell labels | true |
| `labelMinSize(value)` | Minimum cell size to show labels | 10 |

### Partition Chart

| Method | Description | Default |
|--------|-------------|---------|
| `width(value)` | Chart width | 800 |
| `height(value)` | Chart height | 400 |
| `margin(object)` | Chart margins | `{ top: 20, right: 20, bottom: 20, left: 20 }` |
| `padding(value)` | Cell padding | 1 |
| `orientation(value)` | Layout orientation | "horizontal" (also "vertical" or "radial") |
| `cornerRadius(value)` | Corner radius for cells | 0 |
| `valueField(value)` | Field name for values | "value" |
| `labelField(value)` | Field name for labels | "name" |
| `idField(value)` | Field name for IDs | "id" |
| `parentField(value)` | Field name for parent IDs | "parent" |
| `colorScale(scale)` | D3 color scale | d3.scaleOrdinal(d3.schemeCategory10) |
| `maxDepth(value)` | Maximum depth to display | Infinity |
| `showLabels(value)` | Show cell labels | true |
| `labelMinSize(value)` | Minimum cell size to show labels | 10 |
| `arcPadding(value)` | Arc padding for radial layout | 0.005 |
| `startAngle(value)` | Start angle for radial layout | 0 |
| `endAngle(value)` | End angle for radial layout | 2 * Math.PI |

### Hierarchical Layout System

| Method | Description | Default |
|--------|-------------|---------|
| `size([width, height])` | Layout size | [800, 400] |
| `padding(value)` | Cell padding | 0 |
| `round(value)` | Round to exact pixels | false |
| `type(value)` | Layout type | "treemap" (also "partition", "pack", "cluster", "tree") |
| `paddingInner(value)` | Inner padding | 0 |
| `paddingOuter(value)` | Outer padding | 0 |
| `paddingTop(value)` | Top padding | 0 |
| `paddingRight(value)` | Right padding | 0 |
| `paddingBottom(value)` | Bottom padding | 0 |
| `paddingLeft(value)` | Left padding | 0 |
| `ratio(value)` | Desired aspect ratio | 1.618033988749895 (golden ratio) |
| `partitionOrientation(value)` | Orientation for partition | "horizontal" (also "vertical") |
| `nodeSize(value)` | Node size for tree/cluster | null |
| `separation(value)` | Node separation function | null |

## Examples

See `mintwaterfall-hierarchy-example.html` for a complete example of using the hierarchical layout components.

## Integration with Waterfall Charts

The hierarchical layouts can be integrated with waterfall charts to create advanced breakdown visualizations:

```javascript
// Create hierarchical data
const hierarchyData = createHierarchy(data);

// Apply treemap layout
const layoutData = hierarchyLayouts.treemap(hierarchyData);

// Convert to waterfall format
const waterfallData = convertToWaterfallFormat(layoutData);

// Create waterfall chart with breakdown
const waterfall = d3.waterfallChart()
    .enableBreakdown("category", {
        minGroupSize: 2,
        sortStrategy: "value",
        showOthers: true
    });

// Render chart
d3.select("#chart")
    .datum(waterfallData)
    .call(waterfall);
```

## Accessibility Features

All hierarchical layout components include the following accessibility features:

- ARIA attributes for screen readers
- Keyboard navigation
- High contrast mode support
- Reduced motion support
- Screen reader announcements

## Browser Support

The hierarchical layout components support all modern browsers:

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Internet Explorer 11 (with polyfills)
