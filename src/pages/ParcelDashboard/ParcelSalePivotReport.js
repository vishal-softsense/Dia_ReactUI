import React, { useEffect, useRef } from "react";

/**
 * Syncfusion PivotView for Parcel Sale Analysis Report.
 * Mirrors MVC initializeSyncfusionPivotSaleParcel & applyHeatmapColors (ParcelSaleChartReports.js).
 * Dynamic heatmap colors calculated per column group matching MVC implementation.
 */
const ParcelSalePivotReport = ({ data = [] }) => {
  const containerRef = useRef(null);
  const pivotRef = useRef(null);
  const heatmapEnabledRef = useRef(false);
  const heatmapListenerRef = useRef(false);

  const STORAGE_KEY = "pivotviewReports_ParcelSaleAnalysis";

  const getEj = () => (typeof window !== "undefined" ? window.ej : null);

  const toNum = (v) => {
    if (v == null || v === "") return 0;
    if (typeof v === "number") return Number.isFinite(v) ? v : 0;
    const n = parseFloat(String(v).replace(/[$,\s]/g, ""));
    return Number.isFinite(n) ? n : 0;
  };

  const toStr = (v) => {
    if (v === null || v === undefined) return null;
    const s = String(v).trim();
    if (s === "" || s.toLowerCase() === "null") return null;
    return s;
  };

  const pick = (item, ...keys) => {
    if (!item) return undefined;
    for (const key of keys) {
      if (item[key] !== undefined && item[key] !== null) return item[key];
      const lk = key.charAt(0).toLowerCase() + key.slice(1);
      if (item[lk] !== undefined && item[lk] !== null) return item[lk];
      const found = Object.keys(item).find(
        (k) => k.toLowerCase() === String(key).toLowerCase()
      );
      if (found !== undefined && item[found] !== undefined && item[found] !== null) {
        return item[found];
      }
    }
    return undefined;
  };

  // Exact MVC initializeSyncfusionPivotSaleParcel mapping (ParcelSaleChartReports.js)
  const normalizeRow = (item) => ({
    ...item,
    Shape: toStr(pick(item, "Shape", "Shp", "shp")),
    Size: toStr(pick(item, "Size", "size")),
    Color: toStr(pick(item, "Color", "Col", "col")),
    Clarity: toStr(pick(item, "Clarity", "Cla", "cla")),
    Pcs: toNum(pick(item, "Pcs", "pcs")),
    Carats: toNum(pick(item, "Carats", "carats")),
    SaleAmtdollar: toNum(
      pick(
        item,
        "SaleAmtdollar",
        "saleAmtdollar",
        "SaleAmt$",
        "saleAmt$",
        "SaleAmt",
        "saleAmt",
        "Amount",
        "amount",
        "SaleAmount",
        "saleAmount"
      )
    ),
    PLdollar: toNum(pick(item, "PLdollar", "pLdollar", "pldollar", "PL", "pl")),
    COGSdollar: toNum(
      pick(item, "COGSdollar", "cOGSdollar", "cogsdollar", "COGS", "cogs", "PurCostdollar")
    ),
    Location: toStr(pick(item, "Location", "location", "Country", "country", "City", "city")),
    PartyLocation: toStr(pick(item, "PartyLocation", "partyLocation")),
    ItemGroupId: toStr(pick(item, "ItemGroupId", "itemGroupId")),
    Sieve: toStr(pick(item, "Sieve", "sieve")),
    LotNo: toStr(pick(item, "LotNo", "lotNo")),
    BoxName: toStr(pick(item, "BoxName", "boxName"))
  });

  const updateHeatmapButtonText = () => {
    const btn = document.querySelector("#heatmapToggle, #parcelSaleHeatmapToggle");
    if (btn) {
      if (heatmapEnabledRef.current) {
        btn.classList.add("e-active");
      } else {
        btn.classList.remove("e-active");
      }
    }
  };

  const resetHeatmapColors = () => {
    const selector =
      "#ParcelSalePivotView td.e-rowcell.e-valuescontent, #ParcelSalePivotView td.e-valuescontent, td.e-rowcell.e-valuescontent";
    document.querySelectorAll(selector).forEach((cell) => {
      cell.style.removeProperty("background-color");
      cell.style.removeProperty("color");
    });
  };

  // Dynamic Heatmap Calculation — Exact MVC Logic (ParcelSaleChartReports.js)
  const applyHeatmapColors = () => {
    const doApply = () => {
      // Get all value cells (matching MVC querySelectorAll('td.e-rowcell.e-valuescontent'))
      const selector =
        "#ParcelSalePivotView td.e-rowcell.e-valuescontent, #ParcelSalePivotView td.e-valuescontent, td.e-rowcell.e-valuescontent";
      const cells = Array.from(document.querySelectorAll(selector)).filter((cell) => {
        const row = cell.closest("tr");
        if (!row) return false;
        // In MVC: !row.classList.contains('e-summary') && !row.textContent.includes('Grand Total')
        // In Syncfusion grid's movable content table, row.textContent only contains cell numbers, not "Grand Total" text.
        // Therefore Grand Total value cells are included in column groups in MVC.
        return !row.classList.contains("e-summary");
      });

      if (cells.length === 0) return;

      // Group cells by column index
      const columnGroups = {};
      cells.forEach((cell) => {
        const colIndex = cell.getAttribute("aria-colindex") || cell.cellIndex;
        if (colIndex !== null && colIndex !== undefined) {
          if (!columnGroups[colIndex]) columnGroups[colIndex] = [];
          columnGroups[colIndex].push(cell);
        }
      });

      // Apply heatmap to each column separately (matching MVC ratio & RGB formula)
      Object.values(columnGroups).forEach((cellGroup) => {
        const values = [];

        cellGroup.forEach((cell) => {
          const span = cell.querySelector("span.e-cellvalue") || cell;
          if (span) {
            const text = (span.textContent || "").trim();
            if (text !== "") {
              const val = parseFloat(text.replace(/[$,]/g, ""));
              if (!isNaN(val)) {
                values.push(val);
              }
            }
          }
        });

        if (values.length === 0) return;

        const min = Math.min(...values);
        const max = Math.max(...values);

        cellGroup.forEach((cell) => {
          const span = cell.querySelector("span.e-cellvalue") || cell;
          if (span) {
            const text = (span.textContent || "").trim();
            if (text !== "") {
              const val = parseFloat(text.replace(/[$,]/g, ""));
              if (!isNaN(val)) {
                // Exact MVC formula: ratio = (val - min) / (max - min)
                // When max === min, (val - min) / 0 yields NaN in MVC, so cell.style.backgroundColor is invalid and left uncolored (white).
                if (max !== min) {
                  const ratio = (val - min) / (max - min);
                  if (!isNaN(ratio)) {
                    const red = 255;
                    const green = Math.round(255 - 255 * ratio);
                    const blue = Math.round(255 - 255 * ratio);
                    const bgColor = `rgb(${red}, ${green}, ${blue})`;

                    cell.style.setProperty("background-color", bgColor, "important");
                    cell.style.setProperty("color", "#000", "important");
                  } else {
                    cell.style.removeProperty("background-color");
                    cell.style.removeProperty("color");
                  }
                } else {
                  cell.style.removeProperty("background-color");
                  cell.style.removeProperty("color");
                }
              } else {
                cell.style.removeProperty("background-color");
                cell.style.removeProperty("color");
              }
            } else {
              cell.style.removeProperty("background-color");
              cell.style.removeProperty("color");
            }
          }
        });
      });
    };

    doApply();
    setTimeout(doApply, 50);
    setTimeout(doApply, 200);
  };

  const setupHeatmapToggle = () => {
    if (heatmapListenerRef.current) return;
    document.addEventListener("click", (e) => {
      const btn = e.target ? e.target.closest("#parcelSaleHeatmapToggle, #heatmapToggle") : null;
      if (btn) {
        heatmapEnabledRef.current = !heatmapEnabledRef.current;
        updateHeatmapButtonText();
        if (heatmapEnabledRef.current) {
          applyHeatmapColors();
        } else {
          resetHeatmapColors();
        }
        if (pivotRef.current) {
          try {
            pivotRef.current.refresh();
          } catch (err) {
            /* ignore */
          }
        }
      }
    });
    heatmapListenerRef.current = true;
  };

  const destroyPivot = () => {
    if (pivotRef.current) {
      try {
        pivotRef.current.destroy();
      } catch (e) {
        /* ignore */
      }
      pivotRef.current = null;
    }
    if (containerRef.current) {
      containerRef.current.innerHTML = "";
    }
  };

  const initPivot = (pivotData, ej) => {
    if (!containerRef.current) return;

    // Map all rows
    const parsed = (pivotData || []).map(normalizeRow);

    if (parsed.length === 0) return;

    // Refresh existing instance
    if (pivotRef.current) {
      try {
        pivotRef.current.setProperties(
          { dataSourceSettings: { dataSource: parsed } },
          true
        );
        pivotRef.current.refresh();
        return;
      } catch (e) {
        destroyPivot();
      }
    }

    const pivot = new ej.pivotview.PivotView({
      dataSourceSettings: {
        dataSource: parsed,
        expandAll: false,
        columns: [
          { name: "Clarity", caption: "Clarity" },
          { name: "Size", caption: "Size" }
        ],
        rows: [
          { name: "Color", caption: "Color" },
          { name: "Shape", caption: "Shape" }
        ],
        values: [
          { name: "Pcs", caption: "Pcs" },
          { name: "Carats", caption: "Carats" },
          { name: "SaleAmtdollar", caption: "SaleAmt$" }
        ],
        formatSettings: [
          { name: "Pcs", format: "N0" },
          { name: "Carats", format: "N2" },
          { name: "SaleAmtdollar", format: "N2" }
        ],
        filters: [],
        showGrandTotals: true,
        showSubTotals: true
      },
      toolbar: [
        "New",
        "Save",
        "SaveAs",
        "Rename",
        "Remove",
        "Load",
        "Grid",
        {
          template:
            '<button id="heatmapToggle" class="e-btn e-flat" style="font-weight:600;letter-spacing:0.3px;">HEATMAP</button>'
        },
        "Chart",
        "Export",
        "SubTotal",
        "GrandTotal",
        "Formatting",
        "FieldList"
      ],
      dataBound: () => {
        updateHeatmapButtonText();
        if (heatmapEnabledRef.current) {
          applyHeatmapColors();
        } else {
          resetHeatmapColors();
        }
      },
      toolbarRender: (args) => {
        args.customToolbar.splice(6, 0, { type: "Separator" });
        args.customToolbar.splice(9, 0, { type: "Separator" });
      },
      allowExcelExport: true,
      allowPdfExport: true,
      allowConditionalFormatting: true,
      allowNumberFormatting: true,
      allowCalculatedField: true,
      allowDeferLayoutUpdate: true,
      allowDrillThrough: true,
      allowGrouping: true,
      enableVirtualization: false,
      enableValueSorting: true,
      enableFieldSearching: true,
      showToolbar: true,
      showTooltip: true,
      width: "100%",
      height: 630,
      showFieldList: true,
      showGroupingBar: true,
      displayOption: { view: "Both" },
      exportAllPages: false,
      maxNodeLimitInMemberEditor: 50,
      gridSettings: {
        columnWidth: 120,
        rowHeight: 36,
        allowSelection: true,
        selectionSettings: {
          mode: "Cell",
          type: "Single",
          cellSelectionMode: "Box"
        },
        excelQueryCellInfo: (args) => {
          if (
            args.cell &&
            args.cell.axis === "value" &&
            args.cell.value === undefined
          ) {
            args.style.numberFormat = undefined;
          }
        }
      },
      chartSettings: {
        title: "Parcel Sale Analysis Report",
        chartSeries: { type: "Column" },
        primaryYAxis: { border: { width: 0 } },
        load: (args) => {
          const theme = window.location.hash.split("/")[1] || "Material";
          args.chart.theme =
            theme.charAt(0).toUpperCase() +
            theme
              .slice(1)
              .replace(/-dark/i, "Dark")
              .replace(/contrast/i, "Contrast");
        }
      },
      chartSeriesCreated: () => {
        if (pivotRef.current) {
          pivotRef.current.chartSettings.chartSeries.legendShape =
            pivotRef.current.chartSettings.chartSeries.type === "Polar"
              ? "Rectangle"
              : "SeriesType";
        }
      },
      beforeExport: (args) => {
        args.fileName = "Parcel Sale Analysis Report";
      },
      saveReport: (args) => {
        const reports = JSON.parse(localStorage[STORAGE_KEY] || "[]");
        if (args.report && args.reportName !== "") {
          const report = JSON.parse(args.report);
          report.dataSourceSettings.dataSource = [];
          report.pivotValues = [];
          args.report = JSON.stringify(report);
          const index = reports.findIndex(
            (r) => r.reportName === args.reportName
          );
          if (index !== -1) reports[index].report = args.report;
          else reports.push(args);
          localStorage[STORAGE_KEY] = JSON.stringify(reports);
        }
      },
      fetchReport: (args) => {
        const reports = JSON.parse(localStorage[STORAGE_KEY] || "[]");
        args.reportName = reports.map((r) => r.reportName);
      },
      loadReport: (args) => {
        const reports = JSON.parse(localStorage[STORAGE_KEY] || "[]");
        const item = reports.find((r) => r.reportName === args.reportName);
        if (item && pivotRef.current) {
          const report = JSON.parse(item.report);
          report.dataSourceSettings.dataSource =
            pivotRef.current.dataSourceSettings.dataSource;
          pivotRef.current.dataSourceSettings = report.dataSourceSettings;
        }
      },
      removeReport: (args) => {
        let reports = JSON.parse(localStorage[STORAGE_KEY] || "[]");
        reports = reports.filter((r) => r.reportName !== args.reportName);
        localStorage[STORAGE_KEY] = JSON.stringify(reports);
      },
      renameReport: (args) => {
        const reports = JSON.parse(localStorage[STORAGE_KEY] || "[]");
        const index = reports.findIndex(
          (r) => r.reportName === args.reportName
        );
        if (index !== -1) reports[index].reportName = args.rename;
        localStorage[STORAGE_KEY] = JSON.stringify(reports);
      },
      newReport: () => {
        if (pivotRef.current) {
          pivotRef.current.setProperties(
            {
              dataSourceSettings: {
                columns: [],
                rows: [],
                values: [],
                filters: []
              }
            },
            false
          );
        }
      }
    });

    pivot.appendTo(containerRef.current);
    pivotRef.current = pivot;
    setupHeatmapToggle();
  };

  useEffect(() => {
    const ej = getEj();
    if (!ej?.pivotview?.PivotView) {
      console.error("Syncfusion ej.pivotview is not loaded. Check CDN in index.html.");
      return undefined;
    }
    if (!data || data.length === 0) return undefined;

    const timer = setTimeout(() => {
      initPivot(data, ej);
    }, 50);

    return () => {
      clearTimeout(timer);
      destroyPivot();
    };
  }, [data]);

  return (
    <div className="parcel-sale-pivot-control-section">
      <style>{`
        .parcel-sale-pivot-control-section {
          width: 100%;
          background: #fff;
          min-height: 255px;
          border: 1px solid #e9ebec;
          border-radius: 4px;
          overflow: hidden;
        }
        .parcel-sale-pivot-content-wrapper {
          width: 100%;
          padding: 4px 0 8px;
          background: #fff;
          overflow-x: auto;
        }
        #ParcelSalePivotView {
          width: 100% !important;
        }
        #ParcelSalePivotView .e-pivotview .e-stackedheadertext,
        #ParcelSalePivotView .e-pivotview .e-headertext {
          font-weight: 700 !important;
          color: #343a40 !important;
        }
        #ParcelSalePivotView .e-pivotview .e-rowsheader .e-cellvalue {
          font-weight: 700 !important;
          color: #343a40 !important;
        }
        #ParcelSalePivotView .e-pivot-button {
          border-radius: 4px !important;
        }
        #ParcelSalePivotView .e-pivotview .e-valuescontent {
          text-align: right;
        }
        #ParcelSalePivotView .e-frozencontent,
        #ParcelSalePivotView .e-movablecontent {
          border-top: 0 !important;
          margin-top: 0 !important;
          padding-top: 0 !important;
        }
        #ParcelSalePivotView .e-gridheader table,
        #ParcelSalePivotView .e-frozenheader table,
        #ParcelSalePivotView .e-movableheader table {
          border-collapse: collapse !important;
          margin-bottom: 0 !important;
        }
        #ParcelSalePivotView .e-toolbar {
          border-bottom: 1px solid #e0e0e0;
          background: #fafafa;
        }
        #ParcelSalePivotView .e-grouping-bar {
          background: #fff;
        }
        #ParcelSalePivotView tr.e-gtot td.e-valuescontent,
        #ParcelSalePivotView tr.e-summary td.e-valuescontent {
          font-weight: 700 !important;
        }
        #ParcelSalePivotView td.e-gtot,
        #ParcelSalePivotView th.e-gtot {
          background-color: #f4f4f4;
          color: #212529;
        }
        #ParcelSalePivotView tr.e-gtot td.e-gtot,
        #ParcelSalePivotView tr.e-summary td.e-gtot,
        #ParcelSalePivotView .e-movablecontent tr.e-gtot td.e-gtot,
        #ParcelSalePivotView .e-gridcontent tr.e-gtot td.e-gtot,
        #ParcelSalePivotView .e-frozencontent tr.e-gtot td.e-gtot {
          font-weight: 700 !important;
          color: #000000;
          text-align: right !important;
        }
        #heatmapToggle,
        #parcelSaleHeatmapToggle {
          height: 28px;
          line-height: 26px;
          padding: 0 10px;
          font-size: 12px;
        }
      `}</style>
      <div className="parcel-sale-pivot-content-wrapper">
        <div ref={containerRef} id="ParcelSalePivotView" />
      </div>
    </div>
  );
};

export default ParcelSalePivotReport;
