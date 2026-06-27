// Helper to dynamically load SheetJS (xlsx) from CDN for Excel parsing/exporting
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

/**
 * Export data to a native Excel (.xlsx) file
 * @param {Array<string>} headers - Array of header strings
 * @param {Array<Array<any>>} rows - 2D array of data rows
 * @param {string} sheetName - Name of the worksheet
 * @param {string} fileName - Name of the file to download (without .xlsx)
 */
export const exportToExcel = async (headers, rows, sheetName = "Sheet1", fileName = "Export") => {
    try {
        const XLSX = await loadXlsx();
        const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
        XLSX.writeFile(workbook, `${fileName}.xlsx`);
        return { success: true };
    } catch (error) {
        console.error("Error exporting to Excel:", error);
        return { success: false, error };
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
