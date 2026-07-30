import React, { useEffect, useState, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender
} from "@tanstack/react-table";
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
  TabPane,
  Table
} from "reactstrap";
import ReactSelect from "react-select";
import { toast, ToastContainer } from "react-toastify";
import { Bar, Pie, Doughnut } from "react-chartjs-2";
import classnames from "classnames";
import {
  getParcelStockAnalysisReport,
  getParcelStockAnalysisPivotData,
  getParcelStockAnalysisDropdowns
} from "../../helpers/fakebackend_helper";
import { exportToExcel } from "../../helpers/excel_helper";
import ParcelPivotReport from "./ParcelPivotReport";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import "chart.js/auto";

const selectCustomStyles = {
  control: (provided, state) => ({
    ...provided,
    minHeight: "38px",
    height: "38px",
    borderColor: state.isFocused ? "#80bdff" : "#ced4da",
    boxShadow: state.isFocused ? "0 0 0 0.2rem rgba(0,123,255,.25)" : "none",
    "&:hover": {
      borderColor: state.isFocused ? "#80bdff" : "#ced4da"
    },
    borderRadius: "0.25rem",
    backgroundColor: "#fff"
  }),
  valueContainer: (provided, state) => ({
    ...provided,
    height: "36px",
    padding: "0 8px",
    overflow: "hidden",
    whiteSpace: "nowrap"
  }),
  placeholder: (provided, state) => ({
    ...provided,
    color: "#6c757d",
    fontSize: "13px"
  }),
  singleValue: (provided, state) => ({
    ...provided,
    fontSize: "13px"
  }),
  multiValue: (provided, state) => ({
    ...provided,
    backgroundColor: "#eff2f7",
    margin: "1px",
    height: "22px"
  }),
  multiValueLabel: (provided, state) => ({
    ...provided,
    fontSize: "11px",
    padding: "1px 4px",
    lineHeight: "20px"
  }),
  multiValueRemove: (provided, state) => ({
    ...provided,
    paddingLeft: "1px",
    paddingRight: "1px"
  }),
  indicatorsContainer: (provided, state) => ({
    ...provided,
    height: "36px"
  }),
  dropdownIndicator: (provided, state) => ({
    ...provided,
    padding: "4px 8px"
  }),
  clearIndicator: (provided, state) => ({
    ...provided,
    padding: "4px"
  }),
  menuPortal: (base) => ({ ...base, zIndex: 9999 })
};

const Select = (props) => (
  <ReactSelect
    menuPortalTarget={document.body}
    styles={{ ...selectCustomStyles, ...props.styles }}
    {...props}
  />
);

// Chart visual colors matching Velzon and legacy MVC report style
const CHART_COLORS = [
  "#FF6384", "#91eded", "#FFCE25", "#4BC0C0",
  "#9966FF", "#FF00FF", "#0000FF", "#75cb7c", "#38A2EB"
];

// Stock Analysis GroupBy grouping options
const STOCK_ANA_OPTIONS = [
  { value: "Shape", label: "Shape" },
  { value: "Size", label: "Size" },
  { value: "Color", label: "Color" },
  { value: "Clarity", label: "Clarity" },
  { value: "Sieve", label: "Sieve" },
  { value: "StockID", label: "Stock ID (LotNo)" },
  { value: "Location", label: "Location" },
  { value: "ItemGroup", label: "Item Group" }
];

const SHOW_OPTIONS = [
  { value: "Unsold", label: "Unsold" },
  { value: "Sold", label: "Sold" },
  { value: "All", label: "All" }
];

const HOLD_UNHOLD_OPTIONS = [
  { value: "Unhold", label: "Unhold" },
  { value: "Hold", label: "Hold" },
  { value: "All", label: "All" }
];

const STONE_TYPE_OPTIONS = [
  { value: "Parcel", label: "Parcel" },
  { value: "Single", label: "Single" },
  { value: "All", label: "All" }
];

const STATUS_OPTIONS = [
  { value: "All", label: "All" },
  { value: "OnHand", label: "On Hand" },
  { value: "OnMemo", label: "On Memo" },
  { value: "OnHand&Int.Memo", label: "On Hand & Int. Memo" },
  { value: "OnHand + Memo In", label: "On Hand + Memo In" },
  { value: "OnHand + Party Hold", label: "On Hand + Party Hold" },
  { value: "Memo In", label: "Memo In" },
  { value: "Party Hold", label: "Party Hold" },
  { value: "All - Party Hold", label: "All - Party Hold" }
];

// Debounced Input for filters
const DebouncedInput = ({
  value: initialValue,
  onChange,
  debounce = 500,
  className,
  id,
  ...props
}) => {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value);
    }, debounce);

    return () => clearTimeout(timeout);
  }, [debounce, value]);

  return (
    <input
      {...props}
      value={value}
      id={id || "search-bar-0"}
      className={className || "form-control search"}
      onChange={(e) => setValue(e.target.value)}
    />
  );
};

// Column filter helper
const Filter = ({ column }) => {
  const columnFilterValue = column.getFilterValue();

  return (
    <DebouncedInput
      type="text"
      value={(columnFilterValue ?? "")}
      onChange={(value) => column.setFilterValue(value)}
      placeholder=""
      className={`form-control form-control-sm mt-1 ${column.id !== "groupName" ? "text-end" : "text-start"}`}
      style={{ height: "26px", fontSize: "11px", padding: "2px 8px" }}
      debounce={100}
      id={`filter-${column.id}`}
    />
  );
};

const arrowLinesPlugin = {
  id: "arrowLinesPlugin",
  afterDatasetsDraw(chart) {
    if (chart.config.type === "bar") return;
    const ctx = chart.ctx;
    const meta = chart.getDatasetMeta(0);
    const dataset = chart.data.datasets[0];

    if (!meta || !dataset || !meta.data.length) return;

    ctx.save();
    ctx.strokeStyle = "#777";
    ctx.lineWidth = 1.2;
    ctx.font = "bold 11px Arial";
    ctx.fillStyle = "#000";

    const usedPositions = [];

    meta.data.forEach((arc, index) => {
      if (!arc) return;

      const angle = (arc.startAngle + arc.endAngle) / 2;
      const outerRadius = arc.outerRadius;

      // Center of the doughnut chart
      const centerX = (chart.chartArea.left + chart.chartArea.right) / 2;
      const centerY = (chart.chartArea.top + chart.chartArea.bottom) / 2;

      // Compute label position
      const labelRadius = outerRadius * 1.05;
      let labelX = centerX + Math.cos(angle) * labelRadius;
      let labelY = centerY + Math.sin(angle) * labelRadius;

      // Prevent overlapping by checking and adjusting Y position
      while (usedPositions.some(pos => Math.abs(pos - labelY) < 14)) {
        labelY += (labelY > centerY ? 14 : -14);
      }
      usedPositions.push(labelY);

      // Adjust text alignment
      const isRightSide = labelX > centerX;
      const textOffset = isRightSide ? 10 : -10;
      ctx.textAlign = isRightSide ? "left" : "right";
      ctx.textBaseline = "middle";

      // Draw label line
      const lineEndX = labelX + (isRightSide ? 20 : -20);
      ctx.beginPath();
      ctx.moveTo(centerX + Math.cos(angle) * outerRadius, centerY + Math.sin(angle) * outerRadius);
      ctx.lineTo(labelX, labelY);
      ctx.lineTo(lineEndX, labelY);
      ctx.stroke();

      const val = Number(dataset.data[index] || 0).toFixed(2);

      // Draw label text outside the pie chart
      ctx.fillText(`${chart.data.labels[index]} - ${val}%`, lineEndX + textOffset, labelY);
    });

    ctx.restore();
  }
};

const ParcelStockAnalysis = () => {
  const { t } = useTranslation();

  // ── FILTER STATE ──
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
  const [show, setShow] = useState("Unsold");
  const [holdUnHold, setHoldUnHold] = useState("Unhold");
  const [stoneTypes, setStoneTypes] = useState("Parcel");
  const [status, setStatus] = useState("All");
  const [stockAna, setStockAna] = useState("Shape");

  const [ratePer, setRatePer] = useState("");
  const [ratePlusMinus, setRatePlusMinus] = useState("");
  const [backPer, setBackPer] = useState("");
  const [backPlusMinus, setBackPlusMinus] = useState("");
  const [lotNo, setLotNo] = useState("");

  // Multi-select Lists
  const [selectedShapeGroups, setSelectedShapeGroups] = useState([]);
  const [selectedShapes, setSelectedShapes] = useState([]);
  const [selectedColorGroups, setSelectedColorGroups] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedClarities, setSelectedClarities] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [selectedSieves, setSelectedSieves] = useState([]);
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [selectedItemGroups, setSelectedItemGroups] = useState([]);
  const [selectedBoxNms, setSelectedBoxNms] = useState([]);

  // Range inputs
  const [ctsFrm, setCtsFrm] = useState("");
  const [ctsTo, setCtsTo] = useState("");
  const [priceFrm, setPriceFrm] = useState("");
  const [priceTo, setPriceTo] = useState("");
  const [lotFrm, setLotFrm] = useState("");
  const [lotTo, setLotTo] = useState("");

  // ── MASTER OPTIONS ──
  const [dropdownOptions, setDropdownOptions] = useState({
    shapeGroup: [], shape: [], colorGroup: [], color: [], size: [], clarity: [],
    sieve: [], location: [], itemGroup: [], boxname: []
  });

  // ── UI INTERACTIVE STATE ──
  const [loading, setLoading] = useState(false);
  const [pivotLoading, setPivotLoading] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [pivotData, setPivotData] = useState([]);
  const [searched, setSearched] = useState(false);
  const [showPivot, setShowPivot] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(true);
  const [activeReportType, setActiveReportType] = useState("Shape");
  const [activeResultTab, setActiveResultTab] = useState("table");
  const [columnFilters, setColumnFilters] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 50,
  });

  // Chart state
  const [chartType, setChartType] = useState("doughnut");
  const [showChartTypeMenu, setShowChartTypeMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const chartMenusRef = useRef(null);

  // Close chart menus on outside click
  useEffect(() => {
    const onDocClick = (e) => {
      if (chartMenusRef.current && !chartMenusRef.current.contains(e.target)) {
        setShowChartTypeMenu(false);
        setShowExportMenu(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // Set page title and fetch dropdowns
  useEffect(() => {
    document.title = `${t("Parcel Stock Analysis Report")} | Premium Jewellery ERP`;
    fetchDropdowns();
  }, []);

  // Fetch dropdowns from database SP
  const fetchDropdowns = async () => {
    try {
      const response = await getParcelStockAnalysisDropdowns();
      if (response.success || response.Success) {
        const data = response.data || response.Data || [];

        const grouped = {
          shapeGroup: data.filter(x => x.type === "ShapeGroup" || x.Type === "ShapeGroup"),
          shape: data.filter(x => x.type === "Shape" || x.Type === "Shape"),
          colorGroup: data.filter(x => x.type === "ColorGroup" || x.Type === "ColorGroup"),
          color: data.filter(x => x.type === "Color" || x.Type === "Color"),
          size: data.filter(x => x.type === "Size" || x.Type === "Size"),
          clarity: data.filter(x => x.type === "Clarity" || x.Type === "Clarity"),
          sieve: data.filter(x => x.type === "Sieve" || x.Type === "Sieve"),
          location: data.filter(x => x.type === "Location" || x.Type === "Location"),
          itemGroup: data.filter(x => x.type === "ItemGroup" || x.Type === "ItemGroup"),
          boxname: data.filter(x => x.type === "BoxName" || x.Type === "BoxName")
        };

        setDropdownOptions(grouped);
      }
    } catch (error) {
      toast.error(t("Failed to load filter dropdown lists"));
      console.error(error);
    }
  };

  // Helper to map ReactSelect multi-selection values
  const mapSelectVal = (selectedList) => {
    if (!selectedList || !selectedList.length) return null;
    return selectedList.map(x => String(x.value));
  };

  const makeSelectOptions = (arr) =>
    (arr || []).map(x => ({
      value: x.name ?? x.Name ?? x.id ?? x.ID,
      label: x.name ?? x.Name ?? x.id ?? x.ID
    }));

  const buildPayload = () => {
    return {
      date: date || null,
      show: show || "Unsold",
      holdUnHold: holdUnHold || "Unhold",
      stoneTypes: stoneTypes || "Parcel",
      status: status || "All",
      stockAna: stockAna || "Shape",
      ratePer: Number(ratePer) || 0,
      ratePlusMinus: Number(ratePlusMinus) || 0,
      backPer: Number(backPer) || 0,
      backPlusMinus: Number(backPlusMinus) || 0,

      // Multi-Select Fields
      shapeGroup: mapSelectVal(selectedShapeGroups),
      shape: mapSelectVal(selectedShapes),
      colorGroup: mapSelectVal(selectedColorGroups),
      color: mapSelectVal(selectedColors),
      size: mapSelectVal(selectedSizes),
      clarity: mapSelectVal(selectedClarities),
      sieve: mapSelectVal(selectedSieves),
      location: mapSelectVal(selectedLocations),
      itemGroup: mapSelectVal(selectedItemGroups),
      boxNm: mapSelectVal(selectedBoxNms),

      // Ranges
      ctsFrm: Number(ctsFrm) || 0,
      ctsTo: Number(ctsTo) || 0,
      priceFrm: Number(priceFrm) || 0,
      priceTo: Number(priceTo) || 0,
      lotFrm: Number(lotFrm) || 0,
      lotTo: Number(lotTo) || 0,
      lotNo: lotNo || null
    };
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setSearched(true);
    setShowPivot(false);

    try {
      const payload = buildPayload();
      const response = await getParcelStockAnalysisReport(payload);

      if (response.success || response.Success) {
        const raw = response.data || response.Data || [];
        setReportData(raw);
        setActiveReportType(stockAna);
        setActiveResultTab("table");
        setShowFilterPanel(false);
        setPagination(prev => ({ ...prev, pageIndex: 0 }));
        if (!raw.length) {
          toast.info(t("No record found matching the filter criteria."));
        }
      } else {
        toast.error(response.message || response.Message || t("Failed to fetch analytical stock data"));
        setReportData([]);
      }
    } catch (error) {
      toast.error(t("Error during stock search"));
      console.error(error);
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  // Mirrors MVC ParcelStockPivotData() → Syncfusion PivotView
  const handlePivot = async () => {
    setPivotLoading(true);
    setShowPivot(true);
    setSearched(true);
    setPivotData([]);

    try {
      const response = await getParcelStockAnalysisPivotData(buildPayload());
      if (response.success || response.Success) {
        const raw = response.data ?? response.Data ?? [];
        const rows = Array.isArray(raw) ? raw : [];
        setPivotData(rows);
        setShowFilterPanel(false);
        if (!rows.length) {
          toast.info(t("No record found matching the filter criteria."));
        }
      } else {
        toast.error(response.message || response.Message || t("Failed to load pivot data"));
        setPivotData([]);
      }
    } catch (error) {
      toast.error(typeof error === "string" ? error : t("Error fetching pivot data"));
      console.error("Parcel pivot error:", error);
      setPivotData([]);
    } finally {
      setPivotLoading(false);
    }
  };

  const handleClear = () => {
    setDate(new Date().toISOString().substring(0, 10));
    setShow("Unsold");
    setHoldUnHold("Unhold");
    setStoneTypes("Parcel");
    setStatus("All");
    setStockAna("Shape");
    setRatePer("");
    setRatePlusMinus("");
    setBackPer("");
    setBackPlusMinus("");
    setLotNo("");

    setSelectedShapeGroups([]);
    setSelectedShapes([]);
    setSelectedColorGroups([]);
    setSelectedColors([]);
    setSelectedClarities([]);
    setSelectedSizes([]);
    setSelectedSieves([]);
    setSelectedLocations([]);
    setSelectedItemGroups([]);
    setSelectedBoxNms([]);

    setCtsFrm(""); setCtsTo("");
    setPriceFrm(""); setPriceTo("");
    setLotFrm(""); setLotTo("");

    setReportData([]);
    setPivotData([]);
    setSearched(false);
    setShowPivot(false);
    setShowFilterPanel(true);
    setColumnFilters([]);
    setGlobalFilter('');
    setPagination(prev => ({ ...prev, pageIndex: 0 }));
  };

  // Safe property selector for camelCase backend mapping
  const pick = (row, ...names) => {
    if (!row) return undefined;
    for (const name of names) {
      if (row[name] !== undefined && row[name] !== null) return row[name];
    }
    const keys = Object.keys(row);
    for (const name of names) {
      const found = keys.find(k => k.toLowerCase() === String(name).toLowerCase());
      if (found !== undefined && row[found] !== undefined && row[found] !== null) return row[found];
    }
    return undefined;
  };

  const getRowDiscount = (row) => {
    return Number(pick(row, "Back", "back", "AskingBack", "askingBack") || 0);
  };

  const getRowRate = (row) => {
    const r = Number(pick(row, "Rate", "rate", "AskingRate", "askingRate") || 0);
    if (r !== 0) return r;
    const amt = Number(pick(row, "Amount", "amount") || 0);
    const cts = Number(pick(row, "Carats", "carats") || 0);
    return cts > 0 ? (amt / cts) : 0;
  };

  const getGroupName = (row) => {
    if (!row) return "";
    const groupField = activeReportType || stockAna || "Shape";
    const name = String(pick(row, groupField, groupField.toLowerCase(), "GroupName", "groupName") || "");
    return name.toLowerCase() === "unknown" ? "" : name;
  };

  const getFormattedValue = (row, columnId) => {
    const raw = typeof row.getValue === "function" ? row.getValue(columnId) : row[columnId];
    if (columnId === "groupName") {
      return String(raw || "");
    }
    if (columnId === "pcs") {
      return String(raw || 0);
    }
    if (columnId === "pcsPer") {
      return Number(raw || 0).toFixed(2) + "%";
    }
    if (columnId === "carats") {
      return Number(raw || 0).toFixed(3);
    }
    if (columnId === "caratsPer") {
      return Number(raw || 0).toFixed(2) + "%";
    }
    if (columnId === "amount") {
      return "$" + Number(raw || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    if (columnId === "amountPer") {
      return Number(raw || 0).toFixed(2) + "%";
    }
    return String(raw || "");
  };

  // ── REACT TABLE DEFINITION ──
  const columns = useMemo(() => [
    {
      header: () => activeReportType,
      accessorKey: "groupName",
      accessorFn: (row) => getGroupName(row),
      enableColumnFilter: true,
      cell: (info) => <span className="fw-semibold text-dark">{info.getValue()}</span>,
      filterFn: (row, columnId, filterValue) => {
        const formatted = getFormattedValue(row, columnId);
        return formatted.toLowerCase().includes(String(filterValue).toLowerCase());
      }
    },
    {
      header: () => t("Pieces"),
      accessorKey: "pcs",
      accessorFn: (row) => Number(pick(row, "Pcs", "pcs") || 0),
      enableColumnFilter: true,
      cell: (info) => <span className="text-dark">{info.getValue()}</span>,
      filterFn: (row, columnId, filterValue) => {
        const formatted = getFormattedValue(row, columnId);
        return formatted.toLowerCase().includes(String(filterValue).toLowerCase());
      }
    },
    {
      header: () => t("Pcs %"),
      accessorKey: "pcsPer",
      accessorFn: (row) => Number(pick(row, "PcsPer", "pcsPer") || 0),
      enableColumnFilter: true,
      cell: (info) => <span className="text-dark">{info.getValue().toFixed(2)}%</span>,
      filterFn: (row, columnId, filterValue) => {
        const formatted = getFormattedValue(row, columnId);
        return formatted.toLowerCase().includes(String(filterValue).toLowerCase());
      }
    },
    {
      header: () => t("Carats"),
      accessorKey: "carats",
      accessorFn: (row) => Number(pick(row, "Carats", "carats") || 0),
      enableColumnFilter: true,
      cell: (info) => <span className="text-dark">{info.getValue().toFixed(3)}</span>,
      filterFn: (row, columnId, filterValue) => {
        const formatted = getFormattedValue(row, columnId);
        return formatted.toLowerCase().includes(String(filterValue).toLowerCase());
      }
    },
    {
      header: () => t("Carats %"),
      accessorKey: "caratsPer",
      accessorFn: (row) => Number(pick(row, "Caratsper", "caratsper") || 0),
      enableColumnFilter: true,
      cell: (info) => <span className="text-dark">{info.getValue().toFixed(2)}%</span>,
      filterFn: (row, columnId, filterValue) => {
        const formatted = getFormattedValue(row, columnId);
        return formatted.toLowerCase().includes(String(filterValue).toLowerCase());
      }
    },
    {
      header: () => t("Amount ($)"),
      accessorKey: "amount",
      accessorFn: (row) => Number(pick(row, "Amount", "amount") || 0),
      enableColumnFilter: true,
      cell: (info) => <span className="text-dark fw-medium">${info.getValue().toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>,
      filterFn: (row, columnId, filterValue) => {
        const formatted = getFormattedValue(row, columnId);
        return formatted.toLowerCase().includes(String(filterValue).toLowerCase());
      }
    },
    {
      header: () => t("Amount %"),
      accessorKey: "amountPer",
      accessorFn: (row) => Number(pick(row, "AmountPer", "amountPer") || 0),
      enableColumnFilter: true,
      cell: (info) => <span className="text-dark">{info.getValue().toFixed(2)}%</span>,
      filterFn: (row, columnId, filterValue) => {
        const formatted = getFormattedValue(row, columnId);
        return formatted.toLowerCase().includes(String(filterValue).toLowerCase());
      }
    }
  ], [activeReportType, t]);

  const table = useReactTable({
    columns,
    data: reportData,
    state: {
      columnFilters,
      globalFilter,
      pagination,
    },
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    autoResetPageIndex: false,
    globalFilterFn: (row, columnId, filterValue) => {
      const formatted = getFormattedValue(row, columnId);
      return formatted.toLowerCase().includes(String(filterValue).toLowerCase());
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel()
  });

  const {
    getHeaderGroups,
    getRowModel,
    getCanPreviousPage,
    getCanNextPage,
    getPageOptions,
    setPageIndex,
    nextPage,
    previousPage,
    setPageSize,
    getState
  } = table;

  const totalPages = getPageOptions().length;
  const currentPageIndex = getState().pagination.pageIndex;

  const getVisiblePages = () => {
    if (totalPages <= 3) {
      return getPageOptions();
    }
    if (currentPageIndex === 0) {
      return [0, 1, 2];
    } else if (currentPageIndex === totalPages - 1) {
      return [totalPages - 3, totalPages - 2, totalPages - 1];
    } else {
      return [currentPageIndex - 1, currentPageIndex, currentPageIndex + 1];
    }
  };

  // Reset pageIndex on filter change
  useEffect(() => {
    setPagination(prev => ({ ...prev, pageIndex: 0 }));
  }, [globalFilter, columnFilters]);

  // Calculations for totals and cards based on filtered rows
  const filteredRows = table.getFilteredRowModel().rows;
  const summaryMetrics = useMemo(() => {
    let pcs = 0;
    let carats = 0;
    let amount = 0;
    let backVal = 0;
    let backWeightTotal = 0;

    filteredRows.forEach(r => {
      const row = r.original;
      const p = Number(pick(row, "Pcs", "pcs") || 0);
      const c = Number(pick(row, "Carats", "carats") || 0);
      const amt = Number(pick(row, "Amount", "amount") || 0);
      const bk = getRowDiscount(row);

      pcs += p;
      carats += c;
      amount += amt;

      if (bk !== 0 && c > 0) {
        backVal += bk * c;
        backWeightTotal += c;
      }
    });

    const avgRate = carats > 0 ? (amount / carats) : 0;
    const avgBack = backWeightTotal > 0 ? (backVal / backWeightTotal) : 0;

    return { pcs, carats, amount, avgRate, avgBack };
  }, [filteredRows]);

  // Chart configuration
  // Chart configuration
  const chartData = useMemo(() => {
    if (!reportData.length) return null;
    const labels = reportData.map(r => getGroupName(r));
    const carats = reportData.map(r => Number(pick(r, "Carats", "carats") || 0));
    const caratsPer = reportData.map(r => Number(pick(r, "CaratsPer", "caratsper", "Caratsper") || 0));
    const amounts = reportData.map(r => Number(pick(r, "Amount", "amount") || 0));
    const amountPer = reportData.map(r => Number(pick(r, "AmountPer", "amountper", "Amountper") || 0));

    return {
      labels,
      carats,
      caratsPer,
      amounts,
      amountPer
    };
  }, [reportData]);

  const activeChartConfig = useMemo(() => {
    if (!chartData) return null;

    const caratsData = {
      labels: chartData.labels,
      datasets: [{
        label: t("Carats%"),
        data: chartData.caratsPer,
        backgroundColor: CHART_COLORS,
        borderWidth: chartType === "bar" ? 1 : 2,
        borderColor: "#fff"
      }]
    };

    const amountData = {
      labels: chartData.labels,
      datasets: [{
        label: t("Amount%"),
        data: chartData.amountPer,
        backgroundColor: CHART_COLORS,
        borderWidth: chartType === "bar" ? 1 : 2,
        borderColor: "#fff"
      }]
    };

    const caratsOptions = {
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: { top: 30, bottom: 40, left: 50, right: 50 } },
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: t("Carats%"),
          font: { size: 18, weight: "bold" },
          padding: { bottom: 30 }
        },
        tooltip: {
          callbacks: {
            label: (tooltipItem) => {
              const index = tooltipItem.dataIndex;
              const val = chartData.carats[index];
              return ` ${val.toFixed(2)} CRT`;
            }
          }
        }
      },
      scales: chartType === "bar" ? { y: { beginAtZero: true } } : {}
    };

    const amountOptions = {
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: { top: 30, bottom: 40, left: 50, right: 50 } },
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: t("Amount%"),
          font: { size: 18, weight: "bold" },
          padding: { bottom: 30 }
        },
        tooltip: {
          callbacks: {
            label: (tooltipItem) => {
              const index = tooltipItem.dataIndex;
              const val = chartData.amounts[index];
              return ` $${val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            }
          }
        }
      },
      scales: chartType === "bar" ? { y: { beginAtZero: true } } : {}
    };

    return {
      carats: { data: caratsData, options: caratsOptions },
      amount: { data: amountData, options: amountOptions }
    };
  }, [chartData, chartType, t]);

  // Excel Export handler
  const handleExcelExport = async () => {
    if (!reportData.length) {
      toast.warning(t("No data available to export"));
      return;
    }

    const headers = [
      activeReportType,
      t("Pcs"),
      t("Pcs %"),
      t("Carats"),
      t("Carats %"),
      t("Amount ($)"),
      t("Amount %")
    ];

    const rows = reportData.map(row => [
      getGroupName(row),
      Number(pick(row, "Pcs", "pcs") || 0),
      Number(pick(row, "PcsPer", "pcsPer") || 0),
      Number(pick(row, "Carats", "carats") || 0),
      Number(pick(row, "Caratsper", "caratsper") || 0),
      Number(pick(row, "Amount", "amount") || 0),
      Number(pick(row, "AmountPer", "amountPer") || 0)
    ]);

    rows.push([
      t("Total"),
      summaryMetrics.pcs,
      "100.00%",
      summaryMetrics.carats,
      "100.00%",
      summaryMetrics.amount,
      "100.00%"
    ]);

    const fileName = `Parcel_Stock_Analysis_${activeReportType}_${new Date().toISOString().substring(0, 10)}`;
    await exportToExcel(headers, rows, "Stock Analysis", fileName);
    toast.success(t("Report exported to Excel successfully"));
  };

  const handleChartExport = (format) => {
    const extension = format.includes("jpeg") ? "jpg" : format === "pdf" ? "pdf" : "png";
    const W = 400, H = 400, headerH = 60;
    const combined = document.createElement("canvas");
    combined.width = W * 2;
    combined.height = H + headerH;
    const ctx2 = combined.getContext("2d");
    ctx2.fillStyle = "#ffffff";
    ctx2.fillRect(0, 0, combined.width, combined.height);
    ctx2.fillStyle = "#000000";
    ctx2.font = "bold 24px Arial";
    ctx2.textAlign = "center";
    ctx2.fillText(t("Parcel Stock Analysis Charts"), combined.width / 2, 40);

    const canvasIds = ["stockCaratPerChart", "stockAmountChart"];
    let allReady = true;
    canvasIds.forEach((id, idx) => {
      const cvs = document.getElementById(id);
      if (!cvs) {
        toast.warning(t(`Chart "${id}" is not rendered yet.`));
        allReady = false;
        return;
      }
      ctx2.drawImage(cvs, W * idx, headerH, W, H);
    });
    if (!allReady) return;

    if (extension === "pdf") {
      if (!window.jspdf) {
        toast.error(t("jsPDF library not loaded"));
        return;
      }
      const pdf = new window.jspdf.jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [combined.width, combined.height]
      });
      pdf.addImage(combined.toDataURL("image/png"), "PNG", 0, 0, combined.width, combined.height);
      pdf.save(`ParcelStockAnalysis_Charts_${new Date().toISOString().substring(0, 10)}.pdf`);
    } else {
      const link = document.createElement("a");
      link.href = combined.toDataURL(format, 1.0);
      link.download = `ParcelStockAnalysis_Charts_${new Date().toISOString().substring(0, 10)}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
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
          <BreadCrumb title={t("Parcel Stock Analysis Report")} pageTitle={t("Dashboard")} />

          {/* Top Control Bar matching ParcelSaleAnalysisReport.js design */}
          <div className="card d-flex flex-row flex-wrap align-items-center justify-content-between mb-3 p-3 rounded-3 shadow-sm border gap-2">
            <h5 className="mb-0 fw-bold text-primary d-flex align-items-center gap-2">
              <i className="ri-shopping-bag-3-line fs-20 text-primary"></i>
              {t("Parcel Stock Analysis Report")}
            </h5>

            <div className="d-flex align-items-center flex-wrap gap-2">
              <div className="d-flex align-items-center gap-2">
                <Label className="mb-0 fw-medium align-self-center">{t("Grouping")}</Label>
                <select
                  className="form-select form-select-sm"
                  style={{ width: 140, height: "31px" }}
                  value={stockAna}
                  onChange={(e) => setStockAna(e.target.value)}
                >
                  {STOCK_ANA_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{t(o.label)}</option>
                  ))}
                </select>
              </div>

              <Button
                color="primary"
                className="btn-sm rounded-2 px-3 py-1"
                onClick={handleSearch}
                disabled={loading || pivotLoading}
                form="parcel-stock-analysis-form"
                type="submit"
              >
                {loading ? <Spinner size="sm" /> : t("Report")}
              </Button>
              <Button
                color="primary"
                className="btn-sm rounded-2 px-3 py-1"
                onClick={handlePivot}
                disabled={pivotLoading || loading}
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

          {/* Search Filters Form Card matching ParcelSaleAnalysisReport.js layout */}
          {showFilterPanel && (
            <Card className="shadow-lg border-0 rounded-3 mb-3">
              <CardBody className="bg-light-subtle py-2">
                <form id="parcel-stock-analysis-form" onSubmit={handleSearch}>
                  {/* Row 1: Stock Till Date, Show, Hold/Unhold, Single/Parcel, Status, Rate % */}
                  <Row className="g-2 mb-2">
                    <Col sm={2}>
                      <FormGroup className="mb-0">
                        <Label className="fw-medium">{t("Stock Till Date")}</Label>
                        <Input
                          type="date"
                          className="form-control"
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                        />
                      </FormGroup>
                    </Col>
                    <Col sm={2}>
                      <FormGroup className="mb-0">
                        <Label className="fw-medium">{t("Show")}</Label>
                        <select
                          className="form-select"
                          value={show}
                          onChange={(e) => setShow(e.target.value)}
                        >
                          {SHOW_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{t(o.label)}</option>
                          ))}
                        </select>
                      </FormGroup>
                    </Col>
                    <Col sm={2}>
                      <FormGroup className="mb-0">
                        <Label className="fw-medium">{t("Hold/Unhold")}</Label>
                        <select
                          className="form-select"
                          value={holdUnHold}
                          onChange={(e) => setHoldUnHold(e.target.value)}
                        >
                          {HOLD_UNHOLD_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{t(o.label)}</option>
                          ))}
                        </select>
                      </FormGroup>
                    </Col>
                    <Col sm={2}>
                      <FormGroup className="mb-0">
                        <Label className="fw-medium">{t("Single / Parcel")}</Label>
                        <select
                          className="form-select"
                          value={stoneTypes}
                          disabled
                          onChange={(e) => setStoneTypes(e.target.value)}
                        >
                          {STONE_TYPE_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{t(o.label)}</option>
                          ))}
                        </select>
                      </FormGroup>
                    </Col>
                    <Col sm={2}>
                      <FormGroup className="mb-0">
                        <Label className="fw-medium">{t("Status")}</Label>
                        <select
                          className="form-select"
                          value={status}
                          onChange={(e) => setStatus(e.target.value)}
                        >
                          {STATUS_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{t(o.label)}</option>
                          ))}
                        </select>
                      </FormGroup>
                    </Col>
                    <Col sm={2}>
                      <FormGroup className="mb-0">
                        <Label className="fw-medium">{t("Rate %")}</Label>
                        <Input
                          type="number"
                          className="form-control"
                          placeholder={t("e.g. 10")}
                          value={ratePer}
                          onChange={(e) => setRatePer(e.target.value)}
                        />
                      </FormGroup>
                    </Col>
                  </Row>

                  {/* Row 2: Rate +-, Back %, Back +-, Cts From, Cts To, Price From */}
                  <Row className="g-2 mb-2">
                    <Col sm={2}>
                      <FormGroup className="mb-0">
                        <Label className="fw-medium">{t("Rate +-")}</Label>
                        <Input
                          type="number"
                          className="form-control"
                          placeholder={t("e.g. -50")}
                          value={ratePlusMinus}
                          onChange={(e) => setRatePlusMinus(e.target.value)}
                        />
                      </FormGroup>
                    </Col>
                    <Col sm={2}>
                      <FormGroup className="mb-0">
                        <Label className="fw-medium">{t("Back %")}</Label>
                        <Input
                          type="number"
                          className="form-control"
                          placeholder={t("e.g. 10")}
                          value={backPer}
                          onChange={(e) => setBackPer(e.target.value)}
                        />
                      </FormGroup>
                    </Col>
                    <Col sm={2}>
                      <FormGroup className="mb-0">
                        <Label className="fw-medium">{t("Back +-")}</Label>
                        <Input
                          type="number"
                          className="form-control"
                          placeholder={t("e.g. -5")}
                          value={backPlusMinus}
                          onChange={(e) => setBackPlusMinus(e.target.value)}
                        />
                      </FormGroup>
                    </Col>
                    <Col sm={2}>
                      <FormGroup className="mb-0">
                        <Label className="fw-medium">{t("Carats From")}</Label>
                        <Input
                          type="number"
                          className="form-control"
                          placeholder="0.00"
                          value={ctsFrm}
                          onChange={(e) => setCtsFrm(e.target.value)}
                        />
                      </FormGroup>
                    </Col>
                    <Col sm={2}>
                      <FormGroup className="mb-0">
                        <Label className="fw-medium">{t("Carats To")}</Label>
                        <Input
                          type="number"
                          className="form-control"
                          placeholder="0.00"
                          value={ctsTo}
                          onChange={(e) => setCtsTo(e.target.value)}
                        />
                      </FormGroup>
                    </Col>
                    <Col sm={2}>
                      <FormGroup className="mb-0">
                        <Label className="fw-medium">{t("Price From")}</Label>
                        <Input
                          type="number"
                          className="form-control"
                          placeholder="0"
                          value={priceFrm}
                          onChange={(e) => setPriceFrm(e.target.value)}
                        />
                      </FormGroup>
                    </Col>
                  </Row>

                  {/* Row 3: Price To, LotNo From, LotNo To, Enter Lot No */}
                  <Row className="g-2 mb-2">
                    <Col sm={2}>
                      <FormGroup className="mb-0">
                        <Label className="fw-medium">{t("Price To")}</Label>
                        <Input
                          type="number"
                          className="form-control"
                          placeholder="0"
                          value={priceTo}
                          onChange={(e) => setPriceTo(e.target.value)}
                        />
                      </FormGroup>
                    </Col>
                    <Col sm={2}>
                      <FormGroup className="mb-0">
                        <Label className="fw-medium">{t("LotNo From")}</Label>
                        <Input
                          type="number"
                          className="form-control"
                          placeholder="0"
                          value={lotFrm}
                          onChange={(e) => setLotFrm(e.target.value)}
                        />
                      </FormGroup>
                    </Col>
                    <Col sm={2}>
                      <FormGroup className="mb-0">
                        <Label className="fw-medium">{t("LotNo To")}</Label>
                        <Input
                          type="number"
                          className="form-control"
                          placeholder="0"
                          value={lotTo}
                          onChange={(e) => setLotTo(e.target.value)}
                        />
                      </FormGroup>
                    </Col>
                    <Col sm={6}>
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

                  {/* Row 4: Shape Group, Shape, Color Group, Color, Size, Sieve */}
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
                  </Row>

                  {/* Row 5: Clarity, Box Name, Location, Group */}
                  <Row className="g-2">
                    <Col sm={3}>
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
                    <Col sm={3}>
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
                    <Col sm={3}>
                      <FormGroup className="mb-0">
                        <Label className="fw-medium">{t("Location")}</Label>
                        <Select
                          isMulti
                          options={makeSelectOptions(dropdownOptions.location)}
                          value={selectedLocations}
                          onChange={setSelectedLocations}
                          placeholder={t("Location")}
                        />
                      </FormGroup>
                    </Col>
                    <Col sm={3}>
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
                  </Row>
                </form>
              </CardBody>
            </Card>
          )}

          {/* ── PIVOT REPORT SECTION ── */}
          {showPivot && (
            <div className="control-section mb-4" id="pivot-table-section">
              {pivotLoading ? (
                <Card className="border shadow-sm">
                  <CardBody className="text-center p-5 bg-white">
                    <Spinner color="primary" className="mb-2" />
                    <p className="text-muted mb-0">{t("Loading pivot data...")}</p>
                  </CardBody>
                </Card>
              ) : pivotData.length === 0 ? (
                <Card className="border shadow-sm">
                  <CardBody className="text-center p-5 bg-white">
                    <h5 className="text-muted mb-0">
                      {t("No record found matching the filter criteria.")}
                    </h5>
                  </CardBody>
                </Card>
              ) : (
                <ParcelPivotReport data={pivotData} />
              )}
            </div>
          )}

          {/* ── REPORT DATA CARD ── */}
          {searched && !showPivot && (
            <Card className="shadow-lg border-0 rounded-3 mb-3">
              <CardHeader className="d-flex align-items-center justify-content-between pb-2 border-0 bg-transparent">
                <Nav pills className="nav-pills-custom nav-success bg-light p-1 rounded-3" style={{ border: "none" }}>
                  <NavItem>
                    <NavLink
                      className={classnames({ active: activeResultTab === "table" })}
                      onClick={() => setActiveResultTab("table")}
                      style={{ cursor: "pointer", borderRadius: "6px", fontWeight: "600", fontSize: "13px" }}
                    >
                      <i className="ri-table-line me-1 align-middle" />
                      {t("Analysis Grid")}
                    </NavLink>
                  </NavItem>
                  <NavItem>
                    <NavLink
                      className={classnames({ active: activeResultTab === "charts" })}
                      onClick={() => setActiveResultTab("charts")}
                      style={{ cursor: "pointer", borderRadius: "6px", fontWeight: "600", fontSize: "13px" }}
                    >
                      <i className="ri-pie-chart-2-line me-1 align-middle" />
                      {t("Analytical Charts")}
                    </NavLink>
                  </NavItem>
                </Nav>

                <div className="d-flex align-items-center gap-2">
                  {activeResultTab === "table" && (
                    <Button color="success" size="sm" className="btn-sm rounded-2 px-3 py-1 me-2" onClick={handleExcelExport}>
                      <i className="ri-file-excel-2-line me-1 align-middle" />
                      {t("Excel")}
                    </Button>
                  )}
                </div>
              </CardHeader>

              <CardBody className="pt-2">
                <TabContent activeTab={activeResultTab}>
                  {/* TAB 1: SUMMARY DATA GRID */}
                  <TabPane tabId="table">
                    <div className="border border-dashed border-end-0 border-start-0 py-3 mb-3">
                      <Row className="align-items-center g-3">
                        <Col sm={12} md="auto">
                          <div className="d-flex align-items-center">
                            <span className="me-2 text-muted text-uppercase fs-12 fw-semibold">{t("Show")}</span>
                            <select
                              className="form-select form-select-sm w-auto"
                              value={getState().pagination.pageSize}
                              onChange={(e) => setPageSize(Number(e.target.value))}
                              style={{ minWidth: "85px" }}
                            >
                              {[10, 25, 50, 100, 500].map(pageSize => (
                                <option key={pageSize} value={pageSize}>
                                  {pageSize}
                                </option>
                              ))}
                              <option value={999999}>{t("All")}</option>
                            </select>
                            <span className="ms-2 text-muted text-uppercase fs-12 fw-semibold">{t("Entries")}</span>
                          </div>
                        </Col>
                        <Col sm={12} md className="d-flex justify-content-md-end mt-2 mt-md-0">
                          <div className="search-box me-2 d-inline-block">
                            <DebouncedInput
                              value={globalFilter ?? ""}
                              onChange={value => setGlobalFilter(value)}
                              placeholder={t("Filter items...")}
                              className="form-control search"
                            />
                            <i className="bx bx-search-alt search-icon"></i>
                          </div>
                        </Col>
                      </Row>
                    </div>

                    <div className="table-responsive table-card mb-3" style={{ maxHeight: "calc(100vh - 280px)", overflowY: "auto", overflowX: "auto" }}>
                      <Table hover className="align-middle table-nowrap mb-0 table-sticky-header table-striped par-report-table">
                        <thead className="table-light text-dark">
                          {getHeaderGroups().map((headerGroup) => (
                            <tr key={headerGroup.id}>
                              {headerGroup.headers.map((header) => (
                                <th key={header.id} className={header.column.id !== "groupName" ? "text-end text-dark" : "text-start text-dark"}>
                                  {header.isPlaceholder ? null : (
                                    <React.Fragment>
                                      <div
                                        className={`d-flex align-items-center ${header.column.id !== "groupName" ? "justify-content-end" : ""} ${header.column.getCanSort() ? "cursor-pointer" : ""}`}
                                        onClick={header.column.getToggleSortingHandler()}
                                      >
                                        {flexRender(
                                          header.column.columnDef.header,
                                          header.getContext()
                                        )}
                                        {header.column.getCanSort() && (
                                          <span className="ms-2">
                                            {{
                                              asc: <i className="mdi mdi-chevron-up text-dark"></i>,
                                              desc: <i className="mdi mdi-chevron-down text-dark"></i>,
                                            }[header.column.getIsSorted()] ?? <i className="mdi mdi-unfold-more-horizontal text-dark"></i>}
                                          </span>
                                        )}
                                      </div>
                                      {header.column.getCanFilter() ? (
                                        <div className="mt-1">
                                          <Filter column={header.column} />
                                        </div>
                                      ) : null}
                                    </React.Fragment>
                                  )}
                                </th>
                              ))}
                            </tr>
                          ))}
                        </thead>
                        <tbody>
                          {getRowModel().rows.length > 0 ? (
                            getRowModel().rows.map((row) => (
                              <tr key={row.id}>
                                {row.getVisibleCells().map((cell) => (
                                  <td key={cell.id} className={cell.column.id !== "groupName" ? "text-end" : "text-start"}>
                                    {flexRender(
                                      cell.column.columnDef.cell,
                                      cell.getContext()
                                    )}
                                  </td>
                                ))}
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={7} className="text-center py-4 text-muted fw-medium">
                                {t("No data found")}
                              </td>
                            </tr>
                          )}
                        </tbody>
                        <tfoot className="table-light fw-bold border-top border-bottom">
                          <tr>
                            <td className="text-dark text-start">{t("Total")}</td>
                            <td className="text-end text-dark">{summaryMetrics.pcs}</td>
                            <td className="text-end text-dark">100.00%</td>
                            <td className="text-end text-dark">{summaryMetrics.carats.toFixed(3)}</td>
                            <td className="text-end text-dark">100.00%</td>
                            <td className="text-end text-dark fw-bold">${summaryMetrics.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            <td className="text-end text-dark">100.00%</td>
                          </tr>
                        </tfoot>
                      </Table>
                    </div>

                    <div style={{ paddingTop: "8px", paddingBottom: "4px", borderTop: "1px solid var(--vz-border-color, #e9ebec)" }}>
                      <Row className="align-items-center mt-0 g-3 text-center text-sm-start">
                        <div className="col-sm">
                          <div className="text-muted">
                            {t("Showing")} <span className="fw-semibold">
                              {table.getFilteredRowModel().rows.length === 0 ? 0 : (getState().pagination.pageIndex * getState().pagination.pageSize) + 1}
                            </span> {t("to")} <span className="fw-semibold">
                              {Math.min((getState().pagination.pageIndex + 1) * getState().pagination.pageSize, table.getFilteredRowModel().rows.length)}
                            </span> {t("of")} <span className="fw-semibold">{table.getFilteredRowModel().rows.length}</span> {t("entries")}
                          </div>
                        </div>
                        <div className="col-sm-auto">
                          <ul className="pagination pagination-separated pagination-md justify-content-center justify-content-sm-start mb-0">
                            <li className={!getCanPreviousPage() ? "page-item disabled" : "page-item"}>
                              <Link to="#" className="page-link" onClick={(e) => { e.preventDefault(); previousPage(); }}>{t("Previous")}</Link>
                            </li>
                            {getVisiblePages().map((item, key) => (
                              <React.Fragment key={key}>
                                <li className={getState().pagination.pageIndex === item ? "page-item active" : "page-item"}>
                                  <Link to="#" className="page-link" onClick={(e) => { e.preventDefault(); setPageIndex(item); }}>{item + 1}</Link>
                                </li>
                              </React.Fragment>
                            ))}
                            <li className={!getCanNextPage() ? "page-item disabled" : "page-item"}>
                              <Link to="#" className="page-link" onClick={(e) => { e.preventDefault(); nextPage(); }}>{t("Next")}</Link>
                            </li>
                          </ul>
                        </div>
                      </Row>
                    </div>
                  </TabPane>

                  {/* TAB 2: ANALYTICAL CHARTS */}
                  <TabPane tabId="charts">
                    {!chartData ? (
                      <div className="text-center py-5">
                        <h6 className="text-muted mb-0">{t("No chart data available")}</h6>
                      </div>
                    ) : (
                      <div ref={chartMenusRef}>
                        <div className="par-chart-toolbar">
                          <div className="par-chart-menu-wrap">
                            <button
                              type="button"
                              className="par-chart-icon-btn"
                              onClick={() => { setShowExportMenu((v) => !v); setShowChartTypeMenu(false); }}
                              title={t("Export charts")}
                            >
                              <i className="ri-download-2-line" />
                            </button>
                            <div className={classnames("par-chart-menu", { show: showExportMenu })}>
                              <a href="#" onClick={(e) => { e.preventDefault(); handleChartExport("image/png"); }}>
                                <i className="ri-file-image-line" /> PNG
                              </a>
                              <a href="#" onClick={(e) => { e.preventDefault(); handleChartExport("image/jpeg"); }}>
                                <i className="ri-file-image-line" /> JPG
                              </a>
                              <a href="#" onClick={(e) => { e.preventDefault(); handleChartExport("pdf"); }}>
                                <i className="ri-file-pdf-line" /> PDF
                              </a>
                            </div>
                          </div>

                          <div className="par-chart-menu-wrap">
                            <button
                              type="button"
                              className="par-chart-icon-btn"
                              onClick={() => { setShowChartTypeMenu((v) => !v); setShowExportMenu(false); }}
                              title={t("Chart type")}
                            >
                              <i className="ri-menu-line" />
                            </button>
                            <div className={classnames("par-chart-menu", { show: showChartTypeMenu })}>
                              <a href="#" onClick={(e) => { e.preventDefault(); setChartType("doughnut"); setShowChartTypeMenu(false); }}>
                                <i className="ri-pie-chart-2-line" /> Donut
                              </a>
                              <a href="#" onClick={(e) => { e.preventDefault(); setChartType("pie"); setShowChartTypeMenu(false); }}>
                                <i className="ri-pie-chart-2-line" /> Pie
                              </a>
                              <a href="#" onClick={(e) => { e.preventDefault(); setChartType("bar"); setShowChartTypeMenu(false); }}>
                                <i className="ri-bar-chart-2-line" /> Bar
                              </a>
                            </div>
                          </div>
                        </div>

                        <h2 className="text-center mb-3 fw-bold">{t("Parcel Stock Analysis Report")}</h2>
                        <Row className="justify-content-center">
                          <Col lg={6} md={12}>
                            <div style={{ height: "450px" }} className="position-relative">
                              {chartType === "doughnut" && <Doughnut id="stockCaratPerChart" data={activeChartConfig.carats.data} options={activeChartConfig.carats.options} plugins={[arrowLinesPlugin]} />}
                              {chartType === "pie" && <Pie id="stockCaratPerChart" data={activeChartConfig.carats.data} options={activeChartConfig.carats.options} plugins={[arrowLinesPlugin]} />}
                              {chartType === "bar" && <Bar id="stockCaratPerChart" data={activeChartConfig.carats.data} options={activeChartConfig.carats.options} plugins={[arrowLinesPlugin]} />}
                            </div>
                          </Col>
                          <Col lg={6} md={12}>
                            <div style={{ height: "450px" }} className="position-relative">
                              {chartType === "doughnut" && <Doughnut id="stockAmountChart" data={activeChartConfig.amount.data} options={activeChartConfig.amount.options} plugins={[arrowLinesPlugin]} />}
                              {chartType === "pie" && <Pie id="stockAmountChart" data={activeChartConfig.amount.data} options={activeChartConfig.amount.options} plugins={[arrowLinesPlugin]} />}
                              {chartType === "bar" && <Bar id="stockAmountChart" data={activeChartConfig.amount.data} options={activeChartConfig.amount.options} plugins={[arrowLinesPlugin]} />}
                            </div>
                          </Col>
                        </Row>
                      </div>
                    )}
                  </TabPane>
                </TabContent>
              </CardBody>
            </Card>
          )}
        </Container>
      </div>
      <ToastContainer />
    </React.Fragment>
  );
};

export default ParcelStockAnalysis;
