# Task 8: Merge and Rename Remaining Source Modules

**Commit:** `1e4d022`
**Branch:** `modernize`
**Status:** Complete

## Summary

Merged advanced variant modules into their base counterparts and consolidated layouts and performance modules, reducing 5 source files to 3.

## Changes

### Created Files
- `src/performance.ts` — merged `mintwaterfall-performance.ts` + `mintwaterfall-advanced-performance.ts`
  - Renamed conflicting `PerformanceMetrics` (advanced variant) to `AdvancedPerformanceMetrics`
- `src/interactions.ts` — renamed from `mintwaterfall-advanced-interactions.ts` (no conflict resolution needed)
- `src/layouts.ts` — merged `mintwaterfall-layouts.ts` + `mintwaterfall-hierarchical-layouts.ts`
  - Renamed conflicting `HierarchicalData` (advanced variant) to `AdvancedHierarchicalData`

### Deleted Files
- `src/mintwaterfall-performance.ts`
- `src/mintwaterfall-advanced-performance.ts`
- `src/mintwaterfall-advanced-interactions.ts`
- `src/mintwaterfall-hierarchical-layouts.ts`
- `src/mintwaterfall-layouts.ts`
- `index.d.ts`
- `src/types/js-modules.d.ts`
- `src/types/` (directory)

### Updated Files
- `src/index.js` — fixed import paths for all renamed modules, removed `window.d3.waterfallChart` assignment
- `src/chart/chart.ts` — fixed stale import `../mintwaterfall-performance.js` → `../performance.js`

## TypeScript Check

`npx tsc --noEmit` passes with zero errors.
