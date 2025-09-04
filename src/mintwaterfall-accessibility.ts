// MintWaterfall Accessibility System - TypeScript Version
// Provides WCAG 2.1 AA compliance features for screen readers and keyboard navigation with full type safety

import * as d3 from 'd3';

// Type definitions for accessibility system
export interface AccessibilityConfig {
    title?: string;
    summary?: string;
    totalItems?: number;
    showTotal?: boolean;
    formatNumber?: (n: number) => string;
}

export interface WaterfallDataItem {
    label: string;
    stacks: StackItem[];
    cumulative?: number;
}

export interface StackItem {
    label?: string;
    value: number;
}

export interface HierarchicalData {
    children?: HierarchicalData[];
    value?: number;
}

export interface ContrastResult {
    ratio: number;
    passesAA: boolean;
    passesAAA: boolean;
}

export interface AccessibilityResult {
    bars: d3.Selection<d3.BaseType, any, any, any>;
    focusableElements: number;
}

export interface ChartAccessibilityResult {
    accessibilitySystem: AccessibilitySystem;
    descriptionId: string;
    focusableElements: number;
}

export interface AccessibilitySystem {
    createLiveRegion(container: d3.Selection<d3.BaseType, any, any, any>): d3.Selection<HTMLDivElement, any, any, any>;
    createChartDescription(container: d3.Selection<d3.BaseType, any, any, any>, data: WaterfallDataItem[] | HierarchicalData, config?: AccessibilityConfig): string;
    makeAccessible(chartContainer: d3.Selection<d3.BaseType, any, any, any>, data: WaterfallDataItem[], config?: AccessibilityConfig): AccessibilityResult;
    handleChartKeydown(event: KeyboardEvent, data: WaterfallDataItem[], config: AccessibilityConfig): void;
    handleBarKeydown(event: KeyboardEvent, barData: WaterfallDataItem, index: number, allData: WaterfallDataItem[], config: AccessibilityConfig): void;
    moveFocus(direction: number, data: WaterfallDataItem[], config: AccessibilityConfig): void;
    focusElement(index: number, data: WaterfallDataItem[], config: AccessibilityConfig): void;
    announce(message: string): void;
    detectHighContrast(): boolean;
    applyHighContrastStyles(chartContainer: d3.Selection<d3.BaseType, any, any, any>): void;
    injectForcedColorsCSS(): void;
    respectsReducedMotion(): boolean;
    getAccessibleAnimationDuration(defaultDuration: number): number;
    validateColorContrast(foreground: string, background: string): ContrastResult;
    setAnnounceFunction(fn: (message: string) => void): AccessibilitySystem;
    getCurrentFocus(): number;
    getFocusableCount(): number;
}

export function createAccessibilitySystem(): AccessibilitySystem {
    
    let currentFocusIndex: number = -1;
    let focusableElements: any[] = [];
    let announceFunction: ((message: string) => void) | null = null;
    let descriptionId: string | null = null;
    
    // ARIA live region for dynamic announcements
    function createLiveRegion(container: d3.Selection<d3.BaseType, any, any, any>): d3.Selection<HTMLDivElement, any, any, any> {
        const liveRegion = container.append<HTMLDivElement>("div")
            .attr("id", "waterfall-live-region")
            .attr("aria-live", "polite")
            .attr("aria-atomic", "true")
            .style("position", "absolute")
            .style("left", "-10000px")
            .style("width", "1px")
            .style("height", "1px")
            .style("overflow", "hidden");
            
        return liveRegion;
    }
    
    // Create chart description for screen readers
    function createChartDescription(
        container: d3.Selection<d3.BaseType, any, any, any>, 
        data: WaterfallDataItem[] | HierarchicalData, 
        config: AccessibilityConfig = {}
    ): string {
        const {
            title = "Waterfall Chart",
            summary = "Interactive waterfall chart showing data progression",
            totalItems = Array.isArray(data) ? data.length : 1,
            showTotal: hasTotal = false
        } = config;
        
        const descId = "waterfall-description-" + Math.random().toString(36).substr(2, 9);
        
        const description = container.append("div")
            .attr("id", descId)
            .attr("class", "sr-only")
            .style("position", "absolute")
            .style("left", "-10000px")
            .style("width", "1px")
            .style("height", "1px")
            .style("overflow", "hidden");
            
        // Calculate summary statistics based on data structure
        let totalValue = 0;
        let positiveCount = 0;
        let negativeCount = 0;
        
        if (Array.isArray(data)) {
            // Waterfall chart data structure
            totalValue = data.reduce((sum, item) => {
                if (item.stacks && Array.isArray(item.stacks)) {
                    return sum + item.stacks.reduce((stackSum, stack) => stackSum + (stack.value || 0), 0);
                }
                return sum;
            }, 0);
            
            positiveCount = data.filter(item => 
                item.stacks && item.stacks.some(stack => (stack.value || 0) > 0)
            ).length;
            
            negativeCount = data.filter(item => 
                item.stacks && item.stacks.some(stack => stack.value < 0)
            ).length;
        } else if (data && typeof data === "object" && (data as HierarchicalData).children) {
            // Hierarchical chart data structure
            function calculateHierarchicalStats(node: HierarchicalData): number {
                if (node.children && Array.isArray(node.children)) {
                    return node.children.reduce((sum, child) => sum + calculateHierarchicalStats(child), 0);
                } else {
                    return node.value || 0;
                }
            }
            
            totalValue = calculateHierarchicalStats(data as HierarchicalData);
            positiveCount = 1; // For hierarchical data, we consider it as one positive entity
            negativeCount = 0;
        }
        
        description.html(`
            <h3>${title}</h3>
            <p>${summary}</p>
            <p>This chart contains ${totalItems} data categories${hasTotal ? " plus a total bar" : ""}.</p>
            <p>Total value: ${config.formatNumber ? config.formatNumber(totalValue) : totalValue}</p>
            <p>${positiveCount} categories have positive values, ${negativeCount} have negative values.</p>
            <p>Use Tab to navigate between bars, Enter to hear details, and Arrow keys to move between bars.</p>
            <p>Press Escape to return focus to the chart container.</p>
        `);
        
        descriptionId = descId;
        return descId;
    }
    
    // Make chart elements keyboard accessible
    function makeAccessible(
        chartContainer: d3.Selection<d3.BaseType, any, any, any>, 
        data: WaterfallDataItem[], 
        config: AccessibilityConfig = {}
    ): AccessibilityResult {
        const svg = chartContainer.select("svg");
        
        // Add main chart ARIA attributes
        svg.attr("role", "img")
           .attr("aria-labelledby", descriptionId)
           .attr("tabindex", "0")
           .attr("aria-describedby", descriptionId);
        
        // Add keyboard event handlers to main SVG
        svg.on("keydown", function(event: KeyboardEvent) {
            handleChartKeydown(event, data, config);
        });
        
        // Make individual bars focusable and accessible
        const bars = svg.selectAll(".bar-group");
        
        bars.each(function(d: any, i: number) {
            const bar = d3.select(this);
            const data = d as WaterfallDataItem;
            
            bar.attr("role", "button")
               .attr("tabindex", "-1")
               .attr("aria-label", createBarAriaLabel(data, i, config))
               .attr("aria-describedby", `bar-description-${i}`)
               .on("keydown", function(event: KeyboardEvent) {
                   handleBarKeydown(event, data, i, [data], config);
               })
               .on("focus", function() {
                   currentFocusIndex = i;
                   const element = this as Element;
                   if (element) {
                       highlightFocusedElement(element);
                   }
               })
               .on("blur", function() {
                   const element = this as Element;
                   if (element) {
                       removeFocusHighlight(element);
                   }
               });
        });
        
        // Store focusable elements
        focusableElements = bars.nodes().filter(node => node !== null);
        
        return {
            bars,
            focusableElements: focusableElements.length
        };
    }
    
    // Create ARIA label for individual bars
    function createBarAriaLabel(data: WaterfallDataItem, index: number, config: AccessibilityConfig = {}): string {
        const totalValue = data.stacks.reduce((sum, stack) => sum + stack.value, 0);
        const stackCount = data.stacks.length;
        const formatNumber = config.formatNumber || ((n: number) => n.toString());
        
        let label = `${data.label}: ${formatNumber(totalValue)}`;
        
        if (stackCount > 1) {
            label += `, ${stackCount} segments`;
        }
        
        if (data.cumulative !== undefined) {
            label += `, cumulative total: ${formatNumber(data.cumulative)}`;
        }
        
        label += ". Press Enter for details.";
        
        return label;
    }
    
    // Handle keyboard navigation on chart level
    function handleChartKeydown(event: KeyboardEvent, data: WaterfallDataItem[], config: AccessibilityConfig): void {
        switch(event.key) {
            case "Tab":
                // Let default tab behavior work
                break;
                
            case "ArrowRight":
            case "ArrowDown":
                event.preventDefault();
                moveFocus(1, data, config);
                break;
                
            case "ArrowLeft":
            case "ArrowUp":
                event.preventDefault();
                moveFocus(-1, data, config);
                break;
                
            case "Home":
                event.preventDefault();
                focusElement(0, data, config);
                break;
                
            case "End":
                event.preventDefault();
                focusElement(focusableElements.length - 1, data, config);
                break;
                
            case "Enter":
            case " ":
                event.preventDefault();
                if (currentFocusIndex >= 0) {
                    announceBarDetails(data[currentFocusIndex], currentFocusIndex, config);
                } else {
                    announceChartSummary(data, config);
                }
                break;
                
            case "Escape":
                event.preventDefault();
                returnFocusToChart();
                break;
        }
    }
    
    // Handle keyboard events on individual bars
    function handleBarKeydown(
        event: KeyboardEvent, 
        barData: WaterfallDataItem, 
        index: number, 
        allData: WaterfallDataItem[], 
        config: AccessibilityConfig
    ): void {
        switch(event.key) {
            case "Enter":
            case " ":
                event.preventDefault();
                announceBarDetails(barData, index, config);
                // Trigger click event for compatibility
                d3.select(event.target as Element).dispatch("click");
                break;
                
            case "ArrowRight":
            case "ArrowDown":
                event.preventDefault();
                moveFocus(1, allData, config);
                break;
                
            case "ArrowLeft":
            case "ArrowUp":
                event.preventDefault();
                moveFocus(-1, allData, config);
                break;
        }
    }
    
    // Move focus between chart elements
    function moveFocus(direction: number, data: WaterfallDataItem[], config: AccessibilityConfig): void {
        if (focusableElements.length === 0) return;
        
        let newIndex = currentFocusIndex + direction;
        
        // Wrap around
        if (newIndex >= focusableElements.length) {
            newIndex = 0;
        } else if (newIndex < 0) {
            newIndex = focusableElements.length - 1;
        }
        
        focusElement(newIndex, data, config);
    }
    
    // Focus specific element by index
    function focusElement(index: number, data: WaterfallDataItem[], config: AccessibilityConfig): void {
        if (index < 0 || index >= focusableElements.length) return;
        
        currentFocusIndex = index;
        const element = focusableElements[index] as HTMLElement;
        if (element && element.focus) {
            element.focus();
        }
        
        // Announce the focused element
        const barData = data[index];
        announceBarFocus(barData, index, config);
    }
    
    // Return focus to main chart container
    function returnFocusToChart(): void {
        const svg = d3.select("svg[role='img']");
        if (!svg.empty()) {
            const svgNode = svg.node() as HTMLElement;
            if (svgNode) {
                svgNode.focus();
            }
            currentFocusIndex = -1;
        }
    }
    
    // Visual focus indicators
    function highlightFocusedElement(element: Element): void {
        d3.select(element)
          .style("outline", "3px solid #4A90E2")
          .style("outline-offset", "2px");
    }
    
    function removeFocusHighlight(element: Element): void {
        d3.select(element)
          .style("outline", null)
          .style("outline-offset", null);
    }
    
    // Screen reader announcements
    function announceBarFocus(data: WaterfallDataItem, index: number, config: AccessibilityConfig): void {
        const formatNumber = config.formatNumber || ((n: number) => n.toString());
        const totalValue = data.stacks.reduce((sum, stack) => sum + stack.value, 0);
        
        const message = `Focused on ${data.label}, value ${formatNumber(totalValue)}`;
        announce(message);
    }
    
    function announceBarDetails(data: WaterfallDataItem, index: number, config: AccessibilityConfig): void {
        const formatNumber = config.formatNumber || ((n: number) => n.toString());
        const totalValue = data.stacks.reduce((sum, stack) => sum + stack.value, 0);
        
        let message = `${data.label}: Total value ${formatNumber(totalValue)}`;
        
        if (data.stacks.length > 1) {
            message += `. Contains ${data.stacks.length} segments: `;
            const segments = data.stacks.map(stack => 
                `${stack.label || formatNumber(stack.value)}`
            ).join(", ");
            message += segments;
        }
        
        if (data.cumulative !== undefined) {
            message += `. Cumulative total: ${formatNumber(data.cumulative)}`;
        }
        
        announce(message);
    }
    
    function announceChartSummary(data: WaterfallDataItem[], config: AccessibilityConfig): void {
        const formatNumber = config.formatNumber || ((n: number) => n.toString());
        const totalValue = data.reduce((sum, item) => {
            return sum + item.stacks.reduce((stackSum, stack) => stackSum + stack.value, 0);
        }, 0);
        
        const message = `Waterfall chart with ${data.length} categories. Total value: ${formatNumber(totalValue)}. Use arrow keys to navigate between bars.`;
        announce(message);
    }
    
    // Announce message to screen readers
    function announce(message: string): void {
        const liveRegion = d3.select("#waterfall-live-region");
        if (!liveRegion.empty()) {
            liveRegion.text(message);
        }
        
        // Also call custom announce function if provided
        if (announceFunction) {
            announceFunction(message);
        }
    }
    
    // High contrast mode detection and support (Updated: 2025-08-28)
    function detectHighContrast(): boolean {
        // Check for modern forced colors mode and high contrast preferences
        if (window.matchMedia) {
            // First check for modern forced-colors mode (preferred)
            if (window.matchMedia("(forced-colors: active)").matches) {
                return true;
            }
            
            // Then check for prefers-contrast
            if (window.matchMedia("(prefers-contrast: high)").matches) {
                return true;
            }
            
            // Additional modern checks for high contrast scenarios
            if (window.matchMedia("(prefers-contrast: more)").matches) {
                return true;
            }
            
            // Check for inverted colors which often indicates high contrast mode
            if (window.matchMedia("(inverted-colors: inverted)").matches) {
                return true;
            }
            
            // Fallback: detect if system colors are being used (indicates forced colors)
            try {
                const testElement = document.createElement("div");
                testElement.style.color = "rgb(1, 2, 3)";
                testElement.style.position = "absolute";
                testElement.style.visibility = "hidden";
                document.body.appendChild(testElement);
                
                const computedColor = window.getComputedStyle(testElement).color;
                document.body.removeChild(testElement);
                
                // If the computed color doesn't match what we set, forced colors is likely active
                return computedColor !== "rgb(1, 2, 3)";
            } catch (e) {
                // If detection fails, assume no high contrast for safety
                return false;
            }
        }
        return false;
    }
    
    function applyHighContrastStyles(chartContainer: d3.Selection<d3.BaseType, any, any, any>): void {
        if (!detectHighContrast()) return;
        
        const svg = chartContainer.select("svg");
        
        // Apply modern forced colors mode compatible styles using CSS system colors
        svg.selectAll(".bar-group rect")
           .style("stroke", "CanvasText")
           .style("stroke-width", "2px")
           .style("fill", "ButtonFace");
           
        svg.selectAll(".x-axis, .y-axis")
           .style("stroke", "CanvasText")
           .style("stroke-width", "2px");
           
        svg.selectAll("text")
           .style("fill", "CanvasText")
           .style("font-weight", "bold");
           
        // Apply high contrast styles to trend lines if present
        svg.selectAll(".trend-line")
           .style("stroke", "Highlight")
           .style("stroke-width", "3px");
           
        // Ensure tooltips work in forced colors mode
        svg.selectAll(".tooltip")
           .style("background", "Canvas")
           .style("border", "2px solid CanvasText")
           .style("color", "CanvasText");
    }
    
    // Inject CSS for forced colors mode support
    function injectForcedColorsCSS(): void {
        // Check if we're in a browser environment
        if (typeof document === "undefined") return; // Node.js environment
        
        const cssId = "mintwaterfall-forced-colors-css";
        if (document.getElementById(cssId)) return; // Already injected
        
        const css = `
            @media (forced-colors: active) {
                .mintwaterfall-chart svg {
                    forced-color-adjust: none;
                }
                
                .mintwaterfall-chart .bar-group rect {
                    stroke: CanvasText !important;
                    stroke-width: 2px !important;
                }
                
                .mintwaterfall-chart .x-axis,
                .mintwaterfall-chart .y-axis {
                    stroke: CanvasText !important;
                    stroke-width: 2px !important;
                }
                
                .mintwaterfall-chart text {
                    fill: CanvasText !important;
                    font-weight: bold !important;
                }
                
                .mintwaterfall-chart .trend-line {
                    stroke: Highlight !important;
                    stroke-width: 3px !important;
                }
                
                .mintwaterfall-tooltip {
                    background: Canvas !important;
                    border: 2px solid CanvasText !important;
                    color: CanvasText !important;
                    forced-color-adjust: none;
                }
            }
            
            @media (prefers-contrast: high) {
                .mintwaterfall-chart .bar-group rect {
                    stroke-width: 2px !important;
                }
                
                .mintwaterfall-chart text {
                    font-weight: bold !important;
                }
            }
        `;
        
        const style = document.createElement("style");
        style.id = cssId;
        style.textContent = css;
        document.head.appendChild(style);
    }

    // Reduced motion support
    function respectsReducedMotion(): boolean {
        if (window.matchMedia) {
            return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        }
        return false;
    }
    
    function getAccessibleAnimationDuration(defaultDuration: number): number {
        return respectsReducedMotion() ? 0 : defaultDuration;
    }
    
    // Color contrast validation
    function validateColorContrast(foreground: string, background: string): ContrastResult {
        // Simplified contrast ratio calculation
        // In production, use a proper color contrast library
        const getLuminance = (color: string): number => {
            // This is a simplified version - use a proper color library
            const rgb = d3.rgb(color);
            return (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
        };
        
        const l1 = getLuminance(foreground);
        const l2 = getLuminance(background);
        const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
        
        return {
            ratio,
            passesAA: ratio >= 4.5,
            passesAAA: ratio >= 7
        };
    }
    
    // Public API
    const accessibilitySystem: AccessibilitySystem = {
        createLiveRegion,
        createChartDescription,
        makeAccessible,
        handleChartKeydown,
        handleBarKeydown,
        moveFocus,
        focusElement,
        announce,
        detectHighContrast,
        applyHighContrastStyles,
        injectForcedColorsCSS,
        respectsReducedMotion,
        getAccessibleAnimationDuration,
        validateColorContrast,
        
        // Configuration
        setAnnounceFunction(fn: (message: string) => void): AccessibilitySystem {
            announceFunction = fn;
            return this;
        },
        
        getCurrentFocus(): number {
            return currentFocusIndex;
        },
        
        getFocusableCount(): number {
            return focusableElements.length;
        }
    };
    
    return accessibilitySystem;
}

// Global accessibility system instance
export const accessibilitySystem = createAccessibilitySystem();

// Inject CSS support immediately for global instance (only in browser)
if (typeof document !== "undefined") {
    accessibilitySystem.injectForcedColorsCSS();
}

// Utility function to make any chart accessible
export function makeChartAccessible(
    chartContainer: d3.Selection<d3.BaseType, any, any, any>, 
    data: WaterfallDataItem[], 
    config: AccessibilityConfig = {}
): ChartAccessibilityResult {
    const a11y = createAccessibilitySystem();
    
    // Inject forced colors CSS support (only in browser)
    if (typeof document !== "undefined") {
        a11y.injectForcedColorsCSS();
    }
    
    // Create live region for announcements
    a11y.createLiveRegion(d3.select("body"));
    
    // Create chart description
    const descId = a11y.createChartDescription(chartContainer, data, config);
    
    // Make chart elements accessible
    const result = a11y.makeAccessible(chartContainer, data, config);
    
    // Apply high contrast styles if needed
    a11y.applyHighContrastStyles(chartContainer);
    
    return {
        accessibilitySystem: a11y,
        descriptionId: descId,
        focusableElements: result.focusableElements
    };
}

export default createAccessibilitySystem;
