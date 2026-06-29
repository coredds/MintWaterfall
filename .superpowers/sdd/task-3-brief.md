# Task 3: Create src/chart/render.ts

**Files:**
- Create: `src/chart/render.ts`

This task extracts all rendering functions from `src/mintwaterfall-chart.ts` into a new file. 

## Steps

- [ ] **Step 1: Read the existing render code to understand what to extract**

Read `src/mintwaterfall-chart.ts` lines 824-1912 (the drawGrid, drawAxes, drawBars, drawStackedBars, drawWaterfallBars, drawValueLabels, drawConnectors, drawTrendLine, drawConfidenceBands, drawMilestones functions). Also read the shapes imports needed.

Also read `src/mintwaterfall-shapes.ts` to understand what `createWaterfallConfidenceBands` and `createWaterfallMilestones` export and their signatures.

Also read `src/mintwaterfall-themes.ts` to find `getAdvancedBarColor` and `ThemeCollection` exports.

- [ ] **Step 2: Create `src/chart/render.ts`**

Create the file with these functions, each refactored to take a `ChartConfig` object instead of closure variables:

1. `drawGrid(container, yScale, config, margins)` — extracts duration/ease/width from config
2. `drawAxes(container, xScale, yScale, config, margins)` — extracts duration/ease/formatNumber/width/height
3. `drawBars(container, processedData, xScale, yScale, config, margins)` — dispatches to stacked or waterfall
4. `drawStackedBars(barGroups, xScale, yScale, config, margins)` — stacked bar rendering
5. `drawWaterfallBars(barGroups, xScale, yScale, config, margins, allData)` — waterfall bar rendering with color
6. `drawValueLabels(barGroups, xScale, yScale, config, margins)` — value labels on bars
7. `drawConnectors(container, processedData, xScale, yScale, config)` — connector lines between bars
8. `drawTrendLine(container, processedData, xScale, yScale, config)` — trend lines (linear, moving-avg, polynomial)
9. `drawConfidenceBands(container, processedData, xScale, yScale, config)` — confidence bands
10. `drawMilestones(container, processedData, xScale, yScale, config)` — milestone markers

**Key refactoring:** Each function was previously a closure inside `waterfallChart()` that accessed variables like `width`, `height`, `duration`, `ease`, etc. from the outer scope. Now each function receives a full `ChartConfig` object and destructures what it needs.

**Import from existing codebase:** Copy the exact rendering logic from `src/mintwaterfall-chart.ts`. Do not rewrite the logic — just extract it and change closure variable references to `config.XXX`.

**External dependencies:**
- `createWaterfallConfidenceBands`, `createWaterfallMilestones` from `../shapes.js`
- `getAdvancedBarColor`, `ThemeCollection` from `../themes.js`

The render function should handle the edge case where these imports may return undefined (graceful degradation).

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
If `src/chart/render.ts` has errors, fix them. Errors in other files (like `mintwaterfall-chart.ts` which still exists) are OK at this stage.

- [ ] **Step 4: Commit**

```bash
git add src/chart/render.ts && git commit -m "feat: extract chart rendering functions into src/chart/render.ts"
```

## Global Constraints

- No public API breakage
- All 4 build output formats must build: CJS, ESM, UMD, minified UMD  
- No dependency version bumps
- No new features
- No CSS/styling changes
- Node >= 18.0.0, D3 peer ^7.0.0

## Reference

The existing rendering code is in `src/mintwaterfall-chart.ts` in these functions:
- `drawGrid`: lines 824-863
- `drawAxes`: lines 865-891
- `drawBars`: lines 893-950
- `drawStackedBars`: lines 952-1029
- `drawWaterfallBars`: lines 1031-1089
- `drawValueLabels`: lines 1091-1154
- `drawConnectors`: lines 1156-1215
- `drawTrendLine`: lines 1217-1364
- `addBrushSelection`: line 1366-1368 (stub)
- `drawConfidenceBands`: lines 1781-1864
- `drawMilestones`: lines 1866-1912

The shapes module is at `src/mintwaterfall-shapes.ts` — find and use `createWaterfallConfidenceBands` and `createWaterfallMilestones`.
The themes module is at `src/mintwaterfall-themes.ts` — find and use `getAdvancedBarColor` and `ThemeCollection`.