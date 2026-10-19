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

const isPresentVal = (v) => v !== undefined && v !== null && v !== "";

/**
 * Resolve row field across PascalCase / camelCase / acronym keys
 * (FLId↔flId, MRP↔mrp, Brokerper↔brokerper).
 * Prefers the first non-empty match among all case variants of each key.
 */
const getItemVal = (item, ...keys) => {
    if (!item) return "";
    const itemKeys = Object.keys(item);
    for (const key of keys) {
        if (!key) continue;

        const candidates = [key, key.charAt(0).toLowerCase() + key.slice(1), key.charAt(0).toUpperCase() + key.slice(1)];
        for (const c of candidates) {
            if (isPresentVal(item[c])) return item[c];
        }

        const lower = String(key).toLowerCase();
        for (const k of itemKeys) {
            if (k.toLowerCase() === lower && isPresentVal(item[k])) return item[k];
        }
    }
    return "";
};

const stripComma = (val) => String(val ?? "").replace(/,/g, "");

const toNumOrNull = (val) => {
    const n = parseFloat(stripComma(val));
    return Number.isFinite(n) ? n : null;
};

/** First finite numeric among aliases; skips empty/missing (keeps 0). */
const getItemNum = (item, ...keys) => {
    for (const key of keys) {
        const v = getItemVal(item, key);
        if (v === "" || v === null || v === undefined) continue;
        const n = toNumOrNull(v);
        if (n !== null) return n;
    }
    return null;
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
 * Growth column: if LABComments has `(...)`, show only the last bracketed value;
 * otherwise keep the full original text. Null/empty → "".
 * e.g. "... CVD growth process (CVD)" → "CVD"; no brackets → full string.
 */
const extractGrowthAbbrev = (raw) => {
    if (raw == null) return "";
    const text = String(raw).trim();
    if (!text) return "";
    const matches = [...text.matchAll(/\(([^)]+)\)/g)];
    if (matches.length > 0) {
        const inside = String(matches[matches.length - 1][1] || "").trim();
        return inside || text;
    }
    return text;
};

/**
 * MVC ReportController.SolitairePurchaseExcelGenerate — "Solitaire Purchase Report Print" (SPR).
 * @param {Array<object>} items - Purchase report rows from GetPurchaseReportData
 * @param {string} fileName - Download file name without extension
 */
export const exportSolitairePurchaseReportExcel = async (items = [], fileName = "SolitairePurchaseReport") => {
    try {
        if (!items.length) return { success: false, error: new Error("No data") };

        const ExcelJS = await loadExcelJS();
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("SolitairePurchaseReport");
        worksheet.views = [{ state: "frozen", xSplit: 0, ySplit: 1, topLeftCell: "A2", activePane: "bottomLeft" }];

        const headers = [
            "Report No.", "Client Ref", "Shape", "Size", "Color", "Clarity", "Cut", "Polish", "Sym", "Floro",
            "Lab", "Growth", "Length", "Width", "Depth", "Depth %", "Table %", "Rap Price ($)", "Disc ($)", "Rate ($)",
            "Final Amount ($)", "RATE", "TERMS", "TERMS2", "PRICE/CT", "NETT $", "PRICE/CT RS", "AMOUNT RS.", "BROKERAGE", "FINAL AMT $",
            "FINAL AMOUNT RS", "DAYS Int", "NETT FINAL AMOUNT $", "NETT FINAL AMOUNT Rs.", "DAYS", "COMPANY", "BROKER", "BILL", "DATE", "Inv Descriptions"
        ];

        const headerRow = worksheet.addRow(headers);
        headerRow.font = { bold: true, name: "Arial", size: 10 };
        headerRow.alignment = { horizontal: "center" };

        const getCol = (row, ...keys) => {
            const v = getItemVal(row, ...keys);
            return v === null || v === undefined ? "" : String(v);
        };

        const setNumCell = (cell, raw, decimals) => {
            const n = toNumOrNull(raw);
            if (n !== null) {
                cell.value = Number(n.toFixed(decimals));
                cell.numFmt = decimals === 3 ? "0.000" : "0.00";
            } else if (raw !== null && raw !== undefined && String(raw).trim() !== "") {
                cell.value = String(raw);
            } else {
                cell.value = "";
            }
            cell.alignment = { horizontal: "center" };
            cell.font = { name: "Arial", size: 10 };
        };

        items.forEach((row) => {
            const excelRow = worksheet.addRow(new Array(headers.length).fill(""));
            excelRow.alignment = { horizontal: "center" };
            excelRow.font = { name: "Arial", size: 10 };

            excelRow.getCell(1).value = getCol(row, "CertificateNo", "CertNo", "ReportNo");
            excelRow.getCell(2).value = getCol(row, "MfgSeriesID", "ClientRef");
            excelRow.getCell(3).value = getCol(row, "ShapeId", "Shapeid", "Shape","shp");
            // Size = SizeId (size grade from report row)
            excelRow.getCell(4).value = getCol(row, "SizeId", "sizeId", "Sizeid", "SizeID");
            excelRow.getCell(5).value = getCol(row, "ColorId", "colorid", "Color");
            excelRow.getCell(6).value = getCol(row, "ClarityId", "clarityid", "Clarity");
            excelRow.getCell(7).value = getCol(row, "PropId", "Cut", "Proportion");
            excelRow.getCell(8).value = getCol(row, "PolishId", "Polish");
            excelRow.getCell(9).value = getCol(row, "SymId", "Sym");
            // Floro — same fields as grid FL / PurchaseReport Print (FLId / flId)
            excelRow.getCell(10).value = getCol(row, "FLId", "flId", "Floro", "FL", "Fluorescence");
            excelRow.getCell(11).value = getCol(row, "Cert", "cert", "Lab", "LAB");
            // Growth — MVC source LABComments (fallback RoughId); print only bracketed abbrev e.g. (CVD) → CVD
            excelRow.getCell(12).value = extractGrowthAbbrev(
                getCol(row, "LABComments", "LabComments", "labComments", "RoughId")
            );
            excelRow.getCell(13).value = getCol(row, "Length", "L", "Dia");
            excelRow.getCell(14).value = getCol(row, "Width", "W");

            setNumCell(excelRow.getCell(15), getCol(row, "Depth", "D", "TotDepth"), 2);
            setNumCell(excelRow.getCell(16), getCol(row, "TotDepth", "TotalDepthPer", "T.Dep.", "DepthPer", "Depth%"), 2);
            excelRow.getCell(17).value = getCol(row, "TablePer", "Tab.", "Table");

            // Rap Price ($) — MRP / mrp (PurchaseReport Print aliases)
            const rapPrice = getItemNum(row, "MRP", "mrp", "RapPrice", "PurchaseMRP");
            setNumCell(excelRow.getCell(18), rapPrice !== null ? rapPrice : getCol(row, "MRP", "mrp", "RapPrice"), 2);
            setNumCell(excelRow.getCell(19), getCol(row, "Discount", "Disc"), 2);
            setNumCell(excelRow.getCell(20), getCol(row, "StockCurrencyRate", "rate", "Rate"), 2);
            setNumCell(excelRow.getCell(21), getCol(row, "StockCurrencyAmount", "Amount", "amount"), 2);
            setNumCell(excelRow.getCell(22), getCol(row, "DRate", "MasterCurrencyRate", "RATE"), 2);

            excelRow.getCell(23).value = getCol(row, "Due", "TERMS", "Term");
            excelRow.getCell(24).value = getCol(row, "Less2", "TERMS2");

            setNumCell(excelRow.getCell(25), getCol(row, "rate", "Rate", "StockCurrencyRate"), 2);
            setNumCell(excelRow.getCell(26), getCol(row, "Amount", "amount", "StockCurrencyAmount"), 2);
            setNumCell(excelRow.getCell(27), getCol(row, "MasterCurrencyRate"), 2);
            setNumCell(excelRow.getCell(28), getCol(row, "MasterCurrencyAmount"), 2);

            // BROKERAGE = brokeramount
            const brokerageNum = getItemNum(row, "brokeramount", "BrokerAmount", "brokerAmount");
            if (brokerageNum !== null) {
                setNumCell(excelRow.getCell(29), brokerageNum, 2);
            } else {
                excelRow.getCell(29).value = getCol(row, "brokeramount", "BrokerAmount", "brokerAmount");
            }

            setNumCell(excelRow.getCell(30), getCol(row, "StockCurrencyAmount", "Amount", "amount"), 2);
            setNumCell(excelRow.getCell(31), getCol(row, "MasterCurrencyAmount"), 2);
            excelRow.getCell(32).value = getCol(row, "Due", "Days", "DAYS Int");
            setNumCell(excelRow.getCell(33), getCol(row, "StockCurrencyAmount", "Amount", "amount"), 2);
            setNumCell(excelRow.getCell(34), getCol(row, "MasterCurrencyAmount"), 2);
            excelRow.getCell(35).value = getCol(row, "Due", "Days");
            excelRow.getCell(36).value = getCol(row, "Party", "COMPANY", "Company");
            excelRow.getCell(37).value = getCol(row, "Broker", "BROKER");
            excelRow.getCell(38).value = getCol(row, "BillNo", "Billno", "InvNo", "Invno");
            excelRow.getCell(39).value = getCol(row, "ConDATE", "Date", "DATE");
            excelRow.getCell(40).value = getCol(row, "Remarks");
        });

        const lastDataRow = items.length + 1;
        const totalRowNum = items.length + 2;
        const total = worksheet.getRow(totalRowNum);
        total.font = { bold: true, name: "Arial", size: 10 };

        total.getCell(1).value = { formula: `"Total: " & COUNTA(B2:B${lastDataRow})` };
        // Size is SizeId (text grade) — do not SUM
        total.getCell(21).value = { formula: `SUM(U2:U${lastDataRow})` };
        total.getCell(21).numFmt = "0.00";
        total.getCell(26).value = { formula: `SUM(Z2:Z${lastDataRow})` };
        total.getCell(26).numFmt = "0.00";
        total.getCell(28).value = { formula: `SUM(AB2:AB${lastDataRow})` };
        total.getCell(28).numFmt = "0.00";
        total.getCell(30).value = { formula: `SUM(AD2:AD${lastDataRow})` };
        total.getCell(30).numFmt = "0.00";
        total.getCell(31).value = { formula: `SUM(AE2:AE${lastDataRow})` };
        total.getCell(31).numFmt = "0.00";
        total.getCell(33).value = { formula: `SUM(AG2:AG${lastDataRow})` };
        total.getCell(33).numFmt = "0.00";
        total.getCell(34).value = { formula: `SUM(AH2:AH${lastDataRow})` };
        total.getCell(34).numFmt = "0.00";

        for (let c = 1; c <= headers.length; c++) {
            total.getCell(c).font = { bold: true, name: "Arial", size: 10 };
            worksheet.getColumn(c).width = 14;
        }

        worksheet.columns.forEach((column, i) => {
            let maxLen = headers[i] ? String(headers[i]).length : 10;
            column.eachCell({ includeEmpty: true }, (cell) => {
                const val = cell.value;
                const text =
                    val && typeof val === "object" && val.formula !== undefined
                        ? String(val.formula)
                        : val !== null && val !== undefined
                            ? String(val)
                            : "";
                if (text.length > maxLen) maxLen = text.length;
            });
            column.width = Math.min(Math.max(maxLen + 2, 12), 28);
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
        console.error("Error exporting Solitaire Purchase Report Excel:", error);
        return { success: false, error };
    }
};

/**
 * Solitaire Purchase Report — "Export Report" (9-column commercial layout).
 * Columns: SR.NO. | DESCRIPTION OF GOODS | CERTIFICATE & LAB | GROWTH | STOCK ID | PCS | CARAT | RATE$ | TOTAL$
 * @param {Array<object>} items - Purchase report rows from GetPurchaseReportData
 * @param {string} fileName - Download file name without extension
 */
export const exportSolitairePurchaseExportReportExcel = async (items = [], fileName = "ExportReport") => {
    try {
        if (!items.length) return { success: false, error: new Error("No data") };

        const ExcelJS = await loadExcelJS();
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("ExportReport");
        worksheet.views = [{ state: "frozen", xSplit: 0, ySplit: 1, topLeftCell: "A2", activePane: "bottomLeft" }];

        const headers = [
            "SR.NO.",
            "DESCRIPTION OF GOODS",
            "CERTIFICATE & LAB",
            "GROWTH",
            "STOCK ID",
            "PCS",
            "CARAT",
            "RATE$",
            "TOTAL$"
        ];

        const thinBorder = {
            top: { style: "thin", color: { argb: "FF000000" } },
            left: { style: "thin", color: { argb: "FF000000" } },
            bottom: { style: "thin", color: { argb: "FF000000" } },
            right: { style: "thin", color: { argb: "FF000000" } }
        };

        const headerRow = worksheet.addRow(headers);
        headerRow.font = { bold: true, name: "Calibri", size: 11 };
        headerRow.alignment = { horizontal: "center", vertical: "middle" };
        headerRow.eachCell((cell) => {
            cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFBFBFBF" }
            };
            cell.border = thinBorder;
        });

        const getCol = (row, ...keys) => {
            const v = getItemVal(row, ...keys);
            return v === null || v === undefined ? "" : String(v).trim();
        };

        items.forEach((row, index) => {
            const certNo = getCol(row, "CertificateNo", "certificateNo", "CertNo");
            const lab = getCol(row, "Cert", "cert", "Lab", "LAB");
            const certAndLab = [certNo, lab].filter(Boolean).join(" ");

            const growth = extractGrowthAbbrev(
                getCol(row, "LABComments", "LabComments", "labComments", "RoughId")
            );

            const caratNum = getItemNum(row, "Carats", "Cts", "Weight");
            const rateNum = getItemNum(row, "Rate", "rate");
            const totalNum = getItemNum(row, "Amount", "amount");

            const excelRow = worksheet.addRow([
                index + 1,
                getCol(row, "ItemName", "itemName"),
                certAndLab,
                growth,
                getCol(row, "Item", "item"),
                "1 PC",
                caratNum !== null ? Number(caratNum.toFixed(2)) : "",
                rateNum !== null ? Number(rateNum.toFixed(2)) : "",
                totalNum !== null ? Number(totalNum.toFixed(2)) : ""
            ]);

            excelRow.font = { name: "Calibri", size: 11 };
            excelRow.eachCell({ includeEmpty: true }, (cell) => {
                cell.border = thinBorder;
                cell.alignment = { horizontal: "center", vertical: "middle" };
            });

            if (caratNum !== null) excelRow.getCell(7).numFmt = "0.00";
            if (rateNum !== null) excelRow.getCell(8).numFmt = "0.00";
            if (totalNum !== null) excelRow.getCell(9).numFmt = "0.00";
        });

        // Suitable widths matching the commercial layout (DESCRIPTION / CERTIFICATE wide)
        const widths = [8, 36, 22, 12, 14, 10, 10, 12, 12];
        widths.forEach((w, i) => {
            worksheet.getColumn(i + 1).width = w;
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
        console.error("Error exporting Solitaire Purchase Export Report Excel:", error);
        return { success: false, error };
    }
};

/**
 * MVC ReportController.PurchaseExcelGenerate — "PurchaseReport Print" (PR).
 * @param {Array<object>} items - Purchase report rows
 * @param {string} fileName - Download file name without extension
 */
export const exportPurchaseReportPrintExcel = async (items = [], fileName = "PurchaseReportList") => {
    try {
        if (!items.length) return { success: false, error: new Error("No data") };

        const ExcelJS = await loadExcelJS();
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("GetPurchaseReportData");
        worksheet.views = [{ state: "frozen", xSplit: 0, ySplit: 1, topLeftCell: "A2", activePane: "bottomLeft" }];

        const headers = [
            "Pur inv", "Bill No", "Date", "Days", "Party", "LotId", "ItemName", "Carats",
            "MRP", "Back", "Rate", "Amount", "Cert.", "Cert.No.", "Shp.", "Size",
            "Col.", "Cla.", "Cut", "Sym", "Polish", "Dia.", "T.Dep.", "Tab.",
            "FL", "EXPORT NO", "REMARKS"
        ];

        const headerRow = worksheet.addRow(headers);
        headerRow.font = { bold: true, name: "Arial", size: 10 };
        headerRow.alignment = { horizontal: "center" };

        items.forEach((row) => {
            const carats = toNumOrNull(getItemVal(row, "Carats", "carats"));
            const discount = toNumOrNull(getItemVal(row, "Discount", "discount"));
            const rate = toNumOrNull(getItemVal(row, "Rate", "rate"));
            const amount = toNumOrNull(getItemVal(row, "Amount", "amount"));

            const excelRow = worksheet.addRow([
                getItemVal(row, "Invno", "InvNo", "invno"),
                getItemVal(row, "BillNo", "Billno", "billNo"),
                getItemVal(row, "ConDATE", "Date", "conDATE"),
                "",
                getItemVal(row, "Party", "party"),
                getItemVal(row, "Item", "item"),
                getItemVal(row, "ItemName", "itemName"),
                carats,
                getItemVal(row, "MRP", "mrp"),
                discount,
                rate,
                amount,
                getItemVal(row, "Cert", "cert"),
                getItemVal(row, "CertificateNo", "certificateNo"),
                getItemVal(row, "ShapeId", "Shapeid", "shapeId"),
                getItemVal(row, "Size", "SizeId", "sizeId"),
                getItemVal(row, "ColorId", "colorid", "colorId"),
                getItemVal(row, "ClarityId", "clarityid", "clarityId"),
                getItemVal(row, "PropId", "Cut", "propId"),
                getItemVal(row, "SymId", "symId"),
                getItemVal(row, "PolishId", "polishId"),
                getItemVal(row, "Dia", "dia"),
                getItemVal(row, "TotDepth", "totDepth"),
                getItemVal(row, "TablePer", "tablePer"),
                getItemVal(row, "FLId", "flId"),
                getItemVal(row, "ExportNo", "exportNo"),
                getItemVal(row, "Remarks", "remarks")
            ]);
            excelRow.alignment = { horizontal: "center" };
            excelRow.font = { name: "Arial", size: 10 };
            if (carats !== null) excelRow.getCell(8).numFmt = "0.000";
            if (discount !== null) excelRow.getCell(10).numFmt = "0.00";
            if (rate !== null) excelRow.getCell(11).numFmt = "0.00";
            if (amount !== null) excelRow.getCell(12).numFmt = "0.00";
        });

        const lastDataRow = items.length + 1;
        const totalRowNum = items.length + 2;
        const total = worksheet.getRow(totalRowNum);
        total.font = { bold: true, name: "Arial", size: 10 };
        total.getCell(1).value = { formula: `"Total: " & COUNTA(B2:B${lastDataRow})` };
        total.getCell(8).value = { formula: `SUM(H2:H${lastDataRow})` };
        total.getCell(8).numFmt = "0.000";
        total.getCell(8).alignment = { horizontal: "right" };
        total.getCell(11).value = { formula: `IFERROR(L${totalRowNum}/H${totalRowNum},0)` };
        total.getCell(11).numFmt = "0.00";
        total.getCell(11).alignment = { horizontal: "right" };
        total.getCell(12).value = { formula: `SUM(L2:L${lastDataRow})` };
        total.getCell(12).numFmt = "0.00";
        total.getCell(12).alignment = { horizontal: "right" };

        worksheet.columns.forEach((column, i) => {
            let maxLen = headers[i] ? String(headers[i]).length : 10;
            column.eachCell({ includeEmpty: true }, (cell) => {
                const val = cell.value;
                const text =
                    val && typeof val === "object" && val.formula !== undefined
                        ? String(val.formula)
                        : val !== null && val !== undefined
                            ? String(val)
                            : "";
                if (text.length > maxLen) maxLen = text.length;
            });
            column.width = Math.min(Math.max(maxLen + 2, 12), 22);
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
        console.error("Error exporting Purchase Report Print Excel:", error);
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
