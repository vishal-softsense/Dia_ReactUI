import React, { useEffect, useRef } from "react";

const MonthAnalysisPivotView = ({
  data = [],
  reportType = "",
  groupBy = "Party",
  chkPayable = false,
  chkReceivable = false
}) => {
  const containerRef = useRef(null);
  const pivotRef = useRef(null);
  const heatmapEnabledRef = useRef(false);
  const heatmapListenerRef = useRef(false);
  const dataRef = useRef(data);
  const reportTypeRef = useRef(reportType);

  dataRef.current = data;
  reportTypeRef.current = reportType;

  const isPurSaleMode = ["Pur", "Sale", "BothPurchaseSale"].includes(reportType);

  const getEj = () => (typeof window !== "undefined" ? window.ej : null);

  const updateHeatmapButtonText = () => {
    const btn = document.getElementById("heatmapToggle");
    if (btn) {
      btn.textContent = heatmapEnabledRef.current ? "Heatmap On" : "Heatmap Off";
    }
  };

  const resetHeatmapColors = () => {
    document.querySelectorAll("td.e-valuescontent").forEach((cell) => {
      cell.style.backgroundColor = "";
      cell.style.color = "";
    });
  };

  const extractCellAmount = (cell) => {
    const raw = (cell.getAttribute("data-raw") || "").trim();
    if (raw.includes("_")) {
      const parts = raw.split("_");
      const amt = parseFloat(parts[3]);
      return Number.isNaN(amt) ? null : amt;
    }
    const text = (cell.innerText || cell.textContent || "").replace(/,/g, "").trim();
    const amtMatch = text.match(/amt:\s*([\d.-]+)/i);
    if (amtMatch) {
      const amt = parseFloat(amtMatch[1]);
      return Number.isNaN(amt) ? null : amt;
    }
    const num = parseFloat(text.replace(/[^0-9.\-]/g, ""));
    return Number.isNaN(num) ? null : num;
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

      Object.values(columnGroups).forEach((cellGroup) => {
        const values = [];
        cellGroup.forEach((cell) => {
          const amt = extractCellAmount(cell);
          if (amt !== null) values.push(amt);
        });
        if (values.length === 0) return;

        const min = Math.min(...values);
        const max = Math.max(...values);

        cellGroup.forEach((cell) => {
          const amt = extractCellAmount(cell);
          if (amt === null) return;
          const ratio = (amt - min) / (max - min || 1);
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
      if (e.target && e.target.id === "heatmapToggle") {
        heatmapEnabledRef.current = !heatmapEnabledRef.current;
        if (heatmapEnabledRef.current) {
          applyHeatmapColors();
        } else {
          resetHeatmapColors();
        }
        updateHeatmapButtonText();
      }
    });
    heatmapListenerRef.current = true;
  };

  const formatUnderscoreCells = () => {
    const host = containerRef.current;
    if (!host) return;

    const cells = host.querySelectorAll(".e-movablecontent td.e-valuescontent, .e-gridcontent td.e-valuescontent");
    cells.forEach((cell) => {
      const text = (cell.getAttribute("data-raw") || cell.innerText || cell.textContent || "").trim();
      if (!text || text.indexOf("_") === -1) return;

      const parts = text.split("_");
      cell.setAttribute("data-raw", text);
      const pValue = parseFloat(parts[0]) || 0;
      const cValue = parseFloat(parts[1]) || 0;
      const dValue = parseFloat(parts[2]) || 0;
      const aValue = parseFloat(parts[3]) || 0;
      const rValue = parseFloat(parts[4]) || 0;

      cell.innerHTML = `
        <div class="mar-metric-cell">
          <div>${pValue !== 0 ? pValue : "&nbsp;"}</div>
          <div>${cValue !== 0 ? cValue.toFixed(2) : "&nbsp;"}</div>
          <div>${aValue !== 0 ? aValue.toFixed(2) : "&nbsp;"}</div>
          <div>${dValue !== 0 ? `${dValue.toFixed(2)}%` : "&nbsp;"}</div>
          <div>${rValue !== 0 ? rValue.toFixed(2) : "&nbsp;"}</div>
        </div>`;
    });
  };

  const syncPartyRowHeights = () => {
    const host = containerRef.current;
    if (!host) return;

    const ROW_HEIGHT = 150;

    host.querySelectorAll(".e-gridheader td, .e-frozenheader td, .e-movableheader td").forEach((td) => {
      td.style.height = "";
      td.style.minHeight = "";
    });

    const frozenRows = Array.from(
      host.querySelectorAll(".e-frozencontent tbody tr, .e-leftfreeze tbody tr")
    );
    const movableRows = Array.from(host.querySelectorAll(".e-movablecontent tbody tr"));
    const pairCount = Math.min(frozenRows.length, movableRows.length);

    for (let i = 0; i < pairCount; i++) {
      const frozenRow = frozenRows[i];
      const movableRow = movableRows[i];

      [frozenRow, movableRow].forEach((row) => {
        row.style.height = "auto";
        row.querySelectorAll("td").forEach((td) => {
          td.style.height = "auto";
          td.style.minHeight = "";
        });
      });

      const h = Math.max(
        Math.ceil(frozenRow.getBoundingClientRect().height),
        Math.ceil(movableRow.getBoundingClientRect().height),
        ROW_HEIGHT
      );

      frozenRow.style.height = `${h}px`;
      movableRow.style.height = `${h}px`;

      frozenRow.querySelectorAll("td").forEach((td) => {
        td.style.height = `${h}px`;
        td.style.minHeight = `${h}px`;
        td.style.verticalAlign = "middle";
      });
      movableRow.querySelectorAll("td").forEach((td) => {
        td.style.height = `${h}px`;
        td.style.minHeight = `${h}px`;
        td.style.verticalAlign = "middle";
      });
    }

    if (pairCount === 0) {
      host.querySelectorAll(".e-gridcontent tbody tr").forEach((tr) => {
        if (tr.closest(".e-gridheader")) return;
        tr.style.height = `${ROW_HEIGHT}px`;
        tr.querySelectorAll("td.e-rowsheader, td.e-rowcell, td.e-valuescontent").forEach((td) => {
          td.style.height = `${ROW_HEIGHT}px`;
          td.style.minHeight = `${ROW_HEIGHT}px`;
          td.style.verticalAlign = "middle";
        });
      });
    }
  };

  const refreshPivotLayout = () => {
    const pivot = pivotRef.current;
    const host = containerRef.current;
    if (!pivot || !host) return;
    try {
      host.style.width = "100%";
      if (pivot.element) pivot.element.style.width = "100%";
      pivot.width = "100%";
      if (typeof pivot.layoutRefresh === "function") {
        pivot.layoutRefresh();
      } else if (typeof pivot.refresh === "function") {
        pivot.refresh();
      }
      setTimeout(() => {
        formatUnderscoreCells();
        syncPartyRowHeights();
      }, 250);
    } catch (e) {
    }
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

  const loadPayableReceivablePivot = (rawArray, ej) => {
    const STORAGE_KEY = "pivotviewReports_MonthAnalysis";
    let sorted = [...rawArray];
    if (sorted.length && Object.prototype.hasOwnProperty.call(sorted[0], "SortKey")) {
      sorted.sort((a, b) => (parseInt(a.SortKey, 10) || 0) - (parseInt(b.SortKey, 10) || 0));
    }

    const valuesConfig = [];
    if (chkPayable) valuesConfig.push({ name: "TotalPayable", caption: "Payable" });
    if (chkReceivable) valuesConfig.push({ name: "TotalReceivable", caption: "Receivable" });

    const pivot = new ej.pivotview.PivotView({
      dataSourceSettings: {
        dataSource: sorted,
        allowDragAndDrop: true,
        expandAll: false,
        rows: [{ name: "PartyName", caption: groupBy }],
        columns: [
          { name: "Year", caption: "Year" },
          { name: "Month", caption: "Month" }
        ],
        sortSettings: [
          { name: "Month", order: "None" },
          { name: "Year", order: "None" }
        ],
        values: valuesConfig,
        formatSettings: [
          { name: "TotalPayable", format: "N2" },
          { name: "TotalReceivable", format: "N2" }
        ],
        filters: [],
        showGrandTotals: true,
        showSubTotals: true,
        alwaysShowValueHeader: true
      },
      toolbar: [
        "New",
        "Save",
        "SaveAs",
        "Rename",
        "Remove",
        "Load",
        "Grid",
        { template: '<button id="heatmapToggle" class="e-btn e-flat">Heatmap Off</button>' },
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
      enableValueSorting: true,
      enableFieldSearching: true,
      showToolbar: true,
      showTooltip: true,
      enableVirtualization: false,
      height: "850",
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
        selectionSettings: {
          mode: "Cell",
          type: "Single",
          cellSelectionMode: "Box"
        },
        excelQueryCellInfo: (args) => {
          if (args.cell && args.cell.axis === "value" && args.cell.value === undefined) {
            args.style.numberFormat = undefined;
          }
        }
      },
      chartSettings: {
        title: "Month Analysis Chart",
        chartSeries: { type: "Column", value: "Amt", name: "Amount" },
        primaryYAxis: { border: { width: 0 } },
        load: (args) => {
          let theme = (window.location.hash.split("/")[1] || "Material");
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
      saveReport: (args) => {
        const reports = JSON.parse(localStorage[STORAGE_KEY] || "[]");
        if (args.report && args.reportName !== "") {
          const report = JSON.parse(args.report);
          report.dataSourceSettings.dataSource = sorted;
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
          pivotRef.current.dataSourceSettings = JSON.parse(reportItem.report).dataSourceSettings;
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
            { dataSourceSettings: { columns: [], rows: [], values: [], filters: [] } },
            false
          );
        }
      },
      beforeExport: (args) => {
        args.fileName = "Month Analysis Report";
      }
    });

    pivot.appendTo(containerRef.current);
    pivotRef.current = pivot;
    setupHeatmapToggle();
  };

  const loadPurSalePivot = (rawArray, ej, selected) => {
    const STORAGE_KEY = `pivotviewReports_${selected}`;

    const filteredData = rawArray.filter((r) => {
      if (selected === "Pur") return r.PurData != null;
      if (selected === "Sale") return r.SaleData != null;
      return true;
    });

    const valuesArray = [];
    if (selected === "Pur") valuesArray.push({ name: "PurData", caption: "Purchase" });
    if (selected === "Sale") valuesArray.push({ name: "SaleData", caption: "Sale" });
    if (selected === "BothPurchaseSale") {
      valuesArray.push({ name: "PurData", caption: "Purchase" });
      valuesArray.push({ name: "SaleData", caption: "Sale" });
    }

    const finalData = filteredData.map((r) => ({
      PartyName: r.PartyName,
      YearMonth: r.YearMonth,
      Month: r.Month,
      Year: r.Year,
      PurData: selected === "Pur" || selected === "BothPurchaseSale" ? r.PurData : null,
      SaleData: selected === "Sale" || selected === "BothPurchaseSale" ? r.SaleData : null
    }));

    const pivot = new ej.pivotview.PivotView({
      dataSourceSettings: {
        dataSource: finalData,
        allowDragAndDrop: true,
        rows: [{ name: "PartyName" }],
        columns: [
          { name: "Year", caption: "Year" },
          { name: "Month", caption: "Month" }
        ],
        sortSettings: [
          { name: "Month", order: "None" },
          { name: "Year", order: "None" }
        ],
        expandAll: false,
        filters: [],
        values: valuesArray,
        showSubTotals: true,
        showGrandTotals: true,
        grandTotalsPosition: "Top",
        alwaysShowValueHeader: true
      },
      aggregateCellInfo: (args) => {
        if (args.fieldName !== "PurData" && args.fieldName !== "SaleData") return;

        const extractParts = (str) => {
          if (!str || typeof str !== "string" || !str.includes("_")) return [0, 0, 0, 0, 0];
          const [p, c, d, a, r] = str.split("_");
          return [
            parseFloat(p) || 0,
            parseFloat(c) || 0,
            parseFloat(d) || 0,
            parseFloat(a) || 0,
            parseFloat(r) || 0
          ];
        };

        let totalPcs = 0;
        let totalCts = 0;
        let totalAmt = 0;
        let sumOfRateTimesCts = 0;

        const add = (str) => {
          const [p, c, , a, r] = extractParts(str);
          totalPcs += p;
          totalCts += c;
          totalAmt += a;
          sumOfRateTimesCts += r * c;
        };

        const isGrand = args.rowCellType?.grandTotal && args.columnCellType?.grandTotal;
        const dataField = args.fieldName;

        if (isGrand && Array.isArray(finalData)) {
          finalData.filter((i) => i[dataField]).forEach((i) => add(i[dataField]));
        } else if (args.cellSets && args.cellSets.length) {
          args.cellSets.forEach((cs) => {
            if (cs[dataField]) add(cs[dataField]);
          });
        } else if (args.value && typeof args.value === "string" && args.value.includes("_")) {
          add(args.value);
        }

        const totalRate = totalCts > 0 ? sumOfRateTimesCts / totalCts : 0;
        const totalMRP = totalRate * totalCts;
        let avgDisc = 0;
        if (totalMRP !== 0) avgDisc = (totalAmt / totalMRP) * 100 - 100;
        avgDisc = Number(avgDisc.toFixed(2));

        const fmt = (n) => Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 });
        const bold =
          isGrand || args.rowCellType?.isSubTotal || args.columnCellType?.isSubTotal
            ? "bold"
            : "normal";

        args.value = `${totalPcs}_${totalCts}_${avgDisc}_${totalAmt}_${totalRate}`;
        args.formattedText = `
          <div style="text-align:center; font-weight:${bold}">
            <div>pcs: ${totalPcs}</div>
            <div>cts: ${fmt(totalCts)}</div>
            <div>disc: ${avgDisc}%</div>
            <div>amt: ${fmt(totalAmt)}</div>
            <div>rate: ${fmt(totalRate)}</div>
          </div>`;
      },
      height: "1100",
      width: "100%",
      showFieldList: true,
      showToolbar: true,
      toolbar: [
        "New",
        "Save",
        "SaveAs",
        "Rename",
        "Remove",
        "Load",
        { template: '<button id="heatmapToggle" class="e-btn e-flat">Heatmap Off</button>' },
        "Export",
        "SubTotal",
        "GrandTotal",
        "FieldList"
      ],
      gridSettings: {
        allowHtml: true,
        showValuesButton: false,
        columnWidth: 120,
        rowHeight: 150,
        allowSelection: true,
        selectionSettings: {
          mode: "Cell",
          type: "Single",
          cellSelectionMode: "Box"
        },
        allowScrolling: true,
        enableAdaptiveWidth: false,
        overflow: "auto",
        excelQueryCellInfo: (args) => {
          if (args.value && typeof args.value === "string" && args.value.indexOf("_") !== -1) {
            const parts = args.value.split("_").map((p) => parseFloat(p) || 0);
            const lines = [];
            if (parts[0] !== 0) lines.push(`P: ${parts[0].toFixed(2)}`);
            if (parts[1] !== 0) lines.push(`C: ${parts[1].toFixed(2)}`);
            if (parts[2] !== 0) lines.push(`${parts[2].toFixed(2)}%`);
            if (parts[3] !== 0) lines.push(`$${parts[3].toFixed(2)} `);
            if (parts[4] !== 0) lines.push(`${parts[4].toFixed(2)}`);
            args.value = lines.length > 0 ? lines.join("\n") : "";
            args.style = {
              wrapText: true,
              verticalAlignment: "Top",
              horizontalAlignment: "Center"
            };
          }
        },
        pdfQueryCellInfo: (args) => {
          if (args.value && typeof args.value === "string" && args.value.indexOf("_") !== -1) {
            const parts = args.value.split("_").map((p) => parseFloat(p) || 0);
            const lines = [];
            if (parts[0] !== 0) lines.push(`${parts[0].toFixed(2)}`);
            if (parts[1] !== 0) lines.push(`${parts[1].toFixed(2)}`);
            if (parts[2] !== 0) lines.push(`${parts[2].toFixed(2)}%`);
            if (parts[3] !== 0) lines.push(`$${parts[3].toFixed(2)}`);
            if (parts[4] !== 0) lines.push(`${parts[4].toFixed(2)}`);
            args.value = lines.length > 0 ? lines.join("\n") : "";
          }
        }
      },
      allowExcelExport: true,
      allowPdfExport: true,
      allowConditionalFormatting: true,
      allowNumberFormatting: true,
      allowCalculatedField: false,
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
      showValuesButton: false,
      displayOption: { view: "Both" },
      beforeExport: (args) => {
        args.fileName = "Purchase Report";
      },
      dataBound: () => {
        updateHeatmapButtonText();
        setTimeout(() => {
          const host = containerRef.current;
          if (!host) return;
          const grandTotalCell = host.querySelector(
            ".e-frozencontent tr td.e-gtot.e-rowsheader, tr td.e-gtot.e-rowsheader"
          );
          if (grandTotalCell) {
            const grandTotalRow = grandTotalCell.closest("tr");
            const tbody = grandTotalRow?.parentElement;
            if (grandTotalRow && tbody) {
              tbody.prepend(grandTotalRow);
              grandTotalCell.innerHTML = `
                <div style="line-height:1.7;">
                  <div style="font-size:16px;"> Pcs</div>
                  <div style="font-size:16px;"> Cts</div>
                  <div style="font-size:16px;"> $ Amount </div>
                  <div style="font-size:16px;"> Avg Back% </div>
                  <div style="font-size:16px;"> Avg. Rate</div>
                </div>`;
              grandTotalCell.style.paddingLeft = "1rem";
            }
          }
        }, 50);
        if (heatmapEnabledRef.current) applyHeatmapColors();
        setTimeout(() => {
          formatUnderscoreCells();
          syncPartyRowHeights();
        }, 200);
      },
      saveReport: (args) => {
        const reports = JSON.parse(localStorage[STORAGE_KEY] || "[]");
        if (args.report && args.reportName !== "") {
          const report = JSON.parse(args.report);
          report.dataSourceSettings.dataSource = finalData;
          args.report = JSON.stringify(report);
          const index = reports.findIndex((item) => item.reportName === args.reportName);
          if (index !== -1) reports[index].report = args.report;
          else reports.push(args);
          localStorage[STORAGE_KEY] = JSON.stringify(reports);
        }
      },
      fetchReport: (args) => {
        const reports = JSON.parse(localStorage[STORAGE_KEY] || "[]");
        args.reportName = reports.map((x) => x.reportName);
      },
      loadReport: (args) => {
        const reports = JSON.parse(localStorage[STORAGE_KEY] || "[]");
        const report = reports.find((x) => x.reportName === args.reportName);
        if (report && pivotRef.current) {
          pivotRef.current.dataSourceSettings = JSON.parse(report.report).dataSourceSettings;
        }
      },
      removeReport: (args) => {
        const reports = JSON.parse(localStorage[STORAGE_KEY] || "[]").filter(
          (x) => x.reportName !== args.reportName
        );
        localStorage[STORAGE_KEY] = JSON.stringify(reports);
      },
      renameReport: (args) => {
        const reports = JSON.parse(localStorage[STORAGE_KEY] || "[]");
        const i = reports.findIndex((x) => x.reportName === args.reportName);
        if (i !== -1) reports[i].reportName = args.rename;
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
    const hideLicenseBanner = () => {
      document
        .querySelectorAll(
          ".e-license-banner, .e-js-licensing, .e-license, #js-licensing"
        )
        .forEach((el) => {
          el.style.setProperty("display", "none", "important");
          el.style.setProperty("visibility", "hidden", "important");
          el.remove();
        });
    };
    hideLicenseBanner();
    const observer = new MutationObserver(hideLicenseBanner);
    observer.observe(document.body, { childList: true, subtree: true });
    const interval = setInterval(hideLicenseBanner, 2000);
    return () => {
      observer.disconnect();
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    let timer = null;
    const scheduleRefresh = () => {
      clearTimeout(timer);
      timer = setTimeout(refreshPivotLayout, 200);
    };

    window.addEventListener("resize", scheduleRefresh);

    const attrObserver = new MutationObserver((mutations) => {
      const sidebarChanged = mutations.some(
        (m) => m.type === "attributes" && m.attributeName === "data-sidebar-size"
      );
      if (sidebarChanged) scheduleRefresh();
    });
    attrObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-sidebar-size", "data-layout", "class"]
    });

    return () => {
      window.removeEventListener("resize", scheduleRefresh);
      attrObserver.disconnect();
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    const ej = getEj();
    if (!ej || !ej.pivotview || !containerRef.current) return;
    if (!data || data.length === 0 || !reportType) {
      destroyPivot();
      return;
    }

    destroyPivot();

    if (isPurSaleMode) {
      loadPurSalePivot(data, ej, reportType);
    } else {
      loadPayableReceivablePivot(data, ej);
    }

    return () => {
      destroyPivot();
    };
  }, [data, reportType, groupBy, chkPayable, chkReceivable, isPurSaleMode]);

  return (
    <div className="month-analysis-pivot-wrap" style={{ width: "100%" }}>
      <style>{`
        .month-analysis-pivot-wrap {
          width: 100% !important;
        }
        .month-analysis-pivot-wrap .e-pivotview,
        .month-analysis-pivot-wrap .e-pivotview .e-grid {
          width: 100% !important;
          max-width: 100% !important;
        }
        .month-analysis-pivot-wrap .e-pivotview .e-grid {
          font-size: 13px;
          border: 1px solid #ccc;
        }
        .month-analysis-pivot-wrap .e-pivotview .e-gridheader,
        .month-analysis-pivot-wrap .e-pivotview .e-gridcontent {
          background: #fff;
        }
        .month-analysis-pivot-wrap .e-pivotview .e-valuescontent {
          font-weight: normal;
          color: #222;
        }
        .month-analysis-pivot-wrap .e-pivotview .e-grid td {
          padding: 4px 6px;
        }
        .month-analysis-pivot-wrap .e-pivotview .e-pivot-button {
          background: #fff !important;
          border: 1px solid #ccc !important;
          font-size: 12px;
          padding: 2px 6px;
          box-shadow: none !important;
        }

        .month-analysis-pivot-wrap .e-movableheader .e-headercell,
        .month-analysis-pivot-wrap .e-movableheader td,
        .month-analysis-pivot-wrap .e-gridheader:not(.e-frozenheader) .e-headercell {
          height: 36px !important;
          min-height: 36px !important;
          max-height: 36px !important;
          padding-top: 4px !important;
          padding-bottom: 4px !important;
          vertical-align: middle !important;
          line-height: 1.2 !important;
        }
        .month-analysis-pivot-wrap .e-frozenheader .e-headercell:not([rowspan]),
        .month-analysis-pivot-wrap .e-frozenheader td:not([rowspan]) {
          height: 36px !important;
          min-height: 36px !important;
          max-height: 36px !important;
          padding-top: 4px !important;
          padding-bottom: 4px !important;
          vertical-align: middle !important;
        }
        .month-analysis-pivot-wrap .e-frozenheader .e-headercell[rowspan],
        .month-analysis-pivot-wrap .e-frozenheader td[rowspan] {
          height: auto !important;
          min-height: 0 !important;
          max-height: none !important;
          vertical-align: middle !important;
        }
        .month-analysis-pivot-wrap .e-gridheader .e-headercelldiv,
        .month-analysis-pivot-wrap .e-frozenheader .e-headercelldiv,
        .month-analysis-pivot-wrap .e-movableheader .e-headercelldiv {
          height: auto !important;
          min-height: 0 !important;
          line-height: 1.2 !important;
          padding: 0 !important;
        }
        .month-analysis-pivot-wrap .e-gridheader .e-headertext,
        .month-analysis-pivot-wrap .e-frozenheader .e-headertext,
        .month-analysis-pivot-wrap .e-movableheader .e-headertext {
          line-height: 1.2 !important;
          font-size: 13px !important;
        }
        .month-analysis-pivot-wrap .e-movableheader .e-columnheader,
        .month-analysis-pivot-wrap .e-gridheader .e-columnheader {
          height: 36px !important;
        }

        .month-analysis-pivot-wrap .e-grid .e-gridheader,
        .month-analysis-pivot-wrap .e-frozenheader,
        .month-analysis-pivot-wrap .e-movableheader,
        .month-analysis-pivot-wrap .e-headercontent {
          border-bottom: 0 !important;
          margin-bottom: 0 !important;
          padding-bottom: 0 !important;
          box-shadow: none !important;
        }
        .month-analysis-pivot-wrap .e-grid .e-gridcontent,
        .month-analysis-pivot-wrap .e-frozencontent,
        .month-analysis-pivot-wrap .e-movablecontent,
        .month-analysis-pivot-wrap .e-content {
          border-top: 0 !important;
          margin-top: 0 !important;
          padding-top: 0 !important;
        }
        .month-analysis-pivot-wrap .e-gridheader table,
        .month-analysis-pivot-wrap .e-frozenheader table,
        .month-analysis-pivot-wrap .e-movableheader table {
          border-collapse: collapse !important;
          margin-bottom: 0 !important;
        }
        .month-analysis-pivot-wrap .e-movableheader .e-headercell,
        .month-analysis-pivot-wrap .e-frozenheader .e-headercell {
          border-bottom: 1px solid #e0e0e0 !important;
        }
        .month-analysis-pivot-wrap .e-grid .e-headercontent {
          border-bottom-color: #e0e0e0 !important;
        }

        .month-analysis-pivot-wrap .e-frozencontent td.e-rowsheader,
        .month-analysis-pivot-wrap .e-frozencontent td.e-rowcell,
        .month-analysis-pivot-wrap .e-movablecontent td.e-valuescontent,
        .month-analysis-pivot-wrap .e-movablecontent td.e-rowcell {
          height: 150px !important;
          min-height: 150px !important;
          vertical-align: middle !important;
          box-sizing: border-box !important;
        }
        .month-analysis-pivot-wrap .mar-metric-cell {
          text-align: right;
          line-height: 1.7;
          padding: 2px;
          font-size: 16px;
        }
        .month-analysis-pivot-wrap .e-rowsheader .e-cellvalue {
          font-size: 14px !important;
          font-weight: 500 !important;
        }
        .month-analysis-pivot-wrap .e-rowcell.e-gtot.e-rowsheader {
          font-size: 15px;
        }
        .e-license-banner,
        .e-js-licensing,
        .e-license {
          display: none !important;
          visibility: hidden !important;
        }
      `}</style>
      <div
        id="PivotViewHost"
        ref={containerRef}
        style={{ width: "100%", overflowX: "auto", minHeight: "calc(100vh - 380px)" }}
      />
    </div>
  );
};

export default MonthAnalysisPivotView;
