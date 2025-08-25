// MintWaterfall - D3.js compatible waterfall chart component
// Usage: d3.waterfallChart().width(800).height(400).showTotal(true)(selection)

import { createScaleSystem } from "./mintwaterfall-scales.js";
import { createBrushSystem } from "./mintwaterfall-brush.js";
import { createAccessibilitySystem } from "./mintwaterfall-accessibility.js";
import { createTooltipSystem } from "./mintwaterfall-tooltip.js";
import { createExportSystem } from "./mintwaterfall-export.js";

// Utility function to get bar width from any scale type
function getBarWidth(scale, barCount, totalWidth) {
    if (scale.bandwidth) {
        // Band scale has bandwidth method
        return scale.bandwidth();
    } else {
        // For continuous scales, calculate width based on bar count
        const padding = 0.1;
        const availableWidth = totalWidth * (1 - padding);
        return availableWidth / barCount;
    }
}

// Utility function to get bar position from any scale type
function getBarPosition(scale, value, barWidth) {
    if (scale.bandwidth) {
        // Band scale - use scale directly
        return scale(value);
    } else {
        // Continuous scale - center the bar around the scale value
        return scale(value) - barWidth / 2;
    }
}

export function waterfallChart() {
    let width = 800;
    let height = 400;
    let margin = { top: 60, right: 80, bottom: 60, left: 80 };
    let showTotal = false;
    let totalLabel = "Total";
    let totalColor = "#95A5A6";
    let stacked = true;
    let barPadding = 0.1;
    let duration = 750;
    let ease = d3.easeQuadInOut;
    let formatNumber = d3.format(".0f");
    let theme = null;
    
    // Advanced features
    let enableBrush = false;
    let brushOptions = {};
    let staggeredAnimations = false;
    let staggerDelay = 100;
    let scaleType = "auto"; // 'auto', 'linear', 'time', 'ordinal'
    
    // Accessibility and UX features
    let enableAccessibility = true;
    let enableTooltips = false;
    let tooltipConfig = {};
    let enableExport = true;
    let exportConfig = {};
    
    // Initialize systems
    const scaleSystem = createScaleSystem();
    const brushSystem = createBrushSystem();
    const accessibilitySystem = createAccessibilitySystem();
    const tooltipSystem = createTooltipSystem();
    const exportSystem = createExportSystem();
    
    // Event listeners - enhanced with brush events
    const listeners = d3.dispatch("barClick", "barMouseover", "barMouseout", "chartUpdate", "brushSelection");

    function chart(selection) {
        selection.each(function(data) {
            // Data validation
            if (!data || !Array.isArray(data)) {
                console.warn("MintWaterfall: Invalid data provided. Expected an array.");
                return;
            }

            if (data.length === 0) {
                console.warn("MintWaterfall: Empty data array provided.");
                return;
            }

            // Validate data structure
            const isValidData = data.every(item => 
                item && 
                typeof item.label === "string" && 
                Array.isArray(item.stacks) &&
                item.stacks.every(stack => 
                    typeof stack.value === "number" && 
                    typeof stack.color === "string"
                )
            );

            if (!isValidData) {
                console.error("MintWaterfall: Invalid data structure. Each item must have a 'label' string and 'stacks' array with 'value' numbers and 'color' strings.");
                return;
            }

            const svg = d3.select(this);
            const container = svg.selectAll(".waterfall-container").data([data]);
            
            // Create main container group
            const containerEnter = container.enter()
                .append("g")
                .attr("class", "waterfall-container");
            
            const containerUpdate = containerEnter.merge(container);

            try {
                // Prepare data with cumulative calculations
                const processedData = prepareData(data);
                
                // Set up scales using enhanced scale system
                let xScale;
                if (scaleType === "auto") {
                    xScale = scaleSystem.createAdaptiveScale(processedData, "x");
                    // If it's a band scale, apply padding
                    if (xScale.padding) {
                        xScale.padding(barPadding);
                    }
                } else if (scaleType === "time") {
                    const timeValues = processedData.map(d => new Date(d.label));
                    xScale = scaleSystem.createTimeScale(timeValues);
                } else if (scaleType === "ordinal") {
                    xScale = scaleSystem.createOrdinalScale(processedData.map(d => d.label));
                } else {
                    // Default to band scale for categorical data
                    xScale = d3.scaleBand()
                        .domain(processedData.map(d => d.label))
                        .padding(barPadding);
                }
                
                // Set range for x scale
                xScale.range([margin.left, width - margin.right]);

                // Enhanced Y scale using d3.extent and nice()
                const yValues = processedData.map(d => d.cumulativeTotal);
                
                // For waterfall charts, ensure proper baseline handling
                const [min, max] = d3.extent(yValues);
                const hasNegativeValues = min < 0;
                
                let yScale;
                if (hasNegativeValues) {
                    // When we have negative values, create scale that includes them but doesn't extend too far
                    const range = max - min;
                    const padding = range * 0.05; // 5% padding
                    yScale = d3.scaleLinear()
                        .domain([min - padding, max + padding])
                        .range([height - margin.bottom, margin.top]);
                } else {
                    // For positive-only data, start at 0
                    yScale = scaleSystem.createLinearScale(yValues, {
                        range: [height - margin.bottom, margin.top],
                        nice: true,
                        padding: 0.02,
                        includeZero: true
                    });
                }

                // Create/update grid
                drawGrid(containerUpdate, yScale);
                
                // Create/update axes
                drawAxes(containerUpdate, xScale, yScale);
                
                // Create/update bars with enhanced animations
                if (staggeredAnimations) {
                    drawBarsWithStagger(containerUpdate, processedData, xScale, yScale);
                } else {
                    drawBars(containerUpdate, processedData, xScale, yScale);
                }
                
                // Create/update connectors
                drawConnectors(containerUpdate, processedData, xScale, yScale);
                
                // Add brush functionality if enabled
                if (enableBrush) {
                    addBrushSelection(containerUpdate, processedData, xScale, yScale);
                }
                // Initialize features after rendering is complete
                setTimeout(() => {
                    if (enableAccessibility) {
                        initializeAccessibility(svg, processedData);
                    }
                    
                    if (enableTooltips) {
                        initializeTooltips(svg);
                    }
                    
                    if (enableExport) {
                        initializeExport(svg, processedData);
                    }
                }, 50); // Small delay to ensure DOM is ready
                
            } catch (error) {
                console.error("MintWaterfall rendering error:", error);
                console.error("Stack trace:", error.stack);
                
                // Clear any partial rendering and show error
                containerUpdate.selectAll("*").remove();
                containerUpdate.append("text")
                    .attr("x", width / 2)
                    .attr("y", height / 2)
                    .attr("text-anchor", "middle")
                    .style("font-size", "14px")
                    .style("fill", "#ff6b6b")
                    .text(`Chart Error: ${error.message}`);
            }
        });
    }

    function prepareData(data) {
        const workingData = [...data];
        let cumulativeTotal = 0;
        let prevCumulativeTotal = 0;

        // Process each bar with cumulative totals
        const processedData = workingData.map((bar, i) => {
            const barTotal = bar.stacks.reduce((sum, stack) => sum + stack.value, 0);
            prevCumulativeTotal = cumulativeTotal;
            cumulativeTotal += barTotal;
            
            return {
                ...bar,
                barTotal,
                cumulativeTotal,
                prevCumulativeTotal,
                index: i
            };
        });

        // Add total bar if requested
        if (showTotal) {
            const finalTotal = cumulativeTotal;
            processedData.push({
                label: totalLabel,
                stacks: [{ value: finalTotal, color: totalColor, label: finalTotal.toString() }],
                barTotal: finalTotal,
                cumulativeTotal: finalTotal,
                prevCumulativeTotal: 0,
                isTotal: true,
                index: processedData.length
            });
        }

        return processedData;
    }

    function drawGrid(container, yScale) {
        const gridGroup = container.selectAll(".grid-group").data([0]);
        const gridGroupEnter = gridGroup.enter()
            .append("g")
            .attr("class", "grid-group");
        const gridGroupUpdate = gridGroupEnter.merge(gridGroup);

        const ticks = yScale.ticks(10);
        const gridLines = gridGroupUpdate.selectAll(".grid-line").data(ticks);

        gridLines.enter()
            .append("line")
            .attr("class", "grid-line")
            .attr("x1", margin.left)
            .attr("x2", width - margin.right)
            .attr("stroke", theme?.gridColor || "#e0e0e0")
            .attr("stroke-width", 1)
            .merge(gridLines)
            .transition()
            .duration(duration)
            .ease(ease)
            .attr("y1", d => yScale(d))
            .attr("y2", d => yScale(d));

        gridLines.exit().remove();
    }

    function drawAxes(container, xScale, yScale) {
        // Y-axis
        const yAxisGroup = container.selectAll(".y-axis").data([0]);
        const yAxisGroupEnter = yAxisGroup.enter()
            .append("g")
            .attr("class", "y-axis")
            .attr("transform", `translate(${margin.left},0)`);
        
        yAxisGroupEnter.merge(yAxisGroup)
            .transition()
            .duration(duration)
            .ease(ease)
            .call(d3.axisLeft(yScale).tickFormat(formatNumber));

        // X-axis
        const xAxisGroup = container.selectAll(".x-axis").data([0]);
        const xAxisGroupEnter = xAxisGroup.enter()
            .append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0,${height - margin.bottom})`);
        
        xAxisGroupEnter.merge(xAxisGroup)
            .transition()
            .duration(duration)
            .ease(ease)
            .call(d3.axisBottom(xScale));
    }

    function drawBars(container, processedData, xScale, yScale) {
        const barsGroup = container.selectAll(".bars-group").data([0]);
        const barsGroupEnter = barsGroup.enter()
            .append("g")
            .attr("class", "bars-group");
        const barsGroupUpdate = barsGroupEnter.merge(barsGroup);

        // Bar groups for each data point
        const barGroups = barsGroupUpdate.selectAll(".bar-group").data(processedData, d => d.label);
        
        const barGroupsEnter = barGroups.enter()
            .append("g")
            .attr("class", "bar-group")
            .attr("transform", d => {
                const barWidth = getBarWidth(xScale, processedData.length, innerWidth);
                const barX = getBarPosition(xScale, d.label, barWidth);
                return `translate(${barX}, 0)`;
            });

        const barGroupsUpdate = barGroupsEnter.merge(barGroups);

        barGroupsUpdate
            .transition()
            .duration(duration)
            .ease(ease)
            .attr("transform", d => {
                const barWidth = getBarWidth(xScale, processedData.length, innerWidth);
                const barX = getBarPosition(xScale, d.label, barWidth);
                return `translate(${barX}, 0)`;
            });

        if (stacked) {
            drawStackedBars(barGroupsUpdate, xScale, yScale);
        } else {
            drawWaterfallBars(barGroupsUpdate, xScale, yScale);
        }

        // Add value labels
        drawValueLabels(barGroupsUpdate, xScale, yScale);

        barGroups.exit()
            .transition()
            .duration(duration)
            .ease(ease)
            .style("opacity", 0)
            .remove();
    }

    function drawStackedBars(barGroups, xScale, yScale) {
        barGroups.each(function(d) {
            const group = d3.select(this);
            const stackData = d.stacks.map((stack, i) => ({
                ...stack,
                stackIndex: i,
                parent: d
            }));

            // Calculate stack positions
            let stackBottom = d.isTotal ? yScale(0) : yScale(d.prevCumulativeTotal);
            stackData.forEach(stack => {
                const stackHeight = Math.abs(yScale(0) - yScale(Math.abs(stack.value)));
                stack.y = stackBottom - stackHeight;
                stack.height = stackHeight;
                stackBottom -= stackHeight;
            });

            const stacks = group.selectAll(".stack").data(stackData);
            
            // Get bar width using utility function
            const barWidth = getBarWidth(xScale, barGroups.size(), innerWidth);
            
            const stacksEnter = stacks.enter()
                .append("rect")
                .attr("class", "stack")
                .attr("x", 0)
                .attr("width", barWidth)
                .attr("y", yScale(0))
                .attr("height", 0)
                .attr("fill", stack => stack.color);

            stacksEnter.merge(stacks)
                .transition()
                .duration(duration)
                .ease(ease)
                .attr("y", stack => stack.y)
                .attr("height", stack => stack.height)
                .attr("fill", stack => stack.color)
                .selection()
                .on("click", function(event, d) {
                    listeners.call("barClick", this, event, d);
                })
                .on("mouseover", function(event, d) {
                    d3.select(this).style("opacity", 0.8);
                    listeners.call("barMouseover", this, event, d);
                })
                .on("mouseout", function(event, d) {
                    d3.select(this).style("opacity", 1);
                    listeners.call("barMouseout", this, event, d);
                });

            stacks.exit()
                .transition()
                .duration(duration)
                .ease(ease)
                .attr("height", 0)
                .attr("y", yScale(0))
                .remove();

            // Stack labels
            const stackLabels = group.selectAll(".stack-label").data(stackData.filter(s => s.label));
            
            stackLabels.enter()
                .append("text")
                .attr("class", "stack-label")
                .attr("text-anchor", "middle")
                .attr("x", barWidth / 2)
                .attr("y", yScale(0))
                .style("opacity", 0)
                .merge(stackLabels)
                .transition()
                .duration(duration)
                .ease(ease)
                .attr("y", stack => stack.y + stack.height / 2 + 4)
                .style("opacity", 1)
                .text(stack => stack.label);

            stackLabels.exit()
                .transition()
                .duration(duration)
                .ease(ease)
                .style("opacity", 0)
                .remove();
        });
    }

    function drawWaterfallBars(barGroups, xScale, yScale) {
        const barWidth = getBarWidth(xScale, barGroups.size(), innerWidth);
        
        barGroups.each(function(d) {
            const group = d3.select(this);
            
            const barData = [{
                value: d.barTotal,
                color: d.stacks.length === 1 ? d.stacks[0].color : mixColors(d.stacks),
                y: d.isTotal ? yScale(d.cumulativeTotal) : yScale(Math.max(d.prevCumulativeTotal, d.cumulativeTotal)),
                height: d.isTotal ? 
                    yScale(0) - yScale(d.cumulativeTotal) : 
                    Math.abs(yScale(d.prevCumulativeTotal) - yScale(d.cumulativeTotal)),
                parent: d
            }];

            const bars = group.selectAll(".waterfall-bar").data(barData);
            
            const barsEnter = bars.enter()
                .append("rect")
                .attr("class", "waterfall-bar")
                .attr("x", 0)
                .attr("width", barWidth)
                .attr("y", yScale(0))
                .attr("height", 0)
                .attr("fill", bar => bar.color);

            barsEnter.merge(bars)
                .transition()
                .duration(duration)
                .ease(ease)
                .attr("y", bar => bar.y)
                .attr("height", bar => bar.height)
                .attr("fill", bar => bar.color);

            bars.exit()
                .transition()
                .duration(duration)
                .ease(ease)
                .attr("height", 0)
                .attr("y", yScale(0))
                .remove();
        });
    }

    function drawValueLabels(barGroups, xScale, yScale) {
        const barWidth = getBarWidth(xScale, barGroups.size(), innerWidth);
        
        // Cumulative total labels
        const totalLabels = barGroups.selectAll(".total-label").data(d => [d]);
        
        totalLabels.enter()
            .append("text")
            .attr("class", "total-label")
            .attr("text-anchor", "middle")
            .attr("x", barWidth / 2)
            .attr("y", yScale(0))
            .style("opacity", 0)
            .merge(totalLabels)
            .transition()
            .duration(duration)
            .ease(ease)
            .attr("y", d => yScale(d.cumulativeTotal) - 10)
            .style("opacity", 1)
            .text(d => formatNumber(d.cumulativeTotal));

        totalLabels.exit()
            .transition()
            .duration(duration)
            .ease(ease)
            .style("opacity", 0)
            .remove();
    }

    function drawConnectors(container, processedData, xScale, yScale) {
        const connectorsGroup = container.selectAll(".connectors-group").data([0]);
        const connectorsGroupEnter = connectorsGroup.enter()
            .append("g")
            .attr("class", "connectors-group");
        const connectorsGroupUpdate = connectorsGroupEnter.merge(connectorsGroup);

        // Create connector data
        const barWidth = getBarWidth(xScale, processedData.length, innerWidth);
        const connectorData = [];
        for (let i = 0; i < processedData.length - 1; i++) {
            const current = processedData[i];
            const next = processedData[i + 1];
            
            const currentX = getBarPosition(xScale, current.label, barWidth);
            const nextX = getBarPosition(xScale, next.label, barWidth);
            
            connectorData.push({
                x1: currentX + barWidth,
                y1: yScale(current.cumulativeTotal),
                x2: nextX,
                y2: next.isTotal ? yScale(next.cumulativeTotal) : yScale(current.cumulativeTotal),
                id: `connector-${i}`
            });
        }

        const connectors = connectorsGroupUpdate.selectAll(".connector").data(connectorData, d => d.id);
        
        connectors.enter()
            .append("line")
            .attr("class", "connector")
            .attr("stroke", "#666")
            .attr("stroke-width", 1)
            .attr("stroke-dasharray", "3,3")
            .attr("x1", d => d.x1)
            .attr("y1", yScale(0))
            .attr("x2", d => d.x1)
            .attr("y2", yScale(0))
            .merge(connectors)
            .transition()
            .duration(duration)
            .ease(ease)
            .attr("x1", d => d.x1)
            .attr("y1", d => d.y1)
            .attr("x2", d => d.x2)
            .attr("y2", d => d.y2);

        connectors.exit()
            .transition()
            .duration(duration)
            .ease(ease)
            .style("opacity", 0)
            .remove();
    }

    function mixColors(stacks) {
        // Use the color of the stack with the largest absolute value
        let maxValue = 0;
        let dominantColor = stacks[0].color;
        
        for (const stack of stacks) {
            if (Math.abs(stack.value) > Math.abs(maxValue)) {
                maxValue = stack.value;
                dominantColor = stack.color;
            }
        }
        
        return dominantColor;
    }
    
    // Enhanced bar drawing with staggered animations
    function drawBarsWithStagger(container, processedData, xScale, yScale) {
        const barsGroup = container.selectAll(".bars-group").data([0]);
        const barsGroupEnter = barsGroup.enter()
            .append("g")
            .attr("class", "bars-group");
        const barsGroupUpdate = barsGroupEnter.merge(barsGroup);

        // Bar groups for each data point
        const barGroups = barsGroupUpdate.selectAll(".bar-group").data(processedData, d => d.label);
        
        const barGroupsEnter = barGroups.enter()
            .append("g")
            .attr("class", "bar-group")
            .attr("transform", d => {
                const barWidth = getBarWidth(xScale, processedData.length, innerWidth);
                const barX = getBarPosition(xScale, d.label, barWidth);
                return `translate(${barX}, 0)`;
            })
            .style("opacity", 0);

        const barGroupsUpdate = barGroupsEnter.merge(barGroups);
        
        // Reset all bars to invisible for staggered effect
        barGroupsUpdate.style("opacity", 0);

        // Apply staggered animation using the animation system
        barGroupsUpdate.each(function(d, i) {
            const group = d3.select(this);
            setTimeout(() => {
                group.transition()
                    .duration(duration)
                    .ease(ease)
                    .style("opacity", 1)
                    .attr("transform", d => {
                        const barWidth = getBarWidth(xScale, processedData.length, innerWidth);
                        const barX = getBarPosition(xScale, d.label, barWidth);
                        return `translate(${barX}, 0)`;
                    });
            }, i * staggerDelay);
        });

        if (stacked) {
            drawStackedBars(barGroupsUpdate, xScale, yScale);
        } else {
            drawWaterfallBars(barGroupsUpdate, xScale, yScale);
        }

        // Add value labels
        drawValueLabels(barGroupsUpdate, xScale, yScale);

        barGroups.exit()
            .transition()
            .duration(duration)
            .ease(ease)
            .style("opacity", 0)
            .remove();
    }
    
    // Initialize accessibility features
    function initializeAccessibility(svg, data) {
        try {
            console.log("Initializing accessibility features...");
            
            // Create live region for announcements
            accessibilitySystem.createLiveRegion(d3.select("body"));
            
            // Create chart description
            const chartContainer = svg.node().parentElement;
            accessibilitySystem.createChartDescription(
                d3.select(chartContainer), 
                data, 
                {
                    title: "Waterfall Chart",
                    showTotal,
                    formatNumber
                }
            );
            
            // Make chart accessible
            accessibilitySystem.makeAccessible(d3.select(chartContainer), data, {
                formatNumber,
                showTotal
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
    
    // Initialize tooltip system
    function initializeTooltips(svg) {
        try {
            console.log("Initializing tooltip system...");
            
            // Configure tooltip
            tooltipSystem.theme(tooltipConfig.theme || "default")
                        .position(tooltipConfig.position || "smart")
                        .formatNumber(formatNumber);
            
            // Attach tooltip events to bars
            const barGroups = svg.selectAll(".bar-group");
            console.log("Found bar groups for tooltips:", barGroups.size());
            
            barGroups.on("mouseover.tooltip", function(event, d) {
                   if (enableTooltips) {
                       console.log("Tooltip mouseover - data:", d);
                       tooltipSystem.show(tooltipConfig.content, event, d);
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
    
    // Initialize export functionality
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

    // Add brush selection functionality
    function addBrushSelection(container, data, xScale, yScale) {
        const brush = brushSystem.createBrush({
            type: "x",
            extent: [[xScale.range()[0], yScale.range()[1]], [xScale.range()[1], yScale.range()[0]]],
            ...brushOptions
        });
        
        // Remove existing brush if any
        container.selectAll(".waterfall-brush").remove();
        
        brushSystem.addBrushToChart(container, brush, {
            className: "waterfall-brush",
            styles: {
                selection: {
                    fill: "rgba(70, 130, 180, 0.2)",
                    stroke: "#4682b4"
                }
            }
        });
        
        // Set up brush event handlers
        brushSystem
            .onEnd((event, selection) => {
                if (selection) {
                    const filteredData = brushSystem.filterDataByBrush(data, selection, xScale);
                    const selectedIndices = brushSystem.getSelectedIndices(data, selection, xScale);
                    
                    // Highlight selected bars
                    brushSystem.selectionUtils.highlightSelection(container, selectedIndices, {
                        selectedOpacity: 1,
                        unselectedOpacity: 0.3
                    });
                    
                    // Dispatch brush selection event
                    listeners.call("brushSelection", container.node(), event, {
                        data: filteredData,
                        indices: selectedIndices,
                        selection,
                        summary: brushSystem.selectionUtils.createSelectionSummary(filteredData)
                    });
                } else {
                    // Clear selection highlighting
                    brushSystem.selectionUtils.highlightSelection(container, []);
                }
            });
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

    chart.showTotal = function(_) {
        return arguments.length ? (showTotal = _, chart) : showTotal;
    };

    chart.totalLabel = function(_) {
        return arguments.length ? (totalLabel = _, chart) : totalLabel;
    };

    chart.totalColor = function(_) {
        return arguments.length ? (totalColor = _, chart) : totalColor;
    };

    chart.stacked = function(_) {
        return arguments.length ? (stacked = _, chart) : stacked;
    };

    chart.barPadding = function(_) {
        return arguments.length ? (barPadding = _, chart) : barPadding;
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

    // Enhanced features configuration
    chart.enableBrush = function(_) {
        return arguments.length ? (enableBrush = _, chart) : enableBrush;
    };

    chart.brushOptions = function(_) {
        return arguments.length ? (brushOptions = _, chart) : brushOptions;
    };

    chart.staggeredAnimations = function(_) {
        return arguments.length ? (staggeredAnimations = _, chart) : staggeredAnimations;
    };

    chart.staggerDelay = function(_) {
        return arguments.length ? (staggerDelay = _, chart) : staggerDelay;
    };

    chart.scaleType = function(_) {
        return arguments.length ? (scaleType = _, chart) : scaleType;
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

    // Event handling methods
    chart.on = function() {
        const value = listeners.on.apply(listeners, arguments);
        return value === listeners ? chart : value;
    };

    // Method to update data
    chart.data = function() {
        return chart;
    };

    return chart;
}

// Helper function to create the MintWaterfall chart instance
d3.waterfallChart = waterfallChart;
