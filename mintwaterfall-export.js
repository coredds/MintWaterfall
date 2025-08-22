// MintWaterfall Export Module
// Provides export capabilities for PNG, SVG, and data formats

export function createExporter() {
    
    function exportAsSVG(svgElement, filename = "mintwaterfall-chart.svg") {
        if (!svgElement || svgElement.tagName !== "svg") {
            console.error("MintWaterfall Export: Invalid SVG element provided");
            return;
        }

        try {
            // Clone the SVG to avoid modifying the original
            const svgClone = svgElement.cloneNode(true);
            
            // Add XML namespace if not present
            svgClone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
            svgClone.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
            
            // Get the SVG's computed styles
            addComputedStyles(svgClone);
            
            // Create the SVG data
            const svgData = new XMLSerializer().serializeToString(svgClone);
            const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
            
            // Download the file
            downloadBlob(svgBlob, filename);
            
        } catch (error) {
            console.error("MintWaterfall Export: Error exporting SVG:", error);
        }
    }
    
    function exportAsPNG(svgElement, filename = "mintwaterfall-chart.png", scale = 2) {
        if (!svgElement || svgElement.tagName !== "svg") {
            console.error("MintWaterfall Export: Invalid SVG element provided");
            return;
        }

        try {
            // Clone and prepare SVG
            const svgClone = svgElement.cloneNode(true);
            svgClone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
            addComputedStyles(svgClone);
            
            const svgData = new XMLSerializer().serializeToString(svgClone);
            const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
            const url = URL.createObjectURL(svgBlob);
            
            // Create canvas for conversion
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            const img = new Image();
            
            img.onload = function() {
                // Set canvas size with scaling
                canvas.width = img.width * scale;
                canvas.height = img.height * scale;
                
                // Set white background
                ctx.fillStyle = "white";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                // Draw the image
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                
                // Convert to PNG and download
                canvas.toBlob((blob) => {
                    downloadBlob(blob, filename);
                    URL.revokeObjectURL(url);
                }, "image/png");
            };
            
            img.onerror = function() {
                console.error("MintWaterfall Export: Error loading SVG image for PNG conversion");
                URL.revokeObjectURL(url);
            };
            
            img.src = url;
            
        } catch (error) {
            console.error("MintWaterfall Export: Error exporting PNG:", error);
        }
    }
    
    function exportAsJSON(data, filename = "mintwaterfall-data.json") {
        try {
            const jsonData = JSON.stringify(data, null, 2);
            const jsonBlob = new Blob([jsonData], { type: "application/json" });
            downloadBlob(jsonBlob, filename);
        } catch (error) {
            console.error("MintWaterfall Export: Error exporting JSON:", error);
        }
    }
    
    function exportAsCSV(data, filename = "mintwaterfall-data.csv") {
        try {
            let csvContent = "Label,Stack Index,Value,Color,Stack Label\n";
            
            data.forEach((item) => {
                item.stacks.forEach((stack, stackIndex) => {
                    csvContent += `"${item.label}",${stackIndex},"${stack.value}","${stack.color}","${stack.label || ""}"\n`;
                });
            });
            
            const csvBlob = new Blob([csvContent], { type: "text/csv" });
            downloadBlob(csvBlob, filename);
        } catch (error) {
            console.error("MintWaterfall Export: Error exporting CSV:", error);
        }
    }
    
    function addComputedStyles(svgElement) {
        // Add inline styles from computed CSS
        const allElements = svgElement.querySelectorAll("*");
        
        allElements.forEach(element => {
            const computedStyle = window.getComputedStyle(element);
            let styleString = "";
            
            // Copy important styles
            const importantStyles = [
                "fill", "stroke", "stroke-width", "stroke-dasharray",
                "font-family", "font-size", "font-weight", "text-anchor",
                "opacity", "visibility"
            ];
            
            importantStyles.forEach(prop => {
                const value = computedStyle.getPropertyValue(prop);
                if (value && value !== "initial" && value !== "normal") {
                    styleString += `${prop}: ${value}; `;
                }
            });
            
            if (styleString) {
                element.setAttribute("style", styleString);
            }
        });
    }
    
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
    
    function printChart(svgElement, title = "MintWaterfall Chart") {
        if (!svgElement || svgElement.tagName !== "svg") {
            console.error("MintWaterfall Export: Invalid SVG element provided");
            return;
        }

        try {
            const svgClone = svgElement.cloneNode(true);
            addComputedStyles(svgClone);
            
            const printWindow = window.open("", "_blank");
            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>${title}</title>
                    <style>
                        body { 
                            margin: 0; 
                            padding: 20px; 
                            font-family: Arial, sans-serif; 
                        }
                        .chart-container { 
                            text-align: center; 
                        }
                        svg { 
                            max-width: 100%; 
                            height: auto; 
                        }
                        @media print {
                            body { margin: 0; padding: 10px; }
                            .no-print { display: none; }
                        }
                    </style>
                </head>
                <body>
                    <div class="chart-container">
                        <h1>${title}</h1>
                        ${svgClone.outerHTML}
                        <p class="no-print">
                            <button onclick="window.print()">Print</button>
                            <button onclick="window.close()">Close</button>
                        </p>
                    </div>
                </body>
                </html>
            `);
            
            printWindow.document.close();
            
            // Auto-print after a short delay
            setTimeout(() => {
                printWindow.print();
            }, 500);
            
        } catch (error) {
            console.error("MintWaterfall Export: Error opening print dialog:", error);
        }
    }
    
    return {
        exportAsSVG,
        exportAsPNG,
        exportAsJSON,
        exportAsCSV,
        printChart
    };
}

// Create a global exporter instance
export const exporter = createExporter();
