// Helper to dynamically load SheetJS (xlsx) from CDN for Excel reading/parsing
export const loadXlsx = () => {
    return new Promise((resolve, reject) => {
        if (window.XLSX) {
            resolve(window.XLSX);
            return;
        }
        const script = document.createElement("script");
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.17.1/xlsx.full.min.js";
        script.async = true;
        script.onload = () => resolve(window.XLSX);
        script.onerror = () => reject(new Error("Failed to load Excel parser library"));
        document.body.appendChild(script);
    });
};

// Helper to dynamically load ExcelJS from CDN for premium styled Excel exports (with real sticky headers)
export const loadExcelJS = () => {
    return new Promise((resolve, reject) => {
        if (window.ExcelJS) {
            resolve(window.ExcelJS);
            return;
        }
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js";
        script.async = true;
        script.onload = () => resolve(window.ExcelJS);
        script.onerror = () => reject(new Error("Failed to load Excel exporter library"));
        document.body.appendChild(script);
    });
};

/**
 * Export data to a native Excel (.xlsx) file using ExcelJS
 * @param {Array<string>} headers - Array of header strings
 * @param {Array<Array<any>>} rows - 2D array of data rows
 * @param {string} sheetName - Name of the worksheet
 * @param {string} fileName - Name of the file to download (without .xlsx)
 */
export const exportToExcel = async (headers, rows, sheetName = "Sheet1", fileName = "Export") => {
    try {
        const ExcelJS = await loadExcelJS();
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(sheetName);

        // Add headers and rows
        worksheet.addRow(headers);
        rows.forEach(row => worksheet.addRow(row));

        // Auto-fit column widths
        worksheet.columns.forEach((column, i) => {
            let maxLen = headers[i] ? String(headers[i]).length : 10;
            column.eachCell({ includeEmpty: true }, cell => {
                const val = cell.value;
                const valLen = (val !== null && val !== undefined) ? String(val).length : 0;
                if (valLen > maxLen) {
                    maxLen = valLen;
                }
            });
            column.width = maxLen + 3; // Max length plus safety padding
        });

        // Format headers with bold font and light gray fill
        const headerRow = worksheet.getRow(1);
        headerRow.font = { bold: true, name: "Calibri", size: 11 };
        headerRow.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFEAEAEA" }
        };

        // Freeze first row (make header sticky)
        worksheet.views = [
            { state: "frozen", xSplit: 0, ySplit: 1, topLeftCell: "A2", activePane: "bottomLeft" }
        ];

        // Write the file to the browser
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `${fileName}.xlsx`;
        link.click();
        URL.revokeObjectURL(link.href);
        return { success: true };
    } catch (error) {
        console.error("Error exporting to Excel:", error);
        return { success: false, error };
    }
};

/**
 * Generate Excel workbook in base64 string format using ExcelJS
 * @param {Array<string>} headers - Array of header strings
 * @param {Array<Array<any>>} rows - 2D array of data rows
 * @param {string} sheetName - Name of the worksheet
 * @returns {Promise<string|null>} - Base64 encoded string of the .xlsx file
 */
export const getExcelBase64 = async (headers, rows, sheetName = "Sheet1") => {
    try {
        const ExcelJS = await loadExcelJS();
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(sheetName);

        // Add headers and rows
        worksheet.addRow(headers);
        rows.forEach(row => worksheet.addRow(row));

        // Auto-fit column widths
        worksheet.columns.forEach((column, i) => {
            let maxLen = headers[i] ? String(headers[i]).length : 10;
            column.eachCell({ includeEmpty: true }, cell => {
                const val = cell.value;
                const valLen = (val !== null && val !== undefined) ? String(val).length : 0;
                if (valLen > maxLen) {
                    maxLen = valLen;
                }
            });
            column.width = maxLen + 3;
        });

        // Format headers with bold font and light gray fill
        const headerRow = worksheet.getRow(1);
        headerRow.font = { bold: true, name: "Calibri", size: 11 };
        headerRow.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFEAEAEA" }
        };

        // Freeze first row (make header sticky)
        worksheet.views = [
            { state: "frozen", xSplit: 0, ySplit: 1, topLeftCell: "A2", activePane: "bottomLeft" }
        ];

        const buffer = await workbook.xlsx.writeBuffer();
        
        // Convert ArrayBuffer to Base64 in a browser-safe way
        let binary = "";
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        const base64 = window.btoa(binary);
        return base64;
    } catch (error) {
        console.error("Error generating Excel base64:", error);
        return null;
    }
};

/**
 * Parse an uploaded Excel file (.xlsx, .xls) and return its rows
 * @param {File} file - The file object from the input element
 * @returns {Promise<{success: boolean, rows?: Array<Array<any>>, error?: any}>}
 */
export const parseExcelFile = async (file, expectedHeaders = null) => {
    try {
        const XLSX = await loadXlsx();
        const arrayBuffer = await file.arrayBuffer();
        const data = new Uint8Array(arrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (expectedHeaders && expectedHeaders.length > 0) {
            if (!rows || rows.length === 0) {
                return { success: false, error: new Error("The selected file contains no data.") };
            }
            const importedHeaders = rows[0] ? rows[0].map(h => String(h || "").trim().toLowerCase()) : [];
            const matches = expectedHeaders.every((h, idx) => {
                return importedHeaders[idx] === h.trim().toLowerCase();
            });
            if (!matches) {
                return { success: false, error: new Error("Invalid Excel format. The headers do not match the expected template.") };
            }
        }

        return { success: true, rows };
    } catch (error) {
        console.error("Error parsing Excel file:", error);
        return { success: false, error };
    }
};
