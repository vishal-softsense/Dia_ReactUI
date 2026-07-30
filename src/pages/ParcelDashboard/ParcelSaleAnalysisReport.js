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
import { toast, ToastContainer } from "react-toastify";
import { Bar, Pie, Doughnut } from "react-chartjs-2";
import classnames from "classnames";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import {
  getParcelSaleAnalysisReport,
  getParcelSaleAnalysisPivotData,
  getParcelSaleAnalysisDropdowns,
  getAccGrpMasterDropdowns,
  getAccGrpMasters
} from "../../helpers/fakebackend_helper";
import { exportToExcel } from "../../helpers/excel_helper";
import ParcelSalePivotReport from "./ParcelSalePivotReport";
import "chart.js/auto";

const Select = (props) => (
  <ReactSelect
    menuPortalTarget={document.body}
    styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }), ...props.styles }}
    {...props}
  />
);

// MVC palette
const CHART_COLORS = [
  "#FF6384", "#91eded", "#FFCE25", "#4BC0C0",
  "#9966FF", "#FF00FF", "#0000FF", "#75cb7c", "#38A2EB"
];

/** MVC arrowLinesPlugin — external labels with leader lines (pie/donut only) */
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

// Grouping Options matching ParcelSaleAnalysisReport.js
const SALE_ANA_OPTIONS = [
  { value: "Shape",         label: "Shape" },
  { value: "Size",          label: "Size" },
  { value: "Color",         label: "Color" },
  { value: "Clarity",       label: "Clarity" },
  { value: "Sieve",         label: "Sieve" },
  { value: "PartyLocation", label: "Party Location" },
  { value: "StockID",       label: "StockID" },
  { value: "Month",         label: "Month" }
];

const ParcelSaleAnalysisReport = () => {
  const { t } = useTranslation();

  // ── Filters ────────────────────────────────────────────────────────────────
  const [fromDate,   setFromDate]   = useState("2024-01-21");
  const [toDate,     setToDate]     = useState(new Date().toISOString().substring(0, 10));
  const [currency,   setCurrency]   = useState("");
  const [invNo,      setInvNo]      = useState("");

  // Party Autocomplete State (matching MVC /common/get-account)
  const [partyInput, setPartyInput] = useState("");
  const [partyOptions, setPartyOptions] = useState([]);
  const [selectedParty, setSelectedParty] = useState(null);
  const [loadingParties, setLoadingParties] = useState(false);

  // Broker Autocomplete State (matching MVC /common/get-account)
  const [brokerInput, setBrokerInput] = useState("");
  const [brokerOptions, setBrokerOptions] = useState([]);
  const [selectedBroker, setSelectedBroker] = useState(null);
  const [loadingBrokers, setLoadingBrokers] = useState(false);

  const [lotNo,      setLotNo]      = useState("");
  const [saleAna,    setSaleAna]    = useState("Shape");

  // Multi-select Lists
  const [selectedShapeGroups,     setSelectedShapeGroups]     = useState([]);
  const [selectedShapes,          setSelectedShapes]          = useState([]);
  const [selectedColorGroups,     setSelectedColorGroups]     = useState([]);
  const [selectedColors,          setSelectedColors]          = useState([]);
  const [selectedClarities,       setSelectedClarities]       = useState([]);
  const [selectedSizes,           setSelectedSizes]           = useState([]);
  const [selectedSieves,          setSelectedSieves]          = useState([]);
  const [selectedBoxNms,          setSelectedBoxNms]          = useState([]);
  const [selectedPartyLocations,  setSelectedPartyLocations]  = useState([]);
  const [selectedItemGroups,      setSelectedItemGroups]      = useState([]);

  // Dropdown master options
  const [dropdownOptions, setDropdownOptions] = useState({
    currency: [], shapeGroup: [], shape: [], colorGroup: [], color: [],
    size: [], clarity: [], sieve: [], boxname: [], location: [], itemGroup: []
  });

  // ── UI state ───────────────────────────────────────────────────────────────
  const [loading,         setLoading]         = useState(false);
  const [pivotLoading,    setPivotLoading]     = useState(false);
  const [reportData,      setReportData]       = useState([]);
  const [pivotData,       setPivotData]        = useState([]);
  const [searched,        setSearched]         = useState(false);
  const [showFilterPanel, setShowFilterPanel]  = useState(true);
  const [activeReportType,setActiveReportType] = useState("Shape");
  const [activeTab,       setActiveTab]        = useState("table");
  const [showPivot,       setShowPivot]        = useState(false);

  // Chart settings
  const [chartType,         setChartType]         = useState("doughnut");
  const [showExportMenu,    setShowExportMenu]     = useState(false);
  const [showChartTypeMenu, setShowChartTypeMenu]  = useState(false);
  const chartMenusRef = useRef(null);

  // Pagination & search
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize,    setPageSize]    = useState(500);
  const [searchTerm,  setSearchTerm]  = useState("");
  const [colFilters,  setColFilters]  = useState({});

  // Close menus on outside click
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

  // Fetch dropdowns from backend API on mount
  useEffect(() => {
    fetchDropdowns();
  }, []);

  const fetchDropdowns = async () => {
    try {
      const response = await getParcelSaleAnalysisDropdowns();
      let currencyList = [];
      let data = [];

      if (response.success || response.Success) {
        const raw = response.data ?? response.Data;
        if (Array.isArray(raw)) {
          data = raw;
        } else if (raw && typeof raw === "object") {
          data = raw.data || raw.Data || [];
          if (Array.isArray(raw.currency || raw.Currency)) {
            currencyList = raw.currency || raw.Currency;
          }
        }

        const filterByType = (typeStr) =>
          data.filter((x) => String(x?.type ?? x?.Type ?? "").toLowerCase() === typeStr.toLowerCase());

        if (!currencyList.length) {
          currencyList = filterByType("Currency");
        }

        const grouped = {
          currency:   currencyList,
          shapeGroup: filterByType("ShapeGroup"),
          shape:      filterByType("Shape"),
          colorGroup: filterByType("ColorGroup"),
          color:      filterByType("Color"),
          size:       filterByType("Size"),
          clarity:    filterByType("Clarity"),
          sieve:      filterByType("Sieve"),
          boxname:    filterByType("BoxName"),
          location:   data.filter((x) => {
            const t = String(x?.type ?? x?.Type ?? "").toLowerCase();
            return t === "location" || t === "country" || t === "partylocation";
          }),
          itemGroup:  filterByType("ItemGroup")
        };

        // Fallback for currency if primary API returns empty currency list
        if (!grouped.currency || !grouped.currency.length) {
          try {
            const accGrpRes = await getAccGrpMasterDropdowns();
            if (accGrpRes?.success || accGrpRes?.Success) {
              const accData = accGrpRes.data || accGrpRes.Data;
              grouped.currency = accData?.currency || accData?.Currency || [];
            }
          } catch (e) {
            console.warn("Could not load currency from AccGrpMasterDropdowns", e);
          }
        }

        // Default currency options fallback
        if (!grouped.currency || !grouped.currency.length) {
          grouped.currency = ["USD", "INR", "EUR", "GBP", "HKD", "AED", "CAD", "AUD"].map((code) => ({ id: code, name: code }));
        }

        setDropdownOptions(grouped);
      }
    } catch {
      toast.error(t("Failed to load filter dropdown option lists"));
    }
  };

  // Autocomplete account lookup matching MVC /common/get-account
  const handleAccountSearch = async (term, setOptions, setLoadingState) => {
    if (!term || term.length < 2) {
      setOptions([]);
      return;
    }
    setLoadingState(true);
    try {
      const response = await getAccGrpMasters(term);
      if (response?.success || response?.Success) {
        const data = response.data || response.Data || [];
        setOptions(
          data.map((item) => ({
            value: item.accGrpName || item.AccGrpName || item.accGrpCode || item.AccGrpCode,
            label: item.accGrpName || item.AccGrpName
          }))
        );
      } else if (Array.isArray(response)) {
        setOptions(
          response.map((item) => ({
            value: item.accGrpName || item.AccGrpName || item.accGrpCode || item.AccGrpCode,
            label: item.accGrpName || item.AccGrpName
          }))
        );
      }
    } catch (err) {
      console.error("Account search error:", err);
    } finally {
      setLoadingState(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      handleAccountSearch(partyInput, setPartyOptions, setLoadingParties);
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [partyInput]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      handleAccountSearch(brokerInput, setBrokerOptions, setLoadingBrokers);
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [brokerInput]);

  const getSingleOrMultiValue = (selected) => {
    if (!selected) return null;
    if (Array.isArray(selected)) {
      return selected.length > 0 ? selected.map((x) => x.value || x.label || x).join(",") : null;
    }
    if (typeof selected === "object") {
      return selected.value || selected.label || null;
    }
    return String(selected);
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const mapSelectVal = (list) => {
    if (!list || !list.length) return null;
    const vals = list.map((i) => i.value).filter((v) => v != null && String(v).trim() !== "");
    return vals.length ? vals : null;
  };

  const makeSelectOptions = (arr) =>
    (arr || []).map((x) => ({
      value: x.name ?? x.Name ?? x.id ?? x.ID,
      label: x.name ?? x.Name ?? x.id ?? x.ID
    }));

  const buildPayload = () => ({
    fromDate:       fromDate || null,
    toDate:         toDate || null,
    currency:       currency || null,
    invNo:          invNo || null,
    party:          getSingleOrMultiValue(selectedParty),
    broker:         getSingleOrMultiValue(selectedBroker),
    lotNo:          lotNo || null,
    shapeGroup:     mapSelectVal(selectedShapeGroups),
    shape:          mapSelectVal(selectedShapes),
    colorGroup:     mapSelectVal(selectedColorGroups),
    color:          mapSelectVal(selectedColors),
    clarity:        mapSelectVal(selectedClarities),
    size:           mapSelectVal(selectedSizes),
    sieve:          mapSelectVal(selectedSieves),
    boxnm:          mapSelectVal(selectedBoxNms),
    partyLocation:  mapSelectVal(selectedPartyLocations),
    itemGroup:      mapSelectVal(selectedItemGroups),
    saleAna:        saleAna || "Shape"
  });

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setSearched(true);
    setCurrentPage(1);
    setShowPivot(false);

    try {
      const response = await getParcelSaleAnalysisReport(buildPayload());
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
      toast.error(typeof err === "string" ? err : err?.message || t("Error generating Parcel Sale Analysis Report"));
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
      const response = await getParcelSaleAnalysisPivotData(buildPayload());
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

  const handleClear = () => {
    setFromDate("2024-01-21");
    setToDate(new Date().toISOString().substring(0, 10));
    setCurrency(""); setInvNo(""); setLotNo("");
    setSelectedParty(null); setPartyInput(""); setPartyOptions([]);
    setSelectedBroker(null); setBrokerInput(""); setBrokerOptions([]);
    setSaleAna("Shape");
    setSelectedShapeGroups([]); setSelectedShapes([]); setSelectedColorGroups([]);
    setSelectedColors([]); setSelectedClarities([]); setSelectedSizes([]);
    setSelectedSieves([]); setSelectedBoxNms([]); setSelectedPartyLocations([]);
    setSelectedItemGroups([]);
    setReportData([]); setPivotData([]);
    setSearched(false); setShowPivot(false); setShowFilterPanel(true);
    setCurrentPage(1); setSearchTerm(""); setColFilters({});
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
    const v = pick(row, field, field.charAt(0).toLowerCase() + field.slice(1), "groupName", "GroupName");
    return v === undefined || v === null || v === "" ? "" : String(v);
  };

  const getColValue = (row, colKey) => {
    switch (colKey) {
      case "grouping":
        return getGroupingValue(row, activeReportType);
      case "pcs":
        return pick(row, "Pcs", "pcs");
      case "pcsPer":
        return pick(row, "PcsPer", "pcsPer");
      case "carats":
        return pick(row, "Carats", "carats");
      case "caratsPer":
        return pick(row, "Caratsper", "caratsper");
      case "saleAmtdollar":
        return pick(row, "SaleAmtdollar", "saleAmtdollar");
      case "saleperdollar":
        return pick(row, "Saleperdollar", "saleperdollar");
      case "plDollar":
        return pick(row, "PLdollar", "pLdollar");
      case "dollarPLper":
        return pick(row, "DollarPLper", "dollarPLper");
      case "cOGSdollar":
        return pick(row, "COGSdollar", "cOGSdollar", "PurCostdollar");
      case "plperOnCOGSAmtdollar":
        return pick(row, "PLperOnCOGSAmtdollar", "pLperOnCOGSAmtdollar");
      case "saleAmtINR":
        return pick(row, "SaleAmtINR", "saleAmtINR");
      case "saleper":
        return pick(row, "Saleper", "saleper");
      case "plINR":
        return pick(row, "PLINR", "pLINR");
      case "inrPLper":
        return pick(row, "INRPLper", "inrPLper", "iNRPLper");
      case "cOGSINR":
        return pick(row, "COGSINR", "cOGSINR", "PurCostINR");
      case "plperOnCOGSAmtINR":
        return pick(row, "PLperOnCOGSAmtINR", "pLperOnCOGSAmtINR");
      default:
        return "";
    }
  };

  const fmtInt   = (n) => Math.round(Number(n || 0));
  const fmtFloat = (n) => Number(n || 0).toFixed(2);
  const fmtCurrency = (n) =>
    Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const rowNum = (row, ...names) => Number(pick(row, ...names) ?? 0);

  const ALL_COL_KEYS = [
    "grouping", "pcs", "pcsPer", "carats", "caratsPer",
    "saleAmtdollar", "saleperdollar", "plDollar", "dollarPLper",
    "cOGSdollar", "plperOnCOGSAmtdollar", "saleAmtINR", "saleper",
    "plINR", "inrPLper", "cOGSINR", "plperOnCOGSAmtINR"
  ];

  const getColSearchStrings = (row, colKey) => {
    switch (colKey) {
      case "grouping": {
        const v = getGroupingValue(row, activeReportType);
        return [v];
      }
      case "pcs": {
        const raw = pick(row, "Pcs", "pcs");
        if (raw === undefined || raw === null) return [];
        const num = fmtInt(raw);
        return [String(raw), String(num)];
      }
      case "pcsPer": {
        const raw = pick(row, "PcsPer", "pcsPer");
        if (raw === undefined || raw === null) return [];
        const f = fmtFloat(raw);
        return [String(raw), f, `${f}%`];
      }
      case "carats": {
        const raw = pick(row, "Carats", "carats");
        if (raw === undefined || raw === null) return [];
        const f = fmtFloat(raw);
        return [String(raw), f];
      }
      case "caratsPer": {
        const raw = pick(row, "Caratsper", "caratsper");
        if (raw === undefined || raw === null) return [];
        const f = fmtFloat(raw);
        return [String(raw), f, `${f}%`];
      }
      case "saleAmtdollar": {
        const raw = pick(row, "SaleAmtdollar", "saleAmtdollar");
        if (raw === undefined || raw === null) return [];
        const f = fmtFloat(raw);
        const c = fmtCurrency(raw);
        return [String(raw), f, c];
      }
      case "saleperdollar": {
        const raw = pick(row, "Saleperdollar", "saleperdollar");
        if (raw === undefined || raw === null) return [];
        const f = fmtFloat(raw);
        return [String(raw), f, `${f}%`];
      }
      case "plDollar": {
        const raw = pick(row, "PLdollar", "pLdollar");
        if (raw === undefined || raw === null) return [];
        const f = fmtFloat(raw);
        const c = fmtCurrency(raw);
        return [String(raw), f, c];
      }
      case "dollarPLper": {
        const raw = pick(row, "DollarPLper", "dollarPLper");
        if (raw === undefined || raw === null) return [];
        const f = fmtFloat(raw);
        return [String(raw), f, `${f}%`];
      }
      case "cOGSdollar": {
        const raw = pick(row, "COGSdollar", "cOGSdollar", "PurCostdollar");
        if (raw === undefined || raw === null) return [];
        const f = fmtFloat(raw);
        const c = fmtCurrency(raw);
        return [String(raw), f, c];
      }
      case "plperOnCOGSAmtdollar": {
        const raw = pick(row, "PLperOnCOGSAmtdollar", "pLperOnCOGSAmtdollar");
        if (raw === undefined || raw === null) return [];
        const f = fmtFloat(raw);
        return [String(raw), f, `${f}%`];
      }
      case "saleAmtINR": {
        const raw = pick(row, "SaleAmtINR", "saleAmtINR");
        if (raw === undefined || raw === null) return [];
        const f = fmtFloat(raw);
        const c = fmtCurrency(raw);
        return [String(raw), f, c];
      }
      case "saleper": {
        const raw = pick(row, "Saleper", "saleper");
        if (raw === undefined || raw === null) return [];
        const f = fmtFloat(raw);
        return [String(raw), f, `${f}%`];
      }
      case "plINR": {
        const raw = pick(row, "PLINR", "pLINR");
        if (raw === undefined || raw === null) return [];
        const f = fmtFloat(raw);
        const c = fmtCurrency(raw);
        return [String(raw), f, c];
      }
      case "inrPLper": {
        const raw = pick(row, "INRPLper", "inrPLper", "iNRPLper");
        if (raw === undefined || raw === null) return [];
        const f = fmtFloat(raw);
        return [String(raw), f, `${f}%`];
      }
      case "cOGSINR": {
        const raw = pick(row, "COGSINR", "cOGSINR", "PurCostINR");
        if (raw === undefined || raw === null) return [];
        const f = fmtFloat(raw);
        const c = fmtCurrency(raw);
        return [String(raw), f, c];
      }
      case "plperOnCOGSAmtINR": {
        const raw = pick(row, "PLperOnCOGSAmtINR", "pLperOnCOGSAmtINR");
        if (raw === undefined || raw === null) return [];
        const f = fmtFloat(raw);
        return [String(raw), f, `${f}%`];
      }
      default:
        return [];
    }
  };

  // ── Filtered / paginated data ───────────────────────────────────────────────
  const filteredData = useMemo(() => {
    let data = reportData;

    // Quick Search across ALL table columns
    if (searchTerm && searchTerm.trim() !== "") {
      const term = searchTerm.trim().toLowerCase();
      data = data.filter((row) =>
        ALL_COL_KEYS.some((colKey) =>
          getColSearchStrings(row, colKey).some((str) => str.toLowerCase().includes(term))
        )
      );
    }

    // Column-wise filters with %, 00.00, and 0 format support
    Object.keys(colFilters).forEach((key) => {
      const val = colFilters[key];
      if (val && val.trim() !== "") {
        const term = val.trim().toLowerCase();
        data = data.filter((row) =>
          getColSearchStrings(row, key).some((str) => str.toLowerCase().includes(term))
        );
      }
    });

    return data;
  }, [reportData, searchTerm, colFilters, activeReportType]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;

  // ── Footer totals ──────────────────────────────────────────────────────────
  const totals = useMemo(() => {
    const s = { pcs: 0, carats: 0, saleAmtdollar: 0, plDollar: 0, cOGSdollar: 0, saleAmtINR: 0, plINR: 0, cOGSINR: 0 };
    filteredData.forEach((row) => {
      s.pcs           += rowNum(row, "Pcs", "pcs");
      s.carats        += rowNum(row, "Carats", "carats");
      s.saleAmtdollar += rowNum(row, "SaleAmtdollar", "saleAmtdollar");
      s.plDollar      += rowNum(row, "PLdollar", "pLdollar");
      s.cOGSdollar    += rowNum(row, "COGSdollar", "cOGSdollar", "PurCostdollar");
      s.saleAmtINR    += rowNum(row, "SaleAmtINR", "saleAmtINR");
      s.plINR         += rowNum(row, "PLINR", "pLINR");
      s.cOGSINR       += rowNum(row, "COGSINR", "cOGSINR", "PurCostINR");
    });
    return s;
  }, [filteredData]);

  // ── Chart data ─────────────────────────────────────────────────────────────
  const chartData = useMemo(() => {
    if (!reportData.length) return null;
    const labels        = reportData.map((r) => getGroupingValue(r, activeReportType) || "Unknown");
    const carats        = reportData.map((r) => rowNum(r, "Carats", "carats"));
    const caratsper     = reportData.map((r) => rowNum(r, "Caratsper", "caratsper"));
    const saleAmtdollar = reportData.map((r) => rowNum(r, "SaleAmtdollar", "saleAmtdollar"));
    const saleperdollar = reportData.map((r) => rowNum(r, "Saleperdollar", "saleperdollar"));
    const plDollar      = reportData.map((r) => rowNum(r, "PLdollar", "pLdollar"));
    const plperOnCOGS   = reportData.map((r) => rowNum(r, "PLperOnCOGSAmtdollar", "pLperOnCOGSAmtdollar"));

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
      caratsPer:  makeChart("Sale Carats%",   caratsper,     carats,        false),
      saleAmtPer: makeChart("Sale Amt%",       saleperdollar, saleAmtdollar, true),
      plCOGSPer:  makeChart("PL%OnCOGSAmt$",   plperOnCOGS,   plDollar,      false)
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

  // ── Excel export ───────────────────────────────────────────────────────────
  const handleExportExcel = async () => {
    if (!filteredData.length) {
      toast.warning(t("No data available to export"));
      return;
    }

    const headers = [
      activeReportType,
      "Pcs", "Pcs%", "Carats", "Carats%",
      "Sale Amt $", "Sale%", "PL $", "$ PL%", "COGS $", "PL % On COGS $",
      "Sale Amt INR", "Sale%", "PL INR", "INR PL%", "COGS INR", "PL % On COGS INR"
    ];

    const rows = filteredData.map((row) => [
      getGroupingValue(row, activeReportType),
      pick(row, "Pcs", "pcs") ?? 0,
      pick(row, "PcsPer", "pcsPer") ?? 0,
      pick(row, "Carats", "carats") ?? 0,
      pick(row, "Caratsper", "caratsper") ?? 0,
      pick(row, "SaleAmtdollar", "saleAmtdollar") ?? 0,
      pick(row, "Saleperdollar", "saleperdollar") ?? 0,
      pick(row, "PLdollar", "pLdollar") ?? 0,
      pick(row, "DollarPLper", "dollarPLper") ?? 0,
      pick(row, "COGSdollar", "cOGSdollar", "PurCostdollar") ?? 0,
      pick(row, "PLperOnCOGSAmtdollar", "pLperOnCOGSAmtdollar") ?? 0,
      pick(row, "SaleAmtINR", "saleAmtINR") ?? 0,
      pick(row, "Saleper", "saleper") ?? 0,
      pick(row, "PLINR", "pLINR") ?? 0,
      pick(row, "INRPLper", "inrPLper", "iNRPLper") ?? 0,
      pick(row, "COGSINR", "cOGSINR", "PurCostINR") ?? 0,
      pick(row, "PLperOnCOGSAmtINR", "pLperOnCOGSAmtINR") ?? 0
    ]);

    rows.push([
      "Total",
      totals.pcs, "", fmtFloat(totals.carats), "",
      fmtFloat(totals.saleAmtdollar), "", fmtFloat(totals.plDollar), "", fmtFloat(totals.cOGSdollar), "",
      fmtFloat(totals.saleAmtINR), "", fmtFloat(totals.plINR), "", fmtFloat(totals.cOGSINR), ""
    ]);

    const sheetName = `${activeReportType}_ParcelSaleAnalysis`;
    const fileName = `${activeReportType}ParcelSaleAnalysisReport-Data`;

    const res = await exportToExcel(headers, rows, sheetName, fileName);
    if (res.success) {
      toast.success(t("Exported to Excel successfully!"));
    } else {
      toast.error(t("Export failed"));
    }
  };

  // ── Chart image export ─────────────────────────────────────────────────────
  const canvasIds = ["parcelSaleCaratPerChart", "parcelSaleSaleAmtChart", "parcelSalePLCOGSChart"];

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
    ctx2.fillText("Parcel Sale Analysis Report", combined.width / 2, 40);

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
      pdf.save("ParcelSaleAnalysis_Charts.pdf");
    } else {
      const link = document.createElement("a");
      link.href = combined.toDataURL(format, 1.0);
      link.download = `ParcelSaleAnalysis_Charts.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // ── Page title ─────────────────────────────────────────────────────────────
  useEffect(() => {
    document.title = `${t("Parcel Sale Analysis Report")} | ${t("Admin")}`;
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────
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
        /* MVC chart toolbar: download + hamburger */
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

        /* ── Report Table Theme & Layout Styling ── */
        .par-report-table {
          border-collapse: separate !important;
          border-spacing: 0 !important;
          width: 100%;
        }
        .par-report-table th,
        .par-report-table td {
          white-space: nowrap !important;
          vertical-align: middle;
        }
        /* Sticky header row 1 (Titles) */
        .par-report-table thead tr:first-child th {
          position: sticky;
          top: 0;
          z-index: 12;
          background-color: var(--vz-table-head-bg, #f3f6f9) !important;
          color: var(--vz-table-head-color, #495057);
          font-weight: 700;
          font-size: 12px;
          border-bottom: 1px solid var(--vz-border-color, #e9ebec);
          padding: 8px 10px;
          letter-spacing: 0.2px;
        }
        /* Sticky header row 2 (Filter inputs) */
        .par-report-table thead tr:nth-child(2) th {
          position: sticky;
          top: 35px;
          z-index: 11;
          background-color: var(--vz-table-head-bg, #f3f6f9) !important;
          border-bottom: 1px solid var(--vz-border-color, #e9ebec);
          padding: 4px 6px;
        }
        /* Data table rows */
        .par-report-table tbody td {
          padding: 6px 10px;
          font-size: 12px;
          border-bottom: 1px solid var(--vz-border-color, #e9ebec);
        }
        /* Fixed static footer matching report design */
        .par-report-table tfoot td {
          position: sticky;
          bottom: 0;
          z-index: 10;
          background-color: var(--vz-table-head-bg, #f3f6f9) !important;
          color: var(--vz-body-color, #212529);
          font-weight: 700;
          font-size: 12px;
          border-top: 1px solid var(--vz-border-color, #e9ebec) !important;
          border-bottom: 1px solid var(--vz-border-color, #e9ebec);
          padding: 8px 10px;
        }
        [data-layout-mode="dark"] .par-report-table thead tr:first-child th,
        [data-bs-theme="dark"] .par-report-table thead tr:first-child th,
        [data-layout-mode="dark"] .par-report-table thead tr:nth-child(2) th,
        [data-bs-theme="dark"] .par-report-table thead tr:nth-child(2) th,
        [data-layout-mode="dark"] .par-report-table tfoot td,
        [data-bs-theme="dark"] .par-report-table tfoot td {
          background-color: #212529 !important;
          color: #ced4da;
          border-color: #32383e !important;
        }
      `}</style>
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title={t("Parcel Sale Analysis Report")} pageTitle={t("Dashboard")} />

          {/* Top Control Bar */}
          <div className="card d-flex flex-row flex-wrap align-items-center justify-content-between mb-3 p-3 rounded-3 shadow-sm border gap-2">
            <h5 className="mb-0 fw-bold text-primary d-flex align-items-center gap-2">
              <i className="ri-line-chart-line fs-20 text-primary"></i>
              {t("Parcel Sale Analysis Report")}
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
                form="parcel-sale-analysis-form"
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
                <form id="parcel-sale-analysis-form" onSubmit={handleSearch}>
                  {/* Row 1: Date, To Date, Currency, Invoice No, Party, Broker */}
                  <Row className="g-2 mb-2">
                    <Col sm={2}>
                      <FormGroup className="mb-0">
                        <Label className="fw-medium">{t("Date")}</Label>
                        <Input
                          type="date"
                          className="form-control"
                          value={fromDate}
                          onChange={(e) => setFromDate(e.target.value)}
                        />
                      </FormGroup>
                    </Col>
                    <Col sm={2}>
                      <FormGroup className="mb-0">
                        <Label className="fw-medium">{t("To Date")}</Label>
                        <Input
                          type="date"
                          className="form-control"
                          value={toDate}
                          onChange={(e) => setToDate(e.target.value)}
                        />
                      </FormGroup>
                    </Col>
                    <Col sm={2}>
                      <FormGroup className="mb-0">
                        <Label className="fw-medium">{t("Currency")}</Label>
                        <select
                          className="form-select"
                          value={currency}
                          onChange={(e) => setCurrency(e.target.value)}
                        >
                          <option value="">{t("Select Currency")}</option>
                          {dropdownOptions.currency.map((c, idx) => {
                            const val = typeof c === "string" ? c : (c.name ?? c.Name ?? c.id ?? c.ID ?? c.code ?? c.Code ?? "");
                            const lbl = typeof c === "string" ? c : (c.name ?? c.Name ?? c.textName ?? c.TextName ?? c.id ?? c.ID ?? c.code ?? c.Code ?? "");
                            return (
                              <option key={idx} value={val}>
                                {lbl}
                              </option>
                            );
                          })}
                        </select>
                      </FormGroup>
                    </Col>
                    <Col sm={2}>
                      <FormGroup className="mb-0">
                        <Label className="fw-medium">{t("Invoice No")}</Label>
                        <Input
                          type="text"
                          placeholder={t("Invoice No")}
                          value={invNo}
                          onChange={(e) => setInvNo(e.target.value)}
                        />
                      </FormGroup>
                    </Col>
                    <Col sm={2}>
                      <FormGroup className="mb-0">
                        <Label className="fw-medium">{t("Party")}</Label>
                        <Select
                          isClearable
                          isLoading={loadingParties}
                          options={partyOptions}
                          value={selectedParty}
                          onInputChange={(val) => setPartyInput(val)}
                          onChange={setSelectedParty}
                          placeholder={t("Search Party")}
                          noOptionsMessage={() =>
                            partyInput.length < 2
                              ? t("Please enter 2 or more characters")
                              : t("No options")
                          }
                        />
                      </FormGroup>
                    </Col>
                    <Col sm={2}>
                      <FormGroup className="mb-0">
                        <Label className="fw-medium">{t("Broker")}</Label>
                        <Select
                          isClearable
                          isLoading={loadingBrokers}
                          options={brokerOptions}
                          value={selectedBroker}
                          onInputChange={(val) => setBrokerInput(val)}
                          onChange={setSelectedBroker}
                          placeholder={t("Search Broker")}
                          noOptionsMessage={() =>
                            brokerInput.length < 2
                              ? t("Please enter 2 or more characters")
                              : t("No options")
                          }
                        />
                      </FormGroup>
                    </Col>
                  </Row>

                  {/* Row 2: Shape Group, Shape, Size, Sieve, Color Group, Color */}
                  <Row className="g-2 mb-2">
                    <Col sm={2}>
                      <FormGroup className="mb-0">
                        <Label className="fw-medium">{t("Shape Group")}</Label>
                        <Select
                          isMulti
                          options={makeSelectOptions(dropdownOptions.shapeGroup)}
                          value={selectedShapeGroups}
                          onChange={setSelectedShapeGroups}
                          placeholder={t("ShapeGroup")}
                        />
                      </FormGroup>
                    </Col>
                    <Col sm={2}>
                      <FormGroup className="mb-0">
                        <Label className="fw-medium">{t("Shape")}</Label>
                        <Select
                          isMulti
                          options={makeSelectOptions(dropdownOptions.shape)}
                          value={selectedShapes}
                          onChange={setSelectedShapes}
                          placeholder={t("Shape")}
                        />
                      </FormGroup>
                    </Col>
                    <Col sm={2}>
                      <FormGroup className="mb-0">
                        <Label className="fw-medium">{t("Size")}</Label>
                        <Select
                          isMulti
                          options={makeSelectOptions(dropdownOptions.size)}
                          value={selectedSizes}
                          onChange={setSelectedSizes}
                          placeholder={t("Size")}
                        />
                      </FormGroup>
                    </Col>
                    <Col sm={2}>
                      <FormGroup className="mb-0">
                        <Label className="fw-medium">{t("Sieve")}</Label>
                        <Select
                          isMulti
                          options={makeSelectOptions(dropdownOptions.sieve)}
                          value={selectedSieves}
                          onChange={setSelectedSieves}
                          placeholder={t("Sieve")}
                        />
                      </FormGroup>
                    </Col>
                    <Col sm={2}>
                      <FormGroup className="mb-0">
                        <Label className="fw-medium">{t("Color Group")}</Label>
                        <Select
                          isMulti
                          options={makeSelectOptions(dropdownOptions.colorGroup)}
                          value={selectedColorGroups}
                          onChange={setSelectedColorGroups}
                          placeholder={t("ColorGroup")}
                        />
                      </FormGroup>
                    </Col>
                    <Col sm={2}>
                      <FormGroup className="mb-0">
                        <Label className="fw-medium">{t("Color")}</Label>
                        <Select
                          isMulti
                          options={makeSelectOptions(dropdownOptions.color)}
                          value={selectedColors}
                          onChange={setSelectedColors}
                          placeholder={t("Color")}
                        />
                      </FormGroup>
                    </Col>
                  </Row>

                  {/* Row 3: Clarity, Box Name, Party Location, Group, Enter Lot No */}
                  <Row className="g-2">
                    <Col sm={2}>
                      <FormGroup className="mb-0">
                        <Label className="fw-medium">{t("Clarity")}</Label>
                        <Select
                          isMulti
                          options={makeSelectOptions(dropdownOptions.clarity)}
                          value={selectedClarities}
                          onChange={setSelectedClarities}
                          placeholder={t("Clarity")}
                        />
                      </FormGroup>
                    </Col>
                    <Col sm={2}>
                      <FormGroup className="mb-0">
                        <Label className="fw-medium">{t("Box Name")}</Label>
                        <Select
                          isMulti
                          options={makeSelectOptions(dropdownOptions.boxname)}
                          value={selectedBoxNms}
                          onChange={setSelectedBoxNms}
                          placeholder={t("BoxName")}
                        />
                      </FormGroup>
                    </Col>
                    <Col sm={2}>
                      <FormGroup className="mb-0">
                        <Label className="fw-medium">{t("Party Location")}</Label>
                        <Select
                          isMulti
                          options={makeSelectOptions(dropdownOptions.location)}
                          value={selectedPartyLocations}
                          onChange={setSelectedPartyLocations}
                          placeholder={t("Party Location")}
                        />
                      </FormGroup>
                    </Col>
                    <Col sm={2}>
                      <FormGroup className="mb-0">
                        <Label className="fw-medium">{t("Group")}</Label>
                        <Select
                          isMulti
                          options={makeSelectOptions(dropdownOptions.itemGroup)}
                          value={selectedItemGroups}
                          onChange={setSelectedItemGroups}
                          placeholder={t("ItemGroup")}
                        />
                      </FormGroup>
                    </Col>
                    <Col sm={4}>
                      <FormGroup className="mb-0">
                        <Label className="fw-medium">{t("Enter Lot No")}</Label>
                        <Input
                          type="textarea"
                          rows={2}
                          placeholder={t("Search by lot no")}
                          value={lotNo}
                          onChange={(e) => setLotNo(e.target.value)}
                        />
                      </FormGroup>
                    </Col>
                  </Row>
                </form>
              </CardBody>
            </Card>
          )}

          {/* ── Pivot view ── */}
          {showPivot && (
            <Card className="shadow-lg border-0 rounded-3 mb-3">
              <CardHeader className="pb-2 border-0 d-flex justify-content-between align-items-center bg-transparent">
                <span className="fw-semibold text-primary">{t("Parcel Sale Analysis Pivot")}</span>
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
                  <ParcelSalePivotReport data={pivotData} />
                )}
              </CardBody>
            </Card>
          )}

          {/* ── Report data card ── */}
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
                      <Button className="btn btn-sm btn-primary rounded-2 px-3" size="sm" type="button" onClick={handleExportExcel}>
                        <i className="ri-file-excel-2-line me-1" />
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

                    {/* ── Table tab ── */}
                    <TabPane tabId="table">
                      <div className="table-responsive report-table-scroll" style={{ maxHeight: "calc(100vh - 380px)", overflowY: "auto" }}>
                        <table className="table table-bordered table-hover align-middle mb-0 text-end par-report-table">
                          <thead>
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
                                    setColFilters((prev) => ({ ...prev, grouping: e.target.value }));
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
                                ["cOGSdollar", "100px"],
                                ["plperOnCOGSAmtdollar", "80px"],
                                ["saleAmtINR", "110px"],
                                ["saleper", "80px"],
                                ["plINR", "110px"],
                                ["inrPLper", "80px"],
                                ["cOGSINR", "110px"],
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
                                      setColFilters((prev) => ({ ...prev, [key]: e.target.value }));
                                      setCurrentPage(1);
                                    }}
                                  />
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {filteredData.length === 0 ? (
                              <tr>
                                <td colSpan={17} className="text-center py-5 text-muted fw-semibold">
                                  <div className="d-flex flex-column align-items-center justify-content-center py-3">
                                    <i className="ri-search-line fs-36 text-muted mb-2 opacity-50"></i>
                                    <span>{t("Data Not Found")}</span>
                                  </div>
                                </td>
                              </tr>
                            ) : (
                              paginatedData.map((row, idx) => (
                                <tr key={idx}>
                                  <td className="text-start"><b>{getGroupingValue(row, activeReportType)}</b></td>
                                  <td>{fmtInt(pick(row, "Pcs", "pcs"))}</td>
                                  <td>{fmtFloat(pick(row, "PcsPer", "pcsPer"))}%</td>
                                  <td>{fmtFloat(pick(row, "Carats", "carats"))}</td>
                                  <td>{fmtFloat(pick(row, "Caratsper", "caratsper"))}%</td>
                                  <td className="cell-bg-sale-pl">{fmtCurrency(pick(row, "SaleAmtdollar", "saleAmtdollar"))}</td>
                                  <td className="cell-bg-sale-pl">{fmtFloat(pick(row, "Saleperdollar", "saleperdollar"))}%</td>
                                  <td>{fmtCurrency(pick(row, "PLdollar", "pLdollar"))}</td>
                                  <td>{fmtFloat(pick(row, "DollarPLper", "dollarPLper"))}%</td>
                                  <td>{fmtCurrency(pick(row, "COGSdollar", "cOGSdollar", "PurCostdollar"))}</td>
                                  <td>{fmtFloat(pick(row, "PLperOnCOGSAmtdollar", "pLperOnCOGSAmtdollar"))}%</td>
                                  <td className="cell-bg-sale-pl">{fmtCurrency(pick(row, "SaleAmtINR", "saleAmtINR"))}</td>
                                  <td className="cell-bg-sale-pl">{fmtFloat(pick(row, "Saleper", "saleper"))}%</td>
                                  <td>{fmtCurrency(pick(row, "PLINR", "pLINR"))}</td>
                                  <td>{fmtFloat(pick(row, "INRPLper", "inrPLper", "iNRPLper"))}%</td>
                                  <td>{fmtCurrency(pick(row, "COGSINR", "cOGSINR", "PurCostINR"))}</td>
                                  <td>{fmtFloat(pick(row, "PLperOnCOGSAmtINR", "pLperOnCOGSAmtINR"))}%</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                          {filteredData.length > 0 && (
                            <tfoot>
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
                                <td>{fmtCurrency(totals.cOGSdollar)}</td>
                                <td>-</td>
                                <td>{fmtCurrency(totals.saleAmtINR)}</td>
                                <td>-</td>
                                <td>{fmtCurrency(totals.plINR)}</td>
                                <td>-</td>
                                <td>{fmtCurrency(totals.cOGSINR)}</td>
                                <td>-</td>
                              </tr>
                            </tfoot>
                          )}
                        </table>
                      </div>

                      {/* Pagination */}
                      {filteredData.length > 0 && (
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
                      )}
                    </TabPane>

                    {/* ── Charts tab ── */}
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

                          <h2 className="text-center mb-3">{t("Parcel Sale Analysis Report")}</h2>
                          <Row className="justify-content-center">
                            {[
                              { id: "parcelSaleCaratPerChart", cd: chartData.caratsPer  },
                              { id: "parcelSaleSaleAmtChart",  cd: chartData.saleAmtPer },
                              { id: "parcelSalePLCOGSChart",   cd: chartData.plCOGSPer  }
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

export default ParcelSaleAnalysisReport;
