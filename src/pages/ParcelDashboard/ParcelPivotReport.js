import React, { useEffect, useRef } from "react";

const ParcelPivotReport = ({ data = [] }) => {
  const containerRef = useRef(null);
  const pivotRef = useRef(null);
  const heatmapEnabledRef = useRef(false);
  const heatmapListenerRef = useRef(false);

  const STORAGE_KEY = "pivotviewReports_ParcelStockAnalysis";

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

  const normalizeRow = (item) => ({
    ...item,
    Shape: toStr(pick(item, "Shape", "Shp")),
    Size: toStr(pick(item, "Size")),
    Color: toStr(pick(item, "Color", "Col")),
    Clarity: toStr(pick(item, "Clarity", "Cla")),
    Pcs: toNum(pick(item, "Pcs")),
    Carats: toNum(pick(item, "Carats", "carats")),
    Amount: toNum(pick(item, "Amount")),
    Location: toStr(pick(item, "Location", "Country", "City")),
    ItemGroupId: toStr(pick(item, "ItemGroupId")),
    Sieve: toStr(pick(item, "Sieve")),
    LotNo: toStr(pick(item, "LotNo")),
    BoxName: toStr(pick(item, "BoxName")),
    Rate: toNum(pick(item, "Rate")),
    Back: toNum(pick(item, "Back")),
    AskingRate: toNum(pick(item, "AskingRate")),
    AskingBack: toNum(pick(item, "AskingBack")),
    AskingAmount: toNum(pick(item, "AskingAmount")),
    MRPAmount: toNum(pick(item, "MRPAmount")),
    PurChaseAmount: toNum(pick(item, "PurChaseAmount"))
  });

  const updateHeatmapButtonText = () => {
    const btn = document.querySelector("#heatmapToggle, #parcelHeatmapToggle");
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
      "#ParcelPivotView td.e-rowcell.e-valuescontent, #ParcelPivotView td.e-valuescontent, td.e-rowcell.e-valuescontent";
    document.querySelectorAll(selector).forEach((cell) => {
      cell.style.removeProperty("background-color");
      cell.style.removeProperty("color");
    });
  };

  const applyHeatmapColors = () => {
    const doApply = () => {
      const selector =
        "#ParcelPivotView td.e-rowcell.e-valuescontent, #ParcelPivotView td.e-valuescontent, td.e-rowcell.e-valuescontent";
      const cells = Array.from(document.querySelectorAll(selector)).filter((cell) => {
        const row = cell.closest("tr");
        if (!row) return false;
        return !row.classList.contains("e-summary");
      });

      if (cells.length === 0) return;

      const columnGroups = {};
      cells.forEach((cell) => {
        const colIndex = cell.getAttribute("aria-colindex") || cell.cellIndex;
        if (colIndex !== null && colIndex !== undefined) {
          if (!columnGroups[colIndex]) columnGroups[colIndex] = [];
          columnGroups[colIndex].push(cell);
        }
      });

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
      const btn = e.target ? e.target.closest("#parcelHeatmapToggle, #heatmapToggle") : null;
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
      }
      pivotRef.current = null;
    }
    if (containerRef.current) {
      containerRef.current.innerHTML = "";
    }
  };

  const initPivot = (pivotData, ej) => {
    if (!containerRef.current) return;

    const parsed = (pivotData || []).map(normalizeRow);

    if (parsed.length === 0) return;

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
          { name: "Amount", caption: "Amount" }
        ],
        formatSettings: [
          { name: "Pcs", format: "N0" },
          { name: "Carats", format: "N2" },
          { name: "Amount", format: "N2" }
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
        title: "Parcel Stock Analysis Report",
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
        args.fileName = "Parcel Stock Analysis Report";
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
    <div className="parcel-pivot-control-section">
      <style>{`
        .parcel-pivot-control-section {
          width: 100%;
          background: #fff;
          min-height: 255px;
          border: 1px solid #e9ebec;
          border-radius: 4px;
          overflow: hidden;
        }
        .parcel-pivot-content-wrapper {
          width: 100%;
          padding: 4px 0 8px;
          background: #fff;
          overflow-x: auto;
        }
        #ParcelPivotView {
          width: 100% !important;
        }
        #ParcelPivotView .e-pivotview .e-stackedheadertext,
        #ParcelPivotView .e-pivotview .e-headertext {
          font-weight: 700 !important;
          color: #343a40 !important;
        }
        #ParcelPivotView .e-pivotview .e-rowsheader .e-cellvalue {
          font-weight: 700 !important;
          color: #343a40 !important;
        }
        #ParcelPivotView .e-pivot-button {
          border-radius: 4px !important;
        }
        #ParcelPivotView .e-pivotview .e-valuescontent {
          text-align: right;
        }
        #ParcelPivotView .e-frozencontent,
        #ParcelPivotView .e-movablecontent {
          border-top: 0 !important;
          margin-top: 0 !important;
          padding-top: 0 !important;
        }
        #ParcelPivotView .e-gridheader table,
        #ParcelPivotView .e-frozenheader table,
        #ParcelPivotView .e-movableheader table {
          border-collapse: collapse !important;
          margin-bottom: 0 !important;
        }
        #ParcelPivotView .e-toolbar {
          border-bottom: 1px solid #e0e0e0;
          background: #fafafa;
        }
        #ParcelPivotView .e-grouping-bar {
          background: #fff;
        }
        #ParcelPivotView tr.e-gtot td.e-valuescontent,
        #ParcelPivotView tr.e-summary td.e-valuescontent {
          font-weight: 700 !important;
        }
        #ParcelPivotView td.e-gtot,
        #ParcelPivotView th.e-gtot {
          background-color: #f4f4f4;
          color: #212529;
        }
        #ParcelPivotView tr.e-gtot td.e-gtot,
        #ParcelPivotView tr.e-summary td.e-gtot,
        #ParcelPivotView .e-movablecontent tr.e-gtot td.e-gtot,
        #ParcelPivotView .e-gridcontent tr.e-gtot td.e-gtot,
        #ParcelPivotView .e-frozencontent tr.e-gtot td.e-gtot {
          font-weight: 700 !important;
          color: #000000;
          text-align: right !important;
        }
        #heatmapToggle,
        #parcelHeatmapToggle {
          height: 28px;
          line-height: 26px;
          padding: 0 10px;
          font-size: 12px;
        }
      `}</style>
      <div className="parcel-pivot-content-wrapper">
        <div ref={containerRef} id="ParcelPivotView" />
      </div>
    </div>
  );
};

export default ParcelPivotReport;
