import * as d3 from 'd3';
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
    enableDrag(config: DragConfig): void;
    disableDrag(): void;
    updateDragConstraints(constraints: DragConfig['constraints']): void;
    enableEnhancedHover(config: VoronoiConfig): void;
    disableEnhancedHover(): void;
    updateHoverExtent(extent: [[number, number], [number, number]]): void;
    startForceSimulation(config: ForceSimulationConfig): d3.Simulation<any, any>;
    stopForceSimulation(): void;
    updateForces(forces: ForceSimulationConfig['forces']): void;
    setInteractionMode(mode: 'drag' | 'voronoi' | 'force' | 'combined' | 'none'): void;
    getActiveInteractions(): string[];
    on(event: string, callback: Function): void;
    off(event: string): void;
    trigger(event: string, data?: any): void;
}
export declare function createAdvancedInteractionSystem(container: d3.Selection<any, any, any, any>, xScale: d3.ScaleLinear<number, number> | d3.ScaleBand<string>, yScale: d3.ScaleLinear<number, number>): InteractionSystem;
/**
 * Create drag behavior specifically optimized for waterfall charts
 */
export declare function createWaterfallDragBehavior(onValueChange: (data: any, newValue: number) => void, constraints?: {
    min?: number;
    max?: number;
}): DragConfig;
/**
 * Create voronoi configuration optimized for waterfall hover detection
 */
export declare function createWaterfallVoronoiConfig(chartWidth: number, chartHeight: number, margin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
}): VoronoiConfig;
/**
 * Create force simulation for animated waterfall reordering
 */
export declare function createWaterfallForceConfig(animationDuration?: number): ForceSimulationConfig;
//# sourceMappingURL=mintwaterfall-advanced-interactions.d.ts.map