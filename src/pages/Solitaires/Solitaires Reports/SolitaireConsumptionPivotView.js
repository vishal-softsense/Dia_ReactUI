import React, { useEffect, useRef } from "react";

const SolitaireConsumptionPivotView = ({ data = [] }) => {
  const containerRef = useRef(null);
  const pivotRef = useRef(null);
  const heatmapEnabledRef = useRef(false);
  const heatmapListenerRef = useRef(false);
  const mappedDataRef = useRef([]);
  const formatTimersRef = useRef([]);
  const aliveRef = useRef(true);
  const hostElRef = useRef(null);

  const getEj = () => (typeof window !== "undefined" ? window.ej : null);

  const getProp = (obj, ...keys) => {
    if (!obj || typeof obj !== "object") return null;
    for (const key of keys) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        return obj[key];
      }
    }
    const entries = Object.entries(obj);
    for (const key of keys) {
      const found = entries.find(([k]) => k.toLowerCase() === String(key).toLowerCase());
      if (found) return found[1];
    }
    return null;
  };

  const toNum = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  const updateHeatmapButtonText = () => {
    const btn = document.getElementById("scrHeatmapToggle");
    if (btn) btn.textContent = heatmapEnabledRef.current ? "Heatmap On" : "Heatmap Off";
  };

  const resetHeatmapColors = () => {
    const host = hostElRef.current;
    const container = host || document;
    container.querySelectorAll("td.e-rowcell.e-valuescontent").forEach((cell) => {
      cell.style.backgroundColor = "";
      cell.style.color = "";
    });
  };

  const extractValue = (text) => {
    if (!text || typeof text !== "string" || text.trim() === "") return NaN;

    let val = NaN;

    const cMatch = text.match(/C:\s*([\-0-9.]+)/);
    if (cMatch && !isNaN(parseFloat(cMatch[1]))) {
      val = parseFloat(cMatch[1]);
    }
    else if (text.includes("_")) {
      const parts = text.split("_").map((p) => parseFloat(p) || NaN);
      if (!isNaN(parts[0])) val = parts[0];
    }
    else {
      const num = parseFloat(text.replace(/[^0-9.\-]/g, ""));
      if (!isNaN(num)) val = num;
    }

    return val;
  };

  const applyHeatmapColors = () => {
    setTimeout(() => {
      if (!aliveRef.current) return;
      const host = hostElRef.current;
      const container = host || document;
      const cells = Array.from(container.querySelectorAll("td.e-rowcell.e-valuescontent")).filter(
        (cell) => !cell.classList.contains("e-gtot") && !cell.classList.contains("e-stot")
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
          const val = extractValue(cell.innerText || cell.textContent);
          if (!Number.isNaN(val)) values.push(val);
        });
        if (!values.length) return;
        const min = Math.min(...values);
        const max = Math.max(...values);
        cellGroup.forEach((cell) => {
          const val = extractValue(cell.innerText || cell.textContent);
          if (Number.isNaN(val)) return;
          const ratio = (val - min) / (max - min || 1);
          const red = 255;
          const green = Math.round(255 * (1 - ratio));
          const blue = Math.round(255 * (1 - ratio));
          cell.style.backgroundColor = `rgb(${red}, ${green}, ${blue})`;
          cell.style.color = "#000";
        });
      });
    }, 300);
  };

  const setupHeatmapToggle = () => {
    if (heatmapListenerRef.current) return;
    document.addEventListener("click", (e) => {
      if (e.target && e.target.id === "scrHeatmapToggle") {
        heatmapEnabledRef.current = !heatmapEnabledRef.current;
        if (heatmapEnabledRef.current) applyHeatmapColors();
        else resetHeatmapColors();
        updateHeatmapButtonText();
      }
    });
    heatmapListenerRef.current = true;
  };

  const clearFormatTimers = () => {
    formatTimersRef.current.forEach((id) => clearTimeout(id));
    formatTimersRef.current = [];
  };

  const scheduleFormat = (delay = 50) => {
    const id = setTimeout(() => {
      if (!aliveRef.current || !pivotRef.current) return;
      formatUnderscoreCells();
    }, delay);
    formatTimersRef.current.push(id);
  };

  const formatUnderscoreCells = () => {
    const host = hostElRef.current;
    if (!host || !aliveRef.current) return;

    const cells = host.querySelectorAll("td.e-valuescontent");

    cells.forEach((cell) => {
      let text = (cell.getAttribute("data-raw") || "").trim();
      if (!text || text.indexOf("_") === -1) {
        text = (cell.innerText || cell.textContent || "").trim();
      }
      if (!text || text.indexOf("_") === -1) return;

      const parts = text.split("_");
      cell.setAttribute("data-raw", text);

      const pValue = parseFloat(parts[0]) || 0;
      const cValue = parseFloat(parts[1]) || 0;
      const dValue = parseFloat(parts[2]) || 0;
      const aValue = parseFloat(parts[3]) || 0;

      if (pValue === 0 && cValue === 0 && dValue === 0 && aValue === 0) {
        cell.innerHTML = "";
        return;
      }

      let html = '<div style="text-align:center; line-height:1.7; padding:2px;">';
      if (pValue !== 0) html += `<div style="font-size:16px;text-align:right"> ${pValue}</div>`;
      if (cValue !== 0) html += `<div style="font-size:16px;text-align:right"> ${cValue.toFixed(2)}</div>`;
      if (dValue !== 0) html += `<div style="font-size:16px;text-align:right"> ${Number(dValue).toFixed(2)}%</div>`;
      if (aValue !== 0) html += `<div style="font-size:16px;text-align:right">$ ${Number(aValue).toFixed(2)}K</div>`;
      html += "</div>";
      cell.innerHTML = html;
    });
  };

  const destroyPivot = () => {
    clearFormatTimers();

    const pivot = pivotRef.current;
    pivotRef.current = null;

    if (pivot) {
      try {
        pivot.destroy();
      } catch (e) {
      }
    }

    const host = hostElRef.current;
    hostElRef.current = null;
    if (host && host.parentNode) {
      try {
        host.parentNode.removeChild(host);
      } catch (e) {
      }
    }
  };

  const buildMappedData = (rawArray) =>
    (rawArray || []).map((item) => {
      const clarity = getProp(item, "Clarity", "clarity", "Cla", "cla");
      const col = getProp(item, "Col", "col", "Color", "color");
      const shp = getProp(item, "Shp", "shp", "Shape", "shape");

      const holdPcs = toNum(getProp(item, "Hold_Pcs", "hold_Pcs", "holdPcs"));
      const holdCarats = toNum(getProp(item, "Hold_Carats", "hold_Carats", "holdCarats"));
      const holdDisc = toNum(getProp(item, "Hold_AvgDiscPercent", "hold_AvgDiscPercent", "holdAvgDiscPercent"));
      const holdAmt = toNum(getProp(item, "Hold_Amt", "hold_Amt", "holdAmt"));
      const holdRapa = toNum(getProp(item, "Hold_Rapa", "hold_Rapa", "holdRapa"));

      const memoPcs = toNum(getProp(item, "Memo_Pcs", "memo_Pcs", "memoPcs"));
      const memoCarats = toNum(getProp(item, "Memo_Carats", "memo_Carats", "memoCarats"));
      const memoDisc = toNum(getProp(item, "Memo_AvgDiscPercent", "memo_AvgDiscPercent", "memoAvgDiscPercent"));
      const memoAmt = toNum(getProp(item, "Memo_Amt", "memo_Amt", "memoAmt"));
      const memoRapa = toNum(getProp(item, "Memo_Rapa", "memo_Rapa", "memoRapa"));

      const stockPcs = toNum(getProp(item, "Stock_Pcs", "stock_Pcs", "stockPcs"));
      const stockCarats = toNum(getProp(item, "Stock_Carats", "stock_Carats", "stockCarats"));
      const stockDisc = toNum(getProp(item, "Stock_AvgDiscPercent", "stock_AvgDiscPercent", "stockAvgDiscPercent"));
      const stockAmt = toNum(getProp(item, "Stock_Amt", "stock_Amt", "stockAmt"));
      const stockRapa = toNum(getProp(item, "Stock_Rapa", "stock_Rapa", "stockRapa"));

      const soldPcs = toNum(getProp(item, "Sold_Pcs", "sold_Pcs", "soldPcs"));
      const soldCarats = toNum(getProp(item, "Sold_Carats", "sold_Carats", "soldCarats"));
      const soldDisc = toNum(getProp(item, "Sold_AvgDiscPercent", "sold_AvgDiscPercent", "soldAvgDiscPercent"));
      const soldAmt = toNum(getProp(item, "Sold_Amt", "sold_Amt", "soldAmt"));
      const soldRapa = toNum(getProp(item, "Sold_Rapa", "sold_Rapa", "soldRapa"));

      return {
        Clarity: clarity,
        Col: col,
        Shp: shp,
        LotNo: String(getProp(item, "LotNo", "lotNo") ?? ""),
        ItemName: String(getProp(item, "ItemName", "itemName") ?? ""),
        Hold_Pcs: holdPcs,
        Hold_Carats: holdCarats,
        Hold_AvgDiscPercent: holdDisc,
        Hold_Amt: holdAmt,
        Hold_Rapa: holdRapa,
        Memo_Pcs: memoPcs,
        Memo_Carats: memoCarats,
        Memo_AvgDiscPercent: memoDisc,
        Memo_Amt: memoAmt,
        Memo_Rapa: memoRapa,
        Stock_Pcs: stockPcs,
        Stock_Carats: stockCarats,
        Stock_AvgDiscPercent: stockDisc,
        Stock_Amt: stockAmt,
        Stock_Rapa: stockRapa,
        Sold_Pcs: soldPcs,
        Sold_Carats: soldCarats,
        Sold_AvgDiscPercent: soldDisc,
        Sold_Amt: soldAmt,
        Sold_Rapa: soldRapa,
        HoldData: `${holdPcs}_${holdCarats}_${holdDisc}_${holdAmt}_${holdRapa}`,
        MemoData: `${memoPcs}_${memoCarats}_${memoDisc}_${memoAmt}_${memoRapa}`,
        StockData: `${stockPcs}_${stockCarats}_${stockDisc}_${stockAmt}_${stockRapa}`,
        SoldData: `${soldPcs}_${soldCarats}_${soldDisc}_${soldAmt}_${soldRapa}`
      };
    });

  const getFieldValue = (rowSet, fieldName) => {
    if (!rowSet || !fieldName) return null;
    if (rowSet[fieldName] != null && rowSet[fieldName] !== "") return rowSet[fieldName];
    const found = Object.entries(rowSet).find(
      ([k]) => k.toLowerCase() === String(fieldName).toLowerCase()
    );
    return found ? found[1] : null;
  };

  const loadPivot = (rawArray, ej) => {
    const STORAGE_KEY = "pivotviewReports_StockConsumption";
    const mappedData = buildMappedData(rawArray);
    mappedDataRef.current = mappedData;

    const defaultValues = [
      { name: "HoldData", caption: "Hold", type: "Count" },
      { name: "MemoData", caption: "Memo", type: "Count" },
      { name: "StockData", caption: "Stock", type: "Count" },
      { name: "SoldData", caption: "Sold", type: "Count" }
    ];

    const pivot = new ej.pivotview.PivotView({
      dataSourceSettings: {
        dataSource: mappedData,
        expandAll: false,
        enableSorting: true,
        allowLabelFilter: true,
        allowValueFilter: true,
        rows: [{ name: "Clarity", caption: "Clarity" }],
        columns: [{ name: "Col", caption: "Col" }],
        values: defaultValues,
        filters: [],
        showGrandTotals: true,
        showSubTotals: true,
        showRowSubTotals: true,
        showColumnSubTotals: true,
        alwaysShowValueHeader: true
      },
      aggregateCellInfo: (args) => {
        const targetFields = ["HoldData", "MemoData", "StockData", "SoldData"];
        const fieldName = args.fieldName;
        if (!targetFields.includes(fieldName)) return;

        let weightedDiscNumerator = 0;
        let weightedDiscDenominator = 0;
        let totalBaseAmt = 0;
        let totalCarats = 0;
        let totalPcs = 0;

        const isRowTotal = args.rowCellType?.isSubTotal;
        const isColTotal = args.columnCellType?.isSubTotal;
        const isGrandTotal = args.rowCellType?.grandTotal && args.columnCellType?.grandTotal;

        const extractParts = (str) => {
          if (!str || typeof str !== "string" || str.indexOf("_") === -1) return [0, 0, 0, 0, 0];
          const [p, c, d, a, r] = str.split("_");
          return [
            parseFloat(p) || 0,
            parseFloat(c) || 0,
            parseFloat(d) || 0,
            parseFloat(a) || 0,
            parseFloat(r) || 0
          ];
        };

        const add = (rawStr) => {
          if (rawStr == null || rawStr === "") return;
          const [p, c, , a, r] = extractParts(String(rawStr));
          totalCarats += c;
          totalPcs += p;
          totalBaseAmt += a;
          weightedDiscDenominator += r;
          weightedDiscNumerator += a;
        };

        const buildFromNumeric = (row, base) => {
          const p = toNum(getFieldValue(row, `${base}_Pcs`));
          const c = toNum(getFieldValue(row, `${base}_Carats`));
          const d = toNum(getFieldValue(row, `${base}_AvgDiscPercent`));
          const a = toNum(getFieldValue(row, `${base}_Amt`));
          const r = toNum(getFieldValue(row, `${base}_Rapa`));
          return `${p}_${c}_${d}_${a}_${r}`;
        };

        const baseName = fieldName.replace("Data", "");

        if (args.cellSets && args.cellSets.length) {
          args.cellSets.forEach((rowSet) => {
            let rawStr = getFieldValue(rowSet, fieldName);
            if (!rawStr) rawStr = buildFromNumeric(rowSet, baseName);
            add(rawStr);
          });
        } else if (typeof args.value === "string" && String(args.value).includes("_")) {
          add(args.value);
        }

        if (isGrandTotal && mappedDataRef.current.length) {
          totalCarats = 0;
          totalPcs = 0;
          totalBaseAmt = 0;
          weightedDiscDenominator = 0;
          weightedDiscNumerator = 0;
          mappedDataRef.current.forEach((item) => add(item[fieldName]));
        }

        let avgDisc = 0;
        if (Math.abs(weightedDiscDenominator) > 0.01) {
          avgDisc = (
            ((weightedDiscNumerator * 1000) / weightedDiscDenominator) * 100 -
            100
          ).toFixed(2);
        } else if (args.cellSets && args.cellSets.length > 0) {
          let discSum = 0;
          let discCount = 0;
          args.cellSets.forEach((rowSet) => {
            let rawStr = getFieldValue(rowSet, fieldName);
            if (!rawStr) rawStr = buildFromNumeric(rowSet, baseName);
            if (rawStr) {
              const [p, c, d] = extractParts(String(rawStr));
              if (p > 0 || c > 0) {
                discSum += d;
                discCount++;
              }
            }
          });
          avgDisc = discCount > 0 ? (discSum / discCount).toFixed(2) : 0;
        }

        const rawValue = `${totalPcs}_${totalCarats}_${avgDisc}_${Number(totalBaseAmt).toFixed(2)}`;
        args.value = rawValue;
        args.formattedText = rawValue;
      },
      height: "850",
      width: "100%",
      showFieldList: true,
      showToolbar: true,
      showValuesButton: false,
      enableHtmlSanitizer: false,
      toolbar: [
        "New",
        "Save",
        "SaveAs",
        "Rename",
        "Remove",
        "Load",
        { template: '<button id="scrHeatmapToggle" class="e-btn e-flat">Heatmap Off</button>' },
        "Export",
        "SubTotal",
        "GrandTotal",
        "FieldList"
      ],
      gridSettings: {
        allowHtml: true,
        columnWidth: 120,
        rowHeight: 125,
        allowSelection: true,
        selectionSettings: {
          mode: "Cell",
          type: "Single",
          cellSelectionMode: "Box"
        },
        allowScrolling: true,
        excelQueryCellInfo: (args) => {
          if (args.value && typeof args.value === "string" && args.value.indexOf("_") !== -1) {
            const parts = args.value.split("_").map((p) => parseFloat(p) || 0);
            const lines = [];
            if (parts[0] !== 0) lines.push(`${parts[0]}`);
            if (parts[1] !== 0) lines.push(parts[1].toFixed(2));
            if (parts[2] !== 0) lines.push(`${Number(parts[2]).toFixed(2)}%`);
            if (parts[3] !== 0) lines.push(`$ ${Number(parts[3]).toFixed(2)}K`);
            args.value = lines.length ? lines.join("\n") : "";
          }
        }
      },
      displayOption: { view: "Both" },
      dataBound: () => {
        if (!aliveRef.current) return;
        updateHeatmapButtonText();
        if (heatmapEnabledRef.current) applyHeatmapColors();
        scheduleFormat(50);
        scheduleFormat(250);
        scheduleFormat(600);
      },
      enginePopulated: () => {
        if (!aliveRef.current) return;
        scheduleFormat(50);
      },
      allowExcelExport: true,
      allowConditionalFormatting: true,
      allowNumberFormatting: true,
      allowCalculatedField: true,
      allowDeferLayoutUpdate: true,
      allowDrillThrough: true,
      allowGrouping: true,
      enableValueSorting: true,
      enableFieldSearching: true,
      showTooltip: true,
      enableVirtualization: false,
      showGroupingBar: true,
      exportAllPages: false,
      maxNodeLimitInMemberEditor: 50,
      saveReport: (args) => {
        const reports = JSON.parse(localStorage[STORAGE_KEY] || "[]");
        if (args.report && args.reportName !== "") {
          const report = JSON.parse(args.report);
          report.dataSourceSettings.dataSource = mappedData;
          if (pivotRef.current) report.pivotValues = pivotRef.current.pivotValues;
          args.report = JSON.stringify(report);
          const index = reports.findIndex((item) => item.reportName === args.reportName);
          if (index !== -1) reports[index].report = args.report;
          else reports.push(args);
          localStorage[STORAGE_KEY] = JSON.stringify(reports);
        }
      },
      fetchReport: (args) => {
        const reports = JSON.parse(localStorage[STORAGE_KEY] || "[]");
        args.reportName = reports.map((item) => item.reportName);
      },
      loadReport: (args) => {
        const reports = JSON.parse(localStorage[STORAGE_KEY] || "[]");
        const reportItem = reports.find((item) => item.reportName === args.reportName);
        if (reportItem && pivotRef.current) {
          const report = JSON.parse(reportItem.report);
          report.dataSourceSettings.dataSource = mappedData;
          if (!report.dataSourceSettings.values || report.dataSourceSettings.values.length < 4) {
            report.dataSourceSettings.values = defaultValues;
          }
          pivotRef.current.dataSourceSettings = report.dataSourceSettings;
        }
      },
      removeReport: (args) => {
        let reports = JSON.parse(localStorage[STORAGE_KEY] || "[]");
        reports = reports.filter((item) => item.reportName !== args.reportName);
        localStorage[STORAGE_KEY] = JSON.stringify(reports);
      },
      renameReport: (args) => {
        const reports = JSON.parse(localStorage[STORAGE_KEY] || "[]");
        const index = reports.findIndex((item) => item.reportName === args.reportName);
        if (index !== -1) reports[index].reportName = args.rename;
        localStorage[STORAGE_KEY] = JSON.stringify(reports);
      },
      newReport: () => {
        if (pivotRef.current) {
          pivotRef.current.setProperties(
            {
              dataSourceSettings: {
                dataSource: mappedData,
                columns: [{ name: "Col", caption: "Col" }],
                rows: [{ name: "Clarity", caption: "Clarity" }],
                values: defaultValues,
                filters: []
              }
            },
            false
          );
        }
      },
      beforeExport: (args) => {
        args.fileName = "Stock Consumption Report";
      }
    });

    const wrapper = containerRef.current;
    if (!wrapper) return;

    const host = document.createElement("div");
    host.className = "scr-pivot-host";
    host.style.width = "100%";
    host.style.minHeight = "400px";
    wrapper.appendChild(host);
    hostElRef.current = host;

    pivot.appendTo(host);
    pivotRef.current = pivot;
    setupHeatmapToggle();
  };

  useEffect(() => {
    aliveRef.current = true;
    const ej = getEj();
    if (!ej?.pivotview?.PivotView || !containerRef.current) return undefined;

    destroyPivot();

    if (data && data.length > 0) {
      loadPivot(data, ej);
    }

    return () => {
      aliveRef.current = false;
      destroyPivot();
    };
  }, [data]);

  return (
    <div className="scr-pivot-wrap" style={{ width: "100%", overflowX: "auto", minHeight: 400 }}>
      <style>{`
        .scr-pivot-wrap td.e-rowcell,
        .scr-pivot-wrap td.e-valuescontent {
          height: 125px !important;
          vertical-align: middle !important;
        }
        .scr-pivot-wrap .e-stackedheadercelldiv {
          font-size: 19px !important;
          font-weight: bold !important;
        }
        .scr-pivot-wrap .e-rowsheader .e-cellvalue {
          font-size: 19px !important;
          font-weight: bold !important;
        }
        .scr-pivot-wrap .e-rowcell {
          font-size: 11px !important;
        }
      `}</style>
      <div ref={containerRef} style={{ width: "100%" }} />
    </div>
  );
};

export default SolitaireConsumptionPivotView;
