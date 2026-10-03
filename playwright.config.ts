import { defineConfig, devices } from "@playwright/test";

const PORT = 4173;

export default defineConfig({
    testDir: "./e2e",
    fullyParallel: true,
    forbidOnly: Boolean(process.env.CI),
    retries: process.env.CI ? 1 : 0,
    reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
    // Font rendering differs by OS, so screenshot baselines are kept per platform.
    snapshotPathTemplate: "{testDir}/__screenshots__/{platform}/{testFilePath}/{arg}{ext}",
    expect: {
        toHaveScreenshot: { maxDiffPixelRatio: 0.01, animations: "disabled" },
    },
    use: {
        baseURL: `http://localhost:${PORT}`,
        viewport: { width: 1280, height: 900 },
        trace: "retain-on-failure",
    },
    projects: [
        {
            name: "chromium",
            use: {
                ...devices["Desktop Chrome"],
                viewport: { width: 1280, height: 900 },
                // On Windows use the installed Edge so no browser download is needed locally
                channel: process.platform === "win32" && !process.env.CI ? "msedge" : undefined,
            },
        },
    ],
    webServer: {
        command: `node scripts/serve.mjs ${PORT}`,
        url: `http://localhost:${PORT}/mintwaterfall-example.html`,
        reuseExistingServer: !process.env.CI,
    },
});
