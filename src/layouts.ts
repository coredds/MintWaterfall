// MintWaterfall - D3.js compatible hierarchical layout system - TypeScript Version
// Implements d3.hierarchy, d3.treemap, d3.partition, and other layout algorithms with full type safety

import * as d3 from 'd3';

// Type definitions for hierarchical layout system
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

// Extended interfaces for D3 hierarchy nodes with layout properties
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
export function createHierarchicalLayout(): HierarchicalLayout {
    let size: [number, number] = [800, 400];
    let padding = 0;
    let round = false;
    let layoutType: LayoutType = "treemap";
    let paddingInner = 0;
    let paddingOuter = 0;
    let paddingTop = 0;
    let paddingRight = 0;
    let paddingBottom = 0;
    let paddingLeft = 0;
    let ratio = 1.618033988749895; // Golden ratio by default
    
    // Additional layout-specific options
    let partitionOptions: PartitionOptions = {
        orientation: "horizontal"
    };
    
    let treeOptions: TreeOptions = {
        nodeSize: null,
        separation: null
    };
    
    /**
     * Main layout function that processes hierarchical data
     * @param {d3.HierarchyNode<any>} data - d3.hierarchy compatible data
     * @returns {LayoutNode} Processed layout data
     */
    function layout(data: d3.HierarchyNode<any>): LayoutNode {
        if (!data) {
            console.error("MintWaterfall: No hierarchical data provided to layout");
            throw new Error("No hierarchical data provided");
        }
        
        // Ensure we have a d3.hierarchy object with proper sum calculation
        const root = data;
        
        // Apply the selected layout
        switch (layoutType) {
            case "treemap":
                return applyTreemapLayout(root);
            case "partition":
                return applyPartitionLayout(root);
            case "pack":
                return applyPackLayout(root);
            case "cluster":
                return applyClusterLayout(root);
            case "tree":
                return applyTreeLayout(root);
            default:
                console.warn(`MintWaterfall: Unknown layout type '${layoutType}', falling back to treemap`);
                return applyTreemapLayout(root);
        }
    }
    
    /**
     * Applies treemap layout to hierarchical data
     * @param {d3.HierarchyNode<any>} root - d3.hierarchy data
     * @returns {d3.HierarchyNode<any>} Processed layout data
     */
    function applyTreemapLayout(root: d3.HierarchyNode<any>): LayoutNode {
        const treemap = d3.treemap()
            .size(size)
            .round(round)
            .padding(padding);
            
        // Apply additional padding options if they exist
        if (paddingInner !== undefined) treemap.paddingInner(paddingInner);
        if (paddingOuter !== undefined) treemap.paddingOuter(paddingOuter);
        if (paddingTop !== undefined) treemap.paddingTop(paddingTop);
        if (paddingRight !== undefined) treemap.paddingRight(paddingRight);
        if (paddingBottom !== undefined) treemap.paddingBottom(paddingBottom);
        if (paddingLeft !== undefined) treemap.paddingLeft(paddingLeft);
        
        return treemap(root) as LayoutNode;
    }
    
    /**
     * Applies partition layout to hierarchical data
     * @param {d3.HierarchyNode<any>} root - d3.hierarchy data
     * @returns {LayoutNode} Processed layout data
     */
    function applyPartitionLayout(root: d3.HierarchyNode<any>): LayoutNode {
        const partitionLayout = d3.partition()
            .size(size)
            .round(round)
            .padding(padding);
        
        // Apply partition layout
        const result = partitionLayout(root) as LayoutNode;
        
        // Handle orientation for partition layout
        if (partitionOptions.orientation === "vertical") {
            // Swap x/y coordinates and dimensions for vertical orientation
            result.each((node: LayoutNode) => {
                if (node.x0 !== undefined && node.y0 !== undefined && 
                    node.x1 !== undefined && node.y1 !== undefined) {
                    const temp = node.x0;
                    node.x0 = node.y0;
                    node.y0 = temp;
                    
                    const tempX1 = node.x1;
                    node.x1 = node.y1;
                    node.y1 = tempX1;
                }
            });
        }
        
        return result;
    }
    
    /**
     * Applies pack layout to hierarchical data
     * @param {d3.HierarchyNode<any>} root - d3.hierarchy data
     * @returns {LayoutNode} Processed layout data
     */
    function applyPackLayout(root: d3.HierarchyNode<any>): LayoutNode {
        return d3.pack()
            .size(size)
            .padding(padding)
            (root) as LayoutNode;
    }
    
    /**
     * Applies cluster layout to hierarchical data
     * @param {d3.HierarchyNode<any>} root - d3.hierarchy data
     * @returns {LayoutNode} Processed layout data
     */
    function applyClusterLayout(root: d3.HierarchyNode<any>): LayoutNode {
        const clusterLayout = d3.cluster()
            .size(size);
            
        if (treeOptions.nodeSize) {
            clusterLayout.nodeSize(treeOptions.nodeSize);
        }
        
        if (treeOptions.separation) {
            clusterLayout.separation(treeOptions.separation);
        }
        
        return clusterLayout(root) as LayoutNode;
    }
    
    /**
     * Applies tree layout to hierarchical data
     * @param {d3.HierarchyNode<any>} root - d3.hierarchy data
     * @returns {LayoutNode} Processed layout data
     */
    function applyTreeLayout(root: d3.HierarchyNode<any>): LayoutNode {
        const treeLayout = d3.tree()
            .size(size);
            
        if (treeOptions.nodeSize) {
            treeLayout.nodeSize(treeOptions.nodeSize);
        }
        
        if (treeOptions.separation) {
            treeLayout.separation(treeOptions.separation);
        }
        
        return treeLayout(root) as LayoutNode;
    }
    
    // Create layout object with simple object assignment
    const hierarchicalLayout = layout as any;
    
    // Add chainable methods
    hierarchicalLayout.size = function(_?: [number, number]) {
        return arguments.length ? (size = _!, hierarchicalLayout) : size;
    };
    
    hierarchicalLayout.padding = function(_?: number) {
        return arguments.length ? (padding = _!, hierarchicalLayout) : padding;
    };
    
    hierarchicalLayout.paddingInner = function(_?: number) {
        return arguments.length ? (paddingInner = _!, hierarchicalLayout) : paddingInner;
    };
    
    hierarchicalLayout.paddingOuter = function(_?: number) {
        return arguments.length ? (paddingOuter = _!, hierarchicalLayout) : paddingOuter;
    };
    
    hierarchicalLayout.paddingTop = function(_?: number) {
        return arguments.length ? (paddingTop = _!, hierarchicalLayout) : paddingTop;
    };
    
    hierarchicalLayout.paddingRight = function(_?: number) {
        return arguments.length ? (paddingRight = _!, hierarchicalLayout) : paddingRight;
    };
    
    hierarchicalLayout.paddingBottom = function(_?: number) {
        return arguments.length ? (paddingBottom = _!, hierarchicalLayout) : paddingBottom;
    };
    
    hierarchicalLayout.paddingLeft = function(_?: number) {
        return arguments.length ? (paddingLeft = _!, hierarchicalLayout) : paddingLeft;
    };
    
    hierarchicalLayout.round = function(_?: boolean) {
        return arguments.length ? (round = _!, hierarchicalLayout) : round;
    };
    
    hierarchicalLayout.ratio = function(_?: number) {
        return arguments.length ? (ratio = _!, hierarchicalLayout) : ratio;
    };
    
    hierarchicalLayout.type = function(_?: LayoutType) {
        return arguments.length ? (layoutType = _!, hierarchicalLayout) : layoutType;
    };
    
    hierarchicalLayout.partitionOrientation = function(_?: "horizontal" | "vertical") {
        return arguments.length ? (partitionOptions.orientation = _!, hierarchicalLayout) : partitionOptions.orientation;
    };
    
    hierarchicalLayout.nodeSize = function(_?: [number, number] | null) {
        return arguments.length ? (treeOptions.nodeSize = _!, hierarchicalLayout) : treeOptions.nodeSize;
    };
    
    hierarchicalLayout.separation = function(_?: ((a: d3.HierarchyNode<any>, b: d3.HierarchyNode<any>) => number) | null) {
        return arguments.length ? (treeOptions.separation = _!, hierarchicalLayout) : treeOptions.separation;
    };
    
    return hierarchicalLayout as HierarchicalLayout;
}

/**
 * Helper function to create hierarchical data structure from flat data
 * @param {any[]} data - Flat data array
 * @param {(d: any) => string} idAccessor - Function to get node ID
 * @param {(d: any) => string | null} parentAccessor - Function to get parent ID
 * @param {(d: any) => number} valueAccessor - Function to get node value
 * @returns {HierarchicalData | null} Hierarchical data structure
 */
export function createHierarchyFromFlatData(
    data: any[],
    idAccessor: (d: any) => string,
    parentAccessor: (d: any) => string | null,
    valueAccessor?: (d: any) => number
): HierarchicalData | null {
    if (!data || !Array.isArray(data) || data.length === 0) {
        console.error("MintWaterfall: Invalid data provided to createHierarchyFromFlatData");
        return null;
    }
    
    // Create map for fast lookup
    const dataMap = new Map<string, HierarchicalData>();
    
    // First pass: create nodes
    const root: HierarchicalData = {
        id: "root",
        name: "Root",
        children: []
    };
    dataMap.set("root", root);
    
    // Create nodes for each data item
    data.forEach(item => {
        const id = idAccessor(item);
        if (!id) {
            console.warn("MintWaterfall: Item missing ID in createHierarchyFromFlatData");
            return;
        }
        
        const node: HierarchicalData = {
            id,
            name: id,
            data: item,
            value: valueAccessor ? valueAccessor(item) : undefined,
            children: []
        };
        dataMap.set(id, node);
    });
    
    // Second pass: establish parent-child relationships
    data.forEach(item => {
        const id = idAccessor(item);
        const parentId = parentAccessor(item) || "root";
        
        const node = dataMap.get(id);
        const parent = dataMap.get(parentId);
        
        if (parent && node && parent.children) {
            parent.children.push(node);
        }
    });
    
    // Return the root node
    return root;
}

/**
 * Creates a d3.hierarchy object from data
 * @param {HierarchicalData | any[]} data - Hierarchical data or flat data array
 * @param {HierarchyOptions} options - Configuration options
 * @returns {d3.HierarchyNode<any> | null} d3.hierarchy object
 */
export function createHierarchy(
    data: HierarchicalData | any[],
    options: HierarchyOptions = {}
): d3.HierarchyNode<any> | null {
    if (!data) {
        console.error("MintWaterfall: No data provided to createHierarchy");
        return null;
    }
    
    let hierarchyData: HierarchicalData | null;
    
    // If data is flat array and we have accessor functions, convert to hierarchical
    if (Array.isArray(data) && options.idAccessor && options.parentAccessor) {
        hierarchyData = createHierarchyFromFlatData(
            data,
            options.idAccessor,
            options.parentAccessor,
            options.valueAccessor
        );
    } else {
        // Assume data is already in hierarchical format
        hierarchyData = data as HierarchicalData;
    }
    
    if (!hierarchyData) {
        return null;
    }
    
    // Create d3.hierarchy object
    const hierarchy = d3.hierarchy(hierarchyData);
    
    // Apply value accessor if provided
    if (options.valueAccessor) {
        hierarchy.sum(d => {
            // For leaf nodes, use the value accessor
            if (!d.children || d.children.length === 0) {
                return d.value !== undefined ? d.value : (options.valueAccessor!(d) || 0);
            }
            // For parent nodes, return 0 (sum will be calculated from children)
            return 0;
        });
    } else {
        hierarchy.sum(d => d.value || 0);
    }
    
    // Apply sorting if provided
    if (options.sort) {
        hierarchy.sort(options.sort);
    }
    
    return hierarchy;
}

/**
 * Helper function to extract data from a hierarchical layout
 * @param {d3.HierarchyNode<any>} layoutData - Processed layout data
 * @param {ExtractionOptions} options - Extraction options
 * @returns {ExtractedNode[]} Extracted data
 */
export function extractLayoutData(
    layoutData: LayoutNode,
    options: ExtractionOptions = {}
): ExtractedNode[] {
    if (!layoutData) {
        console.error("MintWaterfall: No layout data provided to extractLayoutData");
        return [];
    }
    
    const result: ExtractedNode[] = [];
    const includeRoot = options.includeRoot || false;
    const includeInternal = options.includeInternal || false;
    const maxDepth = options.maxDepth || Infinity;
    
    // Traverse the hierarchy
    layoutData.each((node: LayoutNode) => {
        // Skip root if not included
        if (!includeRoot && !node.parent) {
            return;
        }
        
        // Skip internal nodes if not included
        if (!includeInternal && node.children && node.children.length > 0) {
            return;
        }
        
        // Skip nodes beyond max depth
        if (node.depth > maxDepth) {
            return;
        }
        
        // Extract node data with proper type casting
        result.push({
            id: node.data.id || `node-${node.depth}-${node.height}`,
            name: node.data.name || "",
            value: node.value!,
            depth: node.depth,
            height: node.height,
            parent: node.parent ? (node.parent.data.id || `node-${node.parent.depth}-${node.parent.height}`) : null,
            x0: node.x0 || 0,
            y0: node.y0 || 0,
            x1: node.x1 || 0,
            y1: node.y1 || 0,
            r: node.r,
            originalData: node.data
        });
    });
    
    return result;
}

/**
 * Helper function to convert hierarchical layout to waterfall-compatible format
 * @param {d3.HierarchyNode<any>} layoutData - Processed layout data
 * @param {ConversionOptions} options - Conversion options
 * @returns {WaterfallFormatNode[]} Waterfall-compatible data
 */
export function convertToWaterfallFormat(
    layoutData: LayoutNode,
    options: ConversionOptions = {}
): WaterfallFormatNode[] {
    if (!layoutData) {
        console.error("MintWaterfall: No layout data provided to convertToWaterfallFormat");
        return [];
    }
    
    const extractedData = extractLayoutData(layoutData, {
        includeRoot: options.includeRoot || false,
        includeInternal: options.includeInternal || true,
        maxDepth: options.maxDepth || 2
    });
    
    // Generate color scale if not provided
    const colorScale = options.colorScale || d3.scaleOrdinal(d3.schemeCategory10);
    
    // Convert to waterfall format
    return extractedData.map(node => {
        return {
            label: node.name,
            stacks: [{
                value: node.value,
                color: typeof colorScale === "function" ? colorScale(node.depth.toString()) : colorScale,
                label: node.value.toString()
            }],
            hierarchyData: {
                id: node.id,
                depth: node.depth,
                height: node.height,
                parent: node.parent,
                x0: node.x0,
                y0: node.y0,
                x1: node.x1,
                y1: node.y1,
                r: node.r
            }
        };
    });
}

// Export layout helpers for direct use
export const hierarchyLayouts: HierarchyLayouts = {
    treemap: function(data: HierarchicalData | any[], options: LayoutOptions & HierarchyOptions = {}) {
        const layout = createHierarchicalLayout()
            .type("treemap")
            .size(options.size || [800, 400])
            .padding(options.padding || 1);
            
        const hierarchy = createHierarchy(data, options);
        if (!hierarchy) {
            throw new Error("Failed to create hierarchy");
        }
        return layout(hierarchy);
    },
    
    partition: function(data: HierarchicalData | any[], options: LayoutOptions & HierarchyOptions = {}) {
        const layout = createHierarchicalLayout()
            .type("partition")
            .size(options.size || [800, 400])
            .padding(options.padding || 1)
            .partitionOrientation(options.orientation || "horizontal");
            
        const hierarchy = createHierarchy(data, options);
        if (!hierarchy) {
            throw new Error("Failed to create hierarchy");
        }
        return layout(hierarchy);
    },
    
    pack: function(data: HierarchicalData | any[], options: LayoutOptions & HierarchyOptions = {}) {
        const layout = createHierarchicalLayout()
            .type("pack")
            .size(options.size || [800, 400])
            .padding(options.padding || 1);
            
        const hierarchy = createHierarchy(data, options);
        if (!hierarchy) {
            throw new Error("Failed to create hierarchy");
        }
        return layout(hierarchy);
    }
};



// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface AdvancedHierarchicalData {
    name: string;
    value?: number;
    children?: AdvancedHierarchicalData[];
    category?: string;
    level?: number;
    parent?: string;
    metadata?: any;
}

export interface TreemapConfig {
    width: number;
    height: number;
    padding: number;
    tile: any; // Simplified type for compatibility
    round: boolean;
    colorScale?: d3.ScaleOrdinal<string, string>;
    onNodeClick?: (node: d3.HierarchyRectangularNode<AdvancedHierarchicalData>) => void;
    onNodeHover?: (node: d3.HierarchyRectangularNode<AdvancedHierarchicalData>) => void;
}

export interface PartitionConfig {
    width: number;
    height: number;
    innerRadius?: number;
    outerRadius?: number;
    type: 'sunburst' | 'icicle';
    colorScale?: d3.ScaleOrdinal<string, string>;
    onNodeClick?: (node: d3.HierarchyRectangularNode<AdvancedHierarchicalData>) => void;
}

export interface ClusterConfig {
    width: number;
    height: number;
    nodeSize: [number, number];
    separation?: (a: d3.HierarchyPointNode<AdvancedHierarchicalData>, b: d3.HierarchyPointNode<AdvancedHierarchicalData>) => number;
    linkColor?: string;
    nodeColor?: string;
}

export interface PackConfig {
    width: number;
    height: number;
    padding: number;
    colorScale?: d3.ScaleOrdinal<string, string>;
    sizeAccessor?: (d: AdvancedHierarchicalData) => number;
    onNodeClick?: (node: d3.HierarchyCircularNode<AdvancedHierarchicalData>) => void;
}

export interface HierarchicalLayoutSystem {
    // Treemap layout for nested waterfall breakdowns
    createTreemapLayout(data: AdvancedHierarchicalData, config: TreemapConfig): d3.HierarchyRectangularNode<AdvancedHierarchicalData>;
    renderTreemap(container: d3.Selection<any, any, any, any>, layout: d3.HierarchyRectangularNode<AdvancedHierarchicalData>, config: TreemapConfig): void;
    
    // Partition layout for circular/radial waterfall views
    createPartitionLayout(data: AdvancedHierarchicalData, config: PartitionConfig): d3.HierarchyRectangularNode<AdvancedHierarchicalData>;
    renderPartition(container: d3.Selection<any, any, any, any>, layout: d3.HierarchyRectangularNode<AdvancedHierarchicalData>, config: PartitionConfig): void;
    
    // Cluster layout for dendogram-style categorization
    createClusterLayout(data: AdvancedHierarchicalData, config: ClusterConfig): d3.HierarchyPointNode<AdvancedHierarchicalData>;
    renderCluster(container: d3.Selection<any, any, any, any>, layout: d3.HierarchyPointNode<AdvancedHierarchicalData>, config: ClusterConfig): void;
    
    // Pack layout for bubble-based grouped waterfalls
    createPackLayout(data: AdvancedHierarchicalData, config: PackConfig): d3.HierarchyCircularNode<AdvancedHierarchicalData>;
    renderPack(container: d3.Selection<any, any, any, any>, layout: d3.HierarchyCircularNode<AdvancedHierarchicalData>, config: PackConfig): void;
    
    // Utility functions
    transformWaterfallToHierarchy(waterfallData: any[]): AdvancedHierarchicalData;
    createDrillDownNavigation(data: AdvancedHierarchicalData): any[];
    calculateHierarchicalMetrics(node: d3.HierarchyNode<AdvancedHierarchicalData>): any;
}

// ============================================================================
// HIERARCHICAL LAYOUT SYSTEM IMPLEMENTATION
// ============================================================================

export function createHierarchicalLayoutSystem(): HierarchicalLayoutSystem {
    
    // ========================================================================
    // TREEMAP LAYOUT (d3.treemap)
    // ========================================================================
    
    function createTreemapLayout(data: AdvancedHierarchicalData, config: TreemapConfig): d3.HierarchyRectangularNode<AdvancedHierarchicalData> {
        // Create hierarchy
        const root = d3.hierarchy(data)
            .sum(d => d.value || 0)
            .sort((a, b) => (b.value || 0) - (a.value || 0));
        
        // Create treemap layout
        const treemap = d3.treemap<AdvancedHierarchicalData>()
            .size([config.width, config.height])
            .padding(config.padding)
            .tile(config.tile)
            .round(config.round);
        
        return treemap(root);
    }
    
    function renderTreemap(
        container: d3.Selection<any, any, any, any>, 
        layout: d3.HierarchyRectangularNode<AdvancedHierarchicalData>, 
        config: TreemapConfig
    ): void {
        const colorScale = config.colorScale || d3.scaleOrdinal(d3.schemeCategory10);
        
        // Create treemap group
        const treemapGroup = container.selectAll('.treemap-group')
            .data([0]);
        
        const treemapGroupEnter = treemapGroup.enter()
            .append('g')
            .attr('class', 'treemap-group');
        
        const treemapGroupMerged = treemapGroupEnter.merge(treemapGroup as any);
        
        // Get leaf nodes for rendering
        const leaves = layout.leaves();
        
        // Create rectangles for leaf nodes
        const cells = treemapGroupMerged.selectAll('.treemap-cell')
            .data(leaves, (d: any) => d.data.name);
        
        const cellsEnter = cells.enter()
            .append('g')
            .attr('class', 'treemap-cell');
        
        // Add rectangles
        cellsEnter.append('rect')
            .attr('class', 'treemap-rect');
        
        // Add labels
        cellsEnter.append('text')
            .attr('class', 'treemap-label');
        
        // Add value labels
        cellsEnter.append('text')
            .attr('class', 'treemap-value');
        
        const cellsMerged = cellsEnter.merge(cells as any);
        
        // Update rectangles
        cellsMerged.select('.treemap-rect')
            .transition()
            .duration(750)
            .attr('x', d => d.x0)
            .attr('y', d => d.y0)
            .attr('width', d => d.x1 - d.x0)
            .attr('height', d => d.y1 - d.y0)
            .attr('fill', d => colorScale(d.data.category || d.data.name))
            .attr('stroke', '#fff')
            .attr('stroke-width', 1)
            .attr('opacity', 0.8);
        
        // Update labels
        cellsMerged.select('.treemap-label')
            .attr('x', d => (d.x0 + d.x1) / 2)
            .attr('y', d => (d.y0 + d.y1) / 2 - 8)
            .attr('text-anchor', 'middle')
            .attr('font-size', d => Math.min(12, (d.x1 - d.x0) / 8))
            .attr('fill', '#333')
            .text(d => d.data.name);
        
        // Update value labels
        cellsMerged.select('.treemap-value')
            .attr('x', d => (d.x0 + d.x1) / 2)
            .attr('y', d => (d.y0 + d.y1) / 2 + 8)
            .attr('text-anchor', 'middle')
            .attr('font-size', d => Math.min(10, (d.x1 - d.x0) / 10))
            .attr('fill', '#666')
            .text(d => formatValue(d.value || 0));
        
        // Add interaction
        cellsMerged
            .style('cursor', 'pointer')
            .on('click', (event, d) => {
                if (config.onNodeClick) {
                    config.onNodeClick(d);
                }
            })
            .on('mouseenter', (event, d) => {
                d3.select(event.currentTarget).select('.treemap-rect')
                    .attr('opacity', 1)
                    .attr('stroke-width', 2);
                
                if (config.onNodeHover) {
                    config.onNodeHover(d);
                }
            })
            .on('mouseleave', (event, d) => {
                d3.select(event.currentTarget).select('.treemap-rect')
                    .attr('opacity', 0.8)
                    .attr('stroke-width', 1);
            });
        
        cells.exit()
            .transition()
            .duration(300)
            .attr('opacity', 0)
            .remove();
    }
    
    // ========================================================================
    // PARTITION LAYOUT (d3.partition)
    // ========================================================================
    
    function createPartitionLayout(data: AdvancedHierarchicalData, config: PartitionConfig): d3.HierarchyRectangularNode<AdvancedHierarchicalData> {
        // Create hierarchy
        const root = d3.hierarchy(data)
            .sum(d => d.value || 0)
            .sort((a, b) => (b.value || 0) - (a.value || 0));
        
        // Create partition layout
        const partition = d3.partition<AdvancedHierarchicalData>()
            .size([2 * Math.PI, Math.min(config.width, config.height) / 2]);
        
        return partition(root);
    }
    
    function renderPartition(
        container: d3.Selection<any, any, any, any>, 
        layout: d3.HierarchyRectangularNode<AdvancedHierarchicalData>, 
        config: PartitionConfig
    ): void {
        const colorScale = config.colorScale || d3.scaleOrdinal(d3.schemeCategory10);
        const radius = Math.min(config.width, config.height) / 2;
        const innerRadius = config.innerRadius || 0;
        
        // Create partition group
        const partitionGroup = container.selectAll('.partition-group')
            .data([0]);
        
        const partitionGroupEnter = partitionGroup.enter()
            .append('g')
            .attr('class', 'partition-group')
            .attr('transform', `translate(${config.width / 2}, ${config.height / 2})`);
        
        const partitionGroupMerged = partitionGroupEnter.merge(partitionGroup as any);
        
        if (config.type === 'sunburst') {
            renderSunburst(partitionGroupMerged, layout, colorScale, radius, innerRadius, config);
        } else {
            renderIcicle(partitionGroupMerged, layout, colorScale, config);
        }
    }
    
    function renderSunburst(
        container: d3.Selection<any, any, any, any>,
        layout: d3.HierarchyRectangularNode<AdvancedHierarchicalData>,
        colorScale: d3.ScaleOrdinal<string, string>,
        radius: number,
        innerRadius: number,
        config: PartitionConfig
    ): void {
        const arc = d3.arc<d3.HierarchyRectangularNode<AdvancedHierarchicalData>>()
            .startAngle(d => d.x0)
            .endAngle(d => d.x1)
            .innerRadius(d => Math.sqrt(d.y0) * radius / Math.sqrt(layout.y1))
            .outerRadius(d => Math.sqrt(d.y1) * radius / Math.sqrt(layout.y1));
        
        const descendants = layout.descendants().filter(d => d.depth > 0);
        
        const paths = container.selectAll('.partition-arc')
            .data(descendants, (d: any) => d.data.name);
        
        const pathsEnter = paths.enter()
            .append('path')
            .attr('class', 'partition-arc')
            .attr('fill', d => colorScale(d.data.category || d.data.name))
            .attr('stroke', '#fff')
            .attr('stroke-width', 1)
            .style('cursor', 'pointer');
        
        pathsEnter.merge(paths as any)
            .transition()
            .duration(750)
            .attr('d', arc);
        
        // Add interaction
        pathsEnter.merge(paths as any)
            .on('click', (event, d) => {
                if (config.onNodeClick) {
                    config.onNodeClick(d);
                }
            });
        
        paths.exit()
            .transition()
            .duration(300)
            .attr('opacity', 0)
            .remove();
    }
    
    function renderIcicle(
        container: d3.Selection<any, any, any, any>,
        layout: d3.HierarchyRectangularNode<AdvancedHierarchicalData>,
        colorScale: d3.ScaleOrdinal<string, string>,
        config: PartitionConfig
    ): void {
        const descendants = layout.descendants();
        
        const rects = container.selectAll('.partition-rect')
            .data(descendants, (d: any) => d.data.name);
        
        const rectsEnter = rects.enter()
            .append('rect')
            .attr('class', 'partition-rect')
            .attr('fill', d => colorScale(d.data.category || d.data.name))
            .attr('stroke', '#fff')
            .attr('stroke-width', 1)
            .style('cursor', 'pointer');
        
        rectsEnter.merge(rects as any)
            .transition()
            .duration(750)
            .attr('x', d => d.y0)
            .attr('y', d => d.x0)
            .attr('width', d => d.y1 - d.y0)
            .attr('height', d => d.x1 - d.x0);
        
        // Add interaction
        rectsEnter.merge(rects as any)
            .on('click', (event, d) => {
                if (config.onNodeClick) {
                    config.onNodeClick(d);
                }
            });
        
        rects.exit()
            .transition()
            .duration(300)
            .attr('opacity', 0)
            .remove();
    }
    
    // ========================================================================
    // CLUSTER LAYOUT (d3.cluster)
    // ========================================================================
    
    function createClusterLayout(data: AdvancedHierarchicalData, config: ClusterConfig): d3.HierarchyPointNode<AdvancedHierarchicalData> {
        // Create hierarchy
        const root = d3.hierarchy(data);
        
        // Create cluster layout
        const cluster = d3.cluster<AdvancedHierarchicalData>()
            .size([config.width, config.height])
            .nodeSize(config.nodeSize);
        
        if (config.separation) {
            cluster.separation(config.separation);
        }
        
        return cluster(root);
    }
    
    function renderCluster(
        container: d3.Selection<any, any, any, any>, 
        layout: d3.HierarchyPointNode<AdvancedHierarchicalData>, 
        config: ClusterConfig
    ): void {
        // Create cluster group
        const clusterGroup = container.selectAll('.cluster-group')
            .data([0]);
        
        const clusterGroupEnter = clusterGroup.enter()
            .append('g')
            .attr('class', 'cluster-group');
        
        const clusterGroupMerged = clusterGroupEnter.merge(clusterGroup as any);
        
        const descendants = layout.descendants();
        const links = layout.links();
        
        // Render links
        const linkSelection = clusterGroupMerged.selectAll('.cluster-link')
            .data(links, (d: any) => `${d.source.data.name}-${d.target.data.name}`);
        
        linkSelection.enter()
            .append('path')
            .attr('class', 'cluster-link')
            .attr('fill', 'none')
            .attr('stroke', config.linkColor || '#999')
            .attr('stroke-width', 1)
            .merge(linkSelection as any)
            .transition()
            .duration(750)
            .attr('d', d3.linkHorizontal<d3.HierarchyPointLink<AdvancedHierarchicalData>, d3.HierarchyPointNode<AdvancedHierarchicalData>>()
                .x(d => d.y || 0)
                .y(d => d.x || 0));
        
        linkSelection.exit().remove();
        
        // Render nodes
        const nodeSelection = clusterGroupMerged.selectAll('.cluster-node')
            .data(descendants, (d: any) => d.data.name);
        
        const nodeEnter = nodeSelection.enter()
            .append('g')
            .attr('class', 'cluster-node');
        
        nodeEnter.append('circle')
            .attr('r', 5)
            .attr('fill', config.nodeColor || '#69b3a2');
        
        nodeEnter.append('text')
            .attr('dy', 3)
            .attr('x', 8)
            .style('font-size', '12px')
            .text(d => d.data.name);
        
        const nodeMerged = nodeEnter.merge(nodeSelection as any);
        
        nodeMerged
            .transition()
            .duration(750)
            .attr('transform', d => `translate(${d.y},${d.x})`);
        
        nodeSelection.exit()
            .transition()
            .duration(300)
            .attr('opacity', 0)
            .remove();
    }
    
    // ========================================================================
    // PACK LAYOUT (d3.pack)
    // ========================================================================
    
    function createPackLayout(data: AdvancedHierarchicalData, config: PackConfig): d3.HierarchyCircularNode<AdvancedHierarchicalData> {
        // Create hierarchy
        const root = d3.hierarchy(data)
            .sum(config.sizeAccessor || (d => d.value || 0))
            .sort((a, b) => (b.value || 0) - (a.value || 0));
        
        // Create pack layout
        const pack = d3.pack<AdvancedHierarchicalData>()
            .size([config.width, config.height])
            .padding(config.padding);
        
        return pack(root);
    }
    
    function renderPack(
        container: d3.Selection<any, any, any, any>, 
        layout: d3.HierarchyCircularNode<AdvancedHierarchicalData>, 
        config: PackConfig
    ): void {
        const colorScale = config.colorScale || d3.scaleOrdinal(d3.schemeCategory10);
        
        // Create pack group
        const packGroup = container.selectAll('.pack-group')
            .data([0]);
        
        const packGroupEnter = packGroup.enter()
            .append('g')
            .attr('class', 'pack-group');
        
        const packGroupMerged = packGroupEnter.merge(packGroup as any);
        
        const descendants = layout.descendants().filter(d => d.depth > 0);
        
        // Create circles for nodes
        const nodes = packGroupMerged.selectAll('.pack-node')
            .data(descendants, (d: any) => d.data.name);
        
        const nodesEnter = nodes.enter()
            .append('g')
            .attr('class', 'pack-node');
        
        // Add circles
        nodesEnter.append('circle')
            .attr('class', 'pack-circle')
            .style('cursor', 'pointer');
        
        // Add labels
        nodesEnter.append('text')
            .attr('class', 'pack-label')
            .attr('text-anchor', 'middle')
            .attr('dy', '0.3em')
            .style('font-size', '10px')
            .style('fill', '#333')
            .style('pointer-events', 'none');
        
        const nodesMerged = nodesEnter.merge(nodes as any);
        
        // Update positions and attributes
        nodesMerged
            .transition()
            .duration(750)
            .attr('transform', d => `translate(${d.x},${d.y})`);
        
        nodesMerged.select('.pack-circle')
            .transition()
            .duration(750)
            .attr('r', d => d.r)
            .attr('fill', d => colorScale(d.data.category || d.data.name))
            .attr('stroke', '#fff')
            .attr('stroke-width', 1)
            .attr('opacity', 0.7);
        
        nodesMerged.select('.pack-label')
            .text(d => d.r > 15 ? d.data.name : '')
            .attr('font-size', d => Math.min(d.r / 3, 12));
        
        // Add interaction
        nodesMerged
            .on('click', (event, d) => {
                if (config.onNodeClick) {
                    config.onNodeClick(d);
                }
            })
            .on('mouseenter', (event, d) => {
                d3.select(event.currentTarget).select('.pack-circle')
                    .attr('opacity', 1)
                    .attr('stroke-width', 2);
            })
            .on('mouseleave', (event, d) => {
                d3.select(event.currentTarget).select('.pack-circle')
                    .attr('opacity', 0.7)
                    .attr('stroke-width', 1);
            });
        
        nodes.exit()
            .transition()
            .duration(300)
            .attr('opacity', 0)
            .remove();
    }
    
    // ========================================================================
    // UTILITY FUNCTIONS
    // ========================================================================
    
    function transformWaterfallToHierarchy(waterfallData: any[]): AdvancedHierarchicalData {
        // Group data by categories if available
        const grouped = d3.group(waterfallData, d => d.category || 'Default');
        
        const children: AdvancedHierarchicalData[] = [];
        
        for (const [category, items] of grouped) {
            const categoryNode: AdvancedHierarchicalData = {
                name: category,
                value: d3.sum(items, d => Math.abs(extractValue(d))),
                category,
                children: items.map(item => ({
                    name: getLabel(item),
                    value: Math.abs(extractValue(item)),
                    category,
                    metadata: item
                }))
            };
            
            children.push(categoryNode);
        }
        
        return {
            name: 'Root',
            children,
            value: d3.sum(children, d => d.value || 0)
        };
    }
    
    function createDrillDownNavigation(data: AdvancedHierarchicalData): any[] {
        const navigation: any[] = [];
        
        function traverse(node: AdvancedHierarchicalData, path: string[] = []): void {
            const currentPath = [...path, node.name];
            
            navigation.push({
                path: currentPath,
                name: node.name,
                value: node.value,
                level: currentPath.length - 1,
                hasChildren: !!(node.children && node.children.length > 0)
            });
            
            if (node.children) {
                node.children.forEach(child => traverse(child, currentPath));
            }
        }
        
        traverse(data);
        return navigation;
    }
    
    function calculateHierarchicalMetrics(node: d3.HierarchyNode<AdvancedHierarchicalData>): any {
        return {
            depth: node.depth,
            height: node.height,
            value: node.value,
            leafCount: node.leaves().length,
            descendants: node.descendants().length,
            ancestors: node.ancestors().length,
            totalValue: node.descendants().reduce((sum, d) => sum + (d.value || 0), 0),
            averageValue: node.value && node.leaves().length ? node.value / node.leaves().length : 0
        };
    }
    
    // Helper functions
    function extractValue(item: any): number {
        if (typeof item === 'number') return item;
        if (item.value !== undefined) return item.value;
        if (item.stacks && Array.isArray(item.stacks)) {
            return item.stacks.reduce((sum: number, stack: any) => sum + (stack.value || 0), 0);
        }
        return 0;
    }
    
    function getLabel(item: any): string {
        if (typeof item === 'string') return item;
        if (item.label !== undefined) return item.label;
        if (item.name !== undefined) return item.name;
        return 'Unnamed';
    }
    
    function formatValue(value: number): string {
        if (Math.abs(value) >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
        if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(1)}K`;
        return value.toFixed(0);
    }
    
    // ========================================================================
    // RETURN LAYOUT SYSTEM INTERFACE
    // ========================================================================
    
    return {
        createTreemapLayout,
        renderTreemap,
        createPartitionLayout,
        renderPartition,
        createClusterLayout,
        renderCluster,
        createPackLayout,
        renderPack,
        transformWaterfallToHierarchy,
        createDrillDownNavigation,
        calculateHierarchicalMetrics
    };
}

// ============================================================================
// SPECIALIZED WATERFALL HIERARCHICAL UTILITIES
// ============================================================================

/**
 * Create hierarchical waterfall breakdown using treemap
 */
export function createWaterfallTreemap(
    data: any[],
    container: d3.Selection<any, any, any, any>,
    width: number,
    height: number
): void {
    const layoutSystem = createHierarchicalLayoutSystem();
    const AdvancedHierarchicalData = layoutSystem.transformWaterfallToHierarchy(data);
    
    const config: TreemapConfig = {
        width,
        height,
        padding: 2,
        tile: d3.treemapBinary,
        round: true,
        colorScale: d3.scaleOrdinal(d3.schemeSet3)
    };
    
    const layout = layoutSystem.createTreemapLayout(AdvancedHierarchicalData, config);
    layoutSystem.renderTreemap(container, layout, config);
}

/**
 * Create circular waterfall visualization using partition layout
 */
export function createWaterfallSunburst(
    data: any[],
    container: d3.Selection<any, any, any, any>,
    width: number,
    height: number
): void {
    const layoutSystem = createHierarchicalLayoutSystem();
    const AdvancedHierarchicalData = layoutSystem.transformWaterfallToHierarchy(data);
    
    const config: PartitionConfig = {
        width,
        height,
        innerRadius: 40,
        type: 'sunburst',
        colorScale: d3.scaleOrdinal(d3.schemeCategory10)
    };
    
    const layout = layoutSystem.createPartitionLayout(AdvancedHierarchicalData, config);
    layoutSystem.renderPartition(container, layout, config);
}

/**
 * Create bubble chart waterfall using pack layout
 */
export function createWaterfallBubbles(
    data: any[],
    container: d3.Selection<any, any, any, any>,
    width: number,
    height: number
): void {
    const layoutSystem = createHierarchicalLayoutSystem();
    const AdvancedHierarchicalData = layoutSystem.transformWaterfallToHierarchy(data);
    
    const config: PackConfig = {
        width,
        height,
        padding: 3,
        colorScale: d3.scaleOrdinal(d3.schemePastel1),
        sizeAccessor: d => Math.abs(d.value || 0)
    };
    
    const layout = layoutSystem.createPackLayout(AdvancedHierarchicalData, config);
    layoutSystem.renderPack(container, layout, config);
}
