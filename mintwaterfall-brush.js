// MintWaterfall Brush Selection System
// Provides data selection and filtering capabilities using D3 brush

export function createBrushSystem() {
    
    let brushSelection = null;
    let onBrushStart = null;
    let onBrushMove = null;
    let onBrushEnd = null;
    
    // Create brush instance with configuration
    function createBrush(options = {}) {
        const {
            type = "x", // 'x', 'y', or 'xy'
            extent = [[0, 0], [800, 400]]
        } = options;
        
        let brush;
        
        switch (type) {
            case "x":
                brush = d3.brushX();
                break;
            case "y":
                brush = d3.brushY();
                break;
            case "xy":
                brush = d3.brush();
                break;
            default:
                brush = d3.brushX();
        }
        
        brush
            .extent(extent)
            .on("start", handleBrushStart)
            .on("brush", handleBrushMove)
            .on("end", handleBrushEnd);
            
        return brush;
    }
    
    // Add brush to chart container
    function addBrushToChart(container, brush, options = {}) {
        const {
            className = "waterfall-brush",
            styles = {}
        } = options;
        
        const brushGroup = container
            .append("g")
            .attr("class", className)
            .call(brush);
            
        // Apply custom styles
        if (styles.selection) {
            brushGroup.selectAll(".selection")
                .style("fill", styles.selection.fill || "rgba(70, 130, 180, 0.3)")
                .style("stroke", styles.selection.stroke || "#4682b4");
        }
        
        if (styles.handle) {
            brushGroup.selectAll(".handle")
                .style("fill", styles.handle.fill || "#4682b4")
                .style("stroke", styles.handle.stroke || "#fff");
        }
        
        return brushGroup;
    }
    
    // Filter data based on brush selection
    function filterDataByBrush(data, selection, scale, dimension = "x") {
        if (!selection || !selection[0] || !selection[1]) {
            return data; // No selection, return all data
        }
        
        const [start, end] = selection;
        
        return data.filter(d => {
            if (dimension === "x") {
                // Handle different scale types
                let position;
                if (scale.bandwidth) {
                    // Band scale - use the center of the band
                    position = scale(d.label) + scale.bandwidth() / 2;
                } else if (scale.invert) {
                    // Continuous scale (linear, time) - use the scale value directly
                    position = scale(d.label);
                } else {
                    // Fallback for other scale types
                    position = scale(d.label);
                }
                return position >= start && position <= end;
            } else {
                const position = scale(value);
                return position >= start && position <= end;
            }
        });
    }
    
    // Get selected data indices
    function getSelectedIndices(data, selection, scale, dimension = "x") {
        if (!selection) return [];
        
        const filteredData = filterDataByBrush(data, selection, scale, dimension);
        return filteredData.map(d => data.indexOf(d));
    }
    
    // Brush event handlers
    function handleBrushStart(event) {
        brushSelection = event.selection;
        if (onBrushStart) {
            onBrushStart(event, brushSelection);
        }
    }
    
    function handleBrushMove(event) {
        brushSelection = event.selection;
        if (onBrushMove) {
            onBrushMove(event, brushSelection);
        }
    }
    
    function handleBrushEnd(event) {
        brushSelection = event.selection;
        if (onBrushEnd) {
            onBrushEnd(event, brushSelection);
        }
    }
    
    // Advanced selection utilities
    const selectionUtils = {
        // Programmatically set brush selection
        setBrushSelection(brushGroup, selection) {
            brushGroup.call(brush.move, selection);
        },
        
        // Clear brush selection
        clearBrushSelection(brushGroup) {
            brushGroup.call(brush.move, null);
        },
        
        // Get brush bounds in data coordinates
        getBrushBounds(selection, scale, dimension = "x") {
            if (!selection) return null;
            
            const [start, end] = selection;
            
            if (dimension === "x" && scale.invert) {
                return [scale.invert(start), scale.invert(end)];
            } else if (dimension === "y" && scale.invert) {
                return [scale.invert(end), scale.invert(start)]; // Y is inverted
            }
            
            return [start, end];
        },
        
        // Highlight selected elements
        highlightSelection(container, selectedIndices, options = {}) {
            const {
                selectedClass = "selected",
                unselectedClass = "unselected",
                selectedOpacity = 1,
                unselectedOpacity = 0.3
            } = options;
            
            container.selectAll(".bar-group")
                .classed(selectedClass, (d, i) => selectedIndices.includes(i))
                .classed(unselectedClass, (d, i) => !selectedIndices.includes(i))
                .style("opacity", (d, i) => 
                    selectedIndices.length === 0 ? 1 : 
                    selectedIndices.includes(i) ? selectedOpacity : unselectedOpacity
                );
        },
        
        // Create selection summary
        createSelectionSummary(selectedData) {
            if (!selectedData || selectedData.length === 0) {
                return {
                    count: 0,
                    sum: 0,
                    average: 0,
                    min: 0,
                    max: 0
                };
            }
            
            const values = selectedData.map(d => d.cumulativeTotal);
            
            return {
                count: selectedData.length,
                sum: d3.sum(values),
                average: d3.mean(values),
                min: d3.min(values),
                max: d3.max(values),
                extent: d3.extent(values)
            };
        }
    };
    
    // Public API
    return {
        createBrush,
        addBrushToChart,
        filterDataByBrush,
        getSelectedIndices,
        selectionUtils,
        
        // Event handler setters
        onStart(callback) {
            onBrushStart = callback;
            return this;
        },
        
        onMove(callback) {
            onBrushMove = callback;
            return this;
        },
        
        onEnd(callback) {
            onBrushEnd = callback;
            return this;
        },
        
        // Getters
        getSelection() {
            return brushSelection;
        }
    };
}

// Convenience function for quick brush setup
export function addQuickBrush(container, data, xScale, yScale, options = {}) {
    const brushSystem = createBrushSystem();
    const brush = brushSystem.createBrush({
        extent: [[xScale.range()[0], yScale.range()[1]], [xScale.range()[1], yScale.range()[0]]],
        ...options
    });
    
    const brushGroup = brushSystem.addBrushToChart(container, brush, options);
    
    // Set up default filtering behavior
    brushSystem.onEnd((event, selection) => {
        if (selection) {
            const filteredData = brushSystem.filterDataByBrush(data, selection, xScale);
            const selectedIndices = brushSystem.getSelectedIndices(data, selection, xScale);
            
            // Highlight selected bars
            brushSystem.selectionUtils.highlightSelection(container, selectedIndices);
            
            // Dispatch custom event with selection info
            container.dispatch("brushSelection", {
                detail: {
                    data: filteredData,
                    indices: selectedIndices,
                    selection,
                    summary: brushSystem.selectionUtils.createSelectionSummary(filteredData)
                }
            });
        } else {
            // Clear selection highlighting
            brushSystem.selectionUtils.highlightSelection(container, []);
        }
    });
    
    return {
        brushSystem,
        brushGroup,
        brush
    };
}

export default createBrushSystem;
