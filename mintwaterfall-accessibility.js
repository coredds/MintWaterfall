// MintWaterfall Accessibility System
// Provides WCAG 2.1 AA compliance features for screen readers and keyboard navigation

export function createAccessibilitySystem() {
    
    let currentFocusIndex = -1;
    let focusableElements = [];
    let announceFunction = null;
    let descriptionId = null;
    
    // ARIA live region for dynamic announcements
    function createLiveRegion(container) {
        const liveRegion = container.append("div")
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
    function createChartDescription(container, data, config = {}) {
        const {
            title = "Waterfall Chart",
            summary = "Interactive waterfall chart showing data progression",
            totalItems = data.length,
            hasTotal = config.showTotal || false
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
            
        // Calculate summary statistics
        const totalValue = data.reduce((sum, item) => {
            return sum + item.stacks.reduce((stackSum, stack) => stackSum + stack.value, 0);
        }, 0);
        
        const positiveCount = data.filter(item => 
            item.stacks.some(stack => stack.value > 0)
        ).length;
        
        const negativeCount = data.filter(item => 
            item.stacks.some(stack => stack.value < 0)
        ).length;
        
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
    function makeAccessible(chartContainer, data, config = {}) {
        const svg = chartContainer.select("svg");
        
        // Add main chart ARIA attributes
        svg.attr("role", "img")
           .attr("aria-labelledby", descriptionId)
           .attr("tabindex", "0")
           .attr("aria-describedby", descriptionId);
        
        // Add keyboard event handlers to main SVG
        svg.on("keydown", function(event) {
            handleChartKeydown(event, data, config);
        });
        
        // Make individual bars focusable and accessible
        const bars = svg.selectAll(".bar-group");
        
        bars.each(function(d, i) {
            const bar = d3.select(this);
            
            bar.attr("role", "button")
               .attr("tabindex", "-1")
               .attr("aria-label", createBarAriaLabel(d, i, config))
               .attr("aria-describedby", `bar-description-${i}`)
               .on("keydown", function(event) {
                   handleBarKeydown(event, d, i, data, config);
               })
               .on("focus", function() {
                   currentFocusIndex = i;
                   highlightFocusedElement(this);
               })
               .on("blur", function() {
                   removeFocusHighlight(this);
               });
        });
        
        // Store focusable elements
        focusableElements = bars.nodes();
        
        return {
            bars,
            focusableElements: focusableElements.length
        };
    }
    
    // Create ARIA label for individual bars
    function createBarAriaLabel(data, index, config = {}) {
        const totalValue = data.stacks.reduce((sum, stack) => sum + stack.value, 0);
        const stackCount = data.stacks.length;
        const formatNumber = config.formatNumber || (n => n.toString());
        
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
    function handleChartKeydown(event, data, config) {
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
    function handleBarKeydown(event, barData, index, allData, config) {
        switch(event.key) {
            case "Enter":
            case " ":
                event.preventDefault();
                announceBarDetails(barData, index, config);
                // Trigger click event for compatibility
                d3.select(event.target).dispatch("click");
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
    function moveFocus(direction, data, config) {
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
    function focusElement(index, data, config) {
        if (index < 0 || index >= focusableElements.length) return;
        
        currentFocusIndex = index;
        focusableElements[index].focus();
        
        // Announce the focused element
        const barData = data[index];
        announceBarFocus(barData, index, config);
    }
    
    // Return focus to main chart container
    function returnFocusToChart() {
        const svg = d3.select("svg[role='img']");
        if (!svg.empty()) {
            svg.node().focus();
            currentFocusIndex = -1;
        }
    }
    
    // Visual focus indicators
    function highlightFocusedElement(element) {
        d3.select(element)
          .style("outline", "3px solid #4A90E2")
          .style("outline-offset", "2px");
    }
    
    function removeFocusHighlight(element) {
        d3.select(element)
          .style("outline", null)
          .style("outline-offset", null);
    }
    
    // Screen reader announcements
    function announceBarFocus(data, index, config) {
        const formatNumber = config.formatNumber || (n => n.toString());
        const totalValue = data.stacks.reduce((sum, stack) => sum + stack.value, 0);
        
        const message = `Focused on ${data.label}, value ${formatNumber(totalValue)}`;
        announce(message);
    }
    
    function announceBarDetails(data, index, config) {
        const formatNumber = config.formatNumber || (n => n.toString());
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
    
    function announceChartSummary(data, config) {
        const formatNumber = config.formatNumber || (n => n.toString());
        const totalValue = data.reduce((sum, item) => {
            return sum + item.stacks.reduce((stackSum, stack) => stackSum + stack.value, 0);
        }, 0);
        
        const message = `Waterfall chart with ${data.length} categories. Total value: ${formatNumber(totalValue)}. Use arrow keys to navigate between bars.`;
        announce(message);
    }
    
    // Announce message to screen readers
    function announce(message) {
        const liveRegion = d3.select("#waterfall-live-region");
        if (!liveRegion.empty()) {
            liveRegion.text(message);
        }
        
        // Also call custom announce function if provided
        if (announceFunction) {
            announceFunction(message);
        }
    }
    
    // High contrast mode detection and support (Updated: 2025-08-25)
    function detectHighContrast() {
        // Check for modern forced colors mode and high contrast preferences
        if (window.matchMedia) {
            return window.matchMedia("(forced-colors: active)").matches ||
                   window.matchMedia("(prefers-contrast: high)").matches ||
                   // Fallback for older browsers that still use the deprecated property
                   window.matchMedia("(-ms-high-contrast: active)").matches;
        }
        return false;
    }
    
    function applyHighContrastStyles(chartContainer) {
        if (!detectHighContrast()) return;
        
        const svg = chartContainer.select("svg");
        
        // Apply high contrast colors
        svg.selectAll(".bar-group rect")
           .style("stroke", "#000000")
           .style("stroke-width", "2px");
           
        svg.selectAll(".x-axis, .y-axis")
           .style("stroke", "#000000")
           .style("stroke-width", "2px");
           
        svg.selectAll("text")
           .style("fill", "#000000")
           .style("font-weight", "bold");
    }
    
    // Reduced motion support
    function respectsReducedMotion() {
        if (window.matchMedia) {
            return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        }
        return false;
    }
    
    function getAccessibleAnimationDuration(defaultDuration) {
        return respectsReducedMotion() ? 0 : defaultDuration;
    }
    
    // Color contrast validation
    function validateColorContrast(foreground, background) {
        // Simplified contrast ratio calculation
        // In production, use a proper color contrast library
        const getLuminance = (color) => {
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
    return {
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
        respectsReducedMotion,
        getAccessibleAnimationDuration,
        validateColorContrast,
        
        // Configuration
        setAnnounceFunction(fn) {
            announceFunction = fn;
            return this;
        },
        
        getCurrentFocus() {
            return currentFocusIndex;
        },
        
        getFocusableCount() {
            return focusableElements.length;
        }
    };
}

// Global accessibility system instance
export const accessibilitySystem = createAccessibilitySystem();

// Utility function to make any chart accessible
export function makeChartAccessible(chartContainer, data, config = {}) {
    const a11y = createAccessibilitySystem();
    
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
