import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Container, Row, Col, Card, CardBody, CardHeader, Button,
  FormGroup, Label, Input, Spinner, Nav, NavItem, NavLink, TabContent, TabPane
} from "reactstrap";
import ReactSelect from "react-select";
import Flatpickr from "react-flatpickr";
import { toast, ToastContainer } from "react-toastify";
import { Doughnut, Bar, Pie } from "react-chartjs-2";
import classnames from "classnames";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import {
  getStockAnalysisReport,
  getStockAnalysisPivotByFilter,
  getStockAnalysisPivotFixed,
  getStockAnalysisDropdowns
} from "../../helpers/fakebackend_helper";
import StockAnalysisPivotByFilterView from "./StockAnalysisPivotByFilterView";
import StockAnalysisPivotFixedView from "./StockAnalysisPivotFixedView";
import "chart.js/auto";

const Select = (props) => (
  <ReactSelect
    menuPortalTarget={document.body}
    styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }), ...props.styles }}
    {...props}
  />
);

const CHART_COLORS = ["#91eded", "#FFCE25", "#4BC0C0", "#9966FF", "#FF6384", "#FF00FF", "#0000FF", "#75cb7c", "#38A2EB"];

const PIVOT_BY_FILTER_ALLOWED = ["Shape", "Size", "Color", "Clarity", "Prop", "Symmetry", "FL", "Polish"];

const GROUPING_OPTIONS = [
  { value: "Lab", label: "Lab" },
  { value: "Shape", label: "Shape" },
  { value: "Size", label: "Size" },
  { value: "Color", label: "Color" },
  { value: "Clarity", label: "Clarity" },
  { value: "Prop", label: "Prop" },
  { value: "Polish", label: "Polish" },
  { value: "Symmetry", label: "Symmetry" },
  { value: "CPS", label: "CPS" },
  { value: "FL", label: "Flou." },
  { value: "Series", label: "Series" },
  { value: "Location", label: "Location" },
  { value: "YearMonth", label: "Purchase Year-Month" },
  { value: "Aging", label: "Aging" },
  { value: "PriceRevision", label: "Price Revision" },
  { value: "StockID", label: "StockID" }
];

const SORT_OPTIONS = [
  "Sort On LAB-Shape-Size-Color-Clarity-LotNo",
  "Sort On LAB-Shape-Color-Size-Clarity-LotNo",
  "Sort On LAB-Shape-Size-Clarity-Color-LotNo",
  "Sort On Shape-LAB-Size-Color-Clarity-LotNo",
  "Sort On Shape-LAB-Color-Size-Clarity-LotNo",
  "Sort On Shape-LAB-Size-Clarity-Color-LotNo",
  "Sort On Shape-Size-Clarity-Color-LotNo",
  "Sort On Shape-Size-Color-Clarity-LotNo",
  "Sort On Shape-Size-Color-Clarity-Cut-Polish-Sym-Fl",
  "Sort On Kapan-LotNo",
  "Sort On ItemCode",
  "Sort On Item Serial No",
  "Sort On Stone Status & Lotno",
  "Sort On Size Wise",
  "Sort On Size-Color-Clarity-Lotno",
  "Sort On ItemGroup Wise",
  "Sort On Shape-Size-Clarity-Color"
];

const LOT_FILTER_OPTIONS = [
  { value: "LotNo", label: "LotNo" },
  { value: "LotNo Not", label: "LotNo Not" },
  { value: "LotNo Like", label: "LotNo Like" },
  { value: "KapanNo", label: "KapanNo" },
  { value: "KapanNo Not", label: "KapanNo Not" },
  { value: "PacketNo", label: "PacketNo" },
  { value: "PacketNo Not", label: "PacketNo Not" }
];

const arrowLinesPlugin = {
  id: "arrowLinesPlugin",
  afterDatasetsDraw(chart) {
    if (chart.config?.type !== "doughnut" && chart.config?.type !== "pie") return;
    const ctx = chart.ctx;
    const meta = chart.getDatasetMeta(0);
    const dataset = chart.data.datasets[0];
    if (!meta || !dataset) return;
    const centerX = (chart.chartArea.left + chart.chartArea.right) / 2;
    const centerY = (chart.chartArea.top + chart.chartArea.bottom) / 2;
    const usedPositions = [];
    ctx.save();
    ctx.strokeStyle = "#777";
    ctx.fillStyle = "#000";
    ctx.font = "bold 12px Arial";
    meta.data.forEach((arc, index) => {
      if (!arc || arc.startAngle == null) return;
      const angle = (arc.startAngle + arc.endAngle) / 2;
      const outerRadius = arc.outerRadius;
      let labelX = centerX + Math.cos(angle) * outerRadius;
      let labelY = centerY + Math.sin(angle) * outerRadius;
      while (usedPositions.some((pos) => Math.abs(pos - labelY) < 15)) {
        labelY += labelY > centerY ? 15 : -15;
      }
      usedPositions.push(labelY);
      const isRight = labelX > centerX;
      const lineEndX = labelX + (isRight ? 20 : -20);
      ctx.beginPath();
      ctx.moveTo(centerX + Math.cos(angle) * outerRadius, centerY + Math.sin(angle) * outerRadius);
      ctx.lineTo(labelX, labelY);
      ctx.lineTo(lineEndX, labelY);
      ctx.stroke();
      ctx.textAlign = isRight ? "left" : "right";
      ctx.fillText(`${chart.data.labels[index] ?? ""} - ${dataset.data[index]}%`, lineEndX + (isRight ? 10 : -10), labelY);
    });
    ctx.restore();
  }
};

const pick = (row, ...keys) => {
  for (const k of keys) {
    if (row[k] !== undefined && row[k] !== null) return row[k];
    const lk = k.charAt(0).toLowerCase() + k.slice(1);
    if (row[lk] !== undefined && row[lk] !== null) return row[lk];
  }
  return "";
};

const StockAnalysisReport = () => {
  const { t } = useTranslation();
  const today = new Date().toISOString().substring(0, 10);

  const [filterTab, setFilterTab] = useState("basic");
  const [showFilterPanel, setShowFilterPanel] = useState(true);
  const [viewMode, setViewMode] = useState(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pivotByFilterLoading, setPivotByFilterLoading] = useState(false);
  const [pivotFixedLoading, setPivotFixedLoading] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [pivotByFilterData, setPivotByFilterData] = useState([]);
  const [pivotFixedData, setPivotFixedData] = useState([]);
  const [stockAna, setStockAna] = useState("Lab");
  const [activeReportType, setActiveReportType] = useState("Lab");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(500);
  const [activeTab, setActiveTab] = useState("table");
  const [chartType, setChartType] = useState("doughnut");
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showChartTypeMenu, setShowChartTypeMenu] = useState(false);
  const chartMenusRef = useRef(null);

  const [date, setDate] = useState(today);
  const [show, setShow] = useState("Unsold");
  const [holdUnHold, setHoldUnHold] = useState("Unhold");
  const [stoneTypes, setStoneTypes] = useState("Single");
  const [status, setStatus] = useState("All");
  const [filterSize, setFilterSize] = useState(SORT_OPTIONS[0]);
  const [lotFilterType, setLotFilterType] = useState("LotNo");
  const [lotNo, setLotNo] = useState("");

  const [ctsFrm, setCtsFrm] = useState("");
  const [ctsTo, setCtsTo] = useState("");
  const [backFrm, setBackFrm] = useState("");
  const [backTo, setBackTo] = useState("");
  const [priceFrm, setPriceFrm] = useState("");
  const [priceTo, setPriceTo] = useState("");
  const [lotFrm, setLotFrm] = useState("");
  const [lotTo, setLotTo] = useState("");

  const [tDepthFrm, setTDepthFrm] = useState("");
  const [tDepthTo, setTDepthTo] = useState("");
  const [tablePerFrm, setTablePerFrm] = useState("");
  const [tablePerTo, setTablePerTo] = useState("");
  const [caFrm, setCaFrm] = useState("");
  const [caTo, setCaTo] = useState("");
  const [chFrm, setChFrm] = useState("");
  const [chTo, setChTo] = useState("");
  const [phFrm, setPhFrm] = useState("");
  const [phTo, setPhTo] = useState("");
  const [paFrm, setPaFrm] = useState("");
  const [paTo, setPaTo] = useState("");

  const [purchaseChk, setPurchaseChk] = useState(false);
  const [reviseChk, setReviseChk] = useState(false);
  const [newArrivalChk, setNewArrivalChk] = useState(false);
  const [webRevisedChk, setWebRevisedChk] = useState(false);
  const [unholdChk, setUnholdChk] = useState(false);
  const [labDateChk, setLabDateChk] = useState(false);
  const [frmPurchaseDate, setFrmPurchaseDate] = useState(today);
  const [toPurchaseDate, setToPurchaseDate] = useState(today);
  const [frmReviseDate, setFrmReviseDate] = useState(today);
  const [toReviseDate, setToReviseDate] = useState(today);
  const [frmNewArrivalDate, setFrmNewArrivalDate] = useState(today);
  const [toNewArrivalDate, setToNewArrivalDate] = useState(today);
  const [frmWebRevisedDate, setFrmWebRevisedDate] = useState(today);
  const [toWebRevisedDate, setToWebRevisedDate] = useState(today);
  const [frmUnholdDate, setFrmUnholdDate] = useState(today);
  const [toUnholdDate, setToUnholdDate] = useState(today);
  const [frmLabDate, setFrmLabDate] = useState(today);
  const [toLabDate, setToLabDate] = useState(today);

  const [dropdownOptions, setDropdownOptions] = useState({
    shapeGroup: [], shape: [], colorGroup: [], color: [], size: [], clarity: [],
    proportion: [], polish: [], symmetry: [], lab: [], rough: [], ha: [],
    location: [], fluorescence: [], milky: [], luster: [], natts: [],
    shade: [], flColor: [], itemGroup: [], pair: [], boxName: []
  });

  const [selectedShapeGroup, setSelectedShapeGroup] = useState([]);
  const [selectedShapes, setSelectedShapes] = useState([]);
  const [selectedColorGroup, setSelectedColorGroup] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [selectedClarities, setSelectedClarities] = useState([]);
  const [selectedProportions, setSelectedProportions] = useState([]);
  const [selectedPolishes, setSelectedPolishes] = useState([]);
  const [selectedSymmetries, setSelectedSymmetries] = useState([]);
  const [selectedLabs, setSelectedLabs] = useState([]);
  const [selectedRough, setSelectedRough] = useState([]);
  const [selectedHA, setSelectedHA] = useState([]);
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [selectedFluorescences, setSelectedFluorescences] = useState([]);
  const [selectedMilkies, setSelectedMilkies] = useState([]);
  const [selectedLusters, setSelectedLusters] = useState([]);
  const [selectedNatts, setSelectedNatts] = useState([]);
  const [selectedShades, setSelectedShades] = useState([]);
  const [selectedFlColors, setSelectedFlColors] = useState([]);
  const [selectedItemGroups, setSelectedItemGroups] = useState([]);
  const [selectedPairs, setSelectedPairs] = useState([]);
  const [selectedBoxNames, setSelectedBoxNames] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getStockAnalysisDropdowns();
        if (res.success || res.Success) {
          const d = res.data || res.Data || {};
          setDropdownOptions({
            shapeGroup: d.shapeGroup || [],
            shape: d.shape || [],
            colorGroup: d.colorGroup || [],
            color: d.color || [],
            size: d.size || [],
            clarity: d.clarity || [],
            proportion: d.proportion || [],
            polish: d.polish || [],
            symmetry: d.symmetry || [],
            lab: d.lab || [],
            rough: d.rough || [],
            ha: d.ha || [],
            location: d.location || [],
            fluorescence: d.fluorescence || [],
            milky: d.milky || [],
            luster: d.luster || [],
            natts: d.natts || [],
            shade: d.shade || [],
            flColor: d.flColor || [],
            itemGroup: d.itemGroup || [],
            pair: d.pair || [],
            boxName: d.boxName || []
          });
        }
      } catch {
        toast.error(t("Failed to load filter dropdowns"));
      }
    };
    load();
  }, [t]);

  useEffect(() => {
    const onDocClick = (e) => {
      if (chartMenusRef.current && !chartMenusRef.current.contains(e.target)) {
        setShowExportMenu(false);
        setShowChartTypeMenu(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    document.title = `${t("Stock Analysis Report")} | ${t("Admin")}`;
  }, [t]);

  const mapSelectVal = (list) => {
    if (!list?.length) return null;
    const vals = list.map((i) => i.value).filter((v) => v != null && String(v).trim() !== "");
    return vals.length ? vals : null;
  };

  const toOptions = (list) => (list || []).map((i) => ({ value: i.name || i.Name || i.id || i.ID, label: i.name || i.Name || String(i.id || i.ID) }));

  const buildPayload = () => ({
    date: date || null,
    show: show || null,
    holdUnHold: holdUnHold || null,
    stoneTypes: stoneTypes || null,
    status: status || null,
    shapeGroup: mapSelectVal(selectedShapeGroup),
    shape: mapSelectVal(selectedShapes),
    colorGroup: mapSelectVal(selectedColorGroup),
    color: mapSelectVal(selectedColors),
    size: mapSelectVal(selectedSizes),
    clarity: mapSelectVal(selectedClarities),
    proportion: mapSelectVal(selectedProportions),
    polish: mapSelectVal(selectedPolishes),
    symmetry: mapSelectVal(selectedSymmetries),
    lab: mapSelectVal(selectedLabs),
    rough: mapSelectVal(selectedRough),
    ha: mapSelectVal(selectedHA),
    location: mapSelectVal(selectedLocations),
    fluorescence: mapSelectVal(selectedFluorescences),
    milky: mapSelectVal(selectedMilkies),
    luster: mapSelectVal(selectedLusters),
    natts: mapSelectVal(selectedNatts),
    shade: mapSelectVal(selectedShades),
    flColor: mapSelectVal(selectedFlColors),
    itemGroup: mapSelectVal(selectedItemGroups),
    pair: mapSelectVal(selectedPairs),
    boxNm: mapSelectVal(selectedBoxNames),
    ctsFrm: parseFloat(ctsFrm) || 0,
    ctsTo: parseFloat(ctsTo) || 0,
    backFrm: parseFloat(backFrm) || 0,
    backTo: parseFloat(backTo) || 0,
    priceFrm: parseFloat(priceFrm) || 0,
    priceTo: parseFloat(priceTo) || 0,
    lotFrm: parseInt(lotFrm, 10) || 0,
    lotTo: parseInt(lotTo, 10) || 0,
    tDepthFrm: parseFloat(tDepthFrm) || 0,
    tDepthTo: parseFloat(tDepthTo) || 0,
    tablePerFrm: parseFloat(tablePerFrm) || 0,
    tablePerTo: parseFloat(tablePerTo) || 0,
    caFrm: parseFloat(caFrm) || 0,
    caTo: parseFloat(caTo) || 0,
    chFrm: parseFloat(chFrm) || 0,
    chTo: parseFloat(chTo) || 0,
    phFrm: parseFloat(phFrm) || 0,
    phTo: parseFloat(phTo) || 0,
    paFrm: parseInt(paFrm, 10) || 0,
    paTo: parseInt(paTo, 10) || 0,
    purchaseChkBox: purchaseChk,
    reviseCheckBox: reviseChk,
    newArrivalChkBox: newArrivalChk,
    webRevisedChkBox: webRevisedChk,
    unholdDateChkBox: unholdChk,
    labDateChkBox: labDateChk,
    frmPurchaseDate: purchaseChk ? frmPurchaseDate : null,
    toPurchaseDate: purchaseChk ? toPurchaseDate : null,
    frmReviseDate: reviseChk ? frmReviseDate : null,
    toReviseDate: reviseChk ? toReviseDate : null,
    frmNewArrivalDate: newArrivalChk ? frmNewArrivalDate : null,
    toNewArrivalDate: newArrivalChk ? toNewArrivalDate : null,
    frmWebRevisedDate: webRevisedChk ? frmWebRevisedDate : null,
    toWebRevisedDate: webRevisedChk ? toWebRevisedDate : null,
    frmUnholdDate: unholdChk ? frmUnholdDate : null,
    toUnholdDate: unholdChk ? toUnholdDate : null,
    frmLabDate: labDateChk ? frmLabDate : null,
    toLabDate: labDateChk ? toLabDate : null,
    lotNo: lotNo || null,
    filters: lotFilterType || null,
    filterSize: filterSize || null,
    stockAna,
    groupBy: stockAna
  });

  const getGroupingValue = (row, field) => {
    const f = field || activeReportType;
    if (!row || !f) return "";
    const v = pick(row, f, f.charAt(0).toLowerCase() + f.slice(1));
    return v === undefined || v === null || v === "" ? "Unknown" : String(v);
  };

  const rowNum = (row, ...names) => Number(pick(row, ...names) ?? 0);

  const fmtInt = (n) => Math.round(Number(n || 0));
  const fmtFloat = (n) => Number(n || 0).toFixed(2);
  const fmtCurrency = (n) =>
    Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleReport = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setViewMode("report");
    setSearched(true);
    setCurrentPage(1);
    try {
      const res = await getStockAnalysisReport(buildPayload());
      if (res.success || res.Success) {
        const raw = res.data ?? res.Data ?? [];
        setReportData(Array.isArray(raw) ? raw : []);
        setActiveReportType(stockAna);
        setActiveTab("table");
        setShowFilterPanel(false);
        if (!raw?.length) toast.info(t("No record found matching the configurations"));
      } else {
        toast.error(res.message || res.Message || t("Failed to load report"));
        setReportData([]);
      }
    } catch (err) {
      toast.error(typeof err === "string" ? err : err?.message || t("Error generating report"));
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePivotByFilter = async () => {
    if (!PIVOT_BY_FILTER_ALLOWED.includes(stockAna)) {
      window.alert("Invalid Group By selection! Please select Shape, Size, Color, Clarity, Proportion,Symmetry,FL,Polish.");
      return;
    }
    setPivotByFilterLoading(true);
    setViewMode("pivotByFilter");
    setSearched(false);
    try {
      const res = await getStockAnalysisPivotByFilter(buildPayload());
      if (res.success || res.Success) {
        setPivotByFilterData(res.data ?? res.Data ?? []);
        setShowFilterPanel(false);
      } else {
        toast.error(res.message || res.Message || t("Failed to load pivot data"));
        setPivotByFilterData([]);
      }
    } catch (err) {
      toast.error(typeof err === "string" ? err : err?.message || t("Error loading pivot"));
      setPivotByFilterData([]);
    } finally {
      setPivotByFilterLoading(false);
    }
  };

  const handlePivotFixed = async () => {
    setPivotFixedLoading(true);
    setViewMode("pivotFixed");
    setSearched(false);
    try {
      const res = await getStockAnalysisPivotFixed(buildPayload());
      if (res.success || res.Success) {
        setPivotFixedData(res.data ?? res.Data ?? []);
        setShowFilterPanel(false);
      } else {
        toast.error(res.message || res.Message || t("Failed to load pivot data"));
        setPivotFixedData([]);
      }
    } catch (err) {
      toast.error(typeof err === "string" ? err : err?.message || t("Error loading pivot"));
      setPivotFixedData([]);
    } finally {
      setPivotFixedLoading(false);
    }
  };

  const handleClear = () => {
    setDate(today);
    setShow("Unsold");
    setHoldUnHold("Unhold");
    setStoneTypes("Single");
    setStatus("All");
    setStockAna("Lab");
    setFilterSize(SORT_OPTIONS[0]);
    setLotFilterType("LotNo");
    setLotNo("");
    setCtsFrm(""); setCtsTo(""); setBackFrm(""); setBackTo("");
    setPriceFrm(""); setPriceTo(""); setLotFrm(""); setLotTo("");
    setTDepthFrm(""); setTDepthTo(""); setTablePerFrm(""); setTablePerTo("");
    setCaFrm(""); setCaTo(""); setChFrm(""); setChTo("");
    setPhFrm(""); setPhTo(""); setPaFrm(""); setPaTo("");
    setPurchaseChk(false); setReviseChk(false); setNewArrivalChk(false);
    setWebRevisedChk(false); setUnholdChk(false); setLabDateChk(false);
    [
      setSelectedShapeGroup, setSelectedShapes, setSelectedColorGroup, setSelectedColors,
      setSelectedSizes, setSelectedClarities, setSelectedProportions, setSelectedPolishes,
      setSelectedSymmetries, setSelectedLabs, setSelectedRough, setSelectedHA,
      setSelectedLocations, setSelectedFluorescences, setSelectedMilkies, setSelectedLusters,
      setSelectedNatts, setSelectedShades, setSelectedFlColors, setSelectedItemGroups,
      setSelectedPairs, setSelectedBoxNames
    ].forEach((fn) => fn([]));
    setReportData([]);
    setPivotByFilterData([]);
    setPivotFixedData([]);
    setViewMode(null);
    setSearched(false);
    setActiveReportType("Lab");
    setActiveTab("table");
    setShowFilterPanel(true);
    setSearchTerm("");
    setCurrentPage(1);
  };

  const filteredData = useMemo(() => {
    if (!searchTerm) return reportData;
    const term = searchTerm.toLowerCase();
    return reportData.filter((row) => {
      const gv = getGroupingValue(row, activeReportType).toLowerCase();
      return (
        gv.includes(term) ||
        String(pick(row, "Pcs", "pcs") ?? "").includes(term) ||
        String(pick(row, "Amount", "amount") ?? "").includes(term)
      );
    });
  }, [reportData, searchTerm, activeReportType]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;

  const totals = useMemo(() => {
    const sums = { pcs: 0, carats: 0, amount: 0 };
    filteredData.forEach((row) => {
      sums.pcs += rowNum(row, "Pcs", "pcs");
      sums.carats += rowNum(row, "Carats", "carats");
      sums.amount += rowNum(row, "Amount", "amount");
    });
    return sums;
  }, [filteredData]);

  const chartData = useMemo(() => {
    if (!reportData.length) return null;
    const labels = reportData.map((r) => getGroupingValue(r, activeReportType));
    const carats = reportData.map((r) => rowNum(r, "Carats", "carats"));
    const caratsper = reportData.map((r) => rowNum(r, "CaratsPer", "caratsPer"));
    const amount = reportData.map((r) => rowNum(r, "Amount", "amount"));
    const amountper = reportData.map((r) => rowNum(r, "AmountPer", "amountPer"));

    const makeChart = (title, perValues, hoverValues, isAmt) => ({
      labels,
      datasets: [{
        label: title,
        data: perValues,
        backgroundColor: CHART_COLORS,
        borderColor: "#fff",
        borderWidth: 2
      }],
      hoverValues,
      isAmt
    });

    return {
      caratsPer: makeChart("Carats%", caratsper, carats, false),
      amountPer: makeChart("Amount%", amountper, amount, true)
    };
  }, [reportData, activeReportType]);

  const buildChartConfig = (cd, type) => ({
    type,
    data: { labels: cd.labels, datasets: cd.datasets },
    plugins: type === "doughnut" || type === "pie" ? [arrowLinesPlugin] : [],
    options: {
      animation: { duration: 1000 },
      layout: { padding: { top: 30, bottom: 40 } },
      plugins: {
        title: { display: true, text: cd.datasets[0].label, font: { size: 18, weight: "bold" }, padding: { bottom: 30 } },
        legend: { display: false },
        datalabels: { display: false },
        tooltip: {
          callbacks: {
            label: (tooltipItem) => {
              const val = cd.hoverValues[tooltipItem.dataIndex];
              return cd.isAmt ? ` $${fmtFloat(val)}` : ` ${fmtFloat(val)} CRT`;
            }
          }
        }
      },
      responsive: true,
      maintainAspectRatio: false,
      scales: type === "bar" ? { y: { beginAtZero: true } } : {}
    }
  });

  const handleExportCSV = () => {
    const headers = [activeReportType, "Pcs", "Pcs%", "Carats", "Carats%", "Amount", "Amount%"];
    const rows = filteredData.map((row) => [
      getGroupingValue(row, activeReportType),
      pick(row, "Pcs", "pcs") ?? 0,
      pick(row, "PcsPer", "pcsPer") ?? 0,
      pick(row, "Carats", "carats") ?? 0,
      pick(row, "CaratsPer", "caratsPer") ?? 0,
      pick(row, "Amount", "amount") ?? 0,
      pick(row, "AmountPer", "amountPer") ?? 0
    ]);
    rows.push([
      "Total",
      totals.pcs, "", fmtFloat(totals.carats), "", fmtFloat(totals.amount), ""
    ]);
    const csvContent = [headers, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Stock_Analysis_Report_${activeReportType}_${new Date().toISOString().substring(0, 10)}.csv`;
    link.click();
  };

  const canvasIds = ["stockCaratPerChart", "stockAmountChart"];

  const handleChartExport = (format) => {
    const extension = format.includes("jpeg") ? "jpg" : format === "pdf" ? "pdf" : "png";
    const W = 400, H = 400, headerH = 60;
    const combined = document.createElement("canvas");
    combined.width = W * canvasIds.length;
    combined.height = H + headerH;
    const ctx2 = combined.getContext("2d");
    ctx2.fillStyle = "#ffffff";
    ctx2.fillRect(0, 0, combined.width, combined.height);
    ctx2.fillStyle = "#000000";
    ctx2.font = "bold 24px Arial";
    ctx2.textAlign = "center";
    ctx2.fillText("Stock Analysis Report", combined.width / 2, 40);

    let allReady = true;
    canvasIds.forEach((id, idx) => {
      const cvs = document.getElementById(id);
      if (!cvs) {
        toast.warning(`Chart "${id}" is not rendered yet.`);
        allReady = false;
        return;
      }
      ctx2.drawImage(cvs, W * idx, headerH, W, H);
    });
    if (!allReady) return;

    if (extension === "pdf") {
      if (!window.jspdf) { toast.error("jsPDF not loaded"); return; }
      const pdf = new window.jspdf.jsPDF({ orientation: "landscape", unit: "px", format: [combined.width, combined.height] });
      pdf.addImage(combined.toDataURL("image/png"), "PNG", 0, 0, combined.width, combined.height);
      pdf.save("StockAnalysis_Charts.pdf");
    } else {
      const link = document.createElement("a");
      link.href = combined.toDataURL(format, 1.0);
      link.download = `StockAnalysis_Charts.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const multiSelect = (label, options, value, onChange) => (
    <Col md={2} key={label}>
      <FormGroup>
        <Label className="fw-semibold text-uppercase small">{t(label)}</Label>
        <Select isMulti options={toOptions(options)} value={value} onChange={onChange} placeholder={t(label)} />
      </FormGroup>
    </Col>
  );

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title={t("Stock Analysis Report")} pageTitle={t("Dashboard")} />

          <Card className="glass-card mb-3">
            <CardHeader className="d-flex align-items-center justify-content-between flex-wrap gap-2 pb-2 border-0">
              <div className="d-flex align-items-center gap-2">
                <span className="text-body fw-semibold">{t("Stock Analysis Report")}</span>
              </div>
              <div className="d-flex align-items-center gap-2 flex-nowrap">
                <FormGroup className="mb-0 d-flex align-items-center gap-2">
                  <Label className="mb-0 fw-semibold">{t("Grouping")}</Label>
                  <Input type="select" bsSize="sm" style={{ width: 160 }} value={stockAna} onChange={(e) => setStockAna(e.target.value)}>
                    {GROUPING_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{t(o.label)}</option>
                    ))}
                  </Input>
                </FormGroup>
                <Button color="primary" size="sm" onClick={handlePivotByFilter} disabled={pivotByFilterLoading}>
                  {pivotByFilterLoading ? <Spinner size="sm" /> : t("Pivot (By Filter)")}
                </Button>
                <Button color="primary" size="sm" onClick={handlePivotFixed} disabled={pivotFixedLoading}>
                  {pivotFixedLoading ? <Spinner size="sm" /> : t("Pivot (Fixed)")}
                </Button>
                <Button color="primary" size="sm" onClick={handleReport} disabled={loading} form="stock-analysis-form" type="submit">
                  {loading ? <Spinner size="sm" /> : t("Report")}
                </Button>
                <Button color="outline-secondary" size="sm" onClick={handleClear}>{t("Clear")}</Button>
                <Button color="link" size="sm" className="p-0" onClick={() => setShowFilterPanel((v) => !v)}
                  title={showFilterPanel ? t("Collapse filters") : t("Expand filters")}>
                  <i className={`ri-arrow-${showFilterPanel ? "up" : "down"}-s-line fs-5`} />
                </Button>
              </div>
            </CardHeader>

            {showFilterPanel && (
              <CardBody className="border-bottom pb-0 py-2">
                <form id="stock-analysis-form" onSubmit={handleReport}>
                  <Nav tabs className="nav-tabs-custom">
                    <NavItem>
                      <NavLink className={classnames({ active: filterTab === "basic" })} onClick={() => setFilterTab("basic")} style={{ cursor: "pointer" }}>
                        {t("Basic & Grading Search")}
                      </NavLink>
                    </NavItem>
                    <NavItem>
                      <NavLink className={classnames({ active: filterTab === "numeric" })} onClick={() => setFilterTab("numeric")} style={{ cursor: "pointer" }}>
                        {t("Numeric Search")}
                      </NavLink>
                    </NavItem>
                    <NavItem>
                      <NavLink className={classnames({ active: filterTab === "date" })} onClick={() => setFilterTab("date")} style={{ cursor: "pointer" }}>
                        {t("Date Search")}
                      </NavLink>
                    </NavItem>
                  </Nav>

                  <TabContent activeTab={filterTab} className="pt-3">
                <TabPane tabId="basic">
                  <Row>
                    <Col md={2}><FormGroup><Label>{t("Stock Till Date")}</Label><Flatpickr className="form-control" value={date} onChange={([d]) => setDate(d ? d.toISOString().substring(0, 10) : today)} /></FormGroup></Col>
                    <Col md={2}><FormGroup><Label>{t("Show")}</Label><Input type="select" value={show} onChange={(e) => setShow(e.target.value)}><option value="All">All</option><option value="Sold">Sold</option><option value="Unsold">Unsold</option></Input></FormGroup></Col>
                    <Col md={2}><FormGroup><Label>{t("Hold/UnHold")}</Label><Input type="select" value={holdUnHold} onChange={(e) => setHoldUnHold(e.target.value)}><option value="All">All</option><option value="Hold">Hold</option><option value="Unhold">Unhold</option></Input></FormGroup></Col>
                    <Col md={2}><FormGroup><Label>{t("Single/Parcel")}</Label><Input type="select" value={stoneTypes} onChange={(e) => setStoneTypes(e.target.value)}><option value="Single">Single</option><option value="Parcel">Parcel</option><option value="All">All</option></Input></FormGroup></Col>
                    <Col md={4}><FormGroup><Label>{t("Sorting")}</Label><Input type="select" value={filterSize} onChange={(e) => setFilterSize(e.target.value)}>{SORT_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}</Input></FormGroup></Col>
                  </Row>
                  <Row>
                    <Col md={2}><FormGroup><Label>{t("Status")}</Label><Input type="select" value={status} onChange={(e) => setStatus(e.target.value)}><option value="All">All</option><option value="OnHand">OnHand</option><option value="OnMemo">OnMemo</option><option value="OnHand&Int.Memo">OnHand&Int.Memo</option><option value="OnHand + Memo In">OnHand + Memo In</option><option value="OnHand + Party Hold">OnHand + Party Hold</option><option value="Memo In">Memo In</option><option value="Party Hold">Party Hold</option><option value="All - Party Hold">All - Party Hold</option></Input></FormGroup></Col>
                    <Col md={2}><FormGroup><Label>{t("Lot Filter")}</Label><Input type="select" value={lotFilterType} onChange={(e) => setLotFilterType(e.target.value)}>{LOT_FILTER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</Input></FormGroup></Col>
                    <Col md={8}><FormGroup><Label>{t("Enter Lot No")}</Label><Input type="textarea" rows={2} value={lotNo} onChange={(e) => setLotNo(e.target.value)} placeholder={t("Search by lot no")} /></FormGroup></Col>
                  </Row>
                  <Row>
                    {multiSelect("Shape Group", dropdownOptions.shapeGroup, selectedShapeGroup, setSelectedShapeGroup)}
                    {multiSelect("Shape", dropdownOptions.shape, selectedShapes, setSelectedShapes)}
                    {multiSelect("Color Group", dropdownOptions.colorGroup, selectedColorGroup, setSelectedColorGroup)}
                    {multiSelect("Color", dropdownOptions.color, selectedColors, setSelectedColors)}
                    {multiSelect("Size", dropdownOptions.size, selectedSizes, setSelectedSizes)}
                    {multiSelect("Clarity", dropdownOptions.clarity, selectedClarities, setSelectedClarities)}
                  </Row>
                  <Row>
                    {multiSelect("Property", dropdownOptions.proportion, selectedProportions, setSelectedProportions)}
                    {multiSelect("Polish", dropdownOptions.polish, selectedPolishes, setSelectedPolishes)}
                    {multiSelect("Sym.", dropdownOptions.symmetry, selectedSymmetries, setSelectedSymmetries)}
                    {multiSelect("LAB", dropdownOptions.lab, selectedLabs, setSelectedLabs)}
                    {multiSelect("Rough", dropdownOptions.rough, selectedRough, setSelectedRough)}
                    {multiSelect("HA", dropdownOptions.ha, selectedHA, setSelectedHA)}
                  </Row>
                  <Row>
                    {multiSelect("Location", dropdownOptions.location, selectedLocations, setSelectedLocations)}
                    {multiSelect("Fluorescence", dropdownOptions.fluorescence, selectedFluorescences, setSelectedFluorescences)}
                    {multiSelect("Milky", dropdownOptions.milky, selectedMilkies, setSelectedMilkies)}
                    {multiSelect("Luster", dropdownOptions.luster, selectedLusters, setSelectedLusters)}
                    {multiSelect("Natts", dropdownOptions.natts, selectedNatts, setSelectedNatts)}
                    {multiSelect("Shade", dropdownOptions.shade, selectedShades, setSelectedShades)}
                  </Row>
                  <Row>
                    {multiSelect("FL Color", dropdownOptions.flColor, selectedFlColors, setSelectedFlColors)}
                    {multiSelect("Group", dropdownOptions.itemGroup, selectedItemGroups, setSelectedItemGroups)}
                    {multiSelect("Pair", dropdownOptions.pair, selectedPairs, setSelectedPairs)}
                    {multiSelect("Box Name", dropdownOptions.boxName, selectedBoxNames, setSelectedBoxNames)}
                  </Row>
                  <Row>
                    <Col md={2}><FormGroup><Label>{t("Carats From")}</Label><Input value={ctsFrm} onChange={(e) => setCtsFrm(e.target.value)} /></FormGroup></Col>
                    <Col md={2}><FormGroup><Label>{t("Carats To")}</Label><Input value={ctsTo} onChange={(e) => setCtsTo(e.target.value)} /></FormGroup></Col>
                    <Col md={2}><FormGroup><Label>{t("Back From")}</Label><Input value={backFrm} onChange={(e) => setBackFrm(e.target.value)} /></FormGroup></Col>
                    <Col md={2}><FormGroup><Label>{t("Back To")}</Label><Input value={backTo} onChange={(e) => setBackTo(e.target.value)} /></FormGroup></Col>
                    <Col md={2}><FormGroup><Label>{t("Price From")}</Label><Input value={priceFrm} onChange={(e) => setPriceFrm(e.target.value)} /></FormGroup></Col>
                    <Col md={2}><FormGroup><Label>{t("Price To")}</Label><Input value={priceTo} onChange={(e) => setPriceTo(e.target.value)} /></FormGroup></Col>
                  </Row>
                  <Row>
                    <Col md={2}><FormGroup><Label>{t("LotNo From")}</Label><Input value={lotFrm} onChange={(e) => setLotFrm(e.target.value)} /></FormGroup></Col>
                    <Col md={2}><FormGroup><Label>{t("LotNo To")}</Label><Input value={lotTo} onChange={(e) => setLotTo(e.target.value)} /></FormGroup></Col>
                  </Row>
                </TabPane>

                <TabPane tabId="numeric">
                  <Row>
                    <Col md={2}><FormGroup><Label>{t("Table Depth % From")}</Label><Input value={tDepthFrm} onChange={(e) => setTDepthFrm(e.target.value)} /></FormGroup></Col>
                    <Col md={2}><FormGroup><Label>{t("Table Depth % To")}</Label><Input value={tDepthTo} onChange={(e) => setTDepthTo(e.target.value)} /></FormGroup></Col>
                    <Col md={2}><FormGroup><Label>{t("Table % From")}</Label><Input value={tablePerFrm} onChange={(e) => setTablePerFrm(e.target.value)} /></FormGroup></Col>
                    <Col md={2}><FormGroup><Label>{t("Table % To")}</Label><Input value={tablePerTo} onChange={(e) => setTablePerTo(e.target.value)} /></FormGroup></Col>
                    <Col md={2}><FormGroup><Label>{t("CA From")}</Label><Input value={caFrm} onChange={(e) => setCaFrm(e.target.value)} /></FormGroup></Col>
                    <Col md={2}><FormGroup><Label>{t("CA To")}</Label><Input value={caTo} onChange={(e) => setCaTo(e.target.value)} /></FormGroup></Col>
                  </Row>
                  <Row>
                    <Col md={2}><FormGroup><Label>{t("CH From")}</Label><Input value={chFrm} onChange={(e) => setChFrm(e.target.value)} /></FormGroup></Col>
                    <Col md={2}><FormGroup><Label>{t("CH To")}</Label><Input value={chTo} onChange={(e) => setChTo(e.target.value)} /></FormGroup></Col>
                    <Col md={2}><FormGroup><Label>{t("PH From")}</Label><Input value={phFrm} onChange={(e) => setPhFrm(e.target.value)} /></FormGroup></Col>
                    <Col md={2}><FormGroup><Label>{t("PH To")}</Label><Input value={phTo} onChange={(e) => setPhTo(e.target.value)} /></FormGroup></Col>
                    <Col md={2}><FormGroup><Label>{t("PA From")}</Label><Input value={paFrm} onChange={(e) => setPaFrm(e.target.value)} /></FormGroup></Col>
                    <Col md={2}><FormGroup><Label>{t("PA To")}</Label><Input value={paTo} onChange={(e) => setPaTo(e.target.value)} /></FormGroup></Col>
                  </Row>
                </TabPane>

                <TabPane tabId="date">
                  {[
                    { chk: purchaseChk, setChk: setPurchaseChk, label: "Purchase Date", from: frmPurchaseDate, setFrom: setFrmPurchaseDate, to: toPurchaseDate, setTo: setToPurchaseDate },
                    { chk: reviseChk, setChk: setReviseChk, label: "Revision Date", from: frmReviseDate, setFrom: setFrmReviseDate, to: toReviseDate, setTo: setToReviseDate },
                    { chk: newArrivalChk, setChk: setNewArrivalChk, label: "New Arrival", from: frmNewArrivalDate, setFrom: setFrmNewArrivalDate, to: toNewArrivalDate, setTo: setToNewArrivalDate },
                    { chk: webRevisedChk, setChk: setWebRevisedChk, label: "Web Revised", from: frmWebRevisedDate, setFrom: setFrmWebRevisedDate, to: toWebRevisedDate, setTo: setToWebRevisedDate },
                    { chk: unholdChk, setChk: setUnholdChk, label: "Unhold Date", from: frmUnholdDate, setFrom: setFrmUnholdDate, to: toUnholdDate, setTo: setToUnholdDate },
                    { chk: labDateChk, setChk: setLabDateChk, label: "Lab Date", from: frmLabDate, setFrom: setFrmLabDate, to: toLabDate, setTo: setToLabDate }
                  ].map((row) => (
                    <Row key={row.label} className="align-items-center mb-2">
                      <Col md={1}><Input type="checkbox" checked={row.chk} onChange={(e) => row.setChk(e.target.checked)} /></Col>
                      <Col md={2}><Label className="mb-0">{t(row.label)} {t("From")}</Label><Flatpickr className="form-control" value={row.from} onChange={([d]) => row.setFrom(d ? d.toISOString().substring(0, 10) : today)} /></Col>
                      <Col md={2}><Label className="mb-0">{t(row.label)} {t("To")}</Label><Flatpickr className="form-control" value={row.to} onChange={([d]) => row.setTo(d ? d.toISOString().substring(0, 10) : today)} /></Col>
                    </Row>
                  ))}
                </TabPane>
              </TabContent>
                </form>
              </CardBody>
            )}
          </Card>

          {viewMode === "pivotByFilter" && (
            <Card className="glass-card mb-3">
              <CardHeader className="pb-2 border-0 d-flex justify-content-between align-items-center">
                <span className="fw-semibold">{t("Stock Analysis Pivot (By Filter)")}</span>
                <Button size="sm" color="link" className="p-0" onClick={() => setViewMode(null)}>
                  <i className="ri-close-line" />
                </Button>
              </CardHeader>
              <CardBody className="p-2">
                {pivotByFilterLoading ? (
                  <div className="text-center p-5">
                    <Spinner color="success" className="mb-2" />
                    <p className="text-muted mb-0">{t("Loading pivot data...")}</p>
                  </div>
                ) : pivotByFilterData.length === 0 ? (
                  <div className="text-center p-5">
                    <h5 className="text-muted">{t("No record found matching the configurations")}</h5>
                  </div>
                ) : (
                  <StockAnalysisPivotByFilterView data={pivotByFilterData} />
                )}
              </CardBody>
            </Card>
          )}

          {viewMode === "pivotFixed" && (
            <Card className="glass-card mb-3">
              <CardHeader className="pb-2 border-0 d-flex justify-content-between align-items-center">
                <span className="fw-semibold">{t("Stock Analysis Pivot (Fixed)")}</span>
                <Button size="sm" color="link" className="p-0" onClick={() => setViewMode(null)}>
                  <i className="ri-close-line" />
                </Button>
              </CardHeader>
              <CardBody className="p-2">
                {pivotFixedLoading ? (
                  <div className="text-center p-5">
                    <Spinner color="success" className="mb-2" />
                    <p className="text-muted mb-0">{t("Loading pivot data...")}</p>
                  </div>
                ) : pivotFixedData.length === 0 ? (
                  <div className="text-center p-5">
                    <h5 className="text-muted">{t("No record found matching the configurations")}</h5>
                  </div>
                ) : (
                  <StockAnalysisPivotFixedView data={pivotFixedData} />
                )}
              </CardBody>
            </Card>
          )}

          {searched && viewMode === "report" && (
            <Card className="glass-card">
              <CardHeader className="d-flex align-items-center justify-content-between pb-2 border-0">
                <Nav tabs className="card-header-tabs border-0">
                  <NavItem>
                    <NavLink className={classnames({ active: activeTab === "table" })} onClick={() => setActiveTab("table")} style={{ cursor: "pointer" }}>
                      <i className="ri-table-line align-middle me-1" />
                      {t("Data Table")}
                    </NavLink>
                  </NavItem>
                  <NavItem>
                    <NavLink className={classnames({ active: activeTab === "charts" })} onClick={() => setActiveTab("charts")} style={{ cursor: "pointer" }}>
                      <i className="ri-bar-chart-2-line align-middle me-1" />
                      {t("Analytical Charts")}
                    </NavLink>
                  </NavItem>
                </Nav>
                {activeTab === "table" && (
                  <div className="d-flex align-items-center gap-2">
                    {reportData.length > 0 && (
                      <Button className="par-header-btn" size="sm" type="button" onClick={handleExportCSV}>
                        {t("Excel")}
                      </Button>
                    )}
                    <Input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder={t("Quick search...")}
                      style={{ width: 180 }}
                      value={searchTerm}
                      onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    />
                  </div>
                )}
              </CardHeader>
              <CardBody className="p-3">
                {loading ? (
                  <div className="text-center p-5">
                    <Spinner color="success" className="mb-2" />
                    <p className="text-muted mb-0">{t("Generating report analytics matrix...")}</p>
                  </div>
                ) : (
                  <TabContent activeTab={activeTab}>
                    <TabPane tabId="table">
                      {filteredData.length === 0 ? (
                        <div className="text-center p-5">
                          <h5 className="text-muted">{t("No record found matching the configurations")}</h5>
                        </div>
                      ) : (
                        <>
                          <div className="table-responsive report-table-scroll" style={{ maxHeight: 600 }}>
                            <table className="table table-bordered table-hover align-middle mb-0 text-end">
                              <thead className="table-light sticky-top">
                                <tr>
                                  <th className="text-start">{activeReportType}</th>
                                  <th>{t("Pcs")}</th>
                                  <th>{t("Pcs%")}</th>
                                  <th>{t("Carats")}</th>
                                  <th>{t("Carats%")}</th>
                                  <th>{t("Amount")}</th>
                                  <th>{t("Amount%")}</th>
                                </tr>
                              </thead>
                              <tbody>
                                {paginatedData.map((row, idx) => (
                                  <tr key={idx}>
                                    <td className="text-start"><b>{getGroupingValue(row, activeReportType)}</b></td>
                                    <td>{fmtInt(pick(row, "Pcs", "pcs"))}</td>
                                    <td>{fmtFloat(pick(row, "PcsPer", "pcsPer"))}%</td>
                                    <td>{fmtFloat(pick(row, "Carats", "carats"))}</td>
                                    <td>{fmtFloat(pick(row, "CaratsPer", "caratsPer"))}%</td>
                                    <td>{fmtCurrency(pick(row, "Amount", "amount"))}</td>
                                    <td>{fmtFloat(pick(row, "AmountPer", "amountPer"))}%</td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot className="table-light fw-semibold">
                                <tr>
                                  <td className="text-start">{t("Total")}</td>
                                  <td>{fmtInt(totals.pcs)}</td>
                                  <td>-</td>
                                  <td>{fmtFloat(totals.carats)}</td>
                                  <td>-</td>
                                  <td>{fmtCurrency(totals.amount)}</td>
                                  <td>-</td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                          <div className="d-flex justify-content-between align-items-center mt-2 flex-wrap gap-2">
                            <div className="d-flex align-items-center gap-2">
                              <span className="text-muted small">
                                {t("Showing")} {Math.min((currentPage - 1) * pageSize + 1, filteredData.length)}–{Math.min(currentPage * pageSize, filteredData.length)} {t("of")} {filteredData.length}
                              </span>
                              <select className="form-select form-select-sm" style={{ width: 90 }}
                                value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}>
                                {[500, 1000, 1500].map((n) => <option key={n} value={n}>{n}</option>)}
                                <option value={filteredData.length}>{t("All")}</option>
                              </select>
                            </div>
                            <div className="d-flex gap-1">
                              <Button size="sm" color="outline-secondary" disabled={currentPage === 1}
                                onClick={() => setCurrentPage((p) => p - 1)}>{t("Previous")}</Button>
                              <span className="btn btn-sm btn-outline-secondary disabled">{currentPage}</span>
                              <Button size="sm" color="outline-secondary" disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage((p) => p + 1)}>{t("Next")}</Button>
                            </div>
                          </div>
                        </>
                      )}
                    </TabPane>
                    <TabPane tabId="charts">
                      {!chartData ? (
                        <div className="text-center p-5">
                          <h5 className="text-muted">{t("No record found matching the configurations")}</h5>
                        </div>
                      ) : (
                        <>
                          <div className="d-flex justify-content-end mb-2" ref={chartMenusRef}>
                            <div className="position-relative me-2">
                              <Button size="sm" color="outline-secondary"
                                onClick={() => { setShowExportMenu((v) => !v); setShowChartTypeMenu(false); }}>
                                <i className="ri-download-2-line" />
                              </Button>
                              {showExportMenu && (
                                <div className="position-absolute bg-white border rounded shadow-sm p-2"
                                  style={{ right: 0, top: "110%", zIndex: 999, minWidth: 120 }}>
                                  {[["image/png", "PNG"], ["image/jpeg", "JPG"], ["pdf", "PDF"]].map(([fmt, lbl]) => (
                                    <div key={fmt} className="py-1 px-2" style={{ cursor: "pointer" }}
                                      onClick={() => { setShowExportMenu(false); handleChartExport(fmt); }}>
                                      {lbl}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="position-relative">
                              <Button size="sm" color="outline-secondary"
                                onClick={() => { setShowChartTypeMenu((v) => !v); setShowExportMenu(false); }}>
                                <i className="ri-menu-line" />
                              </Button>
                              {showChartTypeMenu && (
                                <div className="position-absolute bg-white border rounded shadow-sm p-2"
                                  style={{ right: 0, top: "110%", zIndex: 999, minWidth: 120 }}>
                                  {[["doughnut", "Donut"], ["pie", "Pie"], ["bar", "Bar"]].map(([ct, lbl]) => (
                                    <div key={ct} className="py-1 px-2" style={{ cursor: "pointer" }}
                                      onClick={() => { setChartType(ct); setShowChartTypeMenu(false); }}>
                                      {lbl}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          <h2 className="text-center mb-3">{t("Stock Analysis Report")}</h2>
                          <Row className="justify-content-center">
                            {[
                              { id: "stockCaratPerChart", cd: chartData.caratsPer },
                              { id: "stockAmountChart", cd: chartData.amountPer }
                            ].map(({ id, cd }) => (
                              <Col key={id} sm={6}>
                                <div style={{ height: 450 }}>
                                  {chartType === "doughnut" ? (
                                    <Doughnut id={id} data={cd} options={buildChartConfig(cd, chartType).options} plugins={[arrowLinesPlugin]} />
                                  ) : chartType === "pie" ? (
                                    <Pie id={id} data={cd} options={buildChartConfig(cd, chartType).options} plugins={[arrowLinesPlugin]} />
                                  ) : (
                                    <Bar id={id} data={cd} options={buildChartConfig(cd, chartType).options} />
                                  )}
                                </div>
                              </Col>
                            ))}
                          </Row>
                        </>
                      )}
                    </TabPane>
                  </TabContent>
                )}
              </CardBody>
            </Card>
          )}
        </Container>
      </div>
      <ToastContainer />
    </React.Fragment>
  );
};

export default StockAnalysisReport;
