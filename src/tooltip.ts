// MintWaterfall Professional Tooltip System - TypeScript Version
// Provides intelligent positioning, rich content, and customizable styling with full type safety

import * as d3 from 'd3';

// Type definitions for tooltip system
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
    formatters?: { [key: string]: (value: any) => string };
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

export function createTooltipSystem(): TooltipSystem {
    
    let tooltipContainer: d3.Selection<HTMLDivElement, unknown, HTMLElement, any> | null = null;
    let currentTooltip: CurrentTooltip | null = null;
    let config: TooltipConfig = {
        className: "mintwaterfall-tooltip",
        theme: "default",
        position: "smart",
        offset: { x: 10, y: -10 },
        animation: {
            duration: 200,
            easing: "ease-out"
        },
        collision: {
            boundary: "viewport",
            flip: true,
            shift: true
        },
        content: {
            maxWidth: 300,
            padding: 12
        }
    };
    
    // Initialize tooltip container
    function initializeTooltip(): d3.Selection<HTMLDivElement, unknown, HTMLElement, any> {
        if (tooltipContainer) return tooltipContainer;
        
        tooltipContainer = d3.select("body")
            .append("div")
            .attr("class", config.className)
            .style("position", "absolute")
            .style("visibility", "hidden")
            .style("pointer-events", "none")
            .style("z-index", "9999")
            .style("opacity", "0")
            .style("transition", `opacity ${config.animation.duration}ms ${config.animation.easing}`) as d3.Selection<HTMLDivElement, unknown, HTMLElement, any>;
            
        applyTheme(config.theme);
        
        return tooltipContainer;
    }
    
    // Apply tooltip theme
    function applyTheme(themeName: TooltipTheme): void {
        if (!tooltipContainer) return;
        
        const themes: Record<TooltipTheme, TooltipThemeStyles> = {
            default: {
                background: "rgba(0, 0, 0, 0.9)",
                color: "#ffffff",
                border: "none",
                borderRadius: "6px",
                fontSize: "13px",
                fontFamily: "system-ui, -apple-system, sans-serif",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                maxWidth: `${config.content.maxWidth}px`,
                padding: `${config.content.padding}px`
            },
            light: {
                background: "rgba(255, 255, 255, 0.95)",
                color: "#333333",
                border: "1px solid rgba(0, 0, 0, 0.1)",
                borderRadius: "6px",
                fontSize: "13px",
                fontFamily: "system-ui, -apple-system, sans-serif",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                maxWidth: `${config.content.maxWidth}px`,
                padding: `${config.content.padding}px`
            },
            minimal: {
                background: "#333333",
                color: "#ffffff",
                border: "none",
                borderRadius: "3px",
                fontSize: "12px",
                fontFamily: "monospace",
                boxShadow: "none",
                maxWidth: `${config.content.maxWidth}px`,
                padding: "8px 10px"
            },
            corporate: {
                background: "#2c3e50",
                color: "#ecf0f1",
                border: "1px solid #34495e",
                borderRadius: "4px",
                fontSize: "13px",
                fontFamily: "system-ui, -apple-system, sans-serif",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
                maxWidth: `${config.content.maxWidth}px`,
                padding: `${config.content.padding}px`
            }
        };
        
        const theme = themes[themeName] || themes.default;
        
        Object.keys(theme).forEach((property: string) => {
            const cssProperty = property.replace(/([A-Z])/g, "-$1").toLowerCase();
            const value = theme[property as keyof TooltipThemeStyles];
            tooltipContainer!.style(cssProperty, value);
        });
    }
    
    // Show tooltip with content
    function show(content: TooltipContentType, event: MouseEvent | PointerEvent | TouchEvent, data: TooltipData | null = null): d3.Selection<HTMLDivElement, unknown, HTMLElement, any> {
        if (!tooltipContainer) initializeTooltip();
        
        // Generate content
        const htmlContent = generateContent(content, data);
        
        tooltipContainer!
            .html(htmlContent)
            .style("visibility", "visible");
            
        // Position tooltip
        positionTooltip(event);
        
        // Animate in
        tooltipContainer!
            .transition()
            .duration(config.animation.duration)
            .style("opacity", "1");
            
        currentTooltip = { content, event, data };
        
        return tooltipContainer!;
    }
    
    // Hide tooltip
    function hide(): d3.Selection<HTMLDivElement, unknown, HTMLElement, any> | void {
        if (!tooltipContainer) return;
        
        tooltipContainer
            .transition()
            .duration(config.animation.duration)
            .style("opacity", "0")
            .on("end", function() {
                d3.select(this).style("visibility", "hidden");
            });
            
        currentTooltip = null;
        
        return tooltipContainer;
    }
    
    // Update tooltip position
    function move(event: MouseEvent | PointerEvent | TouchEvent): d3.Selection<HTMLDivElement, unknown, HTMLElement, any> | void {
        if (!tooltipContainer || !currentTooltip) return;
        
        positionTooltip(event);
        return tooltipContainer;
    }
    
    // Generate tooltip content
    function generateContent(content: TooltipContentType, data: TooltipData | null): string {
        if (typeof content === "function") {
            return content(data);
        }
        
        if (typeof content === "string") {
            return content;
        }
        
        if (typeof content === "object" && content && 'template' in content) {
            return renderTemplate(content.template, data, content.formatters);
        }
        
        // Default content for waterfall chart data
        if (data) {
            return generateDefaultContent(data);
        }
        
        return "";
    }
    
    // Generate default content for chart data
    function generateDefaultContent(data: TooltipData): string {
        const formatNumber = config.formatNumber || ((n: number) => n.toLocaleString());
        
        let html = `<div class="tooltip-header"><strong>${data.label}</strong></div>`;
        
        if (data.stacks && data.stacks.length > 0) {
            const totalValue = data.stacks.reduce((sum, stack) => sum + stack.value, 0);
            
            html += `<div class="tooltip-total">Total: ${formatNumber(totalValue)}</div>`;
            
            if (data.stacks.length > 1) {
                html += "<div class=\"tooltip-stacks\">";
                data.stacks.forEach(stack => {
                    const color = stack.color || "#666";
                    const label = stack.label || formatNumber(stack.value);
                    html += `
                        <div class="tooltip-stack-item">
                            <span class="tooltip-color-indicator" style="background-color: ${color}"></span>
                            <span class="tooltip-stack-label">${label}</span>
                            <span class="tooltip-stack-value">${formatNumber(stack.value)}</span>
                        </div>
                    `;
                });
                html += "</div>";
            }
        }
        
        return html;
    }
    
    // Render template with data
    function renderTemplate(template: string, data: TooltipData | null, formatters: { [key: string]: (value: any) => string } = {}): string {
        if (!data) return template;
        
        let rendered = template;
        
        // Replace placeholders like {{key}} with data values
        rendered = rendered.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, key) => {
            const value = getNestedValue(data, key);
            const formatter = formatters[key];
            
            if (formatter && typeof formatter === 'function') {
                return formatter(value);
            }
            
            return value != null ? String(value) : '';
        });
        
        return rendered;
    }
    
    // Get nested value from object using dot notation
    function getNestedValue(obj: any, path: string): any {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }
    
    // Position tooltip intelligently
    function positionTooltip(event: MouseEvent | PointerEvent | TouchEvent): void {
        if (!tooltipContainer) return;
        
        const mouseEvent = event as MouseEvent;
        const tooltipNode = tooltipContainer.node();
        if (!tooltipNode) return;
        
        const tooltipRect = tooltipNode.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        let x = mouseEvent.pageX + config.offset.x;
        let y = mouseEvent.pageY + config.offset.y;
        
        // Smart positioning to avoid viewport edges
        if (config.position === "smart") {
            const position = calculateSmartPosition(
                { x: mouseEvent.clientX, y: mouseEvent.clientY },
                { width: tooltipRect.width, height: tooltipRect.height },
                { width: viewportWidth, height: viewportHeight }
            );
            
            x = position.x + window.pageXOffset;
            y = position.y + window.pageYOffset;
        }
        
        tooltipContainer
            .style("left", `${x}px`)
            .style("top", `${y}px`);
    }
    
    // Calculate smart position to avoid clipping
    function calculateSmartPosition(
        mouse: { x: number; y: number },
        tooltip: { width: number; height: number },
        viewport: { width: number; height: number }
    ): TooltipPosition3D {
        const padding = 10;
        let x = mouse.x + config.offset.x;
        let y = mouse.y + config.offset.y;
        let quadrant = 1;
        
        // Check right edge
        if (x + tooltip.width + padding > viewport.width) {
            x = mouse.x - tooltip.width - Math.abs(config.offset.x);
            quadrant = 2;
        }
        
        // Check bottom edge
        if (y + tooltip.height + padding > viewport.height) {
            y = mouse.y - tooltip.height - Math.abs(config.offset.y);
            quadrant = quadrant === 2 ? 3 : 4;
        }
        
        // Check left edge
        if (x < padding) {
            x = padding;
        }
        
        // Check top edge
        if (y < padding) {
            y = padding;
        }
        
        return { x, y, quadrant };
    }
    
    // Configure tooltip
    function configure(newConfig: Partial<TooltipConfig>): TooltipSystem {
        config = { ...config, ...newConfig };
        
        if (tooltipContainer && newConfig.theme) {
            applyTheme(newConfig.theme);
        }
        
        return tooltipSystem;
    }
    
    // Set theme
    function theme(themeName: TooltipTheme): TooltipSystem {
        config.theme = themeName;
        if (tooltipContainer) {
            applyTheme(themeName);
        }
        return tooltipSystem;
    }
    
    // Destroy tooltip
    function destroy(): void {
        if (tooltipContainer) {
            tooltipContainer.remove();
            tooltipContainer = null;
        }
        currentTooltip = null;
    }
    
    // Check if tooltip is visible
    function isVisible(): boolean {
        return tooltipContainer !== null && tooltipContainer.style("visibility") === "visible";
    }
    
    // Get current tooltip data
    function getCurrentData(): TooltipData | null {
        return currentTooltip?.data || null;
    }
    
    const tooltipSystem: TooltipSystem = {
        show,
        hide,
        move,
        theme,
        configure,
        destroy,
        isVisible,
        getCurrentData
    };
    
    return tooltipSystem;
}
