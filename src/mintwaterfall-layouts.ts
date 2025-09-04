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
