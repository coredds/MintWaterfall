// Compile-time tests for the public typings. Checked by `npm run typecheck`
// (tsc -p tests/types); nothing here runs. `@ts-expect-error` lines must stay errors.
import { waterfallChart, type ChartData, type ProcessedData } from "../../src/index.js";

const chart = waterfallChart();

// Event handlers get typed arguments
chart.on("barClick", (event, d) => {
    const label: string = d.label;
    const total: number = d.barTotal;
    const isTotal: boolean | undefined = d.isTotal;
    void event.type;
    void label;
    void total;
    void isTotal;
});
chart.on("chartUpdate", data => {
    const first: ProcessedData | undefined = data[0];
    void first;
});
chart.on("brushSelection", (_event, selected) => {
    const n: number = selected.length;
    void n;
});

// Namespaced events keep the same handler type
chart.on("barMouseover.analytics", (_event, d) => void d.cumulativeTotal);

// Removing a listener and reading one back
chart.on("barClick", null);
const handler = chart.on("barFocus");
void handler;

// @ts-expect-error unknown event names are rejected
chart.on("barDoubleClick", () => {});

// @ts-expect-error chartUpdate receives processed data, not an event
chart.on("chartUpdate", (event: MouseEvent) => void event);

// Literal-typed settings
chart.theme("dark").trendLineType("moving-average").trendLineStyle("dotted");
chart.theme(null);
// @ts-expect-error not a built-in theme
chart.theme("neon");
// @ts-expect-error not a trend line type
chart.trendLineType("exponential");

// Data typing: subtotal bars may omit stacks; colors are optional
const data: ChartData[] = [
    { label: "Revenue", stacks: [{ value: 100 }] },
    { label: "Gross", subtotal: true },
];
// @ts-expect-error value must be a number
const bad: ChartData[] = [{ label: "x", stacks: [{ value: "1" }] }];
void data;
void bad;

// New step 6 options are typed
chart
    .valueLabel((d, text) => (d.isStart ? "" : text))
    .tooltipContent((d, html) => html + d.label)
    .showLegend(true);
chart.theme("auto");
// @ts-expect-error valueLabel must return a string
chart.valueLabel(d => d.barTotal);
const opening: ChartData = { label: "Opening", start: true, stacks: [{ value: 5 }] };
void opening;

chart.orientation("horizontal");
// @ts-expect-error not an orientation
chart.orientation("diagonal");

// Confidence bands and milestones (partial updates are merged)
chart
    .confidenceBands({ enabled: true, scenarios: { optimistic: [{ label: "A", value: 1 }], pessimistic: [] } })
    .confidenceBands({ opacity: 0.3 })
    .enableMilestones(true)
    .addMilestone({ label: "A", value: 10, type: "target", description: "Plan" })
    .milestones({ milestones: [] });
const bandsOn: boolean = chart.confidenceBands().enabled;
const milestoneCount: number = chart.milestones().milestones.length;
void bandsOn;
void milestoneCount;
// @ts-expect-error not a milestone type
chart.addMilestone({ label: "A", value: 1, type: "goal" });
