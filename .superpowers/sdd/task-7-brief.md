# Task 7: Split data module into src/data/

**Files:**
- Create: `src/data/validation.ts`
- Create: `src/data/transforms.ts`
- Create: `src/data/advanced.ts`
- Create: `src/data/pipeline.ts`
- Delete: `src/mintwaterfall-data.ts`
- Delete: `src/mintwaterfall-advanced-data.ts`

This splits the 1100-line `src/mintwaterfall-data.ts` into focused sub-modules and creates a composite `pipeline.ts` entry point.

## Step 1: Create `src/data/validation.ts`

Extract from `src/mintwaterfall-data.ts`:
- Type definitions (lines 7-67): StackItem, DataItem, ProcessedDataItem, LoadDataOptions, TransformOptions, TimeScaleOptions, OrdinalScaleOptions, BandScaleOptions, AggregationType, SortDirection, SortBy, RawDataItem, DataSummary
- `validateData()` (lines 259-299)
- `getDataSummary()` (lines 384-416)

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

export interface TimeScaleOptions {
    range?: [number, number];
    nice?: boolean;
    tickFormat?: string | "auto";
}

export interface OrdinalScaleOptions {
    range?: string[];
    unknown?: string;
}

export interface BandScaleOptions {
    padding?: number;
    paddingInner?: number | null;
    paddingOuter?: number | null;
    align?: number;
}

export type AggregationType = "sum" | "average" | "max" | "min";
export type SortDirection = "ascending" | "descending";
export type SortBy = "label" | "total" | "maxStack" | "minStack";

export interface RawDataItem {
    [key: string]: any;
}

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

## Step 2: Create `src/data/transforms.ts`

Extract from `src/mintwaterfall-data.ts`:
- `transformToWaterfallFormat()` (lines 184-228)
- `aggregateData()` (lines 301-330)
- `sortData()` (lines 332-377)
- `filterData()` (lines 379-382)
- `transformData()` (lines 418-421)
- `groupData()` (lines 423-439)
- `transformStacks()` (lines 441-450)
- `normalizeValues()` (lines 452-473)
- `groupByCategory()` (lines 475-491)
- `calculatePercentages()` (lines 493-505)
- `interpolateData()` (lines 507-525)
- `generateSampleData()` (lines 527-539)

Also extract `loadData()` from lines 125-181. Use the EXACT original code, changing only imports to point to `./validation.js`.

## Step 3: Create `src/data/advanced.ts`

Extract from `src/mintwaterfall-data.ts` lines 541-843 (all D3 advanced operations):
- Type definitions: GroupByFunction, GroupByKeys, ReduceFunction, GroupedData, NestedGroupedData, RollupData, NestedRollupData, CrossTabResult, IndexMap, NestedIndexMap, TemporalOptions, AdvancedDataOperations
- `groupBy()`, `rollupBy()`, `flatRollupBy()`, `crossTabulate()`, `indexBy()`
- `aggregateByTime()`, `createMultiDimensionalWaterfall()`, `aggregateWaterfallByPeriod()`, `createBreakdownWaterfall()`

Use the EXACT original code, changing only imports to point to `./validation.js`.

## Step 4: Create `src/data/pipeline.ts`

This is the composite module that:
1. Imports all sub-modules
2. Exports `createDataProcessor()` which composes all operations
3. Exports `dataProcessor` (default instance)
4. Re-exports ALL standalone helper functions from lines 888-1100 of the original:
   - `createRevenueWaterfall()`
   - `createTemporalWaterfall()`
   - `createVarianceWaterfall()`
   - `groupWaterfallData()`
   - `createComparisonWaterfall()`
   - `transformTransactionData()`
   - `financialReducers`
   - `d3DataUtils`
5. Exports `DataProcessor` interface and all type re-exports needed by consumers

The `createDataProcessor()` function body should be copied verbatim from the original (lines 257-882), with internal calls updated to use the local module functions. The `loadDataWrapper` and `transformToWaterfallFormatWrapper` wrappers should call the imported standalone functions directly.

## Step 5: Delete old files

```powershell
Remove-Item -LiteralPath "src\mintwaterfall-data.ts"
Remove-Item -LiteralPath "src\mintwaterfall-advanced-data.ts"
```

## Step 6: Verify

```bash
npx tsc --noEmit
```
Fix any TS errors in the new `src/data/` files. Errors in `src/index.js` (which still imports from deleted files) are expected.

## Step 7: Commit

```bash
git add src/data/ && git add -A && git commit -m "refactor: split monolithic data module into src/data/"
```

## Global Constraints
- No public API breakage — all existing exports remain
- All 4 build output formats must build
- No dependency version bumps
- No new features
- Node >= 18.0.0, D3 peer ^7.0.0

## IMPORTANT
- Copy original code VERBATIM from `src/mintwaterfall-data.ts`. Read it, don't guess.
- Only change import paths (e.g., `./validation.js` instead of internal references).
- The `createDataProcessor()` in pipeline.ts must return the exact same API surface.
- Make sure directory `src/data/` exists before writing files.