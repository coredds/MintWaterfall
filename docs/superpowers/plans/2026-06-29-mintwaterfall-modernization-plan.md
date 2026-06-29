# MintWaterfall Modernization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Modernize MintWaterfall v0.8.10 to v1.0.0 — finish TS migration, split monoliths, flatten enterprise scaffolding, standardize tests, replace demo, add AGENTS.md. No public API breakage.

**Architecture:** Split the 1915-line `mintwaterfall-chart.ts` into `src/chart/{chart,render,config,lifecycle}.ts` and the 1100-line `mintwaterfall-data.ts` into `src/data/{pipeline,transforms,validation,advanced}.ts`. Convert `src/index.js` to `src/index.ts` without D3 namespace mutation. Merge enterprise/features/advanced-* variants. Delete all empty placeholder files. Update rollup/jest configs, replace demo, add AGENTS.md.

**Tech Stack:** TypeScript 5.9, D3.js v7, Rollup 4, Jest 30, JSDOM 26, Babel 7

## Global Constraints

- No public API breakage — all existing chart methods remain unchanged
- All 4 build output formats must build and pass CI: CJS, ESM, UMD, minified UMD
- No dependency version bumps (already at latest)
- No new features
- No CSS/styling changes
- Node >= 18.0.0
- D3 peer dep ^7.0.0

---

### Task 1: Delete empty placeholder files

**Files:**
- Delete: `src/enterprise/enterprise-core.js` (empty)
- Delete: `src/enterprise/enterprise-feature-template.js` (empty)
- Delete: `src/enterprise/feature-registry.js` (empty)
- Delete: `src/enterprise/features/breakdown.js` (empty)
- Delete: `src/features/breakdown.js` (empty)
- Delete: `src/features/conditional-formatting.js` (empty)
- Delete: `src/utils/compatibility-layer.js` (empty)

**Interfaces:**
- Consumes: nothing
- Produces: cleaned `src/` directory

- [ ] **Step 1: Remove empty files**

```powershell
Remove-Item -LiteralPath "src\enterprise\enterprise-core.js"
Remove-Item -LiteralPath "src\enterprise\enterprise-feature-template.js"
Remove-Item -LiteralPath "src\enterprise\feature-registry.js"
Remove-Item -LiteralPath "src\enterprise\features\breakdown.js"
Remove-Item -LiteralPath "src\features\breakdown.js"
Remove-Item -LiteralPath "src\features\conditional-formatting.js"
Remove-Item -LiteralPath "src\utils\compatibility-layer.js"
```

- [ ] **Step 2: Remove empty directories**

```powershell
Remove-Item -LiteralPath "src\enterprise\features" -Force
Remove-Item -LiteralPath "src\enterprise" -Force
Remove-Item -LiteralPath "src\features" -Force
Remove-Item -LiteralPath "src\utils" -Force
```

- [ ] **Step 3: Verify structure**

```powershell
Get-ChildItem -LiteralPath "src" -Recurse -File | Select-Object -ExpandProperty FullName
```
Expected: only `.ts` files remain, no `enterprise/`, `features/`, or `utils/` directories.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "chore: remove empty placeholder files (enterprise, features, compat)"
```

---

### Task 2: Split megachart — create `src/chart/config.ts`

**Files:**
- Create: `src/chart/config.ts`
- Modify: none yet (config extracted from chart)

**Interfaces:**
- Consumes: nothing
- Produces:
  - `MarginConfig` interface (top, right, bottom, left)
  - `BrushOptions` interface (extent?, handleSize?, [key: string]: any)
  - `TooltipConfig` interface (enabled?, className?, offset?, [key: string]: any)
  - `ExportConfig` interface (formats?, filename?, [key: string]: any)
  - `ZoomConfig` interface (scaleExtent?, translateExtent?, [key: string]: any)
  - `BreakdownConfig` interface (enabled, levels, field?, minGroupSize?, sortStrategy?, showOthers?, othersLabel?, maxGroups?)
  - `AdvancedColorConfig` interface (enabled, scaleType, themeName?, customColorScale?, neutralThreshold?)
  - `ConfidenceBandConfig` interface (enabled, scenarios?, opacity?, showTrendLines?)
  - `MilestoneConfig` interface (enabled, milestones)
  - `ChartConfig` interface — all config state fields
  - `defaultConfig` object
  - `calculateIntelligentMargins()` function
  - `getBarWidth()` and `getBarPosition()` utility functions

- [ ] **Step 1: Create `src/chart/config.ts` with all config types and defaults**

Extract from `mintwaterfall-chart.ts` lines 1-316 (types and utility functions) plus the default config variables from lines 320-416.

```typescript
// MintWaterfall Chart Configuration
import * as d3 from "d3";

export interface StackData {
    value: number;
    color: string;
    label?: string;
}

export interface ChartData {
    label: string;
    stacks: StackData[];
}

export interface ProcessedData extends ChartData {
    barTotal: number;
    cumulativeTotal: number;
    prevCumulativeTotal?: number;
    stackPositions?: Array<{ start: number; end: number; color: string; value: number; label?: string }>;
}

export interface MarginConfig {
    top: number;
    right: number;
    bottom: number;
    left: number;
}

export interface BrushOptions {
    extent?: [[number, number], [number, number]];
    handleSize?: number;
    [key: string]: any;
}

export interface TooltipConfig {
    enabled?: boolean;
    className?: string;
    offset?: { x: number; y: number };
    [key: string]: any;
}

export interface ExportConfig {
    formats?: string[];
    filename?: string;
    [key: string]: any;
}

export interface ZoomConfig {
    scaleExtent?: [number, number];
    translateExtent?: [[number, number], [number, number]];
    [key: string]: any;
}

export interface BreakdownConfig {
    enabled: boolean;
    levels: number;
    field?: string;
    minGroupSize?: number;
    sortStrategy?: string;
    showOthers?: boolean;
    othersLabel?: string;
    maxGroups?: number;
}

export interface AdvancedColorConfig {
    enabled: boolean;
    scaleType: "auto" | "sequential" | "diverging" | "conditional";
    themeName?: string;
    customColorScale?: (value: number) => string;
    neutralThreshold?: number;
}

export interface ConfidenceBandConfig {
    enabled: boolean;
    scenarios?: {
        optimistic: Array<{ label: string; value: number }>;
        pessimistic: Array<{ label: string; value: number }>;
    };
    opacity?: number;
    showTrendLines?: boolean;
}

export interface MilestoneConfig {
    enabled: boolean;
    milestones: Array<{
        label: string;
        value: number;
        type: "target" | "threshold" | "alert" | "achievement";
        description?: string;
    }>;
}

export interface ChartConfig {
    width: number;
    height: number;
    margin: MarginConfig;
    showTotal: boolean;
    totalLabel: string;
    totalColor: string;
    stacked: boolean;
    barPadding: number;
    duration: number;
    ease: (t: number) => number;
    formatNumber: (n: number) => string;
    theme: string | null;
    enableBrush: boolean;
    brushOptions: BrushOptions;
    staggeredAnimations: boolean;
    staggerDelay: number;
    scaleType: string;
    advancedColorConfig: AdvancedColorConfig;
    colorMode: "default" | "conditional" | "sequential" | "diverging";
    confidenceBandConfig: ConfidenceBandConfig;
    milestoneConfig: MilestoneConfig;
    showTrendLine: boolean;
    trendLineColor: string;
    trendLineWidth: number;
    trendLineStyle: string;
    trendLineOpacity: number;
    trendLineType: string;
    trendLineWindow: number;
    trendLineDegree: number;
    enableAccessibility: boolean;
    enableTooltips: boolean;
    tooltipConfig: TooltipConfig;
    enableExport: boolean;
    exportConfig: ExportConfig;
    enableZoom: boolean;
    zoomConfig: ZoomConfig;
    breakdownConfig: BreakdownConfig | null;
    formattingRules: Map<string, any>;
    enablePerformanceOptimization: boolean;
    performanceDashboard: boolean;
    virtualizationThreshold: number;
}

export const defaultConfig: ChartConfig = {
    width: 800,
    height: 400,
    margin: { top: 60, right: 80, bottom: 60, left: 80 },
    showTotal: false,
    totalLabel: "Total",
    totalColor: "#95A5A6",
    stacked: false,
    barPadding: 0.05,
    duration: 750,
    ease: d3.easeQuadInOut,
    formatNumber: d3.format(".0f"),
    theme: null,
    enableBrush: false,
    brushOptions: {},
    staggeredAnimations: false,
    staggerDelay: 100,
    scaleType: "auto",
    advancedColorConfig: {
        enabled: false,
        scaleType: "auto",
        themeName: "default",
        neutralThreshold: 0,
    },
    colorMode: "conditional",
    confidenceBandConfig: {
        enabled: false,
        opacity: 0.3,
        showTrendLines: true,
    },
    milestoneConfig: {
        enabled: false,
        milestones: [],
    },
    showTrendLine: false,
    trendLineColor: "#e74c3c",
    trendLineWidth: 2,
    trendLineStyle: "solid",
    trendLineOpacity: 0.8,
    trendLineType: "linear",
    trendLineWindow: 3,
    trendLineDegree: 2,
    enableAccessibility: true,
    enableTooltips: false,
    tooltipConfig: {},
    enableExport: true,
    exportConfig: {},
    enableZoom: false,
    zoomConfig: {},
    breakdownConfig: null,
    formattingRules: new Map(),
    enablePerformanceOptimization: false,
    performanceDashboard: false,
    virtualizationThreshold: 10000,
};

export function getBarWidth(scale: any, barCount: number, totalWidth: number): number {
    if (scale.bandwidth) {
        return scale.bandwidth();
    } else {
        const padding = 0.1;
        const availableWidth = totalWidth * (1 - padding);
        return availableWidth / barCount;
    }
}

export function getBarPosition(scale: any, value: any, barWidth: number): number {
    if (scale.bandwidth) {
        return scale(value);
    } else {
        return scale(value) - barWidth / 2;
    }
}

export function calculateIntelligentMargins(
    processedData: ProcessedData[],
    baseMargin: MarginConfig,
    width: number,
    height: number,
    formatNumber: (n: number) => string
): MarginConfig {
    const allValues = processedData.flatMap(d => [d.cumulativeTotal, d.prevCumulativeTotal || 0]);
    const maxValue = d3.max(allValues) || 0;
    const minValue = d3.min(allValues) || 0;

    const labelHeight = 16;
    const labelPadding = 8;
    const requiredLabelSpace = labelHeight + labelPadding;
    const safetyBuffer = 20;

    const hasNegativeValues = minValue < 0;
    const initialTopMargin = Math.max(baseMargin.top, 80);

    let tempYScale: any;
    const tempRange: [number, number] = [height - baseMargin.bottom, initialTopMargin];

    if (hasNegativeValues) {
        const range = maxValue - minValue;
        const padding = range * 0.05;
        tempYScale = d3.scaleLinear()
            .domain([minValue - padding, maxValue + padding])
            .range(tempRange);
    } else {
        const paddedMax = maxValue * 1.02;
        tempYScale = d3.scaleLinear()
            .domain([0, paddedMax])
            .range(tempRange)
            .nice();
    }

    const allLabelPositions = processedData.map(d => {
        const barTop = tempYScale(d.cumulativeTotal);
        return barTop - labelPadding;
    });

    const highestLabelPosition = Math.min(...allLabelPositions);
    const spaceNeededFromTop = Math.max(
        initialTopMargin - highestLabelPosition + requiredLabelSpace,
        requiredLabelSpace + safetyBuffer
    );
    const extraTopMarginNeeded = Math.max(0, spaceNeededFromTop - initialTopMargin);

    let extraBottomMargin = 0;
    if (hasNegativeValues) {
        const negativeData = processedData.filter(d => d.cumulativeTotal < 0);
        if (negativeData.length > 0) {
            const lowestLabelPosition = Math.max(
                ...negativeData.map(d => tempYScale(d.cumulativeTotal) + labelHeight + labelPadding)
            );
            if (lowestLabelPosition > height - baseMargin.bottom) {
                extraBottomMargin = lowestLabelPosition - (height - baseMargin.bottom);
            }
        }
    }

    const maxLabelLength = Math.max(...processedData.map(d => formatNumber(d.cumulativeTotal).length));
    const estimatedLabelWidth = maxLabelLength * 9;
    const minRightMargin = Math.max(baseMargin.right, estimatedLabelWidth / 2 + 15);

    return {
        top: initialTopMargin + extraTopMarginNeeded + safetyBuffer,
        right: minRightMargin,
        bottom: baseMargin.bottom + extraBottomMargin + (hasNegativeValues ? safetyBuffer : 10),
        left: baseMargin.left,
    };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: may fail due to unresolved imports in other files — OK at this stage, just config.ts should compile clean.

- [ ] **Step 3: Commit**

```bash
git add src/chart/config.ts && git commit -m "feat: extract chart config types and defaults into src/chart/config.ts"
```

---

### Task 3: Split megachart — create `src/chart/render.ts`

**Files:**
- Create: `src/chart/render.ts`
- Modify: none yet

**Interfaces:**
- Consumes: `ChartConfig`, `ProcessedData`, `MarginConfig`, `getBarWidth`, `getBarPosition` from `./config.js`; `createWaterfallConfidenceBands`, `createWaterfallMilestones` from `../shapes.js`; `getAdvancedBarColor`, `ThemeCollection` from `../themes.js`; `d3`
- Produces:
  - `drawGrid(container, yScale, config, margins): void`
  - `drawAxes(container, xScale, yScale, config, margins): void`
  - `drawBars(container, processedData, xScale, yScale, config, margins): void`
  - `drawStackedBars(barGroups, xScale, yScale, config, margins): void`
  - `drawWaterfallBars(barGroups, xScale, yScale, config, margins, allData): void`
  - `drawValueLabels(barGroups, xScale, yScale, config, margins): void`
  - `drawConnectors(container, processedData, xScale, yScale, config): void`
  - `drawTrendLine(container, processedData, xScale, yScale, config): void`
  - `drawConfidenceBands(container, processedData, xScale, yScale, config): void`
  - `drawMilestones(container, processedData, xScale, yScale, config): void`

- [ ] **Step 1: Create `src/chart/render.ts` with all rendering functions**

Extract from `mintwaterfall-chart.ts` lines 824-1912 (drawGrid through drawMilestones). Each function takes the full `ChartConfig` instead of individual closure variables.

```typescript
// MintWaterfall Chart Rendering Pipeline
import * as d3 from "d3";
import { ChartConfig, ProcessedData, MarginConfig, getBarWidth, getBarPosition, AdvancedColorConfig, ConfidenceBandConfig, MilestoneConfig } from "./config.js";
import { createWaterfallConfidenceBands, createWaterfallMilestones } from "../shapes.js";
import { getAdvancedBarColor, ThemeCollection } from "../themes.js";

export function drawGrid(
    container: any,
    yScale: any,
    config: ChartConfig,
    margins: MarginConfig
): void {
    const { width, duration, ease } = config;
    const gridGroup = container.selectAll(".grid-group").data([0]);
    const gridGroupEnter = gridGroup.enter()
        .append("g")
        .attr("class", "grid-group");
    const gridGroupUpdate = gridGroupEnter.merge(gridGroup);

    const tickValues = yScale.ticks();
    const gridLines = gridGroupUpdate.selectAll(".grid-line").data(tickValues);

    const gridLinesEnter = gridLines.enter()
        .append("line")
        .attr("class", "grid-line")
        .attr("x1", margins.left)
        .attr("x2", width - margins.right)
        .attr("stroke", "rgba(224, 224, 224, 0.5)")
        .attr("stroke-width", 1)
        .style("opacity", 0);

    gridLinesEnter.merge(gridLines)
        .transition()
        .duration(duration)
        .ease(ease)
        .attr("y1", (d: any) => yScale(d))
        .attr("y2", (d: any) => yScale(d))
        .attr("x1", margins.left)
        .attr("x2", width - margins.right)
        .style("opacity", 1);

    gridLines.exit()
        .transition()
        .duration(duration)
        .ease(ease)
        .style("opacity", 0)
        .remove();
}

export function drawAxes(
    container: any,
    xScale: any,
    yScale: any,
    config: ChartConfig,
    margins: MarginConfig
): void {
    const { width, height, duration, ease, formatNumber } = config;

    const yAxisGroup = container.selectAll(".y-axis").data([0]);
    const yAxisGroupEnter = yAxisGroup.enter()
        .append("g")
        .attr("class", "y-axis")
        .attr("transform", `translate(${margins.left},0)`);

    yAxisGroupEnter.merge(yAxisGroup)
        .transition()
        .duration(duration)
        .ease(ease)
        .call(d3.axisLeft(yScale).tickFormat((d: any) => formatNumber(d as number)));

    const xAxisGroup = container.selectAll(".x-axis").data([0]);
    const xAxisGroupEnter = xAxisGroup.enter()
        .append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${height - margins.bottom})`);

    xAxisGroupEnter.merge(xAxisGroup)
        .transition()
        .duration(duration)
        .ease(ease)
        .call(d3.axisBottom(xScale));
}

export function drawBars(
    container: any,
    processedData: ProcessedData[],
    xScale: any,
    yScale: any,
    config: ChartConfig,
    margins: MarginConfig
): void {
    const { stacked, duration, ease, width } = config;
    const barsGroup = container.selectAll(".bars-group").data([0]);
    const barsGroupEnter = barsGroup.enter()
        .append("g")
        .attr("class", "bars-group");
    const barsGroupUpdate = barsGroupEnter.merge(barsGroup);

    const barGroups = barsGroupUpdate.selectAll(".bar-group").data(processedData, (d: any) => d.label);

    const barGroupsEnter = barGroups.enter()
        .append("g")
        .attr("class", "bar-group")
        .attr("transform", (d: any) => {
            if (xScale.bandwidth) {
                return `translate(${xScale(d.label)}, 0)`;
            } else {
                const barWidth = getBarWidth(xScale, processedData.length, width - margins.left - margins.right);
                const barX = getBarPosition(xScale, d.label, barWidth);
                return `translate(${barX}, 0)`;
            }
        });

    const barGroupsUpdate2 = barGroupsEnter.merge(barGroups)
        .transition()
        .duration(duration)
        .ease(ease)
        .attr("transform", (d: any) => {
            if (xScale.bandwidth) {
                return `translate(${xScale(d.label)}, 0)`;
            } else {
                const barWidth = getBarWidth(xScale, processedData.length, width - margins.left - margins.right);
                const barX = getBarPosition(xScale, d.label, barWidth);
                return `translate(${barX}, 0)`;
            }
        });

    if (stacked) {
        drawStackedBars(barGroupsUpdate2, xScale, yScale, config, margins);
    } else {
        drawWaterfallBars(barGroupsUpdate2, xScale, yScale, config, margins, processedData);
    }

    drawValueLabels(barGroupsUpdate2, xScale, yScale, config, margins);

    barGroups.exit()
        .transition()
        .duration(duration)
        .ease(ease)
        .style("opacity", 0)
        .remove();
}

export function drawStackedBars(
    barGroups: any,
    xScale: any,
    yScale: any,
    config: ChartConfig,
    margins: MarginConfig
): void {
    const { duration, ease, width } = config;
    barGroups.each(function (this: SVGGElement, d: any) {
        const group = d3.select(this);
        const stackData = d.stacks.map((stack: any, i: number) => ({
            ...stack,
            stackIndex: i,
            parent: d,
        }));

        let cumulativeHeight = d.prevCumulativeTotal || 0;
        stackData.forEach((stack: any) => {
            stack.startY = cumulativeHeight;
            stack.endY = cumulativeHeight + stack.value;
            stack.y = yScale(Math.max(stack.startY, stack.endY));
            stack.height = Math.abs(yScale(stack.startY) - yScale(stack.endY));
            cumulativeHeight += stack.value;
        });

        const stacks = group.selectAll(".stack").data(stackData);
        const barWidth = xScale.bandwidth
            ? xScale.bandwidth()
            : getBarWidth(xScale, barGroups.size(), width - margins.left - margins.right);

        const stacksEnter = stacks.enter()
            .append("rect")
            .attr("class", "stack")
            .attr("x", 0)
            .attr("width", barWidth)
            .attr("y", yScale(0))
            .attr("height", 0)
            .attr("fill", (stack: any) => stack.color);

        (stacksEnter as any).merge(stacks)
            .transition()
            .duration(duration)
            .ease(ease)
            .attr("y", (stack: any) => stack.y)
            .attr("height", (stack: any) => stack.height)
            .attr("fill", (stack: any) => stack.color)
            .attr("width", barWidth);

        stacks.exit()
            .transition()
            .duration(duration)
            .ease(ease)
            .attr("height", 0)
            .attr("y", yScale(0))
            .remove();

        const stackLabels = group.selectAll(".stack-label").data(stackData.filter((s: any) => s.label));
        const stackLabelsEnter = stackLabels.enter()
            .append("text")
            .attr("class", "stack-label")
            .attr("text-anchor", "middle")
            .attr("x", barWidth / 2)
            .attr("y", yScale(0))
            .style("opacity", 0);

        (stackLabelsEnter as any).merge(stackLabels)
            .transition()
            .duration(duration)
            .ease(ease)
            .attr("y", (stack: any) => stack.y + stack.height / 2 + 4)
            .attr("x", barWidth / 2)
            .style("opacity", 1)
            .text((stack: any) => stack.label);

        stackLabels.exit()
            .transition()
            .duration(duration)
            .ease(ease)
            .style("opacity", 0)
            .remove();
    });
}

export function drawWaterfallBars(
    barGroups: any,
    xScale: any,
    yScale: any,
    config: ChartConfig,
    margins: MarginConfig,
    allData: ProcessedData[] = []
): void {
    const { duration, ease, width, advancedColorConfig, colorMode } = config;
    barGroups.each(function (this: SVGGElement, d: any) {
        const group = d3.select(this);
        const barWidth = xScale.bandwidth
            ? xScale.bandwidth()
            : getBarWidth(xScale, barGroups.size(), width - margins.left - margins.right);

        const defaultColor = d.stacks.length === 1 ? d.stacks[0].color : "#3498db";
        const advancedColor = advancedColorConfig.enabled
            ? getAdvancedBarColor(
                  d.barTotal,
                  defaultColor,
                  allData,
                  (advancedColorConfig.themeName as keyof ThemeCollection) || "default",
                  colorMode
              )
            : defaultColor;

        const barData = [
            {
                value: d.barTotal,
                color: advancedColor,
                y: d.isTotal
                    ? Math.min(yScale(0), yScale(d.cumulativeTotal))
                    : yScale(Math.max(d.prevCumulativeTotal, d.cumulativeTotal)),
                height: d.isTotal
                    ? Math.abs(yScale(0) - yScale(d.cumulativeTotal))
                    : Math.abs(yScale(d.prevCumulativeTotal || 0) - yScale(d.cumulativeTotal)),
                parent: d,
            },
        ];

        const bars = group.selectAll(".waterfall-bar").data(barData);
        const barsEnter = bars.enter()
            .append("rect")
            .attr("class", "waterfall-bar")
            .attr("x", 0)
            .attr("width", barWidth)
            .attr("y", yScale(0))
            .attr("height", 0)
            .attr("fill", (bar: any) => bar.color);

        (barsEnter as any).merge(bars)
            .transition()
            .duration(duration)
            .ease(ease)
            .attr("y", (bar: any) => bar.y)
            .attr("height", (bar: any) => bar.height)
            .attr("fill", (bar: any) => bar.color)
            .attr("width", barWidth);

        bars.exit()
            .transition()
            .duration(duration)
            .ease(ease)
            .attr("height", 0)
            .attr("y", yScale(0))
            .remove();
    });
}

export function drawValueLabels(
    barGroups: any,
    xScale: any,
    yScale: any,
    config: ChartConfig,
    margins: MarginConfig
): void {
    const { duration, ease, formatNumber, width } = config;
    barGroups.each(function (this: SVGGElement, d: any) {
        const group = d3.select(this);
        const barWidth = getBarWidth(xScale, barGroups.size(), width - margins.left - margins.right);

        const labelData = [
            {
                value: d.barTotal,
                formattedValue: formatNumber(d.barTotal),
                parent: d,
            },
        ];

        const totalLabels = group.selectAll(".total-label").data(labelData);
        const totalLabelsEnter = totalLabels.enter()
            .append("text")
            .attr("class", "total-label")
            .attr("text-anchor", "middle")
            .attr("x", barWidth / 2)
            .attr("y", yScale(0))
            .style("opacity", 0)
            .style("font-family", "Arial, sans-serif");

        (totalLabelsEnter as any).merge(totalLabels)
            .transition()
            .duration(duration)
            .ease(ease)
            .attr("y", (labelD: any) => {
                const barTop = yScale(labelD.parent.cumulativeTotal);
                const padding = 8;
                return barTop - padding;
            })
            .attr("x", barWidth / 2)
            .style("opacity", 1)
            .style("fill", "#333")
            .style("font-weight", "bold")
            .style("font-size", "14px")
            .style("pointer-events", "none")
            .style("visibility", "visible")
            .style("display", "block")
            .attr("clip-path", "none")
            .text((labelD: any) => labelD.formattedValue);

        totalLabels.exit()
            .transition()
            .duration(duration)
            .ease(ease)
            .style("opacity", 0)
            .remove();
    });
}

export function drawConnectors(
    container: any,
    processedData: ProcessedData[],
    xScale: any,
    yScale: any,
    config: ChartConfig
): void {
    const { stacked, duration, ease, staggeredAnimations, staggerDelay, width, margin } = config;
    if (stacked || processedData.length < 2) return;

    const connectorsGroup = container.selectAll(".connectors-group").data([0]);
    const connectorsGroupEnter = connectorsGroup.enter()
        .append("g")
        .attr("class", "connectors-group");
    const connectorsGroupUpdate = connectorsGroupEnter.merge(connectorsGroup);

    const connectorData: any[] = [];
    for (let i = 0; i < processedData.length - 1; i++) {
        const current = processedData[i];
        const next = processedData[i + 1];
        const barWidth = getBarWidth(xScale, processedData.length, width - margin.left - margin.right);
        const currentX = getBarPosition(xScale, current.label, barWidth);
        const nextX = getBarPosition(xScale, next.label, barWidth);
        connectorData.push({
            x1: currentX + barWidth,
            x2: nextX,
            y: yScale(current.cumulativeTotal),
            id: `${current.label}-${next.label}`,
        });
    }

    const connectors = connectorsGroupUpdate.selectAll(".connector").data(connectorData, (d: any) => d.id);
    const connectorsEnter = connectors.enter()
        .append("line")
        .attr("class", "connector")
        .attr("stroke", "#bdc3c7")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "3,3")
        .style("opacity", 0)
        .attr("x1", (d: any) => d.x1)
        .attr("x2", (d: any) => d.x1)
        .attr("y1", (d: any) => d.y)
        .attr("y2", (d: any) => d.y);

    connectorsEnter.merge(connectors)
        .transition()
        .duration(duration)
        .ease(ease)
        .delay((d: any, i: number) => staggeredAnimations ? i * staggerDelay : 0)
        .attr("x1", (d: any) => d.x1)
        .attr("x2", (d: any) => d.x2)
        .attr("y1", (d: any) => d.y)
        .attr("y2", (d: any) => d.y)
        .style("opacity", 0.6);

    connectors.exit()
        .transition()
        .duration(duration)
        .ease(ease)
        .style("opacity", 0)
        .remove();
}

export function drawTrendLine(
    container: any,
    processedData: ProcessedData[],
    xScale: any,
    yScale: any,
    config: ChartConfig
): void {
    const {
        showTrendLine, trendLineColor, trendLineWidth, trendLineStyle,
        trendLineOpacity, trendLineType, trendLineWindow, trendLineDegree,
        duration, ease, width, margin,
    } = config;

    if (!showTrendLine || processedData.length < 2) {
        container.selectAll(".trend-group").remove();
        return;
    }

    const trendGroup = container.selectAll(".trend-group").data([0]);
    const trendGroupEnter = trendGroup.enter()
        .append("g")
        .attr("class", "trend-group");
    const trendGroupUpdate = trendGroupEnter.merge(trendGroup);

    const dataPoints: { x: number; y: number; value: number }[] = [];
    for (let i = 0; i < processedData.length; i++) {
        const item = processedData[i];
        const barWidth = getBarWidth(xScale, processedData.length, width - margin.left - margin.right);
        const x = getBarPosition(xScale, item.label, barWidth) + barWidth / 2;
        dataPoints.push({ x, y: yScale(item.cumulativeTotal), value: item.cumulativeTotal });
    }

    const trendData: { x: number; y: number }[] = [];

    if (trendLineType === "linear") {
        const n = dataPoints.length;
        const sumX = dataPoints.reduce((sum, p, i) => sum + i, 0);
        const sumY = dataPoints.reduce((sum, p) => sum + p.value, 0);
        const sumXY = dataPoints.reduce((sum, p, i) => sum + i * p.value, 0);
        const sumXX = dataPoints.reduce((sum, p, i) => sum + i * i, 0);
        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        dataPoints.forEach((point, i) => {
            trendData.push({ x: point.x, y: yScale(slope * i + intercept) });
        });
    } else if (trendLineType === "moving-average") {
        const window = trendLineWindow;
        for (let i = 0; i < dataPoints.length; i++) {
            const start = Math.max(0, i - Math.floor(window / 2));
            const end = Math.min(dataPoints.length, start + window);
            const windowData = dataPoints.slice(start, end);
            const average = windowData.reduce((sum, p) => sum + p.value, 0) / windowData.length;
            trendData.push({ x: dataPoints[i].x, y: yScale(average) });
        }
    } else {
        dataPoints.forEach(point => trendData.push({ x: point.x, y: point.y }));
    }

    const line = d3.line<{ x: number; y: number }>()
        .x(d => d.x)
        .y(d => d.y)
        .curve(
            trendLineType === "polynomial" ? d3.curveCardinal
            : trendLineType === "moving-average" ? d3.curveMonotoneX
            : d3.curveLinear
        );

    const trendLine = trendGroupUpdate.selectAll(".trend-line").data([trendData]);
    const trendLineEnter = trendLine.enter()
        .append("path")
        .attr("class", "trend-line")
        .attr("fill", "none")
        .attr("stroke", trendLineColor)
        .attr("stroke-width", trendLineWidth)
        .attr("stroke-opacity", trendLineOpacity)
        .style("opacity", 0);

    function applyStrokeStyle(selection: any) {
        if (trendLineStyle === "dashed") selection.attr("stroke-dasharray", "5,5");
        else if (trendLineStyle === "dotted") selection.attr("stroke-dasharray", "2,3");
        else selection.attr("stroke-dasharray", null);
    }

    applyStrokeStyle(trendLineEnter);
    const updatedTrendLine = trendLineEnter.merge(trendLine);
    applyStrokeStyle(updatedTrendLine);

    updatedTrendLine
        .transition()
        .duration(duration)
        .ease(ease)
        .attr("d", line)
        .attr("stroke", trendLineColor)
        .attr("stroke-width", trendLineWidth)
        .attr("stroke-opacity", trendLineOpacity)
        .style("opacity", 1);

    trendLine.exit()
        .transition()
        .duration(duration)
        .ease(ease)
        .style("opacity", 0)
        .remove();
}

export function drawConfidenceBands(
    container: any,
    processedData: ProcessedData[],
    xScale: any,
    yScale: any,
    config: ChartConfig
): void {
    const { confidenceBandConfig, duration, ease } = config;
    if (!confidenceBandConfig.enabled || !confidenceBandConfig.scenarios) return;

    const confidenceGroup = container.selectAll(".confidence-bands-group").data([0]);
    const confidenceGroupEnter = confidenceGroup.enter()
        .append("g")
        .attr("class", "confidence-bands-group");
    const confidenceGroupUpdate = confidenceGroupEnter.merge(confidenceGroup);

    const confidenceBandData = createWaterfallConfidenceBands(
        processedData.map(d => ({ label: d.label, value: d.barTotal })),
        confidenceBandConfig.scenarios,
        xScale,
        yScale
    );

    const confidencePath = confidenceGroupUpdate.selectAll(".confidence-band").data([confidenceBandData.confidencePath]);
    const confidencePathEnter = confidencePath.enter()
        .append("path")
        .attr("class", "confidence-band")
        .attr("fill", `rgba(52, 152, 219, ${confidenceBandConfig.opacity || 0.3})`)
        .attr("stroke", "none")
        .style("opacity", 0);

    confidencePathEnter.merge(confidencePath)
        .transition()
        .duration(duration)
        .ease(ease)
        .attr("d", confidenceBandData.confidencePath)
        .style("opacity", 1);

    confidencePath.exit()
        .transition()
        .duration(duration)
        .style("opacity", 0)
        .remove();
}

export function drawMilestones(
    container: any,
    processedData: ProcessedData[],
    xScale: any,
    yScale: any,
    config: ChartConfig
): void {
    const { milestoneConfig, duration, ease } = config;
    if (!milestoneConfig.enabled || milestoneConfig.milestones.length === 0) return;

    const milestonesGroup = container.selectAll(".milestones-group").data([0]);
    const milestonesGroupEnter = milestonesGroup.enter()
        .append("g")
        .attr("class", "milestones-group");
    const milestonesGroupUpdate = milestonesGroupEnter.merge(milestonesGroup);

    const milestoneMarkers = createWaterfallMilestones(milestoneConfig.milestones, xScale, yScale);

    const markers = milestonesGroupUpdate.selectAll(".milestone-marker").data(milestoneMarkers);
    const markersEnter = markers.enter()
        .append("path")
        .attr("class", "milestone-marker")
        .attr("transform", (d: any) => d.transform)
        .attr("d", (d: any) => d.path)
        .attr("fill", (d: any) => d.config.fillColor || "#f39c12")
        .attr("stroke", (d: any) => d.config.strokeColor || "#ffffff")
        .attr("stroke-width", (d: any) => d.config.strokeWidth || 2)
        .style("opacity", 0);

    markersEnter.merge(markers)
        .transition()
        .duration(duration)
        .ease(ease)
        .attr("transform", (d: any) => d.transform)
        .attr("d", (d: any) => d.path)
        .attr("fill", (d: any) => d.config.fillColor || "#f39c12")
        .style("opacity", 1);

    markers.exit()
        .transition()
        .duration(duration)
        .style("opacity", 0)
        .remove();
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/chart/render.ts && git commit -m "feat: extract chart rendering functions into src/chart/render.ts"
```

---

### Task 4: Split megachart — create `src/chart/lifecycle.ts`

**Files:**
- Create: `src/chart/lifecycle.ts`

**Interfaces:**
- Consumes: `ChartConfig`, `ProcessedData` from `./config.js`
- Produces:
  - `prepareData(data, config, formattingRules, breakdownConfig): ProcessedData[]` — processes data, applies breakdown/conditional formatting, adds total bar

- [ ] **Step 1: Create `src/chart/lifecycle.ts`**

Extract `prepareData()` from `mintwaterfall-chart.ts` lines 764-811.

```typescript
// MintWaterfall Chart Lifecycle — data preparation
import { ChartConfig, ProcessedData, ChartData, BreakdownConfig } from "./config.js";

export function prepareData(
    data: ChartData[],
    config: ChartConfig,
    formattingRules: Map<string, any>,
    breakdownConfig: BreakdownConfig | null
): ProcessedData[] {
    let workingData = [...data];

    let cumulativeTotal = 0;
    let prevCumulativeTotal = 0;

    const processedData: ProcessedData[] = workingData.map((bar, i) => {
        const barTotal = bar.stacks.reduce((sum, stack) => sum + stack.value, 0);
        prevCumulativeTotal = cumulativeTotal;
        cumulativeTotal += barTotal;

        let processedStacks = bar.stacks;

        const result: ProcessedData = {
            ...bar,
            stacks: processedStacks,
            barTotal,
            cumulativeTotal,
            prevCumulativeTotal: i === 0 ? 0 : prevCumulativeTotal,
        };

        return result;
    });

    if (config.showTotal && processedData.length > 0) {
        const totalValue = cumulativeTotal;
        processedData.push({
            label: config.totalLabel,
            stacks: [{ value: totalValue, color: config.totalColor }],
            barTotal: totalValue,
            cumulativeTotal: totalValue,
            prevCumulativeTotal: 0,
        });
    }

    return processedData;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/chart/lifecycle.ts && git commit -m "feat: extract data preparation into src/chart/lifecycle.ts"
```

---

### Task 5: Create new `src/chart/chart.ts` — the chart factory

**Files:**
- Create: `src/chart/chart.ts`

**Interfaces:**
- Consumes: Everything from `./config.js`, `./render.js`, `./lifecycle.js`
  Also: `createScaleSystem` from `../scales.js`, `createBrushSystem` from `../brush.js`, `createAccessibilitySystem` from `../accessibility.js`, `createTooltipSystem` from `../tooltip.js`, `createExportSystem` from `../export.js`, `createZoomSystem` from `../zoom.js`, `createPerformanceManager` from `../performance.js`, `createShapeGenerators` from `../shapes.js`, `WaterfallChart` interface
- Produces: `waterfallChart()` factory function (the public API)

- [ ] **Step 1: Create `src/chart/chart.ts` with the chart factory**

This is the new main chart file — the unified chart class logic combining what was in `mintwaterfall-chart.ts` (the chart function, getter/setters, feature initialization) with extracted modules.

```typescript
// MintWaterfall Chart — Main Chart Factory
import * as d3 from "d3";
import {
    ChartConfig, defaultConfig, WaterfallChart, ProcessedData, ChartData,
    BrushOptions, TooltipConfig, ExportConfig, ZoomConfig, BreakdownConfig,
    AdvancedColorConfig, ConfidenceBandConfig, MilestoneConfig,
    calculateIntelligentMargins,
} from "./config.js";
import { prepareData } from "./lifecycle.js";
import {
    drawGrid, drawAxes, drawBars, drawConnectors, drawTrendLine,
    drawConfidenceBands, drawMilestones,
} from "./render.js";
import { createScaleSystem } from "../scales.js";
import { createBrushSystem } from "../brush.js";
import { createAccessibilitySystem } from "../accessibility.js";
import { createTooltipSystem } from "../tooltip.js";
import { createExportSystem } from "../export.js";
import { createZoomSystem } from "../zoom.js";
import { createPerformanceManager } from "../performance.js";
import { createShapeGenerators } from "../shapes.js";

export function waterfallChart(): WaterfallChart {
    const config: ChartConfig = { ...defaultConfig, formattingRules: new Map() };

    let lastDataHash: string | null = null;
    let cachedProcessedData: ProcessedData[] | null = null;

    const scaleSystem = createScaleSystem();
    const brushSystem = createBrushSystem();
    const accessibilitySystem = createAccessibilitySystem();
    const tooltipSystem = createTooltipSystem();
    const exportSystem = createExportSystem();
    const zoomSystem = createZoomSystem();
    const shapeGeneratorSystem = createShapeGenerators();
    const performanceManager = createPerformanceManager();

    const listeners = d3.dispatch("barClick", "barMouseover", "barMouseout", "chartUpdate", "brushSelection");

    function chart(selection: d3.Selection<any, any, any, any>): void {
        selection.each(function (data: ChartData[]) {
            if (!data || !Array.isArray(data)) {
                console.warn("MintWaterfall: Invalid data provided. Expected an array.");
                return;
            }
            if (data.length === 0) {
                console.warn("MintWaterfall: Empty data array provided.");
                return;
            }

            const isValidData = data.every(item =>
                item && typeof item.label === "string" && Array.isArray(item.stacks) &&
                item.stacks.every(stack => typeof stack.value === "number" && typeof stack.color === "string")
            );
            if (!isValidData) {
                console.error("MintWaterfall: Invalid data structure.");
                return;
            }

            const element = d3.select(this);
            let svg: any;
            if (this.tagName === "svg") {
                svg = element;
            } else {
                svg = element.selectAll("svg").data([0]);
                const svgEnter = svg.enter().append("svg");
                svg = svgEnter.merge(svg);
                svg.attr("width", config.width).attr("height", config.height);
            }

            const svgNode = svg.node() as SVGSVGElement;
            let actualWidth = config.width;
            let actualHeight = config.height;
            if (svgNode) {
                const w = svgNode.getAttribute("width");
                const h = svgNode.getAttribute("height");
                if (w) actualWidth = parseInt(w, 10);
                if (h) actualHeight = parseInt(h, 10);
            }

            const container = svg.selectAll(".waterfall-container").data([data]);
            const containerEnter = container.enter()
                .append("g")
                .attr("class", "waterfall-container");
            const containerUpdate = containerEnter.merge(container);

            let chartGroup: any = containerUpdate.select(".chart-group");
            if (chartGroup.empty()) {
                chartGroup = containerUpdate.append("g").attr("class", "chart-group");
            }

            const clipPathId = `chart-clip-${Date.now()}`;
            svg.select(`#${clipPathId}`).remove();
            const clipPath = svg.append("defs")
                .append("clipPath")
                .attr("id", clipPathId)
                .append("rect");
            chartGroup.attr("clip-path", `url(#${clipPathId})`);

            try {
                const dataHash = JSON.stringify(data).slice(0, 100) + `_showTotal:${config.showTotal}`;
                let processedData: ProcessedData[];
                if (dataHash === lastDataHash && cachedProcessedData) {
                    processedData = cachedProcessedData;
                } else {
                    processedData = prepareData(
                        data,
                        { ...config, width: actualWidth, height: actualHeight },
                        config.formattingRules,
                        config.breakdownConfig
                    );
                    lastDataHash = dataHash;
                    cachedProcessedData = processedData;
                }

                const intelligentMargins = calculateIntelligentMargins(
                    processedData, config.margin, actualWidth, actualHeight, config.formatNumber
                );

                let xScale: any;
                if (config.scaleType === "auto") {
                    xScale = scaleSystem.createAdaptiveScale(processedData, "x");
                    if (xScale.padding) xScale.padding(config.barPadding);
                } else if (config.scaleType === "time") {
                    const timeValues = processedData.map(d => new Date(d.label));
                    xScale = scaleSystem.createTimeScale(timeValues);
                } else if (config.scaleType === "ordinal") {
                    xScale = scaleSystem.createOrdinalScale(processedData.map(d => d.label));
                } else {
                    xScale = d3.scaleBand()
                        .domain(processedData.map(d => d.label))
                        .padding(config.barPadding);
                }
                xScale.range([intelligentMargins.left, actualWidth - intelligentMargins.right]);
                scaleSystem.setDefaultRange([intelligentMargins.left, actualWidth - intelligentMargins.right]);

                const labelSpace = 30;
                clipPath
                    .attr("x", intelligentMargins.left)
                    .attr("y", Math.max(0, intelligentMargins.top - labelSpace))
                    .attr("width", actualWidth - intelligentMargins.left - intelligentMargins.right)
                    .attr("height", actualHeight - intelligentMargins.top - intelligentMargins.bottom + labelSpace);

                const yValues = processedData.map(d => d.cumulativeTotal);
                const [min, max] = d3.extent(yValues) as [number, number];
                const hasNegativeValues = min < 0;
                let yScale: any;
                if (hasNegativeValues) {
                    const range = max - min;
                    const padding = range * 0.05;
                    yScale = d3.scaleLinear()
                        .domain([min - padding, max + padding])
                        .range([actualHeight - intelligentMargins.bottom, intelligentMargins.top]);
                } else {
                    yScale = scaleSystem.createLinearScale(yValues, {
                        range: [actualHeight - intelligentMargins.bottom, intelligentMargins.top],
                        nice: true,
                    });
                }

                config.width = actualWidth;
                config.height = actualHeight;

                drawGrid(containerUpdate, yScale, config, intelligentMargins);
                drawAxes(containerUpdate, xScale, yScale, config, intelligentMargins);
                drawBars(chartGroup, processedData, xScale, yScale, config, intelligentMargins);
                drawConnectors(chartGroup, processedData, xScale, yScale, config);
                drawTrendLine(chartGroup, processedData, xScale, yScale, config);
                drawConfidenceBands(chartGroup, processedData, xScale, yScale, config);
                drawMilestones(chartGroup, processedData, xScale, yScale, config);

                setTimeout(() => {
                    if (config.enableAccessibility) {
                        svg.attr("role", "img")
                            .attr("aria-label", `Waterfall chart with ${processedData.length} data points`);
                    }
                    if (config.enableTooltips) {
                        tooltipSystem.configure(config.tooltipConfig);
                    }
                }, 50);
            } catch (error: any) {
                console.error("MintWaterfall rendering error:", error);
                containerUpdate.selectAll("*").remove();
                containerUpdate.append("text")
                    .attr("x", config.width / 2)
                    .attr("y", config.height / 2)
                    .attr("text-anchor", "middle")
                    .style("font-size", "14px")
                    .style("fill", "#ff6b6b")
                    .text(`Chart Error: ${error.message}`);
            }
        });
    }

    // Getter/setter methods
    function accessor<T>(get: () => T, set: (v: T) => void) {
        return function (this: any, value?: T): T | WaterfallChart {
            if (arguments.length === 0) return get();
            set(value!);
            return chart;
        };
    }

    chart.width = accessor(() => config.width, v => { config.width = v; });
    chart.height = accessor(() => config.height, v => { config.height = v; });
    chart.margin = accessor(() => config.margin, v => { config.margin = v; });
    chart.stacked = accessor(() => config.stacked, v => { config.stacked = v; });
    chart.showTotal = accessor(() => config.showTotal, v => { config.showTotal = v; });
    chart.totalLabel = accessor(() => config.totalLabel, v => { config.totalLabel = v; });
    chart.totalColor = accessor(() => config.totalColor, v => { config.totalColor = v; });
    chart.barPadding = accessor(() => config.barPadding, v => { config.barPadding = v; });
    chart.duration = accessor(() => config.duration, v => { config.duration = v; });
    chart.ease = accessor(() => config.ease, v => { config.ease = v; });
    chart.formatNumber = accessor(() => config.formatNumber, v => { config.formatNumber = v; });
    chart.theme = accessor(() => config.theme, v => { config.theme = v; });
    chart.enableBrush = accessor(() => config.enableBrush, v => { config.enableBrush = v; });
    chart.brushOptions = accessor(() => config.brushOptions, v => { config.brushOptions = v; });
    chart.staggeredAnimations = accessor(() => config.staggeredAnimations, v => { config.staggeredAnimations = v; });
    chart.staggerDelay = accessor(() => config.staggerDelay, v => { config.staggerDelay = v; });
    chart.scaleType = accessor(() => config.scaleType, v => { config.scaleType = v; });
    chart.showTrendLine = accessor(() => config.showTrendLine, v => { config.showTrendLine = v; });
    chart.trendLineColor = accessor(() => config.trendLineColor, v => { config.trendLineColor = v; });
    chart.trendLineWidth = accessor(() => config.trendLineWidth, v => { config.trendLineWidth = v; });
    chart.trendLineStyle = accessor(() => config.trendLineStyle, v => { config.trendLineStyle = v; });
    chart.trendLineOpacity = accessor(() => config.trendLineOpacity, v => { config.trendLineOpacity = v; });
    chart.trendLineType = accessor(() => config.trendLineType, v => { config.trendLineType = v; });
    chart.trendLineWindow = accessor(() => config.trendLineWindow, v => { config.trendLineWindow = v; });
    chart.trendLineDegree = accessor(() => config.trendLineDegree, v => { config.trendLineDegree = v; });
    chart.enableAccessibility = accessor(() => config.enableAccessibility, v => { config.enableAccessibility = v; });
    chart.enableTooltips = accessor(() => config.enableTooltips, v => { config.enableTooltips = v; });
    chart.tooltipConfig = accessor(() => config.tooltipConfig, v => { config.tooltipConfig = v; });
    chart.enableExport = accessor(() => config.enableExport, v => { config.enableExport = v; });
    chart.exportConfig = accessor(() => config.exportConfig, v => { config.exportConfig = v; });
    chart.enableZoom = accessor(() => config.enableZoom, v => { config.enableZoom = v; });
    chart.zoomConfig = accessor(() => config.zoomConfig, v => { config.zoomConfig = v; });
    chart.breakdownConfig = accessor(() => config.breakdownConfig, v => { config.breakdownConfig = v; });
    chart.enablePerformanceOptimization = accessor(() => config.enablePerformanceOptimization, v => { config.enablePerformanceOptimization = v; });
    chart.performanceDashboard = accessor(() => config.performanceDashboard, v => { config.performanceDashboard = v; });
    chart.virtualizationThreshold = accessor(() => config.virtualizationThreshold, v => { config.virtualizationThreshold = v; });
    chart.enableAdvancedColors = accessor(() => config.advancedColorConfig.enabled, v => { config.advancedColorConfig.enabled = v; });
    chart.colorMode = accessor(() => config.colorMode, v => { config.colorMode = v; });
    chart.colorTheme = accessor(() => config.advancedColorConfig.themeName || "default", v => { config.advancedColorConfig.themeName = v; });
    chart.neutralThreshold = accessor(() => config.advancedColorConfig.neutralThreshold || 0, v => { config.advancedColorConfig.neutralThreshold = v; });

    chart.on = function (): any {
        const value = (listeners.on as any).apply(listeners, Array.from(arguments));
        return value === listeners ? chart : value;
    };

    return chart as WaterfallChart;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/chart/chart.ts && git commit -m "feat: create chart factory in src/chart/chart.ts"
```

---

### Task 6: Delete old megafile `mintwaterfall-chart.ts`

**Files:**
- Delete: `src/mintwaterfall-chart.ts`
- Delete: `src/mintwaterfall-chart-core.ts` (duplicate simpler implementation)

**Interfaces:**
- Consumes: nothing (replacement already exists)
- Produces: cleaned src/

- [ ] **Step 1: Remove old chart files**

```powershell
Remove-Item -LiteralPath "src\mintwaterfall-chart.ts"
Remove-Item -LiteralPath "src\mintwaterfall-chart-core.ts"
```

- [ ] **Step 2: Verify no remaining references**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "refactor: remove old monolithic chart files, replace with src/chart/"
```

---

### Task 7: Split megadata — create `src/data/` subdirectory

**Files:**
- Create: `src/data/validation.ts`
- Create: `src/data/transforms.ts`
- Create: `src/data/advanced.ts`
- Create: `src/data/pipeline.ts`
- Modify: `src/mintwaterfall-data.ts` (will be deleted after)

**Interfaces:**
- Consumes: `d3`, type definitions from `mintwaterfall-data.ts`
- Produces: same public API as `mintwaterfall-data.ts` but split across focused modules

- [ ] **Step 1: Create `src/data/validation.ts`**

Extract type definitions (lines 1-67), `validateData()` (lines 259-299), and `getDataSummary()` (lines 384-416) from `mintwaterfall-data.ts`.

```typescript
// MintWaterfall Data Validation
import * as d3 from "d3";

export interface StackItem {
    value: number;
    color: string;
    label: string;
}

export interface DataItem {
    label: string;
    stacks: StackItem[];
}

export interface ProcessedDataItem extends DataItem {
    aggregatedValue?: number;
    originalStacks?: StackItem[];
}

export interface LoadDataOptions {
    parseNumbers?: boolean;
    dateColumns?: string[];
    valueColumn?: string;
    labelColumn?: string;
    colorColumn?: string;
    stacksColumn?: string;
}

export interface TransformOptions {
    valueColumn?: string;
    labelColumn?: string;
    colorColumn?: string;
    stacksColumn?: string;
    defaultColor?: string;
    parseNumbers?: boolean;
}

export type AggregationType = "sum" | "average" | "max" | "min";
export type SortDirection = "ascending" | "descending";
export type SortBy = "label" | "total" | "maxStack" | "minStack";

export interface DataSummary {
    totalItems: number;
    totalStacks: number;
    valueRange: { min: number; max: number };
    cumulativeTotal: number;
    stackColors: string[];
    labels: string[];
}

export function validateData(data: DataItem[]): boolean {
    if (!data || !Array.isArray(data)) {
        throw new Error("Data must be an array");
    }
    if (data.length === 0) {
        throw new Error("Data array cannot be empty");
    }
    const isValid = data.every((item: DataItem, index: number) => {
        if (!item || typeof item !== "object") {
            throw new Error(`Item at index ${index} must be an object`);
        }
        if (typeof item.label !== "string") {
            throw new Error(`Item at index ${index} must have a string 'label' property`);
        }
        if (!Array.isArray(item.stacks)) {
            throw new Error(`Item at index ${index} must have an array 'stacks' property`);
        }
        if (item.stacks.length === 0) {
            throw new Error(`Item at index ${index} must have at least one stack`);
        }
        item.stacks.forEach((stack: StackItem, stackIndex: number) => {
            if (typeof stack.value !== "number" || isNaN(stack.value)) {
                throw new Error(`Stack ${stackIndex} in item ${index} must have a numeric 'value'`);
            }
            if (typeof stack.color !== "string") {
                throw new Error(`Stack ${stackIndex} in item ${index} must have a string 'color'`);
            }
        });
        return true;
    });
    return isValid;
}

export function getDataSummary(data: DataItem[]): DataSummary {
    validateData(data);
    const allValues: number[] = [];
    const allColors: string[] = [];
    let totalStacks = 0;
    data.forEach(item => {
        item.stacks.forEach(stack => {
            allValues.push(stack.value);
            allColors.push(stack.color);
            totalStacks++;
        });
    });
    return {
        totalItems: data.length,
        totalStacks,
        valueRange: { min: Math.min(...allValues), max: Math.max(...allValues) },
        cumulativeTotal: allValues.reduce((sum, value) => sum + value, 0),
        stackColors: [...new Set(allColors)],
        labels: data.map(item => item.label),
    };
}
```

- [ ] **Step 2: Create `src/data/transforms.ts`**

Extract `transformToWaterfallFormat()` (lines 184-228), `aggregateData()` (lines 301-330), `sortData()` (lines 332-377), `filterData()` (lines 379-382), `transformData()` (lines 418-421), `groupData()` (lines 423-439), `transformStacks()` (lines 441-450), `normalizeValues()` (lines 452-473), `groupByCategory()` (lines 475-491), `calculatePercentages()` (lines 493-505), `interpolateData()` (lines 507-525), `generateSampleData()` (lines 527-539).

```typescript
// MintWaterfall Data Transforms
import * as d3 from "d3";
import { DataItem, StackItem, ProcessedDataItem, AggregationType, SortBy, SortDirection, validateData } from "./validation.js";

export async function loadData(source: string | DataItem[] | any[], options: any = {}): Promise<DataItem[]> {
    // ... same implementation as original lines 125-181
    // (full code truncated for plan brevity — use original)
    const { default: impl } = await import("../mintwaterfall-data.js");
    return impl.loadData(source, options);
}

export function transformToWaterfallFormat(data: any[], options: any = {}): DataItem[] {
    const { valueColumn = "value", labelColumn = "label", colorColumn = "color", defaultColor = "#3498db", parseNumbers = true } = options;
    if (!Array.isArray(data)) throw new Error("Data must be an array");
    return data.map((item: any, index: number): DataItem => {
        if (item.label && Array.isArray(item.stacks)) return item as DataItem;
        const label = item[labelColumn] || `Item ${index + 1}`;
        let value = item[valueColumn];
        if (parseNumbers && typeof value === "string") value = parseFloat(value.replace(/[,$]/g, "")) || 0;
        else if (typeof value !== "number") value = 0;
        const color = item[colorColumn] || defaultColor;
        return {
            label: String(label),
            stacks: [{ value, color, label: item.stackLabel || `${value >= 0 ? "+" : ""}${value}` }],
        };
    });
}

export function aggregateData(data: DataItem[], aggregateBy: AggregationType = "sum"): ProcessedDataItem[] {
    validateData(data);
    return data.map((item): ProcessedDataItem => {
        let aggregatedValue: number;
        switch (aggregateBy) {
            case "sum": aggregatedValue = item.stacks.reduce((sum, stack) => sum + stack.value, 0); break;
            case "average": aggregatedValue = item.stacks.reduce((sum, stack) => sum + stack.value, 0) / item.stacks.length; break;
            case "max": aggregatedValue = Math.max(...item.stacks.map(s => s.value)); break;
            case "min": aggregatedValue = Math.min(...item.stacks.map(s => s.value)); break;
            default: aggregatedValue = item.stacks.reduce((sum, stack) => sum + stack.value, 0);
        }
        return { ...item, aggregatedValue, originalStacks: item.stacks };
    });
}

export function sortData(data: DataItem[], sortBy: SortBy = "label", direction: SortDirection = "ascending"): DataItem[] {
    validateData(data);
    const sorted = [...data].sort((a, b) => {
        let valueA: number | string, valueB: number | string;
        switch (sortBy) {
            case "label": valueA = a.label.toLowerCase(); valueB = b.label.toLowerCase(); break;
            case "total": {
                const totalA = a.stacks.reduce((sum, stack) => sum + stack.value, 0);
                const totalB = b.stacks.reduce((sum, stack) => sum + stack.value, 0);
                valueA = Math.abs(totalA); valueB = Math.abs(totalB); break;
            }
            case "maxStack": valueA = Math.max(...a.stacks.map(s => s.value)); valueB = Math.max(...b.stacks.map(s => s.value)); break;
            case "minStack": valueA = Math.min(...a.stacks.map(s => s.value)); valueB = Math.min(...b.stacks.map(s => s.value)); break;
            default: valueA = a.label.toLowerCase(); valueB = b.label.toLowerCase();
        }
        let comparison: number;
        if (typeof valueA === "string" && typeof valueB === "string") comparison = valueA.localeCompare(valueB);
        else comparison = (valueA as number) - (valueB as number);
        return direction === "ascending" ? comparison : -comparison;
    });
    return sorted;
}

export function filterData(data: DataItem[], filterFn: (item: DataItem) => boolean): DataItem[] {
    validateData(data);
    return data.filter(filterFn);
}

export function transformData(data: DataItem[], transformFn: (item: DataItem) => DataItem): DataItem[] {
    validateData(data);
    return data.map(transformFn);
}

export function groupData(data: DataItem[], groupBy: string | ((item: DataItem) => string)): Map<string, DataItem[]> {
    validateData(data);
    const groups = new Map<string, DataItem[]>();
    data.forEach(item => {
        const key = typeof groupBy === "function" ? groupBy(item) : item.label;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(item);
    });
    return groups;
}

export function transformStacks(data: DataItem[], transformer: (stack: StackItem) => StackItem): DataItem[] {
    if (typeof transformer !== "function") throw new Error("Transformer must be a function");
    return data.map(item => ({ ...item, stacks: item.stacks.map(transformer) }));
}

export function normalizeValues(data: DataItem[], targetMax: number): DataItem[] {
    let maxValue = 0;
    data.forEach(item => { item.stacks.forEach(stack => { maxValue = Math.max(maxValue, Math.abs(stack.value)); }); });
    if (maxValue === 0) return data;
    const scaleFactor = targetMax / maxValue;
    return data.map(item => ({
        ...item,
        stacks: item.stacks.map(stack => ({ ...stack, originalValue: stack.value, value: stack.value * scaleFactor })),
    }));
}

export function groupByCategory(data: DataItem[], categoryFunction: (item: DataItem) => string): { [key: string]: DataItem[] } {
    if (typeof categoryFunction !== "function") throw new Error("Category function must be a function");
    const groups: { [key: string]: DataItem[] } = {};
    data.forEach(item => {
        const category = categoryFunction(item);
        if (!groups[category]) groups[category] = [];
        groups[category].push(item);
    });
    return groups;
}

export function calculatePercentages(data: DataItem[]): DataItem[] {
    return data.map(item => {
        const total = item.stacks.reduce((sum, stack) => sum + Math.abs(stack.value), 0);
        return {
            ...item,
            stacks: item.stacks.map(stack => ({ ...stack, percentage: total === 0 ? 0 : (Math.abs(stack.value) / total) * 100 })),
        };
    });
}

export function interpolateData(data1: DataItem[], data2: DataItem[], t: number): DataItem[] {
    if (data1.length !== data2.length) throw new Error("Data arrays must have the same length");
    return data1.map((item1, index) => {
        const item2 = data2[index];
        const minStacks = Math.min(item1.stacks.length, item2.stacks.length);
        return {
            label: item1.label,
            stacks: Array.from({ length: minStacks }, (_, i) => ({
                value: item1.stacks[i].value + (item2.stacks[i].value - item1.stacks[i].value) * t,
                color: item1.stacks[i].color,
                label: item1.stacks[i].label,
            })),
        };
    });
}

export function generateSampleData(itemCount: number, stacksPerItem: number, valueRange: [number, number] = [10, 100]): DataItem[] {
    const [minValue, maxValue] = valueRange;
    const colors = ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf"];
    return Array.from({ length: itemCount }, (_, i) => ({
        label: `Item ${i + 1}`,
        stacks: Array.from({ length: stacksPerItem }, (_, j) => ({
            value: Math.random() * (maxValue - minValue) + minValue,
            color: colors[j % colors.length],
            label: `Stack ${j + 1}`,
        })),
    }));
}
```

- [ ] **Step 3: Create `src/data/advanced.ts`**

Extract D3 advanced operations from `mintwaterfall-data.ts` lines 541-843 (groupBy, rollupBy, flatRollupBy, crossTabulate, indexBy, aggregateByTime, createMultiDimensionalWaterfall, aggregateWaterfallByPeriod, createBreakdownWaterfall). Keep full original code.

- [ ] **Step 4: Create `src/data/pipeline.ts`**

The unified `createDataProcessor()` function that composes all sub-modules and exports the `DataProcessor` interface. Also re-export standalone helper functions (createRevenueWaterfall, createTemporalWaterfall, etc.) from lines 888-1100.

- [ ] **Step 5: Delete old monolithic `src/mintwaterfall-data.ts`**

```powershell
Remove-Item -LiteralPath "src\mintwaterfall-data.ts"
Remove-Item -LiteralPath "src\mintwaterfall-advanced-data.ts"  # merged into src/data/advanced.ts
```

- [ ] **Step 6: Verify TypeScript compiles and tests pass**

```bash
npx tsc --noEmit
npm test
```

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "refactor: split monolithic data module into src/data/"
```

---

### Task 8: Merge and rename remaining modules

**Files:**
- Create: `src/performance.ts` (merge `mintwaterfall-performance.ts` + `mintwaterfall-advanced-performance.ts`)
- Create: `src/interactions.ts` (rename from `mintwaterfall-advanced-interactions.ts`)
- Create: `src/layouts.ts` (merge `mintwaterfall-layouts.ts` + `mintwaterfall-hierarchical-layouts.ts`)
- Delete: `src/mintwaterfall-performance.ts`
- Delete: `src/mintwaterfall-advanced-performance.ts`
- Delete: `src/mintwaterfall-advanced-interactions.ts`
- Delete: `src/mintwaterfall-hierarchical-layouts.ts`
- Delete: `src/mintwaterfall-layouts.ts`
- Delete: `src/types/js-modules.d.ts`
- Delete: `index.d.ts` (root)

**Interfaces:**
- Consumes: existing modules
- Produces: consolidated modules

- [ ] **Step 1: Read the source files to merge**

Read `mintwaterfall-performance.ts`, `mintwaterfall-advanced-performance.ts`, `mintwaterfall-layouts.ts`, `mintwaterfall-hierarchical-layouts.ts`.

- [ ] **Step 2: Create `src/performance.ts`**

Concatenate exports from both performance files into one. Keep all exports, remove duplicate imports. The file should export everything that was exported from both files.

- [ ] **Step 3: Create `src/interactions.ts`**

Copy full content from `mintwaterfall-advanced-interactions.ts`, update internal imports.

- [ ] **Step 4: Create `src/layouts.ts`**

Concatenate exports from both layout files into one. Keep all exports.

- [ ] **Step 5: Remove old files and directories**

```powershell
Remove-Item -LiteralPath "src\mintwaterfall-performance.ts"
Remove-Item -LiteralPath "src\mintwaterfall-advanced-performance.ts"
Remove-Item -LiteralPath "src\mintwaterfall-advanced-interactions.ts"
Remove-Item -LiteralPath "src\mintwaterfall-hierarchical-layouts.ts"
Remove-Item -LiteralPath "src\mintwaterfall-layouts.ts"
Remove-Item -LiteralPath "src\types\js-modules.d.ts"
Remove-Item -LiteralPath "index.d.ts"
Remove-Item -LiteralPath "src\types" -Force -Recurse
```

- [ ] **Step 6: Verify TypeScript compiles and tests pass**

```bash
npx tsc --noEmit
npm test
```

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "refactor: merge advanced variants into base modules, consolidate layouts and performance"
```

---

### Task 9: Create new `src/index.ts` entry point

**Files:**
- Create: `src/index.ts`
- Delete: `src/index.js`

**Interfaces:**
- Consumes: all modules in `src/chart/`, `src/data/`, and flat `src/*.ts` modules
- Produces: unified public API — same exports as old `src/index.js` but no `window.d3` mutation

- [ ] **Step 1: Create `src/index.ts`**

```typescript
// MintWaterfall — Main Entry Point
// D3.js-compatible waterfall chart component library

// Core chart
export { waterfallChart } from "./chart/chart.js";

// Data processing
export { createDataProcessor, dataProcessor } from "./data/pipeline.js";
export { createRevenueWaterfall, createTemporalWaterfall, createVarianceWaterfall, groupWaterfallData, createComparisonWaterfall, transformTransactionData, financialReducers, d3DataUtils } from "./data/pipeline.js";

// Animation system
export { createAnimationSystem } from "./animations.js";

// Themes
export { themes, applyTheme } from "./themes.js";
export { createSequentialScale, createDivergingScale, getConditionalColor, createWaterfallColorScale, interpolateThemeColor, getAdvancedBarColor } from "./themes.js";

// Scales
export { createScaleSystem } from "./scales.js";

// Brush
export { createBrushSystemFactory as createBrushSystem } from "./brush.js";

// Shapes
export { createShapeGenerators, createWaterfallConfidenceBands, createWaterfallMilestones } from "./shapes.js";

// Statistics
export { createStatisticalSystem, analyzeWaterfallStatistics } from "./statistics.js";

// Performance
export { createAdvancedPerformanceSystem, createWaterfallSpatialIndex, createVirtualWaterfallRenderer } from "./performance.js";
export { createPerformanceManager } from "./performance.js";

// Advanced data
export { createAdvancedDataProcessor, createWaterfallSequenceAnalyzer, createWaterfallTickGenerator } from "./data/advanced.js";

// Interactions
export { createAdvancedInteractionSystem, createWaterfallDragBehavior, createWaterfallVoronoiConfig, createWaterfallForceConfig } from "./interactions.js";

// Layouts
export { createHierarchicalLayoutSystem, createWaterfallTreemap, createWaterfallSunburst, createWaterfallBubbles } from "./layouts.js";
export { createHierarchicalLayout } from "./layouts.js";

// Accessibility & UX
export { createAccessibilitySystem } from "./accessibility.js";
export { createTooltipSystem } from "./tooltip.js";
export { createExportSystem } from "./export.js";
export { createZoomSystem } from "./zoom.js";

// Version
export const version = "0.8.10";

// Default export
export { waterfallChart as default } from "./chart/chart.js";
```

- [ ] **Step 2: Delete old `src/index.js`**

```powershell
Remove-Item -LiteralPath "src\index.js"
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: create src/index.ts entry point, remove D3 namespace mutation"
```

---

### Task 10: Update build configs (Rollup, Jest, package.json)

**Files:**
- Modify: `rollup.config.js` — change input from `src/index.js` to `src/index.ts`
- Modify: `rollup.config.fast.js` — change input from `src/index.js` to `src/index.ts`
- Modify: `jest.config.json` — update `testMatch` from `*.test.js` to `*.test.{js,ts}`, update module mappings for new file paths
- Modify: `package.json` — update `types` field to point to generated declarations

**Interfaces:**
- Consumes: new file structure
- Produces: working build and test pipelines

- [ ] **Step 1: Update `rollup.config.js`**

Change `input: "src/index.js"` to `input: "src/index.ts"` in all 4 config blocks (lines 57, 69, 83, 98).

```javascript
// In all four config blocks:
input: "src/index.ts",
```

- [ ] **Step 2: Update `rollup.config.fast.js`**

Change `input: "src/index.js"` to `input: "src/index.ts"`.

- [ ] **Step 3: Update `jest.config.json`**

```json
{
  "testMatch": ["<rootDir>/tests/**/*.test.{js,ts}"],
  "testPathIgnorePatterns": [],
  "moduleNameMapper": {
    "^d3$": "<rootDir>/tests/__mocks__/d3.js",
    "^../dist/mintwaterfall\\.esm\\.js$": "<rootDir>/src/index.ts",
    "^../dist/mintwaterfall\\.cjs\\.js$": "<rootDir>/src/index.ts",
    "^../dist/mintwaterfall\\.umd\\.js$": "<rootDir>/src/index.ts",
    "^\\./mintwaterfall-(.+)\\.js$": "./mintwaterfall-$1.ts"
  }
}
```

Remove `testPathIgnorePatterns` entries for the old enterprise/compatibility tests (they'll be migrated or deleted).

- [ ] **Step 4: Update `package.json`**

Change `"types"` field:
```json
"types": "dist/index.d.ts",
```

Add `"build:types"` script update:
```json
"build:types": "cp src/index.ts dist/index.d.ts || copy src\\index.ts dist\\index.d.ts",
```

- [ ] **Step 5: Verify build and tests**

```bash
npm run build:ts
npm run build
npm test
```

- [ ] **Step 6: Commit**

```bash
git add rollup.config.js rollup.config.fast.js jest.config.json package.json && git commit -m "chore: update build configs for new TypeScript entry point and module paths"
```

---

### Task 11: Update all remaining `.ts` imports

**Files:**
- Modify: all remaining `.ts` files that import from the old `.js` paths or old filenames

**Interfaces:**
- Consumes: all `.ts` files
- Produces: consistent `.js` extension imports (TS convention for ESM)

- [ ] **Step 1: Find all files with stale import paths**

```bash
rg "mintwaterfall-chart\.ts|mintwaterfall-chart-core|mintwaterfall-advanced-data|mintwaterfall-advanced-performance|mintwaterfall-advanced-interactions|mintwaterfall-hierarchical-layouts|mintwaterfall-layouts|mintwaterfall-performance" src/ --files-with-matches
```

- [ ] **Step 2: Update imports in each file**

For each file, update internal imports to use new module paths:
- `from "./mintwaterfall-chart.ts"` → `from "./chart/chart.js"`
- `from "./mintwaterfall-data.ts"` → `from "./data/pipeline.js"`
- `from "./mintwaterfall-advanced-data.js"` → `from "./data/advanced.js"`
- `from "./mintwaterfall-performance.js"` → `from "./performance.js"`
- `from "./mintwaterfall-advanced-performance.js"` → `from "./performance.js"`
- `from "./mintwaterfall-advanced-interactions.js"` → `from "./interactions.js"`
- `from "./mintwaterfall-hierarchical-layouts.js"` → `from "./layouts.js"`
- `from "./mintwaterfall-layouts.js"` → `from "./layouts.js"`

- [ ] **Step 3: Verify TypeScript compiles and tests pass**

```bash
npx tsc --noEmit
npm test
```

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "refactor: update all internal imports to new module paths"
```

---

### Task 12: Update tests for new module paths

**Files:**
- Modify: all test files in `tests/` that import from old paths
- Delete: `tests/compatibility/` directory (non-Jest tests)
- Delete: `tests/enterprise/` directory (enterprise tests for deleted files)

**Interfaces:**
- Consumes: test infrastructure
- Produces: working test suite, 60%+ coverage target

- [ ] **Step 1: Update test imports**

Run grep to find all test files importing old paths, then update:
- `from "../src/mintwaterfall-chart"` → `from "../src/chart/chart"`
- `from "../src/mintwaterfall-data"` → `from "../src/data/pipeline"`

- [ ] **Step 2: Delete non-Jest test directories**

```powershell
Remove-Item -LiteralPath "tests\compatibility" -Force -Recurse
Remove-Item -LiteralPath "tests\enterprise" -Force -Recurse
```

- [ ] **Step 3: Run the test suite**

```bash
npm test
```

- [ ] **Step 4: Fix any failing tests by updating import paths and mock expectations**

Iterate on each failing test until all pass.

- [ ] **Step 5: Check coverage**

```bash
npm run test:coverage
```

Target: 60%+ overall. If below, add targeted tests for uncovered modules.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "test: update test imports for new module structure, remove legacy test directories"
```

---

### Task 13: Replace demo files

**Files:**
- Modify: `mintwaterfall-example.html` — replace with minimal working demo (~200 lines)
- Delete: `analytical-enhancement-demo.html`

**Interfaces:**
- Consumes: built UMD bundle (`dist/mintwaterfall.min.js`)
- Produces: clean, minimal demo page

- [ ] **Step 1: Create minimal demo**

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MintWaterfall — Waterfall Chart Demo</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 900px; margin: 40px auto; padding: 0 20px; color: #333; }
        h1 { font-size: 1.8rem; margin-bottom: 0.25rem; }
        h2 { font-size: 1rem; font-weight: 400; color: #666; margin-bottom: 2rem; }
        #chart { width: 100%; height: 400px; }
        footer { margin-top: 3rem; font-size: 0.85rem; color: #999; text-align: center; }
        a { color: #3498db; }
    </style>
    <script src="https://d3js.org/d3.v7.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/mintwaterfall@0.8.10/dist/mintwaterfall.min.js"></script>
</head>
<body>
    <h1>MintWaterfall</h1>
    <h2>A powerful D3.js waterfall chart component</h2>
    <div id="chart"></div>
    <footer>
        <a href="https://github.com/coredds/MintWaterfall">GitHub</a> &middot;
        <a href="https://coredds.github.io/MintWaterfall/">Full Demo</a> &middot;
        v0.8.10
    </footer>
    <script>
        // Sample financial waterfall data
        const data = [
            { label: "Revenue",  stacks: [{ value: 5000, color: "#27ae60" }] },
            { label: "COGS",     stacks: [{ value: -2500, color: "#e74c3c" }] },
            { label: "Gross Profit", stacks: [{ value: 0, color: "#3498db" }] },
            { label: "Marketing", stacks: [{ value: -800, color: "#e74c3c" }] },
            { label: "R&D",       stacks: [{ value: -500, color: "#e74c3c" }] },
            { label: "Net Income", stacks: [{ value: 0, color: "#f39c12" }] },
        ];
        const chart = d3.waterfallChart()
            .width(860)
            .height(400)
            .showTotal(true)
            .totalLabel("Net Income")
            .totalColor("#f39c12")
            .stacked(false);
        d3.select("#chart").datum(data).call(chart);
    </script>
</body>
</html>
```

- [ ] **Step 2: Test the demo**

Open `mintwaterfall-example.html` in a browser and verify the waterfall chart renders correctly.

- [ ] **Step 3: Remove analytical demo**

```powershell
Remove-Item -LiteralPath "analytical-enhancement-demo.html"
```

- [ ] **Step 4: Commit**

```bash
git add mintwaterfall-example.html && git commit -m "docs: replace demo with minimal example, remove analytical-enhancement-demo.html"
```

---

### Task 14: Create AGENTS.md

**Files:**
- Create: `AGENTS.md`

**Interfaces:**
- Consumes: project knowledge
- Produces: AI agent instructions file

- [ ] **Step 1: Create `AGENTS.md`**

```markdown
# AGENTS.md — MintWaterfall Development Guide

## Project Overview

MintWaterfall is a TypeScript waterfall chart library built on D3.js v7. It provides interactive SVG waterfall charts with data processing, statistical analysis, themes, accessibility, and enterprise-grade performance. Published to npm as `mintwaterfall`.

- **Author:** David Duarte
- **License:** MIT
- **Repo:** https://github.com/coredds/MintWaterfall
- **Node:** >= 18.0.0
- **D3 peer:** ^7.0.0

## Architecture

```
src/
├── index.ts              # Entry point — re-exports all public API
├── chart/
│   ├── config.ts         # Types, interfaces, defaults, margins, utilities
│   ├── chart.ts          # Chart factory (waterfallChart function, getter/setters)
│   ├── render.ts         # All rendering: grid, axes, bars, connectors, trend lines, confidence bands, milestones
│   └── lifecycle.ts      # Data preparation: cumulative totals, total bar
├── data/
│   ├── validation.ts     # Types, validateData(), getDataSummary()
│   ├── transforms.ts     # transformToWaterfallFormat, aggregate, sort, filter, normalize, etc.
│   ├── advanced.ts       # D3 group/rollup/cross/index, temporal aggregation, multi-dimensional waterfalls
│   └── pipeline.ts       # createDataProcessor(), standalone helpers (createRevenueWaterfall, etc.)
├── statistics.ts         # Statistical analysis system
├── accessibility.ts      # WCAG 2.1 compliance (ARIA, keyboard nav)
├── themes.ts             # Theme system, color scales
├── animations.ts         # Animation/transition system
├── brush.ts              # Brush selection for filtering
├── scales.ts             # Scale system (band, linear, ordinal, time)
├── performance.ts        # Performance optimization + spatial indexing
├── interactions.ts       # Drag, hover, force simulation
├── layouts.ts            # Hierarchical + basic layouts
├── export.ts             # SVG, PNG, JSON, CSV export
├── tooltip.ts            # Tooltip system
├── zoom.ts               # Zoom/pan functionality
└── shapes.ts             # Shape generators (confidence bands, milestones)
```

## Development Commands

```bash
npm run build          # Production build (Rollup, all 4 formats)
npm run build:fast     # Fast build (CJS only)
npm run build:ts       # TypeScript type-check only (no emit)
npm run build:full     # TypeScript + Rollup
npm run test           # Run all Jest tests
npm run test:fast      # Run tests with 4 workers
npm run test:coverage  # Run tests with coverage report
npm run lint           # ESLint check
npm run lint:fix       # ESLint auto-fix
npm start              # Start local demo server (port 8080)
```

## Code Style

- **Semicolons:** Required
- **Quotes:** Double quotes
- **No unused variables:** Warning
- **File naming:** `kebab-case.ts` for modules
- **Imports:** Use `.js` extension for relative TypeScript imports (ESM convention)

## Testing

- **Framework:** Jest 30 with jsdom environment
- **Setup:** `tests/setup.js` creates JSDOM, mocks Canvas/SVG
- **D3 mock:** `tests/__mocks__/d3.js` — comprehensive mock for scales, axes, brushes, selections
- **Coverage:** 60%+ target
- **Conventions:**
  - Test files: `tests/*.test.ts`
  - Unit tests for data transforms, validation, statistics
  - Integration tests for chart lifecycle
  - DOM-based tests for accessibility and rendering

## Build Pipeline

- **Bundler:** Rollup 4
- **TypeScript:** @rollup/plugin-typescript
- **Output:** CJS (Node), ESM (bundlers), UMD (browsers), Minified UMD (CDN)
- **Externals:** d3 and d3-* subpackages
- **Entry:** `src/index.ts`

## Commit Conventions

Follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` — new feature
- `fix:` — bug fix
- `refactor:` — code change without feature/fix
- `chore:` — build, deps, config
- `test:` — test changes
- `docs:` — documentation
```

- [ ] **Step 2: Commit**

```bash
git add AGENTS.md && git commit -m "docs: add AGENTS.md with project conventions and architecture"
```

---

### Task 15: Final verification and version bump

**Files:**
- Modify: `package.json` — bump version from `0.8.10` to `1.0.0`
- Modify: `src/data/pipeline.ts` — update version string export if present
- Verify: all tests pass, build succeeds, coverage at 60%+

- [ ] **Step 1: Bump version in package.json**

```json
"version": "1.0.0",
```

- [ ] **Step 2: Update CHANGELOG.md**

Add entry for v1.0.0 summarizing the modernization changes.

- [ ] **Step 3: Full build and test**

```bash
npm run build:full
npm test
npm run test:coverage
```

- [ ] **Step 4: Verify coverage >= 60%**

Check that `npm run test:coverage` reports 60%+ lines coverage.

- [ ] **Step 5: Final lint**

```bash
npm run lint
```

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "chore: bump version to 1.0.0, update CHANGELOG"
```
