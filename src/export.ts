// MintWaterfall Export System - TypeScript Version
// Provides SVG, PNG, PDF, and data export capabilities with full type safety

import * as d3 from 'd3';

// Type definitions for export system
export interface ExportConfig {
    filename: string;
    quality: number;
    scale: number;
    background: string;
    padding: number;
    includeStyles: boolean;
    includeData: boolean;
}

export interface ExportOptions extends Partial<ExportConfig> {
    width?: number;
    height?: number;
}

export interface ExportResult {
    blob: Blob;
    url: string;
    data: string;
    download: () => void;
}

export interface PNGExportOptions extends Partial<ExportConfig> {
    width?: number;
    height?: number;
    canvas?: HTMLCanvasElement;
    context?: CanvasRenderingContext2D;
}

export interface PDFExportOptions extends Partial<ExportConfig> {
    width?: number;
    height?: number;
    orientation?: 'portrait' | 'landscape';
    pageFormat?: 'a4' | 'letter' | 'legal' | [number, number];
    margin?: number | { top: number; right: number; bottom: number; left: number };
}

export interface DataExportOptions extends Partial<ExportConfig> {
    dataFormat?: 'json' | 'csv' | 'tsv';
    includeMetadata?: boolean;
    delimiter?: string;
}

export interface ChartContainer {
    select(selector: string): d3.Selection<any, any, any, any>;
    node(): any;
}

export interface ExportSystem {
    exportSVG(chartContainer: ChartContainer, options?: ExportOptions): ExportResult;
    exportPNG(chartContainer: ChartContainer, options?: PNGExportOptions): Promise<ExportResult>;
    exportPDF(chartContainer: ChartContainer, options?: PDFExportOptions): Promise<ExportResult>;
    exportData(data: any[], options?: DataExportOptions): ExportResult;
    configure(newConfig: Partial<ExportConfig>): ExportSystem;
    downloadFile(content: string | Blob, filename: string, mimeType?: string): void;
}

export type ExportFormat = 'svg' | 'png' | 'pdf' | 'json' | 'csv';

export function createExportSystem(): ExportSystem {
    
    let config: ExportConfig = {
        filename: "waterfall-chart",
        quality: 1.0,
        scale: 1,
        background: "#ffffff",
        padding: 20,
        includeStyles: true,
        includeData: true
    };
    
    // Export chart as SVG
    function exportSVG(chartContainer: ChartContainer, options: ExportOptions = {}): ExportResult {
        const opts: ExportConfig = { ...config, ...options };
        
        try {
            const svg = chartContainer.select("svg");
            if (svg.empty()) {
                throw new Error("No SVG element found in chart container");
            }
            
            const svgNode = svg.node() as SVGSVGElement;
            const serializer = new XMLSerializer();
            
            // Clone SVG to avoid modifying original
            const clonedSvg = svgNode.cloneNode(true) as SVGSVGElement;
            
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
    
    // Export chart as PNG with enhanced features
    function exportPNG(chartContainer: ChartContainer, options: PNGExportOptions = {}): Promise<ExportResult> {
        const opts: ExportConfig & PNGExportOptions = { 
            ...config, 
            scale: 2, // Default to 2x for high-DPI
            quality: 0.95,
            ...options 
        };
        
        return new Promise((resolve, reject) => {
            try {
                const svg = chartContainer.select("svg");
                if (svg.empty()) {
                    reject(new Error("No SVG element found in chart container"));
                    return;
                }
                
                const svgNode = svg.node() as SVGSVGElement;
                const bbox = svgNode.getBBox();
                const width = (bbox.width + opts.padding * 2) * opts.scale;
                const height = (bbox.height + opts.padding * 2) * opts.scale;
                
                // Create high-DPI canvas
                const canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                
                if (!ctx) {
                    reject(new Error("Failed to get canvas context"));
                    return;
                }
                
                // Enable high-quality rendering
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = "high";
                
                // Set background
                if (opts.background && opts.background !== "transparent") {
                    ctx.fillStyle = opts.background;
                    ctx.fillRect(0, 0, width, height);
                }
                
                // Convert SVG to image with enhanced error handling
                const svgExport = exportSVG(chartContainer, { 
                    ...opts,
                    includeStyles: true,
                    background: "transparent" // Let canvas handle background
                });
                
                const img = new Image();
                img.onload = () => {
                    try {
                        // Draw image with proper scaling and positioning
                        ctx.drawImage(img, opts.padding * opts.scale, opts.padding * opts.scale);
                        
                        // Convert to blob
                        canvas.toBlob((blob) => {
                            if (!blob) {
                                reject(new Error("Failed to create PNG blob"));
                                return;
                            }
                            
                            // Clean up
                            URL.revokeObjectURL(svgExport.url);
                            
                            resolve({
                                blob,
                                url: URL.createObjectURL(blob),
                                data: svgExport.data,
                                download: () => downloadBlob(blob, `${opts.filename}.png`)
                            });
                        }, "image/png", opts.quality);
                        
                    } catch (drawError) {
                        reject(new Error(`PNG rendering failed: ${drawError}`));
                    }
                };
                
                img.onerror = () => {
                    reject(new Error("Failed to load SVG image for PNG conversion"));
                };
                
                // Load SVG as data URL
                img.src = `data:image/svg+xml;base64,${btoa(svgExport.data as string)}`;
                
            } catch (error) {
                reject(new Error(`PNG export failed: ${error}`));
            }
        });
    }
    
    // Export chart as PDF (requires external library like jsPDF)
    function exportPDF(chartContainer: ChartContainer, options: PDFExportOptions = {}): Promise<ExportResult> {
        const opts: ExportConfig & PDFExportOptions = { 
            ...config, 
            orientation: 'landscape',
            pageFormat: 'a4',
            ...options 
        };
        
        return new Promise((resolve, reject) => {
            // Check if jsPDF is available
            if (typeof window === 'undefined' || !(window as any).jsPDF) {
                reject(new Error('jsPDF library is required for PDF export. Please include it: <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>'));
                return;
            }
            
            try {
                // Get PNG data first
                exportPNG(chartContainer, { 
                    ...opts, 
                    scale: 2,
                    quality: 0.95 
                }).then((pngResult) => {
                    const jsPDF = (window as any).jsPDF;
                    const pdf = new jsPDF({
                        orientation: opts.orientation,
                        unit: 'mm',
                        format: opts.pageFormat
                    });
                    
                    // Calculate dimensions
                    const pdfWidth = pdf.internal.pageSize.getWidth();
                    const pdfHeight = pdf.internal.pageSize.getHeight();
                    
                    // Add image to PDF
                    const reader = new FileReader();
                    reader.onload = () => {
                        try {
                            const imgData = reader.result as string;
                            
                            // Calculate aspect ratio and size
                            const img = new Image();
                            img.onload = () => {
                                const aspectRatio = img.width / img.height;
                                let width = pdfWidth - 20; // 10mm margin on each side
                                let height = width / aspectRatio;
                                
                                // Adjust if height is too large
                                if (height > pdfHeight - 20) {
                                    height = pdfHeight - 20;
                                    width = height * aspectRatio;
                                }
                                
                                const x = (pdfWidth - width) / 2;
                                const y = (pdfHeight - height) / 2;
                                
                                pdf.addImage(imgData, 'PNG', x, y, width, height);
                                
                                // Generate PDF blob
                                const pdfBlob = pdf.output('blob');
                                
                                // Clean up
                                URL.revokeObjectURL(pngResult.url);
                                
                                resolve({
                                    blob: pdfBlob,
                                    url: URL.createObjectURL(pdfBlob),
                                    data: pdfBlob,
                                    download: () => downloadBlob(pdfBlob, `${opts.filename}.pdf`)
                                });
                            };
                            
                            img.src = imgData;
                            
                        } catch (pdfError) {
                            reject(new Error(`PDF generation failed: ${pdfError}`));
                        }
                    };
                    
                    reader.onerror = () => {
                        reject(new Error("Failed to read PNG data for PDF conversion"));
                    };
                    
                    reader.readAsDataURL(pngResult.blob);
                    
                }).catch(reject);
                
            } catch (error) {
                reject(new Error(`PDF export failed: ${error}`));
            }
        });
    }
    
    // Export data in various formats
    function exportData(data: any[], options: DataExportOptions = {}): ExportResult {
        const opts: ExportConfig & DataExportOptions = { 
            ...config, 
            dataFormat: 'json',
            includeMetadata: true,
            delimiter: ',',
            ...options 
        };
        
        try {
            let content: string;
            let mimeType: string;
            let extension: string;
            
            switch (opts.dataFormat) {
                case 'json':
                    const jsonData = opts.includeMetadata 
                        ? { 
                            data, 
                            metadata: { 
                                exportDate: new Date().toISOString(), 
                                count: data.length 
                            } 
                        }
                        : data;
                    content = JSON.stringify(jsonData, null, 2);
                    mimeType = 'application/json';
                    extension = 'json';
                    break;
                    
                case 'csv':
                    content = convertToCSV(data, opts.delimiter || ',');
                    mimeType = 'text/csv';
                    extension = 'csv';
                    break;
                    
                case 'tsv':
                    content = convertToCSV(data, '\t');
                    mimeType = 'text/tab-separated-values';
                    extension = 'tsv';
                    break;
                    
                default:
                    throw new Error(`Unsupported data export format: ${opts.dataFormat}`);
            }
            
            const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
            
            return {
                blob,
                url: URL.createObjectURL(blob),
                data: content,
                download: () => downloadBlob(blob, `${opts.filename}.${extension}`)
            };
            
        } catch (error) {
            console.error("Data export failed:", error);
            throw error;
        }
    }
    
    // Helper function to add inline styles to SVG
    function addInlineStyles(svgElement: SVGSVGElement): void {
        try {
            const styleSheets = Array.from(document.styleSheets);
            let styles = '';
            
            styleSheets.forEach(sheet => {
                try {
                    const rules = Array.from(sheet.cssRules || sheet.rules);
                    rules.forEach(rule => {
                        if (rule.type === CSSRule.STYLE_RULE) {
                            const styleRule = rule as CSSStyleRule;
                            if (styleRule.selectorText && 
                                (styleRule.selectorText.includes('.mintwaterfall') || 
                                 styleRule.selectorText.includes('svg') ||
                                 styleRule.selectorText.includes('chart'))) {
                                styles += styleRule.cssText;
                            }
                        }
                    });
                } catch (e) {
                    // Skip inaccessible stylesheets (CORS)
                    console.warn('Could not access stylesheet:', e);
                }
            });
            
            if (styles) {
                const styleElement = document.createElementNS('http://www.w3.org/2000/svg', 'style');
                styleElement.textContent = styles;
                svgElement.insertBefore(styleElement, svgElement.firstChild);
            }
        } catch (error) {
            console.warn('Failed to add inline styles:', error);
        }
    }
    
    // Helper function to add background to SVG
    function addBackground(svgElement: SVGSVGElement, backgroundColor: string): void {
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('width', '100%');
        rect.setAttribute('height', '100%');
        rect.setAttribute('fill', backgroundColor);
        svgElement.insertBefore(rect, svgElement.firstChild);
    }
    
    // Helper function to convert data to CSV
    function convertToCSV(data: any[], delimiter: string = ','): string {
        if (!data || data.length === 0) return '';
        
        // Get headers from first object
        const headers = Object.keys(data[0]);
        
        // Create CSV content
        const csvContent = [
            headers.join(delimiter),
            ...data.map(row => 
                headers.map(header => {
                    const value = row[header];
                    // Escape quotes and wrap in quotes if contains delimiter
                    const stringValue = value != null ? String(value) : '';
                    if (stringValue.includes(delimiter) || stringValue.includes('"') || stringValue.includes('\n')) {
                        return `"${stringValue.replace(/"/g, '""')}"`;
                    }
                    return stringValue;
                }).join(delimiter)
            )
        ].join('\n');
        
        return csvContent;
    }
    
    // Helper function to download blob
    function downloadBlob(blob: Blob, filename: string): void {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
    
    // Configure export system
    function configure(newConfig: Partial<ExportConfig>): ExportSystem {
        config = { ...config, ...newConfig };
        return exportSystem;
    }
    
    // Download file utility
    function downloadFile(content: string | Blob, filename: string, mimeType: string = 'text/plain'): void {
        const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
        downloadBlob(blob, filename);
    }
    
    const exportSystem: ExportSystem = {
        exportSVG,
        exportPNG,
        exportPDF,
        exportData,
        configure,
        downloadFile
    };
    
    return exportSystem;
}
