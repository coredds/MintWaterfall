import * as d3 from 'd3';
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
    margin?: number | {
        top: number;
        right: number;
        bottom: number;
        left: number;
    };
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
export declare function createExportSystem(): ExportSystem;
//# sourceMappingURL=mintwaterfall-export.d.ts.map