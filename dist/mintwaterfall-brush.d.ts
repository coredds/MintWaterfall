import * as d3 from 'd3';
export interface BrushConfig {
    enabled: boolean;
    extent: [[number, number], [number, number]];
    handleSize: number;
    filter: ((event: any) => boolean) | null;
    touchable: boolean;
    keyModifiers: boolean;
    selection: {
        fill: string;
        fillOpacity: number;
        stroke: string;
        strokeWidth: number;
        strokeDasharray: string | null;
    };
    handles: {
        fill: string;
        stroke: string;
        strokeWidth: number;
        size: number;
    };
}
export interface BrushSelection {
    x: [number, number];
    y: [number, number];
}
export interface BrushEventData {
    selection: BrushSelection | null;
    sourceEvent: any;
    type: 'start' | 'brush' | 'end';
}
export interface DataPoint {
    x: number;
    y: number;
    [key: string]: any;
}
export interface BrushSystem {
    enable(): BrushSystem;
    disable(): BrushSystem;
    attach(container: d3.Selection<SVGGElement, any, any, any>): BrushSystem;
    detach(): BrushSystem;
    clear(): BrushSystem;
    getSelection(): BrushSelection | null;
    setSelection(selection: BrushSelection | null): BrushSystem;
    getSelectedData(): DataPoint[];
    setData(data: DataPoint[]): BrushSystem;
    configure(newConfig: Partial<BrushConfig>): BrushSystem;
    setExtent(extent: [[number, number], [number, number]]): BrushSystem;
    isEnabled(): boolean;
    on(type: string, callback: (event: BrushEventData) => void): BrushSystem;
    off(type: string, callback?: (event: BrushEventData) => void): BrushSystem;
}
export type BrushEventType = 'brushstart' | 'brush' | 'brushend' | 'clear';
export declare function createBrushSystem(): BrushSystem;
export declare function createBrushSystemFactory(): {
    createBrush: (options?: {
        type?: "x" | "y" | "xy";
    }) => any;
    filterDataByBrush: (data: any[], selection: [number, number], scale: any) => any[];
    getSelectedIndices: (data: any[], selection: [number, number], scale: any) => number[];
    selectionUtils: {
        createSelectionSummary(selectedData: any[]): any;
    };
    onStart(handler: Function): /*elided*/ any;
    onMove(handler: Function): /*elided*/ any;
    onEnd(handler: Function): /*elided*/ any;
};
//# sourceMappingURL=mintwaterfall-brush.d.ts.map