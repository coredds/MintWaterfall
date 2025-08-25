// MintWaterfall Professional Tooltip System
// Provides intelligent positioning, rich content, and customizable styling

export function createTooltipSystem() {
    
    let tooltipContainer = null;
    let currentTooltip = null;
    let config = {
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
    function initializeTooltip() {
        if (tooltipContainer) return tooltipContainer;
        
        tooltipContainer = d3.select("body")
                .append("div")
            .attr("class", config.className)
                .style("position", "absolute")
                .style("visibility", "hidden")
                .style("pointer-events", "none")
            .style("z-index", "9999")
            .style("opacity", "0")
            .style("transition", `opacity ${config.animation.duration}ms ${config.animation.easing}`);
            
        applyTheme(config.theme);
        
        return tooltipContainer;
    }
    
    // Apply tooltip theme
    function applyTheme(themeName) {
        if (!tooltipContainer) return;
        
        const themes = {
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
        
        Object.keys(theme).forEach(property => {
            tooltipContainer.style(property.replace(/([A-Z])/g, "-$1").toLowerCase(), theme[property]);
        });
    }
    
    // Show tooltip with content
    function show(content, event, data = null) {
        if (!tooltipContainer) initializeTooltip();
        
        // Generate content
        const htmlContent = generateContent(content, data);
        
        tooltipContainer
            .html(htmlContent)
            .style("visibility", "visible");
            
        // Position tooltip
        positionTooltip(event);
        
        // Animate in
        tooltipContainer
            .transition()
            .duration(config.animation.duration)
            .style("opacity", "1");
            
        currentTooltip = { content, event, data };
        
        return tooltipContainer;
    }
    
    // Hide tooltip
    function hide() {
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
    function move(event) {
        if (!tooltipContainer || !currentTooltip) return;
        
        positionTooltip(event);
        return tooltipContainer;
    }
    
    // Generate tooltip content
    function generateContent(content, data) {
        if (typeof content === "function") {
            return content(data);
        }
        
        if (typeof content === "string") {
            return content;
        }
        
        if (typeof content === "object" && content && content.template) {
            return renderTemplate(content.template, data, content.formatters);
        }
        
        // Default content for waterfall chart data
        if (data) {
            return generateDefaultContent(data);
        }
        
        return content ? content.toString() : "";
    }
    
    // Generate default content for chart data
    function generateDefaultContent(data) {
        const formatNumber = config.formatNumber || (n => n.toLocaleString());
        
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
        
        if (data.cumulative !== undefined) {
            html += `<div class="tooltip-cumulative">Cumulative: ${formatNumber(data.cumulative)}</div>`;
        }
        
        return html;
    }
    
    // Render template with data
    function renderTemplate(template, data, formatters = {}) {
        let html = template;
        
        // Replace placeholders
        html = html.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            const value = getNestedValue(data, key);
            const formatter = formatters[key];
            
            if (formatter && typeof formatter === "function") {
                return formatter(value);
            }
            
            return value !== undefined ? value : match;
        });
        
        return html;
    }
    
    // Get nested object value by key path
    function getNestedValue(obj, path) {
        return path.split(".").reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : undefined;
        }, obj);
    }
    
    // Position tooltip intelligently
    function positionTooltip(event) {
        if (!tooltipContainer) return;
        
        const tooltip = tooltipContainer.node();
        const rect = tooltip.getBoundingClientRect();
        const viewport = {
            width: window.innerWidth,
            height: window.innerHeight
        };
        
        let x = event.pageX + config.offset.x;
        let y = event.pageY + config.offset.y;
        
        // Smart positioning to avoid viewport edges
        if (config.position === "smart") {
            // Check right edge
            if (x + rect.width > viewport.width) {
                x = event.pageX - rect.width - Math.abs(config.offset.x);
            }
            
            // Check bottom edge
            if (y + rect.height > viewport.height) {
                y = event.pageY - rect.height - Math.abs(config.offset.y);
            }
            
            // Check left edge
            if (x < 0) {
                x = config.offset.x;
            }
            
            // Check top edge
            if (y < 0) {
                y = config.offset.y;
            }
        }
        
        tooltipContainer
            .style("left", `${x}px`)
            .style("top", `${y}px`);
    }
    
    // Add CSS styles for tooltip components
    function addTooltipStyles() {
        const styleId = "mintwaterfall-tooltip-styles";
        
        if (document.getElementById(styleId)) return;
        
        const styles = `
            .${config.className} {
                font-weight: 500;
                line-height: 1.4;
                word-wrap: break-word;
            }
            
            .${config.className} .tooltip-header {
                margin-bottom: 6px;
                font-size: 14px;
            }
            
            .${config.className} .tooltip-total {
                margin-bottom: 8px;
                font-weight: 600;
            }
            
            .${config.className} .tooltip-stacks {
                border-top: 1px solid rgba(255, 255, 255, 0.2);
                padding-top: 6px;
            }
            
            .${config.className} .tooltip-stack-item {
                display: flex;
                align-items: center;
                margin-bottom: 4px;
            }
            
            .${config.className} .tooltip-color-indicator {
                width: 12px;
                height: 12px;
                border-radius: 2px;
                margin-right: 8px;
                flex-shrink: 0;
            }
            
            .${config.className} .tooltip-stack-label {
                flex: 1;
                margin-right: 8px;
            }
            
            .${config.className} .tooltip-stack-value {
                font-weight: 600;
                text-align: right;
            }
            
            .${config.className} .tooltip-cumulative {
                margin-top: 6px;
                padding-top: 6px;
                border-top: 1px solid rgba(255, 255, 255, 0.2);
                font-style: italic;
            }
        `;
        
        const styleElement = document.createElement("style");
        styleElement.id = styleId;
        styleElement.textContent = styles;
        document.head.appendChild(styleElement);
    }
    
    // Configuration methods
    function theme(themeName) {
        if (!arguments.length) return config.theme;
        config.theme = themeName;
        if (tooltipContainer) applyTheme(themeName);
        return tooltip;
    }
    
    function position(positionType) {
        if (!arguments.length) return config.position;
        config.position = positionType;
        return tooltip;
    }
    
    function offset(offsetConfig) {
        if (!arguments.length) return config.offset;
        config.offset = { ...config.offset, ...offsetConfig };
        return tooltip;
    }
    
    function animation(animationConfig) {
        if (!arguments.length) return config.animation;
        config.animation = { ...config.animation, ...animationConfig };
        return tooltip;
    }
    
    function formatNumber(formatter) {
        if (!arguments.length) return config.formatNumber;
        config.formatNumber = formatter;
        return tooltip;
    }
    
    function maxWidth(width) {
        if (!arguments.length) return config.content.maxWidth;
        config.content.maxWidth = width;
        return tooltip;
    }
    
    // Initialize styles
    addTooltipStyles();
    
    // Public API
    const tooltip = {
        show,
        hide,
        move,
        theme,
        position,
        offset,
        animation,
        formatNumber,
        maxWidth,
        
        // Configuration getters/setters
        config(newConfig) {
            if (!arguments.length) return config;
            config = { ...config, ...newConfig };
            return tooltip;
        },
        
        // Utility methods
        isVisible() {
            return currentTooltip !== null;
        },
        
        getCurrentData() {
            return currentTooltip ? currentTooltip.data : null;
        },
        
        destroy() {
            if (tooltipContainer) {
                tooltipContainer.remove();
                tooltipContainer = null;
            }
            currentTooltip = null;
        }
    };
    
    return tooltip;
}

// Convenience function to create tooltip with chart integration
export function createChartTooltip(chart, config = {}) {
    const tooltip = createTooltipSystem();
    
    // Configure tooltip
    if (config.theme) tooltip.theme(config.theme);
    if (config.position) tooltip.position(config.position);
    if (config.formatNumber) tooltip.formatNumber(config.formatNumber);
    
    // Integrate with chart events
    chart.on("barMouseover", function(event, data) {
        tooltip.show(config.content || null, event, data);
    });
    
    chart.on("barMouseout", function() {
        tooltip.hide();
    });
    
    chart.on("barMousemove", function(event) {
        tooltip.move(event);
    });
    
    return tooltip;
}

// Global tooltip instance
export const tooltip = createTooltipSystem();

export default createTooltipSystem;