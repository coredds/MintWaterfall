import * as d3 from 'd3';
export interface HierarchicalData {
    name: string;
    value?: number;
    children?: HierarchicalData[];
    category?: string;
    level?: number;
    parent?: string;
    metadata?: any;
}
export interface TreemapConfig {
    width: number;
    height: number;
    padding: number;
    tile: any;
    round: boolean;
    colorScale?: d3.ScaleOrdinal<string, string>;
    onNodeClick?: (node: d3.HierarchyRectangularNode<HierarchicalData>) => void;
    onNodeHover?: (node: d3.HierarchyRectangularNode<HierarchicalData>) => void;
}
export interface PartitionConfig {
    width: number;
    height: number;
    innerRadius?: number;
    outerRadius?: number;
    type: 'sunburst' | 'icicle';
    colorScale?: d3.ScaleOrdinal<string, string>;
    onNodeClick?: (node: d3.HierarchyRectangularNode<HierarchicalData>) => void;
}
export interface ClusterConfig {
    width: number;
    height: number;
    nodeSize: [number, number];
    separation?: (a: d3.HierarchyPointNode<HierarchicalData>, b: d3.HierarchyPointNode<HierarchicalData>) => number;
    linkColor?: string;
    nodeColor?: string;
}
export interface PackConfig {
    width: number;
    height: number;
    padding: number;
    colorScale?: d3.ScaleOrdinal<string, string>;
    sizeAccessor?: (d: HierarchicalData) => number;
    onNodeClick?: (node: d3.HierarchyCircularNode<HierarchicalData>) => void;
}
export interface HierarchicalLayoutSystem {
    createTreemapLayout(data: HierarchicalData, config: TreemapConfig): d3.HierarchyRectangularNode<HierarchicalData>;
    renderTreemap(container: d3.Selection<any, any, any, any>, layout: d3.HierarchyRectangularNode<HierarchicalData>, config: TreemapConfig): void;
    createPartitionLayout(data: HierarchicalData, config: PartitionConfig): d3.HierarchyRectangularNode<HierarchicalData>;
    renderPartition(container: d3.Selection<any, any, any, any>, layout: d3.HierarchyRectangularNode<HierarchicalData>, config: PartitionConfig): void;
    createClusterLayout(data: HierarchicalData, config: ClusterConfig): d3.HierarchyPointNode<HierarchicalData>;
    renderCluster(container: d3.Selection<any, any, any, any>, layout: d3.HierarchyPointNode<HierarchicalData>, config: ClusterConfig): void;
    createPackLayout(data: HierarchicalData, config: PackConfig): d3.HierarchyCircularNode<HierarchicalData>;
    renderPack(container: d3.Selection<any, any, any, any>, layout: d3.HierarchyCircularNode<HierarchicalData>, config: PackConfig): void;
    transformWaterfallToHierarchy(waterfallData: any[]): HierarchicalData;
    createDrillDownNavigation(data: HierarchicalData): any[];
    calculateHierarchicalMetrics(node: d3.HierarchyNode<HierarchicalData>): any;
}
export declare function createHierarchicalLayoutSystem(): HierarchicalLayoutSystem;
/**
 * Create hierarchical waterfall breakdown using treemap
 */
export declare function createWaterfallTreemap(data: any[], container: d3.Selection<any, any, any, any>, width: number, height: number): void;
/**
 * Create circular waterfall visualization using partition layout
 */
export declare function createWaterfallSunburst(data: any[], container: d3.Selection<any, any, any, any>, width: number, height: number): void;
/**
 * Create bubble chart waterfall using pack layout
 */
export declare function createWaterfallBubbles(data: any[], container: d3.Selection<any, any, any, any>, width: number, height: number): void;
//# sourceMappingURL=mintwaterfall-hierarchical-layouts.d.ts.map