/**
 * Standalone module tests with the real D3.
 */
import * as d3 from "d3";
import { readFileSync } from "fs";
import { join } from "path";

import { createTooltipSystem } from "../../src/tooltip.js";
import { createExportSystem } from "../../src/export.js";
import { createZoomSystem } from "../../src/zoom.js";
import { waterfallChart } from "../../src/chart/chart.js";

beforeAll(() => {
    (URL as any).createObjectURL = jest.fn(() => "blob:mock");
    (URL as any).revokeObjectURL = jest.fn();
});

afterEach(() => {
    document.body.innerHTML = "";
});

describe("tooltip system", () => {
    test("show / move / hide lifecycle", () => {
        const tooltip = createTooltipSystem();
        const event = new MouseEvent("mousemove", { clientX: 20, clientY: 30 });
        tooltip.show("<b>Hello</b>", event);
        const el = document.querySelector(".mintwaterfall-tooltip") as HTMLElement;
        expect(el.innerHTML).toBe("<b>Hello</b>");
        expect(tooltip.isVisible()).toBe(true);
        expect(tooltip.move(event)).toBeDefined();
        tooltip.hide();
        expect(tooltip.getCurrentData()).toBeNull();
        tooltip.destroy();
        expect(document.querySelector(".mintwaterfall-tooltip")).toBeNull();
    });

    test("default content escapes labels and lists stacks", () => {
        const tooltip = createTooltipSystem();
        tooltip.show({ template: "{{label}} = {{value}}" }, new MouseEvent("mousemove"), { label: "A", value: 3 });
        expect(document.querySelector(".mintwaterfall-tooltip")!.textContent).toBe("A = 3");
        tooltip.show(undefined as any, new MouseEvent("mousemove"), {
            label: "<script>",
            stacks: [
                { value: 1, label: "x" },
                { value: 2, label: "y" },
            ],
        });
        const html = document.querySelector(".mintwaterfall-tooltip")!.innerHTML;
        expect(html).toContain("&lt;script&gt;");
        expect(html).toContain("tooltip-stack-item");
        tooltip.theme("light").configure({ theme: "corporate" });
        tooltip.destroy();
    });
});

describe("export system", () => {
    const rows = [
        { label: "a", value: 1 },
        { label: "b, c", value: 2 },
    ];

    test("exports JSON with metadata", () => {
        const result = createExportSystem().exportData(rows, { dataFormat: "json" });
        const parsed = JSON.parse(result.data);
        expect(parsed.data).toEqual(rows);
        expect(parsed.metadata.count).toBe(2);
    });

    test("exports CSV/TSV with quoting", () => {
        const sys = createExportSystem();
        expect(sys.exportData(rows, { dataFormat: "csv" }).data).toBe('label,value\na,1\n"b, c",2');
        expect(sys.exportData(rows, { dataFormat: "tsv" }).data).toBe("label\tvalue\na\t1\nb, c\t2");
    });

    test("rejects unknown formats", () => {
        const spy = jest.spyOn(console, "error").mockImplementation(() => {});
        expect(() => createExportSystem().exportData(rows, { dataFormat: "xml" as any })).toThrow(/Unsupported/);
        spy.mockRestore();
    });

    test("exportSVG clones the chart with a background", () => {
        const div = document.createElement("div");
        document.body.appendChild(div);
        d3.select(div)
            .datum([{ label: "a", stacks: [{ value: 1 }] }])
            .call(waterfallChart().duration(0) as any);
        const result = createExportSystem().exportSVG(d3.select(div) as any, { background: "#fafafa" });
        expect(result.data).toContain('fill="#fafafa"');
        expect(div.querySelectorAll("svg > rect[fill='#fafafa']")).toHaveLength(0); // original untouched
    });

    test("exportSVG inlines matching stylesheet rules only", () => {
        const style = document.createElement("style");
        style.textContent = ".mintwaterfall-bar { fill: red; } .unrelated { color: blue; } svg text { font-size: 11px; }";
        document.head.appendChild(style);
        try {
            const div = document.body.appendChild(document.createElement("div"));
            d3.select(div)
                .datum([{ label: "a", stacks: [{ value: 1 }] }])
                .call(waterfallChart().duration(0) as any);
            const withStyles = createExportSystem().exportSVG(d3.select(div) as any).data;
            expect(withStyles).toContain(".mintwaterfall-bar");
            expect(withStyles).toContain("svg text");
            expect(withStyles).not.toContain(".unrelated");
            const without = createExportSystem().exportSVG(d3.select(div) as any, { includeStyles: false, background: "transparent" }).data;
            expect(without).not.toContain(".mintwaterfall-bar");
            expect(without).not.toMatch(/<rect width="100%"/);
        } finally {
            style.remove();
        }
    });

    test("exportSVG / exportPNG reject a container without an svg", async () => {
        const spy = jest.spyOn(console, "error").mockImplementation(() => {});
        const empty = d3.select(document.body.appendChild(document.createElement("div"))) as any;
        expect(() => createExportSystem().exportSVG(empty)).toThrow(/No SVG/);
        await expect(createExportSystem().exportPNG(empty)).rejects.toThrow(/No SVG/);
        spy.mockRestore();
    });

    test("download(), downloadFile() and configure() use the configured filename", () => {
        const clicked: Array<{ download: string; href: string }> = [];
        const click = jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
            clicked.push({ download: this.download, href: this.href });
        });
        try {
            const sys = createExportSystem().configure({ filename: "report" });
            sys.exportData(rows, { dataFormat: "csv" }).download();
            sys.downloadFile("hello", "notes.txt");
            sys.downloadFile(new Blob(["x"]), "raw.bin");
            expect(clicked.map(c => c.download)).toEqual(["report.csv", "notes.txt", "raw.bin"]);
            expect(clicked.every(c => c.href === "blob:mock")).toBe(true);
            expect(document.querySelectorAll("a")).toHaveLength(0); // temporary link removed
        } finally {
            click.mockRestore();
        }
    });

    test("CSV escapes quotes and newlines; empty data gives empty output", () => {
        const sys = createExportSystem();
        expect(sys.exportData([{ a: 'say "hi"', b: "x\ny", c: null }], { dataFormat: "csv" }).data).toBe('a,b,c\n"say ""hi""","x\ny",');
        expect(sys.exportData([], { dataFormat: "csv" }).data).toBe("");
        expect(sys.exportData([{ a: 1, b: 2 }], { dataFormat: "csv", delimiter: ";" }).data).toBe("a;b\n1;2");
    });

    test("CSV/TSV neutralise spreadsheet formulas but keep numbers", () => {
        const sys = createExportSystem();
        const rows = [
            { label: '=HYPERLINK("http://x")', n: -5, s: "-5", t: "+1.5e3" },
            { label: "@SUM(A1)", n: 3, s: "-Opex", t: "\tcmd" },
            { label: "Revenue", n: 0, s: "a=b", t: "" },
        ];
        expect(sys.exportData(rows, { dataFormat: "csv" }).data).toBe(
            ["label,n,s,t", '"\'=HYPERLINK(""http://x"")",-5,-5,+1.5e3', "'@SUM(A1),3,'-Opex,'\tcmd", "Revenue,0,a=b,"].join("\n")
        );
        expect(sys.exportData([{ a: "=1+1" }], { dataFormat: "tsv" }).data).toBe("a\n'=1+1");
        expect(sys.exportData([{ a: "=1+1" }], { dataFormat: "csv", escapeFormulas: false }).data).toBe("a\n=1+1");
        // JSON is not a spreadsheet format: untouched
        expect(JSON.parse(sys.exportData([{ a: "=1+1" }], { dataFormat: "json", includeMetadata: false }).data)).toEqual([{ a: "=1+1" }]);
    });

    test("chart CSV export escapes formula-like labels", async () => {
        const div = document.body.appendChild(document.createElement("div"));
        const chart = waterfallChart().duration(0);
        d3.select(div)
            .datum([{ label: "=cmd()", stacks: [{ value: -3 }] }])
            .call(chart as any);
        const csv = await chart.export("csv");
        expect(csv.data).toBe("label,type,value,runningTotal\n'=cmd(),decrease,-3,-3");
    });

    test("PDF export requires jsPDF", async () => {
        await expect(createExportSystem().exportPDF(d3.select(document.body) as any)).rejects.toThrow(/requires jsPDF/);
    });

    test("PDF export accepts an injected jsPDF or the UMD global", async () => {
        // No SVG in the container, so it fails later (in PNG export) — but not on the jsPDF lookup.
        const FakeJsPDF = jest.fn() as any;
        const injected = createExportSystem().exportPDF(d3.select(document.body) as any, { jsPDF: FakeJsPDF });
        await expect(injected).rejects.not.toThrow(/requires jsPDF/);
        (window as any).jspdf = { jsPDF: FakeJsPDF };
        try {
            await expect(createExportSystem().exportPDF(d3.select(document.body) as any)).rejects.not.toThrow(/requires jsPDF/);
        } finally {
            delete (window as any).jspdf;
        }
    });
});

describe("zoom system", () => {
    // Note: jsdom has no SVGSVGElement.viewBox, so programmatic transforms (reset/zoomTo)
    // cannot run here; those paths are exercised in the browser demo.
    test("attach, configure, enable/disable and detach", () => {
        const svg = d3.select(document.body).append("svg").attr("width", 400).attr("height", 200);
        svg.append("g").attr("class", "chart-group");
        const zoom = createZoomSystem();
        zoom.setDimensions({ width: 400, height: 200, margin: { top: 10, right: 10, bottom: 10, left: 10 } });
        zoom.attach(svg as any).configure({ scaleExtent: [1, 4], touchable: false });
        expect(zoom.isEnabled()).toBe(true);
        expect((svg.node() as any).__on.some((l: any) => l.name === "zoom")).toBe(true);
        expect(zoom.getCurrentTransform().k).toBe(1);
        zoom.disable();
        expect(zoom.isEnabled()).toBe(false);
        zoom.enable().detach();
    });
});

describe("entry points", () => {
    test("experimental modules live only in mintwaterfall/experimental", async () => {
        const main = await import("../../src/index.js");
        const experimental = await import("../../src/experimental.js");
        const moved = [
            "createBrushSystem",
            "createZoomSystem",
            "createPerformanceManager",
            "createAdvancedInteractionSystem",
            "createHierarchicalLayout",
            "createWaterfallTreemap",
        ];
        for (const name of moved) {
            expect(main).not.toHaveProperty(name);
            expect(typeof (experimental as any)[name]).toBe("function");
        }
        expect(typeof main.waterfallChart).toBe("function");
        // Fails if src/version.ts drifts from package.json (run `node scripts/sync-version.mjs`)
        const pkg = JSON.parse(readFileSync(join(__dirname, "../../package.json"), "utf8"));
        expect(main.version).toBe(pkg.version);
    });

    test("removed no-op chart settings are gone", () => {
        const chart = waterfallChart() as any;
        for (const name of ["breakdownConfig", "enablePerformanceOptimization", "performanceDashboard", "virtualizationThreshold"]) {
            expect(chart[name]).toBeUndefined();
        }
    });
});
