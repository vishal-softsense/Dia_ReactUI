import React, { useEffect, useState, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
  CardHeader,
  Button,
  FormGroup,
  Label,
  Input,
  Spinner,
  Nav,
  NavItem,
  NavLink,
  TabContent,
  TabPane
} from "reactstrap";
import ReactSelect from "react-select";

const Select = (props) => (
  <ReactSelect
    menuPortalTarget={document.body}
    styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }), ...props.styles }}
    {...props}
  />
);


import { toast, ToastContainer } from "react-toastify";
import { Bar, Pie, Doughnut } from "react-chartjs-2";
import classnames from "classnames";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import {
  getSaleAnalysisReport,
  getSaleAnalysisPivotData,
  getSaleAnalysisDropdowns,
  getAccGrpMasters
} from "../../helpers/fakebackend_helper";
import { useSettingReportDates } from "../../Components/Hooks/useSettingReportDates";
import "chart.js/auto";
import SaleAnalysisPivotView from "./SaleAnalysisPivotView";

const CHART_COLORS = [
  "#FF6384", "#91eded", "#FFCE25", "#4BC0C0",
  "#9966FF", "#FF00FF", "#0000FF", "#75cb7c", "#38A2EB"
];

const arrowLinesPlugin = {
  id: "arrowLinesPlugin",
  afterDatasetsDraw(chart) {
    const type = chart.config?.type;
    if (type !== "doughnut" && type !== "pie") return;

    const ctx = chart.ctx;
    const meta = chart.getDatasetMeta(0);
    const dataset = chart.data.datasets[0];
    if (!meta || !dataset) return;

    ctx.save();
    ctx.strokeStyle = "#777";
    ctx.lineWidth = 1.2;
    ctx.font = "bold 12px Arial";
    ctx.fillStyle = "#000";

    const usedPositions = [];
    const centerX = (chart.chartArea.left + chart.chartArea.right) / 2;
    const centerY = (chart.chartArea.top + chart.chartArea.bottom) / 2;

    meta.data.forEach((arc, index) => {
      if (!arc || arc.startAngle == null) return;

      const angle = (arc.startAngle + arc.endAngle) / 2;
      const outerRadius = arc.outerRadius;
      const labelRadius = outerRadius * 1;
      let labelX = centerX + Math.cos(angle) * labelRadius;
      let labelY = centerY + Math.sin(angle) * labelRadius;

      while (usedPositions.some((pos) => Math.abs(pos - labelY) < 15)) {
        labelY += labelY > centerY ? 15 : -15;
      }
      usedPositions.push(labelY);

      const isRightSide = labelX > centerX;
      const textOffset = isRightSide ? 10 : -10;
      ctx.textAlign = isRightSide ? "left" : "right";
      ctx.textBaseline = "middle";

      const lineEndX = labelX + (isRightSide ? 20 : -20);
      ctx.beginPath();
      ctx.moveTo(centerX + Math.cos(angle) * outerRadius, centerY + Math.sin(angle) * outerRadius);
      ctx.lineTo(labelX, labelY);
      ctx.lineTo(lineEndX, labelY);
      ctx.stroke();

      const label = chart.data.labels[index] ?? "";
      const pct = dataset.data[index];
      ctx.fillText(`${label} - ${pct}%`, lineEndX + textOffset, labelY);
    });
    ctx.restore();
  }
};

const SALE_ANA_OPTIONS = [
  { value: "Lab",          label: "Lab" },
  { value: "Shape",        label: "Shape" },
  { value: "Size",         label: "Size" },
  { value: "Color",        label: "Color" },
  { value: "Clarity",      label: "Clarity" },
  { value: "Prop",         label: "Prop" },
  { value: "Polish",       label: "Polish" },
  { value: "Symmertry",    label: "Symmetry" },
  { value: "CPS",          label: "CPS" },
  { value: "FL",           label: "Flou." },
  { value: "Series",       label: "Series" },
  { value: "Location",     label: "Location" },
  { value: "PartyLocation",label: "Party Location" },
  { value: "YearMonth",    label: "Purchase Year-Month" },
  { value: "Aging",        label: "Aging" },
  { value: "PriceRevision",label: "Price Revision" },
  { value: "StockID",      label: "StockID" }
];

const SaleAnalysisReport = () => {
  const { t } = useTranslation();

  const { fromDate: settingFrom, toDate: settingTo, getDates } = useSettingReportDates();

  const [fromDate,   setFromDate]   = useState(settingFrom);
  const [toDate,     setToDate]     = useState(settingTo);
  const [currency,   setCurrency]   = useState("");
  const [invNo,      setInvNo]      = useState("");
  const [billNo,     setBillNo]     = useState("");
  const [type,       setType]       = useState("");
  const [subType,    setSubType]    = useState("");
  const [category,   setCategory]   = useState("");
  const [lotNo,      setLotNo]      = useState("");
  const [purRtn,     setPurRtn]     = useState(false);
  const [saleAna,    setSaleAna]    = useState("Lab");

  const [partyInput,       setPartyInput]       = useState("");
  const [partyOptions,     setPartyOptions]     = useState([]);
  const [selectedParty,    setSelectedParty]    = useState(null);
  const [loadingParties,   setLoadingParties]   = useState(false);

  const [brokerInput,      setBrokerInput]      = useState("");
  const [brokerOptions,    setBrokerOptions]    = useState([]);
  const [selectedBroker,   setSelectedBroker]   = useState(null);
  const [loadingBrokers,   setLoadingBrokers]   = useState(false);

  const [expPartyInput,    setExpPartyInput]    = useState("");
  const [expPartyOptions,  setExpPartyOptions]  = useState([]);
  const [selectedExpParty, setSelectedExpParty] = useState(null);
  const [loadingExpParties,setLoadingExpParties]= useState(false);

  const [selectedShapes,       setSelectedShapes]       = useState([]);
  const [selectedColors,       setSelectedColors]       = useState([]);
  const [selectedClarities,    setSelectedClarities]    = useState([]);
  const [selectedSizes,        setSelectedSizes]        = useState([]);
  const [selectedProportions,  setSelectedProportions]  = useState([]);
  const [selectedPolishes,     setSelectedPolishes]     = useState([]);
  const [selectedSymmetries,   setSelectedSymmetries]   = useState([]);
  const [selectedLabs,         setSelectedLabs]         = useState([]);
  const [selectedFluorescences,setSelectedFluorescences]= useState([]);
  const [selectedMilkies,      setSelectedMilkies]      = useState([]);
  const [selectedLusters,      setSelectedLusters]      = useState([]);
  const [selectedNatts,        setSelectedNatts]        = useState([]);
  const [selectedMines,        setSelectedMines]        = useState([]);
  const [selectedProductTypes, setSelectedProductTypes] = useState([]);
  const [selectedSieves,       setSelectedSieves]       = useState([]);

  const [dropdownOptions, setDropdownOptions] = useState({
    currency: [], type: [], subType: [], category: [],
    shape: [], color: [], size: [], clarity: [], lab: [],
    proportion: [], polish: [], symmetry: [], fluorescence: [],
    milky: [], luster: [], natts: [], mines: [], productType: [], sieve: []
  });

  const [loading,         setLoading]         = useState(false);
  const [pivotLoading,    setPivotLoading]     = useState(false);
  const [reportData,      setReportData]       = useState([]);
  const [pivotData,       setPivotData]        = useState([]);
  const [searched,        setSearched]         = useState(false);
  const [showFilterPanel, setShowFilterPanel]  = useState(true);
  const [activeReportType,setActiveReportType] = useState("Lab");
  const [activeTab,       setActiveTab]        = useState("table");
  const [showPivot,       setShowPivot]        = useState(false);

  const [chartType,           setChartType]           = useState("doughnut");
  const [showExportMenu,      setShowExportMenu]       = useState(false);
  const [showChartTypeMenu,   setShowChartTypeMenu]    = useState(false);
  const chartMenusRef = useRef(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize,    setPageSize]    = useState(500);
  const [searchTerm,  setSearchTerm]  = useState("");
  const [colFilters,  setColFilters]  = useState({});

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
    const fetchDropdowns = async () => {
      try {
        const response = await getSaleAnalysisDropdowns();
        if (response.success || response.Success) {
          const d = response.data || response.Data || {};
          setDropdownOptions({
            currency:     d.currency     || [],
            type:         d.type         || [],
            subType:      d.subType      || [],
            category:     d.category     || [],
            shape:        d.shape        || [],
            color:        d.color        || [],
            size:         d.size         || [],
            clarity:      d.clarity      || [],
            lab:          d.lab          || [],
            proportion:   d.proportion   || [],
            polish:       d.polish       || [],
            symmetry:     d.symmetry     || [],
            fluorescence: d.fluorescence || [],
            milky:        d.milky        || [],
            luster:       d.luster       || [],
            natts:        d.natts        || [],
            mines:        d.mines        || [],
            productType:  d.productType  || [],
            sieve:        d.sieve        || []
          });
        }
      } catch {
        toast.error(t("Failed to load filter dropdown option lists"));
      }
    };
    fetchDropdowns();
  }, []);

  useEffect(() => {
    setFromDate(settingFrom);
    setToDate(settingTo);
  }, [settingFrom, settingTo]);

  const handleAccountSearch = async (term, setOptions, setLoadingState) => {
    if (!term || term.length < 2) { setOptions([]); return; }
    setLoadingState(true);
    try {
      const response = await getAccGrpMasters(term);
      if (response.success || response.Success) {
        const d = response.data || response.Data || [];
        setOptions(d.map((item) => ({
          value: item.accGrpCode || item.AccGrpCode,
          label: item.accGrpName || item.AccGrpName
        })));
      }
    } catch { } finally { setLoadingState(false); }
  };

  useEffect(() => {
    const t2 = setTimeout(() => handleAccountSearch(partyInput,    setPartyOptions,    setLoadingParties),    400);
    return () => clearTimeout(t2);
  }, [partyInput]);
  useEffect(() => {
    const t2 = setTimeout(() => handleAccountSearch(brokerInput,   setBrokerOptions,   setLoadingBrokers),    400);
    return () => clearTimeout(t2);
  }, [brokerInput]);
  useEffect(() => {
    const t2 = setTimeout(() => handleAccountSearch(expPartyInput, setExpPartyOptions, setLoadingExpParties), 400);
    return () => clearTimeout(t2);
  }, [expPartyInput]);

  const mapSelectVal = (list) => {
    if (!list || !list.length) return null;
    const vals = list.map((i) => i.value).filter((v) => v != null && String(v).trim() !== "");
    return vals.length ? vals : null;
  };

  const buildPayload = () => ({
    fromDate:    fromDate  || null,
    toDate:      toDate    || null,
    currency:    currency  || null,
    invNo:       invNo     || null,
    billNo:      billNo    || null,
    type:        type      || null,
    subType:     subType   || null,
    category:    category  || null,
    party:       selectedParty    ? String(selectedParty.label    || "") : null,
    broker:      selectedBroker   ? String(selectedBroker.label   || "") : null,
    purRtn,
    expParty:    selectedExpParty ? String(selectedExpParty.label || "") : null,
    lotNo:       lotNo || null,
    saleAna,
    shape:        mapSelectVal(selectedShapes),
    color:        mapSelectVal(selectedColors),
    clarity:      mapSelectVal(selectedClarities),
    size:         mapSelectVal(selectedSizes),
    proportion:   mapSelectVal(selectedProportions),
    polish:       mapSelectVal(selectedPolishes),
    symmetry:     mapSelectVal(selectedSymmetries),
    lab:          mapSelectVal(selectedLabs),
    fluorescence: mapSelectVal(selectedFluorescences),
    milky:        mapSelectVal(selectedMilkies),
    luster:       mapSelectVal(selectedLusters),
    natts:        mapSelectVal(selectedNatts),
    mines:        mapSelectVal(selectedMines),
    productType:  mapSelectVal(selectedProductTypes),
    sieve:        mapSelectVal(selectedSieves)
  });

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setSearched(true);
    setCurrentPage(1);
    setShowPivot(false);

    try {
      const response = await getSaleAnalysisReport(buildPayload());
      if (response.success || response.Success) {
        const raw = Array.isArray(response.data ?? response.Data) ? (response.data ?? response.Data) : [];
        setReportData(raw);
        setActiveReportType(saleAna);
        setActiveTab("table");
        setShowFilterPanel(false);
        if (!raw.length) toast.info(t("No record found matching the configurations"));
      } else {
        toast.error(response.message || response.Message || t("Failed to load report data"));
        setReportData([]);
        setShowFilterPanel(true);
      }
    } catch (err) {
      toast.error(typeof err === "string" ? err : err?.message || t("Error generating Sale Analysis Report"));
      setReportData([]);
      setShowFilterPanel(true);
    } finally {
      setLoading(false);
    }
  };

  const handlePivot = async () => {
    setPivotLoading(true);
    setShowPivot(true);
    setSearched(true);

    try {
      const response = await getSaleAnalysisPivotData(buildPayload());
      if (response.success || response.Success) {
        const raw = Array.isArray(response.data ?? response.Data) ? (response.data ?? response.Data) : [];
        setPivotData(raw);
        setShowFilterPanel(false);
        if (!raw.length) toast.info(t("No record found matching the configurations"));
      } else {
        toast.error(response.message || response.Message || t("Failed to load pivot data"));
        setPivotData([]);
      }
    } catch (err) {
      toast.error(typeof err === "string" ? err : err?.message || t("Error generating pivot data"));
      setPivotData([]);
    } finally {
      setPivotLoading(false);
    }
  };

  const handleClear = async () => {
    const d = await getDates();
    setFromDate(d.fromDate);
    setToDate(d.toDate);
    setCurrency(""); setInvNo(""); setBillNo("");
    setType(""); setSubType(""); setCategory(""); setLotNo("");
    setPurRtn(false);
    setSaleAna("Lab");
    setSelectedParty(null); setSelectedBroker(null); setSelectedExpParty(null);
    setSelectedShapes([]); setSelectedColors([]); setSelectedClarities([]);
    setSelectedSizes([]); setSelectedProportions([]); setSelectedPolishes([]);
    setSelectedSymmetries([]); setSelectedLabs([]); setSelectedFluorescences([]);
    setSelectedMilkies([]); setSelectedLusters([]); setSelectedNatts([]);
    setSelectedMines([]); setSelectedProductTypes([]); setSelectedSieves([]);
    setReportData([]); setPivotData([]);
    setSearched(false); setShowPivot(false); setShowFilterPanel(true);
    setCurrentPage(1); setSearchTerm("");
    setColFilters({});
  };

  const pick = (row, ...names) => {
    if (!row) return undefined;
    for (const name of names) {
      if (row[name] !== undefined && row[name] !== null) return row[name];
    }
    const keys = Object.keys(row);
    for (const name of names) {
      const found = keys.find((k) => k.toLowerCase() === String(name).toLowerCase());
      if (found !== undefined && row[found] !== undefined && row[found] !== null) return row[found];
    }
    return undefined;
  };

  const getGroupingValue = (row, field) => {
    if (!row || !field) return "";
    const v = pick(row, field, field.charAt(0).toLowerCase() + field.slice(1));
    return v === undefined || v === null || v === "" ? "" : String(v);
  };

  const getColValue = (row, colKey) => {
    switch (colKey) {
      case "grouping":
        return getGroupingValue(row, activeReportType);
      case "pcs":
        return pick(row, "Pcs");
      case "pcsPer":
        return pick(row, "PcsPer", "pcsPer");
      case "carats":
        return pick(row, "Carats");
      case "caratsPer":
        return pick(row, "Caratsper", "caratsper");
      case "saleAmtdollar":
        return pick(row, "SaleAmtdollar");
      case "saleperdollar":
        return pick(row, "Saleperdollar");
      case "plDollar":
        return pick(row, "PLdollar");
      case "dollarPLper":
        return pick(row, "DollarPLper");
      case "purCostdollar":
        return pick(row, "PurCostdollar");
      case "plperOnCOGSAmtdollar":
        return pick(row, "PLperOnCOGSAmtdollar");
      case "saleAmtINR":
        return pick(row, "SaleAmtINR");
      case "saleper":
        return pick(row, "Saleper");
      case "plINR":
        return pick(row, "PLINR");
      case "inrPLper":
        return pick(row, "INRPLper", "inrPLper");
      case "purCostINR":
        return pick(row, "PurCostINR");
      case "plperOnCOGSAmtINR":
        return pick(row, "PLperOnCOGSAmtINR");
      default:
        return "";
    }
  };

  const makeSelectOptions = (arr) =>
    (arr || []).map((x) => ({
      value: x.id ?? x.ID ?? x.name ?? x.Name,
      label: x.id ?? x.ID ?? x.name ?? x.Name
    }));

  const fmtInt   = (n) => Math.round(Number(n || 0));
  const fmtFloat = (n) => Number(n || 0).toFixed(2);
  const fmtCurrency = (n) =>
    Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const rowNum = (row, ...names) => Number(pick(row, ...names) ?? 0);

  const filteredData = useMemo(() => {
    let data = reportData;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      data = data.filter((row) => {
        const gv = getGroupingValue(row, activeReportType).toLowerCase();
        return (
          gv.includes(term) ||
          String(pick(row, "Pcs") ?? "").includes(term) ||
          String(pick(row, "SaleAmtdollar") ?? "").includes(term)
        );
      });
    }

    Object.keys(colFilters).forEach((key) => {
      const val = colFilters[key];
      if (val) {
        const term = val.toLowerCase();
        data = data.filter((row) => {
          const colVal = getColValue(row, key);
          return String(colVal ?? "").toLowerCase().includes(term);
        });
      }
    });

    return data;
  }, [reportData, searchTerm, colFilters, activeReportType]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;

  const totals = useMemo(() => {
    const s = { pcs: 0, carats: 0, saleAmtdollar: 0, plDollar: 0, purCostDollar: 0, saleAmtINR: 0, plINR: 0, purCostINR: 0 };
    filteredData.forEach((row) => {
      s.pcs           += rowNum(row, "Pcs");
      s.carats        += rowNum(row, "Carats");
      s.saleAmtdollar += rowNum(row, "SaleAmtdollar");
      s.plDollar      += rowNum(row, "PLdollar");
      s.purCostDollar += rowNum(row, "PurCostdollar");
      s.saleAmtINR    += rowNum(row, "SaleAmtINR");
      s.plINR         += rowNum(row, "PLINR");
      s.purCostINR    += rowNum(row, "PurCostINR");
    });
    return s;
  }, [filteredData]);

  const chartData = useMemo(() => {
    if (!reportData.length) return null;
    const labels        = reportData.map((r) => getGroupingValue(r, activeReportType) || "Unknown");
    const carats        = reportData.map((r) => rowNum(r, "Carats"));
    const caratsper     = reportData.map((r) => rowNum(r, "Caratsper"));
    const saleAmtdollar = reportData.map((r) => rowNum(r, "SaleAmtdollar"));
    const saleperdollar = reportData.map((r) => rowNum(r, "Saleperdollar"));
    const plDollar      = reportData.map((r) => rowNum(r, "PLdollar"));
    const plperOnPurAmt = reportData.map((r) => rowNum(r, "PLperOnPurAmtdollar"));

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
      caratsPer:  makeChart("Sale Carats%",   caratsper,   carats,        false),
      saleAmtPer: makeChart("Sale Amt%",       saleperdollar, saleAmtdollar, true),
      plCOGSPer:  makeChart("PL%OnPurAmt$",    plperOnPurAmt, plDollar,    false)
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
        title:  { display: true, text: cd.datasets[0].label, font: { size: 18, weight: "bold" }, padding: { bottom: 30 } },
        legend: { display: false },
        datalabels: { display: false },
        tooltip: {
          callbacks: {
            label: (tooltipItem) => {
              const val = cd.hoverValues[tooltipItem.dataIndex];
              return cd.isAmt ? ` $${val}` : ` ${val} CRT`;
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
    const headers = [
      activeReportType,
      "Pcs", "Pcs%", "Carats", "Carats%",
      "Sale Amt $", "Sale%", "PL $", "$ PL%", "COGS $", "PL % On COGS $",
      "Sale Amt INR", "Sale%", "PL INR", "INR PL%", "COGS INR", "PL % On COGS INR"
    ];

    const rows = filteredData.map((row) => [
      getGroupingValue(row, activeReportType),
      pick(row, "Pcs")              ?? 0,
      pick(row, "PcsPer")           ?? 0,
      pick(row, "Carats")           ?? 0,
      pick(row, "Caratsper")        ?? 0,
      pick(row, "SaleAmtdollar")    ?? 0,
      pick(row, "Saleperdollar")    ?? 0,
      pick(row, "PLdollar")         ?? 0,
      pick(row, "DollarPLper")      ?? 0,
      pick(row, "PurCostdollar")    ?? 0,
      pick(row, "PLperOnCOGSAmtdollar") ?? 0,
      pick(row, "SaleAmtINR")       ?? 0,
      pick(row, "Saleper")          ?? 0,
      pick(row, "PLINR")            ?? 0,
      pick(row, "INRPLper", "inrPLper") ?? 0,
      pick(row, "PurCostINR")       ?? 0,
      pick(row, "PLperOnCOGSAmtINR") ?? 0
    ]);

    rows.push([
      "Total",
      totals.pcs, "", fmtFloat(totals.carats), "",
      fmtFloat(totals.saleAmtdollar), "", fmtFloat(totals.plDollar), "", fmtFloat(totals.purCostDollar), "",
      fmtFloat(totals.saleAmtINR), "", fmtFloat(totals.plINR), "", fmtFloat(totals.purCostINR), ""
    ]);

    const csvContent = [headers, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Sale_Analysis_Report_${activeReportType}_${new Date().toISOString().substring(0, 10)}.csv`;
    link.click();
  };

  const canvasIds = ["saleCaratPerChart", "saleSaleAmtChart", "salePLCOGSChart"];

  const handleChartExport = (format) => {
    const extension = format.includes("jpeg") ? "jpg" : format === "pdf" ? "pdf" : "png";
    const W = 400, H = 400, headerH = 60;

    const combined = document.createElement("canvas");
    combined.width  = W * canvasIds.length;
    combined.height = H + headerH;

    const ctx2 = combined.getContext("2d");
    ctx2.fillStyle = "#ffffff";
    ctx2.fillRect(0, 0, combined.width, combined.height);
    ctx2.fillStyle = "#000000";
    ctx2.font = "bold 24px Arial";
    ctx2.textAlign = "center";
    ctx2.fillText("Sale Analysis Report", combined.width / 2, 40);

    let allReady = true;
    canvasIds.forEach((id, idx) => {
      const cvs = document.getElementById(id);
      if (!cvs || !cvs.chartInstance) {
        toast.warning(`Chart "${id}" is not rendered yet. Please scroll to it first.`);
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
      pdf.save("SaleAnalysis_Charts.pdf");
    } else {
      const link = document.createElement("a");
      link.href = combined.toDataURL(format, 1.0);
      link.download = `SaleAnalysis_Charts.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  useEffect(() => {
    document.title = `${t("Sale Analysis Report")} | ${t("Admin")}`;
  }, []);

  return (
    <React.Fragment>
      <style>{`
        .par-chevron-btn {
          border: 1px solid var(--vz-border-color, #e9ebec);
          background: transparent;
          color: var(--vz-body-color, #212529);
          padding: 4px 10px;
          border-radius: 4px;
          cursor: pointer;
          line-height: 1;
        }
        .par-chevron-btn:hover {
          color: var(--vz-primary, #405189);
          border-color: var(--vz-primary, #405189);
        }
        .par-chevron-btn i {
          font-size: 20px;
        }
        .par-chart-toolbar {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 16px;
          margin-bottom: 8px;
          position: relative;
        }
        .par-chart-icon-btn {
          background: transparent;
          border: none;
          padding: 4px;
          cursor: pointer;
          color: var(--vz-body-color, #333);
          font-size: 22px;
          line-height: 1;
        }
        .par-chart-icon-btn:hover {
          color: var(--vz-primary, #405189);
        }
        .par-chart-menu {
          display: none;
          position: absolute;
          top: 100%;
          right: 0;
          min-width: 120px;
          background: var(--vz-secondary-bg, #fff);
          border: 1px solid var(--vz-border-color, #ccc);
          box-shadow: 0 2px 6px rgba(0,0,0,0.15);
          padding: 8px 0;
          z-index: 20;
          border-radius: 4px;
        }
        .par-chart-menu.show {
          display: block;
        }
        .par-chart-menu a {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          text-decoration: none;
          color: var(--vz-body-color, #333);
          font-size: 14px;
          cursor: pointer;
        }
        .par-chart-menu a:hover {
          background: var(--vz-light, #f0f0f0);
          color: var(--vz-body-color, #000);
        }
        [data-layout-mode="dark"] .par-chart-menu a:hover,
        [data-bs-theme="dark"] .par-chart-menu a:hover {
          background: #2a2d36;
        }
        .par-chart-menu-wrap {
          position: relative;
        }
      `}</style>
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title={t("Sale Analysis Report")} pageTitle={t("Dashboard")} />

          <div className="card d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between mb-3 p-3 rounded-3 shadow-sm border gap-3">
            <h5 className="mb-0 fw-bold text-primary d-flex align-items-center gap-2">
              <i className="ri-line-chart-line fs-20 text-primary"></i>
              {t("Sale Analysis Report")}
            </h5>

            <div className="d-flex align-items-center flex-wrap gap-2">
              <div className="d-flex align-items-center gap-2">
                <Label className="mb-0 fw-medium align-self-center">{t("Grouping")}</Label>
                <select
                  className="form-select form-select-sm"
                  style={{ width: 140, height: "31px" }}
                  value={saleAna}
                  onChange={(e) => setSaleAna(e.target.value)}
                >
                  {SALE_ANA_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{t(o.label)}</option>
                  ))}
                </select>
              </div>

              <Button
                color="primary"
                className="btn-sm rounded-2 px-3 py-1"
                onClick={handleSearch}
                disabled={loading}
                form="sale-analysis-form"
                type="submit"
              >
                {loading ? <Spinner size="sm" /> : t("Report")}
              </Button>
              <Button
                color="primary"
                className="btn-sm rounded-2 px-3 py-1"
                onClick={handlePivot}
                disabled={pivotLoading}
              >
                {pivotLoading ? <Spinner size="sm" /> : t("Pivot")}
              </Button>
              <Button
                color="soft-secondary"
                className="btn-sm rounded-2 px-3 py-1"
                onClick={handleClear}
              >
                {t("Clear")}
              </Button>
              <button
                type="button"
                className="par-chevron-btn"
                onClick={() => setShowFilterPanel((v) => !v)}
                title={showFilterPanel ? t("Collapse filters") : t("Expand filters")}
              >
                <i className={showFilterPanel ? "ri-arrow-up-s-line" : "ri-arrow-down-s-line"} />
              </button>
            </div>
          </div>

          {showFilterPanel && (
            <Card className="shadow-lg border-0 rounded-3 mb-3">
              <CardBody className="bg-light-subtle py-2">
                <form id="sale-analysis-form" onSubmit={handleSearch}>
                  <Row className="g-2 mb-2">
                    <Col sm={2}>
                      <FormGroup className="mb-0">
                        <Label className="fw-medium">{t("Date")}</Label>
                        <Input type="date" className="form-control form-control-sm" style={{ height: "35px" }} value={fromDate}
                          onChange={(e) => setFromDate(e.target.value)} />
                      </FormGroup>
                    </Col>
                    <Col sm={2}>
                      <FormGroup className="mb-0">
                        <Label className="fw-medium">{t("To Date")}</Label>
                        <Input type="date" className="form-control form-control-sm" style={{ height: "35px" }} value={toDate}
                          onChange={(e) => setToDate(e.target.value)} />
                      </FormGroup>
                    </Col>
                    <Col sm={2}>
                      <FormGroup className="mb-0">
                        <Label className="fw-medium">{t("Currency")}</Label>
                        <select className="form-select" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                          <option value="">{t("Select Currency")}</option>
                          {dropdownOptions.currency.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </FormGroup>
                    </Col>
                    <Col sm={2}>
                      <FormGroup className="mb-0">
                        <Label className="fw-medium">{t("Invoice Number")}</Label>
                        <Input type="text" placeholder={t("Invoice Number")} value={invNo}
                          onChange={(e) => setInvNo(e.target.value)} />
                      </FormGroup>
                    </Col>
                    <Col sm={2}>
                      <FormGroup className="mb-0">
                        <Label className="fw-medium">{t("Bill No")}</Label>
                        <Input type="text" placeholder={t("Bill No")} value={billNo}
                          onChange={(e) => setBillNo(e.target.value)} />
                      </FormGroup>
                    </Col>
                    <Col sm={2}>
                      <FormGroup className="mb-0">
                        <Label className="fw-medium">{t("Type")}</Label>
                        <select className="form-select" value={type} onChange={(e) => setType(e.target.value)}>
                          <option value="">{t("Select Type")}</option>
                          {dropdownOptions.type.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </FormGroup>
                    </Col>
                  </Row>

                  <Row className="g-2 mb-2">
                    <Col sm={2}>
                      <FormGroup className="mb-0">
                        <Label className="fw-medium">{t("Sub Type")}</Label>
                        <select className="form-select" value={subType} onChange={(e) => setSubType(e.target.value)}>
                          <option value="">{t("Select SubType")}</option>
                          {dropdownOptions.subType.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </FormGroup>
                    </Col>
                    <Col sm={2}>
                      <FormGroup className="mb-0">
                        <Label className="fw-medium">{t("Category")}</Label>
                        <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                          <option value="">{t("Select Category")}</option>
                          {dropdownOptions.category.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </FormGroup>
                    </Col>
                    <Col sm={2}>
                      <FormGroup className="mb-0">
                        <Label className="fw-medium">{t("Party")}</Label>
                        <Select isClearable isLoading={loadingParties} options={partyOptions}
                          value={selectedParty} onInputChange={setPartyInput}
                          onChange={setSelectedParty} placeholder={t("Search Party")} />
                      </FormGroup>
                    </Col>
                    <Col sm={2}>
                      <FormGroup className="mb-0">
                        <Label className="fw-medium">{t("Broker")}</Label>
                        <Select isClearable isLoading={loadingBrokers} options={brokerOptions}
                          value={selectedBroker} onInputChange={setBrokerInput}
                          onChange={setSelectedBroker} placeholder={t("Search Broker")} />
                      </FormGroup>
                    </Col>
                    <Col sm={2}>
                      <FormGroup className="mb-0">
                        <Label className="invisible">.</Label>
                        <div className="d-flex align-items-center" style={{ height: "38px" }}>
                          <div className="form-check">
                            <Input
                              type="checkbox"
                              id="purRtn"
                              className="form-check-input"
                              checked={purRtn}
                              onChange={(e) => setPurRtn(e.target.checked)}
                            />
                            <Label check htmlFor="purRtn" className="form-check-label mb-0">
                              {t("Purchase Return")}
                            </Label>
                          </div>
                        </div>
                      </FormGroup>
                    </Col>
                    <Col sm={2}>
                      <FormGroup className="mb-0">
                        <Label className="fw-medium">{t("Enter Lot No")}</Label>
                        <Input type="textarea" rows={3} placeholder={t("Search by lot no")}
                          value={lotNo} onChange={(e) => setLotNo(e.target.value)} />
                      </FormGroup>
                    </Col>
                  </Row>

                  <Row className="g-2 mb-2">
                    <Col sm={2}><FormGroup className="mb-0"><Label>{t("Shape")}</Label>
                      <Select isMulti options={makeSelectOptions(dropdownOptions.shape)} value={selectedShapes} onChange={setSelectedShapes} placeholder={t("Shape")} /></FormGroup></Col>
                    <Col sm={2}><FormGroup className="mb-0"><Label>{t("Color")}</Label>
                      <Select isMulti options={makeSelectOptions(dropdownOptions.color)} value={selectedColors} onChange={setSelectedColors} placeholder={t("Color")} /></FormGroup></Col>
                    <Col sm={2}><FormGroup className="mb-0"><Label>{t("Clarity")}</Label>
                      <Select isMulti options={makeSelectOptions(dropdownOptions.clarity)} value={selectedClarities} onChange={setSelectedClarities} placeholder={t("Clarity")} /></FormGroup></Col>
                    <Col sm={2}><FormGroup className="mb-0"><Label>{t("Size")}</Label>
                      <Select isMulti options={makeSelectOptions(dropdownOptions.size)} value={selectedSizes} onChange={setSelectedSizes} placeholder={t("Size")} /></FormGroup></Col>
                    <Col sm={2}><FormGroup className="mb-0"><Label>{t("Proportion")}</Label>
                      <Select isMulti options={makeSelectOptions(dropdownOptions.proportion)} value={selectedProportions} onChange={setSelectedProportions} placeholder={t("Proportion")} /></FormGroup></Col>
                    <Col sm={2}><FormGroup className="mb-0"><Label>{t("Polish")}</Label>
                      <Select isMulti options={makeSelectOptions(dropdownOptions.polish)} value={selectedPolishes} onChange={setSelectedPolishes} placeholder={t("Polish")} /></FormGroup></Col>
                  </Row>

                  <Row className="g-2 mb-2">
                    <Col sm={2}><FormGroup className="mb-0"><Label>{t("Symmetry")}</Label>
                      <Select isMulti options={makeSelectOptions(dropdownOptions.symmetry)} value={selectedSymmetries} onChange={setSelectedSymmetries} placeholder={t("Symmetry")} /></FormGroup></Col>
                    <Col sm={2}><FormGroup className="mb-0"><Label>{t("Lab")}</Label>
                      <Select isMulti options={makeSelectOptions(dropdownOptions.lab)} value={selectedLabs} onChange={setSelectedLabs} placeholder={t("LAB")} /></FormGroup></Col>
                    <Col sm={2}><FormGroup className="mb-0"><Label>{t("Fluorescence")}</Label>
                      <Select isMulti options={makeSelectOptions(dropdownOptions.fluorescence)} value={selectedFluorescences} onChange={setSelectedFluorescences} placeholder={t("Fluorescence")} /></FormGroup></Col>
                    <Col sm={2}><FormGroup className="mb-0"><Label>{t("Milky")}</Label>
                      <Select isMulti options={makeSelectOptions(dropdownOptions.milky)} value={selectedMilkies} onChange={setSelectedMilkies} placeholder={t("Milky")} /></FormGroup></Col>
                    <Col sm={2}><FormGroup className="mb-0"><Label>{t("Luster")}</Label>
                      <Select isMulti options={makeSelectOptions(dropdownOptions.luster)} value={selectedLusters} onChange={setSelectedLusters} placeholder={t("Luster")} /></FormGroup></Col>
                    <Col sm={2}><FormGroup className="mb-0"><Label>{t("Natts")}</Label>
                      <Select isMulti options={makeSelectOptions(dropdownOptions.natts)} value={selectedNatts} onChange={setSelectedNatts} placeholder={t("Natts")} /></FormGroup></Col>
                  </Row>

                  <Row className="g-2">
                    <Col sm={2}><FormGroup className="mb-0"><Label>{t("Mines")}</Label>
                      <Select isMulti options={makeSelectOptions(dropdownOptions.mines)} value={selectedMines} onChange={setSelectedMines} placeholder={t("Mines")} /></FormGroup></Col>
                    <Col sm={2}><FormGroup className="mb-0"><Label>{t("ProductType")}</Label>
                      <Select isMulti options={makeSelectOptions(dropdownOptions.productType)} value={selectedProductTypes} onChange={setSelectedProductTypes} placeholder={t("ProductType")} /></FormGroup></Col>
                    <Col sm={2}><FormGroup className="mb-0"><Label>{t("Sieve")}</Label>
                      <Select isMulti options={makeSelectOptions(dropdownOptions.sieve)} value={selectedSieves} onChange={setSelectedSieves} placeholder={t("Sieve")} /></FormGroup></Col>
                    <Col sm={2}>
                      <FormGroup className="mb-0">
                        <Label className="fw-medium">{t("Exp Party")}</Label>
                        <Select isClearable isLoading={loadingExpParties} options={expPartyOptions}
                          value={selectedExpParty} onInputChange={setExpPartyInput}
                          onChange={setSelectedExpParty} placeholder={t("Search Export Party")} />
                      </FormGroup>
                    </Col>
                  </Row>
                </form>
              </CardBody>
            </Card>
          )}

          {showPivot && (
            <Card className="shadow-lg border-0 rounded-3 mb-3">
              <CardHeader className="pb-2 border-0 d-flex justify-content-between align-items-center bg-transparent">
                <span className="fw-semibold text-primary">{t("Sale Analysis Pivot")}</span>
                <Button size="sm" color="link" className="p-0 text-muted" onClick={() => { setShowPivot(false); }}>
                  <i className="ri-close-line fs-18" />
                </Button>
              </CardHeader>
              <CardBody className="p-2">
                {pivotLoading ? (
                  <div className="text-center p-5">
                    <Spinner color="success" className="mb-2" />
                    <p className="text-muted mb-0">{t("Loading pivot data...")}</p>
                  </div>
                ) : pivotData.length === 0 ? (
                  <div className="text-center p-5">
                    <h5 className="text-muted">{t("No record found matching the configurations")}</h5>
                  </div>
                ) : (
                  <SaleAnalysisPivotView data={pivotData} />
                )}
              </CardBody>
            </Card>
          )}

          {searched && !showPivot && (
            <Card className="shadow-lg border-0 rounded-3 mb-3">
              <CardHeader className="d-flex align-items-center justify-content-between pb-2 border-0 bg-transparent">
                <Nav pills className="nav-pills-custom nav-success bg-light p-1 rounded-3" style={{ border: "none" }}>
                  <NavItem style={{ flex: 1, textAlign: "center" }}>
                    <NavLink
                      className={classnames({ active: activeTab === "table" })}
                      onClick={() => setActiveTab("table")}
                      style={{ cursor: "pointer", borderRadius: "6px", whiteSpace: "nowrap" }}
                    >
                      <i className="ri-table-line align-middle me-1" />
                      {t("Data Table")}
                    </NavLink>
                  </NavItem>
                  <NavItem style={{ flex: 1, textAlign: "center" }}>
                    <NavLink
                      className={classnames({ active: activeTab === "charts" })}
                      onClick={() => setActiveTab("charts")}
                      style={{ cursor: "pointer", borderRadius: "6px", whiteSpace: "nowrap" }}
                    >
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

              <CardBody className="p-3" style={{ minHeight: "calc(100vh - 310px)" }}>
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
                          <div className="table-responsive report-table-scroll" style={{ maxHeight: "calc(100vh - 380px)", overflowY: "auto" }}>
                            <table className="table table-bordered table-hover align-middle mb-0 text-end">
                              <thead className="table-light sticky-top">
                                <tr>
                                  <th className="text-start">{activeReportType}</th>
                                  <th>{t("Pcs")}</th>
                                  <th>{t("Pcs%")}</th>
                                  <th>{t("Carats")}</th>
                                  <th>{t("Carats%")}</th>
                                  <th className="header-bg-sale-pl">{t("Sale Amt $")}</th>
                                  <th className="header-bg-sale-pl">{t("Sale%")}</th>
                                  <th>{t("PL $")}</th>
                                  <th>{t("$ PL%")}</th>
                                  <th>{t("COGS $")}</th>
                                  <th>{t("PL % On COGS $")}</th>
                                  <th className="header-bg-sale-pl">{t("Sale Amt INR")}</th>
                                  <th className="header-bg-sale-pl">{t("Sale%")}</th>
                                  <th>{t("PL INR")}</th>
                                  <th>{t("INR PL%")}</th>
                                  <th>{t("COGS INR")}</th>
                                  <th>{t("PL % On COGS INR")}</th>
                                </tr>
                                <tr>
                                  <th className="p-1">
                                    <Input
                                      type="text"
                                      className="form-control form-control-sm"
                                      placeholder={t("Filter...")}
                                      style={{ minWidth: "120px", padding: "2px 5px", fontSize: "11px", height: "24px" }}
                                      value={colFilters.grouping || ""}
                                      onChange={(e) => {
                                        setColFilters(prev => ({ ...prev, grouping: e.target.value }));
                                        setCurrentPage(1);
                                      }}
                                    />
                                  </th>
                                  {[
                                    ["pcs", "80px"],
                                    ["pcsPer", "80px"],
                                    ["carats", "80px"],
                                    ["caratsPer", "80px"],
                                    ["saleAmtdollar", "100px"],
                                    ["saleperdollar", "80px"],
                                    ["plDollar", "100px"],
                                    ["dollarPLper", "80px"],
                                    ["purCostdollar", "100px"],
                                    ["plperOnCOGSAmtdollar", "80px"],
                                    ["saleAmtINR", "110px"],
                                    ["saleper", "80px"],
                                    ["plINR", "110px"],
                                    ["inrPLper", "80px"],
                                    ["purCostINR", "110px"],
                                    ["plperOnCOGSAmtINR", "80px"]
                                  ].map(([key, width]) => (
                                    <th className="p-1" key={key}>
                                      <Input
                                        type="text"
                                        className="form-control form-control-sm"
                                        placeholder={t("Filter...")}
                                        style={{ minWidth: width, padding: "2px 5px", fontSize: "11px", height: "24px" }}
                                        value={colFilters[key] || ""}
                                        onChange={(e) => {
                                          setColFilters(prev => ({ ...prev, [key]: e.target.value }));
                                          setCurrentPage(1);
                                        }}
                                      />
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {paginatedData.map((row, idx) => (
                                  <tr key={idx}>
                                    <td className="text-start"><b>{getGroupingValue(row, activeReportType)}</b></td>
                                    <td>{fmtInt(pick(row, "Pcs"))}</td>
                                    <td>{fmtFloat(pick(row, "PcsPer", "pcsPer"))}%</td>
                                    <td>{fmtFloat(pick(row, "Carats"))}</td>
                                    <td>{fmtFloat(pick(row, "Caratsper", "caratsper"))}%</td>
                                    <td className="cell-bg-sale-pl">{fmtCurrency(pick(row, "SaleAmtdollar"))}</td>
                                    <td className="cell-bg-sale-pl">{fmtFloat(pick(row, "Saleperdollar"))}%</td>
                                    <td>{fmtCurrency(pick(row, "PLdollar"))}</td>
                                    <td>{fmtFloat(pick(row, "DollarPLper"))}%</td>
                                    <td>{fmtCurrency(pick(row, "PurCostdollar"))}</td>
                                    <td>{fmtFloat(pick(row, "PLperOnCOGSAmtdollar"))}%</td>
                                    <td className="cell-bg-sale-pl">{fmtCurrency(pick(row, "SaleAmtINR"))}</td>
                                    <td className="cell-bg-sale-pl">{fmtFloat(pick(row, "Saleper"))}%</td>
                                    <td>{fmtCurrency(pick(row, "PLINR"))}</td>
                                    <td>{fmtFloat(pick(row, "INRPLper", "inrPLper"))}%</td>
                                    <td>{fmtCurrency(pick(row, "PurCostINR"))}</td>
                                    <td>{fmtFloat(pick(row, "PLperOnCOGSAmtINR"))}%</td>
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
                                  <td>{fmtCurrency(totals.saleAmtdollar)}</td>
                                  <td>-</td>
                                  <td>{fmtCurrency(totals.plDollar)}</td>
                                  <td>-</td>
                                  <td>{fmtCurrency(totals.purCostDollar)}</td>
                                  <td>-</td>
                                  <td>{fmtCurrency(totals.saleAmtINR)}</td>
                                  <td>-</td>
                                  <td>{fmtCurrency(totals.plINR)}</td>
                                  <td>-</td>
                                  <td>{fmtCurrency(totals.purCostINR)}</td>
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
                          <div className="par-chart-toolbar" ref={chartMenusRef}>
                            <div className="par-chart-menu-wrap">
                              <button
                                type="button"
                                className="par-chart-icon-btn"
                                title={t("Download")}
                                aria-label={t("Download")}
                                onClick={() => { setShowExportMenu((v) => !v); setShowChartTypeMenu(false); }}
                              >
                                <i className="ri-download-2-line" />
                              </button>
                              <div className={classnames("par-chart-menu", { show: showExportMenu })}>
                                <a href="#png" onClick={(e) => { e.preventDefault(); setShowExportMenu(false); handleChartExport("image/png"); }}>
                                  <i className="ri-image-line" />
                                  <span>PNG</span>
                                </a>
                                <a href="#jpg" onClick={(e) => { e.preventDefault(); setShowExportMenu(false); handleChartExport("image/jpeg"); }}>
                                  <i className="ri-file-image-line" />
                                  <span>JPG</span>
                                </a>
                                <a href="#pdf" onClick={(e) => { e.preventDefault(); setShowExportMenu(false); handleChartExport("pdf"); }}>
                                  <i className="ri-file-pdf-line" />
                                  <span>PDF</span>
                                </a>
                              </div>
                            </div>
                            <div className="par-chart-menu-wrap">
                              <button
                                type="button"
                                className="par-chart-icon-btn"
                                title={t("Chart Type")}
                                aria-label={t("Chart Type")}
                                onClick={() => { setShowChartTypeMenu((v) => !v); setShowExportMenu(false); }}
                              >
                                <i className="ri-menu-line" />
                              </button>
                              <div className={classnames("par-chart-menu", { show: showChartTypeMenu })}>
                                <a href="#donut" onClick={(e) => { e.preventDefault(); setChartType("doughnut"); setShowChartTypeMenu(false); }}>
                                  <i className="ri-pie-chart-2-fill" />
                                  <span>{t("Donut")}</span>
                                </a>
                                <a href="#pie" onClick={(e) => { e.preventDefault(); setChartType("pie"); setShowChartTypeMenu(false); }}>
                                  <i className="ri-pie-chart-line" />
                                  <span>{t("Pie")}</span>
                                </a>
                                <a href="#bar" onClick={(e) => { e.preventDefault(); setChartType("bar"); setShowChartTypeMenu(false); }}>
                                  <i className="ri-bar-chart-2-line" />
                                  <span>{t("Bar")}</span>
                                </a>
                              </div>
                            </div>
                          </div>

                          <h2 className="text-center mb-3">{t("Sale Analysis Report")}</h2>
                          <Row className="justify-content-center">
                            {[
                              { id: "saleCaratPerChart",  cd: chartData.caratsPer  },
                              { id: "saleSaleAmtChart",   cd: chartData.saleAmtPer },
                              { id: "salePLCOGSChart",    cd: chartData.plCOGSPer  }
                            ].map(({ id, cd }) => (
                              <Col key={id} sm={4}>
                                <div style={{ height: 450 }}>
                                  {chartType === "doughnut" ? (
                                    <Doughnut
                                      id={id}
                                      data={cd}
                                      options={buildChartConfig(cd, chartType).options}
                                      plugins={[arrowLinesPlugin]}
                                    />
                                  ) : chartType === "pie" ? (
                                    <Pie
                                      id={id}
                                      data={cd}
                                      options={buildChartConfig(cd, chartType).options}
                                      plugins={[arrowLinesPlugin]}
                                    />
                                  ) : (
                                    <Bar
                                      id={id}
                                      data={cd}
                                      options={buildChartConfig(cd, chartType).options}
                                    />
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

export default SaleAnalysisReport;
