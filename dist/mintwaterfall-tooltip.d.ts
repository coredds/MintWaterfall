import * as d3 from 'd3';
export interface TooltipOffset {
    x: number;
    y: number;
}
export interface TooltipAnimation {
    duration: number;
    easing: string;
}
export interface TooltipCollision {
    boundary: 'viewport' | 'container';
    flip: boolean;
    shift: boolean;
}
export interface TooltipContent {
    maxWidth: number;
    padding: number;
}
export interface TooltipConfig {
    className: string;
    theme: TooltipTheme;
    position: TooltipPosition;
    offset: TooltipOffset;
    animation: TooltipAnimation;
    collision: TooltipCollision;
    content: TooltipContent;
    formatNumber?: (n: number) => string;
}
export interface TooltipThemeStyles {
    background: string;
    color: string;
    border: string;
    borderRadius: string;
    fontSize: string;
    fontFamily: string;
    boxShadow: string;
    maxWidth: string;
    padding: string;
}
export interface TooltipTemplateConfig {
    template: string;
    formatters?: {
        [key: string]: (value: any) => string;
    };
}
export interface TooltipData {
    label: string;
    stacks?: Array<{
        value: number;
        color?: string;
        label?: string;
    }>;
    [key: string]: any;
}
export interface TooltipStackItem {
    value: number;
    color?: string;
    label?: string;
}
export interface CurrentTooltip {
    content: TooltipContentType;
    event: MouseEvent | PointerEvent | TouchEvent;
    data: TooltipData | null;
}
export interface TooltipPosition3D {
    x: number;
    y: number;
    quadrant: number;
}
export interface TooltipSystem {
    show(content: TooltipContentType, event: MouseEvent | PointerEvent | TouchEvent, data?: TooltipData | null): d3.Selection<HTMLDivElement, unknown, HTMLElement, any>;
    hide(): d3.Selection<HTMLDivElement, unknown, HTMLElement, any> | void;
    move(event: MouseEvent | PointerEvent | TouchEvent): d3.Selection<HTMLDivElement, unknown, HTMLElement, any> | void;
    theme(themeName: TooltipTheme): TooltipSystem;
    configure(newConfig: Partial<TooltipConfig>): TooltipSystem;
    destroy(): void;
    isVisible(): boolean;
    getCurrentData(): TooltipData | null;
}
export type TooltipTheme = 'default' | 'light' | 'minimal' | 'corporate';
export type TooltipPosition = 'smart' | 'top' | 'bottom' | 'left' | 'right' | 'follow';
export type TooltipContentType = string | TooltipTemplateConfig | ((data: TooltipData | null) => string);
export declare function createTooltipSystem(): TooltipSystem;
//# sourceMappingURL=mintwaterfall-tooltip.d.ts.map