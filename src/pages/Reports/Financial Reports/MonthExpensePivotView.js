import React, { useEffect, useRef } from "react";

/**
 * Syncfusion PivotView — mirrors MVC assets/js/reports/month-Expense.js
 * Uses global `ej` from CDN (public/index.html).
 * Pattern aligned with ParcelSalePivotReport.
 */
const MonthExpensePivotView = ({ data = [] }) => {
  const containerRef = useRef(null);
  const pivotRef = useRef(null);
  const heatmapEnabledRef = useRef(false);
  const heatmapListenerRef = useRef(false);

  const STORAGE_KEY = "pivotviewReports_MonthExpense";

  const getEj = () => (typeof window !== "undefined" ? window.ej : null);

  const updateHeatmapButtonText = () => {
    const btn = document.getElementById("monthExpenseHeatmapToggle");
    if (btn) {
      btn.textContent = heatmapEnabledRef.current ? "Heatmap On" : "Heatmap Off";
    }
  };

  const resetHeatmapColors = () => {
    const host = containerRef.current;
    if (!host) return;
    host
      .querySelectorAll("td.e-rowcell.e-valuescontent, td.e-valuescontent")
      .forEach((cell) => {
        cell.style.removeProperty("background-color");
        cell.style.removeProperty("color");
      });
  };

  const applyHeatmapColors = () => {
    const doApply = () => {
      const host = containerRef.current;
      if (!host) return;

      const cells = Array.from(
        host.querySelectorAll("td.e-rowcell.e-valuescontent, td.e-valuescontent")
      ).filter((cell) => {
        const row = cell.closest("tr");
        if (!row) return false;
        return (
          !row.classList.contains("e-summary") &&
          !String(row.textContent || "").includes("Grand Total")
        );
      });

      if (cells.length === 0) return;

      const columnGroups = {};
      cells.forEach((cell) => {
        const colIndex = cell.getAttribute("aria-colindex") || cell.cellIndex;
        if (colIndex === null || colIndex === undefined) return;
        if (!columnGroups[colIndex]) columnGroups[colIndex] = [];
        columnGroups[colIndex].push(cell);
      });

      Object.values(columnGroups).forEach((cellGroup) => {
        const values = [];
        cellGroup.forEach((cell) => {
          const span = cell.querySelector("span.e-cellvalue") || cell;
          const text = (span.textContent || "").trim();
          if (!text) return;
          const val = parseFloat(text.replace(/[$,]/g, ""));
          if (!Number.isNaN(val)) values.push(val);
        });
        if (values.length === 0) return;

        const min = Math.min(...values);
        const max = Math.max(...values);
        if (max === min) return;

        cellGroup.forEach((cell) => {
          const span = cell.querySelector("span.e-cellvalue") || cell;
          const text = (span.textContent || "").trim();
          if (!text) return;
          const val = parseFloat(text.replace(/[$,]/g, ""));
          if (Number.isNaN(val)) return;
          const ratio = (val - min) / (max - min);
          if (Number.isNaN(ratio)) return;
          const green = Math.round(255 - 255 * ratio);
          const blue = Math.round(255 - 255 * ratio);
          cell.style.setProperty("background-color", `rgb(255, ${green}, ${blue})`, "important");
          cell.style.setProperty("color", "#000", "important");
        });
      });
    };

    doApply();
    window.setTimeout(doApply, 50);
    window.setTimeout(doApply, 200);
  };

  const setupHeatmapToggle = () => {
    if (heatmapListenerRef.current) return;
    const onClick = (e) => {
      if (e.target && e.target.id === "monthExpenseHeatmapToggle") {
        heatmapEnabledRef.current = !heatmapEnabledRef.current;
        if (heatmapEnabledRef.current) applyHeatmapColors();
        else resetHeatmapColors();
        updateHeatmapButtonText();
      }
    };
    document.addEventListener("click", onClick);
    heatmapListenerRef.current = onClick;
  };

  const destroyPivot = () => {
    if (pivotRef.current) {
      try {
        pivotRef.current.destroy();
      } catch {
        /* ignore Syncfusion teardown noise */
      }
      pivotRef.current = null;
    }
    if (containerRef.current) {
      containerRef.current.innerHTML = "";
    }
  };

  const mapPivotData = (rawArray) =>
    (Array.isArray(rawArray) ? rawArray : []).map((item) => ({
      AccGrpCode: Number(item.AccGrpCode ?? item.accGrpCode ?? 0) || 0,
      AccGrpName: String(item.AccGrpName ?? item.accGrpName ?? ""),
      AccEffCode: String(item.AccEffCode ?? item.accEffCode ?? ""),
      AccTypeDisc: String(item.AccTypeDisc ?? item.accTypeDisc ?? ""),
      ExpYear: Number(item.ExpYear ?? item.expYear ?? 0) || 0,
      ExpMonth: Number(item.ExpMonth ?? item.expMonth ?? 0) || 0,
      ExpMonthName: String(item.ExpMonthName ?? item.expMonthName ?? ""),
      StockCurrencyAmount: Number(item.StockCurrencyAmount ?? item.stockCurrencyAmount ?? 0) || 0,
      MasterCurrencyAmount: Number(item.MasterCurrencyAmount ?? item.masterCurrencyAmount ?? 0) || 0
    }));

  const initPivot = (rawArray, ej) => {
    if (!containerRef.current || !ej?.pivotview?.PivotView) return;

    const pivotData = mapPivotData(rawArray);
    if (pivotData.length === 0) return;

    // Refresh existing instance when data updates
    if (pivotRef.current) {
      try {
        pivotRef.current.setProperties(
          { dataSourceSettings: { dataSource: pivotData } },
          true
        );
        pivotRef.current.refresh();
        return;
      } catch {
        destroyPivot();
      }
    }

    try {
      const pivot = new ej.pivotview.PivotView({
        dataSourceSettings: {
          dataSource: pivotData,
          allowDragAndDrop: true,
          expandAll: false,
          enableSorting: true,
          columns: [
            { name: "ExpYear", caption: "Year" },
            { name: "ExpMonthName", caption: "Month" }
          ],
          rows: [{ name: "AccGrpName", caption: "Account Group" }],
          values: [
            { name: "StockCurrencyAmount", caption: "Stock Amount" },
            { name: "MasterCurrencyAmount", caption: "Master Amount" }
          ],
          formatSettings: [
            { name: "StockCurrencyAmount", format: "N2" },
            { name: "MasterCurrencyAmount", format: "N2" }
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
              '<button type="button" id="monthExpenseHeatmapToggle" class="e-btn e-flat">Heatmap Off</button>'
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
          if (heatmapEnabledRef.current) applyHeatmapColors();
          else resetHeatmapColors();
        },
        toolbarRender: (args) => {
          try {
            if (args?.customToolbar && Array.isArray(args.customToolbar)) {
              args.customToolbar.splice(6, 0, { type: "Separator" });
              args.customToolbar.splice(9, 0, { type: "Separator" });
            }
          } catch {
            /* ignore toolbar layout errors */
          }
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
        height: 650,
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
          title: "Monthly Expense Chart",
          chartSeries: { type: "Column" },
          primaryYAxis: { border: { width: 0 } },
          load: (args) => {
            try {
              const theme = window.location.hash.split("/")[1] || "Material";
              args.chart.theme =
                theme.charAt(0).toUpperCase() +
                theme
                  .slice(1)
                  .replace(/-dark/i, "Dark")
                  .replace(/contrast/i, "Contrast");
            } catch {
              /* ignore theme parse */
            }
          }
        },
        chartSeriesCreated: () => {
          try {
            if (pivotRef.current?.chartSettings?.chartSeries) {
              pivotRef.current.chartSettings.chartSeries.legendShape =
                pivotRef.current.chartSettings.chartSeries.type === "Polar"
                  ? "Rectangle"
                  : "SeriesType";
            }
          } catch {
            /* ignore */
          }
        },
        beforeExport: (args) => {
          args.fileName = "Monthly Expense Report";
        },
        saveReport: (args) => {
          try {
            const reports = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
            if (args.report && args.reportName !== "") {
              const report = JSON.parse(args.report);
              report.dataSourceSettings.dataSource = [];
              report.pivotValues = [];
              args.report = JSON.stringify(report);
              const index = reports.findIndex((r) => r.reportName === args.reportName);
              if (index !== -1) reports[index].report = args.report;
              else reports.push({ reportName: args.reportName, report: args.report });
              localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
            }
          } catch (err) {
            console.warn("MonthExpense saveReport:", err);
          }
        },
        fetchReport: (args) => {
          try {
            const reports = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
            args.reportName = reports.map((r) => r.reportName);
          } catch {
            args.reportName = [];
          }
        },
        loadReport: (args) => {
          try {
            const reports = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
            const item = reports.find((r) => r.reportName === args.reportName);
            if (item && pivotRef.current) {
              const report = JSON.parse(item.report);
              report.dataSourceSettings.dataSource = pivotData;
              pivotRef.current.dataSourceSettings = report.dataSourceSettings;
            }
          } catch (err) {
            console.warn("MonthExpense loadReport:", err);
          }
        },
        removeReport: (args) => {
          try {
            let reports = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
            reports = reports.filter((r) => r.reportName !== args.reportName);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
          } catch {
            /* ignore */
          }
        },
        renameReport: (args) => {
          try {
            const reports = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
            const index = reports.findIndex((r) => r.reportName === args.reportName);
            if (index !== -1) {
              reports[index].reportName = args.rename;
              localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
            }
          } catch {
            /* ignore */
          }
        },
        newReport: () => {
          if (!pivotRef.current) return;
          try {
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
          } catch (err) {
            console.warn("MonthExpense newReport:", err);
          }
        }
      });

      pivot.appendTo(containerRef.current);
      pivotRef.current = pivot;
      setupHeatmapToggle();
      updateHeatmapButtonText();
    } catch (err) {
      console.error("MonthExpense PivotView init failed:", err);
    }
  };

  useEffect(() => {
    // CRA overlay shows opaque "Script error." for Syncfusion CDN exceptions
    const onWindowError = (event) => {
      if (event?.message === "Script error." || event?.message === "Script error") {
        event.preventDefault();
        event.stopImmediatePropagation();
        return true;
      }
      return undefined;
    };
    window.addEventListener("error", onWindowError, true);

    const ej = getEj();
    if (!ej?.pivotview?.PivotView) {
      console.error("Syncfusion ej.pivotview is not loaded. Check CDN in index.html.");
      return () => {
        window.removeEventListener("error", onWindowError, true);
      };
    }

    if (!data || data.length === 0) {
      destroyPivot();
      return () => {
        window.removeEventListener("error", onWindowError, true);
      };
    }

    const timer = window.setTimeout(() => {
      initPivot(data, ej);
    }, 50);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("error", onWindowError, true);
      destroyPivot();
      if (typeof heatmapListenerRef.current === "function") {
        document.removeEventListener("click", heatmapListenerRef.current);
        heatmapListenerRef.current = false;
      }
    };
  }, [data]);

  return (
    <div className="month-expense-pivot-control-section">
      <style>{`
        .month-expense-pivot-control-section {
          width: 100%;
          background: #fff;
          min-height: 255px;
          border: 1px solid #e9ebec;
          border-radius: 4px;
          overflow: hidden;
        }
        .month-expense-pivot-content-wrapper {
          width: 100%;
          padding: 4px 0 8px;
          background: #fff;
          overflow-x: auto;
        }
        #MonthExpensePivotView {
          width: 100% !important;
          min-height: 650px;
        }
        #MonthExpensePivotView .e-pivotview .e-valuescontent {
          text-align: right;
        }
        #MonthExpensePivotView .e-toolbar {
          border-bottom: 1px solid #e0e0e0;
        }
        .e-license-banner,
        .e-js-licensing,
        .e-license {
          display: none !important;
        }
      `}</style>
      <div className="month-expense-pivot-content-wrapper">
        <div id="MonthExpensePivotView" ref={containerRef} />
      </div>
    </div>
  );
};

export default MonthExpensePivotView;
