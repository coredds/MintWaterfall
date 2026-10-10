// MintWaterfall — resolved visual style tokens
import { themes, Theme } from "../themes.js";
import { ChartConfig } from "./config.js";

export interface ResolvedStyle {
    /** Background fill painted behind the chart, or null for transparent. */
    background: string | null;
    /** Color used to separate stacked segments (matches the surface behind the chart). */
    surface: string;
    text: string;
    mutedText: string;
    grid: string;
    axis: string;
    connector: string;
    positive: string;
    negative: string;
    total: string;
    accent: string;
    palette: string[];
    fontFamily: string;
}

export const FONT_FAMILY = 'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

function isDark(hex: string): boolean {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
    if (!m) return false;
    const n = parseInt(m[1], 16);
    const r = (n >> 16) & 255;
    const g = (n >> 8) & 255;
    const b = n & 255;
    return 0.2126 * r + 0.7152 * g + 0.0722 * b < 128;
}

/** True when the reader's OS/browser asks for a dark color scheme. */
export function prefersDarkScheme(): boolean {
    try {
        return typeof window !== "undefined" && typeof window.matchMedia === "function"
            ? window.matchMedia("(prefers-color-scheme: dark)").matches
            : false;
    } catch {
        return false;
    }
}

/** The concrete theme for a config: `"auto"` resolves to `"dark"` or `"default"`. */
export function resolvedThemeName(config: Pick<ChartConfig, "theme">): string | null {
    if (config.theme === "auto") return prefersDarkScheme() ? "dark" : "default";
    return config.theme;
}

/**
 * Build the style tokens for a render. Without an explicit theme the chart has a
 * transparent background and uses the default theme's tokens.
 */
export function resolveStyle(config: ChartConfig): ResolvedStyle {
    const name = resolvedThemeName(config);
    const explicitTheme = name ? themes[name] : undefined;
    const theme: Theme = explicitTheme || themes.default;
    const fmt = theme.conditionalFormatting || { positive: "#10b981", negative: "#ef4444", neutral: "#94a3b8" };
    const dark = isDark(theme.background);

    return {
        background: explicitTheme ? theme.background : null,
        surface: explicitTheme ? theme.background : "#ffffff",
        text: theme.textColor,
        mutedText: dark ? "#94a3b8" : "#64748b",
        grid: theme.gridColor,
        axis: theme.axisColor,
        connector: dark ? "#64748b" : "#94a3b8",
        positive: fmt.positive,
        negative: fmt.negative,
        total: config.totalColor,
        accent: theme.colors[0] || "#6366f1",
        palette: theme.colors,
        fontFamily: FONT_FAMILY,
    };
}
