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
import Flatpickr from "react-flatpickr";
import classnames from "classnames";
import { toast, ToastContainer } from "react-toastify";

import BreadCrumb from "../../../Components/Common/BreadCrumb";
import { exportToExcel } from "../../../helpers/excel_helper";
import {
  getSolitaireStockHistoryReport,
  getSolitaireStockSearchDropdowns,
  getSolitaireAdminLots
} from "../../../helpers/fakebackend_helper";

const debounce = (func, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => func(...args), delay);
  };
};

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
  { value: "STKTRN", label: "Stock Transfer" },
  { value: "PARTYHOLD", label: "Party Hold" },
  { value: "PARTYHOLDRTN", label: "Party Hold Return" }
];

const formatDateYMDToDMY = (dateStr) => {
  if (!dateStr) return "";
  const parts = String(dateStr).split("-");
  if (parts.length !== 3) return dateStr;
  // yyyy-mm-dd → dd-mm-yyyy
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
};

const fmtFixed = (value, decimals) => {
  if (value === null || value === undefined || value === "") return "";
  const num = Number(value);
  if (Number.isNaN(num)) return "";
  return num.toFixed(decimals);
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

const SolitaireStockHistoryReport = () => {
  const { t } = useTranslation();

  // UI state
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const [loadingDropdowns, setLoadingDropdowns] = useState(false);
  const [masterDropdowns, setMasterDropdowns] = useState({});

  const [reportRows, setReportRows] = useState([]);

  const [selectedTypes, setSelectedTypes] = useState(["ALL"]); // if user unchecks everything, we will default to ALL at submit time
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
  const typeDropdownRef = useRef(null);

  // Price mode (MVC: default SalpurAvg=true)
  const [priceMode, setPriceMode] = useState("SalpurAvg"); // SalpurAvg | PurAvg | MarketAvg

  const todayYMD = useMemo(() => new Date().toISOString().split("T")[0], []);
  const defaultFromDate = "2025-01-01";

  const [filters, setFilters] = useState({
    fromDate: defaultFromDate,
    toDate: todayYMD,
    shape: [],
    color: [],
    clarity: [],
    size: [],
    lotNo: ""
  });

  // Lot No dropdown (optional selection + sync with textarea)
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

  const getOptions = useCallback(
    (typeKey) => masterDropdowns[typeKey.toUpperCase()] || [],
    [masterDropdowns]
  );

  // Dropdown open/close
  useEffect(() => {
    const handler = (e) => {
      if (!typeDropdownRef.current) return;
      if (typeDropdownRef.current.contains(e.target)) return;
      setTypeDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Fetch master dropdowns used by the filter selects
  useEffect(() => {
    const fetchDropdowns = async () => {
      setLoadingDropdowns(true);
      try {
        const res = await getSolitaireStockSearchDropdowns();
        const rawData = res?.data || res?.Data || res || [];

        if (Array.isArray(rawData)) {
          const dict = {};
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
                item.id ||
                item.ID
            });
          });
          setMasterDropdowns(dict);
        } else {
          toast.error("Failed to load dropdown data.");
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load dropdown filters.");
      } finally {
        setLoadingDropdowns(false);
      }
    };

    fetchDropdowns();
  }, []);

  const fetchLotsList = useCallback(async (search = "") => {
    setLoadingLots(true);
    try {
      const response = await getSolitaireAdminLots(search);
      const rawLots = Array.isArray(response)
        ? response
        : (response?.data || response?.Data || []);

      const formatted = rawLots.map((item) => ({
        value: item.name || item.Name || item.id || item.ID || "",
        label: String(item.text || item.TextName || item.name || item.Name || item.id || item.ID || "").toUpperCase()
      }));

      setLotOptions(formatted);
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
    const values = selectedOptions ? selectedOptions.map((opt) => opt.value) : [];
    setFilters((prev) => ({
      ...prev,
      lotNo: values.join("\n")
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleClear = () => {
    setHasSearched(false);
    setReportRows([]);
    setPriceMode("SalpurAvg");
    setSelectedTypes(["ALL"]);
    setFilters({
      fromDate: defaultFromDate,
      toDate: todayYMD,
      shape: [],
      color: [],
      clarity: [],
      size: [],
      lotNo: ""
    });
  };

  const effectiveSelectedTypes = useMemo(() => {
    if (!selectedTypes || selectedTypes.length === 0) return ["ALL"];
    return selectedTypes;
  }, [selectedTypes]);

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

  const toggleTypeValue = (value, checked) => {
    const nonAllValues = trnTypeOptions.filter((x) => x.value !== "ALL").map((x) => x.value);

    if (value === "ALL") {
      setSelectedTypes(checked ? ["ALL"] : []);
      return;
    }

    // When ALL is selected, treat current selection as all non-ALL types.
    const current = selectedTypes?.includes("ALL")
      ? nonAllValues.slice()
      : (selectedTypes || []).filter((v) => v !== "ALL");

    let next = checked ? Array.from(new Set([...current, value])) : current.filter((v) => v !== value);

    // If all non-ALL are selected, compress to ALL (matches MVC behavior)
    if (next.length === nonAllValues.length) next = ["ALL"];

    setSelectedTypes(next);
  };

  const handleReport = async () => {
    setLoading(true);
    try {
      const payload = {
        FromDate: filters.fromDate,
        ToDate: filters.toDate,
        Shape: filters.shape,
        Color: filters.color,
        Clarity: filters.clarity,
        Size: filters.size,
        LotNo: filters.lotNo,
        selectedTypes: effectiveSelectedTypes,

        SalpurAvg: priceMode === "SalpurAvg",
        PurAvg: priceMode === "PurAvg",
        MarketAvg: priceMode === "MarketAvg"
      };

      const response = await getSolitaireStockHistoryReport(payload);
      const ok = response?.Success || response?.success;

      if (ok) {
        setReportRows(response.Data || response.data || []);
        setHasSearched(true);
        toast.success("Report loaded successfully.");
      } else {
        toast.warning(response?.Data || response?.data || "Failed to load report.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Server Connection Problem..");
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
      toast.warning("No data available to export.");
      return;
    }

    // Group by StockID (LotNo)
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
      "Particulars",
      "StockIn",
      "StockInPrice",
      "StockInAmount",
      "StockOut",
      "StockOutPrice",
      "StockOutAmount",
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

      rows.push([`StockID:${stockId}`, "", "", "", "", "", "", "", "", "", "", ""]);

      items.forEach((item) => {
        const trnDate = item.trntype === "OpStk" ? opStkDate : item.trnDate;
        rows.push([
          trnDate || "",
          item.trntype || "",
          item.perticulors || "",
          fmtFixed(item.inCts, caratDecimals),
          fmtFixed(item.inRate, priceDecimals),
          fmtFixed(item.inAmount, amtDecimals),
          fmtFixed(item.outCts, caratDecimals),
          fmtFixed(item.outRate, priceDecimals),
          fmtFixed(item.outAmount, amtDecimals),
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

      // Subtotal row (same logic as MVC: totals only for StockIn/StockOut, blank for balance)
      rows.push([
        "Total:",
        "",
        "",
        (subtotal.InCts).toFixed(caratDecimals),
        (subtotal.InRate).toFixed(priceDecimals),
        (subtotal.InAmount).toFixed(amtDecimals),
        (subtotal.OutCts).toFixed(caratDecimals),
        (subtotal.OutRate).toFixed(priceDecimals),
        (subtotal.OutAmount).toFixed(amtDecimals),
        "",
        "",
        ""
      ]);
    });

    rows.push([
      "Grand Total:",
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
      ""
    ]);

    await exportToExcel(columns, rows, "Stock_History", "Stock-History");
  };

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

  const renderTable = () => {
    if (!reportRows || reportRows.length === 0) return null;

    const columns = [
      { header: "TrnDate", key: "trnDate", numeric: false },
      { header: "TrnType", key: "trntype", numeric: false },
      { header: "Particulars", key: "perticulors", numeric: false },

      { header: "StockIn", key: "inCts", numeric: true },
      { header: "StockInPrice", key: "inRate", numeric: true },
      { header: "StockInAmount", key: "inAmount", numeric: true },

      { header: "StockOut", key: "outCts", numeric: true },
      { header: "StockOutPrice", key: "outRate", numeric: true },
      { header: "StockOutAmount", key: "outAmount", numeric: true },

      { header: "BalanceStock", key: "balCts", numeric: true },
      { header: "BalancePrice", key: "balRate", numeric: true },
      { header: "BalanceAmount", key: "balAmount", numeric: true }
    ];

    const caratDecimals = 2;
    const amtDecimals = 2;
    const priceDecimals = 2;

    const grandTotals = { InCts: 0, InRate: 0, InAmount: 0, OutCts: 0, OutRate: 0, OutAmount: 0 };

    const opStkDate = formatDateYMDToDMY(filters.fromDate);

    return (
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
          id="dynamic-stock-his-register-table"
          className="table table-bordered nowrap"
          style={{ marginBottom: 0, borderCollapse: "collapse", fontSize: 13, width: "100%" }}
        >
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key} style={{ borderBottom: "1px solid #999", color: "#000", fontWeight: 600, padding: "8px 10px" }}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groupedForRender.groupOrder.map((stockId) => {
              const items = groupedForRender.grouped.get(stockId) || [];
              const subtotal = { InCts: 0, InRate: 0, InAmount: 0, OutCts: 0, OutRate: 0, OutAmount: 0 };

              items.forEach((item) => {
                subtotal.InCts += Number(item.inCts || 0);
                subtotal.InRate += Number(item.inRate || 0);
                subtotal.InAmount += Number(item.inAmount || 0);
                subtotal.OutCts += Number(item.outCts || 0);
                subtotal.OutRate += Number(item.outRate || 0);
                subtotal.OutAmount += Number(item.outAmount || 0);

                grandTotals.InCts += Number(item.inCts || 0);
                grandTotals.InRate += Number(item.inRate || 0);
                grandTotals.InAmount += Number(item.inAmount || 0);
                grandTotals.OutCts += Number(item.outCts || 0);
                grandTotals.OutRate += Number(item.outRate || 0);
                grandTotals.OutAmount += Number(item.outAmount || 0);
              });

              return (
                <React.Fragment key={stockId}>
                  <tr className="group-header">
                    <td colSpan={columns.length} style={{ fontWeight: 700, fontSize: 15, padding: 10, borderTop: "2px solid #b3b3b3", borderBottom: "2px solid #b3b3b3", color: "#000", textAlign: "left" }}>
                      <strong>StockID:</strong> {stockId}
                    </td>
                  </tr>

                  {items.map((item, idx) => {
                    return (
                      <tr key={`${stockId}-${idx}`}>
                        {columns.map((col) => {
                          let val = item[col.key];

                          if (col.key === "trnDate" && item.trntype === "OpStk") {
                            val = opStkDate;
                          }

                          // Special formatting
                          if (col.key === "inCts" || col.key === "outCts" || col.key === "balCts") {
                            val = fmtFixed(val, caratDecimals);
                          } else if (col.key === "inRate" || col.key === "outRate" || col.key === "balRate") {
                            val = fmtFixed(val, priceDecimals);
                          } else if (col.key === "inAmount" || col.key === "outAmount" || col.key === "balAmount") {
                            val = fmtFixed(val, amtDecimals);
                          }

                          if (col.key === "trntype") {
                            const trnType = val || "";
                            const invcode = item.invcode;
                            const clickable = trnType !== "OpStk" && invcode;

                            return (
                              <td
                                key={col.key}
                                style={{
                                  textAlign: "right",
                                  cursor: clickable ? "pointer" : "default",
                                  textDecoration: clickable ? "underline" : "none",
                                  color: clickable ? "#007bff" : "#000"
                                }}
                                onClick={() => {
                                  if (!clickable) return;
                                  const lower = String(trnType).toLowerCase();
                                  let url = "";
                                  switch (lower) {
                                    case "pur":
                                      url = `../purchase/edit-purchase?Id=${invcode}&Mode=view`;
                                      break;
                                    case "sale":
                                      url = `../sale/edit-sale?Id=${invcode}&Mode=view`;
                                      break;
                                    case "memoin":
                                      url = `../consignment/edit-consignment?Id=${invcode}&Mode=view`;
                                      break;
                                    case "memoout":
                                      url = `../memo/edit-memo?Id=${invcode}&Mode=view`;
                                      break;
                                    case "purrtn":
                                      url = `../purchasereturn/edit-purchasereturn?Id=${invcode}&Mode=view`;
                                      break;
                                    case "salertn":
                                      url = `../salereturn/edit-salereturn?Id=${invcode}&Mode=view`;
                                      break;
                                  }
                                  if (url) window.open(url, "_blank");
                                }}
                              >
                                {trnType}
                              </td>
                            );
                          }

                          return (
                            <td key={col.key} style={{ textAlign: col.numeric ? "right" : "center" }}>
                              {val ?? ""}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}

                  <tr className="subtotal">
                    {/* MVC subtotal uses: colspan=3 then StockIn/StockOut totals only */}
                    <td colSpan={3} style={{ textAlign: "left", fontWeight: "bold", padding: "10px 12px" }}>
                      Total:
                    </td>
                    <td style={{ textAlign: "right", fontWeight: "bold" }}>{subtotal.InCts.toFixed(caratDecimals)}</td>
                    <td style={{ textAlign: "right", fontWeight: "bold" }}>{subtotal.InRate.toFixed(priceDecimals)}</td>
                    <td style={{ textAlign: "right", fontWeight: "bold" }}>{subtotal.InAmount.toFixed(amtDecimals)}</td>
                    <td style={{ textAlign: "right", fontWeight: "bold" }}>{subtotal.OutCts.toFixed(caratDecimals)}</td>
                    <td style={{ textAlign: "right", fontWeight: "bold" }}>{subtotal.OutRate.toFixed(priceDecimals)}</td>
                    <td style={{ textAlign: "right", fontWeight: "bold" }}>{subtotal.OutAmount.toFixed(amtDecimals)}</td>
                    <td />
                    <td />
                    <td />
                  </tr>
                </React.Fragment>
              );
            })}

            <tr className="grand-total">
              <td colSpan={3} style={{ textAlign: "left", fontWeight: "bold", padding: "10px 12px" }}>
                Grand Total:
              </td>
              <td style={{ textAlign: "right", fontWeight: "bold" }}>{grandTotals.InCts.toFixed(caratDecimals)}</td>
              <td style={{ textAlign: "right", fontWeight: "bold" }}>{grandTotals.InRate.toFixed(priceDecimals)}</td>
              <td style={{ textAlign: "right", fontWeight: "bold" }}>{grandTotals.InAmount.toFixed(amtDecimals)}</td>
              <td style={{ textAlign: "right", fontWeight: "bold" }}>{grandTotals.OutCts.toFixed(caratDecimals)}</td>
              <td style={{ textAlign: "right", fontWeight: "bold" }}>{grandTotals.OutRate.toFixed(priceDecimals)}</td>
              <td style={{ textAlign: "right", fontWeight: "bold" }}>{grandTotals.OutAmount.toFixed(amtDecimals)}</td>
              <td />
              <td />
              <td />
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  document.title = `${t("Stock History Report")} | ${t("Reports")}`;

  return (
    <React.Fragment>
      <style>{`
        .trn-table th, .trn-table td { border: 1px solid #ddd; }
        .group-header td { border-top: 2px solid #b3b3b3; border-bottom: 2px solid #b3b3b3; font-weight: 700; font-size: 15px; }
        .subtotal td { border-top: 2px solid #999; border-bottom: 2px solid #999; font-size: 13px; }
      `}</style>

      <ToastContainer />

      <div className="page-content">
        <Container fluid>
          <BreadCrumb title={t("Reports / Stock Register Report")} pageTitle={t("Stock History Report")} />

          {/* Top Control Bar */}
          <div className="card stock-search-header-bar d-flex flex-row align-items-center justify-content-between mb-3 p-3 rounded-3 shadow-sm border">
            <h5 className="mb-0 fw-bold text-primary d-flex align-items-center gap-2">
              <i className={hasSearched ? "ri-database-2-line fs-20 text-primary" : "ri-search-eye-line fs-20 text-primary"}></i>
              {hasSearched ? t("Stock History Report Results") : t("Stock History Report Filters")}
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
                  {reportRows.length > 0 && (
                    <Button color="soft-info" className="btn-sm rounded-2 px-3 py-1" onClick={() => setHasSearched(true)}>
                      {t("Previous Record")}
                    </Button>
                  )}
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
                <Row className="g-3 mb-3">
                  <Col lg={10} md={9}>
                    <Row className="g-3 mb-3">
                      <Col lg={2} md={4} sm={6}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1">{t("Date")}</Label>
                          <Flatpickr
                            className="form-control form-control-sm"
                            value={filters.fromDate}
                            onChange={([date]) => setFilters((prev) => ({ ...prev, fromDate: date ? date.toISOString().split("T")[0] : "" }))}
                            options={{ dateFormat: "Y-m-d" }}
                          />
                        </FormGroup>
                      </Col>
                      <Col lg={2} md={4} sm={6}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1">{t("To Date")}</Label>
                          <Flatpickr
                            className="form-control form-control-sm"
                            value={filters.toDate}
                            onChange={([date]) => setFilters((prev) => ({ ...prev, toDate: date ? date.toISOString().split("T")[0] : "" }))}
                            options={{ dateFormat: "Y-m-d" }}
                          />
                        </FormGroup>
                      </Col>
                          <Col lg={2} md={4} sm={6}>
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
                          <Col lg={2} md={4} sm={6}>
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
                          <Col lg={2} md={4} sm={6}>
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
                          <Col lg={2} md={4} sm={6}>
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

                        <Row className="g-3">
                          <Col lg={6} md={12}>
                            <FormGroup className="mb-0">
                              <Label className="fw-medium mb-1">&nbsp;</Label>
                              <div className="d-flex flex-wrap gap-3">
                                <label className="d-flex align-items-center gap-2" style={{ cursor: "pointer" }}>
                                  <input
                                    type="radio"
                                    className="form-check-input"
                                    checked={priceMode === "SalpurAvg"}
                                    onChange={() => setPriceMode("SalpurAvg")}
                                  />
                                  <span className="fw-medium" style={{ fontSize: "13px" }}>{t("Sale/Purchase Average Price")}</span>
                                </label>
                                <label className="d-flex align-items-center gap-2" style={{ cursor: "pointer" }}>
                                  <input
                                    type="radio"
                                    className="form-check-input"
                                    checked={priceMode === "PurAvg"}
                                    onChange={() => setPriceMode("PurAvg")}
                                  />
                                  <span className="fw-medium" style={{ fontSize: "13px" }}>{t("Pur Avg. Price")}</span>
                                </label>
                                <label className="d-flex align-items-center gap-2" style={{ cursor: "pointer" }}>
                                  <input
                                    type="radio"
                                    className="form-check-input"
                                    checked={priceMode === "MarketAvg"}
                                    onChange={() => setPriceMode("MarketAvg")}
                                  />
                                  <span className="fw-medium" style={{ fontSize: "13px" }}>{t("Market Price")}</span>
                                </label>
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
                                      const isChecked =
                                        selectedTypes?.includes("ALL") ? opt.value !== "ALL" ? true : selectedTypes.includes("ALL") : selectedTypes.includes(opt.value);

                                      // For the ALL checkbox itself:
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

                  <Col lg={2} md={3} className="d-flex flex-column">
                    <FormGroup className="mb-2">
                      <Label className="fw-medium mb-1">{t("Enter Lot No")}</Label>
                      <Input
                        type="textarea"
                        name="lotNo"
                        value={filters.lotNo}
                        onChange={(e) => setFilters((prev) => ({ ...prev, lotNo: e.target.value }))}
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

export default SolitaireStockHistoryReport;

