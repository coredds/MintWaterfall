// MintWaterfall Chart Render Functions
import * as d3 from "d3";
import { ChartConfig, ProcessedData, MarginConfig, getBarWidth, getBarPosition } from "./config.js";
import { createWaterfallConfidenceBands, createWaterfallMilestones } from "../shapes.js";
import { getAdvancedBarColor, ThemeCollection } from "../themes.js";

export function drawGrid(container: any, yScale: any, config: ChartConfig, margins: MarginConfig): void {
    const gridGroup = container.selectAll(".grid-group").data([0]);
    const gridGroupEnter = gridGroup.enter()
        .append("g")
        .attr("class", "grid-group");
    const gridGroupUpdate = gridGroupEnter.merge(gridGroup);

    const tickValues = yScale.ticks();

    const gridLines = gridGroupUpdate.selectAll(".grid-line").data(tickValues);

    const gridLinesEnter = gridLines.enter()
        .append("line")
        .attr("class", "grid-line")
        .attr("x1", margins.left)
        .attr("x2", config.width - margins.right)
        .attr("stroke", "rgba(224, 224, 224, 0.5)")
        .attr("stroke-width", 1)
        .style("opacity", 0);

    gridLinesEnter.merge(gridLines)
        .transition()
        .duration(config.duration)
        .ease(config.ease)
        .attr("y1", (d: any) => yScale(d))
        .attr("y2", (d: any) => yScale(d))
        .attr("x1", margins.left)
        .attr("x2", config.width - margins.right)
        .style("opacity", 1);

    gridLines.exit()
        .transition()
        .duration(config.duration)
        .ease(config.ease)
        .style("opacity", 0)
        .remove();
}

export function drawAxes(container: any, xScale: any, yScale: any, config: ChartConfig, margins: MarginConfig): void {
    const yAxisGroup = container.selectAll(".y-axis").data([0]);
    const yAxisGroupEnter = yAxisGroup.enter()
        .append("g")
        .attr("class", "y-axis")
        .attr("transform", `translate(${margins.left},0)`);

    yAxisGroupEnter.merge(yAxisGroup)
        .transition()
        .duration(config.duration)
        .ease(config.ease)
        .call(d3.axisLeft(yScale).tickFormat((d: any) => config.formatNumber(d as number)));

    const xAxisGroup = container.selectAll(".x-axis").data([0]);
    const xAxisGroupEnter = xAxisGroup.enter()
        .append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${config.height - margins.bottom})`);

    xAxisGroupEnter.merge(xAxisGroup)
        .transition()
        .duration(config.duration)
        .ease(config.ease)
        .call(d3.axisBottom(xScale));
}

export function drawBars(container: any, processedData: ProcessedData[], xScale: any, yScale: any, config: ChartConfig, margins: MarginConfig): void {
    const barsGroup = container.selectAll(".bars-group").data([0]);
    const barsGroupEnter = barsGroup.enter()
        .append("g")
        .attr("class", "bars-group");
    const barsGroupUpdate = barsGroupEnter.merge(barsGroup);

    const barGroups = barsGroupUpdate.selectAll(".bar-group").data(processedData, (d: any) => d.label);

    const barGroupsEnter = barGroups.enter()
        .append("g")
        .attr("class", "bar-group")
        .attr("transform", (d: any) => {
            if (xScale.bandwidth) {
                return `translate(${xScale(d.label)}, 0)`;
            } else {
                const barWidth = getBarWidth(xScale, processedData.length, config.width - margins.left - margins.right);
                const barX = getBarPosition(xScale, d.label, barWidth);
                return `translate(${barX}, 0)`;
            }
        });

    const barGroupsUpdate = barGroupsEnter.merge(barGroups)
        .transition()
        .duration(config.duration)
        .ease(config.ease)
        .attr("transform", (d: any) => {
            if (xScale.bandwidth) {
                return `translate(${xScale(d.label)}, 0)`;
            } else {
                const barWidth = getBarWidth(xScale, processedData.length, config.width - margins.left - margins.right);
                const barX = getBarPosition(xScale, d.label, barWidth);
                return `translate(${barX}, 0)`;
            }
        });

    if (config.stacked) {
        drawStackedBars(barGroupsUpdate, xScale, yScale, config, margins);
    } else {
        drawWaterfallBars(barGroupsUpdate, xScale, yScale, config, margins, processedData);
    }

    drawValueLabels(barGroupsUpdate, xScale, yScale, config, margins);

    barGroups.exit()
        .transition()
        .duration(config.duration)
        .ease(config.ease)
        .style("opacity", 0)
        .remove();
}

export function drawStackedBars(barGroups: any, xScale: any, yScale: any, config: ChartConfig, margins: MarginConfig): void {
    barGroups.each(function(this: SVGGElement, d: any) {
        const group = d3.select(this);
        const stackData = d.stacks.map((stack: any, i: number) => ({
            ...stack,
            stackIndex: i,
            parent: d
        }));

        let cumulativeHeight = d.prevCumulativeTotal || 0;
        stackData.forEach((stack: any) => {
            stack.startY = cumulativeHeight;
            stack.endY = cumulativeHeight + stack.value;
            stack.y = yScale(Math.max(stack.startY, stack.endY));
            stack.height = Math.abs(yScale(stack.startY) - yScale(stack.endY));
            cumulativeHeight += stack.value;
        });

        const stacks = group.selectAll(".stack").data(stackData);

        const barWidth = xScale.bandwidth ? xScale.bandwidth() : getBarWidth(xScale, barGroups.size(), config.width - margins.left - margins.right);

        const stacksEnter = stacks.enter()
            .append("rect")
            .attr("class", "stack")
            .attr("x", 0)
            .attr("width", barWidth)
            .attr("y", yScale(0))
            .attr("height", 0)
            .attr("fill", (stack: any) => stack.color);

        (stacksEnter as any).merge(stacks)
            .transition()
            .duration(config.duration)
            .ease(config.ease)
            .attr("y", (stack: any) => stack.y)
            .attr("height", (stack: any) => stack.height)
            .attr("fill", (stack: any) => stack.color)
            .attr("width", barWidth);

        stacks.exit()
            .transition()
            .duration(config.duration)
            .ease(config.ease)
            .attr("height", 0)
            .attr("y", yScale(0))
            .remove();

        const stackLabels = group.selectAll(".stack-label").data(stackData.filter((s: any) => s.label));

        const stackLabelsEnter = stackLabels.enter()
            .append("text")
            .attr("class", "stack-label")
            .attr("text-anchor", "middle")
            .attr("x", barWidth / 2)
            .attr("y", yScale(0))
            .style("opacity", 0);

        (stackLabelsEnter as any).merge(stackLabels)
            .transition()
            .duration(config.duration)
            .ease(config.ease)
            .attr("y", (stack: any) => stack.y + stack.height / 2 + 4)
            .attr("x", barWidth / 2)
            .style("opacity", 1)
            .text((stack: any) => stack.label);

        stackLabels.exit()
            .transition()
            .duration(config.duration)
            .ease(config.ease)
            .style("opacity", 0)
            .remove();
    });
}

export function drawWaterfallBars(barGroups: any, xScale: any, yScale: any, config: ChartConfig, margins: MarginConfig, allData: ProcessedData[] = []): void {
    barGroups.each(function(this: SVGGElement, d: any) {
        const group = d3.select(this);

        const barWidth = xScale.bandwidth ? xScale.bandwidth() : getBarWidth(xScale, barGroups.size(), config.width - margins.left - margins.right);

        const defaultColor = d.stacks.length === 1 ? d.stacks[0].color : "#3498db";
        const advancedColor = config.advancedColorConfig.enabled ?
            getAdvancedBarColor(
                d.barTotal,
                defaultColor,
                allData,
                config.advancedColorConfig.themeName as keyof ThemeCollection || 'default',
                config.colorMode
            ) : defaultColor;

        const barData = [{
            value: d.barTotal,
            color: advancedColor,
            y: d.isTotal ?
                Math.min(yScale(0), yScale(d.cumulativeTotal)) :
                yScale(Math.max(d.prevCumulativeTotal, d.cumulativeTotal)),
            height: d.isTotal ?
                Math.abs(yScale(0) - yScale(d.cumulativeTotal)) :
                Math.abs(yScale(d.prevCumulativeTotal || 0) - yScale(d.cumulativeTotal)),
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
            .attr("fill", (bar: any) => bar.color);

        (barsEnter as any).merge(bars)
            .transition()
            .duration(config.duration)
            .ease(config.ease)
            .attr("y", (bar: any) => bar.y)
            .attr("height", (bar: any) => bar.height)
            .attr("fill", (bar: any) => bar.color)
            .attr("width", barWidth);

        bars.exit()
            .transition()
            .duration(config.duration)
            .ease(config.ease)
            .attr("height", 0)
            .attr("y", yScale(0))
            .remove();
    });
}

export function drawValueLabels(barGroups: any, xScale: any, yScale: any, config: ChartConfig, margins: MarginConfig): void {
    barGroups.each(function(this: SVGGElement, d: any) {
        const group = d3.select(this);
        const barWidth = getBarWidth(xScale, barGroups.size(), config.width - margins.left - margins.right);

        const labelData = [{
            value: d.barTotal,
            formattedValue: config.formatNumber(d.barTotal),
            parent: d
        }];

        const totalLabels = group.selectAll(".total-label").data(labelData);

        const totalLabelsEnter = totalLabels.enter()
            .append("text")
            .attr("class", "total-label")
            .attr("text-anchor", "middle")
            .attr("x", barWidth / 2)
            .attr("y", yScale(0))
            .style("opacity", 0)
            .style("font-family", "Arial, sans-serif");

        const labelUpdate = (totalLabelsEnter as any).merge(totalLabels);

        labelUpdate
            .transition()
            .duration(config.duration)
            .ease(config.ease)
            .attr("y", (labelD: any) => {
                const barTop = yScale(labelD.parent.cumulativeTotal);
                const padding = 8;
                const finalY = barTop - padding;
                return finalY;
            })
            .attr("x", barWidth / 2)
            .style("opacity", 1)
            .style("fill", "#333")
            .style("font-weight", "bold")
            .style("font-size", "14px")
            .style("pointer-events", "none")
            .style("visibility", "visible")
            .style("display", "block")
            .attr("clip-path", "none")
            .text((labelD: any) => labelD.formattedValue);

        totalLabels.exit()
            .transition()
            .duration(config.duration)
            .ease(config.ease)
            .style("opacity", 0)
            .remove();
    });
}

export function drawConnectors(container: any, processedData: ProcessedData[], xScale: any, yScale: any, config: ChartConfig): void {
    if (config.stacked || processedData.length < 2) return;

    const connectorsGroup = container.selectAll(".connectors-group").data([0]);
    const connectorsGroupEnter = connectorsGroup.enter()
        .append("g")
        .attr("class", "connectors-group");
    const connectorsGroupUpdate = connectorsGroupEnter.merge(connectorsGroup);

    const connectorData: any[] = [];
    for (let i = 0; i < processedData.length - 1; i++) {
        const current = processedData[i];
        const next = processedData[i + 1];

        const barWidth = getBarWidth(xScale, processedData.length, config.width - config.margin.left - config.margin.right);
        const currentX = getBarPosition(xScale, current.label, barWidth);
        const nextX = getBarPosition(xScale, next.label, barWidth);

        connectorData.push({
            x1: currentX + barWidth,
            x2: nextX,
            y: yScale(current.cumulativeTotal),
            id: `${current.label}-${next.label}`
        });
    }

    const connectors = connectorsGroupUpdate.selectAll(".connector").data(connectorData, (d: any) => d.id);

    const connectorsEnter = connectors.enter()
        .append("line")
        .attr("class", "connector")
        .attr("stroke", "#bdc3c7")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "3,3")
        .style("opacity", 0)
        .attr("x1", (d: any) => d.x1)
        .attr("x2", (d: any) => d.x1)
        .attr("y1", (d: any) => d.y)
        .attr("y2", (d: any) => d.y);

    connectorsEnter.merge(connectors)
        .transition()
        .duration(config.duration)
        .ease(config.ease)
        .delay((d: any, i: number) => config.staggeredAnimations ? i * config.staggerDelay : 0)
        .attr("x1", (d: any) => d.x1)
        .attr("x2", (d: any) => d.x2)
        .attr("y1", (d: any) => d.y)
        .attr("y2", (d: any) => d.y)
        .style("opacity", 0.6);

    connectors.exit()
        .transition()
        .duration(config.duration)
        .ease(config.ease)
        .style("opacity", 0)
        .remove();
}

export function drawTrendLine(container: any, processedData: ProcessedData[], xScale: any, yScale: any, config: ChartConfig): void {
    if (!config.showTrendLine || processedData.length < 2) {
        container.selectAll(".trend-group").remove();
        return;
    }

    const trendGroup = container.selectAll(".trend-group").data([0]);
    const trendGroupEnter = trendGroup.enter()
        .append("g")
        .attr("class", "trend-group");
    const trendGroupUpdate = trendGroupEnter.merge(trendGroup);

    const trendData: { x: number; y: number }[] = [];

    const dataPoints: { x: number; y: number; value: number }[] = [];
    for (let i = 0; i < processedData.length; i++) {
        const item = processedData[i];
        const barWidth = getBarWidth(xScale, processedData.length, config.width - config.margin.left - config.margin.right);
        const x = getBarPosition(xScale, item.label, barWidth) + barWidth / 2;
        const actualY = yScale(item.cumulativeTotal);
        dataPoints.push({ x, y: actualY, value: item.cumulativeTotal });
    }

    if (config.trendLineType === "linear") {
        const n = dataPoints.length;
        const sumX = dataPoints.reduce((sum, p, i) => sum + i, 0);
        const sumY = dataPoints.reduce((sum, p) => sum + p.value, 0);
        const sumXY = dataPoints.reduce((sum, p, i) => sum + (i * p.value), 0);
        const sumXX = dataPoints.reduce((sum, p, i) => sum + (i * i), 0);

        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        dataPoints.forEach((point, i) => {
            const trendValue = slope * i + intercept;
            trendData.push({ x: point.x, y: yScale(trendValue) });
        });
    } else if (config.trendLineType === "moving-average") {
        const window = config.trendLineWindow;
        for (let i = 0; i < dataPoints.length; i++) {
            const start = Math.max(0, i - Math.floor(window / 2));
            const end = Math.min(dataPoints.length, start + window);
            const windowData = dataPoints.slice(start, end);
            const average = windowData.reduce((sum, p) => sum + p.value, 0) / windowData.length;
            trendData.push({ x: dataPoints[i].x, y: yScale(average) });
        }
    } else if (config.trendLineType === "polynomial") {
        const n = dataPoints.length;

        if (n >= 3) {
            const curvature = config.trendLineDegree / 10;

            for (let i = 0; i < n; i++) {
                const point = dataPoints[i];
                let adjustedY = point.value;

                if (n > 2) {
                    const t = i / (n - 1);
                    const mid = 0.5;

                    const distFromMid = Math.abs(t - mid);
                    const curveFactor = Math.sin(t * Math.PI) * curvature;

                    const avgValue = dataPoints.reduce((sum, p) => sum + p.value, 0) / n;
                    adjustedY = point.value + (point.value - avgValue) * curveFactor * 0.5;
                }

                trendData.push({ x: point.x, y: yScale(adjustedY) });
            }
        } else {
            dataPoints.forEach(point => {
                trendData.push({ x: point.x, y: point.y });
            });
        }
    } else {
        dataPoints.forEach(point => {
            trendData.push({ x: point.x, y: point.y });
        });
    }

    const line = d3.line<{ x: number; y: number }>()
        .x(d => d.x)
        .y(d => d.y)
        .curve(config.trendLineType === "polynomial" ? d3.curveCardinal :
               config.trendLineType === "moving-average" ? d3.curveMonotoneX :
               d3.curveLinear);

    const trendLine = trendGroupUpdate.selectAll(".trend-line").data([trendData]);

    const trendLineEnter = trendLine.enter()
        .append("path")
        .attr("class", "trend-line")
        .attr("fill", "none")
        .attr("stroke", config.trendLineColor)
        .attr("stroke-width", config.trendLineWidth)
        .attr("stroke-opacity", config.trendLineOpacity)
        .style("opacity", 0);

    function applyStrokeStyle(selection: any) {
        if (config.trendLineStyle === "dashed") {
            selection.attr("stroke-dasharray", "5,5");
        } else if (config.trendLineStyle === "dotted") {
            selection.attr("stroke-dasharray", "2,3");
        } else {
            selection.attr("stroke-dasharray", null);
        }
    }

    applyStrokeStyle(trendLineEnter);

    const updatedTrendLine = trendLineEnter.merge(trendLine);
    applyStrokeStyle(updatedTrendLine);

    updatedTrendLine
        .transition()
        .duration(config.duration)
        .ease(config.ease)
        .attr("d", line)
        .attr("stroke", config.trendLineColor)
        .attr("stroke-width", config.trendLineWidth)
        .attr("stroke-opacity", config.trendLineOpacity)
        .style("opacity", 1);

    trendLine.exit()
        .transition()
        .duration(config.duration)
        .ease(config.ease)
        .style("opacity", 0)
        .remove();
}

export function drawConfidenceBands(container: any, processedData: ProcessedData[], xScale: any, yScale: any, config: ChartConfig): void {
    if (!config.confidenceBandConfig.enabled || !config.confidenceBandConfig.scenarios) return;

    const confidenceGroup = container.selectAll(".confidence-bands-group").data([0]);
    const confidenceGroupEnter = confidenceGroup.enter()
        .append("g")
        .attr("class", "confidence-bands-group");

    const confidenceGroupUpdate = confidenceGroupEnter.merge(confidenceGroup);

    const confidenceBandData = createWaterfallConfidenceBands(
        processedData.map(d => ({ label: d.label, value: d.barTotal })),
        config.confidenceBandConfig.scenarios,
        xScale,
        yScale
    );

    const confidencePath = confidenceGroupUpdate.selectAll(".confidence-band").data([confidenceBandData.confidencePath]);

    const confidencePathEnter = confidencePath.enter()
        .append("path")
        .attr("class", "confidence-band")
        .attr("fill", `rgba(52, 152, 219, ${config.confidenceBandConfig.opacity || 0.3})`)
        .attr("stroke", "none")
        .style("opacity", 0);

    confidencePathEnter.merge(confidencePath)
        .transition()
        .duration(config.duration)
        .ease(config.ease)
        .attr("d", confidenceBandData.confidencePath)
        .style("opacity", 1);

    if (config.confidenceBandConfig.showTrendLines) {
        const optimisticPath = confidenceGroupUpdate.selectAll(".optimistic-trend").data([confidenceBandData.optimisticPath]);

        const optimisticPathEnter = optimisticPath.enter()
            .append("path")
            .attr("class", "optimistic-trend")
            .attr("fill", "none")
            .attr("stroke", "#27ae60")
            .attr("stroke-width", 2)
            .attr("stroke-dasharray", "5,5")
            .style("opacity", 0);

        optimisticPathEnter.merge(optimisticPath)
            .transition()
            .duration(config.duration)
            .ease(config.ease)
            .attr("d", confidenceBandData.optimisticPath)
            .style("opacity", 0.8);

        const pessimisticPath = confidenceGroupUpdate.selectAll(".pessimistic-trend").data([confidenceBandData.pessimisticPath]);

        const pessimisticPathEnter = pessimisticPath.enter()
            .append("path")
            .attr("class", "pessimistic-trend")
            .attr("fill", "none")
            .attr("stroke", "#e74c3c")
            .attr("stroke-width", 2)
            .attr("stroke-dasharray", "5,5")
            .style("opacity", 0);

        pessimisticPathEnter.merge(pessimisticPath)
            .transition()
            .duration(config.duration)
            .ease(config.ease)
            .attr("d", confidenceBandData.pessimisticPath)
            .style("opacity", 0.8);
    }

    confidencePath.exit()
        .transition()
        .duration(config.duration)
        .style("opacity", 0)
        .remove();
}

export function drawMilestones(container: any, processedData: ProcessedData[], xScale: any, yScale: any, config: ChartConfig): void {
    if (!config.milestoneConfig.enabled || config.milestoneConfig.milestones.length === 0) return;

    const milestonesGroup = container.selectAll(".milestones-group").data([0]);
    const milestonesGroupEnter = milestonesGroup.enter()
        .append("g")
        .attr("class", "milestones-group");

    const milestonesGroupUpdate = milestonesGroupEnter.merge(milestonesGroup);

    const milestoneMarkers = createWaterfallMilestones(
        config.milestoneConfig.milestones,
        xScale,
        yScale
    );

    const markers = milestonesGroupUpdate.selectAll(".milestone-marker").data(milestoneMarkers);

    const markersEnter = markers.enter()
        .append("path")
        .attr("class", "milestone-marker")
        .attr("transform", (d: any) => d.transform)
        .attr("d", (d: any) => d.path)
        .attr("fill", (d: any) => d.config.fillColor || "#f39c12")
        .attr("stroke", (d: any) => d.config.strokeColor || "#ffffff")
        .attr("stroke-width", (d: any) => d.config.strokeWidth || 2)
        .style("opacity", 0);

    markersEnter.merge(markers)
        .transition()
        .duration(config.duration)
        .ease(config.ease)
        .attr("transform", (d: any) => d.transform)
        .attr("d", (d: any) => d.path)
        .attr("fill", (d: any) => d.config.fillColor || "#f39c12")
        .style("opacity", 1);

    markers.exit()
        .transition()
        .duration(config.duration)
        .style("opacity", 0)
        .remove();
}
