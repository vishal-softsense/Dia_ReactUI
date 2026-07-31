import React, { useState, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
  CardHeader,
  FormGroup,
  Label,
  Input,
  Button,
  Nav,
  NavItem,
  NavLink,
  TabContent,
  TabPane,
  Spinner
} from "reactstrap";
import ReactSelect from "react-select";
import classnames from "classnames";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
} from "chart.js";
import { Doughnut, Pie, Bar } from "react-chartjs-2";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import BreadCrumb from "../../Components/Common/BreadCrumb";
import {
  getParcelPurchaseAnalysisReport,
  getParcelPurchaseAnalysisDropdowns,
  getAccGrpMasterDropdowns,
  getAccGrpMasters
} from "../../helpers/fakebackend_helper";
import { useSettingReportDates } from "../../Components/Hooks/useSettingReportDates";
import { exportToExcel } from "../../helpers/excel_helper";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

const Select = (props) => (
  <ReactSelect
    menuPortalTarget={document.body}
    styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }), ...props.styles }}
    {...props}
  />
);

const GROUPING_OPTIONS = [
  { value: "Shape",         label: "Shape" },
  { value: "Size",          label: "Size" },
  { value: "Color",         label: "Color" },
  { value: "Clarity",       label: "Clarity" },
  { value: "Sieve",         label: "Sieve" },
  { value: "PartyLocation", label: "Party Location" },
  { value: "StockID",       label: "StockID" },
  { value: "Month",         label: "Month" }
];

const ParcelPurchaseAnalysis = () => {
  document.title = "Parcel Purchase Analysis | Premium Jewellery ERP";
  const { t } = useTranslation();

  // ── States ──────────────────────────────────────────────────────────────────
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [showFilterPanel, setShowFilterPanel] = useState(true);

  // Dynamic Dropdown Lists from API
  const [dropdownOptions, setDropdownOptions] = useState({
    shapeGroup: [],
    shape: [],
    colorGroup: [],
    color: [],
    size: [],
    sieve: [],
    clarity: [],
    boxnm: [],
    location: [],
    itemGroup: [],
    party: [],
    broker: [],
    currency: []
  });

  const { fromDate: settingFrom, toDate: settingTo, getDates } = useSettingReportDates();

  // Filters
  const [activeReportType, setActiveReportType] = useState("Shape");
  const [fromDate, setFromDate] = useState(settingFrom);
  const [toDate, setToDate] = useState(settingTo);
  const [currency, setCurrency] = useState("");
  const [invNo, setInvNo] = useState("");

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

  const [selectedShapeGroup, setSelectedShapeGroup] = useState([]);
  const [selectedShape, setSelectedShape] = useState([]);
  const [selectedSize, setSelectedSize] = useState([]);
  const [selectedSieve, setSelectedSieve] = useState([]);
  const [selectedColorGroup, setSelectedColorGroup] = useState([]);
  const [selectedColor, setSelectedColor] = useState([]);
  const [selectedClarity, setSelectedClarity] = useState([]);
  const [selectedBoxnm, setSelectedBoxnm] = useState([]);
  const [selectedPartyLocations, setSelectedPartyLocations] = useState([]);
  const [selectedItemGroups, setSelectedItemGroups] = useState([]);
  const [lotNo, setLotNo] = useState("");

  // Table State
  const [searchTerm, setSearchTerm] = useState("");
  const [colFilters, setColFilters] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(500);
  const [activeTab, setActiveTab] = useState("table");

  // Chart State
  const [chartType, setChartType] = useState("doughnut");
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showChartTypeMenu, setShowChartTypeMenu] = useState(false);
  const chartMenusRef = useRef(null);

  // ── Load Dropdowns dynamically from API ──────────────────────────────────────
  useEffect(() => {
    fetchDropdowns();
  }, []);

  useEffect(() => {
    setFromDate(settingFrom);
    setToDate(settingTo);
  }, [settingFrom, settingTo]);

  const fetchDropdowns = async () => {
    try {
      const res = await getParcelPurchaseAnalysisDropdowns();
      let rawData = [];

      if (res?.success || res?.Success) {
        const payload = res.data ?? res.Data;
        if (Array.isArray(payload)) {
          rawData = payload;
        } else if (payload && typeof payload === "object") {
          rawData = payload.data || payload.Data || [];
        }
      } else if (Array.isArray(res)) {
        rawData = res;
      }

      // Helper to filter raw DTO list by Type (case-insensitive)
      const filterByType = (...typeStrs) => {
        const typesLower = typeStrs.map((t) => t.toLowerCase());
        return rawData.filter((x) =>
          typesLower.includes(String(x?.type ?? x?.Type ?? "").toLowerCase())
        );
      };

      // Helper to convert DTO objects into { label, value } options for react-select
      const toOptions = (list) => {
        if (!list || !Array.isArray(list)) return [];
        return list
          .map((item) => {
            if (typeof item === "string" || typeof item === "number") {
              return { label: String(item), value: String(item) };
            }
            const val =
              item.name ??
              item.Name ??
              item.id ??
              item.ID ??
              item.code ??
              item.Code ??
              item.value ??
              item.Value ??
              "";
            const lbl =
              item.name ??
              item.Name ??
              item.label ??
              item.Label ??
              item.code ??
              item.Code ??
              String(val);
            if (!val || String(val).trim() === "") return null;
            return { label: String(lbl), value: String(val) };
          })
          .filter(Boolean);
      };

      // Extract Currency options
      let currencyOpts = toOptions(filterByType("Currency"));
      if (!currencyOpts.length) {
        try {
          const accRes = await getAccGrpMasterDropdowns("currency");
          const accPayload = accRes?.data || accRes?.Data || accRes;
          if (Array.isArray(accPayload) && accPayload.length > 0) {
            currencyOpts = toOptions(accPayload);
          }
        } catch (e) {
          // ignore fallback
        }
      }
      if (!currencyOpts.length) {
        currencyOpts = ["USD", "INR", "EUR", "GBP", "HKD", "AED", "CAD", "AUD"].map((c) => ({
          label: c,
          value: c
        }));
      }

      setDropdownOptions({
        shapeGroup: toOptions(filterByType("ShapeGroup")),
        shape: toOptions(filterByType("Shape")),
        colorGroup: toOptions(filterByType("ColorGroup")),
        color: toOptions(filterByType("Color")),
        size: toOptions(filterByType("Size")),
        sieve: toOptions(filterByType("Sieve")),
        clarity: toOptions(filterByType("Clarity")),
        boxnm: toOptions(filterByType("BoxName", "Boxnm")),
        location: toOptions(filterByType("Location", "PartyLocation", "Country", "City")),
        itemGroup: toOptions(filterByType("ItemGroup")),
        party: toOptions(filterByType("Party", "Supplier", "Customer", "Account")),
        broker: toOptions(filterByType("Broker")),
        currency: currencyOpts
      });
    } catch (err) {
      console.error("Failed to load purchase analysis dropdowns:", err);
      toast.error(t("Failed to load filter dropdown options"));
    }
  };

  // Close chart popover menus on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (chartMenusRef.current && !chartMenusRef.current.contains(e.target)) {
        setShowExportMenu(false);
        setShowChartTypeMenu(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

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

  // ── Execute Search ──────────────────────────────────────────────────────────
  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setSearched(true);
    setShowFilterPanel(false);

    try {
      const payload = {
        FromDate: fromDate || null,
        ToDate: toDate || null,
        Currency: typeof currency === "object" ? currency?.value : currency || null,
        InvNo: invNo || null,
        Party: getSingleOrMultiValue(selectedParty),
        Broker: getSingleOrMultiValue(selectedBroker),
        LotNo: lotNo || null,
        ShapeGroup: selectedShapeGroup.map((x) => x.value),
        Shape: selectedShape.map((x) => x.value),
        Size: selectedSize.map((x) => x.value),
        Sieve: selectedSieve.map((x) => x.value),
        ColorGroup: selectedColorGroup.map((x) => x.value),
        Color: selectedColor.map((x) => x.value),
        Clarity: selectedClarity.map((x) => x.value),
        Boxnm: selectedBoxnm.map((x) => x.value),
        PartyLocation: selectedPartyLocations.map((x) => x.value),
        ItemGroup: selectedItemGroups.map((x) => x.value),
        PurAna: activeReportType
      };

      const res = await getParcelPurchaseAnalysisReport(payload);
      let list = [];
      if (res?.Data) list = res.Data;
      else if (res?.data) list = res.data;
      else if (Array.isArray(res)) list = res;

      setReportData(Array.isArray(list) ? list : []);
      setCurrentPage(1);
    } catch (err) {
      console.error("Error running Parcel Purchase Analysis report:", err);
      toast.error("Failed to fetch report data. Please try again.");
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    const d = await getDates();
    setFromDate(d.fromDate);
    setToDate(d.toDate);
    setCurrency("");
    setInvNo("");
    setSelectedParty(null);
    setPartyInput("");
    setPartyOptions([]);
    setSelectedBroker(null);
    setBrokerInput("");
    setBrokerOptions([]);
    setSelectedShapeGroup([]);
    setSelectedShape([]);
    setSelectedSize([]);
    setSelectedSieve([]);
    setSelectedColorGroup([]);
    setSelectedColor([]);
    setSelectedClarity([]);
    setSelectedBoxnm([]);
    setSelectedPartyLocations([]);
    setSelectedItemGroups([]);
    setLotNo("");
    setReportData([]);
    setSearched(false);
    setSearchTerm("");
    setColFilters({});
    setShowFilterPanel(true);
  };

  // ── Field Pickers & Value Extractors ────────────────────────────────────────
  const pick = (row, ...names) => {
    if (!row) return undefined;
    for (const name of names) {
      if (row[name] !== undefined && row[name] !== null) return row[name];
    }
    return undefined;
  };

  const getGroupingValue = (row, reportType) => {
    if (!row) return "—";
    switch (reportType) {
      case "Shape":
        return row.Shape ?? row.shape ?? row.GroupName ?? row.groupName ?? "—";
      case "Size":
        return row.Size ?? row.size ?? row.GroupName ?? row.groupName ?? "—";
      case "Color":
        return row.Color ?? row.color ?? row.GroupName ?? row.groupName ?? "—";
      case "Clarity":
        return row.Clarity ?? row.clarity ?? row.GroupName ?? row.groupName ?? "—";
      case "Sieve":
        return row.Sieve ?? row.sieve ?? row.GroupName ?? row.groupName ?? "—";
      case "PartyLocation":
      case "Party Location":
      case "Location":
        return row.PartyLocation ?? row.partyLocation ?? row.Location ?? row.location ?? row.GroupName ?? row.groupName ?? "—";
      case "StockID":
        return row.StockID ?? row.stockID ?? row.GroupName ?? row.groupName ?? "—";
      case "Month":
        return row.Month ?? row.month ?? row.GroupName ?? row.groupName ?? "—";
      default:
        return row.GroupName ?? row.groupName ?? row[reportType] ?? "—";
    }
  };

  const fmtInt = (n) => Math.round(Number(n || 0));
  const fmtFloat = (n, d = 2) => Number(n || 0).toFixed(d);
  const fmtCurrency = (n) =>
    Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const rowNum = (row, ...names) => Number(pick(row, ...names) ?? 0);

  // ── Formatted Column Search Strings for Filtering ──────────────────────────
  const ALL_COL_KEYS = [
    "grouping", "pcs", "pcsPer", "carats", "caratsPer",
    "purAmtDollar", "purDollarPer", "purAmtInr", "purInrPer",
    "dollarPerCarat", "baseRate", "inrPerCarat"
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
        return [String(raw), String(fmtInt(raw))];
      }
      case "pcsPer": {
        const raw = pick(row, "PcsPer", "pcsPer");
        if (raw === undefined || raw === null) return [];
        const f = fmtFloat(raw, 4);
        const f2 = fmtFloat(raw, 2);
        return [String(raw), f, `${f}%`, f2, `${f2}%`];
      }
      case "carats": {
        const raw = pick(row, "Carats", "carats");
        if (raw === undefined || raw === null) return [];
        const f = fmtFloat(raw);
        return [String(raw), f];
      }
      case "caratsPer": {
        const raw = pick(row, "CaratsPer", "caratsPer");
        if (raw === undefined || raw === null) return [];
        const f = fmtFloat(raw, 4);
        const f2 = fmtFloat(raw, 2);
        return [String(raw), f, `${f}%`, f2, `${f2}%`];
      }
      case "purAmtDollar": {
        const raw = pick(row, "PurAmtDollar", "purAmtDollar");
        if (raw === undefined || raw === null) return [];
        const f = fmtFloat(raw);
        const c = fmtCurrency(raw);
        return [String(raw), f, c];
      }
      case "purDollarPer": {
        const raw = pick(row, "PurDollarPer", "purDollarPer");
        if (raw === undefined || raw === null) return [];
        const f = fmtFloat(raw, 4);
        const f2 = fmtFloat(raw, 2);
        return [String(raw), f, `${f}%`, f2, `${f2}%`];
      }
      case "purAmtInr": {
        const raw = pick(row, "PurAmtInr", "purAmtInr");
        if (raw === undefined || raw === null) return [];
        const f = fmtFloat(raw);
        const c = fmtCurrency(raw);
        return [String(raw), f, c];
      }
      case "purInrPer": {
        const raw = pick(row, "PurInrPer", "purInrPer");
        if (raw === undefined || raw === null) return [];
        const f = fmtFloat(raw, 4);
        const f2 = fmtFloat(raw, 2);
        return [String(raw), f, `${f}%`, f2, `${f2}%`];
      }
      case "dollarPerCarat": {
        const raw = pick(row, "DollarPerCarat", "dollarPerCarat");
        if (raw === undefined || raw === null) return [];
        const f = fmtFloat(raw);
        const c = fmtCurrency(raw);
        return [String(raw), f, c];
      }
      case "baseRate": {
        const raw = pick(row, "BaseRate", "baseRate");
        if (raw === undefined || raw === null) return [];
        const f = fmtFloat(raw);
        const c = fmtCurrency(raw);
        return [String(raw), f, c];
      }
      case "inrPerCarat": {
        const raw = pick(row, "InrPerCarat", "inrPerCarat");
        if (raw === undefined || raw === null) return [];
        const f = fmtFloat(raw);
        const c = fmtCurrency(raw);
        return [String(raw), f, c];
      }
      default:
        return [];
    }
  };

  // ── Filtered & Paginated Data ───────────────────────────────────────────────
  const filteredData = useMemo(() => {
    let data = reportData;

    // Quick Search across all columns
    if (searchTerm && searchTerm.trim() !== "") {
      const term = searchTerm.trim().toLowerCase();
      data = data.filter((row) =>
        ALL_COL_KEYS.some((colKey) =>
          getColSearchStrings(row, colKey).some((str) => str.toLowerCase().includes(term))
        )
      );
    }

    // Column-wise filters
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

  // ── Footer Totals ──────────────────────────────────────────────────────────
  const totals = useMemo(() => {
    const s = { pcs: 0, carats: 0, purAmtDollar: 0, purAmtInr: 0 };
    filteredData.forEach((row) => {
      s.pcs          += rowNum(row, "Pcs", "pcs");
      s.carats       += rowNum(row, "Carats", "carats");
      s.purAmtDollar += rowNum(row, "PurAmtDollar", "purAmtDollar");
      s.purAmtInr    += rowNum(row, "PurAmtInr", "purAmtInr");
    });
    return s;
  }, [filteredData]);

  // ── Chart Data Preparation ──────────────────────────────────────────────────
  const chartData = useMemo(() => {
    if (!reportData || reportData.length === 0) return null;

    const labels = reportData.map((r) => getGroupingValue(r, activeReportType));
    const caratsPerVals = reportData.map((r) => Number(pick(r, "CaratsPer", "caratsPer") || 0));
    const purDollarPerVals = reportData.map((r) => Number(pick(r, "PurDollarPer", "purDollarPer") || 0));

    const palette = [
      "#FF6384", "#91eded", "#FFCE25", "#4BC0C0", "#9966FF",
      "#FF00FF", "#0000FF", "#75cb7c", "#38A2EB"
    ];

    const makeDataset = (title, vals) => ({
      labels,
      datasets: [
        {
          label: title,
          data: vals,
          backgroundColor: palette.slice(0, labels.length),
          borderColor: "#ffffff",
          borderWidth: chartType === "bar" ? 1 : 2
        }
      ]
    });

    return {
      caratsPer: makeDataset("Carats%", caratsPerVals),
      purDollarPer: makeDataset("Pur $%", purDollarPerVals)
    };
  }, [reportData, activeReportType, chartType]);

  const arrowLinesPlugin = {
    id: "arrowLinesPlugin",
    afterDatasetsDraw(chart) {
      if (chartType === "bar") return;
      const { ctx } = chart;
      const meta = chart.getDatasetMeta(0);
      const dataset = chart.data?.datasets?.[0];
      if (!meta || !dataset || !meta.data) return;

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
        const outerRadius = arc.outerRadius || 100;

        let labelX = centerX + Math.cos(angle) * outerRadius;
        let labelY = centerY + Math.sin(angle) * outerRadius;

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

        const labelText = `${chart.data.labels[index]} - ${dataset.data[index]}%`;
        ctx.fillText(labelText, lineEndX + textOffset, labelY);
      });

      ctx.restore();
    }
  };

  const buildChartConfig = (cd, type) => ({
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 800 },
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: cd.datasets[0].label,
          font: { size: 16, weight: "bold" }
        },
        tooltip: {
          callbacks: {
            label: (item) => ` ${item.label}: ${item.raw}%`
          }
        }
      },
      scales: type === "bar" ? { y: { beginAtZero: true } } : {}
    }
  });

  // ── Chart Export ────────────────────────────────────────────────────────────
  const handleChartExport = (format) => {
    setShowExportMenu(false);
    const canvasIds = ["parcelPurCaratPerChart", "parcelPurSaleAmtChart"];
    const ext = format.includes("jpeg") ? "jpg" : format === "pdf" ? "pdf" : "png";

    const combined = document.createElement("canvas");
    combined.width = 900;
    combined.height = 500;
    const ctx = combined.getContext("2d");

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, combined.width, combined.height);

    ctx.fillStyle = "#000000";
    ctx.font = "bold 20px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Parcel Purchase Analysis Report", 450, 35);

    let offset = 0;
    canvasIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        ctx.drawImage(el, offset, 50, 450, 420);
        offset += 450;
      }
    });

    if (ext === "pdf") {
      const imgData = combined.toDataURL("image/png");
      const w = window.open("");
      if (w) {
        w.document.write(`<img src="${imgData}" style="max-width:100%;"/>`);
        w.print();
      }
    } else {
      const link = document.createElement("a");
      link.download = `ParcelPurchaseAnalysis_Charts.${ext}`;
      link.href = combined.toDataURL(format, 1.0);
      link.click();
    }
  };

  // ── Excel Export ─────────────────────────────────────────────────────────────
  const handleExportExcel = async () => {
    if (!filteredData || filteredData.length === 0) {
      toast.warning("No data available to export");
      return;
    }

    const headers = [
      activeReportType,
      "Pcs",
      "Pcs %",
      "Carats",
      "Carats %",
      "Pur Amt $",
      "Pur $ %",
      "Pur Amt INR",
      "Pur INR %",
      "$ / Carat",
      "Base Rate",
      "INR / Carat"
    ];

    const rows = filteredData.map((row) => [
      getGroupingValue(row, activeReportType),
      fmtInt(pick(row, "Pcs", "pcs")),
      Number(fmtFloat(pick(row, "PcsPer", "pcsPer"), 4)),
      Number(fmtFloat(pick(row, "Carats", "carats"))),
      Number(fmtFloat(pick(row, "CaratsPer", "caratsPer"), 4)),
      Number(fmtFloat(pick(row, "PurAmtDollar", "purAmtDollar"))),
      Number(fmtFloat(pick(row, "PurDollarPer", "purDollarPer"), 4)),
      Number(fmtFloat(pick(row, "PurAmtInr", "purAmtInr"))),
      Number(fmtFloat(pick(row, "PurInrPer", "purInrPer"), 4)),
      Number(fmtFloat(pick(row, "DollarPerCarat", "dollarPerCarat"))),
      Number(fmtFloat(pick(row, "BaseRate", "baseRate"))),
      Number(fmtFloat(pick(row, "InrPerCarat", "inrPerCarat")))
    ]);

    rows.push([
      "Total",
      totals.pcs,
      "-",
      totals.carats,
      "-",
      totals.purAmtDollar,
      "-",
      totals.purAmtInr,
      "-",
      "-",
      "-",
      "-"
    ]);

    const res = await exportToExcel(headers, rows, activeReportType, `${activeReportType}ParcelPurAnalysisReport`);
    if (res?.success) toast.success("Exported to Excel successfully!");
    else toast.error("Excel export failed.");
  };

  return (
    <React.Fragment>
      <style>{`
        .par-chevron-btn {
          background: transparent;
          border: 1px solid var(--vz-border-color, #e9ebec);
          border-radius: 4px;
          padding: 2px 8px;
          cursor: pointer;
          color: var(--vz-body-color, #495057);
          display: flex;
          align-items: center;
          justify-content: center;
          height: 31px;
        }
        .par-chevron-btn:hover {
          background: var(--vz-light, #f3f6f9);
        }
        .par-chart-toolbar {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 16px;
          margin-bottom: 10px;
        }
        .par-chart-icon-btn {
          background: transparent;
          border: none;
          padding: 0;
          font-size: 22px;
          cursor: pointer;
          color: var(--vz-body-color, #333);
        }
        .par-chart-menu {
          display: none;
          position: absolute;
          top: 30px;
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
          <BreadCrumb title={t("Parcel Purchase Analysis Report")} pageTitle={t("Dashboard")} />

          {/* Top Control Bar matching ParcelSaleAnalysisReport.js design */}
          <div className="card d-flex flex-row flex-wrap align-items-center justify-content-between mb-3 p-3 rounded-3 shadow-sm border gap-2">
            <h5 className="mb-0 fw-bold text-primary d-flex align-items-center gap-2">
              <i className="ri-shopping-basket-line fs-20 text-primary"></i>
              {t("Parcel Purchase Analysis Report")}
            </h5>

            <div className="d-flex align-items-center flex-wrap gap-2">
              <div className="d-flex align-items-center gap-2">
                <Label className="mb-0 fw-medium align-self-center">{t("Grouping")}</Label>
                <select
                  className="form-select form-select-sm"
                  style={{ width: 140, height: "31px" }}
                  value={activeReportType}
                  onChange={(e) => setActiveReportType(e.target.value)}
                >
                  {GROUPING_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{t(o.label)}</option>
                  ))}
                </select>
              </div>

              <Button
                color="primary"
                className="btn-sm rounded-2 px-3 py-1"
                onClick={handleSearch}
                disabled={loading}
                type="submit"
              >
                {loading ? <Spinner size="sm" /> : t("Report")}
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

          {/* Search Filters Form Card matching ParcelSaleAnalysisReport.js layout */}
          {showFilterPanel && (
            <Card className="shadow-lg border-0 rounded-3 mb-3">
              <CardBody className="bg-light-subtle py-2">
                <form id="parcel-purchase-analysis-form" onSubmit={handleSearch}>
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
                          value={typeof currency === "object" ? currency?.value || "" : currency}
                          onChange={(e) => setCurrency(e.target.value)}
                        >
                          <option value="">{t("Select Currency")}</option>
                          {dropdownOptions.currency.map((c, idx) => (
                            <option key={idx} value={c.value}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                      </FormGroup>
                    </Col>
                    <Col sm={2}>
                      <FormGroup className="mb-0">
                        <Label className="fw-medium">{t("Invoice No")}</Label>
                        <Input
                          type="text"
                          className="form-control"
                          placeholder={t("InvNo")}
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
                          options={dropdownOptions.shapeGroup}
                          value={selectedShapeGroup}
                          onChange={setSelectedShapeGroup}
                          placeholder={t("ShapeGroup")}
                        />
                      </FormGroup>
                    </Col>
                    <Col sm={2}>
                      <FormGroup className="mb-0">
                        <Label className="fw-medium">{t("Shape")}</Label>
                        <Select
                          isMulti
                          options={dropdownOptions.shape}
                          value={selectedShape}
                          onChange={setSelectedShape}
                          placeholder={t("Shape")}
                        />
                      </FormGroup>
                    </Col>
                    <Col sm={2}>
                      <FormGroup className="mb-0">
                        <Label className="fw-medium">{t("Size")}</Label>
                        <Select
                          isMulti
                          options={dropdownOptions.size}
                          value={selectedSize}
                          onChange={setSelectedSize}
                          placeholder={t("Size")}
                        />
                      </FormGroup>
                    </Col>
                    <Col sm={2}>
                      <FormGroup className="mb-0">
                        <Label className="fw-medium">{t("Sieve")}</Label>
                        <Select
                          isMulti
                          options={dropdownOptions.sieve}
                          value={selectedSieve}
                          onChange={setSelectedSieve}
                          placeholder={t("Sieve")}
                        />
                      </FormGroup>
                    </Col>
                    <Col sm={2}>
                      <FormGroup className="mb-0">
                        <Label className="fw-medium">{t("Color Group")}</Label>
                        <Select
                          isMulti
                          options={dropdownOptions.colorGroup}
                          value={selectedColorGroup}
                          onChange={setSelectedColorGroup}
                          placeholder={t("ColorGroup")}
                        />
                      </FormGroup>
                    </Col>
                    <Col sm={2}>
                      <FormGroup className="mb-0">
                        <Label className="fw-medium">{t("Color")}</Label>
                        <Select
                          isMulti
                          options={dropdownOptions.color}
                          value={selectedColor}
                          onChange={setSelectedColor}
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
                          options={dropdownOptions.clarity}
                          value={selectedClarity}
                          onChange={setSelectedClarity}
                          placeholder={t("Clarity")}
                        />
                      </FormGroup>
                    </Col>
                    <Col sm={2}>
                      <FormGroup className="mb-0">
                        <Label className="fw-medium">{t("Box Name")}</Label>
                        <Select
                          isMulti
                          options={dropdownOptions.boxnm}
                          value={selectedBoxnm}
                          onChange={setSelectedBoxnm}
                          placeholder={t("Boxnm")}
                        />
                      </FormGroup>
                    </Col>
                    <Col sm={2}>
                      <FormGroup className="mb-0">
                        <Label className="fw-medium">{t("Party Location")}</Label>
                        <Select
                          isMulti
                          options={dropdownOptions.location}
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
                          options={dropdownOptions.itemGroup}
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

          {/* ── Report Data Card ── */}
          {searched && (
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
                    {/* ── Table Tab ── */}
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
                              <th>{t("Pur Amt $")}</th>
                              <th>{t("Pur $%")}</th>
                              <th>{t("Pur Amt INR")}</th>
                              <th>{t("Pur INR%")}</th>
                              <th>{t("$ / Carat")}</th>
                              <th>{t("Base Rate")}</th>
                              <th>{t("INR / Carat")}</th>
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
                                ["purAmtDollar", "100px"],
                                ["purDollarPer", "80px"],
                                ["purAmtInr", "110px"],
                                ["purInrPer", "80px"],
                                ["dollarPerCarat", "100px"],
                                ["baseRate", "100px"],
                                ["inrPerCarat", "110px"]
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
                                <td colSpan={12} className="text-center py-5 text-muted fw-semibold">
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
                                  <td>{fmtFloat(pick(row, "PcsPer", "pcsPer"), 4)}%</td>
                                  <td>{fmtFloat(pick(row, "Carats", "carats"))}</td>
                                  <td>{fmtFloat(pick(row, "CaratsPer", "caratsPer"), 4)}%</td>
                                  <td>{fmtCurrency(pick(row, "PurAmtDollar", "purAmtDollar"))}</td>
                                  <td>{fmtFloat(pick(row, "PurDollarPer", "purDollarPer"), 4)}%</td>
                                  <td>{fmtCurrency(pick(row, "PurAmtInr", "purAmtInr"))}</td>
                                  <td>{fmtFloat(pick(row, "PurInrPer", "purInrPer"), 4)}%</td>
                                  <td>{fmtCurrency(pick(row, "DollarPerCarat", "dollarPerCarat"))}</td>
                                  <td>{fmtFloat(pick(row, "BaseRate", "baseRate"))}</td>
                                  <td>{fmtCurrency(pick(row, "InrPerCarat", "inrPerCarat"))}</td>
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
                                <td>{fmtCurrency(totals.purAmtDollar)}</td>
                                <td>-</td>
                                <td>{fmtCurrency(totals.purAmtInr)}</td>
                                <td>-</td>
                                <td>-</td>
                                <td>-</td>
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

                    {/* ── Charts Tab ── */}
                    <TabPane tabId="charts">
                      {!chartData ? (
                        <div className="text-center p-5">
                          <h5 className="text-muted">{t("Data Not Found")}</h5>
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

                          <h2 className="text-center mb-3">{t("Parcel Purchase Analysis Report")}</h2>
                          <Row className="justify-content-center">
                            {[
                              { id: "parcelPurCaratPerChart", cd: chartData.caratsPer },
                              { id: "parcelPurSaleAmtChart",  cd: chartData.purDollarPer }
                            ].map(({ id, cd }) => (
                              <Col key={id} sm={6} md={5}>
                                <div style={{ height: 420 }}>
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

export default ParcelPurchaseAnalysis;
