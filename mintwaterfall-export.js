// MintWaterfall Export System
// Provides SVG, PNG, PDF, and data export capabilities

export function createExportSystem() {
    
    let config = {
        filename: "waterfall-chart",
        quality: 1.0,
        scale: 1,
        background: "#ffffff",
        padding: 20,
        includeStyles: true,
        includeData: true
    };
    
    // Export chart as SVG
    function exportSVG(chartContainer, options = {}) {
        const opts = { ...config, ...options };
        
        try {
            const svg = chartContainer.select("svg");
            if (svg.empty()) {
                throw new Error("No SVG element found in chart container");
            }
            
            const svgNode = svg.node();
            const serializer = new XMLSerializer();
            
            // Clone SVG to avoid modifying original
            const clonedSvg = svgNode.cloneNode(true);
            
            // Add styles if requested
            if (opts.includeStyles) {
                addInlineStyles(clonedSvg);
            }
            
            // Add background if specified
            if (opts.background && opts.background !== "transparent") {
                addBackground(clonedSvg, opts.background);
            }
            
            // Serialize to string
            const svgString = serializer.serializeToString(clonedSvg);
            
            // Create downloadable blob
            const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
            
            return {
                blob,
                url: URL.createObjectURL(blob),
                data: svgString,
                download: () => downloadBlob(blob, `${opts.filename}.svg`)
            };
            
        } catch (error) {
            console.error("SVG export failed:", error);
            throw error;
        }
    }
    
    // Export chart as PNG
    function exportPNG(chartContainer, options = {}) {
        const opts = { ...config, ...options };
        
        return new Promise((resolve, reject) => {
            try {
                const svg = chartContainer.select("svg");
                if (svg.empty()) {
                    reject(new Error("No SVG element found in chart container"));
                    return;
                }
                
                const svgNode = svg.node();
                const bbox = svgNode.getBBox();
                const width = (bbox.width + opts.padding * 2) * opts.scale;
                const height = (bbox.height + opts.padding * 2) * opts.scale;
                
                // Create canvas
                const canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                
                // Set background
                if (opts.background && opts.background !== "transparent") {
                    ctx.fillStyle = opts.background;
                    ctx.fillRect(0, 0, width, height);
                }
                
                // Convert SVG to image
                const svgExport = exportSVG(chartContainer, { 
                    ...opts, 
                    includeStyles: true 
                });
                
                const img = new Image();
                img.onload = function() {
                    try {
                        ctx.drawImage(img, opts.padding, opts.padding, 
                                     bbox.width * opts.scale, bbox.height * opts.scale);
                        
                        canvas.toBlob((blob) => {
                            if (blob) {
                                resolve({
                                    blob,
                                    url: URL.createObjectURL(blob),
                                    canvas,
                                    download: () => downloadBlob(blob, `${opts.filename}.png`)
                                });
                            } else {
                                reject(new Error("Failed to create PNG blob"));
                            }
                        }, "image/png", opts.quality);
                        
                    } catch (error) {
                        reject(error);
                    }
                };
                
                img.onerror = () => reject(new Error("Failed to load SVG image"));
                img.src = svgExport.url;
                
            } catch (error) {
                reject(error);
            }
        });
    }
    
    // Export chart as JPEG
    function exportJPEG(chartContainer, options = {}) {
        const opts = { ...config, background: "#ffffff", ...options };
        
        return exportPNG(chartContainer, opts).then(result => {
            return new Promise((resolve, reject) => {
                result.canvas.toBlob((blob) => {
                    if (blob) {
                        resolve({
                            blob,
                            url: URL.createObjectURL(blob),
                            canvas: result.canvas,
                            download: () => downloadBlob(blob, `${opts.filename}.jpg`)
                        });
                    } else {
                        reject(new Error("Failed to create JPEG blob"));
                    }
                }, "image/jpeg", opts.quality);
            });
        });
    }
    
    // Export chart as PDF (requires jsPDF)
    function exportPDF(chartContainer, options = {}) {
        const opts = { ...config, ...options };
        
        return new Promise((resolve, reject) => {
            // Check if jsPDF is available
            if (typeof window.jsPDF === "undefined") {
                reject(new Error("jsPDF library is required for PDF export. Please include it in your project."));
                return;
            }
            
            exportPNG(chartContainer, opts).then(pngResult => {
                try {
                    const { jsPDF } = window;
                    const pdf = new jsPDF({
                        orientation: opts.orientation || "landscape",
                        unit: "px",
                        format: [pngResult.canvas.width, pngResult.canvas.height]
                    });
                    
                    pdf.addImage(pngResult.canvas, "PNG", 0, 0, 
                                pngResult.canvas.width, pngResult.canvas.height);
                    
                    const pdfBlob = pdf.output("blob");
                    
                    resolve({
                        blob: pdfBlob,
                        url: URL.createObjectURL(pdfBlob),
                        pdf,
                        download: () => downloadBlob(pdfBlob, `${opts.filename}.pdf`)
                    });
                    
                } catch (error) {
                    reject(error);
                }
            }).catch(reject);
        });
    }
    
    // Export chart data
    function exportData(data, format = "json", options = {}) {
        const opts = { ...config, ...options };
        
        try {
            let exportData, mimeType, extension;
            
            switch (format.toLowerCase()) {
                case "json":
                    exportData = JSON.stringify(data, null, 2);
                    mimeType = "application/json";
                    extension = "json";
                    break;
                    
                case "csv":
                    exportData = convertToCSV(data);
                    mimeType = "text/csv";
                    extension = "csv";
                    break;
                    
                case "tsv":
                    exportData = convertToTSV(data);
                    mimeType = "text/tab-separated-values";
                    extension = "tsv";
                    break;
                    
                case "xml":
                    exportData = convertToXML(data);
                    mimeType = "application/xml";
                    extension = "xml";
                    break;
                    
                default:
                    throw new Error(`Unsupported data format: ${format}`);
            }
            
            const blob = new Blob([exportData], { type: `${mimeType};charset=utf-8` });
            
            return {
                blob,
                url: URL.createObjectURL(blob),
                data: exportData,
                download: () => downloadBlob(blob, `${opts.filename}.${extension}`)
            };
            
        } catch (error) {
            console.error("Data export failed:", error);
            throw error;
        }
    }
    
    // Convert data to CSV format
    function convertToCSV(data) {
        if (!Array.isArray(data) || data.length === 0) {
            return "";
        }
        
        const headers = ["Label"];
        const maxStacks = Math.max(...data.map(item => item.stacks ? item.stacks.length : 0));
        
        // Add stack headers
        for (let i = 0; i < maxStacks; i++) {
            headers.push(`Stack ${i + 1} Value`, `Stack ${i + 1} Color`, `Stack ${i + 1} Label`);
        }
        
        headers.push("Total Value", "Cumulative");
        
        const rows = [headers];
        
        data.forEach(item => {
            const row = [item.label || ""];
            
            // Add stack data
            for (let i = 0; i < maxStacks; i++) {
                const stack = item.stacks && item.stacks[i];
                row.push(
                    stack ? stack.value : "",
                    stack ? stack.color : "",
                    stack ? (stack.label || "") : ""
                );
            }
            
            // Add totals
            const totalValue = item.stacks ? 
                item.stacks.reduce((sum, stack) => sum + stack.value, 0) : 0;
            row.push(totalValue);
            row.push(item.cumulative || "");
            
            rows.push(row);
        });
        
        return rows.map(row => 
            row.map(cell => `"${String(cell).replace(/"/g, "\"\"")}"`).join(",")
        ).join("\n");
    }
    
    // Convert data to TSV format
    function convertToTSV(data) {
        return convertToCSV(data).replace(/,/g, "\t").replace(/"/g, "");
    }
    
    // Convert data to XML format
    function convertToXML(data) {
        let xml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<waterfallData>\n";
        
        data.forEach(item => {
            xml += "  <item>\n";
            xml += `    <label>${escapeXML(item.label || "")}</label>\n`;
            
            if (item.stacks) {
                xml += "    <stacks>\n";
                item.stacks.forEach(stack => {
                    xml += "      <stack>\n";
                    xml += `        <value>${stack.value}</value>\n`;
                    xml += `        <color>${escapeXML(stack.color)}</color>\n`;
                    if (stack.label) {
                        xml += `        <label>${escapeXML(stack.label)}</label>\n`;
                    }
                    xml += "      </stack>\n";
                });
                xml += "    </stacks>\n";
            }
            
            if (item.cumulative !== undefined) {
                xml += `    <cumulative>${item.cumulative}</cumulative>\n`;
            }
            
            xml += "  </item>\n";
        });
        
        xml += "</waterfallData>";
        return xml;
    }
    
    // Escape XML special characters
    function escapeXML(str) {
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }
    
    // Add inline styles to SVG
    function addInlineStyles(svgElement) {
        const styleSheets = document.styleSheets;
        let styles = "";
        
        // Extract relevant CSS rules
        for (let i = 0; i < styleSheets.length; i++) {
            try {
                const rules = styleSheets[i].cssRules || styleSheets[i].rules;
                for (let j = 0; j < rules.length; j++) {
                    const rule = rules[j];
                    if (rule.selectorText && (
                        rule.selectorText.includes(".waterfall") ||
                        rule.selectorText.includes(".bar") ||
                        rule.selectorText.includes(".axis") ||
                        rule.selectorText.includes(".grid")
                    )) {
                        styles += rule.cssText + "\n";
                    }
                }
            } catch {
                // Skip inaccessible stylesheets (CORS)
                continue;
            }
        }
        
        if (styles) {
            const styleElement = document.createElement("style");
            styleElement.textContent = styles;
            svgElement.insertBefore(styleElement, svgElement.firstChild);
        }
    }
    
    // Add background to SVG
    function addBackground(svgElement, backgroundColor) {
        const rect = document.createElement("rect");
        rect.setAttribute("width", "100%");
        rect.setAttribute("height", "100%");
        rect.setAttribute("fill", backgroundColor);
        svgElement.insertBefore(rect, svgElement.firstChild);
    }
    
    // Download blob as file
    function downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        link.style.display = "none";
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up
        setTimeout(() => URL.revokeObjectURL(url), 100);
    }
    
    // Configuration methods
    function filename(name) {
        if (!arguments.length) return config.filename;
        config.filename = name;
        return exportSystem;
    }
    
    function quality(q) {
        if (!arguments.length) return config.quality;
        config.quality = Math.max(0, Math.min(1, q));
        return exportSystem;
    }
    
    function scale(s) {
        if (!arguments.length) return config.scale;
        config.scale = Math.max(0.1, s);
        return exportSystem;
    }
    
    function background(bg) {
        if (!arguments.length) return config.background;
        config.background = bg;
        return exportSystem;
    }
    
    function padding(p) {
        if (!arguments.length) return config.padding;
        config.padding = Math.max(0, p);
        return exportSystem;
    }
    
    // Public API
    const exportSystem = {
        exportSVG,
        exportPNG,
        exportJPEG,
        exportPDF,
        exportData,
        
        // Configuration
        filename,
        quality,
        scale,
        background,
        padding,
        
        // Utility methods
        config(newConfig) {
            if (!arguments.length) return config;
            config = { ...config, ...newConfig };
            return exportSystem;
        },
        
        // Batch export
        exportAll(chartContainer, data, formats = ["svg", "png", "json"]) {
            const promises = [];
            
            formats.forEach(format => {
                switch (format.toLowerCase()) {
                    case "svg":
                        promises.push(Promise.resolve(exportSVG(chartContainer)));
                        break;
                    case "png":
                        promises.push(exportPNG(chartContainer));
                        break;
                    case "jpeg":
                    case "jpg":
                        promises.push(exportJPEG(chartContainer));
                        break;
                    case "pdf":
                        promises.push(exportPDF(chartContainer));
                        break;
                    case "json":
                    case "csv":
                    case "tsv":
                    case "xml":
                        promises.push(Promise.resolve(exportData(data, format)));
                        break;
                }
            });
            
            return Promise.all(promises);
        }
    };
    
    return exportSystem;
}

// Convenience function to add export capabilities to chart
export function addExportToChart(chart, chartContainer) {
    const exportSystem = createExportSystem();
    
    // Add export methods to chart
    chart.export = function(format = "svg", options = {}) {
        const data = chart.data ? chart.data() : [];
        
        switch (format.toLowerCase()) {
            case "svg":
                return exportSystem.exportSVG(chartContainer, options);
            case "png":
                return exportSystem.exportPNG(chartContainer, options);
            case "jpeg":
            case "jpg":
                return exportSystem.exportJPEG(chartContainer, options);
            case "pdf":
                return exportSystem.exportPDF(chartContainer, options);
            case "json":
            case "csv":
            case "tsv":
            case "xml":
                return exportSystem.exportData(data, format, options);
            default:
                throw new Error(`Unsupported export format: ${format}`);
        }
    };
    
    chart.exportAll = function(formats) {
        const data = chart.data ? chart.data() : [];
        return exportSystem.exportAll(chartContainer, data, formats);
    };
    
    return exportSystem;
}

// Global export system instance
export const exportSystem = createExportSystem();

export default createExportSystem;