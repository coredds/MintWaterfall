// MintWaterfall Advanced Interactions
// Sophisticated D3.js interaction capabilities for enhanced waterfall analysis

import * as d3 from 'd3';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface DragConfig {
    enabled: boolean;
    axis: 'both' | 'horizontal' | 'vertical';
    constraints?: {
        minValue?: number;
        maxValue?: number;
        snapToGrid?: boolean;
        gridSize?: number;
    };
    onDragStart?: (event: d3.D3DragEvent<any, any, any>, data: any) => void;
    onDrag?: (event: d3.D3DragEvent<any, any, any>, data: any) => void;
    onDragEnd?: (event: d3.D3DragEvent<any, any, any>, data: any) => void;
}

export interface VoronoiConfig {
    enabled: boolean;
    extent: [[number, number], [number, number]];
    showCells?: boolean;
    cellOpacity?: number;
    onCellEnter?: (event: MouseEvent, data: any) => void;
    onCellLeave?: (event: MouseEvent, data: any) => void;
    onCellClick?: (event: MouseEvent, data: any) => void;
}

export interface ForceSimulationConfig {
    enabled: boolean;
    forces: {
        collision?: boolean;
        centering?: boolean;
        positioning?: boolean;
        links?: boolean;
    };
    strength: {
        collision?: number;
        centering?: number;
        positioning?: number;
        links?: number;
    };
    duration?: number;
    onTick?: (simulation: d3.Simulation<any, any>) => void;
    onEnd?: (simulation: d3.Simulation<any, any>) => void;
}

export interface InteractionSystem {
    // Drag functionality
    enableDrag(config: DragConfig): void;
    disableDrag(): void;
    updateDragConstraints(constraints: DragConfig['constraints']): void;
    
    // Enhanced hover detection (simplified approach)
    enableEnhancedHover(config: VoronoiConfig): void;
    disableEnhancedHover(): void;
    updateHoverExtent(extent: [[number, number], [number, number]]): void;
    
    // Force simulation for dynamic layouts
    startForceSimulation(config: ForceSimulationConfig): d3.Simulation<any, any>;
    stopForceSimulation(): void;
    updateForces(forces: ForceSimulationConfig['forces']): void;
    
    // Combined interaction management
    setInteractionMode(mode: 'drag' | 'voronoi' | 'force' | 'combined' | 'none'): void;
    getActiveInteractions(): string[];
    
    // Event management
    on(event: string, callback: Function): void;
    off(event: string): void;
    trigger(event: string, data?: any): void;
}

// ============================================================================
// ADVANCED INTERACTION SYSTEM IMPLEMENTATION
// ============================================================================

export function createAdvancedInteractionSystem(
    container: d3.Selection<any, any, any, any>,
    xScale: d3.ScaleLinear<number, number> | d3.ScaleBand<string>,
    yScale: d3.ScaleLinear<number, number>
): InteractionSystem {
    
    // Internal state
    let dragBehavior: d3.DragBehavior<any, any, any> | null = null;
    let enhancedHoverEnabled: boolean = false;
    let forceSimulation: d3.Simulation<any, any> | null = null;
    let currentData: any[] = [];
    let eventListeners: Map<string, Function> = new Map();
    
    // ========================================================================
    // DRAG FUNCTIONALITY (d3.drag)
    // ========================================================================
    
    function enableDrag(config: DragConfig): void {
        if (!config.enabled) {
            disableDrag();
            return;
        }
        
        // Create drag behavior
        dragBehavior = d3.drag<any, any>()
            .on('start', (event, d) => {
                // Visual feedback on drag start
                d3.select(event.sourceEvent.target)
                    .raise()
                    .attr('stroke', '#ff6b6b')
                    .attr('stroke-width', 2);
                
                if (config.onDragStart) {
                    config.onDragStart(event, d);
                }
                
                trigger('dragStart', { event, data: d });
            })
            .on('drag', (event, d) => {
                const bar = d3.select(event.sourceEvent.target);
                let newValue = d.value || 0;
                
                // Handle axis constraints
                if (config.axis === 'vertical' || config.axis === 'both') {
                    const newY = event.y;
                    newValue = yScale.invert(newY);
                    
                    // Apply constraints
                    if (config.constraints) {
                        const { minValue, maxValue, snapToGrid, gridSize } = config.constraints;
                        
                        if (minValue !== undefined) newValue = Math.max(minValue, newValue);
                        if (maxValue !== undefined) newValue = Math.min(maxValue, newValue);
                        
                        if (snapToGrid && gridSize) {
                            newValue = Math.round(newValue / gridSize) * gridSize;
                        }
                    }
                    
                    // Update visual position
                    const barHeight = Math.abs(yScale(0) - yScale(newValue));
                    const barY = newValue >= 0 ? yScale(newValue) : yScale(0);
                    
                    bar.attr('y', barY)
                       .attr('height', barHeight);
                    
                    // Update data
                    d.value = newValue;
                    if (d.stacks && d.stacks.length > 0) {
                        d.stacks[0].value = newValue;
                    }
                }
                
                // Handle horizontal movement (for reordering)
                if (config.axis === 'horizontal' || config.axis === 'both') {
                    const newX = event.x;
                    // Implementation for horizontal dragging/reordering
                    const barWidth = parseFloat(bar.attr('width') || '0');
                    bar.attr('transform', `translate(${newX - barWidth / 2}, 0)`);
                }
                
                if (config.onDrag) {
                    config.onDrag(event, d);
                }
                
                trigger('drag', { event, data: d, newValue });
            })
            .on('end', (event, d) => {
                // Remove visual feedback
                d3.select(event.sourceEvent.target)
                    .attr('stroke', null)
                    .attr('stroke-width', null);
                
                if (config.onDragEnd) {
                    config.onDragEnd(event, d);
                }
                
                trigger('dragEnd', { event, data: d });
            });
        
        // Apply drag behavior to all bars
        container.selectAll('.bar')
            .call(dragBehavior);
        
        trigger('dragEnabled', config);
    }
    
    function disableDrag(): void {
        if (dragBehavior) {
            container.selectAll('.bar')
                .on('.drag', null);
            dragBehavior = null;
            trigger('dragDisabled');
        }
    }
    
    function updateDragConstraints(constraints: DragConfig['constraints']): void {
        // Constraints are checked during drag events
        trigger('dragConstraintsUpdated', constraints);
    }
    
    // ========================================================================
    // ENHANCED HOVER DETECTION (Simplified approach)
    // ========================================================================
    
    function enableEnhancedHover(config: VoronoiConfig): void {
        if (!config.enabled || currentData.length === 0) {
            disableEnhancedHover();
            return;
        }
        
        enhancedHoverEnabled = true;
        
        // Create enhanced hover zones around bars
        const hoverGroup = container.selectAll('.enhanced-hover-group')
            .data([0]);
        
        const hoverGroupEnter = hoverGroup.enter()
            .append('g')
            .attr('class', 'enhanced-hover-group');
        
        const hoverGroupMerged = hoverGroupEnter.merge(hoverGroup as any);
        
        // Add enhanced hover zones
        const zones = hoverGroupMerged.selectAll('.hover-zone')
            .data(currentData);
        
        zones.enter()
            .append('rect')
            .attr('class', 'hover-zone')
            .merge(zones as any)
            .attr('x', d => getBarCenterX(d) - getBarWidth(d) * 0.75)
            .attr('y', d => Math.min(getBarCenterY(d), yScale(0)) - 10)
            .attr('width', d => getBarWidth(d) * 1.5)
            .attr('height', d => Math.abs(yScale(0) - getBarCenterY(d)) + 20)
            .style('fill', 'transparent')
            .style('pointer-events', 'all')
            .on('mouseenter', function(event, d) {
                highlightBar(d);
                if (config.onCellEnter) {
                    config.onCellEnter(event, d);
                }
                trigger('enhancedHoverEnter', { event, data: d });
            })
            .on('mouseleave', function(event, d) {
                unhighlightBar(d);
                if (config.onCellLeave) {
                    config.onCellLeave(event, d);
                }
                trigger('enhancedHoverLeave', { event, data: d });
            })
            .on('click', function(event, d) {
                if (config.onCellClick) {
                    config.onCellClick(event, d);
                }
                trigger('enhancedHoverClick', { event, data: d });
            });
        
        zones.exit().remove();
        
        trigger('enhancedHoverEnabled', config);
    }
    
    function disableEnhancedHover(): void {
        container.selectAll('.enhanced-hover-group').remove();
        enhancedHoverEnabled = false;
        trigger('enhancedHoverDisabled');
    }
    
    function updateHoverExtent(extent: [[number, number], [number, number]]): void {
        if (enhancedHoverEnabled) {
            // Re-enable with current data
            const currentConfig = { enabled: true, extent };
            enableEnhancedHover(currentConfig);
        }
    }
    
    // ========================================================================
    // FORCE SIMULATION FOR DYNAMIC LAYOUTS (d3.forceSimulation)
    // ========================================================================
    
    function startForceSimulation(config: ForceSimulationConfig): d3.Simulation<any, any> {
        if (!config.enabled || currentData.length === 0) {
            return d3.forceSimulation([]) as unknown as d3.Simulation<any, any>;
        }
        
        // Stop any existing simulation
        stopForceSimulation();
        
        // Create new simulation
        forceSimulation = d3.forceSimulation(currentData);
        
        // Add forces based on configuration
        if (config.forces.collision) {
            forceSimulation.force('collision', d3.forceCollide()
                .radius(d => getBarWidth(d) / 2 + 5)
                .strength(config.strength.collision || 0.7));
        }
        
        if (config.forces.centering) {
            const centerX = (xScale.range()[0] + xScale.range()[1]) / 2;
            const centerY = (yScale.range()[0] + yScale.range()[1]) / 2;
            forceSimulation.force('center', d3.forceCenter(centerX, centerY)
                .strength(config.strength.centering || 0.1));
        }
        
        if (config.forces.positioning) {
            forceSimulation.force('x', d3.forceX(d => getBarCenterX(d))
                .strength(config.strength.positioning || 0.5));
            forceSimulation.force('y', d3.forceY(d => getBarCenterY(d))
                .strength(config.strength.positioning || 0.5));
        }
        
        if (config.forces.links && currentData.length > 1) {
            // Create links between consecutive bars
            const links = currentData.slice(1).map((d, i) => ({
                source: currentData[i],
                target: d
            }));
            
            forceSimulation.force('link', d3.forceLink(links)
                .distance(50)
                .strength(config.strength.links || 0.3));
        }
        
        // Set up tick handler
        forceSimulation.on('tick', () => {
            updateBarPositions();
            if (config.onTick && forceSimulation) {
                config.onTick(forceSimulation);
            }
            trigger('forceTick', forceSimulation);
        });
        
        // Set up end handler
        forceSimulation.on('end', () => {
            if (config.onEnd && forceSimulation) {
                config.onEnd(forceSimulation);
            }
            trigger('forceEnd', forceSimulation);
        });
        
        // Set alpha decay for animation duration
        if (config.duration) {
            const targetAlpha = 0.001;
            const decay = 1 - Math.pow(targetAlpha, 1 / config.duration);
            forceSimulation.alphaDecay(decay);
        }
        
        trigger('forceSimulationStarted', config);
        return forceSimulation;
    }
    
    function stopForceSimulation(): void {
        if (forceSimulation) {
            forceSimulation.stop();
            forceSimulation = null;
            trigger('forceSimulationStopped');
        }
    }
    
    function updateForces(forces: ForceSimulationConfig['forces']): void {
        if (forceSimulation) {
            // Update or remove forces based on configuration
            if (!forces.collision) forceSimulation.force('collision', null);
            if (!forces.centering) forceSimulation.force('center', null);
            if (!forces.positioning) {
                forceSimulation.force('x', null);
                forceSimulation.force('y', null);
            }
            if (!forces.links) forceSimulation.force('link', null);
            
            forceSimulation.alpha(1).restart();
            trigger('forcesUpdated', forces);
        }
    }
    
    // ========================================================================
    // INTERACTION MODE MANAGEMENT
    // ========================================================================
    
    function setInteractionMode(mode: 'drag' | 'voronoi' | 'force' | 'combined' | 'none'): void {
        // Disable all interactions first
        disableDrag();
        disableEnhancedHover();
        stopForceSimulation();
        
        const xRange = (xScale as any).range() || [0, 800];
        const yRange = (yScale as any).range() || [400, 0];
        
        switch (mode) {
            case 'drag':
                enableDrag({
                    enabled: true,
                    axis: 'vertical',
                    constraints: { snapToGrid: true, gridSize: 10 }
                });
                break;
                
            case 'voronoi':
                enableEnhancedHover({
                    enabled: true,
                    extent: [[0, 0], [xRange[1], yRange[0]]]
                });
                break;
                
            case 'force':
                startForceSimulation({
                    enabled: true,
                    forces: { collision: true, positioning: true },
                    strength: { collision: 0.7, positioning: 0.5 },
                    duration: 1000
                });
                break;
                
            case 'combined':
                enableEnhancedHover({
                    enabled: true,
                    extent: [[0, 0], [xRange[1], yRange[0]]]
                });
                enableDrag({
                    enabled: true,
                    axis: 'vertical'
                });
                break;
                
            case 'none':
            default:
                // All interactions disabled
                break;
        }
        
        trigger('interactionModeChanged', mode);
    }
    
    function getActiveInteractions(): string[] {
        const active: string[] = [];
        if (dragBehavior) active.push('drag');
        if (enhancedHoverEnabled) active.push('hover');
        if (forceSimulation) active.push('force');
        return active;
    }
    
    // ========================================================================
    // EVENT MANAGEMENT
    // ========================================================================
    
    function on(event: string, callback: Function): void {
        eventListeners.set(event, callback);
    }
    
    function off(event: string): void {
        eventListeners.delete(event);
    }
    
    function trigger(event: string, data?: any): void {
        const callback = eventListeners.get(event);
        if (callback) {
            callback(data);
        }
    }
    
    // ========================================================================
    // UTILITY FUNCTIONS
    // ========================================================================
    
    function getBarCenterX(d: any): number {
        const scale = xScale as any; // Type assertion for compatibility
        if (scale.bandwidth) {
            // Band scale
            return (scale(d.label) || 0) + scale.bandwidth() / 2;
        } else {
            // Linear scale - assume equal spacing
            return scale(parseFloat(d.label) || 0);
        }
    }
    
    function getBarCenterY(d: any): number {
        const value = d.value || (d.stacks && d.stacks[0] ? d.stacks[0].value : 0);
        return yScale(value / 2);
    }
    
    function getBarWidth(d: any): number {
        const scale = xScale as any; // Type assertion for compatibility
        if (scale.bandwidth) {
            return scale.bandwidth();
        }
        return 40; // Default width for linear scales
    }
    
    function highlightBar(data: any): void {
        container.selectAll('.bar')
            .filter((d: any) => d === data)
            .transition()
            .duration(150)
            .attr('opacity', 0.8)
            .attr('stroke', '#ff6b6b')
            .attr('stroke-width', 2);
    }
    
    function unhighlightBar(data: any): void {
        container.selectAll('.bar')
            .filter((d: any) => d === data)
            .transition()
            .duration(150)
            .attr('opacity', 1)
            .attr('stroke', null)
            .attr('stroke-width', null);
    }
    
    function updateBarPositions(): void {
        if (!forceSimulation) return;
        
        container.selectAll('.bar')
            .data(currentData)
            .attr('transform', (d: any) => {
                const x = (d as any).x || getBarCenterX(d);
                const y = (d as any).y || getBarCenterY(d);
                return `translate(${x - getBarWidth(d) / 2}, ${y})`;
            });
    }
    
    // ========================================================================
    // PUBLIC API
    // ========================================================================
    
    // Method to update data for interactions
    function updateData(data: any[]): void {
        currentData = data;
        
        // Update active interactions with new data
        if (enhancedHoverEnabled) {
            const config = { enabled: true, extent: [[0, 0], [800, 600]] as [[number, number], [number, number]] };
            enableEnhancedHover(config);
        }
        
        if (forceSimulation) {
            forceSimulation.nodes(data);
            forceSimulation.alpha(1).restart();
        }
    }
    
    return {
        enableDrag,
        disableDrag,
        updateDragConstraints,
        enableEnhancedHover,
        disableEnhancedHover,
        updateHoverExtent,
        startForceSimulation,
        stopForceSimulation,
        updateForces,
        setInteractionMode,
        getActiveInteractions,
        on,
        off,
        trigger
    };
}

// ============================================================================
// SPECIALIZED WATERFALL INTERACTION UTILITIES
// ============================================================================

/**
 * Create drag behavior specifically optimized for waterfall charts
 */
export function createWaterfallDragBehavior(
    onValueChange: (data: any, newValue: number) => void,
    constraints?: { min?: number; max?: number }
): DragConfig {
    return {
        enabled: true,
        axis: 'vertical',
        constraints: {
            minValue: constraints?.min,
            maxValue: constraints?.max,
            snapToGrid: true,
            gridSize: 100 // Snap to hundreds
        },
        onDrag: (event, data) => {
            if (onValueChange) {
                onValueChange(data, data.value);
            }
        }
    };
}

/**
 * Create voronoi configuration optimized for waterfall hover detection
 */
export function createWaterfallVoronoiConfig(
    chartWidth: number,
    chartHeight: number,
    margin: { top: number; right: number; bottom: number; left: number }
): VoronoiConfig {
    return {
        enabled: true,
        extent: [
            [margin.left, margin.top],
            [chartWidth - margin.right, chartHeight - margin.bottom]
        ],
        showCells: false,
        cellOpacity: 0.1
    };
}

/**
 * Create force simulation for animated waterfall reordering
 */
export function createWaterfallForceConfig(
    animationDuration: number = 1000
): ForceSimulationConfig {
    return {
        enabled: true,
        forces: {
            collision: true,
            positioning: true,
            centering: false,
            links: false
        },
        strength: {
            collision: 0.8,
            positioning: 0.6
        },
        duration: animationDuration
    };
}
