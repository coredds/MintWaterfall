// MintWaterfall - D3.js compatible partition chart component
// Usage: d3.partitionChart().width(800).height(400).valueField("value")(selection)

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
 * Creates a partition chart component (sunburst or icicle)
 * @returns {Function} Chart function
 */
export function partitionChart() {
    // Configuration options
    let width = 800;
    let height = 400;
    let margin = { top: 20, right: 20, bottom: 20, left: 20 };
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
    
    // Partition-specific options
    let orientation = "horizontal"; // "horizontal" or "vertical" for icicle, "radial" for sunburst
    let cornerRadius = 0;
    let maxDepth = Infinity;
    let showLabels = true;
    let labelMinSize = 10; // Minimum arc/rectangle size to show label
    let arcPadding = 0.005; // For radial layout
    let startAngle = 0; // For radial layout
    let endAngle = 2 * Math.PI; // For radial layout
    
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
            const container = svg.selectAll(".partition-container").data([data]);
            
            // Store reference for zoom system
            const svgContainer = svg;
            
            // Create main container group
            const containerEnter = container.enter()
                .append("g")
                .attr("class", "partition-container");
            
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
                if (orientation === "radial") {
                    // For radial layout (sunburst), center the chart
                    containerUpdate.attr("transform", 
                        `translate(${width / 2}, ${height / 2})`);
                } else {
                    // For rectangular layout (icicle), use margins
                    containerUpdate.attr("transform", 
                        `translate(${margin.left}, ${margin.top})`);
                }
                
                // Process data with hierarchical layout system
                const hierarchyData = createHierarchy(data, {
                    idAccessor: d => d[idField],
                    parentAccessor: d => d[parentField],
                    valueAccessor: d => +d[valueField]
                });
                
                // Apply layout based on orientation
                let root;
                if (orientation === "radial") {
                    // Radial layout (sunburst)
                    root = applyRadialLayout(hierarchyData, innerWidth, innerHeight);
                } else {
                    // Rectangular layout (icicle)
                    root = applyRectangularLayout(hierarchyData, innerWidth, innerHeight);
                }
                
                // Filter by max depth if specified
                const nodes = root.descendants().filter(d => d.depth <= maxDepth);
                
                // Draw cells based on layout type
                if (orientation === "radial") {
                    drawArcs(chartGroup, nodes);
                } else {
                    drawRects(chartGroup, nodes);
                }
                
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
                console.error("MintWaterfall partition rendering error:", error);
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
     * Apply radial layout (sunburst)
     * @param {Object} hierarchyData - Hierarchical data
     * @param {number} innerWidth - Chart width
     * @param {number} innerHeight - Chart height
     * @returns {Object} Processed layout data
     */
    function applyRadialLayout(hierarchyData, innerWidth, innerHeight) {
        // For radial layout, use the smaller dimension to determine radius
        const radius = Math.min(innerWidth, innerHeight) / 2;
        
        // Create partition layout
        return d3.partition()
            .size([endAngle - startAngle, radius * radius])
            .padding(arcPadding)
            .round(round)
            (hierarchyData)
            .each(d => {
                // Convert to polar coordinates
                d.innerRadius = Math.sqrt(d.y0);
                d.outerRadius = Math.sqrt(d.y1);
                d.startAngle = startAngle + d.x0;
                d.endAngle = startAngle + d.x1;
            });
    }
    
    /**
     * Apply rectangular layout (icicle)
     * @param {Object} hierarchyData - Hierarchical data
     * @param {number} innerWidth - Chart width
     * @param {number} innerHeight - Chart height
     * @returns {Object} Processed layout data
     */
    function applyRectangularLayout(hierarchyData, innerWidth, innerHeight) {
        // Configure layout based on orientation
        layoutSystem
            .type("partition")
            .size(orientation === "horizontal" ? 
                [innerWidth, innerHeight] : 
                [innerHeight, innerWidth])
            .padding(padding)
            .round(round)
            .partitionOrientation(orientation);
        
        // Apply layout
        const root = layoutSystem(hierarchyData);
        
        // For vertical orientation, swap x and y coordinates
        if (orientation === "vertical") {
            root.each(node => {
                // We don't need to swap here since the layout system handles it
                // Just ensure we have the right properties for drawing
                node.x0 = node.x0;
                node.x1 = node.x1;
                node.y0 = node.y0;
                node.y1 = node.y1;
            });
        }
        
        return root;
    }
    
    /**
     * Draw rectangular cells (for icicle layout)
     * @param {Selection} container - Container selection
     * @param {Array} nodes - Hierarchical nodes
     */
    function drawRects(container, nodes) {
        // Create cell groups
        const cells = container.selectAll(".partition-cell")
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
            .attr("class", "partition-cell")
            .attr("transform", d => `translate(${d.x0},${d.y0})`)
            .style("opacity", 0);
        
        // Add rectangles to cells
        cellsEnter.append("rect")
            .attr("id", d => `rect-${d.data.id || d.data.name.replace(/\s+/g, "-")}`)
            .attr("width", d => d.x1 - d.x0)
            .attr("height", d => d.y1 - d.y0)
            .attr("rx", cornerRadius)
            .attr("ry", cornerRadius)
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
     * Draw arc cells (for sunburst layout)
     * @param {Selection} container - Container selection
     * @param {Array} nodes - Hierarchical nodes
     */
    function drawArcs(container, nodes) {
        // Create arc generator
        const arc = d3.arc()
            .startAngle(d => d.startAngle)
            .endAngle(d => d.endAngle)
            .innerRadius(d => d.innerRadius)
            .outerRadius(d => d.outerRadius)
            .cornerRadius(cornerRadius);
        
        // Create cell groups
        const cells = container.selectAll(".partition-cell")
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
            .attr("class", "partition-cell")
            .style("opacity", 0);
        
        // Add arcs to cells
        cellsEnter.append("path")
            .attr("id", d => `arc-${d.data.id || d.data.name.replace(/\s+/g, "-")}`)
            .attr("d", arc)
            .style("fill", d => colorScale(d.depth))
            .style("stroke", "#fff");
        
        // Add labels to cells
        if (showLabels) {
            cellsEnter.append("text")
                .attr("class", "cell-label")
                .attr("transform", d => {
                    // Position text at the center of the arc
                    const angle = (d.startAngle + d.endAngle) / 2;
                    const radius = (d.innerRadius + d.outerRadius) / 2;
                    const x = Math.sin(angle) * radius;
                    const y = -Math.cos(angle) * radius;
                    
                    // Rotate text to follow the arc
                    let rotate = (angle * 180 / Math.PI - 90);
                    if (angle > Math.PI) {
                        rotate += 180;
                    }
                    
                    return `translate(${x},${y}) rotate(${rotate})`;
                })
                .attr("text-anchor", d => {
                    const angle = (d.startAngle + d.endAngle) / 2;
                    return angle > Math.PI ? "end" : "start";
                })
                .style("font-size", "9px")
                .style("font-weight", "bold")
                .style("fill", "#fff")
                .text(d => {
                    // Only show label if arc is big enough
                    const arcLength = (d.endAngle - d.startAngle) * (d.outerRadius + d.innerRadius) / 2;
                    const arcWidth = d.outerRadius - d.innerRadius;
                    return (arcLength > labelMinSize && arcWidth > 5) ? 
                        d.data[labelField] || d.data.name : "";
                });
        }
        
        // Update all cells
        const cellsUpdate = cellsEnter.merge(cells);
        
        // Transition cells
        cellsUpdate.transition()
            .duration(duration)
            .ease(ease)
            .style("opacity", 1);
        
        // Update arcs
        cellsUpdate.select("path")
            .transition()
            .duration(duration)
            .ease(ease)
            .attr("d", arc)
            .style("fill", d => colorScale(d.depth));
        
        // Update labels if showing
        if (showLabels) {
            cellsUpdate.select(".cell-label")
                .transition()
                .duration(duration)
                .ease(ease)
                .attr("transform", d => {
                    // Position text at the center of the arc
                    const angle = (d.startAngle + d.endAngle) / 2;
                    const radius = (d.innerRadius + d.outerRadius) / 2;
                    const x = Math.sin(angle) * radius;
                    const y = -Math.cos(angle) * radius;
                    
                    // Rotate text to follow the arc
                    let rotate = (angle * 180 / Math.PI - 90);
                    if (angle > Math.PI) {
                        rotate += 180;
                    }
                    
                    return `translate(${x},${y}) rotate(${rotate})`;
                })
                .attr("text-anchor", d => {
                    const angle = (d.startAngle + d.endAngle) / 2;
                    return angle > Math.PI ? "end" : "start";
                })
                .text(d => {
                    // Only show label if arc is big enough
                    const arcLength = (d.endAngle - d.startAngle) * (d.outerRadius + d.innerRadius) / 2;
                    const arcWidth = d.outerRadius - d.innerRadius;
                    return (arcLength > labelMinSize && arcWidth > 5) ? 
                        d.data[labelField] || d.data.name : "";
                });
        }
        
        // Add event listeners
        cellsUpdate
            .on("click", function(event, d) {
                listeners.call("cellClick", this, event, d);
            })
            .on("mouseover", function(event, d) {
                d3.select(this).select("path").style("stroke-width", 2);
                listeners.call("cellMouseover", this, event, d);
            })
            .on("mouseout", function(event, d) {
                d3.select(this).select("path").style("stroke-width", null);
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
                    title: orientation === "radial" ? "Sunburst Chart" : "Partition Chart",
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
            const cells = svg.selectAll(".partition-cell");
            
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
    
    chart.orientation = function(_) {
        return arguments.length ? (orientation = _, chart) : orientation;
    };
    
    chart.cornerRadius = function(_) {
        return arguments.length ? (cornerRadius = _, chart) : cornerRadius;
    };
    
    chart.arcPadding = function(_) {
        return arguments.length ? (arcPadding = _, chart) : arcPadding;
    };
    
    chart.startAngle = function(_) {
        return arguments.length ? (startAngle = _, chart) : startAngle;
    };
    
    chart.endAngle = function(_) {
        return arguments.length ? (endAngle = _, chart) : endAngle;
    };
    
    chart.round = function(_) {
        return arguments.length ? (round = _, chart) : round;
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

// Helper function to create the MintWaterfall partition chart instance
d3.partitionChart = partitionChart;

// Convenience function for sunburst chart
export function sunburstChart() {
    return partitionChart().orientation("radial");
}

// Add to d3 namespace
d3.sunburstChart = sunburstChart;
