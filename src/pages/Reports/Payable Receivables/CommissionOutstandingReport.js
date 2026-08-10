import React, { useEffect, useMemo, useRef, useState } from "react";
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
import Select from "react-select";
import { toast, ToastContainer } from "react-toastify";

import BreadCrumb from "../../../Components/Common/BreadCrumb";
import { useSettingReportDates } from "../../../Components/Hooks/useSettingReportDates";
import { exportToExcel } from "../../../helpers/excel_helper";
import {
  getAccGrpMasters,
  getCommissionOutstandingReport,
  getCommissionOutstandingReportDropdowns,
  getUserDropdown
} from "../../../helpers/fakebackend_helper";
import {
  getCachedReportCompany,
  getReportCompanySettings,
  REPORT_COMPANY_SETTINGS_EVENT,
  resolveCompanyLogoUrl
} from "../../../helpers/reportCompanyDefaults";

const dashText = (value) =>
  value === null || value === undefined || value === "" ? "-" : String(value);

const fmtFixed = (value, decimals = 2) => {
  if (value === null || value === undefined || value === "" || Number.isNaN(Number(value)))
    return (0).toFixed(decimals);
  return Number(value).toFixed(decimals);
};

const toCamelKey = (key) =>
  typeof key === "string" && key.length > 0 ? key.charAt(0).toLowerCase() + key.slice(1) : key;

const toPascalKey = (key) =>
  typeof key === "string" && key.length > 0 ? key.charAt(0).toUpperCase() + key.slice(1) : key;

const getRowVal = (row, ...keys) => {
  if (!row) return "";
  const candidates = [];
  keys.forEach((key) => {
    if (key === undefined || key === null || key === "") return;
    candidates.push(key, toCamelKey(key), toPascalKey(key));
  });
  for (const key of candidates) {
    if (row[key] !== undefined && row[key] !== null && row[key] !== "") return row[key];
  }
  const lowerMap = {};
  Object.keys(row).forEach((k) => {
    lowerMap[String(k).toLowerCase()] = row[k];
  });
  for (const key of keys) {
    if (!key) continue;
    const v = lowerMap[String(key).toLowerCase()];
    if (v !== undefined && v !== null && v !== "") return v;
  }
  for (const key of candidates) {
    if (row[key] === 0 || row[key] === "0") return row[key];
  }
  return "";
};

const numVal = (row, ...keys) => {
  const raw = getRowVal(row, ...keys);
  if (raw === "" || raw === null || raw === undefined) return 0;
  const n = parseFloat(String(raw).replace(/,/g, ""));
  return Number.isNaN(n) ? 0 : n;
};

const NUMERIC_SORT_KEYS = [
  "Totcts",
  "AdatAmount",
  "AdatPaid",
  "ExDiff",
  "AdatRemain",
  "Rate",
  "stockrate",
  "Invoiceamount"
];

const ALL_COLUMNS = [
  { key: "view", header: "View", align: "center" },
  { key: "Date", header: "Date", align: "left" },
  { key: "InvoiceNo", header: "InvNo", align: "left" },
  { key: "DueDate", header: "DueDate", align: "left" },
  { key: "Party", header: "Party", align: "left" },
  { key: "Adat", header: "Commission", align: "left", altKeys: ["adat", "Commission"] },
  { key: "Totcts", header: "TotCts", align: "right", sum: true, altKeys: ["totcts", "TotCts"] },
  { key: "AdatAmount", header: "TotAmount", align: "right", sum: true },
  { key: "AdatPaid", header: "PaidAmount", align: "right", sum: true },
  { key: "ExDiff", header: "Ex.Diff", align: "right", sum: true },
  { key: "AdatRemain", header: "RemainAmount", align: "right", sum: true },
  { key: "Seller", header: "Seller", align: "left" },
  { key: "InvType", header: "InvType", align: "left" },
  { key: "Symbol", header: "Symbol", align: "left" },
  { key: "BillNo", header: "BillNo", align: "left" },
  { key: "DueDays", header: "DueDays", align: "left" },
  { key: "PartyMobile", header: "PartyMobile", align: "left" },
  {
    key: "AdatMobile",
    header: "CommissionMobile",
    align: "left",
    altKeys: ["CommissionMobile"]
  },
  { key: "Rate", header: "Rate", align: "right" },
  { key: "stockrate", header: "StockRate", align: "right", altKeys: ["StockRate"] },
  { key: "Remarks", header: "Remarks", align: "left" },
  { key: "Trntype", header: "TrnType", align: "left", altKeys: ["trntype", "TrnType"] },
  {
    key: "UserName",
    header: "UserName",
    align: "left",
    altKeys: ["Issuser", "issuser"]
  },
  {
    key: "Invoiceamount",
    header: "InvoiceAmount",
    align: "right",
    altKeys: ["invoiceamount", "InvoiceAmount"]
  },
  { key: "SalesPerson", header: "SalesPerson", align: "left" }
];

const PARTYWISE_COLUMNS = [
  { key: "view", header: "View", align: "center" },
  { key: "Date", header: "Date", align: "left" },
  { key: "InvoiceNo", header: "InvNo", align: "left" },
  { key: "DueDate", header: "DueDate", align: "left" },
  { key: "Party", header: "Party", align: "left" },
  { key: "Adat", header: "Commission", align: "left", altKeys: ["adat", "Commission"] },
  { key: "Totcts", header: "TotCts", align: "right", sum: true, altKeys: ["totcts", "TotCts"] },
  { key: "AdatAmount", header: "TotAmount", align: "right", sum: true },
  { key: "AdatPaid", header: "PaidAmount", align: "right", sum: true },
  { key: "ExDiff", header: "Ex.Diff", align: "right", sum: true },
  { key: "AdatRemain", header: "RemainAmount", align: "right", sum: true },
  { key: "Seller", header: "Seller", align: "left" },
  { key: "InvType", header: "InvType", align: "left" },
  { key: "Symbol", header: "Symbol", align: "left" },
  { key: "BillNo", header: "BillNo", align: "left" },
  { key: "DueDays", header: "DueDays", align: "left" },
  { key: "PartyMobile", header: "PartyMobile", align: "left" },
  {
    key: "AdatMobile",
    header: "CommissionMobile",
    align: "left",
    altKeys: ["CommissionMobile"]
  },
  { key: "Rate", header: "Rate", align: "right" },
  { key: "stockrate", header: "StockRate", align: "right", altKeys: ["StockRate"] },
  { key: "Remarks", header: "Remarks", align: "left" },
  { key: "Trntype", header: "TrnType", align: "left", altKeys: ["trntype", "TrnType"] },
  {
    key: "UserName",
    header: "UserName",
    align: "left",
    altKeys: ["Issuser", "issuser"]
  },
  {
    key: "Invoiceamount",
    header: "InvoiceAmount",
    align: "right",
    altKeys: ["invoiceamount", "InvoiceAmount"]
  }
];

const FIRST_SUM_COL_INDEX = PARTYWISE_COLUMNS.findIndex((c) => c.sum);

const cellDecimals = (key) => (key === "Totcts" ? 3 : 2);

const isNumericCell = (col) =>
  !!(col?.sum || col?.key === "Rate" || col?.key === "stockrate" || col?.key === "Invoiceamount");

const openTxnLink = (code, trnType) => {
  const type = String(trnType || "").toUpperCase();
  let url = "";
  if (type === "PPUR") url = `../purchaseparcel/edit-purchaseparcel?ID=${code}&Mode=view`;
  else if (type === "PUR") url = `../purchase/edit-purchase?ID=${code}&Mode=view`;
  else if (type === "SALE") url = `../sale/edit-sale?ID=${code}&Mode=view`;
  else if (type === "PSALE") url = `../saleParcel/edit-saleParcel?ID=${code}&Mode=view`;
  else if (type === "CPUR") url = `../mix-purchase/edit-mixpur?ID=${code}&Mode=view`;
  else if (type === "CSALE") url = `../mix/edit-mixdata?ID=${code}&Mode=view`;

  if (url) window.open(url, "_blank")?.focus();
};

const CommissionOutstandingReport = () => {
  const { t } = useTranslation();
  const printRef = useRef(null);
  const { fromDate, toDate, getDates, mergeDates } = useSettingReportDates();

  const [loadingDropdowns, setLoadingDropdowns] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMode, setLoadingMode] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [reportMode, setReportMode] = useState("");
  const [reportRows, setReportRows] = useState([]);
  const [companyInfo, setCompanyInfo] = useState(() => getCachedReportCompany());
  const [globalSearch, setGlobalSearch] = useState("");
  const [pageSize, setPageSize] = useState(500);
  const [page, setPage] = useState(1);
  const [columnFilters, setColumnFilters] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: "", direction: "" });

  const [partyInput, setPartyInput] = useState("");
  const [partyOptions, setPartyOptions] = useState([]);
  const [selectedParty, setSelectedParty] = useState(null);
  const [loadingParties, setLoadingParties] = useState(false);

  const [commissionInput, setCommissionInput] = useState("");
  const [commissionOptions, setCommissionOptions] = useState([]);
  const [selectedCommission, setSelectedCommission] = useState(null);
  const [loadingCommission, setLoadingCommission] = useState(false);

  const [salesPersonOptions, setSalesPersonOptions] = useState([]);
  const [selectedSalesPerson, setSelectedSalesPerson] = useState(null);

  const [filters, setFilters] = useState({
    fromDate,
    toDate,
    fromDateDue: fromDate,
    toDateDue: toDate,
    paidInvoice: false,
    paidCommission: false
  });

  const customStyles = useMemo(
    () => ({
      control: (provided) => ({
        ...provided,
        backgroundColor: "var(--vz-secondary-bg, #fff)",
        borderColor: "var(--vz-border-color, #ced4da)",
        color: "var(--vz-body-color, #495057)",
        minHeight: "35px"
      }),
      valueContainer: (provided) => ({
        ...provided,
        minHeight: "35px",
        padding: "0 6px"
      }),
      input: (provided) => ({ ...provided, margin: "0px", padding: "0px" }),
      indicatorSeparator: () => ({ display: "none" }),
      indicatorsContainer: (provided) => ({ ...provided, height: "33px" }),
      menu: (provided) => ({
        ...provided,
        backgroundColor: "var(--vz-secondary-bg, #fff)",
        color: "var(--vz-body-color, #495057)",
        border: "1px solid var(--vz-border-color, #dee2e6)",
        zIndex: 20
      }),
      option: (provided, state) => ({
        ...provided,
        backgroundColor: state.isFocused ? "#3b5de7" : "transparent",
        color: state.isFocused ? "#ffffff" : "var(--vz-body-color, #495057)",
        cursor: "pointer",
        padding: "4px 10px",
        fontSize: "11px",
        ":active": { backgroundColor: "#3b5de7" }
      }),
      placeholder: (provided) => ({
        ...provided,
        color: "var(--vz-secondary-color, #878a99)",
        fontSize: "11px"
      }),
      singleValue: (provided) => ({
        ...provided,
        color: "var(--vz-body-color, #495057)",
        fontSize: "11px"
      })
    }),
    []
  );

  useEffect(() => {
    const loadDropdowns = async () => {
      setLoadingDropdowns(true);
      try {
        const res = await getCommissionOutstandingReportDropdowns();
        if (res?.success || res?.Success) {
          const data = res.data || res.Data || {};

          const spList =
            data.salesPersons ||
            data.SalesPersons ||
            data.salesperson ||
            data.SalesPerson ||
            [];
          let options = (Array.isArray(spList) ? spList : [])
            .map((item) => {
              const name =
                item.salesPerson ||
                item.SalesPerson ||
                item.name ||
                item.Name ||
                item.userName ||
                item.UserName ||
                "";
              return name ? { value: String(name), label: String(name) } : null;
            })
            .filter(Boolean);

          if (options.length === 0) {
            try {
              const userRes = await getUserDropdown();
              const users = userRes?.data || userRes?.Data || (Array.isArray(userRes) ? userRes : []);
              options = (users || [])
                .map((item) => {
                  const name =
                    item.userName ||
                    item.UserName ||
                    item.name ||
                    item.Name ||
                    item.salesPerson ||
                    item.SalesPerson ||
                    "";
                  return name ? { value: String(name), label: String(name) } : null;
                })
                .filter(Boolean);
            } catch {
            }
          }

          setSalesPersonOptions(options);
        }
      } catch (err) {
        console.error(err);
        toast.error(t("Failed to load dropdown data."));
      } finally {
        setLoadingDropdowns(false);
      }
    };
    loadDropdowns();
  }, [t]);

  useEffect(() => {
    const loadCompanySettings = async () => {
      const company = await getReportCompanySettings({ forceRefresh: true });
      setCompanyInfo(company);
    };
    const handleCompanyRefresh = () => setCompanyInfo(getCachedReportCompany());
    loadCompanySettings();
    window.addEventListener(REPORT_COMPANY_SETTINGS_EVENT, handleCompanyRefresh);
    window.addEventListener("companyNameUpdated", handleCompanyRefresh);
    window.addEventListener("companyLogoUpdated", handleCompanyRefresh);
    return () => {
      window.removeEventListener(REPORT_COMPANY_SETTINGS_EVENT, handleCompanyRefresh);
      window.removeEventListener("companyNameUpdated", handleCompanyRefresh);
      window.removeEventListener("companyLogoUpdated", handleCompanyRefresh);
    };
  }, []);

  useEffect(() => {
    setFilters((prev) => {
      const merged = mergeDates(prev);
      return {
        ...merged,
        fromDateDue: prev.fromDateDue || merged.fromDate,
        toDateDue: prev.toDateDue || merged.toDate
      };
    });
  }, [fromDate, toDate, mergeDates]);

  const handleAccountSearch = async (term, setOptions, setLoadingState) => {
    if (!term || term.length < 2) {
      setOptions([]);
      return;
    }
    setLoadingState(true);
    try {
      const response = await getAccGrpMasters(term);
      if (response.success || response.Success) {
        const d = response.data || response.Data || [];
        setOptions(
          d.map((item) => ({
            value: String(item.accGrpCode || item.AccGrpCode || ""),
            label: item.accGrpName || item.AccGrpName || ""
          }))
        );
      }
    } catch {
    } finally {
      setLoadingState(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(
      () => handleAccountSearch(partyInput, setPartyOptions, setLoadingParties),
      400
    );
    return () => clearTimeout(timer);
  }, [partyInput]);

  useEffect(() => {
    const timer = setTimeout(
      () => handleAccountSearch(commissionInput, setCommissionOptions, setLoadingCommission),
      400
    );
    return () => clearTimeout(timer);
  }, [commissionInput]);

  const buildPayload = () => ({
    FromDate: filters.fromDate,
    ToDate: filters.toDate,
    FromDateDue: filters.fromDateDue,
    ToDateDue: filters.toDateDue,
    Party: selectedParty?.label || null,
    AdatName: selectedCommission?.label || null,
    Brokerage: false,
    Adat: true,
    Currency: null,
    Summary: false,
    PaidInvoice: !!filters.paidInvoice,
    PaidBrokerage: !!filters.paidCommission,
    SalesPerson: selectedSalesPerson?.value || null
  });

  const runReport = async (mode) => {
    setLoading(true);
    setLoadingMode(mode);
    try {
      const response = await getCommissionOutstandingReport(buildPayload());
      const ok = response?.success || response?.Success;
      if (!ok) {
        toast.warning(response?.Data || response?.data || response?.message || t("Failed to load report."));
        return;
      }
      const data = response.Data || response.data || [];
      setReportRows(Array.isArray(data) ? data : []);
      setReportMode(mode);
      setHasSearched(true);
      setPage(1);
      setGlobalSearch("");
      setColumnFilters({});
      setSortConfig({ key: "", direction: "" });
      toast.success(t("Report loaded successfully."));
    } catch (err) {
      console.error(err);
      toast.error(t("Server Connection Problem.."));
    } finally {
      setLoading(false);
      setLoadingMode("");
    }
  };

  const handleClear = async () => {
    const d = await getDates();
    setHasSearched(false);
    setReportMode("");
    setReportRows([]);
    setSelectedParty(null);
    setSelectedCommission(null);
    setSelectedSalesPerson(null);
    setPartyInput("");
    setCommissionInput("");
    setPartyOptions([]);
    setCommissionOptions([]);
    setGlobalSearch("");
    setColumnFilters({});
    setSortConfig({ key: "", direction: "" });
    setPage(1);
    setFilters(
      mergeDates(
        {
          fromDateDue: d.fromDate,
          toDateDue: d.toDate,
          paidInvoice: false,
          paidCommission: false
        },
        d
      )
    );
  };

  const handleNewSelection = () => {
    setHasSearched(false);
    setReportMode("");
    setReportRows([]);
    setGlobalSearch("");
    setColumnFilters({});
    setSortConfig({ key: "", direction: "" });
    setPage(1);
  };

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        if (prev.direction === "asc") return { key, direction: "desc" };
        return { key: "", direction: "" };
      }
      return { key, direction: "asc" };
    });
  };

  const renderHeader = (col) => {
    const isSorted = sortConfig.key === col.key;
    return (
      <th
        key={col.key}
        className="text-center text-nowrap small fw-semibold cursor-pointer select-none"
        onClick={() => handleSort(col.key)}
        style={{ userSelect: "none", cursor: "pointer" }}
      >
        <div className="d-flex align-items-center justify-content-center">
          <span>{t(col.header)}</span>
          <span className="ms-2">
            {isSorted ? (
              sortConfig.direction === "asc" ? (
                <i className="mdi mdi-chevron-up text-muted" />
              ) : (
                <i className="mdi mdi-chevron-down text-muted" />
              )
            ) : (
              <i className="mdi mdi-unfold-more-horizontal text-muted" />
            )}
          </span>
        </div>
      </th>
    );
  };

  const sortedReportRows = useMemo(() => {
    const rows = [...(reportRows || [])];
    if (sortConfig.key && sortConfig.direction) {
      const col =
        ALL_COLUMNS.find((c) => c.key === sortConfig.key) ||
        PARTYWISE_COLUMNS.find((c) => c.key === sortConfig.key);
      const altKeys = col?.altKeys || [];
      rows.sort((a, b) => {
        let valA = getRowVal(a, sortConfig.key, ...altKeys);
        let valB = getRowVal(b, sortConfig.key, ...altKeys);
        const isNumeric = col?.sum || NUMERIC_SORT_KEYS.includes(sortConfig.key);
        if (isNumeric) {
          const numA = parseFloat(String(valA).replace(/,/g, "")) || 0;
          const numB = parseFloat(String(valB).replace(/,/g, "")) || 0;
          return sortConfig.direction === "asc" ? numA - numB : numB - numA;
        }
        valA = String(valA || "").toLowerCase();
        valB = String(valB || "").toLowerCase();
        if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
        if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return rows;
  }, [reportRows, sortConfig]);

  const filteredAllRows = useMemo(() => {
    let rows = sortedReportRows;
    const g = (globalSearch || "").trim().toLowerCase();
    if (g) {
      rows = rows.filter((row) =>
        ALL_COLUMNS.some((col) =>
          String(getRowVal(row, col.key, ...(col.altKeys || [])))
            .toLowerCase()
            .includes(g)
        )
      );
    }
    Object.entries(columnFilters).forEach(([key, val]) => {
      const v = (val || "").trim().toLowerCase();
      if (!v) return;
      const col = ALL_COLUMNS.find((c) => c.key === key);
      rows = rows.filter((row) =>
        String(getRowVal(row, key, ...(col?.altKeys || [])))
          .toLowerCase()
          .includes(v)
      );
    });
    return rows;
  }, [sortedReportRows, globalSearch, columnFilters]);

  const pagedAllRows = useMemo(() => {
    if (pageSize >= 999999) return filteredAllRows;
    const start = (page - 1) * pageSize;
    return filteredAllRows.slice(start, start + pageSize);
  }, [filteredAllRows, page, pageSize]);

  const allTotals = useMemo(() => {
    const totals = {};
    ALL_COLUMNS.filter((c) => c.sum).forEach((c) => {
      totals[c.key] = 0;
    });
    filteredAllRows.forEach((row) => {
      ALL_COLUMNS.filter((c) => c.sum).forEach((c) => {
        totals[c.key] += numVal(row, c.key, ...(c.altKeys || []));
      });
    });
    return totals;
  }, [filteredAllRows]);

  const partyGrouped = useMemo(() => {
    const map = {};
    sortedReportRows.forEach((row) => {
      const party = getRowVal(row, "Party", "party") || "Unknown Party";
      if (!map[party]) map[party] = [];
      map[party].push(row);
    });
    return Object.keys(map).map((party) => {
      const rows = map[party];
      const subtotal = {
        Totcts: 0,
        AdatAmount: 0,
        AdatPaid: 0,
        ExDiff: 0,
        AdatRemain: 0
      };
      rows.forEach((r) => {
        subtotal.Totcts += numVal(r, "Totcts", "totcts", "TotCts");
        subtotal.AdatAmount += numVal(r, "AdatAmount");
        subtotal.AdatPaid += numVal(r, "AdatPaid");
        subtotal.ExDiff += numVal(r, "ExDiff");
        subtotal.AdatRemain += numVal(r, "AdatRemain");
      });
      return { party, rows, subtotal };
    });
  }, [sortedReportRows]);

  const invoicePartyGrandTotal = useMemo(() => {
    const grand = {
      Totcts: 0,
      AdatAmount: 0,
      AdatPaid: 0,
      ExDiff: 0,
      AdatRemain: 0
    };
    partyGrouped.forEach(({ subtotal }) => {
      Object.keys(grand).forEach((k) => {
        grand[k] += subtotal[k] || 0;
      });
    });
    return grand;
  }, [partyGrouped]);

  const companyLogoUrl = resolveCompanyLogoUrl(companyInfo?.companyLogo);

  const todayLabel = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });

  const totalPages = Math.max(1, Math.ceil(filteredAllRows.length / pageSize));

  const getVisiblePages = () => {
    if (totalPages <= 3) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (page === 1) return [1, 2, 3];
    if (page === totalPages) return [totalPages - 2, totalPages - 1, totalPages];
    return [page - 1, page, page + 1];
  };

  const formatCell = (row, col) => {
    if (col.key === "view") {
      const code = getRowVal(row, "Code", "code");
      const trn = getRowVal(row, "Trntype", "trntype", "TrnType");
      return (
        <button
          type="button"
          className="btn btn-soft-primary btn-sm p-1 py-0"
          onClick={() => openTxnLink(code, trn)}
          title={t("View")}
        >
          <i className="ri-eye-line" />
        </button>
      );
    }
    if (isNumericCell(col)) {
      return fmtFixed(numVal(row, col.key, ...(col.altKeys || [])), cellDecimals(col.key));
    }
    return dashText(getRowVal(row, col.key, ...(col.altKeys || [])));
  };

  const subtotalValue = (subtotal, col) => {
    if (col.key === "Rate") {
      const rateVal = subtotal.Totcts > 0 ? (subtotal.AdatAmount || 0) / subtotal.Totcts : 0;
      return fmtFixed(rateVal, 2);
    }
    if (!col.sum) return "";
    return fmtFixed(subtotal[col.key] || 0, cellDecimals(col.key));
  };

  const exportReportExcel = async () => {
    const cols = (reportMode === "invoiceByParty" ? PARTYWISE_COLUMNS : ALL_COLUMNS).filter(
      (c) => c.key !== "view"
    );
    const headers = cols.map((c) => c.header);
    const rows = [];

    if (reportMode === "invoiceByParty") {
      partyGrouped.forEach(({ party, rows: groupRows, subtotal }) => {
        rows.push([party, ...cols.slice(1).map(() => "")]);
        groupRows.forEach((r) => {
          rows.push(cols.map((c) => formatCell(r, c)));
        });
        rows.push([
          t("Total"),
          ...cols.slice(1).map((c) => {
            if (c.sum) {
              return subtotalValue(subtotal, c);
            } else if (c.key === "Rate") {
              const rateSub = subtotal.Totcts > 0 ? subtotal.AdatAmount / subtotal.Totcts : 0;
              return fmtFixed(rateSub, 2);
            }
            return "";
          })
        ]);
      });
      rows.push([
        t("Grand Total"),
        ...cols.slice(1).map((c) => {
          if (c.sum) {
            return subtotalValue(invoicePartyGrandTotal, c);
          } else if (c.key === "Rate") {
            const rateGrand = invoicePartyGrandTotal.Totcts > 0 ? invoicePartyGrandTotal.AdatAmount / invoicePartyGrandTotal.Totcts : 0;
            return fmtFixed(rateGrand, 2);
          }
          return "";
        })
      ]);
    } else {
      filteredAllRows.forEach((r) => {
        rows.push(cols.map((c) => formatCell(r, c)));
      });
      rows.push(
        cols.map((c, idx) => {
          if (idx === 0) return t("Total");
          if (c.sum) return fmtFixed(allTotals[c.key] || 0, cellDecimals(c.key));
          return "";
        })
      );
    }

    const fileName =
      reportMode === "invoiceByParty"
        ? "Commission-Outstanding-Partywise"
        : "Commission-Outstanding-Report";
    const res = await exportToExcel(headers, rows, "CommissionOutstanding", fileName);
    if (!res?.success) toast.error(t("Excel export failed."));
  };

  const handlePrint = () => {
    const node = printRef.current;
    if (!node) {
      toast.warning(t("No report is currently visible to print."));
      return;
    }

    const clone = node.cloneNode(true);
    clone.querySelectorAll("button, .btn").forEach((el) => el.remove());
    clone
      .querySelectorAll(".mdi, i.mdi-chevron-up, i.mdi-chevron-down, i.mdi-unfold-more-horizontal")
      .forEach((el) => {
        const parent = el.closest("span.ms-2");
        if (parent) parent.remove();
        else el.remove();
      });
    clone.querySelectorAll(".table-responsive, .cor-print-wrap").forEach((el) => {
      el.style.overflow = "visible";
      el.style.overflowX = "visible";
      el.style.overflowY = "visible";
      el.style.maxHeight = "none";
      el.style.height = "auto";
      el.classList.remove("table-responsive");
    });
    clone.querySelectorAll(".text-nowrap").forEach((el) => el.classList.remove("text-nowrap"));

    // Exclude first column (View column) from printing
    clone.querySelectorAll("tr").forEach((tr) => {
      if (tr.classList.contains("cor-group-header")) {
        const td = tr.querySelector("td");
        if (td) {
          const span = parseInt(td.getAttribute("colspan") || "1", 10);
          if (span > 1) td.setAttribute("colspan", String(span - 1));
        }
        return;
      }
      const firstTh = tr.querySelector("th:first-child");
      const firstTd = tr.querySelector("td:first-child");
      if (firstTh) firstTh.remove();
      else if (firstTd) firstTd.remove();
    });

    const printWindow = window.open("", "", "height=900,width=1600");
    if (!printWindow) {
      toast.warning(t("Please allow pop-ups to print."));
      return;
    }

    printWindow.document.write("<html><head><title>Commission Outstanding Report</title>");
    printWindow.document.write(`
<style>
  @page {
    size: A4 landscape;
    margin: 3mm;
  }

  html, body {
    margin: 0 !important;
    padding: 0 !important;
    width: 100% !important;
    background: #fff !important;
    color: #000 !important;
    font-family: Arial, Helvetica, sans-serif !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    overflow: visible !important;
  }

  #print-root {
    width: 100% !important;
    box-sizing: border-box !important;
    padding: 4px !important;
    transform-origin: top left;
  }

  .table-responsive,
  .cor-print-wrap,
  .table-card {
    overflow: visible !important;
    overflow-x: visible !important;
    overflow-y: visible !important;
    max-height: none !important;
    height: auto !important;
    width: 100% !important;
  }

  .d-flex { display: flex !important; }
  .flex-column { flex-direction: column !important; }
  .flex-lg-row { flex-direction: row !important; flex-wrap: nowrap !important; }
  .justify-content-between { justify-content: space-between !important; }
  .align-items-start { align-items: flex-start !important; }
  .align-items-center { align-items: center !important; }
  .flex-grow-1 { flex: 1 1 auto !important; min-width: 0 !important; }
  .gap-3 { gap: 8px !important; }
  .border-bottom { border-bottom: 1px solid #ccc !important; }
  .pb-3 { padding-bottom: 6px !important; }
  .mb-3 { margin-bottom: 8px !important; }
  .fw-bold { font-weight: 700 !important; }
  .fs-3 { font-size: 16px !important; }
  .fs-5 { font-size: 14px !important; white-space: nowrap !important; }
  .text-uppercase { text-transform: uppercase !important; }
  .text-center { text-align: center !important; }
  .text-end, .text-lg-end { text-align: right !important; }
  .text-muted { color: #555 !important; }
  .small { font-size: 8px !important; }

  .cor-print-header {
    display: flex !important;
    flex-direction: row !important;
    width: 100% !important;
    align-items: flex-start !important;
    justify-content: space-between !important;
    gap: 8px !important;
  }
  .cor-print-header > div { min-width: 0 !important; }
  .cor-print-title {
    flex: 0 0 auto !important;
    text-align: right !important;
    max-width: 34% !important;
  }

  img {
    max-width: 70px !important;
    max-height: 70px !important;
    object-fit: contain !important;
  }

  table {
    width: 100% !important;
    max-width: 100% !important;
    border-collapse: collapse !important;
    table-layout: fixed !important;
    font-size: 6px !important;
    margin-top: 4px !important;
    page-break-inside: auto !important;
  }

  thead { display: table-header-group !important; }
  tfoot { display: table-footer-group !important; }
  tr { page-break-inside: avoid !important; }

  th, td {
    border: 1px solid #999 !important;
    padding: 1px 2px !important;
    color: #000 !important;
    vertical-align: middle !important;
    white-space: normal !important;
    word-break: break-word !important;
    overflow-wrap: anywhere !important;
    font-size: 6px !important;
    line-height: 1.15 !important;
  }

  th {
    background: #f2f2f2 !important;
    font-weight: 700 !important;
    text-align: center !important;
  }

  .cor-group-header td {
    background: #f3f6f9 !important;
    font-weight: 700 !important;
    text-align: left !important;
    font-size: 7px !important;
  }

  .cor-subtotal td,
  .cor-grand-total td {
    font-weight: 700 !important;
  }

  @media print {
    html, body {
      width: 100% !important;
      height: auto !important;
      overflow: visible !important;
    }
    #print-root {
      overflow: visible !important;
    }
  }
</style></head><body><div id="print-root">`);
    printWindow.document.write(clone.innerHTML);
    printWindow.document.write("</div></body></html>");
    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      try {
        const root = printWindow.document.getElementById("print-root");
        if (root) {
          const printableWidth = printWindow.document.documentElement.clientWidth || 1100;
          const contentWidth = Math.max(root.scrollWidth, root.offsetWidth);
          if (contentWidth > printableWidth) {
            const scale = Math.max(0.45, Math.min(1, (printableWidth - 4) / contentWidth));
            root.style.transformOrigin = "top left";
            root.style.transform = `scale(${scale})`;
            root.style.width = `${100 / scale}%`;
          }
        }
      } catch {
      }
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  document.title = `${t("Commission Outstanding Report")} | ${t("Admin")}`;

  return (
    <React.Fragment>
      <style>{`
        .cor-group-header td {
          background: #f3f6f9;
          font-weight: 700;
          border-top: 2px solid #b3b3b3;
          border-bottom: 2px solid #b3b3b3;
        }
        .cor-subtotal td, .cor-grand-total td {
          font-weight: 700;
          border-top: 2px solid #999;
          border-bottom: 2px solid #999;
        }
        [data-layout-mode="dark"] .cor-group-header td { background: #2b2c32; }
      `}</style>
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title={t("Commission Outstanding Report")} pageTitle={t("Reports")} />

          <div className="card d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between mb-3 p-3 rounded-3 shadow-sm border gap-3">
            <h5 className="mb-0 fw-bold text-primary d-flex align-items-center gap-2">
              <i className="ri-file-list-3-line fs-20 text-primary" />
              {t("Commission Outstanding Report")}
            </h5>

            <div className="d-flex align-items-center flex-wrap gap-2">
              {!hasSearched ? (
                <>
                  <Button
                    color="soft-primary"
                    className="btn-sm rounded-2 px-3 py-1"
                    disabled={loading || loadingDropdowns}
                    onClick={handleClear}
                  >
                    {t("Clear")}
                  </Button>
                  <Button
                    color="primary"
                    className="btn-sm rounded-2 px-3 py-1"
                    disabled={loading || loadingDropdowns}
                    onClick={() => runReport("report")}
                  >
                    {loadingMode === "report" ? t("Loading...") : t("Report")}
                  </Button>
                  <Button
                    color="primary"
                    className="btn-sm rounded-2 px-3 py-1"
                    disabled={loading || loadingDropdowns}
                    onClick={() => runReport("invoiceByParty")}
                  >
                    {loadingMode === "invoiceByParty" ? t("Loading...") : t("Invoice by Party")}
                  </Button>
                </>
              ) : (
                <>
                  <Button color="primary" className="btn-sm rounded-2 px-3 py-1" onClick={handleNewSelection}>
                    {t("New Selection")}
                  </Button>
                  <Button color="soft-success" className="btn-sm rounded-2 px-3 py-1" onClick={exportReportExcel}>
                    <i className="ri-file-excel-2-line align-middle me-1" />
                    {t("Excel")}
                  </Button>
                  {reportMode === "invoiceByParty" && (
                    <Button color="primary" className="btn-sm rounded-2 px-3 py-1" onClick={handlePrint}>
                      <i className="ri-printer-line align-middle me-1" />
                      {t("Print")}
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>

          {!hasSearched && (
            <Card className="shadow-lg border-0 rounded-3 mb-4">
              <CardBody className="bg-light-subtle">
                <Row className="g-2 mb-2">
                  <Col sm={2}>
                    <FormGroup className="mb-0">
                      <Label className="fw-medium mb-1 small">{t("Date")}</Label>
                      <Input
                        type="date"
                        className="form-control form-control-sm"
                        style={{ height: "35px" }}
                        value={filters.fromDate || ""}
                        onChange={(e) => setFilters((p) => ({ ...p, fromDate: e.target.value }))}
                      />
                    </FormGroup>
                  </Col>
                  <Col sm={2}>
                    <FormGroup className="mb-0">
                      <Label className="fw-medium mb-1 small">{t("To Date")}</Label>
                      <Input
                        type="date"
                        className="form-control form-control-sm"
                        style={{ height: "35px" }}
                        value={filters.toDate || ""}
                        onChange={(e) => setFilters((p) => ({ ...p, toDate: e.target.value }))}
                      />
                    </FormGroup>
                  </Col>
                  <Col sm={2}>
                    <FormGroup className="mb-0">
                      <Label className="fw-medium mb-1 small">{t("From Due Date")}</Label>
                      <Input
                        type="date"
                        className="form-control form-control-sm"
                        style={{ height: "35px" }}
                        value={filters.fromDateDue || ""}
                        onChange={(e) => setFilters((p) => ({ ...p, fromDateDue: e.target.value }))}
                      />
                    </FormGroup>
                  </Col>
                  <Col sm={2}>
                    <FormGroup className="mb-0">
                      <Label className="fw-medium mb-1 small">{t("To Due Date")}</Label>
                      <Input
                        type="date"
                        className="form-control form-control-sm"
                        style={{ height: "35px" }}
                        value={filters.toDateDue || ""}
                        onChange={(e) => setFilters((p) => ({ ...p, toDateDue: e.target.value }))}
                      />
                    </FormGroup>
                  </Col>
                </Row>

                <Row className="g-2">
                  <Col sm={2}>
                    <FormGroup className="mb-0">
                      <Label className="fw-medium mb-1 small">{t("Party")}</Label>
                      <Select
                        classNamePrefix="react-select"
                        styles={customStyles}
                        isClearable
                        isLoading={loadingParties}
                        options={partyOptions}
                        value={selectedParty}
                        inputValue={partyInput}
                        onInputChange={(val, meta) => {
                          if (meta.action === "input-change") setPartyInput(val);
                        }}
                        onChange={(sel) => {
                          setSelectedParty(sel);
                          setPartyInput("");
                          setPartyOptions([]);
                        }}
                        placeholder={t("Search Party")}
                        noOptionsMessage={() =>
                          partyInput.length < 2 ? t("Type 2+ characters") : t("No options")
                        }
                      />
                    </FormGroup>
                  </Col>
                  <Col sm={2}>
                    <FormGroup className="mb-0">
                      <Label className="fw-medium mb-1 small">{t("Comm. Agent")}</Label>
                      <Select
                        classNamePrefix="react-select"
                        styles={customStyles}
                        isClearable
                        isLoading={loadingCommission}
                        options={commissionOptions}
                        value={selectedCommission}
                        inputValue={commissionInput}
                        onInputChange={(val, meta) => {
                          if (meta.action === "input-change") setCommissionInput(val);
                        }}
                        onChange={(sel) => {
                          setSelectedCommission(sel);
                          setCommissionInput("");
                          setCommissionOptions([]);
                        }}
                        placeholder={t("Search Comm. Agent")}
                        noOptionsMessage={() =>
                          commissionInput.length < 2 ? t("Type 2+ characters") : t("No options")
                        }
                      />
                    </FormGroup>
                  </Col>
                  <Col sm={2}>
                    <FormGroup className="mb-0">
                      <Label className="fw-medium mb-1 small">{t("Salesperson")}</Label>
                      <Select
                        classNamePrefix="react-select"
                        styles={customStyles}
                        isClearable
                        isSearchable
                        isLoading={loadingDropdowns}
                        options={salesPersonOptions}
                        value={selectedSalesPerson}
                        onChange={(sel) => setSelectedSalesPerson(sel)}
                        placeholder={t("Select Salesperson")}
                        noOptionsMessage={() => t("No options")}
                      />
                    </FormGroup>
                  </Col>
                  <Col sm={3}>
                    <FormGroup className="mb-0">
                      <Label className="fw-medium mb-1 small d-block">&nbsp;</Label>
                      <div className="d-flex align-items-center flex-wrap gap-3" style={{ minHeight: "35px" }}>
                        <div className="form-check mb-0">
                          <Input
                            className="form-check-input"
                            type="checkbox"
                            id="chkPaidInvoice"
                            checked={!!filters.paidInvoice}
                            onChange={(e) => setFilters((p) => ({ ...p, paidInvoice: e.target.checked }))}
                          />
                          <Label className="form-check-label small" htmlFor="chkPaidInvoice">
                            {t("Show Paid Invoice")}
                          </Label>
                        </div>
                        <div className="form-check mb-0">
                          <Input
                            className="form-check-input"
                            type="checkbox"
                            id="chkPaidCommission"
                            checked={!!filters.paidCommission}
                            onChange={(e) => setFilters((p) => ({ ...p, paidCommission: e.target.checked }))}
                          />
                          <Label className="form-check-label small" htmlFor="chkPaidCommission">
                            {t("Show Paid Commission")}
                          </Label>
                        </div>
                      </div>
                    </FormGroup>
                  </Col>
                </Row>
              </CardBody>
            </Card>
          )}

          {hasSearched && reportMode === "report" && (
            <Card className="shadow-lg border-0 rounded-3 mb-4">
              <CardBody>
                <Row className="mb-3 align-items-center g-3">
                  <Col sm={12} md="auto">
                    <div className="d-flex align-items-center">
                      <span className="me-2 text-muted text-uppercase">{t("Show")}</span>
                      <select
                        className="form-select form-select-sm w-auto"
                        value={pageSize}
                        onChange={(e) => {
                          setPageSize(Number(e.target.value));
                          setPage(1);
                        }}
                      >
                        {[10, 25, 50, 100, 500].map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                        <option value={999999}>{t("All")}</option>
                      </select>
                      <span className="ms-2 text-muted text-uppercase">{t("Entries")}</span>
                    </div>
                  </Col>
                  <Col sm={12} md className="d-flex justify-content-md-end mt-2 mt-md-0">
                    <div className="search-box me-2 d-inline-block">
                      <input
                        type="text"
                        className="form-control search"
                        value={globalSearch}
                        onChange={(e) => {
                          setGlobalSearch(e.target.value);
                          setPage(1);
                        }}
                        placeholder={t("Search...")}
                      />
                      <i className="bx bx-search-alt search-icon" />
                    </div>
                  </Col>
                </Row>

                <div className="table-responsive table-card" style={{ maxHeight: "620px", overflow: "auto" }}>
                  <table className="table table-bordered table-hover table-sm align-middle mb-0">
                    <thead className="table-light" style={{ position: "sticky", top: 0, zIndex: 2 }}>
                      <tr>{ALL_COLUMNS.map(renderHeader)}</tr>
                      <tr>
                        {ALL_COLUMNS.map((col) => (
                          <th key={`f-${col.key}`} className="p-1">
                            <Input
                              type="text"
                              className="form-control form-control-sm"
                              value={columnFilters[col.key] || ""}
                              onChange={(e) => {
                                setColumnFilters((p) => ({ ...p, [col.key]: e.target.value }));
                                setPage(1);
                              }}
                            />
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pagedAllRows.length === 0 ? (
                        <tr>
                          <td colSpan={ALL_COLUMNS.length} className="text-center text-muted py-4">
                            {t("No data available.")}
                          </td>
                        </tr>
                      ) : (
                        pagedAllRows.map((row, idx) => (
                          <tr key={`${getRowVal(row, "Code", "code")}-${idx}`}>
                            {ALL_COLUMNS.map((col) => (
                              <td
                                key={col.key}
                                className={`text-nowrap small ${
                                  col.align === "right" ? "text-end" : "text-start"
                                }`}
                              >
                                {formatCell(row, col)}
                              </td>
                            ))}
                          </tr>
                        ))
                      )}
                    </tbody>
                    <tfoot
                      className="table-light"
                      style={{
                        position: "sticky",
                        bottom: 0,
                        backgroundColor: "var(--vz-light, #f2f2f2)",
                        zIndex: 2,
                        borderTop: "2px solid var(--vz-border-color)"
                      }}
                    >
                      <tr className="cor-grand-total">
                        {ALL_COLUMNS.map((col, idx) => {
                          let content = "";
                          if (idx === 0) content = t("Total");
                          else if (col.sum) content = fmtFixed(allTotals[col.key] || 0, cellDecimals(col.key));
                          return (
                            <td
                              key={`t-${col.key}`}
                              className={`text-nowrap small fw-bold ${
                                col.align === "right" ? "text-end" : "text-start"
                              }`}
                            >
                              {content}
                            </td>
                          );
                        })}
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div
                  className="mt-3"
                  style={{
                    backgroundColor: "var(--vz-card-bg, #fff)",
                    paddingTop: "8px",
                    paddingBottom: "4px",
                    borderTop: "1px solid var(--vz-border-color, #e9ebec)"
                  }}
                >
                  <Row className="align-items-center mt-0 g-3 text-center text-sm-start">
                    <div className="col-sm">
                      <div className="text-muted">
                        {t("Showing")}{" "}
                        <span className="fw-semibold">
                          {filteredAllRows.length === 0 ? 0 : (page - 1) * pageSize + 1}
                        </span>{" "}
                        {t("to")}{" "}
                        <span className="fw-semibold">{Math.min(page * pageSize, filteredAllRows.length)}</span>{" "}
                        {t("of")} <span className="fw-semibold">{filteredAllRows.length}</span> {t("entries")}
                      </div>
                    </div>
                    <div className="col-sm-auto">
                      <ul className="pagination pagination-separated pagination-md justify-content-center justify-content-sm-start mb-0">
                        <li className={page <= 1 ? "page-item disabled" : "page-item"}>
                          <a
                            href="#"
                            className="page-link"
                            onClick={(e) => {
                              e.preventDefault();
                              if (page > 1) setPage(page - 1);
                            }}
                          >
                            {t("Previous")}
                          </a>
                        </li>
                        {getVisiblePages().map((pNum) => (
                          <li key={pNum} className={page === pNum ? "page-item active" : "page-item"}>
                            <a
                              href="#"
                              className="page-link"
                              onClick={(e) => {
                                e.preventDefault();
                                setPage(pNum);
                              }}
                            >
                              {pNum}
                            </a>
                          </li>
                        ))}
                        <li className={page >= totalPages ? "page-item disabled" : "page-item"}>
                          <a
                            href="#"
                            className="page-link"
                            onClick={(e) => {
                              e.preventDefault();
                              if (page < totalPages) setPage(page + 1);
                            }}
                          >
                            {t("Next")}
                          </a>
                        </li>
                      </ul>
                    </div>
                  </Row>
                </div>
              </CardBody>
            </Card>
          )}

          {hasSearched && reportMode === "invoiceByParty" && (
            <Card className="shadow-lg border-0 rounded-3 mb-4">
              <CardBody>
                <div ref={printRef}>
                  <div className="d-flex flex-column flex-lg-row justify-content-between align-items-start gap-3 mb-3 border-bottom pb-3 cor-print-header">
                    <div className="d-flex align-items-start gap-3">
                      {companyLogoUrl ? (
                        <img
                          src={companyLogoUrl}
                          alt="Company Logo"
                          style={{ maxWidth: "96px", maxHeight: "90px", objectFit: "contain" }}
                        />
                      ) : null}
                      <div className="small text-body" style={{ lineHeight: 1.8 }}>
                        <div className="fw-bold">{companyInfo.companyName || "-"}</div>
                        {companyInfo.companyAddress ? <div>{companyInfo.companyAddress}</div> : null}
                        {companyInfo.companyAddress1 ? <div>{companyInfo.companyAddress1}</div> : null}
                        {companyInfo.companyAddress2 ? <div>{companyInfo.companyAddress2}</div> : null}
                        {companyInfo.companyPhone ? (
                          <div>
                            <strong>{t("Tel")}:</strong> {companyInfo.companyPhone}
                          </div>
                        ) : null}
                        {companyInfo.companyEmail ? (
                          <div>
                            <strong>{t("Email")}:</strong> {companyInfo.companyEmail}
                          </div>
                        ) : null}
                      </div>
                    </div>
                    <div className="text-center flex-grow-1">
                      {selectedParty?.label ? (
                        <div className="fw-bold fs-3 text-uppercase text-body">{selectedParty.label}</div>
                      ) : null}
                    </div>
                    <div className="text-lg-end cor-print-title">
                      <div className="fw-bold fs-5 text-body">{t("Commission Outstanding Report")}</div>
                      <div className="small text-muted">
                        {t("Date")}: {todayLabel}
                      </div>
                    </div>
                  </div>

                  <div className="table-responsive cor-print-wrap" style={{ maxHeight: "650px", overflow: "auto" }}>
                    <table className="table table-bordered table-sm align-middle mb-0">
                      <thead className="table-light" style={{ position: "sticky", top: 0, zIndex: 2 }}>
                        <tr>{PARTYWISE_COLUMNS.map(renderHeader)}</tr>
                      </thead>
                      <tbody>
                        {partyGrouped.length === 0 ? (
                          <tr>
                            <td colSpan={PARTYWISE_COLUMNS.length} className="text-center text-muted py-4">
                              {t("No data available.")}
                            </td>
                          </tr>
                        ) : (
                          partyGrouped.map(({ party, rows, subtotal }) => (
                            <React.Fragment key={party}>
                              <tr className="cor-group-header">
                                <td colSpan={PARTYWISE_COLUMNS.length}>{party}</td>
                              </tr>
                              {rows.map((row, idx) => (
                                <tr key={`${party}-${idx}`}>
                                  {PARTYWISE_COLUMNS.map((col) => (
                                    <td
                                      key={col.key}
                                      className={`text-nowrap small ${
                                        col.align === "right" ? "text-end" : "text-start"
                                      }`}
                                    >
                                      {formatCell(row, col)}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                              <tr className="cor-subtotal">
                                <td className="fw-bold" colSpan={FIRST_SUM_COL_INDEX}>
                                  {t("Total")} :
                                </td>
                                {PARTYWISE_COLUMNS.slice(FIRST_SUM_COL_INDEX).map((col) => (
                                  <td
                                    key={`sub-${col.key}`}
                                    className={`fw-bold ${col.align === "right" ? "text-end" : "text-start"}`}
                                  >
                                    {subtotalValue(subtotal, col)}
                                  </td>
                                ))}
                              </tr>
                            </React.Fragment>
                          ))
                        )}
                      </tbody>
                      {partyGrouped.length > 0 ? (
                        <tfoot
                          className="table-light"
                          style={{
                            position: "sticky",
                            bottom: 0,
                            backgroundColor: "var(--vz-light, #f2f2f2)",
                            zIndex: 2,
                            borderTop: "2px solid var(--vz-border-color)"
                          }}
                        >
                          <tr className="cor-grand-total">
                            <td className="fw-bold" colSpan={FIRST_SUM_COL_INDEX}>
                              {t("Grand Total")} :
                            </td>
                            {PARTYWISE_COLUMNS.slice(FIRST_SUM_COL_INDEX).map((col) => (
                              <td
                                key={`grand-${col.key}`}
                                className={`fw-bold ${col.align === "right" ? "text-end" : "text-start"}`}
                              >
                                {subtotalValue(invoicePartyGrandTotal, col)}
                              </td>
                            ))}
                          </tr>
                        </tfoot>
                      ) : null}
                    </table>
                  </div>

                  {companyInfo.companyFooter ? (
                    <div className="small text-muted mt-3">{companyInfo.companyFooter}</div>
                  ) : null}
                </div>
              </CardBody>
            </Card>
          )}
        </Container>
      </div>
      <ToastContainer closeButton={false} limit={1} />
    </React.Fragment>
  );
};

export default CommissionOutstandingReport;
