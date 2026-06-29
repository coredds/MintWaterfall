# Task 4: Create src/chart/lifecycle.ts

**Files:**
- Create: `src/chart/lifecycle.ts`

Extract `prepareData()` from `src/mintwaterfall-chart.ts` lines 764-811 into a standalone module.

## Steps

- [ ] **Step 1: Create `src/chart/lifecycle.ts`**

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

## Global Constraints

- No public API breakage
- All 4 build output formats must build: CJS, ESM, UMD, minified UMD
- No dependency version bumps
- No new features
