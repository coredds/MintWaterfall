// Tests for MintWaterfall Hierarchical Layout System
// Tests d3.hierarchy, d3.treemap, d3.partition, d3.pack, d3.cluster, d3.tree implementations

import { 
    createHierarchicalLayout, 
    createHierarchy, 
    createHierarchyFromFlatData,
    extractLayoutData,
    convertToWaterfallFormat,
    hierarchyLayouts
} from "../mintwaterfall-layouts.js";

// Mock D3 for testing environment
global.d3 = {
    hierarchy: jest.fn().mockImplementation((data) => {
        // Simple mock hierarchy implementation
        const root = { 
            data, 
            sum: jest.fn().mockReturnThis(),
            sort: jest.fn().mockReturnThis(),
            each: jest.fn().mockImplementation((callback) => {
                callback({ data, depth: 0, height: 2, parent: null, value: 100, x0: 0, y0: 0, x1: 100, y1: 100 });
                callback({ data: { name: "child1" }, depth: 1, height: 1, parent: { data }, value: 60, x0: 0, y0: 0, x1: 60, y1: 100 });
                callback({ data: { name: "child2" }, depth: 1, height: 1, parent: { data }, value: 40, x0: 60, y0: 0, x1: 100, y1: 100 });
            }),
            descendants: jest.fn().mockReturnValue([
                { data, depth: 0, height: 2, parent: null, value: 100, x0: 0, y0: 0, x1: 100, y1: 100 },
                { data: { name: "child1" }, depth: 1, height: 1, parent: { data }, value: 60, x0: 0, y0: 0, x1: 60, y1: 100 },
                { data: { name: "child2" }, depth: 1, height: 1, parent: { data }, value: 40, x0: 60, y0: 0, x1: 100, y1: 100 }
            ])
        };
        return root;
    }),
    treemap: jest.fn().mockImplementation(() => {
        const mockLayout = jest.fn().mockImplementation((root) => {
            // Mock treemap layout result
            root.descendants = jest.fn().mockReturnValue([
                { data: root.data, depth: 0, value: 100, x0: 0, y0: 0, x1: 100, y1: 100 },
                { data: { name: "child1" }, depth: 1, value: 60, x0: 0, y0: 0, x1: 60, y1: 100 },
                { data: { name: "child2" }, depth: 1, value: 40, x0: 60, y0: 0, x1: 100, y1: 100 }
            ]);
            return root;
        });
        // Add chainable methods
        mockLayout.size = jest.fn().mockReturnValue(mockLayout);
        mockLayout.round = jest.fn().mockReturnValue(mockLayout);
        mockLayout.padding = jest.fn().mockReturnValue(mockLayout);
        mockLayout.paddingInner = jest.fn().mockReturnValue(mockLayout);
        mockLayout.paddingOuter = jest.fn().mockReturnValue(mockLayout);
        mockLayout.paddingTop = jest.fn().mockReturnValue(mockLayout);
        mockLayout.paddingRight = jest.fn().mockReturnValue(mockLayout);
        mockLayout.paddingBottom = jest.fn().mockReturnValue(mockLayout);
        mockLayout.paddingLeft = jest.fn().mockReturnValue(mockLayout);
        return mockLayout;
    }),
    partition: jest.fn().mockImplementation(() => {
        const mockLayout = jest.fn().mockImplementation((root) => {
            // Mock partition layout result
            root.descendants = jest.fn().mockReturnValue([
                { data: root.data, depth: 0, value: 100, x0: 0, y0: 0, x1: 100, y1: 50 },
                { data: { name: "child1" }, depth: 1, value: 60, x0: 0, y0: 50, x1: 60, y1: 100 },
                { data: { name: "child2" }, depth: 1, value: 40, x0: 60, y0: 50, x1: 100, y1: 100 }
            ]);
            return root;
        });
        // Add chainable methods
        mockLayout.size = jest.fn().mockReturnValue(mockLayout);
        mockLayout.round = jest.fn().mockReturnValue(mockLayout);
        mockLayout.padding = jest.fn().mockReturnValue(mockLayout);
        return mockLayout;
    }),
    pack: jest.fn().mockImplementation(() => {
        const mockLayout = jest.fn().mockImplementation((root) => {
            // Mock pack layout result
            root.descendants = jest.fn().mockReturnValue([
                { data: root.data, depth: 0, value: 100, x: 50, y: 50, r: 50 },
                { data: { name: "child1" }, depth: 1, value: 60, x: 30, y: 30, r: 20 },
                { data: { name: "child2" }, depth: 1, value: 40, x: 70, y: 70, r: 15 }
            ]);
            return root;
        });
        // Add chainable methods
        mockLayout.size = jest.fn().mockReturnValue(mockLayout);
        mockLayout.padding = jest.fn().mockReturnValue(mockLayout);
        return mockLayout;
    }),
    cluster: jest.fn().mockImplementation(() => {
        const mockLayout = jest.fn().mockImplementation((root) => {
            // Mock cluster layout result
            root.descendants = jest.fn().mockReturnValue([
                { data: root.data, depth: 0, value: 100, x: 50, y: 0 },
                { data: { name: "child1" }, depth: 1, value: 60, x: 25, y: 50 },
                { data: { name: "child2" }, depth: 1, value: 40, x: 75, y: 50 }
            ]);
            root.links = jest.fn().mockReturnValue([
                { source: { x: 50, y: 0 }, target: { x: 25, y: 50 } },
                { source: { x: 50, y: 0 }, target: { x: 75, y: 50 } }
            ]);
            return root;
        });
        // Add chainable methods
        mockLayout.size = jest.fn().mockReturnValue(mockLayout);
        mockLayout.nodeSize = jest.fn().mockReturnValue(mockLayout);
        mockLayout.separation = jest.fn().mockReturnValue(mockLayout);
        return mockLayout;
    }),
    tree: jest.fn().mockImplementation(() => {
        const mockLayout = jest.fn().mockImplementation((root) => {
            // Mock tree layout result
            root.descendants = jest.fn().mockReturnValue([
                { data: root.data, depth: 0, value: 100, x: 50, y: 0 },
                { data: { name: "child1" }, depth: 1, value: 60, x: 25, y: 50 },
                { data: { name: "child2" }, depth: 1, value: 40, x: 75, y: 50 }
            ]);
            root.links = jest.fn().mockReturnValue([
                { source: { x: 50, y: 0 }, target: { x: 25, y: 50 } },
                { source: { x: 50, y: 0 }, target: { x: 75, y: 50 } }
            ]);
            return root;
        });
        // Add chainable methods
        mockLayout.size = jest.fn().mockReturnValue(mockLayout);
        mockLayout.nodeSize = jest.fn().mockReturnValue(mockLayout);
        mockLayout.separation = jest.fn().mockReturnValue(mockLayout);
        return mockLayout;
    }),
    scaleOrdinal: jest.fn().mockReturnValue(() => "#ff0000")
};



describe("MintWaterfall Hierarchical Layout System", () => {
    
    const sampleHierarchicalData = {
        name: "Revenue",
        value: 1000,
        children: [
            {
                name: "Sales",
                value: 600,
                children: [
                    { name: "Online", value: 350 },
                    { name: "Retail", value: 250 }
                ]
            },
            {
                name: "Services",
                value: 400,
                children: [
                    { name: "Consulting", value: 200 },
                    { name: "Support", value: 200 }
                ]
            }
        ]
    };

    const sampleFlatData = [
        { id: "1", parentId: null, name: "Revenue", value: 1000 },
        { id: "2", parentId: "1", name: "Sales", value: 600 },
        { id: "3", parentId: "1", name: "Services", value: 400 },
        { id: "4", parentId: "2", name: "Online", value: 350 },
        { id: "5", parentId: "2", name: "Retail", value: 250 },
        { id: "6", parentId: "3", name: "Consulting", value: 200 },
        { id: "7", parentId: "3", name: "Support", value: 200 }
    ];

    describe("createHierarchicalLayout", () => {
        
        test("should create a layout system with default settings", () => {
            const layout = createHierarchicalLayout();
            
            expect(typeof layout).toBe("function");
            expect(layout.size()).toEqual([800, 400]);
            expect(layout.type()).toBe("treemap");
            expect(layout.padding()).toBe(0);
        });

        test("should allow method chaining for configuration", () => {
            const layout = createHierarchicalLayout()
                .size([1000, 600])
                .padding(5)
                .type("partition");
            
            expect(layout.size()).toEqual([1000, 600]);
            expect(layout.padding()).toBe(5);
            expect(layout.type()).toBe("partition");
        });

        test("should support all layout types", () => {
            const layoutTypes = ["treemap", "partition", "pack", "cluster", "tree"];
            
            layoutTypes.forEach(type => {
                const layout = createHierarchicalLayout().type(type);
                expect(layout.type()).toBe(type);
                
                // Test that layout can be applied
                const hierarchy = d3.hierarchy(sampleHierarchicalData);
                const result = layout(hierarchy);
                expect(result).toBeDefined();
            });
        });

        test("should handle treemap layout", () => {
            const layout = createHierarchicalLayout().type("treemap");
            const hierarchy = d3.hierarchy(sampleHierarchicalData);
            const result = layout(hierarchy);
            
            expect(result).toBeDefined();
            expect(d3.treemap).toHaveBeenCalled();
        });

        test("should handle partition layout", () => {
            const layout = createHierarchicalLayout()
                .type("partition")
                .partitionOrientation("vertical");
            
            const hierarchy = d3.hierarchy(sampleHierarchicalData);
            const result = layout(hierarchy);
            
            expect(result).toBeDefined();
            expect(d3.partition).toHaveBeenCalled();
        });

        test("should handle pack layout", () => {
            const layout = createHierarchicalLayout().type("pack");
            const hierarchy = d3.hierarchy(sampleHierarchicalData);
            const result = layout(hierarchy);
            
            expect(result).toBeDefined();
            expect(d3.pack).toHaveBeenCalled();
        });

        test("should handle cluster layout", () => {
            const layout = createHierarchicalLayout().type("cluster");
            const hierarchy = d3.hierarchy(sampleHierarchicalData);
            const result = layout(hierarchy);
            
            expect(result).toBeDefined();
            expect(d3.cluster).toHaveBeenCalled();
        });

        test("should handle tree layout", () => {
            const layout = createHierarchicalLayout().type("tree");
            const hierarchy = d3.hierarchy(sampleHierarchicalData);
            const result = layout(hierarchy);
            
            expect(result).toBeDefined();
            expect(d3.tree).toHaveBeenCalled();
        });

        test("should fall back to treemap for unknown layout type", () => {
            const layout = createHierarchicalLayout().type("unknown");
            const hierarchy = d3.hierarchy(sampleHierarchicalData);
            const result = layout(hierarchy);
            
            expect(result).toBeDefined();
            expect(d3.treemap).toHaveBeenCalled();
        });
    });

    describe("createHierarchy", () => {
        
        test("should create hierarchy from hierarchical data", () => {
            const hierarchy = createHierarchy(sampleHierarchicalData);
            
            expect(hierarchy).toBeDefined();
            expect(d3.hierarchy).toHaveBeenCalledWith(sampleHierarchicalData);
        });

        test("should create hierarchy from flat data with accessors", () => {
            const options = {
                idAccessor: (d) => d.id,
                parentAccessor: (d) => d.parentId,
                valueAccessor: (d) => d.value
            };
            
            const hierarchy = createHierarchy(sampleFlatData, options);
            
            expect(hierarchy).toBeDefined();
            expect(d3.hierarchy).toHaveBeenCalled();
        });

        test("should apply value accessor and sorting", () => {
            const options = {
                valueAccessor: (d) => d.value,
                sort: (a, b) => b.value - a.value
            };
            
            const hierarchy = createHierarchy(sampleHierarchicalData, options);
            
            expect(hierarchy).toBeDefined();
            expect(hierarchy.sum).toHaveBeenCalled();
            expect(hierarchy.sort).toHaveBeenCalledWith(options.sort);
        });

        test("should handle missing data gracefully", () => {
            const hierarchy = createHierarchy(null);
            
            expect(hierarchy).toBeNull();
        });
    });

    describe("createHierarchyFromFlatData", () => {
        
        test("should convert flat data to hierarchical structure", () => {
            const idAccessor = (d) => d.id;
            const parentAccessor = (d) => d.parentId;
            const valueAccessor = (d) => d.value;
            
            const result = createHierarchyFromFlatData(
                sampleFlatData, 
                idAccessor, 
                parentAccessor, 
                valueAccessor
            );
            
            expect(result).toBeDefined();
            expect(result.id).toBe("root");
            expect(result.children).toBeDefined();
            expect(Array.isArray(result.children)).toBe(true);
        });

        test("should handle empty data gracefully", () => {
            const idAccessor = (d) => d.id;
            const parentAccessor = (d) => d.parentId;
            
            const result = createHierarchyFromFlatData([], idAccessor, parentAccessor);
            
            expect(result).toBeNull();
        });

        test("should handle null data gracefully", () => {
            const idAccessor = (d) => d.id;
            const parentAccessor = (d) => d.parentId;
            
            const result = createHierarchyFromFlatData(null, idAccessor, parentAccessor);
            
            expect(result).toBeNull();
        });
    });

    describe("extractLayoutData", () => {
        
        test("should extract data from layout result", () => {
            const layout = createHierarchicalLayout().type("treemap");
            const hierarchy = d3.hierarchy(sampleHierarchicalData);
            const layoutData = layout(hierarchy);
            
            const extracted = extractLayoutData(layoutData, { includeRoot: true });
            
            expect(Array.isArray(extracted)).toBe(true);
            expect(extracted.length).toBeGreaterThan(0);
        });

        test("should filter by depth", () => {
            const layout = createHierarchicalLayout().type("treemap");
            const hierarchy = d3.hierarchy(sampleHierarchicalData);
            const layoutData = layout(hierarchy);
            
            const extracted = extractLayoutData(layoutData, { maxDepth: 1 });
            
            expect(Array.isArray(extracted)).toBe(true);
        });

        test("should handle missing layout data gracefully", () => {
            const extracted = extractLayoutData(null);
            
            expect(Array.isArray(extracted)).toBe(true);
            expect(extracted.length).toBe(0);
        });
    });

    describe("convertToWaterfallFormat", () => {
        
        test("should convert layout data to waterfall format", () => {
            const layout = createHierarchicalLayout().type("treemap");
            const hierarchy = d3.hierarchy(sampleHierarchicalData);
            const layoutData = layout(hierarchy);
            
            const waterfallData = convertToWaterfallFormat(layoutData);
            
            expect(Array.isArray(waterfallData)).toBe(true);
            expect(waterfallData.length).toBeGreaterThan(0);
            
            if (waterfallData.length > 0) {
                const item = waterfallData[0];
                expect(item).toHaveProperty("label");
                expect(item).toHaveProperty("stacks");
                expect(item).toHaveProperty("hierarchyData");
                expect(Array.isArray(item.stacks)).toBe(true);
            }
        });

        test("should handle missing layout data gracefully", () => {
            const waterfallData = convertToWaterfallFormat(null);
            
            expect(Array.isArray(waterfallData)).toBe(true);
            expect(waterfallData.length).toBe(0);
        });
    });

    describe("hierarchyLayouts helpers", () => {
        
        test("should provide treemap helper", () => {
            const result = hierarchyLayouts.treemap(sampleHierarchicalData, { 
                size: [800, 600], 
                padding: 2 
            });
            
            expect(result).toBeDefined();
            expect(d3.treemap).toHaveBeenCalled();
        });

        test("should provide partition helper", () => {
            const result = hierarchyLayouts.partition(sampleHierarchicalData, { 
                size: [800, 600], 
                orientation: "vertical" 
            });
            
            expect(result).toBeDefined();
            expect(d3.partition).toHaveBeenCalled();
        });

        test("should provide pack helper", () => {
            const result = hierarchyLayouts.pack(sampleHierarchicalData, { 
                size: [800, 600], 
                padding: 10 
            });
            
            expect(result).toBeDefined();
            expect(d3.pack).toHaveBeenCalled();
        });
    });

    describe("Integration Tests", () => {
        
        test("should handle complete workflow from flat data to waterfall format", () => {
            // Step 1: Convert flat data to hierarchy
            const hierarchy = createHierarchy(sampleFlatData, {
                idAccessor: (d) => d.id,
                parentAccessor: (d) => d.parentId,
                valueAccessor: (d) => d.value
            });
            
            // Step 2: Apply layout
            const layout = createHierarchicalLayout()
                .type("treemap")
                .size([1000, 800])
                .padding(5);
            
            const layoutData = layout(hierarchy);
            
            // Step 3: Extract and convert to waterfall format
            const waterfallData = convertToWaterfallFormat(layoutData, {
                includeInternal: true,
                maxDepth: 2
            });
            
            expect(hierarchy).toBeDefined();
            expect(layoutData).toBeDefined();
            expect(Array.isArray(waterfallData)).toBe(true);
        });

        test("should handle error scenarios gracefully", () => {
            // Test with null inputs at each stage
            expect(() => createHierarchy(null)).not.toThrow();
            expect(() => extractLayoutData(null)).not.toThrow();
            expect(() => convertToWaterfallFormat(null)).not.toThrow();
        });

        test("should support advanced layout configuration", () => {
            const layout = createHierarchicalLayout()
                .type("partition")
                .size([1200, 800])
                .padding(10)
                .round(true)
                .partitionOrientation("vertical");
            
            expect(layout.size()).toEqual([1200, 800]);
            expect(layout.padding()).toBe(10);
            expect(layout.round()).toBe(true);
            expect(layout.partitionOrientation()).toBe("vertical");
        });
    });
});
