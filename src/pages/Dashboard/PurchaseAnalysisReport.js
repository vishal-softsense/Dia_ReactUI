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
    styles={{
      menuPortal: (base) => ({ ...base, zIndex: 9999 }),
      ...props.styles
    }}
    {...props}
  />
);

import { toast, ToastContainer } from "react-toastify";
import { Bar, Pie, Doughnut } from "react-chartjs-2";
import classnames from "classnames";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import {
  getPurchaseAnalysisReport,
  getPurchaseAnalysisDropdowns,
  getAccGrpMasters
} from "../../helpers/fakebackend_helper";
import "chart.js/auto";

// MVC palette (PurchaseAnalysisReport.js createChart)
const CHART_COLORS = [
  "#FF6384",
  "#91eded",
  "#FFCE25",
  "#4BC0C0",
  "#9966FF",
  "#FF00FF",
  "#0000FF",
  "#75cb7c",
  "#38A2EB"
];

/** MVC arrowLinesPlugin — external "Abbrev - n%" labels with leader lines (pie/donut only). */
const arrowLinesPlugin = {
  id: "arrowLinesPlugin",
  afterDatasetsDraw(chart) {
    const type = chart.config?.type;
    if (type !== "doughnut" && type !== "pie") return;

    const ctx = chart.ctx;
    const meta = chart.getDatasetMeta(0);
    const dataset = chart.data.datasets[0];
    if (!meta || !dataset) return;

    const isDark =
      document.documentElement.getAttribute("data-layout-mode") === "dark" ||
      document.documentElement.getAttribute("data-bs-theme") === "dark";

    ctx.save();
    ctx.strokeStyle = isDark ? "#adb5bd" : "#777";
    ctx.lineWidth = 1.2;
    ctx.font = "bold 12px Arial";
    ctx.fillStyle = isDark ? "#e9ebec" : "#000";

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
      ctx.moveTo(
        centerX + Math.cos(angle) * outerRadius,
        centerY + Math.sin(angle) * outerRadius
      );
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

const PurchaseAnalysisReport = () => {
  const { t } = useTranslation();

  // Basic Filters State
  const [fromDate, setFromDate] = useState("2025-01-01");
  const [toDate, setToDate] = useState(
    new Date().toISOString().substring(0, 10)
  );
  const [currency, setCurrency] = useState("");
  const [invNo, setInvNo] = useState("");
  const [billNo, setBillNo] = useState("");
  const [type, setType] = useState("");
  const [subType, setSubType] = useState("");
  const [category, setCategory] = useState("");
  const [lotNo, setLotNo] = useState("");
  const [saleRtn, setSaleRtn] = useState(false);
  const [purAna, setPurAna] = useState("Lab");

  // Autocomplete Select Filters
  const [partyInput, setPartyInput] = useState("");
  const [partyOptions, setPartyOptions] = useState([]);
  const [selectedParty, setSelectedParty] = useState(null);
  const [loadingParties, setLoadingParties] = useState(false);

  const [brokerInput, setBrokerInput] = useState("");
  const [brokerOptions, setBrokerOptions] = useState([]);
  const [selectedBroker, setSelectedBroker] = useState(null);
  const [loadingBrokers, setLoadingBrokers] = useState(false);

  const [expPartyInput, setExpPartyInput] = useState("");
  const [expPartyOptions, setExpPartyOptions] = useState([]);
  const [selectedExpParty, setSelectedExpParty] = useState(null);
  const [loadingExpParties, setLoadingExpParties] = useState(false);

  // Multi-select Lists State
  const [selectedShapes, setSelectedShapes] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedClarities, setSelectedClarities] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [selectedProportions, setSelectedProportions] = useState([]);
  const [selectedPolishes, setSelectedPolishes] = useState([]);
  const [selectedSymmetries, setSelectedSymmetries] = useState([]);
  const [selectedLabs, setSelectedLabs] = useState([]);
  const [selectedFluorescences, setSelectedFluorescences] = useState([]);
  const [selectedMilkies, setSelectedMilkies] = useState([]);
  const [selectedLusters, setSelectedLusters] = useState([]);
  const [selectedNatts, setSelectedNatts] = useState([]);
  const [selectedMines, setSelectedMines] = useState([]);
  const [selectedProductTypes, setSelectedProductTypes] = useState([]);
  const [selectedSieves, setSelectedSieves] = useState([]);

  // Dropdown Master Options
  const [dropdownOptions, setDropdownOptions] = useState({
    currency: [],
    type: [],
    subType: [],
    category: [],
    shape: [],
    color: [],
    size: [],
    clarity: [],
    lab: [],
    proportion: [],
    polish: [],
    symmetry: [],
    fluorescence: [],
    milky: [],
    luster: [],
    natts: [],
    mines: [],
    productType: [],
    sieve: []
  });

  // Report Data and UI State
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [searched, setSearched] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(true);
  const [activeReportType, setActiveReportType] = useState("Lab");

  // Pagination & Search in Table
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(500);
  const [searchTerm, setSearchTerm] = useState("");
  const [colFilters, setColFilters] = useState({});

  // Chart Settings
  const [activeTab, setActiveTab] = useState("table");
  const [chartType, setChartType] = useState("doughnut");
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showChartTypeMenu, setShowChartTypeMenu] = useState(false);
  const chartDollarRef = useRef(null);
  const chartInrRef = useRef(null);
  const chartMenusRef = useRef(null);

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
        const response = await getPurchaseAnalysisDropdowns();
        if (response.success || response.Success) {
          const data = response.data || response.Data || {};
          setDropdownOptions({
            currency: data.currency || [],
            type: data.type || [],
            subType: data.subType || [],
            category: data.category || [],
            shape: data.shape || [],
            color: data.color || [],
            size: data.size || [],
            clarity: data.clarity || [],
            lab: data.lab || [],
            proportion: data.proportion || [],
            polish: data.polish || [],
            symmetry: data.symmetry || [],
            fluorescence: data.fluorescence || [],
            milky: data.milky || [],
            luster: data.luster || [],
            natts: data.natts || [],
            mines: data.mines || [],
            productType: data.productType || [],
            sieve: data.sieve || []
          });
        }
      } catch (err) {
        toast.error("Failed to load filter dropdown option lists");
      }
    };
    fetchDropdowns();
  }, []);

  // Autocomplete account group lookup
  const handleAccountSearch = async (term, setOptions, setLoadingState) => {
    if (!term || term.length < 2) {
      setOptions([]);
      return;
    }
    setLoadingState(true);
    try {
      const response = await getAccGrpMasters(term);
      if (response.success || response.Success) {
        const data = response.data || response.Data || [];
        setOptions(
          data.map((item) => ({
            value: item.accGrpCode || item.AccGrpCode,
            label: item.accGrpName || item.AccGrpName
          }))
        );
      }
    } catch (err) {
      console.error("Account search error", err);
    } finally {
      setLoadingState(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      handleAccountSearch(partyInput, setPartyOptions, setLoadingParties);
    }, 400);
    return () => clearTimeout(delayDebounce);
  }, [partyInput]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      handleAccountSearch(brokerInput, setBrokerOptions, setLoadingBrokers);
    }, 400);
    return () => clearTimeout(delayDebounce);
  }, [brokerInput]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      handleAccountSearch(expPartyInput, setExpPartyOptions, setLoadingExpParties);
    }, 400);
    return () => clearTimeout(delayDebounce);
  }, [expPartyInput]);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setSearched(true);
    setCurrentPage(1);

    const mapSelectVal = (list) => {
      if (!list || !list.length) return null;
      const vals = list.map((item) => item.value).filter((v) => v != null && String(v).trim() !== "");
      return vals.length ? vals : null;
    };

    // Match MVC ajax: only send filled filters (null = skipped in PurAnaData)
    const payload = {
      fromDate: fromDate || null,
      toDate: toDate || null,
      currency: currency || null,
      invNo: invNo || null,
      billNo: billNo || null,
      type: type || null,
      subType: subType || null,
      category: category || null,
      party: selectedParty ? String(selectedParty.label || "") : null,
      expParty: selectedExpParty ? String(selectedExpParty.label || "") : null,
      broker: selectedBroker ? String(selectedBroker.label || "") : null,
      saleRtn: saleRtn,
      lotNo: lotNo || null,
      purAna,
      shape: mapSelectVal(selectedShapes),
      color: mapSelectVal(selectedColors),
      clarity: mapSelectVal(selectedClarities),
      size: mapSelectVal(selectedSizes),
      proportion: mapSelectVal(selectedProportions),
      polish: mapSelectVal(selectedPolishes),
      symmetry: mapSelectVal(selectedSymmetries),
      lab: mapSelectVal(selectedLabs),
      fluorescence: mapSelectVal(selectedFluorescences),
      milky: mapSelectVal(selectedMilkies),
      luster: mapSelectVal(selectedLusters),
      natts: mapSelectVal(selectedNatts),
      mines: mapSelectVal(selectedMines),
      productType: mapSelectVal(selectedProductTypes),
      sieve: mapSelectVal(selectedSieves)
    };

    try {
      const response = await getPurchaseAnalysisReport(payload);
      if (response.success || response.Success) {
        const raw = response.data ?? response.Data ?? [];
        const rawList = Array.isArray(raw) ? raw : [];
        setReportData(rawList);
        setActiveReportType(purAna);
        setActiveTab("table");
        setShowFilterPanel(false);
        if (!rawList.length) {
          toast.info(t("No record found matching the configurations"));
        }
      } else {
        toast.error(response.message || response.Message || t("Failed to load report data"));
        setReportData([]);
        setShowFilterPanel(true);
      }
    } catch (err) {
      const msg = typeof err === "string" ? err : err?.message || t("Error generating Purchase Analysis Report");
      toast.error(msg);
      setReportData([]);
      setShowFilterPanel(true);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setFromDate("2024-01-21");
    setToDate(new Date().toISOString().substring(0, 10));
    setCurrency("");
    setInvNo("");
    setBillNo("");
    setType("");
    setSubType("");
    setCategory("");
    setLotNo("");
    setSaleRtn(false);
    setPurAna("Lab");

    setSelectedParty(null);
    setSelectedBroker(null);
    setSelectedExpParty(null);

    setSelectedShapes([]);
    setSelectedColors([]);
    setSelectedClarities([]);
    setSelectedSizes([]);
    setSelectedProportions([]);
    setSelectedPolishes([]);
    setSelectedSymmetries([]);
    setSelectedLabs([]);
    setSelectedFluorescences([]);
    setSelectedMilkies([]);
    setSelectedLusters([]);
    setSelectedNatts([]);
    setSelectedMines([]);
    setSelectedProductTypes([]);
    setSelectedSieves([]);

    setReportData([]);
    setSearched(false);
    setShowFilterPanel(true);
    setCurrentPage(1);
    setSearchTerm("");
    setColFilters({});
  };

  // Case-insensitive field read — ASP.NET camelCase turns INRPLper→iNRPLper, CPS→cPS, etc.
  const pick = (row, ...names) => {
    if (!row) return undefined;
    for (const name of names) {
      if (row[name] !== undefined && row[name] !== null) return row[name];
    }
    const keys = Object.keys(row);
    for (const name of names) {
      const found = keys.find((k) => k.toLowerCase() === String(name).toLowerCase());
      if (found !== undefined && row[found] !== undefined && row[found] !== null) {
        return row[found];
      }
    }
    return undefined;
  };

  // MVC DataTable uses data: PurAna (Lab/Shape/…) as first column key
  const getGroupingValue = (row, field) => {
    if (!row || !field) return "";
    const v = pick(row, field, field.charAt(0).toLowerCase() + field.slice(1));
    if (v === undefined || v === null || v === "") return "";
    return String(v);
  };

  const getColValue = (row, colKey) => {
    switch (colKey) {
      case "grouping":
        return getGroupingValue(row, activeReportType);
      case "purPcs":
        return pick(row, "PurPcs", "purPcs");
      case "purPcsper":
        return pick(row, "PurPcsper", "purPcsper");
      case "purCarats":
        return pick(row, "PurCarats", "purCarats");
      case "purCaratsper":
        return pick(row, "PurCaratsper", "purCaratsper");
      case "purCostdollar":
        return pick(row, "PurCostdollar", "purCostdollar");
      case "soldPcs":
        return pick(row, "SoldPcs", "soldPcs");
      case "soldPcsper":
        return pick(row, "SoldPcsper", "soldPcsper");
      case "soldCarats":
        return pick(row, "SoldCarats", "soldCarats");
      case "soldCaratsper":
        return pick(row, "SoldCaratsper", "soldCaratsper");
      case "saleAmtdollar":
        return pick(row, "SaleAmtdollar", "saleAmtdollar");
      case "saleamtdollerper":
        return pick(row, "Saleamtdollerper", "saleamtdollerper");
      case "costAmtdollar":
        return pick(row, "CostAmtdollar", "costAmtdollar");
      case "salecostamtper":
        return pick(row, "Salecostamtper", "salecostamtper");
      case "soldPLdollar":
        return pick(row, "SoldPLdollar", "soldPLdollar");
      case "soldPLdollarper":
        return pick(row, "SoldPLdollarper", "soldPLdollarper");
      case "pLperOnPurAmtdollar":
        return pick(row, "PLperOnPurAmtdollar", "pLperOnPurAmtdollar");
      case "saleAmtINR":
        return pick(row, "SaleAmtINR", "saleAmtINR");
      case "saleper":
        return pick(row, "Saleper", "saleper");
      case "soldPLINR":
        return pick(row, "SoldPLINR", "soldPLINR");
      case "inrPLper":
        return pick(row, "INRPLper", "inrPLper", "iNRPLper");
      case "purCostINR":
        return pick(row, "PurCostINR", "purCostINR");
      case "pLperOnPurAmtINR":
        return pick(row, "PLperOnPurAmtINR", "pLperOnPurAmtINR");
      case "stockPcs":
        return pick(row, "StockPcs", "stockPcs");
      case "stockPcsper":
        return pick(row, "StockPcsper", "stockPcsper");
      case "stockCarats":
        return pick(row, "StockCarats", "stockCarats");
      case "stockCaratsper":
        return pick(row, "StockCaratsper", "stockCaratsper");
      case "stockAmtdollar":
        return pick(row, "StockAmtdollar", "stockAmtdollar");
      case "stockAmtdollarper":
        return pick(row, "StockAmtdollarper", "stockAmtdollarper");
      case "totPLAmtdollar":
        return pick(row, "TotPLAmtdollar", "totPLAmtdollar");
      case "totalPLdollarper":
        return pick(row, "TotalPLdollarper", "totalPLdollarper");
      default:
        return "";
    }
  };

  // MVC ListBox uses ID for both value and display
  const makeSelectOptions = (arr) =>
    (arr || []).map((x) => ({
      value: x.id ?? x.ID ?? x.name ?? x.Name,
      label: x.id ?? x.ID ?? x.name ?? x.Name
    }));

  const fmtInt = (num) => Math.round(Number(num || 0));
  const fmtFloat = (num) => Number(num || 0).toFixed(2);
  const fmtCurrency = (num) =>
    Number(num || 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

  const rowNum = (row, ...names) => Number(pick(row, ...names) ?? 0);

  // Filter and Paginate Table Data
  const filteredData = useMemo(() => {
    let data = reportData;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      data = data.filter((row) => {
        const gVal = getGroupingValue(row, activeReportType).toLowerCase();
        return (
          gVal.includes(term) ||
          String(pick(row, "PurPcs", "purPcs") ?? "").includes(term) ||
          String(pick(row, "PurCostdollar", "purCostdollar") ?? "").includes(term) ||
          String(pick(row, "SaleAmtdollar", "saleAmtdollar") ?? "").includes(term)
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
    const startIndex = (currentPage - 1) * pageSize;
    return filteredData.slice(startIndex, startIndex + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;

  // Compute footer aggregates on full filtered data set
  const totals = useMemo(() => {
    const sums = {
      purPcs: 0,
      purCarats: 0,
      purCostdollar: 0,
      soldPcs: 0,
      soldCarats: 0,
      saleAmtdollar: 0,
      costAmtdollar: 0,
      soldPLdollar: 0,
      saleAmtINR: 0,
      soldPLINR: 0,
      stockPcs: 0,
      stockCarats: 0,
      stockAmtdollar: 0,
      totPLAmtdollar: 0
    };

    filteredData.forEach((row) => {
      sums.purPcs += rowNum(row, "PurPcs", "purPcs");
      sums.purCarats += rowNum(row, "PurCarats", "purCarats");
      sums.purCostdollar += rowNum(row, "PurCostdollar", "purCostdollar");
      sums.soldPcs += rowNum(row, "SoldPcs", "soldPcs");
      sums.soldCarats += rowNum(row, "SoldCarats", "soldCarats");
      sums.saleAmtdollar += rowNum(row, "SaleAmtdollar", "saleAmtdollar");
      sums.costAmtdollar += rowNum(row, "CostAmtdollar", "costAmtdollar");
      sums.soldPLdollar += rowNum(row, "SoldPLdollar", "soldPLdollar");
      sums.saleAmtINR += rowNum(row, "SaleAmtINR", "saleAmtINR");
      sums.soldPLINR += rowNum(row, "SoldPLINR", "soldPLINR");
      sums.stockPcs += rowNum(row, "StockPcs", "stockPcs");
      sums.stockCarats += rowNum(row, "StockCarats", "stockCarats");
      sums.stockAmtdollar += rowNum(row, "StockAmtdollar", "stockAmtdollar");
      sums.totPLAmtdollar += rowNum(row, "TotPLAmtdollar", "totPLAmtdollar");
    });

    return sums;
  }, [filteredData]);

  // Export report to CSV
  const handleExportCSV = () => {
    const headers = [
      activeReportType,
      "Pur Pcs",
      "Pur Pcs%",
      "Pur Carats",
      "Pur Carats%",
      "Pur Cost $",
      "Sold Pcs",
      "Sold Pcs%",
      "Sold Carats",
      "Sold Carats%",
      "Sale Amt $",
      "Sale%",
      "Cost Amt $",
      "Sale%",
      "Sold PL $",
      "Sold PL $ %",
      "PL % On PurAmt $",
      "Sale Amt INR",
      "Sale%",
      "Sold PL INR",
      "INR PL%",
      "Pur Cost INR",
      "PL % On PurAmt INR",
      "Stock Pcs",
      "Stock Pcs%",
      "Stock Carats",
      "Stock Carats%",
      "Stock Amt $",
      "Stock Amt $ %",
      "Total PL Amt $",
      "Total PL $ %"
    ];

    const rows = filteredData.map((row) => [
      getGroupingValue(row, activeReportType),
      pick(row, "PurPcs", "purPcs") ?? 0,
      pick(row, "PurPcsper", "purPcsper") ?? 0,
      pick(row, "PurCarats", "purCarats") ?? 0,
      pick(row, "PurCaratsper", "purCaratsper") ?? 0,
      pick(row, "PurCostdollar", "purCostdollar") ?? 0,
      pick(row, "SoldPcs", "soldPcs") ?? 0,
      pick(row, "SoldPcsper", "soldPcsper") ?? 0,
      pick(row, "SoldCarats", "soldCarats") ?? 0,
      pick(row, "SoldCaratsper", "soldCaratsper") ?? 0,
      pick(row, "SaleAmtdollar", "saleAmtdollar") ?? 0,
      pick(row, "Saleamtdollerper", "saleamtdollerper") ?? 0,
      pick(row, "CostAmtdollar", "costAmtdollar") ?? 0,
      pick(row, "Salecostamtper", "salecostamtper") ?? 0,
      pick(row, "SoldPLdollar", "soldPLdollar") ?? 0,
      pick(row, "SoldPLdollarper", "soldPLdollarper") ?? 0,
      pick(row, "PLperOnPurAmtdollar", "pLperOnPurAmtdollar") ?? 0,
      pick(row, "SaleAmtINR", "saleAmtINR") ?? 0,
      pick(row, "Saleper", "saleper") ?? 0,
      pick(row, "SoldPLINR", "soldPLINR") ?? 0,
      pick(row, "INRPLper", "inrPLper", "iNRPLper") ?? 0,
      pick(row, "PurCostINR", "purCostINR") ?? 0,
      pick(row, "PLperOnPurAmtINR", "pLperOnPurAmtINR") ?? 0,
      pick(row, "StockPcs", "stockPcs") ?? 0,
      pick(row, "StockPcsper", "stockPcsper") ?? 0,
      pick(row, "StockCarats", "stockCarats") ?? 0,
      pick(row, "StockCaratsper", "stockCaratsper") ?? 0,
      pick(row, "StockAmtdollar", "stockAmtdollar") ?? 0,
      pick(row, "StockAmtdollarper", "stockAmtdollarper") ?? 0,
      pick(row, "TotPLAmtdollar", "totPLAmtdollar") ?? 0,
      pick(row, "TotalPLdollarper", "totalPLdollarper") ?? 0
    ]);

    // Append summary totals row
    rows.push([
      "Total",
      totals.purPcs,
      "",
      totals.purCarats.toFixed(2),
      "",
      totals.purCostdollar.toFixed(2),
      totals.soldPcs,
      "",
      totals.soldCarats.toFixed(2),
      "",
      totals.saleAmtdollar.toFixed(2),
      "",
      totals.costAmtdollar.toFixed(2),
      "",
      totals.soldPLdollar.toFixed(2),
      "",
      "",
      totals.saleAmtINR.toFixed(2),
      "",
      totals.soldPLINR.toFixed(2),
      "",
      "",
      "",
      totals.stockPcs,
      "",
      totals.stockCarats.toFixed(2),
      "",
      totals.stockAmtdollar.toFixed(2),
      "",
      "",
      ""
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.map((val) => `"${val}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Purchase_Analysis_Report_${activeReportType}_${new Date().toISOString().substring(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Charts match MVC: series = % (SoldPLdollarper / INRPLper), default doughnut
  const chartLabels = filteredData.map((row) => getGroupingValue(row, activeReportType) || "Unknown");
  const soldPLDollarAbs = filteredData.map((row) => rowNum(row, "SoldPLdollar", "soldPLdollar"));
  const soldPLDollarPer = filteredData.map((row) => rowNum(row, "SoldPLdollarper", "soldPLdollarper"));
  const soldPLINRAbs = filteredData.map((row) => rowNum(row, "SoldPLINR", "soldPLINR"));
  const soldPLINRPer = filteredData.map((row) =>
    rowNum(row, "INRPLper", "inrPLper", "iNRPLper")
  );

  const makeChartData = (label, datasetValues) => {
    const colors = chartLabels.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]);
    return {
      labels: chartLabels,
      datasets: [
        {
          label: label,
          data: datasetValues,
          backgroundColor: colors,
          borderColor: chartType === "bar" ? colors : "#ffffff",
          borderWidth: chartType === "bar" ? 1 : 2
        }
      ]
    };
  };

  const makeChartOptions = (absValues, isDollar) => {
    const isDark =
      document.documentElement.getAttribute("data-layout-mode") === "dark" ||
      document.documentElement.getAttribute("data-bs-theme") === "dark";
    const tickColor = isDark ? "#adb5bd" : "#495057";
    const gridColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";

    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 1000 },
      layout: {
        padding:
          chartType === "bar"
            ? { top: 16, bottom: 8, left: 8, right: 8 }
            : { top: 36, bottom: 48, left: 72, right: 72 }
      },
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: isDollar ? "SoldPL$" : "SoldPLINR",
          font: { size: 18, weight: "bold" },
          padding: { bottom: 20 },
          color: isDark ? "#e9ebec" : "#212529"
        },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const abs = absValues[ctx.dataIndex] ?? 0;
              return isDollar ? ` $${Number(abs).toFixed(2)}` : ` ${Number(abs).toFixed(2)}`;
            }
          }
        }
      },
      scales:
        chartType === "bar"
          ? {
            x: {
              ticks: {
                autoSkip: false,
                maxRotation: 0,
                minRotation: 0,
                font: { weight: "600", size: 11 },
                color: tickColor
              },
              grid: { display: true, color: gridColor }
            },
            y: {
              beginAtZero: true,
              ticks: { color: tickColor },
              grid: { display: true, color: gridColor }
            }
          }
          : undefined
    };
  };

  const getChartCanvas = (ref) => {
    const inst = ref?.current;
    if (!inst) return null;
    return inst.canvas || inst;
  };

  /** MVC downloadAllChartsCombined — PNG / JPG / PDF of both charts side by side */
  const downloadAllChartsCombined = (format) => {
    setShowExportMenu(false);
    const canvasDollar = getChartCanvas(chartDollarRef);
    const canvasInr = getChartCanvas(chartInrRef);
    if (!canvasDollar || !canvasInr) {
      toast.warning(t("Charts are not ready yet. Open the Charts tab and try again."));
      return;
    }

    const extension = format.includes("jpeg") ? "jpg" : format === "pdf" ? "pdf" : "png";
    const individualWidth = 400;
    const individualHeight = 400;
    const headerHeight = 60;

    const combinedCanvas = document.createElement("canvas");
    combinedCanvas.width = individualWidth * 2;
    combinedCanvas.height = individualHeight + headerHeight;
    const ctx = combinedCanvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, combinedCanvas.width, combinedCanvas.height);
    ctx.fillStyle = "#000000";
    ctx.font = "bold 24px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Purchase Analysis Report", combinedCanvas.width / 2, 40);
    ctx.drawImage(canvasDollar, 0, headerHeight, individualWidth, individualHeight);
    ctx.drawImage(canvasInr, individualWidth, headerHeight, individualWidth, individualHeight);

    if (extension === "pdf") {
      const dataUrl = combinedCanvas.toDataURL("image/png");
      const w = window.open("", "_blank");
      if (!w) {
        toast.error(t("Popup blocked. Allow popups to export PDF."));
        return;
      }
      w.document.write(`<!DOCTYPE html><html><head><title>Purchase Analysis Report</title>
        <style>@page{size:landscape;margin:12mm}body{margin:0;text-align:center;background:#fff}
        img{max-width:100%;height:auto}</style></head><body>
        <img src="${dataUrl}" alt="Purchase Analysis Report"/>
        <script>window.onload=function(){setTimeout(function(){window.print();},200);}</script>
        </body></html>`);
      w.document.close();
      return;
    }

    const mime = extension === "jpg" ? "image/jpeg" : "image/png";
    const link = document.createElement("a");
    link.href = combinedCanvas.toDataURL(mime, 1.0);
    link.download = `PurchaseAnalysis_Charts.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderAnalysisChart = (title, perValues, absValues, isDollar, chartRef) => {
    const data = makeChartData(title, perValues);
    const options = makeChartOptions(absValues, isDollar);
    const plugins = chartType === "bar" ? [] : [arrowLinesPlugin];
    if (chartType === "bar") {
      return <Bar ref={chartRef} data={data} options={options} />;
    }
    if (chartType === "pie") {
      return <Pie ref={chartRef} data={data} options={options} plugins={plugins} />;
    }
    return <Doughnut ref={chartRef} data={data} options={options} plugins={plugins} />;
  };

  document.title = `${t("Purchase Analysis Report")} | ${t("Admin")}`;

  return (
    <React.Fragment>
      <style>{`
        [data-layout-mode="dark"] .glass-card,
        [data-bs-theme="dark"] .glass-card {
          background-color: rgba(30, 31, 37, 0.8) !important;
          border-color: #2b2c32 !important;
        }
        .glass-card {
          border-radius: 12px;
          border: 1px solid rgba(224, 224, 224, 0.4);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
          backdrop-filter: blur(10px);
          transition: all 0.3s ease;
        }
        .header-bg-pur {
          background-color: rgb(204, 255, 255) !important;
          color: #222 !important;
        }
        .header-bg-sold {
          background-color: rgb(255, 204, 153) !important;
          color: #222 !important;
        }
        .header-bg-sale-pl {
          background-color: rgb(204, 204, 255) !important;
          color: #222 !important;
        }
        .cell-bg-pur {
          background-color: rgb(240, 255, 255) !important;
        }
        .cell-bg-sold {
          background-color: rgb(255, 245, 230) !important;
        }
        .cell-bg-sale-pl {
          background-color: rgb(240, 240, 255) !important;
        }
        [data-layout-mode="dark"] .header-bg-pur,
        [data-bs-theme="dark"] .header-bg-pur {
          background-color: rgba(64, 192, 192, 0.35) !important;
          color: #e9ebec !important;
        }
        [data-layout-mode="dark"] .header-bg-sold,
        [data-bs-theme="dark"] .header-bg-sold {
          background-color: rgba(255, 160, 80, 0.3) !important;
          color: #e9ebec !important;
        }
        [data-layout-mode="dark"] .header-bg-sale-pl,
        [data-bs-theme="dark"] .header-bg-sale-pl {
          background-color: rgba(140, 140, 220, 0.3) !important;
          color: #e9ebec !important;
        }
        [data-layout-mode="dark"] .cell-bg-pur,
        [data-bs-theme="dark"] .cell-bg-pur {
          background-color: rgba(64, 192, 192, 0.12) !important;
        }
        [data-layout-mode="dark"] .cell-bg-sold,
        [data-bs-theme="dark"] .cell-bg-sold {
          background-color: rgba(255, 160, 80, 0.1) !important;
        }
        [data-layout-mode="dark"] .cell-bg-sale-pl,
        [data-bs-theme="dark"] .cell-bg-sale-pl {
          background-color: rgba(140, 140, 220, 0.1) !important;
        }
        [data-layout-mode="dark"] .report-table-scroll .table,
        [data-bs-theme="dark"] .report-table-scroll .table {
          --bs-table-bg: transparent;
          --bs-table-color: #e9ebec;
          --bs-table-border-color: #32383e;
        }
        [data-layout-mode="dark"] .report-table-scroll .table-light,
        [data-bs-theme="dark"] .report-table-scroll .table-light {
          --bs-table-bg: #2a2d36;
          --bs-table-color: #e9ebec;
        }
        .report-table-scroll th {
          font-weight: 600;
          font-size: 12px;
          white-space: nowrap;
          padding: 8px 10px !important;
        }
        .report-table-scroll td {
          font-size: 13px;
          white-space: nowrap;
          padding: 8px 10px !important;
        }
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
        /* Visible outline buttons in light + dark (MVC btn-outline-primary) */
        .par-header-btn {
          border: 1px solid var(--vz-primary, #405189) !important;
          color: var(--vz-primary, #405189) !important;
          background: transparent !important;
          font-weight: 500;
        }
        .par-header-btn:hover,
        .par-header-btn:focus {
          background: var(--vz-primary, #405189) !important;
          color: #fff !important;
        }
        [data-layout-mode="dark"] .par-header-btn,
        [data-bs-theme="dark"] .par-header-btn {
          border-color: #a3a8c3 !important;
          color: #c5c9db !important;
        }
        [data-layout-mode="dark"] .par-header-btn:hover,
        [data-bs-theme="dark"] .par-header-btn:hover {
          background: #405189 !important;
          border-color: #405189 !important;
          color: #fff !important;
        }
        .multi-select-row .form-group {
          margin-bottom: 12px;
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
        .par-chart-title {
          text-align: center;
          font-size: 1.5rem;
          font-weight: 600;
          margin: 8px 0 16px;
          color: var(--vz-body-color, #212529);
        }
        .par-chart-canvas-wrap {
          height: 460px;
          position: relative;
        }
      `}</style>
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title={t("Purchase Analysis Report")} pageTitle={t("Dashboard")} />

          {/* Top Control Bar */}
          <div className="card d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between mb-3 p-3 rounded-3 shadow-sm border gap-3">
            <h5 className="mb-0 fw-bold text-primary d-flex align-items-center gap-2">
              <i className="ri-shopping-bag-3-line fs-20 text-primary"></i>
              {t("Purchase Analysis Report")}
            </h5>

            <div className="d-flex align-items-center flex-wrap gap-2">
              <div className="d-flex align-items-center gap-2">
                <Label className="mb-0 fw-medium align-self-center">{t("Grouping")}</Label>
                <select
                  className="form-select form-select-sm"
                  style={{ minWidth: 160, height: "31px" }}
                  value={purAna}
                  onChange={(e) => setPurAna(e.target.value)}
                >
                  <option value="Lab">{t("Lab")}</option>
                  <option value="Shape">{t("Shape")}</option>
                  <option value="Size">{t("Size")}</option>
                  <option value="Color">{t("Color")}</option>
                  <option value="Clarity">{t("Clarity")}</option>
                  <option value="Prop">{t("Prop")}</option>
                  <option value="Polish">{t("Polish")}</option>
                  <option value="Symmetry">{t("Symmetry")}</option>
                  <option value="CPS">{t("CPS")}</option>
                  <option value="Fluorescence">{t("Flou.")}</option>
                  <option value="Series">{t("Series")}</option>
                  <option value="Location">{t("Location")}</option>
                  <option value="PartyLocation">{t("Party Location")}</option>
                  <option value="YearMonth">{t("Purchase Year-Month")}</option>
                  <option value="Aging">{t("Aging")}</option>
                  <option value="PriceRevision">{t("Price Revision")}</option>
                  <option value="StockID">{t("StockID")}</option>
                </select>
              </div>

              <Button
                color="primary"
                className="btn-sm rounded-2 px-3 py-1"
                type="submit"
                form="purchase-analysis-form"
                disabled={loading}
              >
                {loading ? <Spinner size="sm" /> : t("Report")}
              </Button>

              <Button
                color="soft-secondary"
                className="btn-sm rounded-2 px-3 py-1"
                type="button"
                onClick={handleClear}
              >
                {t("Clear")}
              </Button>

              <button
                type="button"
                className="par-chevron-btn"
                title={t("Toggle Filters")}
                onClick={() => setShowFilterPanel(!showFilterPanel)}
                aria-label={t("Toggle Filters")}
              >
                <i className={showFilterPanel ? "ri-arrow-up-s-line" : "ri-arrow-down-s-line"} />
              </button>
            </div>
          </div>

          {showFilterPanel && (
            <Card className="shadow-lg border-0 rounded-3 mb-3">
              <CardBody className="bg-light-subtle py-2">
                <form id="purchase-analysis-form" onSubmit={handleSearch}>
                  {/* MVC layout: left filters + right Lot No textarea */}
                  <Row className="g-2">
                    <Col md={10}>
                      <Row className="g-2">
                        <Col sm={2}>
                          <FormGroup>
                            <Label className="fw-medium">{t("Date")}</Label>
                            <input
                              type="date"
                              className="form-control form-control-sm"
                              style={{ height: "35px" }}
                              value={fromDate}
                              onChange={(e) => setFromDate(e.target.value)}
                            />
                          </FormGroup>
                        </Col>
                        <Col sm={2}>
                          <FormGroup>
                            <Label className="fw-medium">{t("To Date")}</Label>
                            <input
                              type="date"
                              className="form-control form-control-sm"
                              style={{ height: "35px" }}
                              value={toDate}
                              onChange={(e) => setToDate(e.target.value)}
                            />
                          </FormGroup>
                        </Col>
                        <Col sm={2}>
                          <FormGroup>
                            <Label className="fw-medium">{t("Currency")}</Label>
                            <select className="form-select" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                              <option value="">{t("Select Currency")}</option>
                              {dropdownOptions.currency.map((c) => (
                                <option key={c.id ?? c.ID} value={c.id ?? c.ID}>{c.name ?? c.Name}</option>
                              ))}
                            </select>
                          </FormGroup>
                        </Col>
                        <Col sm={2}>
                          <FormGroup>
                            <Label className="fw-medium">{t("Invoice No")}</Label>
                            <Input type="text" placeholder={t("Invoice Number")} value={invNo} onChange={(e) => setInvNo(e.target.value)} />
                          </FormGroup>
                        </Col>
                        <Col sm={2}>
                          <FormGroup>
                            <Label className="fw-medium">{t("Bill No")}</Label>
                            <Input type="text" placeholder={t("Bill No")} value={billNo} onChange={(e) => setBillNo(e.target.value)} />
                          </FormGroup>
                        </Col>
                        <Col sm={2}>
                          <FormGroup>
                            <Label className="fw-medium">{t("Type")}</Label>
                            <select className="form-select" value={type} onChange={(e) => setType(e.target.value)}>
                              <option value="">{t("Select Type")}</option>
                              {dropdownOptions.type.map((tItem) => (
                                <option key={tItem.name ?? tItem.Name} value={tItem.name ?? tItem.Name}>{tItem.name ?? tItem.Name}</option>
                              ))}
                            </select>
                          </FormGroup>
                        </Col>
                      </Row>
                      <Row className="g-2">
                        <Col sm={2}>
                          <FormGroup>
                            <Label className="fw-medium">{t("SubType")}</Label>
                            <select className="form-select" value={subType} onChange={(e) => setSubType(e.target.value)}>
                              <option value="">{t("Select SubType")}</option>
                              {dropdownOptions.subType.map((st) => (
                                <option key={st.name ?? st.Name} value={st.name ?? st.Name}>{st.name ?? st.Name}</option>
                              ))}
                            </select>
                          </FormGroup>
                        </Col>
                        <Col sm={2}>
                          <FormGroup>
                            <Label className="fw-medium">{t("Category")}</Label>
                            <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                              <option value="">{t("Select Category")}</option>
                              {dropdownOptions.category.map((cat) => (
                                <option key={cat.name ?? cat.Name} value={cat.name ?? cat.Name}>{cat.name ?? cat.Name}</option>
                              ))}
                            </select>
                          </FormGroup>
                        </Col>
                        <Col sm={2}>
                          <FormGroup>
                            <Label className="fw-medium">{t("Party")}</Label>
                            <Select isClearable isLoading={loadingParties} options={partyOptions} value={selectedParty} onInputChange={(val) => setPartyInput(val)} onChange={setSelectedParty} placeholder={t("Search Party")} />
                          </FormGroup>
                        </Col>
                        <Col sm={2}>
                          <FormGroup>
                            <Label className="fw-medium">{t("Broker")}</Label>
                            <Select isClearable isLoading={loadingBrokers} options={brokerOptions} value={selectedBroker} onInputChange={(val) => setBrokerInput(val)} onChange={setSelectedBroker} placeholder={t("Search Broker")} />
                          </FormGroup>
                        </Col>
                        <Col sm={2}>
                          <FormGroup className="mb-0">
                            <Label className="invisible">.</Label>
                            <div className="d-flex align-items-center" style={{ height: "38px" }}>
                              <div className="form-check">
                                <Input type="checkbox" id="saleRtn" checked={saleRtn} className="form-check-input" onChange={(e) => setSaleRtn(e.target.checked)} />
                                <Label check htmlFor="saleRtn" className="form-check-label mb-0">{t("Sale Return")}</Label>
                              </div>
                            </div>
                          </FormGroup>
                        </Col>
                      </Row>
                    </Col>
                    <Col md={2}>
                      <FormGroup>
                        <Label className="fw-medium">{t("Enter Lot No")}</Label>
                        <Input type="textarea" rows="7" placeholder="Search by lot no" value={lotNo} onChange={(e) => setLotNo(e.target.value)} />
                      </FormGroup>
                    </Col>
                  </Row>

                  {/* MVC attribute rows: Shape→Polish | Symmetry→Natts | Mines→Exp Party */}
                  <Row className="g-2 multi-select-row mt-1">
                    <Col sm={2}><FormGroup><Label>{t("Shape")}</Label><Select isMulti options={makeSelectOptions(dropdownOptions.shape)} value={selectedShapes} onChange={setSelectedShapes} placeholder={t("Shape")} /></FormGroup></Col>
                    <Col sm={2}><FormGroup><Label>{t("Color")}</Label><Select isMulti options={makeSelectOptions(dropdownOptions.color)} value={selectedColors} onChange={setSelectedColors} placeholder={t("Color")} /></FormGroup></Col>
                    <Col sm={2}><FormGroup><Label>{t("Clarity")}</Label><Select isMulti options={makeSelectOptions(dropdownOptions.clarity)} value={selectedClarities} onChange={setSelectedClarities} placeholder={t("Clarity")} /></FormGroup></Col>
                    <Col sm={2}><FormGroup><Label>{t("Size")}</Label><Select isMulti options={makeSelectOptions(dropdownOptions.size)} value={selectedSizes} onChange={setSelectedSizes} placeholder={t("Size")} /></FormGroup></Col>
                    <Col sm={2}><FormGroup><Label>{t("Proportion")}</Label><Select isMulti options={makeSelectOptions(dropdownOptions.proportion)} value={selectedProportions} onChange={setSelectedProportions} placeholder={t("Proportion")} /></FormGroup></Col>
                    <Col sm={2}><FormGroup><Label>{t("Polish")}</Label><Select isMulti options={makeSelectOptions(dropdownOptions.polish)} value={selectedPolishes} onChange={setSelectedPolishes} placeholder={t("Polish")} /></FormGroup></Col>
                  </Row>
                  <Row className="g-2 multi-select-row">
                    <Col sm={2}><FormGroup><Label>{t("Symmetry")}</Label><Select isMulti options={makeSelectOptions(dropdownOptions.symmetry)} value={selectedSymmetries} onChange={setSelectedSymmetries} placeholder={t("Symmetry")} /></FormGroup></Col>
                    <Col sm={2}><FormGroup><Label>{t("Lab")}</Label><Select isMulti options={makeSelectOptions(dropdownOptions.lab)} value={selectedLabs} onChange={setSelectedLabs} placeholder={t("LAB")} /></FormGroup></Col>
                    <Col sm={2}><FormGroup><Label>{t("Fluorescence")}</Label><Select isMulti options={makeSelectOptions(dropdownOptions.fluorescence)} value={selectedFluorescences} onChange={setSelectedFluorescences} placeholder={t("Fluorescence")} /></FormGroup></Col>
                    <Col sm={2}><FormGroup><Label>{t("Milky")}</Label><Select isMulti options={makeSelectOptions(dropdownOptions.milky)} value={selectedMilkies} onChange={setSelectedMilkies} placeholder={t("Milky")} /></FormGroup></Col>
                    <Col sm={2}><FormGroup><Label>{t("Luster")}</Label><Select isMulti options={makeSelectOptions(dropdownOptions.luster)} value={selectedLusters} onChange={setSelectedLusters} placeholder={t("Luster")} /></FormGroup></Col>
                    <Col sm={2}><FormGroup><Label>{t("Natts")}</Label><Select isMulti options={makeSelectOptions(dropdownOptions.natts)} value={selectedNatts} onChange={setSelectedNatts} placeholder={t("Natts")} /></FormGroup></Col>
                  </Row>
                  <Row className="g-2 multi-select-row">
                    <Col sm={2}><FormGroup><Label>{t("Mines")}</Label><Select isMulti options={makeSelectOptions(dropdownOptions.mines)} value={selectedMines} onChange={setSelectedMines} placeholder={t("Mines")} /></FormGroup></Col>
                    <Col sm={2}><FormGroup><Label>{t("ProductType")}</Label><Select isMulti options={makeSelectOptions(dropdownOptions.productType)} value={selectedProductTypes} onChange={setSelectedProductTypes} placeholder={t("ProductType")} /></FormGroup></Col>
                    <Col sm={2}><FormGroup><Label>{t("Sieve")}</Label><Select isMulti options={makeSelectOptions(dropdownOptions.sieve)} value={selectedSieves} onChange={setSelectedSieves} placeholder={t("Sieve")} /></FormGroup></Col>
                    <Col sm={2}>
                      <FormGroup>
                        <Label className="fw-medium">{t("Exp Party")}</Label>
                        <Select isClearable isLoading={loadingExpParties} options={expPartyOptions} value={selectedExpParty} onInputChange={(val) => setExpPartyInput(val)} onChange={setSelectedExpParty} placeholder={t("Search Export Party")} />
                      </FormGroup>
                    </Col>
                  </Row>
                </form>
              </CardBody>
            </Card>
          )}

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
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                      }}
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
                        <div>
                          <div className="table-responsive report-table-scroll" style={{ maxHeight: "calc(100vh - 380px)", overflowY: "auto" }}>
                            <table className="table table-bordered table-hover align-middle mb-0 text-end">
                              <thead className="table-light sticky-top">
                                <tr>
                                  <th className="text-start">{activeReportType}</th>
                                  <th className="header-bg-pur">{t("Pur Pcs")}</th>
                                  <th className="header-bg-pur">{t("Pur Pcs%")}</th>
                                  <th className="header-bg-pur">{t("Pur Carats")}</th>
                                  <th className="header-bg-pur">{t("Pur Carats%")}</th>
                                  <th className="header-bg-pur">{t("Pur Cost $")}</th>
                                  <th className="header-bg-sold">{t("Sold Pcs")}</th>
                                  <th className="header-bg-sold">{t("Sold Pcs%")}</th>
                                  <th className="header-bg-sold">{t("Sold Carats")}</th>
                                  <th className="header-bg-sold">{t("Sold Carats%")}</th>
                                  <th className="header-bg-sale-pl">{t("Sale Amt $")}</th>
                                  <th className="header-bg-sale-pl">{t("Sale%")}</th>
                                  <th>{t("Cost Amt $")}</th>
                                  <th className="header-bg-sale-pl">{t("Sale%")}</th>
                                  <th>{t("Sold PL $")}</th>
                                  <th>{t("Sold PL $ %")}</th>
                                  <th className="header-bg-pur">{t("PL % On PurAmt $")}</th>
                                  <th className="header-bg-sale-pl">{t("Sale Amt INR")}</th>
                                  <th className="header-bg-sale-pl">{t("Sale%")}</th>
                                  <th>{t("Sold PL INR")}</th>
                                  <th>{t("INR PL%")}</th>
                                  <th className="header-bg-pur">{t("Pur Cost INR")}</th>
                                  <th className="header-bg-pur">{t("PL % On PurAmt INR")}</th>
                                  <th>{t("Stock Pcs")}</th>
                                  <th>{t("Stock Pcs%")}</th>
                                  <th>{t("Stock Carats")}</th>
                                  <th>{t("Stock Carats%")}</th>
                                  <th>{t("Stock Amt $")}</th>
                                  <th>{t("Stock Amt $ %")}</th>
                                  <th>{t("Total PL Amt $")}</th>
                                  <th>{t("Total PL $ %")}</th>
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
                                    ["purPcs", "80px"],
                                    ["purPcsper", "80px"],
                                    ["purCarats", "80px"],
                                    ["purCaratsper", "80px"],
                                    ["purCostdollar", "100px"],
                                    ["soldPcs", "80px"],
                                    ["soldPcsper", "80px"],
                                    ["soldCarats", "80px"],
                                    ["soldCaratsper", "80px"],
                                    ["saleAmtdollar", "100px"],
                                    ["saleamtdollerper", "80px"],
                                    ["costAmtdollar", "100px"],
                                    ["salecostamtper", "80px"],
                                    ["soldPLdollar", "100px"],
                                    ["soldPLdollarper", "80px"],
                                    ["pLperOnPurAmtdollar", "80px"],
                                    ["saleAmtINR", "110px"],
                                    ["saleper", "80px"],
                                    ["soldPLINR", "110px"],
                                    ["inrPLper", "80px"],
                                    ["purCostINR", "110px"],
                                    ["pLperOnPurAmtINR", "80px"],
                                    ["stockPcs", "80px"],
                                    ["stockPcsper", "80px"],
                                    ["stockCarats", "80px"],
                                    ["stockCaratsper", "80px"],
                                    ["stockAmtdollar", "100px"],
                                    ["stockAmtdollarper", "80px"],
                                    ["totPLAmtdollar", "100px"],
                                    ["totalPLdollarper", "80px"]
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
                                    <td className="text-start cell-bg-pur">
                                      <b>{getGroupingValue(row, activeReportType)}</b>
                                    </td>
                                    <td className="cell-bg-pur">{fmtInt(pick(row, "PurPcs", "purPcs"))}</td>
                                    <td className="cell-bg-pur">{fmtFloat(pick(row, "PurPcsper", "purPcsper"))}%</td>
                                    <td className="cell-bg-pur">{fmtFloat(pick(row, "PurCarats", "purCarats"))}</td>
                                    <td className="cell-bg-pur">{fmtFloat(pick(row, "PurCaratsper", "purCaratsper"))}%</td>
                                    <td className="cell-bg-pur">{fmtCurrency(pick(row, "PurCostdollar", "purCostdollar"))}</td>
                                    <td className="cell-bg-sold">{fmtInt(pick(row, "SoldPcs", "soldPcs"))}</td>
                                    <td className="cell-bg-sold">{fmtFloat(pick(row, "SoldPcsper", "soldPcsper"))}%</td>
                                    <td className="cell-bg-sold">{fmtFloat(pick(row, "SoldCarats", "soldCarats"))}</td>
                                    <td className="cell-bg-sold">{fmtFloat(pick(row, "SoldCaratsper", "soldCaratsper"))}%</td>
                                    <td className="cell-bg-sale-pl">{fmtCurrency(pick(row, "SaleAmtdollar", "saleAmtdollar"))}</td>
                                    <td className="cell-bg-sale-pl">{fmtFloat(pick(row, "Saleamtdollerper", "saleamtdollerper"))}%</td>
                                    <td>{fmtCurrency(pick(row, "CostAmtdollar", "costAmtdollar"))}</td>
                                    <td className="cell-bg-sale-pl">{fmtFloat(pick(row, "Salecostamtper", "salecostamtper"))}%</td>
                                    <td>{fmtCurrency(pick(row, "SoldPLdollar", "soldPLdollar"))}</td>
                                    <td>{fmtFloat(pick(row, "SoldPLdollarper", "soldPLdollarper"))}%</td>
                                    <td className="cell-bg-pur">{fmtFloat(pick(row, "PLperOnPurAmtdollar", "pLperOnPurAmtdollar"))}%</td>
                                    <td className="cell-bg-sale-pl">{fmtCurrency(pick(row, "SaleAmtINR", "saleAmtINR"))}</td>
                                    <td className="cell-bg-sale-pl">{fmtFloat(pick(row, "Saleper", "saleper"))}%</td>
                                    <td>{fmtCurrency(pick(row, "SoldPLINR", "soldPLINR"))}</td>
                                    <td>{fmtFloat(pick(row, "INRPLper", "inrPLper", "iNRPLper"))}%</td>
                                    <td className="cell-bg-pur">{fmtCurrency(pick(row, "PurCostINR", "purCostINR"))}</td>
                                    <td className="cell-bg-pur">{fmtFloat(pick(row, "PLperOnPurAmtINR", "pLperOnPurAmtINR"))}%</td>
                                    <td>{fmtInt(pick(row, "StockPcs", "stockPcs"))}</td>
                                    <td>{fmtFloat(pick(row, "StockPcsper", "stockPcsper"))}%</td>
                                    <td>{fmtFloat(pick(row, "StockCarats", "stockCarats"))}</td>
                                    <td>{fmtFloat(pick(row, "StockCaratsper", "stockCaratsper"))}%</td>
                                    <td>{fmtCurrency(pick(row, "StockAmtdollar", "stockAmtdollar"))}</td>
                                    <td>{fmtFloat(pick(row, "StockAmtdollarper", "stockAmtdollarper"))}%</td>
                                    <td>{fmtCurrency(pick(row, "TotPLAmtdollar", "totPLAmtdollar"))}</td>
                                    <td>{fmtFloat(pick(row, "TotalPLdollarper", "totalPLdollarper"))}%</td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot className="table-light fw-semibold">
                                <tr>
                                  <td className="text-start">{t("Total")}</td>
                                  <td>{fmtInt(totals.purPcs)}</td>
                                  <td>-</td>
                                  <td>{fmtFloat(totals.purCarats)}</td>
                                  <td>-</td>
                                  <td>{fmtCurrency(totals.purCostdollar)}</td>
                                  <td>{fmtInt(totals.soldPcs)}</td>
                                  <td>-</td>
                                  <td>{fmtFloat(totals.soldCarats)}</td>
                                  <td>-</td>
                                  <td>{fmtCurrency(totals.saleAmtdollar)}</td>
                                  <td>-</td>
                                  <td>{fmtCurrency(totals.costAmtdollar)}</td>
                                  <td>-</td>
                                  <td>{fmtCurrency(totals.soldPLdollar)}</td>
                                  <td>-</td>
                                  <td>-</td>
                                  <td>{fmtCurrency(totals.saleAmtINR)}</td>
                                  <td>-</td>
                                  <td>{fmtCurrency(totals.soldPLINR)}</td>
                                  <td>-</td>
                                  <td>-</td>
                                  <td>-</td>
                                  <td>{fmtInt(totals.stockPcs)}</td>
                                  <td>-</td>
                                  <td>{fmtFloat(totals.stockCarats)}</td>
                                  <td>-</td>
                                  <td>{fmtCurrency(totals.stockAmtdollar)}</td>
                                  <td>-</td>
                                  <td>{fmtCurrency(totals.totPLAmtdollar)}</td>
                                  <td>-</td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>

                          <div className="d-flex align-items-center justify-content-between mt-3">
                            <div className="d-flex align-items-center gap-2">
                              <span className="small text-muted">{t("Rows per page")}:</span>
                              <select
                                className="form-select form-select-sm"
                                style={{ width: 80 }}
                                value={pageSize}
                                onChange={(e) => {
                                  setPageSize(Number(e.target.value));
                                  setCurrentPage(1);
                                }}
                              >
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                                <option value={500}>500</option>
                              </select>
                              <span className="small text-muted ms-2">
                                {t("Showing")} {(currentPage - 1) * pageSize + 1} {t("to")}{" "}
                                {Math.min(currentPage * pageSize, filteredData.length)} {t("of")}{" "}
                                {filteredData.length} {t("entries")}
                              </span>
                            </div>

                            <div className="d-flex align-items-center gap-1">
                              <Button
                                color="light"
                                size="sm"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage((c) => c - 1)}
                              >
                                {t("Previous")}
                              </Button>
                              <span className="mx-2 small fw-semibold">
                                {currentPage} / {totalPages}
                              </span>
                              <Button
                                color="light"
                                size="sm"
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage((c) => c + 1)}
                              >
                                {t("Next")}
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </TabPane>

                    <TabPane tabId="charts">
                      {filteredData.length === 0 ? (
                        <div className="text-center p-5">
                          <h5 className="text-muted">{t("No record found matching the configurations")}</h5>
                        </div>
                      ) : (
                        <div className="chart-disp">
                          <div className="par-chart-toolbar" ref={chartMenusRef}>
                            <div className="par-chart-menu-wrap">
                              <button
                                type="button"
                                className="par-chart-icon-btn"
                                title={t("Download")}
                                aria-label={t("Download")}
                                onClick={() => {
                                  setShowExportMenu((v) => !v);
                                  setShowChartTypeMenu(false);
                                }}
                              >
                                <i className="ri-download-2-line" />
                              </button>
                              <div className={classnames("par-chart-menu", { show: showExportMenu })}>
                                <a
                                  href="#png"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    downloadAllChartsCombined("image/png");
                                  }}
                                >
                                  <i className="ri-image-line" />
                                  <span>PNG</span>
                                </a>
                                <a
                                  href="#jpg"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    downloadAllChartsCombined("image/jpeg");
                                  }}
                                >
                                  <i className="ri-file-image-line" />
                                  <span>JPG</span>
                                </a>
                                <a
                                  href="#pdf"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    downloadAllChartsCombined("pdf");
                                  }}
                                >
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
                                onClick={() => {
                                  setShowChartTypeMenu((v) => !v);
                                  setShowExportMenu(false);
                                }}
                              >
                                <i className="ri-menu-line" />
                              </button>
                              <div className={classnames("par-chart-menu", { show: showChartTypeMenu })}>
                                <a
                                  href="#bar"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setChartType("bar");
                                    setShowChartTypeMenu(false);
                                  }}
                                >
                                  <i className="ri-bar-chart-2-line" />
                                  <span>{t("Bar")}</span>
                                </a>
                                <a
                                  href="#donut"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setChartType("doughnut");
                                    setShowChartTypeMenu(false);
                                  }}
                                >
                                  <i className="ri-pie-chart-2-fill" />
                                  <span>{t("Donut")}</span>
                                </a>
                                <a
                                  href="#pie"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setChartType("pie");
                                    setShowChartTypeMenu(false);
                                  }}
                                >
                                  <i className="ri-pie-chart-line" />
                                  <span>{t("Pie")}</span>
                                </a>
                              </div>
                            </div>
                          </div>

                          <h2 className="par-chart-title">{t("Purchase Analysis Report")}</h2>

                          <Row className="g-4 justify-content-center">
                            <Col lg={6} md={10}>
                              <div className="par-chart-canvas-wrap">
                                {renderAnalysisChart(
                                  "SoldPL$",
                                  soldPLDollarPer,
                                  soldPLDollarAbs,
                                  true,
                                  chartDollarRef
                                )}
                              </div>
                            </Col>
                            <Col lg={6} md={10}>
                              <div className="par-chart-canvas-wrap">
                                {renderAnalysisChart(
                                  "SoldPLINR",
                                  soldPLINRPer,
                                  soldPLINRAbs,
                                  false,
                                  chartInrRef
                                )}
                              </div>
                            </Col>
                          </Row>
                        </div>
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

export default PurchaseAnalysisReport;
