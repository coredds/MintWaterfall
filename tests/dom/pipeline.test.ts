/**
 * Data pipeline helpers (src/data/pipeline.ts) with the real D3.
 */
import {
    createDataProcessor,
    dataProcessor,
    createRevenueWaterfall,
    createTemporalWaterfall,
    createVarianceWaterfall,
    groupWaterfallData,
    createComparisonWaterfall,
    transformTransactionData,
    financialReducers,
    d3DataUtils,
} from "../../src/data/pipeline.js";
import { waterfallChart } from "../../src/chart/chart.js";
import * as d3 from "d3";

const values = (rows: Array<{ stacks: Array<{ value: number }> }>) => rows.map(r => r.stacks.map(s => s.value));
const labels = (rows: Array<{ label: string }>) => rows.map(r => r.label);

const sales = [
    { region: "N", product: "A", revenue: 10 },
    { region: "N", product: "B", revenue: 5 },
    { region: "S", product: "A", revenue: 7 },
];

describe("createDataProcessor", () => {
    test("exposes the documented operations", () => {
        const proc = createDataProcessor();
        for (const name of [
            "validateData",
            "loadData",
            "transformToWaterfallFormat",
            "aggregateData",
            "sortData",
            "filterData",
            "getDataSummary",
            "groupBy",
            "rollupBy",
            "flatRollupBy",
            "crossTabulate",
            "indexBy",
            "aggregateByTime",
            "createMultiDimensionalWaterfall",
            "aggregateWaterfallByPeriod",
            "createBreakdownWaterfall",
        ]) {
            expect(typeof (proc as any)[name]).toBe("function");
        }
        expect(typeof dataProcessor.sortData).toBe("function");
    });

    test("loadData accepts arrays and transformToWaterfallFormat maps fields", async () => {
        const rows = await createDataProcessor().loadData([{ label: "A", stacks: [{ value: 1 }] }]);
        expect(rows).toHaveLength(1);
        const out = createDataProcessor().transformToWaterfallFormat([{ name: "X", amount: 4 }], { labelColumn: "name", valueColumn: "amount" });
        expect(labels(out)).toEqual(["X"]);
        expect(values(out)).toEqual([[4]]);
    });
});

describe("standalone helpers", () => {
    test("createRevenueWaterfall flattens dimensions into labelled rows", () => {
        const out = createRevenueWaterfall(sales, ["region", "product"]);
        expect(labels(out)).toEqual(["N → A", "N → B", "S → A"]);
        expect(values(out)).toEqual([[10], [5], [7]]);
    });

    test("createTemporalWaterfall rolls values up by period", () => {
        const out = createTemporalWaterfall(
            [
                { date: "2024-01-10T12:00:00", v: 1 },
                { date: "2024-01-20T12:00:00", v: 2 },
                { date: "2024-03-15T12:00:00", v: 4 },
            ],
            "date",
            "v",
            "month"
        );
        expect(values(out)).toEqual([[3], [4]]);
        expect(out[0].label).toMatch(/2024-01/);
        expect(out[1].label).toMatch(/2024-03/);
    });

    test("createVarianceWaterfall: actual minus budget, coloured and labelled by sign", () => {
        const out = createVarianceWaterfall(
            [
                { cat: "Sales", actual: 120, budget: 100 },
                { cat: "Costs", actual: 80, budget: 90.5 },
                { cat: "Other" },
            ],
            "cat"
        );
        expect(labels(out)).toEqual(["Sales", "Costs", "Other"]);
        expect(values(out)).toEqual([[20], [-10.5], [0]]);
        expect(out[0].stacks[0]).toMatchObject({ color: "#2ecc71", label: "Variance: +20.00" });
        expect(out[1].stacks[0]).toMatchObject({ color: "#e74c3c", label: "Variance: −10.50" });
    });

    test("groupWaterfallData sums each group", () => {
        const out = groupWaterfallData(sales, [d => d.region], d => d.revenue);
        expect(labels(out)).toEqual(["N", "S"]);
        expect(values(out)).toEqual([[15], [7]]);
        const nested = groupWaterfallData(sales, [d => d.region, d => d.product], d => d.revenue);
        expect(labels(nested)).toEqual(["N → A", "N → B", "S → A"]);
        expect(values(nested)).toEqual([[10], [5], [7]]);
    });

    test("groupWaterfallData labelAccessor labels each group from its first record", () => {
        const regions = [
            { region: "N", name: "North", revenue: 10 },
            { region: "S", name: "South", revenue: 7 },
            { region: "N", name: "North", revenue: 5 },
        ];
        const out = groupWaterfallData(regions, [d => d.region], d => d.revenue, d => `${d.name} region`);
        expect(labels(out)).toEqual(["North region", "South region"]);
        expect(values(out)).toEqual([[15], [7]]);
        expect(out[1].stacks[0].label).toBe("+7.00");
    });

    test("createComparisonWaterfall: change vs. the previous period (missing = 0)", () => {
        const out = createComparisonWaterfall(
            [
                { k: "a", v: 10 },
                { k: "b", v: 3 },
            ],
            [{ k: "a", v: 12 }],
            d => d.k,
            d => d.v
        );
        expect(values(out)).toEqual([[-2], [3]]);
        expect(out[0].stacks[0].label).toBe("Change: −2.00");
    });

    test("transformTransactionData: one level sums, two levels stack by subcategory", () => {
        const tx = [
            { c: "x", s: "a", amount: 2 },
            { c: "x", s: "b", amount: 3 },
            { c: "y", s: "a", amount: -1 },
        ];
        const flat = transformTransactionData(tx, "c");
        expect(labels(flat)).toEqual(["x", "y"]);
        expect(values(flat)).toEqual([[5], [-1]]);
        const nested = transformTransactionData(tx, "c", "s");
        expect(values(nested)).toEqual([[2, 3], [-1]]);
        expect(nested[0].stacks.map(s => s.label)).toEqual(["a: +2.00", "b: +3.00"]);
    });

    test("helpers produce data the chart renders", () => {
        const div = document.body.appendChild(document.createElement("div"));
        const data = createVarianceWaterfall([{ cat: "A", actual: 5, budget: 2 }, { cat: "B", actual: 1, budget: 4 }], "cat");
        d3.select(div).datum(data).call(waterfallChart().duration(0) as any);
        expect(div.querySelectorAll("g.bar-group")).toHaveLength(2);
        div.remove();
    });
});

describe("financialReducers", () => {
    const rows = [
        { value: 10, weight: 1 },
        { value: 20, weight: 3 },
        { value: 30 },
    ];

    test("sum, average, variance", () => {
        expect(financialReducers.sum(rows)).toBe(60);
        expect(financialReducers.average(rows)).toBe(20);
        expect(financialReducers.variance(rows)).toBeCloseTo(200 / 3, 10); // population variance
        expect(financialReducers.average([])).toBe(0);
        expect(financialReducers.variance([])).toBe(0);
    });

    test("weightedAverage ignores unweighted rows and handles zero weight", () => {
        expect(financialReducers.weightedAverage(rows)).toBe((10 + 60) / 4);
        expect(financialReducers.weightedAverage([{ value: 5 }])).toBe(0);
        expect(financialReducers.weightedAverage([{ value: 5, w: 2 }], "w")).toBe(5);
    });

    test("percentile", () => {
        expect(financialReducers.percentile(50)(rows)).toBe(20);
        expect(financialReducers.percentile(100)(rows)).toBe(30);
        expect(financialReducers.percentile(50)([])).toBe(0);
    });
});

test("d3DataUtils re-exports the D3 functions", () => {
    expect(d3DataUtils.group).toBe(d3.group);
    expect(d3DataUtils.extent([3, 1, 2])).toEqual([1, 3]);
});
