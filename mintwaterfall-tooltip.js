// MintWaterfall Tooltip Module
// Provides basic tooltip functionality for the waterfall chart

export function createTooltip() {
    let tooltip = null;
    
    function show(event, data) {
        if (!tooltip) {
            tooltip = d3.select("body")
                .append("div")
                .attr("class", "mintwaterfall-tooltip")
                .style("position", "absolute")
                .style("visibility", "hidden")
                .style("background", "rgba(0, 0, 0, 0.8)")
                .style("color", "white")
                .style("padding", "8px 12px")
                .style("border-radius", "4px")
                .style("font-size", "12px")
                .style("pointer-events", "none")
                .style("z-index", "1000")
                .style("box-shadow", "0 2px 8px rgba(0, 0, 0, 0.2)");
        }

        const content = formatTooltipContent(data);
        
        tooltip
            .style("visibility", "visible")
            .html(content)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 10) + "px");
    }
    
    function hide() {
        if (tooltip) {
            tooltip.style("visibility", "hidden");
        }
    }
    
    function formatTooltipContent(data) {
        if (data.parent) {
            // Stack data
            return `<strong>${data.parent.label}</strong><br/>
                    Value: ${data.value}<br/>
                    ${data.label ? `Label: ${data.label}` : ""}`;
        } else {
            // Bar data
            return `<strong>${data.label}</strong><br/>
                    Total: ${data.cumulativeTotal}<br/>
                    ${data.isTotal ? "Total Bar" : `Change: ${data.barTotal}`}`;
        }
    }
    
    function destroy() {
        if (tooltip) {
            tooltip.remove();
            tooltip = null;
        }
    }
    
    return {
        show,
        hide,
        destroy
    };
}
