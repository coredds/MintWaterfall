// Advanced Interactions Tests - Zero Coverage Critical Component
// Tests drag behavior, force simulation, and enhanced hover detection
import { createAdvancedInteractionSystem } from "../dist/mintwaterfall.esm.js";

// Mock D3 dependencies
const mockD3 = {
  drag: jest.fn(() => ({
    on: jest.fn().mockReturnThis(),
  })),
  forceSimulation: jest.fn(() => ({
    nodes: jest.fn().mockReturnThis(),
    force: jest.fn().mockReturnThis(),
    on: jest.fn().mockReturnThis(),
    stop: jest.fn().mockReturnThis(),
    restart: jest.fn().mockReturnThis(),
  })),
  voronoi: jest.fn(() => ({
    extent: jest.fn().mockReturnThis(),
    polygons: jest.fn(() => []),
  })),
  select: jest.fn(() => ({
    selectAll: jest.fn().mockReturnThis(),
    append: jest.fn().mockReturnThis(),
    attr: jest.fn().mockReturnThis(),
    style: jest.fn().mockReturnThis(),
    on: jest.fn().mockReturnThis(),
    call: jest.fn().mockReturnThis(),
    raise: jest.fn().mockReturnThis(),
  })),
};

// Mock d3 globally
global.d3 = mockD3;

describe("Advanced Interactions System", () => {
  let interactionSystem;
  let mockContainer;
  let mockXScale;
  let mockYScale;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    mockContainer = {
      selectAll: jest.fn(() => mockContainer),
      append: jest.fn(() => mockContainer),
      attr: jest.fn(() => mockContainer),
      style: jest.fn(() => mockContainer),
      text: jest.fn(() => mockContainer),
      data: jest.fn(() => mockContainer),
      enter: jest.fn(() => mockContainer),
      exit: jest.fn(() => mockContainer),
      merge: jest.fn(() => mockContainer),
      remove: jest.fn(() => mockContainer),
      on: jest.fn(() => mockContainer),
      call: jest.fn(() => mockContainer),
      node: jest.fn(() => ({ getBoundingClientRect: () => ({ width: 800, height: 400 }) }))
    };

    mockXScale = jest.fn((value) => value * 10);
    mockXScale.domain = jest.fn(() => [0, 100]);
    mockXScale.range = jest.fn(() => [0, 800]);
    mockXScale.bandwidth = jest.fn(() => 50);

    mockYScale = jest.fn((value) => 400 - value * 4);
    mockYScale.domain = jest.fn(() => [0, 100]);
    mockYScale.range = jest.fn(() => [400, 0]);
    mockYScale.invert = jest.fn((pixel) => (400 - pixel) / 4);

    interactionSystem = createAdvancedInteractionSystem(mockContainer, mockXScale, mockYScale);
  });

  describe("System Creation", () => {
    test("should create interaction system with required methods", () => {
      expect(interactionSystem).toBeDefined();
      expect(typeof interactionSystem.enableDrag).toBe("function");
      expect(typeof interactionSystem.disableDrag).toBe("function");
      expect(typeof interactionSystem.enableEnhancedHover).toBe("function");
      expect(typeof interactionSystem.startForceSimulation).toBe("function");
      expect(typeof interactionSystem.setInteractionMode).toBe("function");
    });

    test("should initialize with no active interactions", () => {
      expect(interactionSystem.getActiveInteractions()).toEqual([]);
    });
  });

  describe("Drag Functionality", () => {
    test("should enable drag with basic configuration", () => {
      const dragConfig = {
        enabled: true,
        axis: "vertical",
        constraints: {
          minValue: -100,
          maxValue: 100
        }
      };

      expect(() => {
        interactionSystem.enableDrag(dragConfig);
      }).not.toThrow();

      // Check that drag is now active (the actual functionality we care about)
      expect(interactionSystem.getActiveInteractions()).toContain("drag");
    });

    test("should disable drag when enabled is false", () => {
      const dragConfig = { enabled: false };
      
      expect(() => {
        interactionSystem.enableDrag(dragConfig);
      }).not.toThrow();

      expect(interactionSystem.getActiveInteractions()).not.toContain("drag");
    });

    test("should handle drag constraints", () => {
      const dragConfig = {
        enabled: true,
        axis: "vertical",
        constraints: {
          minValue: 0,
          maxValue: 100,
          snapToGrid: true,
          gridSize: 10
        }
      };

      expect(() => {
        interactionSystem.enableDrag(dragConfig);
      }).not.toThrow();
    });

    test("should disable drag", () => {
      // First enable drag
      interactionSystem.enableDrag({ enabled: true, axis: "vertical" });
      expect(interactionSystem.getActiveInteractions()).toContain("drag");

      // Then disable it
      interactionSystem.disableDrag();
      expect(interactionSystem.getActiveInteractions()).not.toContain("drag");
    });

    test("should update drag constraints", () => {
      interactionSystem.enableDrag({ enabled: true, axis: "vertical" });

      const newConstraints = {
        minValue: -50,
        maxValue: 150,
        snapToGrid: true,
        gridSize: 5
      };

      expect(() => {
        interactionSystem.updateDragConstraints(newConstraints);
      }).not.toThrow();
    });
  });

  describe("Enhanced Hover Detection", () => {
    test("should enable enhanced hover", () => {
      // Provide data first
      interactionSystem.updateData([
        { label: "A", value: 100 },
        { label: "B", value: 200 }
      ]);

      const hoverConfig = {
        enabled: true,
        extent: [[0, 0], [800, 400]],
        onHover: jest.fn(),
        onHoverEnd: jest.fn()
      };

      expect(() => {
        interactionSystem.enableEnhancedHover(hoverConfig);
      }).not.toThrow();

      expect(interactionSystem.getActiveInteractions()).toContain("hover");
    });

    test("should disable enhanced hover", () => {
      // Provide data first
      interactionSystem.updateData([{ label: "A", value: 100 }]);
      
      // First enable hover
      interactionSystem.enableEnhancedHover({ enabled: true });
      expect(interactionSystem.getActiveInteractions()).toContain("hover");

      // Then disable it
      interactionSystem.disableEnhancedHover();
      expect(interactionSystem.getActiveInteractions()).not.toContain("hover");
    });

    test("should update hover extent", () => {
      interactionSystem.enableEnhancedHover({ enabled: true });

      const newExtent = [[0, 0], [1000, 600]];
      expect(() => {
        interactionSystem.updateHoverExtent(newExtent);
      }).not.toThrow();
    });
  });

  describe("Force Simulation", () => {
    test("should start force simulation", () => {
      // Provide data first
      interactionSystem.updateData([
        { label: "A", value: 100 },
        { label: "B", value: 200 }
      ]);

      const forceConfig = {
        enabled: true,
        forces: {
          charge: -300,
          link: { distance: 50 },
          center: { x: 400, y: 200 }
        },
        onTick: jest.fn(),
        onEnd: jest.fn()
      };

      interactionSystem.startForceSimulation(forceConfig);
      
      // Check that force simulation is now active
      expect(interactionSystem.getActiveInteractions()).toContain("force");
    });

    test("should stop force simulation", () => {
      // Provide data first
      interactionSystem.updateData([{ label: "A", value: 100 }]);
      
      // First start simulation
      interactionSystem.startForceSimulation({ enabled: true, forces: {} });
      expect(interactionSystem.getActiveInteractions()).toContain("force");

      // Then stop it
      interactionSystem.stopForceSimulation();
      expect(interactionSystem.getActiveInteractions()).not.toContain("force");
    });

    test("should update forces", () => {
      interactionSystem.startForceSimulation({ forces: {} });

      const newForces = {
        charge: -500,
        collide: { radius: 10 }
      };

      expect(() => {
        interactionSystem.updateForces(newForces);
      }).not.toThrow();
    });
  });

  describe("Interaction Mode Management", () => {
    test("should set drag mode", () => {
      interactionSystem.setInteractionMode("drag");
      expect(interactionSystem.getActiveInteractions()).toContain("drag");
    });

    test("should set combined mode", () => {
      // Provide data first
      interactionSystem.updateData([{ label: "A", value: 100 }]);
      
      interactionSystem.setInteractionMode("combined");
      const active = interactionSystem.getActiveInteractions();
      expect(active.length).toBeGreaterThan(1);
    });

    test("should set none mode", () => {
      // First set some interactions
      interactionSystem.setInteractionMode("combined");
      expect(interactionSystem.getActiveInteractions().length).toBeGreaterThan(0);

      // Then disable all
      interactionSystem.setInteractionMode("none");
      expect(interactionSystem.getActiveInteractions()).toEqual([]);
    });

    test("should handle invalid mode gracefully", () => {
      expect(() => {
        interactionSystem.setInteractionMode("invalid");
      }).not.toThrow();
    });
  });

  describe("Event Management", () => {
    test("should register event listeners", () => {
      const callback = jest.fn();
      
      expect(() => {
        interactionSystem.on("drag", callback);
      }).not.toThrow();
    });

    test("should remove event listeners", () => {
      const callback = jest.fn();
      interactionSystem.on("drag", callback);
      
      expect(() => {
        interactionSystem.off("drag");
      }).not.toThrow();
    });

    test("should trigger events", () => {
      const callback = jest.fn();
      interactionSystem.on("test-event", callback);
      
      interactionSystem.trigger("test-event", { data: "test" });
      expect(callback).toHaveBeenCalledWith({ data: "test" });
    });

    test("should handle multiple listeners for same event", () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      interactionSystem.on("multi-event", callback1);
      interactionSystem.on("multi-event", callback2);
      
      interactionSystem.trigger("multi-event", { data: "test" });
      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });
  });

  describe("Error Handling", () => {
    test("should handle missing container gracefully", () => {
      expect(() => {
        createAdvancedInteractionSystem(null, mockXScale, mockYScale);
      }).not.toThrow();
    });

    test("should handle invalid drag configuration", () => {
      expect(() => {
        interactionSystem.enableDrag(null);
      }).not.toThrow();

      expect(() => {
        interactionSystem.enableDrag({ enabled: true }); // missing axis
      }).not.toThrow();
    });

    test("should handle invalid hover configuration", () => {
      expect(() => {
        interactionSystem.enableEnhancedHover(null);
      }).not.toThrow();

      expect(() => {
        interactionSystem.enableEnhancedHover({ enabled: true }); // missing extent
      }).not.toThrow();
    });

    test("should handle invalid force simulation configuration", () => {
      expect(() => {
        interactionSystem.startForceSimulation(null);
      }).not.toThrow();

      expect(() => {
        interactionSystem.startForceSimulation({}); // missing forces
      }).not.toThrow();
    });
  });

  describe("Integration Scenarios", () => {
    test("should handle drag + hover combination", () => {
      // Provide data first
      interactionSystem.updateData([{ label: "A", value: 100 }]);
      
      expect(() => {
        interactionSystem.enableDrag({ enabled: true, axis: "vertical" });
        interactionSystem.enableEnhancedHover({ enabled: true });
      }).not.toThrow();

      const active = interactionSystem.getActiveInteractions();
      expect(active).toContain("drag");
      expect(active).toContain("hover");
    });

    test("should handle drag + force simulation combination", () => {
      // Provide data first
      interactionSystem.updateData([{ label: "A", value: 100 }]);
      
      expect(() => {
        interactionSystem.enableDrag({ enabled: true, axis: "vertical" });
        interactionSystem.startForceSimulation({ enabled: true, forces: {} });
      }).not.toThrow();

      const active = interactionSystem.getActiveInteractions();
      expect(active).toContain("drag");
      expect(active).toContain("force");
    });

    test("should clean up all interactions when destroyed", () => {
      interactionSystem.setInteractionMode("combined");
      expect(interactionSystem.getActiveInteractions().length).toBeGreaterThan(0);

      interactionSystem.setInteractionMode("none");
      expect(interactionSystem.getActiveInteractions()).toEqual([]);
    });
  });
});
