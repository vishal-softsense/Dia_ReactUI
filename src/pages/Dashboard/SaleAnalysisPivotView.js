import React, { useEffect, useRef } from "react";

/**
 * Syncfusion PivotView wrapper for Sale Analysis Report.
 * Mirrors MVC initializeSyncfusionPivotSale (ChartReports.js line ~3441).
 * Uses global `ej` from CDN (public/index.html).
 */
const SaleAnalysisPivotView = ({ data = [] }) => {
  const containerRef = useRef(null);
  const pivotRef = useRef(null);
  const heatmapEnabledRef = useRef(false);
  const heatmapListenerRef = useRef(false);

  const STORAGE_KEY = "pivotviewReports_SaleAnalysis";

  const getEj = () => (typeof window !== "undefined" ? window.ej : null);

  const updateHeatmapButtonText = () => {
    const btn = document.getElementById("heatmapToggle");
    if (btn) btn.textContent = heatmapEnabledRef.current ? "Heatmap On" : "Heatmap Off";
  };

  const resetHeatmapColors = () => {
    document.querySelectorAll("td.e-valuescontent").forEach((cell) => {
      cell.style.backgroundColor = "";
      cell.style.color = "";
    });
  };

  // Column-wise heatmap — red gradient (matches MVC applyHeatmapColors)
  const applyHeatmapColors = () => {
    setTimeout(() => {
      const cells = Array.from(
        document.querySelectorAll("td.e-valuescontent:not(.e-gtot)")
      );
      const columnGroups = {};
      cells.forEach((cell) => {
        const colIndex = cell.getAttribute("aria-colindex");
        if (!columnGroups[colIndex]) columnGroups[colIndex] = [];
        columnGroups[colIndex].push(cell);
      });

      Object.values(columnGroups).forEach((cellGroup) => {
        const values = [];
        cellGroup.forEach((cell) => {
          const span = cell.querySelector("span.e-cellvalue");
          if (span) {
            const val = parseFloat((span.textContent || "").replace(/[$,]/g, ""));
            if (!isNaN(val)) values.push(val);
          }
        });
        if (values.length === 0) return;

        const min = Math.min(...values);
        const max = Math.max(...values);

        cellGroup.forEach((cell) => {
          const span = cell.querySelector("span.e-cellvalue");
          if (span) {
            const val = parseFloat((span.textContent || "").replace(/[$,]/g, ""));
            if (!isNaN(val)) {
              const ratio = (val - min) / (max - min || 1);
              const green = Math.round(255 * (1 - ratio));
              const blue = Math.round(255 * (1 - ratio));
              cell.style.backgroundColor = `rgb(255, ${green}, ${blue})`;
              cell.style.color = "#000";
            }
          }
        });
      });
    }, 300);
  };

  const setupHeatmapToggle = () => {
    if (heatmapListenerRef.current) return;
    document.addEventListener("click", (e) => {
      if (e.target && e.target.id === "heatmapToggle") {
        heatmapEnabledRef.current = !heatmapEnabledRef.current;
        if (heatmapEnabledRef.current) applyHeatmapColors();
        else resetHeatmapColors();
        updateHeatmapButtonText();
      }
    });
    heatmapListenerRef.current = true;
  };

  const destroyPivot = () => {
    if (pivotRef.current) {
      try { pivotRef.current.destroy(); } catch (e) { /* ignore */ }
      pivotRef.current = null;
    }
    if (containerRef.current) containerRef.current.innerHTML = "";
  };

  // API returns camelCase JSON; Syncfusion needs exact field name matches.
  // Normalize every row to PascalCase keys that match the MVC pivot config.
  const normalizeRow = (item) => {
    const get = (key) => {
      if (item[key] !== undefined) return item[key];
      const lk = key.charAt(0).toLowerCase() + key.slice(1);
      if (item[lk] !== undefined) return item[lk];
      const found = Object.keys(item).find((k) => k.toLowerCase() === key.toLowerCase());
      return found !== undefined ? item[found] : undefined;
    };
    return {
      Shape:               get("Shape")   ?? "",
      Color:               get("Color")   ?? "",
      Size:                get("Size")    ?? "",
      Clarity:             get("Clarity") ?? "",
      Sieve:               get("Sieve")   ?? "",
      Lab:                 get("Lab")     ?? "",
      Pcs:                 Number(get("Pcs"))              || 0,
      Carats:              Number(get("Carats"))           || 0,
      SaleAmtdollar:       Number(get("SaleAmtdollar"))    || 0,
      PLdollar:            Number(get("PLdollar"))          || 0,
      PurCostdollar:       Number(get("PurCostdollar"))     || 0,
      PLperOnPurAmtdollar: Number(get("PLperOnPurAmtdollar")) || 0,
      COGSdollar:          Number(get("COGSdollar"))        || 0,
    };
  };

  const initPivot = (pivotData, ej) => {
    if (!containerRef.current) return;

    const parsed = pivotData.map(normalizeRow);

    // If pivot already exists just refresh its data (MVC pattern)
    if (pivotRef.current) {
      pivotRef.current.setProperties(
        { dataSourceSettings: { dataSource: parsed } },
        true
      );
      pivotRef.current.refresh();
      return;
    }

    const pivot = new ej.pivotview.PivotView({
      dataSourceSettings: {
        dataSource: parsed,
        expandAll: false,
        // MVC default: columns = Clarity + Size, rows = Color + Shape
        columns: [
          { name: "Clarity", caption: "Clarity" },
          { name: "Size",    caption: "Size" }
        ],
        rows: [
          { name: "Color", caption: "Color" },
          { name: "Shape", caption: "Shape" }
        ],
        values: [
          { name: "Pcs",               caption: "Pcs" },
          { name: "Carats",            caption: "Carats" },
          { name: "SaleAmtdollar",     caption: "SaleAmt$" },
          { name: "PLperOnPurAmtdollar", caption: "PL%OnPurAmt$" }
        ],
        formatSettings: [
          { name: "Pcs",               format: "N0" },
          { name: "Carats",            format: "N2" },
          { name: "SaleAmtdollar",     format: "N2" },
          { name: "PLperOnPurAmtdollar", format: "N2" }
        ],
        filters: [],
        showGrandTotals: true,
        showSubTotals:  true
      },
      toolbar: [
        "New", "Save", "SaveAs", "Rename", "Remove", "Load",
        "Grid",
        { template: '<button id="heatmapToggle" class="e-btn e-flat">Heatmap Off</button>' },
        "Chart", "Export", "SubTotal", "GrandTotal", "Formatting", "FieldList"
      ],
      dataBound: () => {
        updateHeatmapButtonText();
        if (heatmapEnabledRef.current) applyHeatmapColors();
      },
      toolbarRender: (args) => {
        args.customToolbar.splice(6, 0, { type: "Separator" });
        args.customToolbar.splice(9, 0, { type: "Separator" });
      },
      allowExcelExport:          true,
      allowPdfExport:            true,
      allowConditionalFormatting:true,
      allowNumberFormatting:     true,
      allowCalculatedField:      true,
      allowDeferLayoutUpdate:    true,
      allowDrillThrough:         true,
      allowGrouping:             true,
      enableVirtualization:      true,
      enableValueSorting:        true,
      enableFieldSearching:      true,
      showToolbar:               true,
      showTooltip:               true,
      width:                     "100%",
      height:                    630,
      showFieldList:             true,
      showGroupingBar:           true,
      displayOption:             { view: "Both" },
      exportAllPages:            false,
      maxNodeLimitInMemberEditor: 50,
      gridSettings: {
        columnWidth: 120,
        rowHeight:   36,
        allowSelection: true,
        selectionSettings: { mode: "Cell", type: "Single", cellSelectionMode: "Box" },
        excelQueryCellInfo: (args) => {
          if (args.cell && args.cell.axis === "value" && args.cell.value === undefined) {
            args.style.numberFormat = undefined;
          }
        }
      },
      chartSettings: {
        title: "Sale Analysis Report",
        chartSeries: { type: "Column" },
        primaryYAxis: { border: { width: 0 } },
        load: (args) => {
          const theme = window.location.hash.split("/")[1] || "Material";
          args.chart.theme =
            theme.charAt(0).toUpperCase() +
            theme.slice(1).replace(/-dark/i, "Dark").replace(/contrast/i, "Contrast");
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
      beforeExport: (args) => { args.fileName = "Sale Analysis Report"; },
      saveReport: (args) => {
        const reports = JSON.parse(localStorage[STORAGE_KEY] || "[]");
        if (args.report && args.reportName !== "") {
          const report = JSON.parse(args.report);
          report.dataSourceSettings.dataSource = [];
          report.pivotValues = [];
          args.report = JSON.stringify(report);
          const index = reports.findIndex((r) => r.reportName === args.reportName);
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
          report.dataSourceSettings.dataSource = pivotRef.current.dataSourceSettings.dataSource;
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
        const index = reports.findIndex((r) => r.reportName === args.reportName);
        if (index !== -1) reports[index].reportName = args.rename;
        localStorage[STORAGE_KEY] = JSON.stringify(reports);
      },
      newReport: () => {
        if (pivotRef.current) {
          pivotRef.current.setProperties(
            { dataSourceSettings: { columns: [], rows: [], values: [], filters: [] } },
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
    if (!ej || !data || data.length === 0) return;
    initPivot(data, ej);
    return () => { destroyPivot(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  return (
    <div style={{ width: "100%", overflowX: "auto", backgroundColor: "white" }}>
      <div ref={containerRef} id="SaleAnalysisPivotView" style={{ width: "100%" }} />
    </div>
  );
};

export default SaleAnalysisPivotView;
