// Feature registration and initialization
import { EnterpriseFeatureManager } from "../enterprise-core.js";
import { BreakdownFeature } from "./features/breakdown.js";

// Register the breakdown feature
export function registerBreakdownFeature(manager) {
    if (!manager instanceof EnterpriseFeatureManager) {
        throw new Error("registerBreakdownFeature requires an EnterpriseFeatureManager instance");
    }
    
    const breakdownFeature = new BreakdownFeature();
    manager.registerFeature("breakdown", breakdownFeature);
    
    console.log("BreakdownFeature: Registered with EnterpriseFeatureManager");
    return breakdownFeature;
}

// Auto-register if enterprise manager is available globally
if (typeof window !== "undefined" && window.MintWaterfall && window.MintWaterfall.enterprise) {
    registerBreakdownFeature(window.MintWaterfall.enterprise);
}
