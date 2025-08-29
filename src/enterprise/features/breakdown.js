// Breakdown Feature - Hierarchical data drill-down with grouping
// Enables users to break down waterfall segments into sub-components

import { EnterpriseFeatureTemplate } from "../enterprise-feature-template.js";

export class BreakdownFeature extends EnterpriseFeatureTemplate {
    constructor(config = {}) {
        const defaultConfig = {
            enabled: false,
            maxBreakdowns: 5,
            showOthers: true,
            otherLabel: "Others",
            otherColor: "#95a5a6",
            animation: {
                enabled: true,
                duration: 500,
                stagger: 50
            },
            grouping: {
                strategy: "value", // 'value', 'alphabetical', 'custom'
                direction: "desc"   // 'asc', 'desc'
            },
            interaction: {
                clickToExpand: true,
                doubleClickToCollapse: true,
                keyboardNavigation: true
            },
            visual: {
                indentSize: 20,
                connectorLine: true,
                connectorColor: "#bdc3c7",
                highlightParent: true
            }
        };
        
        super("breakdown", "Hierarchical data breakdown with drill-down capability", defaultConfig);
        
        // Apply the config passed to constructor
        this.configure(config);
        
        // Internal state
        this.expandedItems = new Set();
        this.breakdownData = new Map();
        this.parentMap = new Map();
        this.levelMap = new Map();
        this.maxLevel = 0;
        
        // D3 selections for management
        this.breakdownGroup = null;
        this.connectorGroup = null;
        
        // Add data processor for breakdown data
        this.addDataProcessor(this.processBreakdownData.bind(this));
    }
    
    getConfigSchema() {
        return {
            enabled: { type: "boolean", required: true },
            maxBreakdowns: { type: "number", min: 1, max: 20 },
            showOthers: { type: "boolean" },
            otherLabel: { type: "string" },
            otherColor: { type: "string" },
            animation: { type: "object" },
            grouping: { type: "object" },
            interaction: { type: "object" },
            visual: { type: "object" }
        };
    }
    
    onInit() {
        if (!this.enabled) return;
        
        // Create breakdown-specific groups
        this.breakdownGroup = this.createGroup("breakdown-feature");
        this.connectorGroup = this.createGroup("breakdown-connectors");
        
        // Set up event listeners
        if (this.config.interaction.clickToExpand) {
            this.on("barClick", this.handleBarClick.bind(this));
        }
        
        if (this.config.interaction.doubleClickToCollapse) {
            this.on("barDoubleClick", this.handleBarDoubleClick.bind(this));
        }
        
        if (this.config.interaction.keyboardNavigation) {
            this.setupKeyboardNavigation();
        }
        
        console.log("BreakdownFeature: Initialized with config", this.config);
    }
    
    processBreakdownData(data) {
        if (!this.enabled) return data;  // Use this.enabled instead of config.enabled
        
        const timer = this.startPerformanceTimer("processBreakdownData");
        
        // Reset internal state
        this.breakdownData.clear();
        this.parentMap.clear();
        this.levelMap.clear();
        this.maxLevel = 0;
        
        // Process each data item for breakdown capability
        const processedData = data.map((item) => {
            const processed = { ...item };
            
            // Add breakdown metadata
            processed._breakdownId = this.generateId("breakdown");
            processed._level = 0;
            processed._hasBreakdown = !!(item.breakdown && Array.isArray(item.breakdown));
            processed._isExpanded = false;
            processed._parent = null;
            
            // Store breakdown data if available
            if (processed._hasBreakdown) {
                this.breakdownData.set(processed._breakdownId, this.processBreakdownHierarchy(item.breakdown, processed._breakdownId, 1));
            }
            
            // Set level in map
            this.levelMap.set(processed._breakdownId, 0);
            
            return processed;
        });
        
        this.endPerformanceTimer(timer);
        return processedData;
    }
    
    processBreakdownHierarchy(breakdown, parentId, level) {
        const processed = breakdown.map((item) => {
            const breakdownItem = {
                ...item,
                _breakdownId: this.generateId(`breakdown-l${level}`),
                _level: level,
                _parent: parentId,
                _hasBreakdown: !!(item.breakdown && Array.isArray(item.breakdown)),
                _isExpanded: false,
                _isOther: false
            };
            
            // Store parent relationship
            this.parentMap.set(breakdownItem._breakdownId, parentId);
            this.levelMap.set(breakdownItem._breakdownId, level);
            
            // Track max level
            this.maxLevel = Math.max(this.maxLevel, level);
            
            // Process nested breakdowns
            if (breakdownItem._hasBreakdown) {
                this.breakdownData.set(breakdownItem._breakdownId, 
                    this.processBreakdownHierarchy(item.breakdown, breakdownItem._breakdownId, level + 1));
            }
            
            return breakdownItem;
        });
        
        // Apply grouping and "Others" consolidation
        return this.applyGroupingStrategy(processed);
    }
    
    applyGroupingStrategy(items) {
        if (!items || items.length === 0) return items;
        
        // Sort items based on grouping strategy
        let sortedItems = [...items];
        const strategy = this.config.grouping.strategy;
        const direction = this.config.grouping.direction;
        
        if (strategy === "value") {
            sortedItems.sort((a, b) => {
                const aValue = this.getItemValue(a);
                const bValue = this.getItemValue(b);
                return direction === "desc" ? bValue - aValue : aValue - bValue;
            });
        } else if (strategy === "alphabetical") {
            sortedItems.sort((a, b) => {
                const aLabel = (a.label || "").toString();
                const bLabel = (b.label || "").toString();
                const result = aLabel.localeCompare(bLabel);
                return direction === "desc" ? -result : result;
            });
        }
        
        // Apply "Others" consolidation if needed
        if (this.config.showOthers && sortedItems.length > this.config.maxBreakdowns) {
            const mainItems = sortedItems.slice(0, this.config.maxBreakdowns - 1);
            const otherItems = sortedItems.slice(this.config.maxBreakdowns - 1);
            
            // Create "Others" group
            const othersValue = otherItems.reduce((sum, item) => sum + this.getItemValue(item), 0);
            const othersItem = {
                label: this.config.otherLabel,
                stacks: [{
                    value: othersValue,
                    color: this.config.otherColor
                }],
                _breakdownId: this.generateId("others"),
                _level: otherItems[0]._level,
                _parent: otherItems[0]._parent,
                _hasBreakdown: false,
                _isExpanded: false,
                _isOther: true,
                _otherItems: otherItems
            };
            
            return [...mainItems, othersItem];
        }
        
        return sortedItems;
    }
    
    getItemValue(item) {
        if (item.stacks && Array.isArray(item.stacks)) {
            return item.stacks.reduce((sum, stack) => sum + (stack.value || 0), 0);
        }
        return item.value || 0;
    }
    
    expandItem(itemId) {
        if (!this.breakdownData.has(itemId)) return false;
        
        this.expandedItems.add(itemId);
        this.emit("itemExpanded", itemId);
        
        // Update data and re-render
        this.updateExpandedData();
        return true;
    }
    
    collapseItem(itemId) {
        if (!this.expandedItems.has(itemId)) return false;
        
        this.expandedItems.delete(itemId);
        this.emit("itemCollapsed", itemId);
        
        // Collapse all children recursively
        this.collapseChildren(itemId);
        
        // Update data and re-render
        this.updateExpandedData();
        return true;
    }
    
    collapseChildren(parentId) {
        const children = this.getChildren(parentId);
        children.forEach(child => {
            if (this.expandedItems.has(child._breakdownId)) {
                this.expandedItems.delete(child._breakdownId);
                this.collapseChildren(child._breakdownId);
            }
        });
    }
    
    getChildren(parentId) {
        return this.breakdownData.get(parentId) || [];
    }
    
    updateExpandedData() {
        if (!this.data) return;
        
        // Build flattened data including expanded items
        const flattenedData = [];
        
        this.data.forEach(item => {
            flattenedData.push(item);
            if (item._hasBreakdown && this.expandedItems.has(item._breakdownId)) {
                this.addExpandedChildren(item._breakdownId, flattenedData);
            }
        });
        
        // Update chart data
        this.emit("dataChanged", flattenedData);
    }
    
    addExpandedChildren(parentId, flattenedData) {
        const children = this.getChildren(parentId);
        children.forEach(child => {
            // Add visual indentation based on level
            const childWithIndent = {
                ...child,
                _visualIndent: child._level * this.config.visual.indentSize
            };
            
            flattenedData.push(childWithIndent);
            
            if (child._hasBreakdown && this.expandedItems.has(child._breakdownId)) {
                this.addExpandedChildren(child._breakdownId, flattenedData);
            }
        });
    }
    
    handleBarClick(event, data) {
        if (!this.config.interaction.clickToExpand) return;
        
        const itemId = data._breakdownId;
        if (!itemId || !data._hasBreakdown) return;
        
        if (this.expandedItems.has(itemId)) {
            this.collapseItem(itemId);
        } else {
            this.expandItem(itemId);
        }
        
        // Prevent event bubbling
        event.stopPropagation();
    }
    
    handleBarDoubleClick(event, data) {
        if (!this.config.interaction.doubleClickToCollapse) return;
        
        const itemId = data._breakdownId;
        if (!itemId) return;
        
        // Find root parent and collapse entire tree
        let rootId = itemId;
        while (this.parentMap.has(rootId)) {
            rootId = this.parentMap.get(rootId);
        }
        
        this.collapseItem(rootId);
        
        // Prevent event bubbling
        event.stopPropagation();
    }
    
    setupKeyboardNavigation() {
        // Add keyboard event listeners for accessibility
        if (this.svg) {
            this.svg.attr("tabindex", 0)
                .on("keydown", (event) => {
                    switch (event.key) {
                        case "Enter":
                        case " ":
                            // Expand/collapse focused item
                            const focusedElement = document.activeElement;
                            if (focusedElement && focusedElement.__data__) {
                                this.handleBarClick(event, focusedElement.__data__);
                            }
                            break;
                        case "Escape":
                            // Collapse all
                            this.collapseAll();
                            break;
                        case "ArrowLeft":
                            // Collapse current item or go to parent
                            this.navigateLeft(event);
                            break;
                        case "ArrowRight":
                            // Expand current item or go to first child
                            this.navigateRight(event);
                            break;
                    }
                });
        }
    }
    
    navigateLeft() {
        const focusedElement = document.activeElement;
        if (focusedElement && focusedElement.__data__) {
            const data = focusedElement.__data__;
            const itemId = data._breakdownId;
            
            if (this.expandedItems.has(itemId)) {
                this.collapseItem(itemId);
            } else if (data._parent) {
                // Focus parent
                this.focusItem(data._parent);
            }
        }
    }
    
    navigateRight() {
        const focusedElement = document.activeElement;
        if (focusedElement && focusedElement.__data__) {
            const data = focusedElement.__data__;
            const itemId = data._breakdownId;
            
            if (data._hasBreakdown && !this.expandedItems.has(itemId)) {
                this.expandItem(itemId);
            } else if (this.expandedItems.has(itemId)) {
                // Focus first child
                const children = this.getChildren(itemId);
                if (children.length > 0) {
                    this.focusItem(children[0]._breakdownId);
                }
            }
        }
    }
    
    focusItem(itemId) {
        // Find and focus the element with the given item ID
        if (this.svg) {
            const element = this.svg.select(`[data-breakdown-id="${itemId}"]`);
            if (!element.empty()) {
                element.node().focus();
            }
        }
    }
    
    collapseAll() {
        this.expandedItems.clear();
        this.updateExpandedData();
        this.emit("allCollapsed");
    }
    
    expandAll() {
        // Expand all items with breakdowns
        this.data.forEach(item => {
            if (item._hasBreakdown) {
                this.expandedItems.add(item._breakdownId);
                this.expandAllChildren(item._breakdownId);
            }
        });
        
        this.updateExpandedData();
        this.emit("allExpanded");
    }
    
    expandAllChildren(parentId) {
        const children = this.getChildren(parentId);
        children.forEach(child => {
            if (child._hasBreakdown) {
                this.expandedItems.add(child._breakdownId);
                this.expandAllChildren(child._breakdownId);
            }
        });
    }
    
    onRender() {
        if (!this.enabled || !this.breakdownGroup) return;
        
        // Render breakdown indicators and connectors
        this.renderBreakdownIndicators();
        
        if (this.config.visual.connectorLine) {
            this.renderConnectorLines();
        }
    }
    
    renderBreakdownIndicators() {
        if (!this.data) return;
        
        // Add breakdown indicators to items that have breakdowns
        const indicators = this.breakdownGroup.selectAll(".breakdown-indicator")
            .data(this.data.filter(d => d._hasBreakdown));
        
        const indicatorEnter = indicators.enter()
            .append("g")
            .attr("class", "breakdown-indicator")
            .attr("data-breakdown-id", d => d._breakdownId);
        
        // Add expand/collapse icon
        indicatorEnter.append("text")
            .attr("class", "breakdown-icon")
            .attr("x", 0)
            .attr("y", 0)
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "central")
            .style("cursor", "pointer")
            .style("user-select", "none")
            .text(d => this.expandedItems.has(d._breakdownId) ? "−" : "+")
            .on("click", (event, d) => this.handleBarClick(event, d));
        
        // Update existing indicators
        indicators.select(".breakdown-icon")
            .text(d => this.expandedItems.has(d._breakdownId) ? "−" : "+");
        
        indicators.exit().remove();
        
        // Position indicators (this would be called from the main chart)
        this.positionBreakdownIndicators();
    }
    
    positionBreakdownIndicators() {
        // This method would be called by the main chart to position indicators
        // Implementation depends on the main chart's bar positioning logic
        if (this.breakdownGroup) {
            this.breakdownGroup.selectAll(".breakdown-indicator")
                .attr("transform", (d, i) => {
                    // Basic positioning - would be enhanced based on actual bar positions
                    const x = (d._visualIndent || 0) + 10;
                    const y = i * 40 + 20;
                    return `translate(${x}, ${y})`;
                });
        }
    }
    
    renderConnectorLines() {
        if (!this.connectorGroup || !this.data) return;
        
        // Create connector lines between parent and child items
        const connectors = [];
        
        this.data.forEach(item => {
            if (item._parent && this.expandedItems.has(this.parentMap.get(item._breakdownId))) {
                connectors.push({
                    source: item._parent,
                    target: item._breakdownId,
                    level: item._level
                });
            }
        });
        
        const lines = this.connectorGroup.selectAll(".breakdown-connector")
            .data(connectors);
        
        lines.enter()
            .append("line")
            .attr("class", "breakdown-connector")
            .style("stroke", this.config.visual.connectorColor)
            .style("stroke-width", 1)
            .style("stroke-dasharray", "2,2");
        
        lines.exit().remove();
        
        // Position connector lines (implementation would depend on bar positions)
        this.positionConnectorLines();
    }
    
    positionConnectorLines() {
        // Position connector lines based on bar positions
        // Implementation would be enhanced with actual bar positioning data
        if (this.connectorGroup) {
            this.connectorGroup.selectAll(".breakdown-connector")
                .attr("x1", d => (d.level - 1) * this.config.visual.indentSize)
                .attr("y1", 0)
                .attr("x2", d => d.level * this.config.visual.indentSize)
                .attr("y2", 0);
        }
    }
    
    // Public API methods (following D3.js getter/setter pattern)
    maxBreakdowns(_) {
        if (!arguments.length) return this.config.maxBreakdowns;
        this.configure({ maxBreakdowns: _ });
        return this;
    }
    
    showOthers(_) {
        if (!arguments.length) return this.config.showOthers;
        this.configure({ showOthers: _ });
        return this;
    }
    
    otherLabel(_) {
        if (!arguments.length) return this.config.otherLabel;
        this.configure({ otherLabel: _ });
        return this;
    }
    
    groupingStrategy(_) {
        if (!arguments.length) return this.config.grouping.strategy;
        this.configure({ grouping: { ...this.config.grouping, strategy: _ } });
        return this;
    }
    
    // Utility methods for external integration
    getExpandedItems() {
        return Array.from(this.expandedItems);
    }
    
    getBreakdownTree() {
        const tree = {};
        this.breakdownData.forEach((children, parentId) => {
            tree[parentId] = children;
        });
        return tree;
    }
    
    export() {
        return {
            config: this.config,
            expandedItems: Array.from(this.expandedItems),
            breakdownTree: this.getBreakdownTree()
        };
    }
    
    import(state) {
        if (state.config) {
            this.configure(state.config);
        }
        if (state.expandedItems) {
            this.expandedItems = new Set(state.expandedItems);
        }
        return this;
    }
}
