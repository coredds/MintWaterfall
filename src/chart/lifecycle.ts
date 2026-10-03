// MintWaterfall Chart Lifecycle — data preparation
import { ChartConfig, ProcessedData, ChartData } from "./config.js";

/**
 * Compute running totals for each bar.
 *
 * - Regular bars move the running total by the sum of their stack values.
 * - `subtotal` bars show the running total at that point (drawn from zero) and do
 *   not change it.
 * - When `config.showTotal` is set, a final total bar is appended.
 */
export function prepareData(
    data: ChartData[],
    config: Pick<ChartConfig, "showTotal" | "totalLabel" | "totalColor">
): ProcessedData[] {
    let cumulativeTotal = 0;

    const processedData: ProcessedData[] = data.map(bar => {
        if (bar.subtotal) {
            const color = bar.stacks?.[0]?.color ?? config.totalColor;
            return {
                ...bar,
                stacks: [{ value: cumulativeTotal, color, label: bar.stacks?.[0]?.label }],
                barTotal: cumulativeTotal,
                cumulativeTotal,
                prevCumulativeTotal: 0,
                isSubtotal: true,
            };
        }

        const stacks = bar.stacks || [];
        const barTotal = stacks.reduce((sum, stack) => sum + stack.value, 0);
        const prevCumulativeTotal = cumulativeTotal;
        cumulativeTotal += barTotal;

        return {
            ...bar,
            stacks,
            barTotal,
            cumulativeTotal,
            prevCumulativeTotal,
        };
    });

    if (config.showTotal && processedData.length > 0) {
        processedData.push({
            label: config.totalLabel,
            stacks: [{ value: cumulativeTotal, color: config.totalColor }],
            barTotal: cumulativeTotal,
            cumulativeTotal,
            prevCumulativeTotal: 0,
            isTotal: true,
        });
    }

    return processedData;
}
