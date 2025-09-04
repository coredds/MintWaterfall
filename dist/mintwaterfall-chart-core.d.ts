import * as d3 from 'd3';
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
}
export interface MarginConfig {
    top: number;
    right: number;
    bottom: number;
    left: number;
}
export interface WaterfallChartConfig {
    width: number;
    height: number;
    margin: MarginConfig;
    showTotal: boolean;
    totalLabel: string;
    totalColor: string;
    stacked: boolean;
    barPadding: number;
    duration: number;
    formatNumber: (n: number) => string;
}
export declare function waterfallChart(): {
    (selection: d3.Selection<any, any, any, any>): void;
    width: (value?: number | undefined) => any;
    height: (value?: number | undefined) => any;
    margin: (value?: MarginConfig | undefined) => any;
    showTotal: (value?: boolean | undefined) => any;
    totalLabel: (value?: string | undefined) => any;
    totalColor: (value?: string | undefined) => any;
    stacked: (value?: boolean | undefined) => any;
    barPadding: (value?: number | undefined) => any;
    duration: (value?: number | undefined) => any;
    formatNumber: (value?: ((n: number) => string) | undefined) => any;
    config(): WaterfallChartConfig;
    reset(): /*elided*/ any;
};
declare module 'd3' {
    interface D3 {
        waterfallChart(): any;
    }
}
//# sourceMappingURL=mintwaterfall-chart-core.d.ts.map