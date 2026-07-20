import React, { useEffect, useRef } from "react";

/**
 * Syncfusion PivotView for Stock Analysis — Pivot (By Filter).
 * Mirrors MVC StockPivotNew / loadPivot (ChartReports.js).
 * Transforms GIA/HRD/IGI/CGL lab columns into rows for pivot display.
 */
const StockAnalysisPivotByFilterView = ({ data = [] }) => {
  const containerRef = useRef(null);
  const pivotRef = useRef(null);
  const heatmapEnabledRef = useRef(false);
  const heatmapListenerRef = useRef(false);

  const STORAGE_KEY = "pivotviewReports_StockAnalysisByFilter";
  const LABS = ["GIA", "HRD", "IGI", "CGL"];

  const getEj = () => (typeof window !== "undefined" ? window.ej : null);

  const pick = (item, key) => {
    if (!item) return undefined;
    if (item[key] !== undefined) return item[key];
    const lk = key.charAt(0).toLowerCase() + key.slice(1);
    if (item[lk] !== undefined) return item[lk];
    const found = Object.keys(item).find((k) => k.toLowerCase() === key.toLowerCase());
    return found !== undefined ? item[found] : undefined;
  };

  const transformPivotData = (rawData) => {
    const transformed = [];
    (rawData || []).forEach((item) => {
      LABS.forEach((lab) => {
        transformed.push({
          Id: pick(item, "Id") ?? "",
          Lab: lab,
          Pcs: Number(pick(item, `${lab}_Pcs`)) || 0,
          Cts: Number(pick(item, `${lab}_Cts`)) || 0,
          Amt: Number(pick(item, `${lab}_Amt`)) || 0,
          AvgRate: Number(pick(item, `${lab}_AvgRate`)) || 0,
          AvgPercent: Number(pick(item, `${lab}_AvgPercent`)) || 0
        });
      });
    });
    return transformed;
  };

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

      Object.values(columnGroups).forEach((group) => {
        const values = group
          .map((cell) => {
            const span = cell.querySelector("span.e-cellvalue");
            return span ? parseFloat((span.textContent || "").replace(/[$,]/g, "")) : NaN;
          })
          .filter((v) => !isNaN(v));
        if (!values.length) return;
        const min = Math.min(...values);
        const max = Math.max(...values);
        group.forEach((cell) => {
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
  };

  const initPivot = (rawData, ej) => {
    if (!containerRef.current) return;
    const parsed = transformPivotData(rawData);

    if (pivotRef.current) {
      pivotRef.current.setProperties({ dataSourceSettings: { dataSource: parsed } }, true);
      pivotRef.current.refresh();
      return;
    }

    const pivot = new ej.pivotview.PivotView({
      dataSourceSettings: {
        dataSource: parsed,
        allowDragAndDrop: true,
        expandAll: false,
        rows: [{ name: "Id", caption: "Id" }],
        columns: [{ name: "Lab", caption: "Lab" }],
        values: [
          { name: "Amt", caption: "Amount" },
          { name: "Pcs", caption: "Pcs" },
          { name: "Cts", caption: "Cts" },
          { name: "AvgRate", caption: "Avg Rate" },
          { name: "AvgPercent", caption: "Avg %" }
        ],
        formatSettings: [
          { name: "Cts", format: "N2" },
          { name: "Amt", format: "N2" },
          { name: "AvgRate", format: "N2" },
          { name: "AvgPercent", format: "N2" }
        ],
        filters: [],
        showGrandTotals: true,
        showSubTotals: true
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
      allowExcelExport: true,
      allowPdfExport: true,
      allowConditionalFormatting: true,
      allowNumberFormatting: true,
      allowCalculatedField: true,
      allowDeferLayoutUpdate: true,
      allowDrillThrough: true,
      allowGrouping: true,
      enableVirtualization: true,
      enableValueSorting: true,
      enableFieldSearching: true,
      showToolbar: true,
      showTooltip: true,
      height: 850,
      width: "100%",
      showFieldList: true,
      showGroupingBar: true,
      displayOption: { view: "Both" },
      exportAllPages: false,
      maxNodeLimitInMemberEditor: 50,
      gridSettings: {
        columnWidth: 120,
        rowHeight: 36,
        allowSelection: true,
        selectionSettings: { mode: "Cell", type: "Single", cellSelectionMode: "Box" }
      },
      chartSettings: {
        title: "Stock Analysis Chart",
        chartSeries: { type: "Column", value: "Amt", name: "Amount" }
      },
      saveReport: (args) => {
        let reports = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        if (args.report && args.reportName !== "") {
          const report = JSON.parse(args.report);
          report.dataSourceSettings.dataSource = parsed;
          report.pivotValues = pivot.pivotValues;
          args.report = JSON.stringify(report);
          const index = reports.findIndex((item) => item.reportName === args.reportName);
          if (index !== -1) reports[index].report = args.report;
          else reports.push(args);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
        }
      },
      fetchReport: (args) => {
        const reports = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        args.reportName = reports.map((item) => item.reportName);
      },
      loadReport: (args) => {
        const reports = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        const reportItem = reports.find((item) => item.reportName === args.reportName);
        if (reportItem) {
          const report = JSON.parse(reportItem.report);
          pivot.dataSourceSettings = report.dataSourceSettings;
        }
      },
      removeReport: (args) => {
        let reports = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        reports = reports.filter((item) => item.reportName !== args.reportName);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
      },
      renameReport: (args) => {
        const reports = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        const index = reports.findIndex((item) => item.reportName === args.reportName);
        if (index !== -1) reports[index].reportName = args.rename;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
      },
      newReport: () => {
        pivot.setProperties(
          { dataSourceSettings: { columns: [], rows: [], values: [], filters: [] } },
          false
        );
      },
      beforeExport: (args) => {
        args.fileName = "Stock Analysis Report";
      }
    });

    pivot.appendTo(containerRef.current);
    pivotRef.current = pivot;
    setupHeatmapToggle();
  };

  useEffect(() => {
    const ej = getEj();
    if (!ej?.pivotview?.PivotView) return;

    if (!data || data.length === 0) {
      destroyPivot();
      return;
    }

    initPivot(data, ej);
    return () => destroyPivot();
  }, [data]);

  return (
    <div style={{ width: "100%", overflowX: "auto", backgroundColor: "white" }}>
      <div ref={containerRef} id="StockPivotByFilterView" style={{ width: "100%" }} />
    </div>
  );
};

export default StockAnalysisPivotByFilterView;
