// MintWaterfall Theme System
// Provides predefined themes and color schemes

export const themes = {
    default: {
        name: "Default",
        background: "#ffffff",
        gridColor: "#e0e0e0",
        axisColor: "#666666",
        textColor: "#333333",
        totalColor: "#95A5A6",
        colors: ["#3498db", "#2ecc71", "#e74c3c", "#f39c12", "#9b59b6", "#1abc9c", "#e67e22", "#f1c40f"]
    },
    
    dark: {
        name: "Dark",
        background: "#2c3e50",
        gridColor: "#34495e",
        axisColor: "#bdc3c7",
        textColor: "#ecf0f1",
        totalColor: "#95a5a6",
        colors: ["#3498db", "#2ecc71", "#e74c3c", "#f39c12", "#9b59b6", "#1abc9c", "#e67e22", "#f1c40f"]
    },
    
    corporate: {
        name: "Corporate",
        background: "#ffffff",
        gridColor: "#e8e8e8",
        axisColor: "#555555",
        textColor: "#333333",
        totalColor: "#7f8c8d",
        colors: ["#2c3e50", "#34495e", "#7f8c8d", "#95a5a6", "#bdc3c7", "#ecf0f1"]
    },
    
    accessible: {
        name: "Accessible",
        background: "#ffffff",
        gridColor: "#cccccc",
        axisColor: "#000000",
        textColor: "#000000",
        totalColor: "#666666",
        // High contrast, colorblind-friendly palette
        colors: ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b", "#e377c2", "#7f7f7f"]
    },
    
    colorful: {
        name: "Colorful",
        background: "#ffffff",
        gridColor: "#f0f0f0",
        axisColor: "#666666",
        textColor: "#333333",
        totalColor: "#34495e",
        colors: ["#ff6b6b", "#4ecdc4", "#45b7d1", "#f9ca24", "#f0932b", "#eb4d4b", "#6c5ce7", "#a29bfe"]
    }
};

export function applyTheme(chart, themeName = "default") {
    const theme = themes[themeName] || themes.default;
    
    // Apply theme colors to chart configuration
    chart.totalColor(theme.totalColor);
    
    return theme;
}

export function getThemeColorPalette(themeName = "default") {
    const theme = themes[themeName] || themes.default;
    return theme.colors;
}
