// MintWaterfall Hierarchical Layout Extensions
// Advanced D3.js hierarchical layouts for multi-dimensional waterfall analysis

import * as d3 from 'd3';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

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
    tile: any; // Simplified type for compatibility
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
    // Treemap layout for nested waterfall breakdowns
    createTreemapLayout(data: HierarchicalData, config: TreemapConfig): d3.HierarchyRectangularNode<HierarchicalData>;
    renderTreemap(container: d3.Selection<any, any, any, any>, layout: d3.HierarchyRectangularNode<HierarchicalData>, config: TreemapConfig): void;
    
    // Partition layout for circular/radial waterfall views
    createPartitionLayout(data: HierarchicalData, config: PartitionConfig): d3.HierarchyRectangularNode<HierarchicalData>;
    renderPartition(container: d3.Selection<any, any, any, any>, layout: d3.HierarchyRectangularNode<HierarchicalData>, config: PartitionConfig): void;
    
    // Cluster layout for dendogram-style categorization
    createClusterLayout(data: HierarchicalData, config: ClusterConfig): d3.HierarchyPointNode<HierarchicalData>;
    renderCluster(container: d3.Selection<any, any, any, any>, layout: d3.HierarchyPointNode<HierarchicalData>, config: ClusterConfig): void;
    
    // Pack layout for bubble-based grouped waterfalls
    createPackLayout(data: HierarchicalData, config: PackConfig): d3.HierarchyCircularNode<HierarchicalData>;
    renderPack(container: d3.Selection<any, any, any, any>, layout: d3.HierarchyCircularNode<HierarchicalData>, config: PackConfig): void;
    
    // Utility functions
    transformWaterfallToHierarchy(waterfallData: any[]): HierarchicalData;
    createDrillDownNavigation(data: HierarchicalData): any[];
    calculateHierarchicalMetrics(node: d3.HierarchyNode<HierarchicalData>): any;
}

// ============================================================================
// HIERARCHICAL LAYOUT SYSTEM IMPLEMENTATION
// ============================================================================

export function createHierarchicalLayoutSystem(): HierarchicalLayoutSystem {
    
    // ========================================================================
    // TREEMAP LAYOUT (d3.treemap)
    // ========================================================================
    
    function createTreemapLayout(data: HierarchicalData, config: TreemapConfig): d3.HierarchyRectangularNode<HierarchicalData> {
        // Create hierarchy
        const root = d3.hierarchy(data)
            .sum(d => d.value || 0)
            .sort((a, b) => (b.value || 0) - (a.value || 0));
        
        // Create treemap layout
        const treemap = d3.treemap<HierarchicalData>()
            .size([config.width, config.height])
            .padding(config.padding)
            .tile(config.tile)
            .round(config.round);
        
        return treemap(root);
    }
    
    function renderTreemap(
        container: d3.Selection<any, any, any, any>, 
        layout: d3.HierarchyRectangularNode<HierarchicalData>, 
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
    
    function createPartitionLayout(data: HierarchicalData, config: PartitionConfig): d3.HierarchyRectangularNode<HierarchicalData> {
        // Create hierarchy
        const root = d3.hierarchy(data)
            .sum(d => d.value || 0)
            .sort((a, b) => (b.value || 0) - (a.value || 0));
        
        // Create partition layout
        const partition = d3.partition<HierarchicalData>()
            .size([2 * Math.PI, Math.min(config.width, config.height) / 2]);
        
        return partition(root);
    }
    
    function renderPartition(
        container: d3.Selection<any, any, any, any>, 
        layout: d3.HierarchyRectangularNode<HierarchicalData>, 
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
        layout: d3.HierarchyRectangularNode<HierarchicalData>,
        colorScale: d3.ScaleOrdinal<string, string>,
        radius: number,
        innerRadius: number,
        config: PartitionConfig
    ): void {
        const arc = d3.arc<d3.HierarchyRectangularNode<HierarchicalData>>()
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
        layout: d3.HierarchyRectangularNode<HierarchicalData>,
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
    
    function createClusterLayout(data: HierarchicalData, config: ClusterConfig): d3.HierarchyPointNode<HierarchicalData> {
        // Create hierarchy
        const root = d3.hierarchy(data);
        
        // Create cluster layout
        const cluster = d3.cluster<HierarchicalData>()
            .size([config.width, config.height])
            .nodeSize(config.nodeSize);
        
        if (config.separation) {
            cluster.separation(config.separation);
        }
        
        return cluster(root);
    }
    
    function renderCluster(
        container: d3.Selection<any, any, any, any>, 
        layout: d3.HierarchyPointNode<HierarchicalData>, 
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
            .attr('d', d3.linkHorizontal<d3.HierarchyPointLink<HierarchicalData>, d3.HierarchyPointNode<HierarchicalData>>()
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
    
    function createPackLayout(data: HierarchicalData, config: PackConfig): d3.HierarchyCircularNode<HierarchicalData> {
        // Create hierarchy
        const root = d3.hierarchy(data)
            .sum(config.sizeAccessor || (d => d.value || 0))
            .sort((a, b) => (b.value || 0) - (a.value || 0));
        
        // Create pack layout
        const pack = d3.pack<HierarchicalData>()
            .size([config.width, config.height])
            .padding(config.padding);
        
        return pack(root);
    }
    
    function renderPack(
        container: d3.Selection<any, any, any, any>, 
        layout: d3.HierarchyCircularNode<HierarchicalData>, 
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
    
    function transformWaterfallToHierarchy(waterfallData: any[]): HierarchicalData {
        // Group data by categories if available
        const grouped = d3.group(waterfallData, d => d.category || 'Default');
        
        const children: HierarchicalData[] = [];
        
        for (const [category, items] of grouped) {
            const categoryNode: HierarchicalData = {
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
    
    function createDrillDownNavigation(data: HierarchicalData): any[] {
        const navigation: any[] = [];
        
        function traverse(node: HierarchicalData, path: string[] = []): void {
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
    
    function calculateHierarchicalMetrics(node: d3.HierarchyNode<HierarchicalData>): any {
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
    const hierarchicalData = layoutSystem.transformWaterfallToHierarchy(data);
    
    const config: TreemapConfig = {
        width,
        height,
        padding: 2,
        tile: d3.treemapBinary,
        round: true,
        colorScale: d3.scaleOrdinal(d3.schemeSet3)
    };
    
    const layout = layoutSystem.createTreemapLayout(hierarchicalData, config);
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
    const hierarchicalData = layoutSystem.transformWaterfallToHierarchy(data);
    
    const config: PartitionConfig = {
        width,
        height,
        innerRadius: 40,
        type: 'sunburst',
        colorScale: d3.scaleOrdinal(d3.schemeCategory10)
    };
    
    const layout = layoutSystem.createPartitionLayout(hierarchicalData, config);
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
    const hierarchicalData = layoutSystem.transformWaterfallToHierarchy(data);
    
    const config: PackConfig = {
        width,
        height,
        padding: 3,
        colorScale: d3.scaleOrdinal(d3.schemePastel1),
        sizeAccessor: d => Math.abs(d.value || 0)
    };
    
    const layout = layoutSystem.createPackLayout(hierarchicalData, config);
    layoutSystem.renderPack(container, layout, config);
}
