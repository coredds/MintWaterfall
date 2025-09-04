import * as d3 from 'd3';
export interface HierarchicalData {
    id?: string;
    name?: string;
    value?: number;
    data?: any;
    children?: HierarchicalData[];
}
export interface LayoutOptions {
    size?: [number, number];
    padding?: number;
    round?: boolean;
    type?: LayoutType;
    paddingInner?: number;
    paddingOuter?: number;
    paddingTop?: number;
    paddingRight?: number;
    paddingBottom?: number;
    paddingLeft?: number;
    ratio?: number;
    orientation?: "horizontal" | "vertical";
    nodeSize?: [number, number] | null;
    separation?: ((a: d3.HierarchyNode<any>, b: d3.HierarchyNode<any>) => number) | null;
}
export interface HierarchyOptions {
    idAccessor?: (d: any) => string;
    parentAccessor?: (d: any) => string | null;
    valueAccessor?: (d: any) => number;
    sort?: (a: d3.HierarchyNode<any>, b: d3.HierarchyNode<any>) => number;
    includeRoot?: boolean;
    includeInternal?: boolean;
    maxDepth?: number;
}
export interface ExtractionOptions {
    includeRoot?: boolean;
    includeInternal?: boolean;
    maxDepth?: number;
}
export interface ConversionOptions extends ExtractionOptions {
    colorScale?: any;
}
export interface ExtractedNode {
    id: string;
    name: string;
    value: number;
    depth: number;
    height: number;
    parent: string | null;
    x0: number;
    y0: number;
    x1: number;
    y1: number;
    r?: number;
    originalData: any;
}
export interface WaterfallStackItem {
    value: number;
    color: string;
    label: string;
}
export interface WaterfallFormatNode {
    label: string;
    stacks: WaterfallStackItem[];
    hierarchyData: {
        id: string;
        depth: number;
        height: number;
        parent: string | null;
        x0: number;
        y0: number;
        x1: number;
        y1: number;
        r?: number;
    };
}
export type LayoutType = "treemap" | "partition" | "pack" | "cluster" | "tree";
export interface PartitionOptions {
    orientation: "horizontal" | "vertical";
}
export interface TreeOptions {
    nodeSize: [number, number] | null;
    separation: ((a: d3.HierarchyNode<any>, b: d3.HierarchyNode<any>) => number) | null;
}
export interface LayoutNode extends d3.HierarchyNode<any> {
    x0?: number;
    y0?: number;
    x1?: number;
    y1?: number;
    r?: number;
}
export interface HierarchicalLayout {
    (data: d3.HierarchyNode<any>): LayoutNode;
    size(): [number, number];
    size(size: [number, number]): HierarchicalLayout;
    padding(): number;
    padding(padding: number): HierarchicalLayout;
    paddingInner(): number;
    paddingInner(padding: number): HierarchicalLayout;
    paddingOuter(): number;
    paddingOuter(padding: number): HierarchicalLayout;
    paddingTop(): number;
    paddingTop(padding: number): HierarchicalLayout;
    paddingRight(): number;
    paddingRight(padding: number): HierarchicalLayout;
    paddingBottom(): number;
    paddingBottom(padding: number): HierarchicalLayout;
    paddingLeft(): number;
    paddingLeft(padding: number): HierarchicalLayout;
    round(): boolean;
    round(round: boolean): HierarchicalLayout;
    ratio(): number;
    ratio(ratio: number): HierarchicalLayout;
    type(): LayoutType;
    type(type: LayoutType): HierarchicalLayout;
    partitionOrientation(): "horizontal" | "vertical";
    partitionOrientation(orientation: "horizontal" | "vertical"): HierarchicalLayout;
    nodeSize(): [number, number] | null;
    nodeSize(size: [number, number] | null): HierarchicalLayout;
    separation(): ((a: d3.HierarchyNode<any>, b: d3.HierarchyNode<any>) => number) | null;
    separation(separation: ((a: d3.HierarchyNode<any>, b: d3.HierarchyNode<any>) => number) | null): HierarchicalLayout;
}
export interface HierarchyLayouts {
    treemap(data: HierarchicalData | any[], options?: LayoutOptions & HierarchyOptions): LayoutNode;
    partition(data: HierarchicalData | any[], options?: LayoutOptions & HierarchyOptions): LayoutNode;
    pack(data: HierarchicalData | any[], options?: LayoutOptions & HierarchyOptions): LayoutNode;
}
/**
 * Creates a hierarchical layout system for advanced data visualization
 * @returns {HierarchicalLayout} Layout system API
 */
export declare function createHierarchicalLayout(): HierarchicalLayout;
/**
 * Helper function to create hierarchical data structure from flat data
 * @param {any[]} data - Flat data array
 * @param {(d: any) => string} idAccessor - Function to get node ID
 * @param {(d: any) => string | null} parentAccessor - Function to get parent ID
 * @param {(d: any) => number} valueAccessor - Function to get node value
 * @returns {HierarchicalData | null} Hierarchical data structure
 */
export declare function createHierarchyFromFlatData(data: any[], idAccessor: (d: any) => string, parentAccessor: (d: any) => string | null, valueAccessor?: (d: any) => number): HierarchicalData | null;
/**
 * Creates a d3.hierarchy object from data
 * @param {HierarchicalData | any[]} data - Hierarchical data or flat data array
 * @param {HierarchyOptions} options - Configuration options
 * @returns {d3.HierarchyNode<any> | null} d3.hierarchy object
 */
export declare function createHierarchy(data: HierarchicalData | any[], options?: HierarchyOptions): d3.HierarchyNode<any> | null;
/**
 * Helper function to extract data from a hierarchical layout
 * @param {d3.HierarchyNode<any>} layoutData - Processed layout data
 * @param {ExtractionOptions} options - Extraction options
 * @returns {ExtractedNode[]} Extracted data
 */
export declare function extractLayoutData(layoutData: LayoutNode, options?: ExtractionOptions): ExtractedNode[];
/**
 * Helper function to convert hierarchical layout to waterfall-compatible format
 * @param {d3.HierarchyNode<any>} layoutData - Processed layout data
 * @param {ConversionOptions} options - Conversion options
 * @returns {WaterfallFormatNode[]} Waterfall-compatible data
 */
export declare function convertToWaterfallFormat(layoutData: LayoutNode, options?: ConversionOptions): WaterfallFormatNode[];
export declare const hierarchyLayouts: HierarchyLayouts;
//# sourceMappingURL=mintwaterfall-layouts.d.ts.map