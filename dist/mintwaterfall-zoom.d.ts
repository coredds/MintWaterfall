import * as d3 from 'd3';
export interface ZoomConfig {
    enabled: boolean;
    scaleExtent: [number, number];
    translateExtent: [[number, number], [number, number]] | null;
    wheelDelta: ((event: WheelEvent) => number) | null;
    touchable: boolean;
    filter: ((event: any) => boolean) | null;
    constrain: {
        x: boolean;
        y: boolean;
    };
    duration: number;
    ease: (t: number) => number;
}
export interface ChartDimensions {
    width: number;
    height: number;
    margin: {
        top: number;
        right: number;
        bottom: number;
        left: number;
    };
}
export interface ZoomEventData {
    transform: d3.ZoomTransform;
    sourceEvent: any;
}
export interface ZoomTransition {
    to: d3.ZoomTransform;
    duration?: number;
    ease?: (t: number) => number;
}
export interface ZoomBounds {
    x: [number, number];
    y: [number, number];
}
export interface ZoomSystem {
    enable(): ZoomSystem;
    disable(): ZoomSystem;
    attach(container: d3.Selection<any, any, any, any>): ZoomSystem;
    detach(): ZoomSystem;
    transform(selection: d3.Selection<any, any, any, any>, transform: d3.ZoomTransform, duration?: number): ZoomSystem;
    reset(duration?: number): ZoomSystem;
    zoomTo(bounds: ZoomBounds, duration?: number): ZoomSystem;
    setDimensions(dimensions: ChartDimensions): ZoomSystem;
    configure(newConfig: Partial<ZoomConfig>): ZoomSystem;
    getCurrentTransform(): d3.ZoomTransform;
    isEnabled(): boolean;
    on(type: string, callback: (event: ZoomEventData) => void): ZoomSystem;
    off(type: string, callback?: (event: ZoomEventData) => void): ZoomSystem;
}
export type ZoomEventType = 'zoomstart' | 'zoom' | 'zoomend' | 'reset';
export declare function createZoomSystem(): ZoomSystem;
//# sourceMappingURL=mintwaterfall-zoom.d.ts.map