// MintWaterfall - D3.js compatible treemap chart component
// Usage: d3.treemapChart().width(800).height(400).valueField("value")(selection)

/* global d3 */

// Ensure we're in a browser context with D3
if (typeof d3 === "undefined" && typeof require !== "undefined") {
     
    d3 = require("d3");
}

import { createHierarchicalLayout, createHierarchy } from "./mintwaterfall-layouts.js";
import { createAccessibilitySystem } from "./mintwaterfall-accessibility.js";
import { createTooltipSystem } from "./mintwaterfall-tooltip.js";
import { createExportSystem } from "./mintwaterfall-export.js";
import { createZoomSystem } from "./mintwaterfall-zoom.js";

/**
 * Creates a treemap chart component
 * @returns {Function} Chart function
 */
export function treemapChart() {
    // Configuration options
    let width = 800;
    let height = 400;
    let margin = { top: 40, right: 10, bottom: 10, left: 10 };
    let padding = 1;
    let round = false;
    let valueField = "value";
    let labelField = "name";
    let idField = "id";
    let parentField = "parent";
    let colorScale = d3.scaleOrdinal(d3.schemeCategory10);
    let duration = 750;
    let ease = d3.easeQuadInOut;
    let formatNumber = d3.format(".0f");
    let theme = null;
    
    // Advanced features
    let paddingInner = 0;
    let paddingOuter = 0;
    let paddingTop = 20; // Extra space for labels
    let paddingRight = 0;
    let paddingBottom = 0;
    let paddingLeft = 0;
    let ratio = 1.618033988749895; // Golden ratio
    let maxDepth = Infinity;
    let showLabels = true;
    let labelMinSize = 10; // Minimum rectangle size to show label
    
    // Feature flags
    let enableAccessibility = true;
    let enableTooltips = true;
    let tooltipConfig = {};
    let enableExport = true;
    let exportConfig = {};
    let enableZoom = false;
    let zoomConfig = {};
    
    // Initialize systems
    const layoutSystem = createHierarchicalLayout();
    const accessibilitySystem = createAccessibilitySystem();
    const tooltipSystem = createTooltipSystem();
    const exportSystem = createExportSystem();
    const zoomSystem = createZoomSystem();
    
    // Event listeners
    const listeners = d3.dispatch("cellClick", "cellMouseover", "cellMouseout", "chartUpdate");
    
    /**
     * Main chart function
     * @param {Selection} selection - D3 selection to render the chart into
     */
    function chart(selection) {
        selection.each(function(data) {
            // Data validation
            if (!data || !Array.isArray(data) && !data.children) {
                console.warn("MintWaterfall: Invalid data provided. Expected an array or hierarchical object.");
                return;
            }
            
            const svg = d3.select(this);
            const container = svg.selectAll(".treemap-container").data([data]);
            
            // Store reference for zoom system
            const svgContainer = svg;
            
            // Create main container group
            const containerEnter = container.enter()
                .append("g")
                .attr("class", "treemap-container");
            
            const containerUpdate = containerEnter.merge(container);
            
            // Create chart group for zoom transforms
            let chartGroup = containerUpdate.select(".chart-group");
            if (chartGroup.empty()) {
                chartGroup = containerUpdate.append("g")
                    .attr("class", "chart-group");
            }
            
            try {
                // Calculate inner dimensions
                const innerWidth = width - margin.left - margin.right;
                const innerHeight = height - margin.top - margin.bottom;
                
                // Update container position
                containerUpdate.attr("transform", `translate(${margin.left}, ${margin.top})`);
                
                // Process data with hierarchical layout system
                const hierarchyData = createHierarchy(data, {
                    idAccessor: d => d[idField],
                    parentAccessor: d => d[parentField],
                    valueAccessor: d => +d[valueField]
                });
                
                // Configure layout
                layoutSystem
                    .type("treemap")
                    .size([innerWidth, innerHeight])
                    .padding(padding)
                    .paddingInner(paddingInner)
                    .paddingOuter(paddingOuter)
                    .paddingTop(paddingTop)
                    .paddingRight(paddingRight)
                    .paddingBottom(paddingBottom)
                    .paddingLeft(paddingLeft)
                    .round(round)
                    .ratio(ratio);
                
                // Apply layout
                const root = layoutSystem(hierarchyData);
                
                // Filter by max depth if specified
                const nodes = root.descendants().filter(d => d.depth <= maxDepth);
                
                // Draw cells
                drawCells(chartGroup, nodes);
                
                // Initialize features after rendering is complete
                setTimeout(() => {
                    if (enableAccessibility) {
                        initializeAccessibility(svg, nodes);
                    }
                    
                    if (enableTooltips) {
                        initializeTooltips(svg);
                    }
                    
                    if (enableExport) {
                        initializeExport(svg, data);
                    }
                    
                    if (enableZoom) {
                        initializeZoom(svgContainer, { width, height, margin });
                    } else {
                        // Disable zoom if it was previously enabled
                        zoomSystem.enabled(false);
                        svgContainer.on(".zoom", null);
                    }
                }, 50); // Small delay to ensure DOM is ready
                
            } catch (error) {
                console.error("MintWaterfall treemap rendering error:", error);
                console.error("Stack trace:", error.stack);
                
                // Clear any partial rendering and show error
                containerUpdate.selectAll("*").remove();
                containerUpdate.append("text")
                    .attr("x", width / 2 - margin.left)
                    .attr("y", height / 2 - margin.top)
                    .attr("text-anchor", "middle")
                    .style("font-size", "14px")
                    .style("fill", "#ff6b6b")
                    .text(`Chart Error: ${error.message}`);
            }
        });
    }
    
    /**
     * Draw treemap cells
     * @param {Selection} container - Container selection
     * @param {Array} nodes - Hierarchical nodes
     */
    function drawCells(container, nodes) {
        // Create cell groups
        const cells = container.selectAll(".cell")
            .data(nodes, d => d.data.id || (d.parent ? d.parent.data.id + "." : "") + d.data.name);
        
        // Remove exiting cells
        cells.exit()
            .transition()
            .duration(duration)
            .ease(ease)
            .style("opacity", 0)
            .remove();
        
        // Create new cells
        const cellsEnter = cells.enter()
            .append("g")
            .attr("class", "cell")
            .attr("transform", d => `translate(${d.x0},${d.y0})`)
            .style("opacity", 0);
        
        // Add rectangles to cells
        cellsEnter.append("rect")
            .attr("id", d => `rect-${d.data.id || d.data.name.replace(/\s+/g, "-")}`)
            .attr("width", d => d.x1 - d.x0)
            .attr("height", d => d.y1 - d.y0)
            .style("fill", d => colorScale(d.depth))
            .style("stroke", "#fff");
        
        // Add labels to cells
        if (showLabels) {
            cellsEnter.append("text")
                .attr("class", "cell-label")
                .attr("x", 4)
                .attr("y", 14)
                .style("font-size", "10px")
                .style("font-weight", "bold")
                .style("fill", "#fff")
                .text(d => {
                    // Only show label if rectangle is big enough
                    const cellWidth = d.x1 - d.x0;
                    const cellHeight = d.y1 - d.y0;
                    return (cellWidth > labelMinSize && cellHeight > labelMinSize) ? 
                        d.data[labelField] || d.data.name : "";
                });
                
            // Add value labels
            cellsEnter.append("text")
                .attr("class", "cell-value")
                .attr("x", 4)
                .attr("y", 26)
                .style("font-size", "9px")
                .style("fill", "#fff")
                .text(d => {
                    const cellWidth = d.x1 - d.x0;
                    const cellHeight = d.y1 - d.y0;
                    return (cellWidth > labelMinSize && cellHeight > labelMinSize) ? 
                        formatNumber(d.value) : "";
                });
        }
        
        // Update all cells
        const cellsUpdate = cellsEnter.merge(cells);
        
        // Transition cells to their positions
        cellsUpdate.transition()
            .duration(duration)
            .ease(ease)
            .attr("transform", d => `translate(${d.x0},${d.y0})`)
            .style("opacity", 1);
        
        // Update rectangles
        cellsUpdate.select("rect")
            .transition()
            .duration(duration)
            .ease(ease)
            .attr("width", d => Math.max(0, d.x1 - d.x0))
            .attr("height", d => Math.max(0, d.y1 - d.y0))
            .style("fill", d => colorScale(d.depth));
        
        // Update labels if showing
        if (showLabels) {
            cellsUpdate.select(".cell-label")
                .transition()
                .duration(duration)
                .ease(ease)
                .text(d => {
                    const cellWidth = d.x1 - d.x0;
                    const cellHeight = d.y1 - d.y0;
                    return (cellWidth > labelMinSize && cellHeight > labelMinSize) ? 
                        d.data[labelField] || d.data.name : "";
                });
                
            cellsUpdate.select(".cell-value")
                .transition()
                .duration(duration)
                .ease(ease)
                .text(d => {
                    const cellWidth = d.x1 - d.x0;
                    const cellHeight = d.y1 - d.y0;
                    return (cellWidth > labelMinSize && cellHeight > labelMinSize) ? 
                        formatNumber(d.value) : "";
                });
        }
        
        // Add event listeners
        cellsUpdate
            .on("click", function(event, d) {
                listeners.call("cellClick", this, event, d);
            })
            .on("mouseover", function(event, d) {
                d3.select(this).select("rect").style("stroke-width", 2);
                listeners.call("cellMouseover", this, event, d);
            })
            .on("mouseout", function(event, d) {
                d3.select(this).select("rect").style("stroke-width", null);
                listeners.call("cellMouseout", this, event, d);
            });
    }
    
    /**
     * Initialize accessibility features
     * @param {Selection} svg - SVG container
     * @param {Array} nodes - Hierarchical nodes
     */
    function initializeAccessibility(svg, nodes) {
        try {
            // Create live region for announcements
            accessibilitySystem.createLiveRegion(d3.select("body"));
            
            // Create chart description
            const chartContainer = svg.node().parentElement;
            accessibilitySystem.createChartDescription(
                d3.select(chartContainer), 
                nodes, 
                {
                    title: "Treemap Chart",
                    formatNumber
                }
            );
            
            // Make chart accessible
            accessibilitySystem.makeAccessible(d3.select(chartContainer), nodes, {
                formatNumber,
                descriptionFunction: node => 
                    `${node.data[labelField] || node.data.name}: ${formatNumber(node.value)}`
            });
            
            // Apply high contrast styles if needed
            accessibilitySystem.applyHighContrastStyles(d3.select(chartContainer));
            
            // Respect reduced motion preferences
            if (accessibilitySystem.respectsReducedMotion()) {
                duration = 0;
            }
            
        } catch (error) {
            console.warn("MintWaterfall: Accessibility initialization failed:", error);
        }
    }
    
    /**
     * Initialize tooltip system
     * @param {Selection} svg - SVG container
     */
    function initializeTooltips(svg) {
        try {
            // Configure tooltip
            tooltipSystem.theme(tooltipConfig.theme || "default")
                        .position(tooltipConfig.position || "smart")
                        .formatNumber(formatNumber);
            
            // Attach tooltip events to cells
            const cells = svg.selectAll(".cell");
            
            cells.on("mouseover.tooltip", function(event, d) {
                   if (enableTooltips) {
                       const content = tooltipConfig.content || 
                           `<strong>${d.data[labelField] || d.data.name}</strong><br>` +
                           `Value: ${formatNumber(d.value)}`;
                           
                       tooltipSystem.show(content, event, d);
                   }
               })
               .on("mouseout.tooltip", function() {
                   if (enableTooltips) {
                       tooltipSystem.hide();
                   }
               })
               .on("mousemove.tooltip", function(event) {
                   if (enableTooltips) {
                       tooltipSystem.move(event);
                   }
               });
               
        } catch (error) {
            console.warn("MintWaterfall: Tooltip initialization failed:", error);
        }
    }
    
    /**
     * Initialize export functionality
     * @param {Selection} svg - SVG container
     * @param {Object} data - Chart data
     */
    function initializeExport(svg, data) {
        try {
            // Configure export system
            exportSystem.config(exportConfig);
            
            // Store reference to chart data for export
            chart._exportData = data;
            chart._exportContainer = d3.select(svg.node().parentElement);
            
        } catch (error) {
            console.warn("MintWaterfall: Export initialization failed:", error);
        }
    }
    
    /**
     * Initialize zoom functionality
     * @param {Selection} svg - SVG container
     * @param {Object} dimensions - Chart dimensions
     */
    function initializeZoom(svg, dimensions) {
        try {
            // Configure zoom system
            zoomSystem
                .enabled(enableZoom)
                .scaleExtent(zoomConfig.scaleExtent || [0.1, 10])
                .constrain(zoomConfig.constrain || { x: true, y: true });
            
            // Only set wheelDelta if explicitly configured
            if (zoomConfig.wheelDelta !== undefined) {
                zoomSystem.wheelDelta(zoomConfig.wheelDelta);
            }
            
            // Apply zoom to SVG container
            zoomSystem(svg, dimensions);
            
            // Set up zoom event handlers
            zoomSystem
                .on("zoom", (event, transform) => {
                    svg.select(".chart-group").attr("transform", transform);
                })
                .on("zoomend", (event, transform) => {
                    console.log("Zoom ended at:", transform);
                });
            
        } catch (error) {
            console.error("Failed to initialize zoom system:", error);
        }
    }
    
    // Getter/setter methods for chainable API
    chart.width = function(_) {
        return arguments.length ? (width = _, chart) : width;
    };
    
    chart.height = function(_) {
        return arguments.length ? (height = _, chart) : height;
    };
    
    chart.margin = function(_) {
        return arguments.length ? (margin = _, chart) : margin;
    };
    
    chart.padding = function(_) {
        return arguments.length ? (padding = _, chart) : padding;
    };
    
    chart.paddingInner = function(_) {
        return arguments.length ? (paddingInner = _, chart) : paddingInner;
    };
    
    chart.paddingOuter = function(_) {
        return arguments.length ? (paddingOuter = _, chart) : paddingOuter;
    };
    
    chart.paddingTop = function(_) {
        return arguments.length ? (paddingTop = _, chart) : paddingTop;
    };
    
    chart.paddingRight = function(_) {
        return arguments.length ? (paddingRight = _, chart) : paddingRight;
    };
    
    chart.paddingBottom = function(_) {
        return arguments.length ? (paddingBottom = _, chart) : paddingBottom;
    };
    
    chart.paddingLeft = function(_) {
        return arguments.length ? (paddingLeft = _, chart) : paddingLeft;
    };
    
    chart.round = function(_) {
        return arguments.length ? (round = _, chart) : round;
    };
    
    chart.ratio = function(_) {
        return arguments.length ? (ratio = _, chart) : ratio;
    };
    
    chart.valueField = function(_) {
        return arguments.length ? (valueField = _, chart) : valueField;
    };
    
    chart.labelField = function(_) {
        return arguments.length ? (labelField = _, chart) : labelField;
    };
    
    chart.idField = function(_) {
        return arguments.length ? (idField = _, chart) : idField;
    };
    
    chart.parentField = function(_) {
        return arguments.length ? (parentField = _, chart) : parentField;
    };
    
    chart.colorScale = function(_) {
        return arguments.length ? (colorScale = _, chart) : colorScale;
    };
    
    chart.duration = function(_) {
        return arguments.length ? (duration = _, chart) : duration;
    };
    
    chart.ease = function(_) {
        return arguments.length ? (ease = _, chart) : ease;
    };
    
    chart.formatNumber = function(_) {
        return arguments.length ? (formatNumber = _, chart) : formatNumber;
    };
    
    chart.theme = function(_) {
        return arguments.length ? (theme = _, chart) : theme;
    };
    
    chart.maxDepth = function(_) {
        return arguments.length ? (maxDepth = _, chart) : maxDepth;
    };
    
    chart.showLabels = function(_) {
        return arguments.length ? (showLabels = _, chart) : showLabels;
    };
    
    chart.labelMinSize = function(_) {
        return arguments.length ? (labelMinSize = _, chart) : labelMinSize;
    };
    
    // Accessibility configuration
    chart.accessibility = function(_) {
        return arguments.length ? (enableAccessibility = _, chart) : enableAccessibility;
    };
    
    // Tooltip configuration
    chart.tooltips = function(_) {
        return arguments.length ? (enableTooltips = _, chart) : enableTooltips;
    };
    
    chart.tooltipConfig = function(_) {
        return arguments.length ? (tooltipConfig = { ...tooltipConfig, ..._ }, chart) : tooltipConfig;
    };
    
    // Export configuration
    chart.export = function(format = "svg", options = {}) {
        if (!chart._exportContainer || !chart._exportData) {
            throw new Error("Chart must be rendered before exporting");
        }
        
        switch (format.toLowerCase()) {
            case "svg":
                return exportSystem.exportSVG(chart._exportContainer, options);
            case "png":
                return exportSystem.exportPNG(chart._exportContainer, options);
            case "jpeg":
            case "jpg":
                return exportSystem.exportJPEG(chart._exportContainer, options);
            case "pdf":
                return exportSystem.exportPDF(chart._exportContainer, options);
            case "json":
            case "csv":
            case "tsv":
            case "xml":
                return exportSystem.exportData(chart._exportData, format, options);
            default:
                throw new Error(`Unsupported export format: ${format}`);
        }
    };
    
    chart.exportConfig = function(_) {
        return arguments.length ? (exportConfig = { ...exportConfig, ..._ }, chart) : exportConfig;
    };
    
    // Zoom configuration
    chart.zoom = function(_) {
        return arguments.length ? (enableZoom = _, chart) : enableZoom;
    };
    
    chart.zoomConfig = function(_) {
        return arguments.length ? (zoomConfig = { ...zoomConfig, ..._ }, chart) : zoomConfig;
    };
    
    // Event handling methods
    chart.on = function() {
        const value = listeners.on.apply(listeners, arguments);
        return value === listeners ? chart : value;
    };
    
    return chart;
}

// Helper function to create the MintWaterfall treemap chart instance
d3.treemapChart = treemapChart;
