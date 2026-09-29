import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  Card,
  CardBody,
  Col,
  Container,
  FormGroup,
  Input,
  Label,
  Row
} from "reactstrap";
import classnames from "classnames";
import Select, { components } from "react-select";
import { toast, ToastContainer } from "react-toastify";

import BreadCrumb from "../../../Components/Common/BreadCrumb";
import { exportToExcel } from "../../../helpers/excel_helper";
import {
  getParcelStockHistoryReport,
  getParcelStockRegisterDropdowns,
  getParcelStockRegisterLots
} from "../../../helpers/fakebackend_helper";

const debounce = (func, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => func(...args), delay);
  };
};

// MVC ParcelStockRegisterReport.cshtml — TYPE dropdown (.chkType / selectedTypes)
const trnTypeOptions = [
  { value: "ALL", label: "All" },
  { value: "PUR", label: "Purchase" },
  { value: "SALE", label: "Sale" },
  { value: "PURRTN", label: "Purchase Return" },
  { value: "SALERTN", label: "Sale Return" },
  { value: "MEMOOUT", label: "Memo Out" },
  { value: "MEMOOUTRTN", label: "Memo Out Return" },
  { value: "MEMOIN", label: "Memo In" },
  { value: "MEMOINRTN", label: "Memo In Return" },
  { value: "GPUR", label: "General Purchase" },
  { value: "GSALE", label: "General Sale" },
  { value: "GPURRTN", label: "General Purchase Return" },
  { value: "GSALERTN", label: "General Sale Return" },
  { value: "GMEMOOUT", label: "General Memo Out" },
  { value: "GMEMOOUTRTN", label: "General Memo Out Return" },
  { value: "GMEMOIN", label: "General Memo In" },
  { value: "GMEMOINRTN", label: "General Memo In Return" },
  { value: "STKTRN", label: "Stock Transfer" }
];

// MVC Transaction dropdown (.chkTypeall / selectedTypesTrn) — defaults match cshtml checked attrs
const transactionTypeOptions = [
  { value: "ALL", label: "All" },
  { value: "MEMOIN", label: "Memo In" },
  { value: "PUR", label: "Purchase" },
  { value: "MEMOOUT", label: "Memo Out" },
  { value: "SALE", label: "Sale" },
  { value: "STKTRN", label: "Stock Transfer" }
];

const DEFAULT_TRANSACTION_TYPES = ["MEMOIN", "PUR", "MEMOOUT", "SALE", "STKTRN"];

const formatDateYMDToDMY = (dateStr) => {
  if (!dateStr || typeof dateStr !== "string") return dateStr || "";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
};

const fmtFixed = (value, decimals = 2) => {
  if (value === null || value === undefined || value === "") return "";
  const num = Number(value);
  if (Number.isNaN(num)) return "";
  return num.toFixed(decimals);
};

const formatLocalDate = (date) => {
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/** Match MVC: split textarea / comma lots, trim, uppercase, drop blanks */
const normalizeLotNoList = (lotNoText) => {
  if (!lotNoText || typeof lotNoText !== "string") return [];
  return lotNoText
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split(/[\n,]+/)
    .map((v) => v.trim().toUpperCase())
    .filter(Boolean);
};

const normalizeLotNoPayload = (lotNoText) => normalizeLotNoList(lotNoText).join("\n");

const getRowVal = (row, ...keys) => {
  for (const key of keys) {
    if (row?.[key] !== undefined && row?.[key] !== null && row?.[key] !== "") return row[key];
  }
  return "";
};

/** Normalize API row (camelCase / PascalCase / SP aliases) to UI shape — mirrors MVC StockID row */
const normalizeReportRow = (row) => {
  if (!row || typeof row !== "object") return row;
  return {
    lotNo: getRowVal(row, "lotNo", "LotNo", "stockID", "StockID"),
    trnDate: getRowVal(row, "trnDate", "TrnDate", "trndate"),
    trntype: getRowVal(row, "trntype", "Trntype", "trnType", "TrnType"),
    invno: getRowVal(row, "invno", "Invno", "InvNo", "invNo"),
    perticulors: getRowVal(row, "perticulors", "Perticulors", "particulars", "Particulars"),
    inCts: getRowVal(row, "inCts", "InCts", "stockIn", "StockIn"),
    inRate: getRowVal(row, "inRate", "InRate", "stockInPrice", "StockInPrice"),
    inAmount: getRowVal(row, "inAmount", "InAmount", "stockInAmount", "StockInAmount"),
    outCts: getRowVal(row, "outCts", "OutCts", "stockOut", "StockOut"),
    outRate: getRowVal(row, "outRate", "OutRate", "stockOutPrice", "StockOutPrice"),
    outAmount: getRowVal(row, "outAmount", "OutAmount", "stockOutAmount", "StockOutAmount"),
    cogs: getRowVal(row, "cogs", "COGS"),
    balCts: getRowVal(row, "balCts", "BalCts", "balanceStock", "BalanceStock"),
    balRate: getRowVal(row, "balRate", "BalRate", "balancePrice", "BalancePrice"),
    balAmount: getRowVal(row, "balAmount", "BalAmount", "balanceAmount", "BalanceAmount"),
    invcode: getRowVal(row, "invcode", "Invcode", "invCode", "InvCode")
  };
};

/**
 * MVC parcelstock-register.js (#dynamic-stock-register-container .trntype-cell)
 * Opens Edit route with Mode=view using invcode (SalePur Code), not InvNo.
 * OpStk / StkTrn / MixMemoInRtn / MixMemoRtnP / MemoInRtnP / MemoRtnP → no navigation.
 */
const resolveTransactionUrl = (trnType, invcode) => {
  if (!trnType || invcode === null || invcode === undefined || invcode === "") return "";
  const lower = String(trnType).trim().toLowerCase();
  const id = encodeURIComponent(invcode);

  switch (lower) {
    case "pur":
      return `/purchase/edit-purchase?Id=${id}&Mode=view`;
    case "sale":
      return `/sale/edit-sale?Id=${id}&Mode=view`;
    case "ppur":
      return `/purchaseparcel/edit-purchaseparcel?Id=${id}&Mode=view`;
    case "psale":
      return `/saleParcel/edit-saleParcel?Id=${id}&Mode=view`;
    case "memoin":
      return `/consignment/edit-consignment?Id=${id}&Mode=view`;
    case "pmemoin":
      return `/ConsignmentParcel/edit-ConsignmentParcel?Id=${id}&Mode=view`;
    case "memoout":
      return `/memo/edit-memo?Id=${id}&Mode=view`;
    case "pmemoout":
      return `/memoparcel/edit-memoparcel?Id=${id}&Mode=view`;
    case "psalertn":
      return `/SaleReturnPartial/edit-salereturnParcel?Id=${id}&Mode=view`;
    case "ppurrtn":
      return `/PurchaseParcelReturn/edit-ppurchasertnview?Id=${id}&Mode=view`;
    case "cpur":
      return `/mix-purchase/edit-mixpur?Id=${id}&Mode=view`;
    case "csale":
      return `/mix/edit-mixdata?Id=${id}&Mode=view`;
    case "cpurrtn":
      return `/MixPurchaseReturn/edit-mixpurchasertndata?Id=${id}&Mode=view`;
    case "csalertn":
      return `/MixSaleReturn/edit-mixsalereturnParcel?Id=${id}&Mode=view`;
    case "cmemoout":
      return `/mix-memo/edit-mixmemo?Id=${id}&Mode=view`;
    case "cmemoin":
      return `/MixConsignment/edit-MixConsignment?Id=${id}&Mode=view`;
    case "jewtrn":
      // React route for jewellery stock edit (MVC: edit-jewellery-stock?ID=)
      return `/master/edit-Mounting-stock?ID=${id}&Mode=view`;
    default:
      return "";
  }
};

const CustomOption = (props) => (
  <components.Option {...props}>
    <div className="d-flex align-items-center gap-2" style={{ cursor: "pointer" }}>
      <input
        type="checkbox"
        className="form-check-input mt-0"
        checked={props.isSelected}
        onChange={() => null}
        style={{ cursor: "pointer" }}
      />
      <span style={{ fontSize: "13px" }}>{props.label}</span>
    </div>
  </components.Option>
);

const CustomMenuList = (props) => {
  const { selectProps } = props;
  const { onSelectAll, isAllSelected, t } = selectProps;

  return (
    <components.MenuList {...props}>
      <div
        className="px-3 py-2 border-bottom d-flex align-items-center gap-2 select-all-row"
        style={{
          cursor: "pointer",
          background: "var(--vz-tertiary-bg, #f8f9fa)",
          borderColor: "var(--vz-border-color, #dee2e6)"
        }}
        onClick={onSelectAll}
      >
        <input
          type="checkbox"
          className="form-check-input"
          checked={isAllSelected}
          onChange={() => null}
          style={{ cursor: "pointer" }}
        />
        <span
          className="fw-semibold text-uppercase"
          style={{ fontSize: "12px", color: "var(--vz-body-color, #495057)" }}
        >
          {t("SELECT ALL")}
        </span>
      </div>
      {props.children}
    </components.MenuList>
  );
};

const CustomValueContainer = ({ children, ...props }) => {
  const { selectProps } = props;
  const numSelected = selectProps.value ? selectProps.value.length : 0;
  const showSelectedText = numSelected > 0 && !selectProps.menuIsOpen;

  return (
    <components.ValueContainer {...props}>
      {showSelectedText && (
        <div
          className="position-absolute"
          style={{
            color: "var(--vz-body-color, #495057)",
            fontSize: "13px",
            left: "10px",
            pointerEvents: "none"
          }}
        >
          {numSelected} Selected
        </div>
      )}
      {children}
    </components.ValueContainer>
  );
};

const mapDropdownItems = (items) => {
  // MVC: SelectList(..., "ID", "ID") — value and text are both ID
  if (!Array.isArray(items)) return [];
  return items.map((item) => {
    const id = String(item.id || item.ID || item.name || item.Name || "");
    return { value: id, label: id };
  });
};

const ParcelStockRegisterReport = () => {
  const { t } = useTranslation();

  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);
  const [masterDropdowns, setMasterDropdowns] = useState({});
  const [reportRows, setReportRows] = useState([]);
  // TYPE (.chkType) — MVC default: none selected ("Select Types")
  const [selectedTypes, setSelectedTypes] = useState([]);
  // Transaction (.chkTypeall) — MVC cshtml checked: MEMOIN, PUR, MEMOOUT, SALE, STKTRN
  const [selectedTypesTrn, setSelectedTypesTrn] = useState(DEFAULT_TRANSACTION_TYPES);
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
  const [trnDropdownOpen, setTrnDropdownOpen] = useState(false);
  const typeDropdownRef = useRef(null);
  const trnDropdownRef = useRef(null);

  // MVC: rdCOGS checked by default; FromDate/ToDate both = today
  const [priceMode, setPriceMode] = useState("COGS");
  const todayYMD = useMemo(() => formatLocalDate(new Date()), []);
  const defaultFromDate = "2025-01-01";
  const [filters, setFilters] = useState({
    fromDate: defaultFromDate,
    toDate: todayYMD,
    shape: [],
    color: [],
    clarity: [],
    size: [],
    lotNo: "",
    showPrevYear: true // MVC CheckTaData checked
  });

  const [lotOptions, setLotOptions] = useState([]);
  const [loadingLots, setLoadingLots] = useState(false);
  const [lotSearchValue, setLotSearchValue] = useState("");

  const selectedLotValues = useMemo(() => normalizeLotNoList(filters.lotNo), [filters.lotNo]);

  const selectValue = useMemo(() => {
    return selectedLotValues.map((val) => {
      const match = lotOptions.find(
        (o) => String(o.value).toUpperCase() === val || String(o.label).toUpperCase() === val
      );
      return match || { value: val, label: val };
    });
  }, [lotOptions, selectedLotValues]);

  const isAllSelected = useMemo(() => {
    if (lotOptions.length === 0) return false;
    return lotOptions.every((option) => selectedLotValues.includes(option.value));
  }, [lotOptions, selectedLotValues]);

  const groupedForRender = useMemo(() => {
    const groupOrder = [];
    const grouped = new Map();
    reportRows.forEach((item) => {
      const key = item.lotNo || "Unknown StockID";
      if (!grouped.has(key)) {
        grouped.set(key, []);
        groupOrder.push(key);
      }
      grouped.get(key).push(item);
    });
    return { groupOrder, grouped };
  }, [reportRows]);

  const handleSelectAllLots = () => {
    if (isAllSelected) {
      const currentOptionValues = lotOptions.map((o) => o.value);
      const updated = selectedLotValues.filter((v) => !currentOptionValues.includes(v));
      setFilters((prev) => ({ ...prev, lotNo: updated.join("\n") }));
    } else {
      const currentOptionValues = lotOptions.map((o) => o.value);
      const union = Array.from(new Set([...selectedLotValues, ...currentOptionValues]));
      setFilters((prev) => ({ ...prev, lotNo: union.join("\n") }));
    }
  };

  const customStyles = useMemo(
    () => ({
      control: (provided) => ({
        ...provided,
        backgroundColor: "var(--vz-secondary-bg, #fff)",
        borderColor: "var(--vz-border-color, #ced4da)",
        color: "var(--vz-body-color, #495057)",
        minHeight: "36px"
      }),
      menu: (provided) => ({
        ...provided,
        backgroundColor: "var(--vz-secondary-bg, #fff)",
        color: "var(--vz-body-color, #495057)",
        border: "1px solid var(--vz-border-color, #dee2e6)",
        zIndex: 20
      }),
      menuList: (provided) => ({
        ...provided,
        backgroundColor: "var(--vz-secondary-bg, #fff)",
        color: "var(--vz-body-color, #495057)"
      }),
      option: (provided, state) => ({
        ...provided,
        backgroundColor: state.isFocused ? "#3b5de7" : "transparent",
        color: state.isFocused ? "#ffffff" : "var(--vz-body-color, #495057)",
        cursor: "pointer"
      })
    }),
    []
  );

  const getOptions = useCallback(
    (typeKey) => masterDropdowns[typeKey.toUpperCase()] || [],
    [masterDropdowns]
  );

  useEffect(() => {
    document.title = `${t("Parcel Stock History Report")} | ${t("Reports")}`;
  }, [t]);

  useEffect(() => {
    const handler = (e) => {
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(e.target)) {
        setTypeDropdownOpen(false);
      }
      if (trnDropdownRef.current && !trnDropdownRef.current.contains(e.target)) {
        setTrnDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const fetchDropdowns = async () => {
      setLoadingDropdowns(true);
      try {
        const res = await getParcelStockRegisterDropdowns();
        const ok = res?.Success ?? res?.success ?? true;
        if (ok === false) {
          toast.warning(res?.Message || res?.message || "Failed to load dropdown filters.");
          return;
        }

        const rawData = res?.data || res?.Data || res || {};

        const dict = {};

        if (Array.isArray(rawData)) {
          rawData.forEach((item) => {
            const rawType = item.type || item.Type || "";
            const type = String(rawType).toUpperCase();
            if (!dict[type]) dict[type] = [];
            dict[type].push({
              value: item.id || item.ID || item.name || item.Name,
              label:
                item.textName ||
                item.TextName ||
                item.text ||
                item.Text ||
                item.name ||
                item.id
            });
          });
        } else if (typeof rawData === "object" && rawData !== null) {
          // ParcelStockDropdownDto: { Shape/shape, Color/color, … }
          const keyMap = {
            SHAPE: ["Shape", "shape", "SHAPE"],
            COLOR: ["Color", "color", "COLOR"],
            CLARITY: ["Clarity", "clarity", "CLARITY"],
            SIZE: ["Size", "size", "SIZE"]
          };
          Object.entries(keyMap).forEach(([dictKey, aliases]) => {
            const list = aliases.map((k) => rawData[k]).find(Array.isArray) || [];
            dict[dictKey] = mapDropdownItems(list);
          });
        }

        setMasterDropdowns(dict);
      } catch (err) {
        console.error("Error loading dropdown filters:", err);
        toast.error(typeof err === "string" ? err : "Failed to load dropdown filters.");
      } finally {
        setLoadingDropdowns(false);
      }
    };

    fetchDropdowns();
  }, []);

  const fetchLotsList = useCallback(async (search = "") => {
    setLoadingLots(true);
    try {
      const response = await getParcelStockRegisterLots(search || "");
      const rawLots = Array.isArray(response)
        ? response
        : response?.data || response?.Data || [];

      // MVC Getparcealdiamonlotnods: option text = Name (used in textarea / report LotNo)
      const formatted = rawLots
        .map((item) => {
          const lotName = String(
            item.name || item.Name || item.text || item.Text || item.lotNo || item.LotNo || ""
          )
            .trim()
            .toUpperCase();
          if (!lotName) return null;
          return { value: lotName, label: lotName };
        })
        .filter(Boolean);

      // Keep unique by lot name
      const seen = new Set();
      setLotOptions(
        formatted.filter((o) => {
          if (seen.has(o.value)) return false;
          seen.add(o.value);
          return true;
        })
      );
    } catch (err) {
      console.error("Error loading lots list:", err);
    } finally {
      setLoadingLots(false);
    }
  }, []);

  const debouncedFetchLotsList = useMemo(() => debounce(fetchLotsList, 300), [fetchLotsList]);

  useEffect(() => {
    fetchLotsList("");
  }, [fetchLotsList]);

  const handleLotDropdownChange = (selectedOptions) => {
    // MVC: use option text/Name (uppercase), join with newline into textarea
    const values = selectedOptions
      ? selectedOptions
        .map((opt) => String(opt.label || opt.value || "").trim().toUpperCase())
        .filter(Boolean)
      : [];
    const unique = Array.from(new Set(values));
    setFilters((prev) => ({
      ...prev,
      lotNo: unique.join("\n")
    }));
  };

  const handleLotTextareaChange = (e) => {
    const value = e.target.value;
    setFilters((prev) => ({ ...prev, lotNo: value }));
    // MVC: keyup on txtLotNo reloads lot dropdown with multi-line search
    debouncedFetchLotsList(value);
  };

  const handleClear = () => {
    // Match MVC clear + document.ready defaults
    setHasSearched(false);
    setReportRows([]);
    setPriceMode("COGS");
    setSelectedTypes([]);
    setSelectedTypesTrn(DEFAULT_TRANSACTION_TYPES);
    setFilters({
      fromDate: todayYMD,
      toDate: todayYMD,
      shape: [],
      color: [],
      clarity: [],
      size: [],
      lotNo: "",
      showPrevYear: true
    });
  };

  const typeButtonText = useMemo(() => {
    if (selectedTypes?.includes("ALL")) return "All";
    if (selectedTypes && selectedTypes.length > 0) {
      return selectedTypes
        .filter((v) => v !== "ALL")
        .map((v) => trnTypeOptions.find((x) => x.value === v)?.label || v)
        .join(", ");
    }
    return "Select Types";
  }, [selectedTypes]);

  const trnButtonText = useMemo(() => {
    if (selectedTypesTrn?.includes("ALL")) return "ALL";
    if (selectedTypesTrn && selectedTypesTrn.length > 0) {
      return selectedTypesTrn
        .filter((v) => v !== "ALL")
        .map((v) => transactionTypeOptions.find((x) => x.value === v)?.label || v)
        .join(", ");
    }
    return "Select Transaction";
  }, [selectedTypesTrn]);

  const toggleCheckboxGroup = (options, current, setCurrent, value, checked) => {
    const nonAllValues = options.filter((x) => x.value !== "ALL").map((x) => x.value);

    if (value === "ALL") {
      setCurrent(checked ? ["ALL"] : []);
      return;
    }

    const base = current?.includes("ALL")
      ? nonAllValues.slice()
      : (current || []).filter((v) => v !== "ALL");

    let next = checked
      ? Array.from(new Set([...base, value]))
      : base.filter((v) => v !== value);

    if (next.length === nonAllValues.length) next = ["ALL"];
    setCurrent(next);
  };

  const toggleTypeValue = (value, checked) => {
    toggleCheckboxGroup(trnTypeOptions, selectedTypes, setSelectedTypes, value, checked);
  };

  const toggleTrnTypeValue = (value, checked) => {
    toggleCheckboxGroup(transactionTypeOptions, selectedTypesTrn, setSelectedTypesTrn, value, checked);
  };

  const handleReport = async () => {
    if (!filters.fromDate || !filters.toDate) {
      toast.warning("Please select From Date and To Date.");
      return;
    }

    setLoading(true);
    try {
      // Exact RadioValue values from MVC ParcelStockRegisterReport.cshtml
      const radioValueMap = {
        SalpurAvg: "sale-pur-avg-price",
        PurAvg: "pur-avg-price",
        MarketAvg: "MarketPrice",
        COGS: "COGS"
      };

      // Exact payload from MVC ParcelStockRegiReport() — no invented defaults
      const payload = {
        FromDate: filters.fromDate,
        ToDate: filters.toDate,
        Shape: filters.shape || [],
        Color: filters.color || [],
        Clarity: filters.clarity || [],
        Size: filters.size || [],
        LotNo: normalizeLotNoPayload(filters.lotNo),
        SalpurAvg: priceMode === "SalpurAvg",
        PurAvg: priceMode === "PurAvg",
        MarketAvg: priceMode === "MarketAvg",
        RadioValue: radioValueMap[priceMode] || "COGS",
        selectedTypes: selectedTypes || [],
        selectedTypesTrn: selectedTypesTrn || [],
        StkEff: !!filters.showPrevYear
      };

      const res = await getParcelStockHistoryReport(payload);
      const ok = res?.Success ?? res?.success ?? true;
      const reportData = res?.Data || res?.data || res?.reportData || [];

      if (!ok) {
        toast.warning(res?.Message || res?.message || res?.Data || "Failed to load report.");
        setReportRows([]);
        setHasSearched(true);
        return;
      }

      const rows = Array.isArray(reportData) ? reportData.map(normalizeReportRow) : [];
      setReportRows(rows);
      setHasSearched(true);
      if (rows.length === 0) {
        toast.info("No data available.");
      }
    } catch (err) {
      console.error("Error generating report:", err);
      const msg =
        typeof err === "string"
          ? err
          : err?.message || err?.Message || "Server Connection Problem..";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleNewSearch = () => {
    // MVC SetSearchDiv('search') — show filters again, keep last results for optional return
    setHasSearched(false);
  };

  const handleExport = async () => {
    if (!reportRows || reportRows.length === 0) {
      toast.warn("No data available to export.");
      return;
    }

    const groupOrder = [];
    const grouped = new Map();

    reportRows.forEach((item) => {
      const key = item.lotNo || "Unknown StockID";
      if (!grouped.has(key)) {
        grouped.set(key, []);
        groupOrder.push(key);
      }
      grouped.get(key).push(item);
    });

    const columns = [
      "TrnDate",
      "TrnType",
      "InvNo",
      "Particulars",
      "StockIn",
      "StockInPrice",
      "StockInAmount",
      "StockOut",
      "StockOutPrice",
      "StockOutAmount",
      "COGS",
      "BalanceStock",
      "BalancePrice",
      "BalanceAmount"
    ];

    const caratDecimals = 2;
    const amtDecimals = 2;
    const priceDecimals = 2;

    const grandTotals = {
      InCts: 0,
      InRate: 0,
      InAmount: 0,
      OutCts: 0,
      OutRate: 0,
      OutAmount: 0
    };

    const rows = [];
    const opStkDate = formatDateYMDToDMY(filters.fromDate);

    groupOrder.forEach((stockId) => {
      const items = grouped.get(stockId) || [];
      const subtotal = { InCts: 0, InRate: 0, InAmount: 0, OutCts: 0, OutRate: 0, OutAmount: 0 };

      rows.push([`StockID:${stockId}`, "", "", "", "", "", "", "", "", "", "", "", ""]);

      items.forEach((item) => {
        const trnDate = item.trntype === "OpStk" ? opStkDate : item.trnDate;
        rows.push([
          trnDate || "",
          item.trntype || "",
          item.invno ?? "",
          item.perticulors || "",
          fmtFixed(item.inCts, caratDecimals),
          fmtFixed(item.inRate, priceDecimals),
          fmtFixed(item.inAmount, amtDecimals),
          fmtFixed(item.outCts, caratDecimals),
          fmtFixed(item.outRate, priceDecimals),
          fmtFixed(item.outAmount, amtDecimals),
          item.cogs || 0,
          fmtFixed(item.balCts, caratDecimals),
          fmtFixed(item.balRate, priceDecimals),
          fmtFixed(item.balAmount, amtDecimals)
        ]);

        const inCts = Number(item.inCts || 0);
        const inRate = Number(item.inRate || 0);
        const inAmt = Number(item.inAmount || 0);
        const outCts = Number(item.outCts || 0);
        const outRate = Number(item.outRate || 0);
        const outAmt = Number(item.outAmount || 0);

        subtotal.InCts += inCts;
        subtotal.InRate += inRate;
        subtotal.InAmount += inAmt;
        subtotal.OutCts += outCts;
        subtotal.OutRate += outRate;
        subtotal.OutAmount += outAmt;

        grandTotals.InCts += inCts;
        grandTotals.InRate += inRate;
        grandTotals.InAmount += inAmt;
        grandTotals.OutCts += outCts;
        grandTotals.OutRate += outRate;
        grandTotals.OutAmount += outAmt;
      });

      rows.push([
        "Total:",
        "",
        "",
        "",
        subtotal.InCts.toFixed(caratDecimals),
        subtotal.InRate.toFixed(priceDecimals),
        subtotal.InAmount.toFixed(amtDecimals),
        subtotal.OutCts.toFixed(caratDecimals),
        subtotal.OutRate.toFixed(priceDecimals),
        subtotal.OutAmount.toFixed(amtDecimals),
        "",
        "",
        "",
        ""
      ]);
    });

    rows.push([
      "Grand Total:",
      "",
      "",
      "",
      grandTotals.InCts.toFixed(caratDecimals),
      grandTotals.InRate.toFixed(priceDecimals),
      grandTotals.InAmount.toFixed(amtDecimals),
      grandTotals.OutCts.toFixed(caratDecimals),
      grandTotals.OutRate.toFixed(priceDecimals),
      grandTotals.OutAmount.toFixed(amtDecimals),
      "",
      "",
      "",
      ""
    ]);

    await exportToExcel(columns, rows, "Stock_History", "Parcel-Stock-History");
  };

  const renderTable = () => {
    // MVC: "No data available."
    if (!reportRows || reportRows.length === 0) {
      return (
        <div className="text-center py-4" style={{ color: "red" }}>
          No data available.
        </div>
      );
    }

    const showCOGS = priceMode === "COGS";

    // MVC renderStockRegisterReportByStockID columns (+ COGS when radio is COGS)
    const columns = [
      { header: "TrnDate", key: "trnDate", numeric: false },
      { header: "TrnType", key: "trntype", numeric: false },
      { header: "InvNo", key: "invno", numeric: false },
      { header: "Particulars", key: "perticulors", numeric: false },
      { header: "StockIn", key: "inCts", numeric: true, sum: true },
      { header: "StockInPrice", key: "inRate", numeric: true, sum: true },
      { header: "StockInAmount", key: "inAmount", numeric: true, sum: true },
      { header: "StockOut", key: "outCts", numeric: true, sum: true },
      { header: "StockOutPrice", key: "outRate", numeric: true, sum: true },
      { header: "StockOutAmount", key: "outAmount", numeric: true, sum: true },
      ...(showCOGS ? [{ header: "COGS", key: "cogs", numeric: true, sum: true }] : []),
      { header: "BalanceStock", key: "balCts", numeric: true },
      { header: "BalancePrice", key: "balRate", numeric: true },
      { header: "BalanceAmount", key: "balAmount", numeric: true }
    ];

    const caratDecimals = 2;
    const amtDecimals = 2;
    const priceDecimals = 2;
    const sumKeys = columns.filter((c) => c.sum).map((c) => c.key);

    const grandTotals = {};
    sumKeys.forEach((k) => {
      grandTotals[k] = 0;
    });
    const opStkDate = formatDateYMDToDMY(filters.fromDate);

    const fmtCol = (key, val) => {
      if (key === "inCts" || key === "outCts" || key === "balCts") return fmtFixed(val, caratDecimals);
      if (key === "inAmount" || key === "outAmount" || key === "balAmount") return fmtFixed(val, amtDecimals);
      if (key === "inRate" || key === "outRate" || key === "balRate" || key === "cogs") {
        return fmtFixed(val, priceDecimals);
      }
      return val ?? "";
    };

    const decFor = (key) => {
      if (key === "inCts" || key === "outCts" || key === "balCts") return caratDecimals;
      if (key === "inAmount" || key === "outAmount" || key === "balAmount") return amtDecimals;
      return priceDecimals;
    };

    return (
      <div className="table-responsive">
        <div
          id="container-div"
          style={{
            maxHeight: 750,
            overflowY: "auto",
            overflowX: "auto",
            padding: 0,
            border: "1px solid #dcdcdc",
            borderRadius: 8,
            fontFamily: "Segoe UI, Tahoma, Geneva, Verdana, sans-serif",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)"
          }}
        >
          <table
            id="dynamic-stock-register-table"
            className="table table-bordered nowrap"
            style={{ marginBottom: 0, borderCollapse: "collapse", fontSize: 13, width: "100%" }}
          >
            <thead>
              <tr>
                {columns.map((c) => (
                  <th
                    key={c.key}
                    style={{
                      borderBottom: "1px solid #999",
                      color: "var(--vz-body-color, #000)",
                      fontWeight: 600,
                      padding: "8px 10px"
                    }}
                  >
                    {c.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groupedForRender.groupOrder.map((stockId) => {
                const items = groupedForRender.grouped.get(stockId) || [];
                const subtotal = {};
                sumKeys.forEach((k) => {
                  subtotal[k] = 0;
                });

                items.forEach((item) => {
                  sumKeys.forEach((k) => {
                    const n = Number(item[k] || 0);
                    subtotal[k] += n;
                    grandTotals[k] += n;
                  });
                });

                return (
                  <React.Fragment key={stockId}>
                    <tr className="group-header">
                      <td
                        colSpan={columns.length}
                        style={{
                          fontWeight: 700,
                          fontSize: 15,
                          padding: 10,
                          borderTop: "2px solid #b3b3b3",
                          borderBottom: "2px solid #b3b3b3",
                          color: "var(--vz-body-color, #000)",
                          textAlign: "left"
                        }}
                      >
                        <strong>StockID:</strong> {stockId}
                      </td>
                    </tr>

                    {items.map((item, idx) => (
                      <tr key={`${stockId}-${idx}`}>
                        {columns.map((col) => {
                          let val = item[col.key];

                          if (col.key === "trnDate") {
                            val = item.trntype === "OpStk" ? opStkDate : formatDateYMDToDMY(String(val || ""));
                          } else if (col.numeric) {
                            val = fmtCol(col.key, val);
                          }

                          if (col.key === "trntype") {
                            const trnType = val || "";
                            const invcode = item.invcode;
                            const url = resolveTransactionUrl(trnType, invcode);
                            const clickable = trnType !== "OpStk" && !!url;

                            return (
                              <td
                                key={col.key}
                                style={{
                                  textAlign: "right",
                                  cursor: clickable ? "pointer" : "default",
                                  textDecoration: clickable ? "underline" : "none",
                                  color: clickable ? "#007bff" : "var(--vz-body-color, inherit)"
                                }}
                                onClick={() => {
                                  if (clickable) window.open(url, "_blank");
                                }}
                              >
                                {trnType}
                              </td>
                            );
                          }

                          return (
                            <td
                              key={col.key}
                              style={{
                                textAlign: col.numeric || col.key === "trnDate" ? "right" : "center",
                                color: "var(--vz-body-color, inherit)",
                                whiteSpace: col.key === "trnDate" ? "nowrap" : undefined
                              }}
                            >
                              {val ?? ""}
                            </td>
                          );
                        })}
                      </tr>
                    ))}

                    <tr className="subtotal">
                      <td colSpan={3} style={{ textAlign: "left", fontWeight: "bold", padding: "10px 12px" }}>
                        Total:
                      </td>
                      {columns.slice(3).map((col) =>
                        sumKeys.includes(col.key) ? (
                          <td key={col.key} style={{ textAlign: "right", fontWeight: "bold" }}>
                            {subtotal[col.key].toFixed(decFor(col.key))}
                          </td>
                        ) : (
                          <td key={col.key} />
                        )
                      )}
                    </tr>
                  </React.Fragment>
                );
              })}

              <tr className="grand-total">
                <td colSpan={3} style={{ textAlign: "left", fontWeight: "bold", padding: "10px 12px" }}>
                  Grand Total:
                </td>
                {columns.slice(3).map((col) =>
                  sumKeys.includes(col.key) ? (
                    <td key={col.key} style={{ textAlign: "right", fontWeight: "bold" }}>
                      {grandTotals[col.key].toFixed(decFor(col.key))}
                    </td>
                  ) : (
                    <td key={col.key} />
                  )
                )}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <React.Fragment>
      <ToastContainer autoClose={2000} />
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title="Reports / Parcel Stock Register Report" pageTitle="Parcel Stock History Report" />

          {/* Top bar — matches Solitaire Stock History / MVC SetSearchDiv */}
          <div className="card d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between mb-3 p-3 rounded-3 shadow-sm border gap-2">
            <h5 className="mb-0 fw-bold text-primary d-flex align-items-center gap-2">
              <i
                className={hasSearched ? "ri-database-2-line fs-20 text-primary" : "ri-search-eye-line fs-20 text-primary"}
              />
              {hasSearched
                ? t("Parcel Stock History Report Results")
                : t("Parcel Stock History Report Filters")}
            </h5>
            <div className="d-flex gap-2">
              {!hasSearched ? (
                <>
                  <Button
                    style={{ backgroundColor: "#364574", borderColor: "#364574" }}
                    onClick={handleReport}
                    disabled={loading}
                    className="btn-sm px-3"
                  >
                    {loading ? t("Loading...") : t("Report")}
                  </Button>
                  <Button
                    color="soft-secondary"
                    style={{ backgroundColor: "#e2a9f31a", color: "#405189", border: "1px solid #dae0e5" }}
                    onClick={handleClear}
                    disabled={loading}
                    className="btn-sm px-3"
                  >
                    {t("Clear")}
                  </Button>
                  {reportRows.length > 0 && (
                    <Button
                      color="soft-info"
                      className="btn-sm px-3"
                      onClick={() => setHasSearched(true)}
                    >
                      {t("Previous Record")}
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <Button
                    style={{ backgroundColor: "#364574", borderColor: "#364574" }}
                    className="btn-sm px-3"
                    onClick={handleNewSearch}
                  >
                    {t("New Search")}
                  </Button>
                  {reportRows.length > 0 && (
                    <Button color="success" className="btn-sm px-3" onClick={handleExport}>
                      <i className="ri-file-excel-2-line align-middle me-1" />
                      {t("Excel")}
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>

          {!hasSearched && (
            <Card className="shadow-sm border-0 mb-3">
              <CardBody>
                <Row className="g-3">
                  <Col lg={10}>
                    <Row className="g-2">
                      <Col lg={2} md={4} sm={6}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1">{t("Date")}</Label>
                          <input
                            type="date"
                            className="form-control form-control-sm"
                            style={{ height: "35px" }}
                            value={filters.fromDate}
                            onChange={(e) => setFilters((prev) => ({ ...prev, fromDate: e.target.value }))}
                          />
                        </FormGroup>
                      </Col>
                      <Col lg={2} md={4} sm={6}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1">{t("To Date")}</Label>
                          <input
                            type="date"
                            className="form-control form-control-sm"
                            style={{ height: "35px" }}
                            value={filters.toDate}
                            onChange={(e) => setFilters((prev) => ({ ...prev, toDate: e.target.value }))}
                          />
                        </FormGroup>
                      </Col>
                      <Col md={2}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1">{t("Shape")}</Label>
                          <Select
                            isMulti
                            options={getOptions("SHAPE")}
                            value={getOptions("SHAPE").filter((o) => filters.shape.includes(o.value))}
                            onChange={(sel) => setFilters((prev) => ({ ...prev, shape: sel ? sel.map((x) => x.value) : [] }))}
                            isLoading={loadingDropdowns}
                            classNamePrefix="react-select"
                            styles={customStyles}
                            placeholder={t("Shape")}
                          />
                        </FormGroup>
                      </Col>
                      <Col md={2}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1">{t("Color")}</Label>
                          <Select
                            isMulti
                            options={getOptions("COLOR")}
                            value={getOptions("COLOR").filter((o) => filters.color.includes(o.value))}
                            onChange={(sel) => setFilters((prev) => ({ ...prev, color: sel ? sel.map((x) => x.value) : [] }))}
                            isLoading={loadingDropdowns}
                            classNamePrefix="react-select"
                            styles={customStyles}
                            placeholder={t("Color")}
                          />
                        </FormGroup>
                      </Col>
                      <Col md={2}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1">{t("Clarity")}</Label>
                          <Select
                            isMulti
                            options={getOptions("CLARITY")}
                            value={getOptions("CLARITY").filter((o) => filters.clarity.includes(o.value))}
                            onChange={(sel) => setFilters((prev) => ({ ...prev, clarity: sel ? sel.map((x) => x.value) : [] }))}
                            isLoading={loadingDropdowns}
                            classNamePrefix="react-select"
                            styles={customStyles}
                            placeholder={t("Clarity")}
                          />
                        </FormGroup>
                      </Col>
                      <Col md={2}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1">{t("Size")}</Label>
                          <Select
                            isMulti
                            options={getOptions("SIZE")}
                            value={getOptions("SIZE").filter((o) => filters.size.includes(o.value))}
                            onChange={(sel) => setFilters((prev) => ({ ...prev, size: sel ? sel.map((x) => x.value) : [] }))}
                            isLoading={loadingDropdowns}
                            classNamePrefix="react-select"
                            styles={customStyles}
                            placeholder={t("Size")}
                          />
                        </FormGroup>
                      </Col>
                    </Row>

                    <Row className="g-2 mt-2 align-items-center">
                      <Col lg={8} md={12}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1">&nbsp;</Label>
                          <div className="d-flex flex-wrap gap-3 align-items-center">
                            <label className="d-flex align-items-center gap-2" style={{ cursor: "pointer" }}>
                              <input
                                type="radio"
                                className="form-check-input"
                                name="priceMode"
                                checked={priceMode === "SalpurAvg"}
                                onChange={() => setPriceMode("SalpurAvg")}
                              />
                              <span className="fw-medium" style={{ fontSize: "13px" }}>{t("Sale/Pur Avg. Price")}</span>
                            </label>
                            <label className="d-flex align-items-center gap-2" style={{ cursor: "pointer" }}>
                              <input
                                type="radio"
                                className="form-check-input"
                                name="priceMode"
                                checked={priceMode === "PurAvg"}
                                onChange={() => setPriceMode("PurAvg")}
                              />
                              <span className="fw-medium" style={{ fontSize: "13px" }}>{t("Pur Avg. Price")}</span>
                            </label>
                            <label className="d-flex align-items-center gap-2" style={{ cursor: "pointer" }}>
                              <input
                                type="radio"
                                className="form-check-input"
                                name="priceMode"
                                checked={priceMode === "MarketAvg"}
                                onChange={() => setPriceMode("MarketAvg")}
                              />
                              <span className="fw-medium" style={{ fontSize: "13px" }}>{t("Market Price")}</span>
                            </label>
                            <label className="d-flex align-items-center gap-2" style={{ cursor: "pointer" }}>
                              <input
                                type="radio"
                                className="form-check-input"
                                name="priceMode"
                                checked={priceMode === "COGS"}
                                onChange={() => setPriceMode("COGS")}
                              />
                              <span className="fw-medium" style={{ fontSize: "13px" }}>{t("COGS")}</span>
                            </label>

                            <label className="d-flex align-items-center gap-2 ms-2" style={{ cursor: "pointer" }}>
                              <input
                                type="checkbox"
                                className="form-check-input"
                                checked={filters.showPrevYear}
                                onChange={(e) => setFilters((prev) => ({ ...prev, showPrevYear: e.target.checked }))}
                              />
                              <span className="fw-medium" style={{ fontSize: "13px" }}>{t("Show Previous Year")}</span>
                            </label>
                          </div>
                        </FormGroup>
                      </Col>

                      <Col lg={2} md={4} sm={6}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1">{t("Transaction")}</Label>
                          <div className="dropdown" ref={trnDropdownRef}>
                            <button
                              className={classnames("btn btn-outline-secondary btn-sm dropdown-toggle w-100 text-start text-truncate")}
                              type="button"
                              onClick={() => setTrnDropdownOpen((v) => !v)}
                              aria-expanded={trnDropdownOpen}
                            >
                              {trnButtonText}
                            </button>
                            {trnDropdownOpen && (
                              <div
                                className="dropdown-menu show checkbox-dropdown p-2"
                                style={{ minWidth: 200, maxHeight: 320, overflowY: "auto" }}
                              >
                                {transactionTypeOptions.map((opt) => {
                                  const isChecked = selectedTypesTrn?.includes("ALL")
                                    ? opt.value !== "ALL"
                                      ? true
                                      : selectedTypesTrn.includes("ALL")
                                    : selectedTypesTrn.includes(opt.value);
                                  const allChecked =
                                    opt.value === "ALL" ? selectedTypesTrn?.includes("ALL") : isChecked;

                                  return (
                                    <div
                                      key={opt.value}
                                      className="dropdown-item d-flex align-items-center gap-2"
                                      style={{ cursor: "pointer" }}
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <input
                                        type="checkbox"
                                        className="form-check-input mt-0"
                                        checked={allChecked}
                                        onChange={(e) => toggleTrnTypeValue(opt.value, e.target.checked)}
                                      />
                                      <span style={{ fontSize: "13px" }}>{opt.label}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </FormGroup>
                      </Col>

                      <Col lg={2} md={4} sm={6}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1">{t("TYPE")}</Label>

                          <div className="dropdown" ref={typeDropdownRef}>
                            <button
                              className={classnames("btn btn-outline-secondary btn-sm dropdown-toggle w-100 text-start text-truncate")}
                              type="button"
                              onClick={() => setTypeDropdownOpen((v) => !v)}
                              aria-expanded={typeDropdownOpen}
                            >
                              {typeButtonText}
                            </button>

                            {typeDropdownOpen && (
                              <div
                                className="dropdown-menu show checkbox-dropdown p-2"
                                style={{ minWidth: 200, maxHeight: 320, overflowY: "auto" }}
                              >
                                {trnTypeOptions.map((opt) => {
                                  const isChecked = selectedTypes?.includes("ALL")
                                    ? opt.value !== "ALL"
                                      ? true
                                      : selectedTypes.includes("ALL")
                                    : selectedTypes.includes(opt.value);

                                  const allChecked = opt.value === "ALL" ? selectedTypes?.includes("ALL") : isChecked;

                                  return (
                                    <div
                                      key={opt.value}
                                      className="dropdown-item d-flex align-items-center gap-2"
                                      style={{ cursor: "pointer" }}
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <input
                                        type="checkbox"
                                        className="form-check-input mt-0"
                                        checked={allChecked}
                                        onChange={(e) => toggleTypeValue(opt.value, e.target.checked)}
                                      />
                                      <span style={{ fontSize: "13px" }}>{opt.label}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </FormGroup>
                      </Col>
                    </Row>
                  </Col>

                  <Col lg={2}>
                    <FormGroup className="mb-2">
                      <Label className="fw-medium mb-1">{t("Enter Lot No")}</Label>
                      <Input
                        type="textarea"
                        name="lotNo"
                        value={filters.lotNo}
                        onChange={handleLotTextareaChange}
                        rows="6"
                        placeholder={t("Search by lot no")}
                        className="form-control-sm"
                        style={{ resize: "none" }}
                      />
                    </FormGroup>

                    <FormGroup className="mb-0">
                      <Label className="fw-medium mb-1 mt-1">{t("Show Lot No")}</Label>
                      <Select
                        isMulti
                        name="showLotNo"
                        options={lotOptions}
                        value={selectValue}
                        onChange={handleLotDropdownChange}
                        inputValue={lotSearchValue}
                        onInputChange={(newValue, actionMeta) => {
                          if (actionMeta.action === "input-change") {
                            setLotSearchValue(newValue);
                            debouncedFetchLotsList(newValue);
                          } else if (actionMeta.action === "menu-close") {
                            setLotSearchValue("");
                            debouncedFetchLotsList("");
                          }
                        }}
                        placeholder={t("Select Lot No")}
                        isLoading={loadingLots}
                        classNamePrefix="react-select"
                        closeMenuOnSelect={false}
                        components={{
                          Option: CustomOption,
                          MenuList: CustomMenuList,
                          MultiValue: () => null,
                          ValueContainer: CustomValueContainer
                        }}
                        isAllSelected={isAllSelected}
                        onSelectAll={handleSelectAllLots}
                        t={t}
                        isSearchable={true}
                        hideSelectedOptions={false}
                        styles={customStyles}
                      />
                    </FormGroup>
                  </Col>
                </Row>
              </CardBody>
            </Card>
          )}

          {hasSearched && (
            <Card className="shadow-sm border-0">
              <CardBody className="p-0">{renderTable()}</CardBody>
            </Card>
          )}
        </Container>
      </div>
    </React.Fragment>
  );
};

export default ParcelStockRegisterReport;