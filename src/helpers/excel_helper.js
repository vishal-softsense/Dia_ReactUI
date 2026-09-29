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

const getItemVal = (item, ...keys) => {
    if (!item) return "";
    for (const key of keys) {
        if (item[key] !== undefined && item[key] !== null && item[key] !== "") return item[key];
        const camel = key.charAt(0).toLowerCase() + key.slice(1);
        const pascal = key.charAt(0).toUpperCase() + key.slice(1);
        if (item[camel] !== undefined && item[camel] !== null && item[camel] !== "") return item[camel];
        if (item[pascal] !== undefined && item[pascal] !== null && item[pascal] !== "") return item[pascal];
    }
    return "";
};

const stripComma = (val) => String(val ?? "").replace(/,/g, "");

const toNumOrNull = (val) => {
    const n = parseFloat(stripComma(val));
    return Number.isFinite(n) ? n : null;
};

const parseCvdDiam = (diam) => {
    let lVal = "";
    let wVal = "";
    let dVal = "";
    if (!diam || !String(diam).trim()) return { lVal, wVal, dVal };
    try {
        const depthSplit = String(diam).split(/[*xX]/);
        if (depthSplit.length === 2) {
            dVal = depthSplit[1].trim();
            const lwSplit = depthSplit[0].split("-");
            if (lwSplit.length === 2) {
                lVal = lwSplit[0].trim();
                wVal = lwSplit[1].trim();
            } else if (lwSplit.length === 1) {
                lVal = lwSplit[0].trim();
            }
        } else if (depthSplit.length === 3) {
            lVal = depthSplit[0].trim();
            wVal = depthSplit[1].trim();
            dVal = depthSplit[2].trim();
        }
    } catch {
        /* ignore parse errors — match MVC */
    }
    return { lVal, wVal, dVal };
};

const getCvdLocation = (item) => {
    const city = stripComma(getItemVal(item, "City", "city"));
    const country = stripComma(getItemVal(item, "Country", "country"));
    if (city && country) {
        return city.toLowerCase() === country.toLowerCase() ? city : `${city}, ${country}`;
    }
    return country || city || stripComma(getItemVal(item, "Location", "location"));
};

const setHyperlinkCell = (cell, displayText, url) => {
    if (url && String(url).trim()) {
        try {
            cell.value = { text: displayText || String(url), hyperlink: String(url) };
            cell.font = { color: { argb: "FF0000FF" }, underline: true, name: "Calibri", size: 11 };
            return;
        } catch {
            /* fallback below */
        }
    }
    cell.value = displayText && url ? displayText : "";
};

/**
 * MVC StockSearchController.CVDExcelGenerate — CVD Direct Print Excel.
 * @param {Array<object>} items - Stock search result rows
 * @param {string} fileName - Download file name without extension
 */
export const exportCvdExcel = async (items = [], fileName = "SolitaireStock_CVD") => {
    try {
        if (!items.length) return { success: false, error: new Error("No data") };

        const ExcelJS = await loadExcelJS();
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("CVDData");
        worksheet.views = [{ state: "frozen", xSplit: 0, ySplit: 1, topLeftCell: "A2", activePane: "bottomLeft" }];

        const headers = [
            "Serial No", "Cert No", "Image", "Video", "Status", "Location",
            "Lot No", "Shape", "Cts", "Color", "Clarity", "Prop", "Pol",
            "Sym", "Fluo", "Lab", "Rap", "DISC", "RATE", "AMT", "Ratio",
            "W", "L", "D", "TDep", "Tab%", "CH", "CA", "PH", "PA", "Nts",
            "Shade", "EyeClean", "DO #"
        ];

        const headerRow = worksheet.addRow(headers);
        headerRow.font = { bold: true, name: "Calibri", size: 11 };
        headerRow.alignment = { horizontal: "center" };
        headerRow.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFB4C6E7" } // MVC FromArgb(180, 198, 231)
        };

        items.forEach((item, idx) => {
            const diam = stripComma(getItemVal(item, "Diam", "diam"));
            let lVal = stripComma(getItemVal(item, "L"));
            let wVal = stripComma(getItemVal(item, "W"));
            let dVal = stripComma(getItemVal(item, "D"));
            if (!lVal || !wVal || !dVal) {
                const parsed = parseCvdDiam(diam);
                if (!lVal) lVal = parsed.lVal;
                if (!wVal) wVal = parsed.wVal;
                if (!dVal) dVal = parsed.dVal;
            }

            const certNo = stripComma(getItemVal(item, "CNo", "CertNo", "CertificateNo"));
            const certUrl = stripComma(getItemVal(item, "CertPath", "DNAPath"));
            const imgUrl = stripComma(getItemVal(item, "ImagePath", "Image"));
            const videoUrl = stripComma(getItemVal(item, "VideoPath", "Video"));

            const cts = toNumOrNull(getItemVal(item, "Carats", "Cts", "Weight"));
            const rap = toNumOrNull(getItemVal(item, "Rapa", "Rap"));
            const disc = toNumOrNull(getItemVal(item, "AskingBack", "Back", "Disc"));
            const rate = toNumOrNull(getItemVal(item, "AskingRate", "Rate"));
            const amt = toNumOrNull(getItemVal(item, "AskingAmount", "Amount", "AMT"));
            const ratio = toNumOrNull(getItemVal(item, "LW", "Ratio"));
            const wNum = toNumOrNull(wVal);
            const lNum = toNumOrNull(lVal);
            const dNum = toNumOrNull(dVal);
            const tDep = toNumOrNull(getItemVal(item, "TDep", "TotalDepth", "Depth"));
            const tabPer = toNumOrNull(getItemVal(item, "TabPer", "TablePer"));
            const ch = toNumOrNull(getItemVal(item, "CH", "CrownHeight"));
            const ca = toNumOrNull(getItemVal(item, "CA", "CrownAngle"));
            const ph = toNumOrNull(getItemVal(item, "PH", "PavilionDepth"));
            const pa = toNumOrNull(getItemVal(item, "PA", "PavilionAngle"));

            const row = worksheet.addRow([
                idx + 1,
                certNo,
                "",
                "",
                stripComma(getItemVal(item, "CurStatus", "Status")),
                getCvdLocation(item),
                stripComma(getItemVal(item, "LotNo", "StoneNo")),
                stripComma(getItemVal(item, "Shape")),
                cts,
                stripComma(getItemVal(item, "Color")),
                stripComma(getItemVal(item, "Clarity")),
                stripComma(getItemVal(item, "Prop", "Cut")),
                stripComma(getItemVal(item, "Pol", "Polish")),
                stripComma(getItemVal(item, "Sym", "Symmetry")),
                stripComma(getItemVal(item, "FL", "Fluo", "Fluorescence")),
                stripComma(getItemVal(item, "LAB", "Lab")),
                rap,
                disc,
                rate,
                amt,
                ratio,
                wNum ?? wVal,
                lNum ?? lVal,
                dNum ?? dVal,
                tDep,
                tabPer,
                ch,
                ca,
                ph,
                pa,
                stripComma(getItemVal(item, "Nts", "Natts")),
                stripComma(getItemVal(item, "Shade")),
                stripComma(getItemVal(item, "EyeClean")),
                stripComma(getItemVal(item, "DO#", "DO #", "DONo", "DoNo", "OrderNo", "Packet"))
            ]);
            row.alignment = { horizontal: "center" };
            row.font = { name: "Calibri", size: 11 };

            // Cert No hyperlink (col 2)
            if (certUrl) setHyperlinkCell(row.getCell(2), certNo, certUrl);
            // Image / Video (cols 3-4)
            setHyperlinkCell(row.getCell(3), "Image", imgUrl);
            setHyperlinkCell(row.getCell(4), "Video", videoUrl);

            row.getCell(9).numFmt = "0.000";
            row.getCell(17).numFmt = "0.00";
            row.getCell(18).numFmt = "0.00";
            row.getCell(19).numFmt = "0.00";
            row.getCell(20).numFmt = "0.00";
        });

        const lastRow = items.length + 1;
        const totRow = items.length + 2;
        const total = worksheet.getRow(totRow);
        total.getCell(8).value = "Total";
        total.font = { bold: true, name: "Calibri", size: 11 };
        total.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF0F0F0" }
        };
        for (let c = 1; c <= headers.length; c++) {
            const cell = total.getCell(c);
            cell.font = { bold: true, name: "Calibri", size: 11 };
            cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFF0F0F0" }
            };
            cell.border = {
                top: { style: "thin" },
                bottom: { style: "double" }
            };
        }

        // Carats SUM (I), Amount SUM (T), Rate avg = Amount/Carats (S)
        total.getCell(9).value = { formula: `SUM(I2:I${lastRow})` };
        total.getCell(9).numFmt = "0.000";
        total.getCell(19).value = { formula: `IFERROR(ROUND(T${totRow}/I${totRow}, 2), 0)` };
        total.getCell(19).numFmt = "0.00";
        total.getCell(20).value = { formula: `SUM(T2:T${lastRow})` };
        total.getCell(20).numFmt = "0.00";

        worksheet.columns.forEach((column, i) => {
            let maxLen = headers[i] ? String(headers[i]).length : 10;
            column.eachCell({ includeEmpty: true }, (cell) => {
                const val = cell.value;
                const text =
                    val && typeof val === "object" && val.text !== undefined
                        ? String(val.text)
                        : val !== null && val !== undefined
                          ? String(val)
                          : "";
                if (text.length > maxLen) maxLen = text.length;
            });
            column.width = Math.min(maxLen + 3, 40);
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `${fileName}.xlsx`;
        link.click();
        URL.revokeObjectURL(link.href);
        return { success: true };
    } catch (error) {
        console.error("Error exporting CVD Excel:", error);
        return { success: false, error };
    }
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
