# TypeScript Support for MintWaterfall

MintWaterfall provides comprehensive TypeScript definitions for type-safe development. This document covers TypeScript usage, type definitions, and best practices.

## Installation & Setup

### Direct Usage
```typescript
import { waterfallChart, ChartData, WaterfallChart } from 'mintwaterfall';
```

## Type Definitions Overview

### Core Data Types

#### `StackData`
Individual stack segment within a data item:
```typescript
interface StackData {
  value: number;        // Numeric value (positive or negative)
  color: string;        // CSS color string or hex color
  label?: string;       // Optional display label
}
```

#### `ChartData`
Main data item representing a category:
```typescript
interface ChartData {
  label: string;        // Display label for this category
  stacks: StackData[];  // Array of stack segments (min 1)
}
```

#### `ProcessedData`
Enhanced data with calculated values (used in event handlers):
```typescript
interface ProcessedData extends ChartData {
  cumulative: number;   // Cumulative value up to this point
  totalValue: number;   // Total value of all stacks
  index: number;        // Index position in dataset
}
```

### Configuration Types

#### `MarginConfig`
```typescript
interface MarginConfig {
  top: number;
  right: number;
  bottom: number;
  left: number;
}
```

#### `ThemeConfig`
```typescript
interface ThemeConfig {
  name: string;
  background: string;
  gridColor: string;
  axisColor: string;
  textColor: string;
  totalColor: string;
  colors: string[];
}
```

#### `BrushConfig`
```typescript
interface BrushConfig {
  type?: 'x' | 'y' | 'xy';
  extent?: [[number, number], [number, number]];
  className?: string;
  styles?: {
    selection?: { fill?: string; stroke?: string; };
    handle?: { fill?: string; stroke?: string; };
  };
}
```

## Basic Usage

### Creating Type-Safe Data
```typescript
import { ChartData, StackData } from 'mintwaterfall';

const data: ChartData[] = [
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
  }
];
```

### Creating a Chart
```typescript
import { waterfallChart, WaterfallChart } from 'mintwaterfall';
import * as d3 from 'd3';

const chart: WaterfallChart = waterfallChart()
  .width(800)
  .height(400)
  .showTotal(true)
  .stacked(true)
  .duration(750)
  .ease(d3.easeQuadInOut);
```

### Event Handlers
```typescript
import { ProcessedData, BarEventHandler } from 'mintwaterfall';

// Type-safe event handlers
const handleBarClick: BarEventHandler = (event, data) => {
  console.log(`Clicked: ${data.label}`);
  console.log(`Value: ${data.totalValue}`);
  console.log(`Stacks: ${data.stacks.length}`);
};

chart.on('barClick', handleBarClick);

// Inline handlers with full type safety
chart.on('barMouseover', (event: Event, data: ProcessedData) => {
  // TypeScript knows data is ProcessedData
  const tooltip = `${data.label}: ${data.totalValue}`;
  showTooltip(tooltip);
});
```

## Advanced Usage

### Theme Configuration
```typescript
import { ThemeConfig, themes, applyTheme } from 'mintwaterfall';

// Use predefined theme
applyTheme(chart, 'dark');

// Create custom theme
const customTheme: ThemeConfig = {
  name: "Custom",
  background: "#ffffff",
  gridColor: "#f0f0f0",
  axisColor: "#666666",
  textColor: "#333333",
  totalColor: "#95A5A6",
  colors: ["#3498db", "#2ecc71", "#e74c3c"]
};

chart.theme(customTheme);
```

### Brush Configuration
```typescript
import { BrushConfig } from 'mintwaterfall';

const brushConfig: BrushConfig = {
  type: 'x',
  extent: [[0, 0], [800, 400]],
  styles: {
    selection: {
      fill: 'rgba(70, 130, 180, 0.3)',
      stroke: '#4682b4'
    }
  }
};

chart.enableBrush(true).brushOptions(brushConfig);
```

### Data Processing
```typescript
import { createDataProcessor, DataProcessor } from 'mintwaterfall';

const processor: DataProcessor = createDataProcessor();

// Type-safe data validation
try {
  const isValid = processor.validateData(data);
  console.log('Data is valid:', isValid);
} catch (error) {
  console.error('Validation failed:', error);
}

// Process data with proper typing
const sortedData = processor.sortData(data, 'totalValue', 'desc');
const filteredData = processor.filterData(data, (item: ChartData) => {
  return item.stacks.some(stack => stack.value > 0);
});
```

## Method Chaining with Types

All configuration methods return the chart instance for fluent chaining:

```typescript
const chart = waterfallChart()
  .width(1100)                    // Returns WaterfallChart
  .height(600)                    // Returns WaterfallChart
  .margin({ top: 60, right: 80, bottom: 60, left: 80 })
  .showTotal(true)                // Returns WaterfallChart
  .stacked(false)                 // Returns WaterfallChart
  .duration(1000)                 // Returns WaterfallChart
  .staggeredAnimations(true)      // Returns WaterfallChart
  .on('barClick', handleClick);   // Returns WaterfallChart
```

## Type Guards and Validation

### Data Validation
```typescript
function isValidStackData(obj: any): obj is StackData {
  return typeof obj === 'object' &&
         typeof obj.value === 'number' &&
         typeof obj.color === 'string' &&
         (obj.label === undefined || typeof obj.label === 'string');
}

function isValidChartData(obj: any): obj is ChartData {
  return typeof obj === 'object' &&
         typeof obj.label === 'string' &&
         Array.isArray(obj.stacks) &&
         obj.stacks.every(isValidStackData);
}

// Usage
function safeUpdateChart(data: unknown): void {
  if (Array.isArray(data) && data.every(isValidChartData)) {
    // TypeScript now knows data is ChartData[]
    chart.datum(data).call(chart);
  } else {
    throw new Error('Invalid data format');
  }
}
```

### Configuration Getters
```typescript
// All getters return properly typed values
const width: number = chart.width();
const height: number = chart.height();
const margin: MarginConfig = chart.margin();
const isStacked: boolean = chart.stacked();
const theme: ThemeConfig | null = chart.theme();
const duration: number = chart.duration();
```

## Error Handling

### Type-Safe Error Handling
```typescript
function createChartSafely(data: unknown): WaterfallChart | null {
  try {
    // Validate data type
    if (!Array.isArray(data)) {
      throw new Error('Data must be an array');
    }

    // Type guard
    const isValidData = data.every((item): item is ChartData => {
      return typeof item === 'object' &&
             item !== null &&
             'label' in item &&
             'stacks' in item;
    });

    if (!isValidData) {
      throw new Error('Invalid data structure');
    }

    // Create chart with validated data
    return waterfallChart().width(800).height(400);
  } catch (error) {
    console.error('Chart creation failed:', error);
    return null;
  }
}
```

## Integration Examples

### React with TypeScript
```typescript
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { waterfallChart, ChartData, WaterfallChart } from 'mintwaterfall';

interface WaterfallChartProps {
  data: ChartData[];
  width?: number;
  height?: number;
  onBarClick?: (data: ProcessedData) => void;
}

const WaterfallChartComponent: React.FC<WaterfallChartProps> = ({
  data,
  width = 800,
  height = 400,
  onBarClick
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const chartRef = useRef<WaterfallChart>();

  useEffect(() => {
    if (!svgRef.current) return;

    // Create chart instance
    chartRef.current = waterfallChart()
      .width(width)
      .height(height)
      .showTotal(true);

    // Add event handler if provided
    if (onBarClick) {
      chartRef.current.on('barClick', (event, data) => {
        onBarClick(data);
      });
    }

    // Render chart
    d3.select(svgRef.current)
      .datum(data)
      .call(chartRef.current);

  }, [data, width, height, onBarClick]);

  return <svg ref={svgRef}></svg>;
};
```

### Vue.js with TypeScript
```typescript
import { defineComponent, ref, onMounted, watch, PropType } from 'vue';
import * as d3 from 'd3';
import { waterfallChart, ChartData, WaterfallChart } from 'mintwaterfall';

export default defineComponent({
  name: 'WaterfallChart',
  props: {
    data: {
      type: Array as PropType<ChartData[]>,
      required: true
    },
    width: {
      type: Number,
      default: 800
    },
    height: {
      type: Number,
      default: 400
    }
  },
  setup(props) {
    const svgRef = ref<SVGSVGElement>();
    let chart: WaterfallChart;

    const renderChart = () => {
      if (!svgRef.value) return;

      chart = waterfallChart()
        .width(props.width)
        .height(props.height);

      d3.select(svgRef.value)
        .datum(props.data)
        .call(chart);
    };

    onMounted(renderChart);
    watch(() => props.data, renderChart);

    return { svgRef };
  },
  template: '<svg ref="svgRef"></svg>'
});
```

## Best Practices

1. **Always use type annotations** for data structures
2. **Validate data** before passing to chart
3. **Use type guards** for runtime type checking
4. **Leverage IntelliSense** for API discovery
5. **Handle errors gracefully** with proper typing
6. **Use const assertions** for immutable data

## Troubleshooting

### Common TypeScript Issues

**Issue**: `Property 'waterfallChart' does not exist on type 'd3'`
**Solution**: Import directly from mintwaterfall:
```typescript
import { waterfallChart } from 'mintwaterfall';
// Instead of: d3.waterfallChart()
```

**Issue**: Type errors with event handlers
**Solution**: Use proper event handler types:
```typescript
import { BarEventHandler } from 'mintwaterfall';
const handler: BarEventHandler = (event, data) => { /* ... */ };
```

**Issue**: Data validation errors
**Solution**: Use type guards and validation:
```typescript
if (isValidChartData(data)) {
  // TypeScript knows data is valid
}
```

## Version Compatibility

- **TypeScript**: 4.0+
- **D3.js**: 7.0+
- **Node.js**: 14.0+

For the latest TypeScript definitions and examples, see the [GitHub repository](https://github.com/coredds/MintWaterfall).
