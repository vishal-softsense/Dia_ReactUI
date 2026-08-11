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
import Select, { components } from "react-select";
import classnames from "classnames";
import { toast, ToastContainer } from "react-toastify";

import BreadCrumb from "../../../Components/Common/BreadCrumb";
import { exportToExcel } from "../../../helpers/excel_helper";
import {
  getJewelleryStockHistoryReport,
  getJewelleryStockHistoryStockIds
} from "../../../helpers/fakebackend_helper";
import { useSettingReportDates } from "../../../Components/Hooks/useSettingReportDates";

const debounce = (func, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => func(...args), delay);
  };
};

const trnTypeOptions = [
  { value: "ALL", label: "All" },
  { value: "MEMOIN", label: "Memo In" },
  { value: "PUR", label: "Purchase" },
  { value: "MEMOOUT", label: "Memo Out" },
  { value: "SALE", label: "Sale" },
  { value: "STKTRN", label: "Stock Transfer" }
];

const detailedTypeOptions = [
  { value: "ALL", label: "All" },
  { value: "PUR", label: "Purchase" },
  { value: "SALE", label: "Sale" },
  { value: "PURRTN", label: "Purchase Return" },
  { value: "SALERTN", label: "Sale Return" },
  { value: "MEMOOUT", label: "Memo Out" },
  { value: "MEMOOUTRTN", label: "Memo Out Return" },
  { value: "MEMOIN", label: "Memo In" },
  { value: "MEMOINRTN", label: "Memo In Return" },
  { value: "GPUR", label: "Gold Purchase" },
  { value: "GPURRTN", label: "Gold Purchase Return" },
  { value: "GSALE", label: "Gold Sale" },
  { value: "GSALERTN", label: "Gold Sale Return" },
  { value: "GMEMOIN", label: "Gold Memo In" },
  { value: "GMEMOOUT", label: "Gold Memo Out" },
  { value: "GMEMOINRTN", label: "Gold Memo In Return" },
  { value: "GMEMOOUTRTN", label: "Gold Memo Out Return" },
  { value: "STKTRN", label: "Stock Transfer" }
];

const formatDateYMDToDMY = (dateStr) => {
  if (!dateStr) return "";
  const parts = String(dateStr).split("-");
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
};

const fmtFixed = (value, decimals) => {
  if (value === null || value === undefined || value === "") return "";
  const num = Number(value);
  if (Number.isNaN(num)) return "";
  return num.toFixed(decimals);
};

// Case-insensitive / format-insensitive helper for accessing API response properties
const getRowVal = (row, key) => {
  if (!row) return "";
  
  // Exact match
  if (row[key] !== undefined && row[key] !== null) return row[key];
  
  // camelCase variant
  const camelKey = key.charAt(0).toLowerCase() + key.slice(1);
  if (row[camelKey] !== undefined && row[camelKey] !== null) return row[camelKey];
  
  // Lowercase variant
  const lowerKey = key.toLowerCase();
  if (row[lowerKey] !== undefined && row[lowerKey] !== null) return row[lowerKey];
  
  // Custom case redirects
  if (key === "StockID") {
    if (row.stockID !== undefined && row.stockID !== null) return row.stockID;
    if (row.stockId !== undefined && row.stockId !== null) return row.stockId;
    if (row.lotNo !== undefined && row.lotNo !== null) return row.lotNo;
    if (row.lotno !== undefined && row.lotno !== null) return row.lotno;
  }
  
  if (key === "TrnType") {
    if (row.trntype !== undefined && row.trntype !== null) return row.trntype;
  }

  if (key === "TrnDate") {
    if (row.trndate !== undefined && row.trndate !== null) return row.trndate;
  }

  if (key === "Particulars") {
    if (row.particulars !== undefined && row.particulars !== null) return row.particular;
    if (row.particular !== undefined && row.particular !== null) return row.particular;
    if (row.partyName !== undefined && row.partyName !== null) return row.partyName;
    if (row.accName !== undefined && row.accName !== null) return row.accName;
    if (row.perticulors !== undefined && row.perticulors !== null) return row.perticulors;
  }
  
  return "";
};

// Custom Components for react-select Lot No Checkbox Dropdown
const CustomOption = (props) => {
  return (
    <components.Option {...props}>
      <div className="d-flex align-items-center gap-2" style={{ cursor: "pointer" }}>
        <input
          type="checkbox"
          className="form-check-input mt-0"
          checked={props.isSelected}
          onChange={() => null}
          style={{ cursor: "pointer" }}
        />
        <span style={{ fontSize: "13px" }}>
          {props.label}
        </span>
      </div>
    </components.Option>
  );
};

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
          borderColor: "var(--vz-border-color, #dee2e6)",
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
            pointerEvents: "none",
          }}
        >
          {numSelected} Selected
        </div>
      )}
      {children}
    </components.ValueContainer>
  );
};

const JewelleryStockHistoryReport = () => {
  const { t } = useTranslation();

  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const [reportRows, setReportRows] = useState([]);

  // Transaction types checkboxes selection
  const [selectedTypesTrn, setSelectedTypesTrn] = useState(["PUR", "SALE", "STKTRN"]);
  const [trnDropdownOpen, setTrnDropdownOpen] = useState(false);
  const trnDropdownRef = useRef(null);

  // Type checkboxes selection
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
  const typeDropdownRef = useRef(null);

  const [priceMode, setPriceMode] = useState("sale-pur-avg-price");
  const [stkEff, setStkEff] = useState(false);

  const { fromDate, toDate, getDates, mergeDates } = useSettingReportDates();

  const [filters, setFilters] = useState({
    fromDate,
    toDate,
    shape: [],
    color: [],
    clarity: [],
    size: [],
    lotNo: ""
  });

  const [lotOptions, setLotOptions] = useState([]);
  const [loadingLots, setLoadingLots] = useState(false);
  const [lotSearchValue, setLotSearchValue] = useState("");

  const selectedLotValues = useMemo(() => {
    return filters.lotNo
      ? filters.lotNo.split("\n").map((v) => v.trim()).filter(Boolean)
      : [];
  }, [filters.lotNo]);

  const selectValue = useMemo(() => {
    return selectedLotValues.map((val) => {
      const match = lotOptions.find((o) => o.value === val);
      return match || { value: val, label: String(val).toUpperCase() };
    });
  }, [lotOptions, selectedLotValues]);

  const isAllSelected = useMemo(() => {
    if (lotOptions.length === 0) return false;
    return lotOptions.every((option) => selectedLotValues.includes(option.value));
  }, [lotOptions, selectedLotValues]);

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

  const customStyles = useMemo(() => ({
    control: (provided) => ({
      ...provided,
      backgroundColor: "var(--vz-secondary-bg, #fff)",
      borderColor: "var(--vz-border-color, #ced4da)",
      color: "var(--vz-body-color, #495057)",
      minHeight: "31px",
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: "var(--vz-secondary-bg, #fff)",
      color: "var(--vz-body-color, #495057)",
      border: "1px solid var(--vz-border-color, #dee2e6)",
      zIndex: 20,
    }),
    menuList: (provided) => ({
      ...provided,
      backgroundColor: "var(--vz-secondary-bg, #fff)",
      color: "var(--vz-body-color, #495057)",
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isFocused ? "#3b5de7" : "transparent",
      color: state.isFocused ? "#ffffff" : "var(--vz-body-color, #495057)",
      cursor: "pointer",
      ":active": {
        backgroundColor: "#3b5de7",
      },
    }),
    input: (provided) => ({
      ...provided,
      color: "var(--vz-body-color, #495057)",
    }),
    placeholder: (provided) => ({
      ...provided,
      color: "var(--vz-secondary-color, #878a99)",
    }),
    singleValue: (provided) => ({
      ...provided,
      color: "var(--vz-body-color, #495057)",
    }),
    multiValue: (provided) => ({
      ...provided,
      backgroundColor: "transparent",
    }),
    indicatorsContainer: (provided) => ({
      ...provided,
      color: "var(--vz-body-color, #495057)",
    }),
    clearIndicator: (provided) => ({
      ...provided,
      color: "var(--vz-secondary-color, #878a99)",
      ":hover": {
        color: "var(--vz-body-color, #495057)",
      },
    }),
    dropdownIndicator: (provided) => ({
      ...provided,
      color: "var(--vz-secondary-color, #878a99)",
      ":hover": {
        color: "var(--vz-body-color, #495057)",
      },
    }),
  }), []);

  // Close checkbox dropdowns when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (trnDropdownRef.current && !trnDropdownRef.current.contains(e.target)) {
        setTrnDropdownOpen(false);
      }
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(e.target)) {
        setTypeDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    setFilters((prev) => mergeDates(prev));
  }, [fromDate, toDate, mergeDates]);

  const fetchLotsList = useCallback(async (search = "") => {
    setLoadingLots(true);
    try {
      const response = await getJewelleryStockHistoryStockIds(search);
      const rawLots = Array.isArray(response)
        ? response
        : (response?.data || response?.Data || []);

      const formatted = rawLots.map((item) => ({
        value: item.name || item.Name || item.id || item.ID || "",
        label: String(item.textName || item.TextName || item.name || item.Name || item.id || item.ID || "").toUpperCase()
      }));

      setLotOptions(formatted);
    } catch (err) {
      console.error("Error loading stock IDs list:", err);
    } finally {
      setLoadingLots(false);
    }
  }, []);

  const debouncedFetchLotsList = useMemo(() => debounce(fetchLotsList, 300), [fetchLotsList]);

  useEffect(() => {
    fetchLotsList("");
  }, [fetchLotsList]);

  const handleLotDropdownChange = (selectedOptions) => {
    const values = selectedOptions ? selectedOptions.map((opt) => opt.value) : [];
    setFilters((prev) => ({
      ...prev,
      lotNo: values.join("\n")
    }));
  };

  const handleClear = async () => {
    const d = await getDates();
    setHasSearched(false);
    setReportRows([]);
    setPriceMode("sale-pur-avg-price");
    setStkEff(false);
    setSelectedTypesTrn(["PUR", "SALE", "STKTRN"]);
    setSelectedTypes([]);
    setFilters(mergeDates({
      shape: [],
      color: [],
      clarity: [],
      size: [],
      lotNo: ""
    }, d));
  };

  const handleReport = async () => {
    setLoading(true);
    try {
      const payload = {
        FromDate: filters.fromDate,
        ToDate: filters.toDate,
        Shape: [],
        Color: [],
        Clarity: [],
        Size: [],
        LotNo: filters.lotNo,
        selectedTypes: selectedTypes,
        selectedTypesTrn: selectedTypesTrn,
        RadioValue: priceMode,
        StkEff: stkEff
      };

      const response = await getJewelleryStockHistoryReport(payload);
      if (response?.success) {
        setReportRows(response.Data || response.data || []);
        setHasSearched(true);
        toast.success(t("Report loaded successfully."));
      } else {
        toast.warning(response?.Data || response?.data || t("Failed to load report."));
      }
    } catch (err) {
      console.error(err);
      toast.error(t("Server Connection Problem.."));
    } finally {
      setLoading(false);
    }
  };

  const handleNewSearch = () => {
    setHasSearched(false);
    setReportRows([]);
  };

  const handleExcel = async () => {
    if (!reportRows || reportRows.length === 0) {
      toast.warning(t("No data available to export."));
      return;
    }

    const groupOrder = [];
    const grouped = new Map();

    reportRows.forEach((item) => {
      const key = getRowVal(item, "StockID") || "Unknown StockID";
      if (!grouped.has(key)) {
        grouped.set(key, []);
        groupOrder.push(key);
      }
      grouped.get(key).push(item);
    });

    const showCOGS = priceMode.toLowerCase() === "cogs";

    const columns = [
      "TrnDate",
      "TrnType",
      "Particulars",
      "StockIn",
      "StockInPrice",
      "StockInAmount",
      "StockOut",
      "StockOutPrice",
      "StockOutAmount",
      ...(showCOGS ? ["COGS"] : []),
      "BalanceStock",
      "BalancePrice",
      "BalanceAmount"
    ];

    const caratDecimals = 3;
    const amtDecimals = 2;
    const priceDecimals = 2;

    const grandTotals = {
      StockIn: 0,
      StockInAmount: 0,
      StockOut: 0,
      StockOutAmount: 0,
      COGS: 0
    };

    const rows = [];
    const opStkDate = formatDateYMDToDMY(filters.fromDate);

    groupOrder.forEach((stockId) => {
      const items = grouped.get(stockId) || [];
      const subtotal = { StockIn: 0, StockInAmount: 0, StockOut: 0, StockOutAmount: 0, COGS: 0 };

      rows.push([`StockID:${stockId}`, "", "", "", "", "", "", "", "", "", "", "", ...(showCOGS ? [""] : [])]);

      items.forEach((item) => {
        const trnDate = getRowVal(item, "TrnType") === "OpStk" ? opStkDate : formatDateYMDToDMY(getRowVal(item, "TrnDate"));
        const rowData = [
          trnDate || "",
          getRowVal(item, "TrnType") || "",
          getRowVal(item, "Particulars") || "",
          fmtFixed(getRowVal(item, "StockIn"), caratDecimals),
          fmtFixed(getRowVal(item, "StockInPrice"), priceDecimals),
          fmtFixed(getRowVal(item, "StockInAmount"), amtDecimals),
          fmtFixed(getRowVal(item, "StockOut"), caratDecimals),
          fmtFixed(getRowVal(item, "StockOutPrice"), priceDecimals),
          fmtFixed(getRowVal(item, "StockOutAmount"), amtDecimals)
        ];

        if (showCOGS) {
          rowData.push(fmtFixed(getRowVal(item, "COGS"), priceDecimals));
        }

        rowData.push(
          fmtFixed(getRowVal(item, "BalanceStock"), caratDecimals),
          fmtFixed(getRowVal(item, "BalancePrice"), priceDecimals),
          fmtFixed(getRowVal(item, "BalanceAmount"), amtDecimals)
        );

        rows.push(rowData);

        subtotal.StockIn += Number(getRowVal(item, "StockIn") || 0);
        subtotal.StockInAmount += Number(getRowVal(item, "StockInAmount") || 0);
        subtotal.StockOut += Number(getRowVal(item, "StockOut") || 0);
        subtotal.StockOutAmount += Number(getRowVal(item, "StockOutAmount") || 0);
        if (showCOGS) subtotal.COGS += Number(getRowVal(item, "COGS") || 0);

        grandTotals.StockIn += Number(getRowVal(item, "StockIn") || 0);
        grandTotals.StockInAmount += Number(getRowVal(item, "StockInAmount") || 0);
        grandTotals.StockOut += Number(getRowVal(item, "StockOut") || 0);
        grandTotals.StockOutAmount += Number(getRowVal(item, "StockOutAmount") || 0);
        if (showCOGS) grandTotals.COGS += Number(getRowVal(item, "COGS") || 0);
      });

      const subtotalRow = [
        "Total:",
        "",
        "",
        subtotal.StockIn.toFixed(caratDecimals),
        "",
        subtotal.StockInAmount.toFixed(amtDecimals),
        subtotal.StockOut.toFixed(caratDecimals),
        "",
        subtotal.StockOutAmount.toFixed(amtDecimals)
      ];

      if (showCOGS) {
        subtotalRow.push(subtotal.COGS.toFixed(priceDecimals));
      }

      subtotalRow.push("", "", "");
      rows.push(subtotalRow);
    });

    const grandTotalRow = [
      "Grand Total:",
      "",
      "",
      grandTotals.StockIn.toFixed(caratDecimals),
      "",
      grandTotals.StockInAmount.toFixed(amtDecimals),
      grandTotals.StockOut.toFixed(caratDecimals),
      "",
      grandTotals.StockOutAmount.toFixed(amtDecimals)
    ];

    if (showCOGS) {
      grandTotalRow.push(grandTotals.COGS.toFixed(priceDecimals));
    }

    grandTotalRow.push("", "", "");
    rows.push(grandTotalRow);

    await exportToExcel(columns, rows, "JewStock-History", "JewStock-History");
  };

  const trnButtonText = useMemo(() => {
    if (selectedTypesTrn?.includes("ALL")) return "ALL";
    if (selectedTypesTrn && selectedTypesTrn.length > 0) {
      return selectedTypesTrn
        .filter((v) => v !== "ALL")
        .map((v) => trnTypeOptions.find((x) => x.value === v)?.label || v)
        .join(", ");
    }
    return "Select Transaction";
  }, [selectedTypesTrn]);

  const typeButtonText = useMemo(() => {
    if (selectedTypes?.includes("ALL")) return "All";
    if (selectedTypes && selectedTypes.length > 0) {
      return selectedTypes
        .filter((v) => v !== "ALL")
        .map((v) => detailedTypeOptions.find((x) => x.value === v)?.label || v)
        .join(", ");
    }
    return "Select Types";
  }, [selectedTypes]);

  const toggleTrnValue = (value, checked) => {
    const nonAllValues = trnTypeOptions.filter((x) => x.value !== "ALL").map((x) => x.value);

    if (value === "ALL") {
      setSelectedTypesTrn(checked ? ["ALL"] : []);
      return;
    }

    const current = selectedTypesTrn?.includes("ALL")
      ? nonAllValues.slice()
      : (selectedTypesTrn || []).filter((v) => v !== "ALL");

    let next = checked ? Array.from(new Set([...current, value])) : current.filter((v) => v !== value);

    if (next.length === nonAllValues.length) next = ["ALL"];

    setSelectedTypesTrn(next);
  };

  const toggleTypeValue = (value, checked) => {
    const nonAllValues = detailedTypeOptions.filter((x) => x.value !== "ALL").map((x) => x.value);

    if (value === "ALL") {
      setSelectedTypes(checked ? ["ALL"] : []);
      return;
    }

    const current = selectedTypes?.includes("ALL")
      ? nonAllValues.slice()
      : (selectedTypes || []).filter((v) => v !== "ALL");

    let next = checked ? Array.from(new Set([...current, value])) : current.filter((v) => v !== value);

    if (next.length === nonAllValues.length) next = ["ALL"];

    setSelectedTypes(next);
  };

  const groupedForRender = useMemo(() => {
    const groupOrder = [];
    const grouped = new Map();
    reportRows.forEach((item) => {
      const key = getRowVal(item, "StockID") || "Unknown StockID";
      if (!grouped.has(key)) {
        grouped.set(key, []);
        groupOrder.push(key);
      }
      grouped.get(key).push(item);
    });
    return { groupOrder, grouped };
  }, [reportRows]);

  const renderTable = () => {
    if (!reportRows || reportRows.length === 0) return null;

    const showCOGS = priceMode.toLowerCase() === "cogs";

    const columns = [
      { header: t("TrnDate"), key: "TrnDate", align: "center" },
      { header: t("TrnType"), key: "TrnType", align: "center" },
      { header: t("Particulars"), key: "Particulars", align: "left" },
      { header: t("StockIn"), key: "StockIn", align: "right" },
      { header: t("StockInPrice"), key: "StockInPrice", align: "right" },
      { header: t("StockInAmount"), key: "StockInAmount", align: "right" },
      { header: t("StockOut"), key: "StockOut", align: "right" },
      { header: t("StockOutPrice"), key: "StockOutPrice", align: "right" },
      { header: t("StockOutAmount"), key: "StockOutAmount", align: "right" },
      ...(showCOGS ? [{ header: t("COGS"), key: "COGS", align: "right" }] : []),
      { header: t("BalanceStock"), key: "BalanceStock", align: "right" },
      { header: t("BalancePrice"), key: "BalancePrice", align: "right" },
      { header: t("BalanceAmount"), key: "BalanceAmount", align: "right" }
    ];

    const caratDecimals = 3;
    const amtDecimals = 2;
    const priceDecimals = 2;

    const grandTotals = { StockIn: 0, StockInAmount: 0, StockOut: 0, StockOutAmount: 0, COGS: 0 };
    const opStkDate = formatDateYMDToDMY(filters.fromDate);

    return (
      <div className="premium-table-container">
        <table className="premium-table">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key} style={{ textAlign: c.align }}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groupedForRender.groupOrder.map((stockId) => {
              const items = groupedForRender.grouped.get(stockId) || [];
              const subtotal = { StockIn: 0, StockInAmount: 0, StockOut: 0, StockOutAmount: 0, COGS: 0 };

              items.forEach((item) => {
                subtotal.StockIn += Number(getRowVal(item, "StockIn") || 0);
                subtotal.StockInAmount += Number(getRowVal(item, "StockInAmount") || 0);
                subtotal.StockOut += Number(getRowVal(item, "StockOut") || 0);
                subtotal.StockOutAmount += Number(getRowVal(item, "StockOutAmount") || 0);
                if (showCOGS) subtotal.COGS += Number(getRowVal(item, "COGS") || 0);

                grandTotals.StockIn += Number(getRowVal(item, "StockIn") || 0);
                grandTotals.StockInAmount += Number(getRowVal(item, "StockInAmount") || 0);
                grandTotals.StockOut += Number(getRowVal(item, "StockOut") || 0);
                grandTotals.StockOutAmount += Number(getRowVal(item, "StockOutAmount") || 0);
                if (showCOGS) grandTotals.COGS += Number(getRowVal(item, "COGS") || 0);
              });

              return (
                <React.Fragment key={stockId}>
                  <tr className="group-header">
                    <td colSpan={columns.length} style={{ textAlign: "left" }}>
                      <span className="fw-semibold text-body" style={{ fontSize: "13px" }}>
                        {t("Stock ID")}:
                      </span>
                      <span className="badge bg-primary-subtle text-primary fs-12 px-3 py-1 rounded-pill ms-2">
                        {stockId}
                      </span>
                    </td>
                  </tr>

                  {items.map((item, idx) => {
                    return (
                      <tr key={`${stockId}-${idx}`}>
                        {columns.map((col) => {
                          let val = getRowVal(item, col.key);

                          if (col.key === "TrnDate" && getRowVal(item, "TrnType") === "OpStk") {
                            val = opStkDate;
                          } else if (col.key === "TrnDate") {
                            val = formatDateYMDToDMY(val);
                          }

                          // Decimals
                          if (col.key === "StockIn" || col.key === "StockOut" || col.key === "BalanceStock") {
                            val = fmtFixed(val, caratDecimals);
                          } else if (col.key === "StockInPrice" || col.key === "StockOutPrice" || col.key === "BalancePrice" || col.key === "COGS") {
                            val = fmtFixed(val, priceDecimals);
                          } else if (col.key === "StockInAmount" || col.key === "StockOutAmount" || col.key === "BalanceAmount") {
                            val = fmtFixed(val, amtDecimals);
                          }

                          if (col.key === "TrnType") {
                            const trnType = val || "";
                            const invcode = getRowVal(item, "invcode");
                            const clickable = trnType !== "OpStk" && invcode;

                            return (
                              <td key={col.key} style={{ textAlign: "center" }}>
                                <span
                                  className={classnames("badge px-2 py-1.5 fs-11 fw-bold trn-badge", { "trn-badge-clickable": clickable })}
                                  onClick={() => {
                                    if (!clickable) return;
                                    const lower = String(trnType).toLowerCase();
                                    let url = "";
                                    if (lower === "pjew" || lower === "pur") {
                                      url = `../jewpurchase/edit-jew-purchase?Id=${invcode}&Mode=view`;
                                    } else if (lower === "sjew" || lower === "sale") {
                                      url = `../jewsale/edit-jew-sale?Id=${invcode}&Mode=view`;
                                    } else if (lower === "jmemoin" || lower === "memoin") {
                                      url = `../JewConsignmentIn/edit-Con?Id=${invcode}&Mode=view`;
                                    } else if (lower === "jmemoout" || lower === "memoout") {
                                      url = `../jewMemo/edit-jew-Memo?Id=${invcode}&Mode=view`;
                                    }
                                    if (url) window.open(url, "_blank");
                                  }}
                                >
                                  {trnType}
                                </span>
                              </td>
                            );
                          }

                          return (
                            <td key={col.key} style={{ textAlign: col.align }}>
                              {val ?? ""}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}

                  <tr className="subtotal">
                    <td colSpan={3} style={{ textAlign: "left" }}>
                      {t("Total:")}
                    </td>
                    <td style={{ textAlign: "right" }}>{subtotal.StockIn.toFixed(caratDecimals)}</td>
                    <td />
                    <td style={{ textAlign: "right" }}>{subtotal.StockInAmount.toFixed(amtDecimals)}</td>
                    <td style={{ textAlign: "right" }}>{subtotal.StockOut.toFixed(caratDecimals)}</td>
                    <td />
                    <td style={{ textAlign: "right" }}>{subtotal.StockOutAmount.toFixed(amtDecimals)}</td>
                    {showCOGS && (
                      <td style={{ textAlign: "right" }}>{subtotal.COGS.toFixed(priceDecimals)}</td>
                    )}
                    <td />
                    <td />
                    <td />
                  </tr>
                </React.Fragment>
              );
            })}

            <tr className="grand-total">
              <td colSpan={3} style={{ textAlign: "left" }}>
                {t("Grand Total:")}
              </td>
              <td style={{ textAlign: "right" }}>{grandTotals.StockIn.toFixed(caratDecimals)}</td>
              <td />
              <td style={{ textAlign: "right" }}>{grandTotals.StockInAmount.toFixed(amtDecimals)}</td>
              <td style={{ textAlign: "right" }}>{grandTotals.StockOut.toFixed(caratDecimals)}</td>
              <td />
              <td style={{ textAlign: "right" }}>{grandTotals.StockOutAmount.toFixed(amtDecimals)}</td>
              {showCOGS && (
                <td style={{ textAlign: "right" }}>{grandTotals.COGS.toFixed(priceDecimals)}</td>
              )}
              <td />
              <td />
              <td />
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  document.title = `${t("Jewellery Stock History Report")} | ${t("Reports")}`;

  return (
    <React.Fragment>
      <style>{`
        /* Premium Custom Table Styles with Static (Sticky) Header & Footer */
        .premium-table-container {
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
          border: 1px solid var(--vz-border-color, #e9ebec);
          border-radius: 8px;
          max-height: 650px;
          overflow-y: auto;
          overflow-x: auto;
          background-color: var(--vz-secondary-bg, #fff) !important;
          margin-bottom: 20px;
        }
        .premium-table {
          width: 100%;
          border-collapse: collapse;
          font-family: "Inter", "Segoe UI", system-ui, sans-serif;
          font-size: 13px;
          background-color: var(--vz-secondary-bg, #fff) !important;
        }
        .premium-table thead th {
          position: sticky;
          top: 0;
          z-index: 12;
          background-color: var(--vz-light, #f3f3f9) !important;
          color: var(--vz-body-color, #495057) !important;
          font-weight: 700;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          padding: 16px 16px;
          border-bottom: 2px solid var(--vz-border-color, #e9ebec) !important;
          box-shadow: inset 0 -1px 0 var(--vz-border-color, #e9ebec);
        }
        .premium-table tbody tr {
          border-bottom: 1px solid var(--vz-border-color, #f3f3f9);
          transition: background-color 0.2s ease;
          background-color: var(--vz-secondary-bg, #fff) !important;
        }
        .premium-table tbody tr:hover:not(.group-header):not(.subtotal):not(.grand-total) {
          background-color: rgba(64, 81, 137, 0.02);
        }
        .premium-table td {
          padding: 10px 16px;
          vertical-align: middle;
          background-color: var(--vz-secondary-bg, #fff) !important;
          color: var(--vz-body-color, #495057) !important;
          border-bottom: 1px solid var(--vz-border-color, #eff2f7) !important;
        }
        
        /* Group Header */
        .premium-table tr.group-header td {
          background-color: var(--vz-light, #f3f3f9) !important;
          color: var(--vz-body-color, #495057) !important;
          border-top: 1px solid var(--vz-border-color, #e9ebec) !important;
          border-bottom: 1px solid var(--vz-border-color, #e9ebec) !important;
          padding: 12px 16px;
        }

        /* Subtotal Row */
        .premium-table tr.subtotal td {
          background-color: var(--vz-light, #f3f3f9) !important;
          font-weight: 700;
          font-size: 13px;
          color: var(--vz-heading-color, #343a40) !important;
          border-top: 1px solid var(--vz-border-color, #e9ebec) !important;
          border-bottom: 1px solid var(--vz-border-color, #e9ebec) !important;
        }

        /* Grand Total Row (Sticky Footer) */
        .premium-table tr.grand-total {
          position: sticky;
          bottom: 0;
          z-index: 11;
          box-shadow: 0 -3px 6px rgba(0, 0, 0, 0.06);
        }
        .premium-table tr.grand-total td {
          background-color: var(--vz-secondary-bg, #fff) !important;
          font-weight: 800;
          font-size: 13px;
          color: var(--vz-heading-color, #343a40) !important;
          border-top: 1px solid var(--vz-border-color, #e9ebec) !important;
          border-bottom: 3px double var(--vz-heading-color, #343a40) !important;
        }

        /* Transaction Badge exactly matching reference screenshot style */
        .trn-badge {
          background-color: var(--vz-light, #f3f3f9) !important;
          color: var(--vz-link-color, #3b5de7) !important;
          border: 1px solid var(--vz-border-color, #e9ebec) !important;
          padding: 4px 10px;
          border-radius: 4px;
          font-weight: 700;
          font-size: 11px;
          letter-spacing: 0.3px;
          display: inline-block;
          text-align: center;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .trn-badge-clickable {
          cursor: pointer;
          text-decoration: none !important;
        }
        .trn-badge-clickable:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        }
      `}</style>

      <ToastContainer />

      <div className="page-content">
        <Container fluid>
          <BreadCrumb title={t("Jew Stock Register Report")} pageTitle={t("Jew Reports")} />

          {/* Controls Bar */}
          <div className="card stock-search-header-bar d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between mb-3 p-3 rounded-3 shadow-sm border gap-2">
            <h5 className="mb-0 fw-bold text-primary d-flex align-items-center gap-2">
              <i className={hasSearched ? "ri-database-2-line fs-20 text-primary" : "ri-search-eye-line fs-20 text-primary"}></i>
              {hasSearched ? t("Jewellery Stock History Results") : t("Jewellery Stock History Filters")}
            </h5>
            <div className="d-flex gap-2">
              {!hasSearched ? (
                <>
                  <Button color="primary" className="btn-sm rounded-2 px-3 py-1" onClick={handleReport} disabled={loading}>
                    {loading ? t("Loading...") : t("Report")}
                  </Button>
                  <Button color="soft-secondary" className="btn-sm rounded-2 px-3 py-1" onClick={handleClear} disabled={loading}>
                    {t("Clear")}
                  </Button>
                </>
              ) : (
                <>
                  <Button color="primary" className="btn-sm rounded-2 px-3 py-1" onClick={handleNewSearch}>
                    {t("New Search")}
                  </Button>
                  {reportRows.length > 0 && (
                    <Button color="success" className="btn-sm rounded-2 px-3 py-1" onClick={handleExcel}>
                      <i className="ri-file-excel-2-line align-middle me-1"></i>
                      {t("Excel")}
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>

          {!hasSearched && (
            <Card className="shadow-lg border-0 rounded-3 mb-4">
              <CardBody className="bg-light-subtle">
                <Row className="g-3">
                  <Col md={10}>
                    <Row className="g-3 mb-3">
                      <Col md={2}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1 small text-uppercase">{t("Date")}</Label>
                          <input
                            type="date"
                            className="form-control form-control-sm"
                            style={{ height: "35px" }}
                            value={filters.fromDate}
                            onChange={(e) => setFilters((prev) => ({ ...prev, fromDate: e.target.value }))}
                          />
                        </FormGroup>
                      </Col>
                      <Col md={2}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1 small text-uppercase">{t("To Date")}</Label>
                          <input
                            type="date"
                            className="form-control form-control-sm"
                            style={{ height: "35px" }}
                            value={filters.toDate}
                            onChange={(e) => setFilters((prev) => ({ ...prev, toDate: e.target.value }))}
                          />
                        </FormGroup>
                      </Col>
                      <Col md={8} className="d-flex align-items-end">
                        <FormGroup className="mb-0 w-100">
                          <div className="d-flex flex-wrap gap-4 align-items-center pb-1">
                            <label className="d-flex align-items-center gap-2 mb-0" style={{ cursor: "pointer" }}>
                              <input
                                type="radio"
                                className="form-check-input"
                                checked={priceMode === "sale-pur-avg-price"}
                                onChange={() => setPriceMode("sale-pur-avg-price")}
                              />
                              <span className="fw-medium" style={{ fontSize: "13px" }}>{t("Sale/Purchase Average Price")}</span>
                            </label>
                            <label className="d-flex align-items-center gap-2 mb-0" style={{ cursor: "pointer" }}>
                              <input
                                type="radio"
                                className="form-check-input"
                                checked={priceMode === "pur-avg-price"}
                                onChange={() => setPriceMode("pur-avg-price")}
                              />
                              <span className="fw-medium" style={{ fontSize: "13px" }}>{t("Average Purchase Price")}</span>
                            </label>
                            <label className="d-flex align-items-center gap-2 mb-0" style={{ cursor: "pointer" }}>
                              <input
                                type="radio"
                                className="form-check-input"
                                checked={priceMode === "MarketPrice"}
                                onChange={() => setPriceMode("MarketPrice")}
                              />
                              <span className="fw-medium" style={{ fontSize: "13px" }}>{t("Market Price")}</span>
                            </label>
                            <label className="d-flex align-items-center gap-2 mb-0" style={{ cursor: "pointer" }}>
                              <input
                                type="radio"
                                className="form-check-input"
                                checked={priceMode === "COGS"}
                                onChange={() => setPriceMode("COGS")}
                              />
                              <span className="fw-medium" style={{ fontSize: "13px" }}>{t("COGS")}</span>
                            </label>
                          </div>
                        </FormGroup>
                      </Col>
                    </Row>

                    <Row className="g-3">
                      <Col md={2}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1 small text-uppercase">{t("Transaction")}</Label>
                          <div className="dropdown" ref={trnDropdownRef}>
                            <button
                              className="btn btn-outline-secondary btn-sm dropdown-toggle w-100 text-start text-truncate"
                              type="button"
                              onClick={() => setTrnDropdownOpen((v) => !v)}
                              aria-expanded={trnDropdownOpen}
                              style={{ height: "35px" }}
                            >
                              {trnButtonText}
                            </button>
                            {trnDropdownOpen && (
                              <div
                                className="dropdown-menu show checkbox-dropdown p-2"
                                style={{ minWidth: 200, maxHeight: 320, overflowY: "auto", zIndex: 1000 }}
                              >
                                {trnTypeOptions.map((opt) => {
                                  const isChecked = selectedTypesTrn?.includes("ALL")
                                    ? opt.value !== "ALL" ? true : selectedTypesTrn.includes("ALL")
                                    : selectedTypesTrn.includes(opt.value);

                                  const allChecked = opt.value === "ALL" ? selectedTypesTrn?.includes("ALL") : isChecked;

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
                                        onChange={(e) => toggleTrnValue(opt.value, e.target.checked)}
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
                      <Col md={2}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1 small text-uppercase">{t("Type")}</Label>
                          <div className="dropdown" ref={typeDropdownRef}>
                            <button
                              className="btn btn-outline-secondary btn-sm dropdown-toggle w-100 text-start text-truncate"
                              type="button"
                              onClick={() => setTypeDropdownOpen((v) => !v)}
                              aria-expanded={typeDropdownOpen}
                              style={{ height: "35px" }}
                            >
                              {typeButtonText}
                            </button>
                            {typeDropdownOpen && (
                              <div
                                className="dropdown-menu show checkbox-dropdown p-2"
                                style={{ minWidth: 200, maxHeight: 320, overflowY: "auto", zIndex: 1000 }}
                              >
                                {detailedTypeOptions.map((opt) => {
                                  const isChecked = selectedTypes?.includes("ALL")
                                    ? opt.value !== "ALL" ? true : selectedTypes.includes("ALL")
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
                      <Col md={8} className="d-flex align-items-center">
                        <FormGroup className="mb-0 d-flex align-items-center gap-2" style={{ cursor: "pointer" }}>
                          <input
                            type="checkbox"
                            id="chkStkEff"
                            className="form-check-input mt-0"
                            checked={stkEff}
                            onChange={(e) => setStkEff(e.target.checked)}
                            style={{ cursor: "pointer" }}
                          />
                          <Label for="chkStkEff" className="mb-0 fw-semibold text-muted" style={{ cursor: "pointer", fontSize: "13px" }}>
                            {t("Show Previous Year")}
                          </Label>
                        </FormGroup>
                      </Col>
                    </Row>
                  </Col>

                  <Col md={2} className="d-flex flex-column justify-content-between">
                    <FormGroup className="mb-2">
                      <Label className="fw-medium mb-1 small text-uppercase">{t("Enter Stock ID")}</Label>
                      <Input
                        type="textarea"
                        name="lotNo"
                        value={filters.lotNo}
                        onChange={(e) => setFilters((prev) => ({ ...prev, lotNo: e.target.value }))}
                        rows="4"
                        placeholder={t("Search by Stock ID")}
                        className="form-control-sm"
                        style={{ resize: "none" }}
                      />
                    </FormGroup>
                    <FormGroup className="mb-0">
                      <Label className="fw-medium mb-1 small text-uppercase">{t("Show Stock ID")}</Label>
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
                        placeholder={t("Select StockID")}
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
            <Card className="shadow-lg border-0 rounded-3 mb-4">
              <CardBody className="p-0">
                {renderTable()}
              </CardBody>
            </Card>
          )}
        </Container>
      </div>
    </React.Fragment>
  );
};

export default JewelleryStockHistoryReport;
