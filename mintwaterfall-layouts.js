// MintWaterfall - D3.js compatible hierarchical layout system
// Implements d3.hierarchy, d3.treemap, d3.partition, and other layout algorithms

/* global d3 */

// Ensure we're in a browser context with D3
if (typeof d3 === "undefined" && typeof require !== "undefined") {
     
    d3 = require("d3");
}

/**
 * Creates a hierarchical layout system for advanced data visualization
 * @returns {Object} Layout system API
 */
export function createHierarchicalLayout() {
    let size = [800, 400];
    let padding = 0;
    let round = false;
    let layoutType = "treemap"; // "treemap", "partition", "pack", "cluster", "tree"
    let paddingInner = 0;
    let paddingOuter = 0;
    let paddingTop = 0;
    let paddingRight = 0;
    let paddingBottom = 0;
    let paddingLeft = 0;
    let ratio = 1.618033988749895; // Golden ratio by default
    
    // Additional layout-specific options
    let partitionOptions = {
        orientation: "horizontal" // "horizontal" or "vertical"
    };
    
    let treeOptions = {
        nodeSize: null,
        separation: null
    };
    
    /**
     * Main layout function that processes hierarchical data
     * @param {Object} data - d3.hierarchy compatible data
     * @returns {Object} Processed layout data
     */
    function layout(data) {
        if (!data) {
            console.error("MintWaterfall: No hierarchical data provided to layout");
            return null;
        }
        
        // Ensure we have a d3.hierarchy object
        const root = data.sum ? data : d3.hierarchy(data);
        
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
     * @param {Object} root - d3.hierarchy data
     * @returns {Object} Processed layout data
     */
    function applyTreemapLayout(root) {
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
        
        // Note: .ratio() is not a standard D3.js treemap method
        // The ratio is controlled by the tiling algorithm instead
        
        return treemap(root);
    }
    
    /**
     * Applies partition layout to hierarchical data
     * @param {Object} root - d3.hierarchy data
     * @returns {Object} Processed layout data
     */
    function applyPartitionLayout(root) {
        const partitionLayout = d3.partition()
            .size(size)
            .round(round)
            .padding(padding);
        
        // Apply partition layout
        const result = partitionLayout(root);
        
        // Handle orientation for partition layout
        if (partitionOptions.orientation === "vertical") {
            // Swap x/y coordinates and dimensions for vertical orientation
            result.each(node => {
                const temp = node.x0;
                node.x0 = node.y0;
                node.y0 = temp;
                
                const tempX1 = node.x1;
                node.x1 = node.y1;
                node.y1 = tempX1;
            });
        }
        
        return result;
    }
    
    /**
     * Applies pack layout to hierarchical data
     * @param {Object} root - d3.hierarchy data
     * @returns {Object} Processed layout data
     */
    function applyPackLayout(root) {
        return d3.pack()
            .size(size)
            .padding(padding)
            (root);
    }
    
    /**
     * Applies cluster layout to hierarchical data
     * @param {Object} root - d3.hierarchy data
     * @returns {Object} Processed layout data
     */
    function applyClusterLayout(root) {
        const clusterLayout = d3.cluster()
            .size(size);
            
        if (treeOptions.nodeSize) {
            clusterLayout.nodeSize(treeOptions.nodeSize);
        }
        
        if (treeOptions.separation) {
            clusterLayout.separation(treeOptions.separation);
        }
        
        return clusterLayout(root);
    }
    
    /**
     * Applies tree layout to hierarchical data
     * @param {Object} root - d3.hierarchy data
     * @returns {Object} Processed layout data
     */
    function applyTreeLayout(root) {
        const treeLayout = d3.tree()
            .size(size);
            
        if (treeOptions.nodeSize) {
            treeLayout.nodeSize(treeOptions.nodeSize);
        }
        
        if (treeOptions.separation) {
            treeLayout.separation(treeOptions.separation);
        }
        
        return treeLayout(root);
    }
    
    // Getter/setter methods for chainable API
    layout.size = function(_) {
        return arguments.length ? (size = _, layout) : size;
    };
    
    layout.padding = function(_) {
        return arguments.length ? (padding = _, layout) : padding;
    };
    
    layout.paddingInner = function(_) {
        return arguments.length ? (paddingInner = _, layout) : paddingInner;
    };
    
    layout.paddingOuter = function(_) {
        return arguments.length ? (paddingOuter = _, layout) : paddingOuter;
    };
    
    layout.paddingTop = function(_) {
        return arguments.length ? (paddingTop = _, layout) : paddingTop;
    };
    
    layout.paddingRight = function(_) {
        return arguments.length ? (paddingRight = _, layout) : paddingRight;
    };
    
    layout.paddingBottom = function(_) {
        return arguments.length ? (paddingBottom = _, layout) : paddingBottom;
    };
    
    layout.paddingLeft = function(_) {
        return arguments.length ? (paddingLeft = _, layout) : paddingLeft;
    };
    
    layout.round = function(_) {
        return arguments.length ? (round = _, layout) : round;
    };
    
    layout.ratio = function(_) {
        return arguments.length ? (ratio = _, layout) : ratio;
    };
    
    layout.type = function(_) {
        return arguments.length ? (layoutType = _, layout) : layoutType;
    };
    
    layout.partitionOrientation = function(_) {
        return arguments.length ? (partitionOptions.orientation = _, layout) : partitionOptions.orientation;
    };
    
    layout.nodeSize = function(_) {
        return arguments.length ? (treeOptions.nodeSize = _, layout) : treeOptions.nodeSize;
    };
    
    layout.separation = function(_) {
        return arguments.length ? (treeOptions.separation = _, layout) : treeOptions.separation;
    };
    
    return layout;
}

/**
 * Helper function to create hierarchical data structure from flat data
 * @param {Array} data - Flat data array
 * @param {Function} idAccessor - Function to get node ID
 * @param {Function} parentAccessor - Function to get parent ID
 * @param {Function} valueAccessor - Function to get node value
 * @returns {Object} Hierarchical data structure
 */
export function createHierarchyFromFlatData(data, idAccessor, parentAccessor, valueAccessor) {
    if (!data || !Array.isArray(data) || data.length === 0) {
        console.error("MintWaterfall: Invalid data provided to createHierarchyFromFlatData");
        return null;
    }
    
    // Create map for fast lookup
    const dataMap = new Map();
    
    // First pass: create nodes
    const root = {
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
        
        const node = {
            id,
            name: id,
            data: item,
            value: valueAccessor ? valueAccessor(item) : null,
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
        
        if (parent && node) {
            parent.children.push(node);
        }
    });
    
    // Return the root node
    return root;
}

/**
 * Creates a d3.hierarchy object from data
 * @param {Object|Array} data - Hierarchical data or flat data array
 * @param {Object} options - Configuration options
 * @returns {Object} d3.hierarchy object
 */
export function createHierarchy(data, options = {}) {
    if (!data) {
        console.error("MintWaterfall: No data provided to createHierarchy");
        return null;
    }
    
    let hierarchyData;
    
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
        hierarchyData = data;
    }
    
    // Create d3.hierarchy object
    const hierarchy = d3.hierarchy(hierarchyData);
    
    // Apply value accessor if provided
    if (options.valueAccessor) {
        hierarchy.sum(d => {
            // For leaf nodes, use the value accessor
            if (!d.children || d.children.length === 0) {
                return d.value !== undefined ? d.value : (options.valueAccessor(d) || 0);
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
 * @param {Object} layoutData - Processed layout data
 * @param {Object} options - Extraction options
 * @returns {Array} Extracted data
 */
export function extractLayoutData(layoutData, options = {}) {
    if (!layoutData) {
        console.error("MintWaterfall: No layout data provided to extractLayoutData");
        return [];
    }
    
    const result = [];
    const includeRoot = options.includeRoot || false;
    const includeInternal = options.includeInternal || false;
    const maxDepth = options.maxDepth || Infinity;
    
    // Traverse the hierarchy
    layoutData.each(node => {
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
        
        // Extract node data
        result.push({
            id: node.data.id || `node-${node.depth}-${node.height}`,
            name: node.data.name || "",
            value: node.value,
            depth: node.depth,
            height: node.height,
            parent: node.parent ? (node.parent.data.id || `node-${node.parent.depth}-${node.parent.height}`) : null,
            x0: node.x0,
            y0: node.y0,
            x1: node.x1,
            y1: node.y1,
            r: node.r, // For pack layout
            originalData: node.data
        });
    });
    
    return result;
}

/**
 * Helper function to convert hierarchical layout to waterfall-compatible format
 * @param {Object} layoutData - Processed layout data
 * @param {Object} options - Conversion options
 * @returns {Array} Waterfall-compatible data
 */
export function convertToWaterfallFormat(layoutData, options = {}) {
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
                color: typeof colorScale === "function" ? colorScale(node.depth) : colorScale,
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
export const hierarchyLayouts = {
    treemap: function(data, options = {}) {
        const layout = createHierarchicalLayout()
            .type("treemap")
            .size(options.size || [800, 400])
            .padding(options.padding || 1);
            
        const hierarchy = createHierarchy(data, options);
        return layout(hierarchy);
    },
    
    partition: function(data, options = {}) {
        const layout = createHierarchicalLayout()
            .type("partition")
            .size(options.size || [800, 400])
            .padding(options.padding || 1)
            .partitionOrientation(options.orientation || "horizontal");
            
        const hierarchy = createHierarchy(data, options);
        return layout(hierarchy);
    },
    
    pack: function(data, options = {}) {
        const layout = createHierarchicalLayout()
            .type("pack")
            .size(options.size || [800, 400])
            .padding(options.padding || 1);
            
        const hierarchy = createHierarchy(data, options);
        return layout(hierarchy);
    }
};
