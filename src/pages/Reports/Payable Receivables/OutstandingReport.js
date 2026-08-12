import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  Card,
  CardBody,
  Col,
  Container,
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
  FormGroup,
  Input,
  Label,
  Row,
  UncontrolledDropdown
} from "reactstrap";
import Select from "react-select";
import { toast, ToastContainer } from "react-toastify";

import BreadCrumb from "../../../Components/Common/BreadCrumb";
import { useSettingReportDates } from "../../../Components/Hooks/useSettingReportDates";
import { exportToExcel } from "../../../helpers/excel_helper";
import {
  getAccGrpMasters,
  getOutstandingReport,
  getOutstandingReportDropdowns,
  getUserDropdown
} from "../../../helpers/fakebackend_helper";

const PRODUCT_TYPE_FALLBACK = [
  { value: "Parcel", label: "Parcel" },
  { value: "General", label: "General" },
  { value: "Solitaries", label: "Solitaries" },
  { value: "Jewellery", label: "Jewellery" }
];

const INVOICE_TYPE_FALLBACK = [
  { value: "LOCAL", label: "LOCAL" },
  { value: "External", label: "External" },
  { value: "Internal", label: "Internal" },
  { value: "Pend Sale", label: "Pend Sale" },
  { value: "HOLD", label: "HOLD" },
  { value: "LAB", label: "LAB" }
];
import {
  getCachedReportCompany,
  getReportCompanySettings,
  REPORT_COMPANY_SETTINGS_EVENT,
  resolveCompanyLogoUrl
} from "../../../helpers/reportCompanyDefaults";
import { openOutstandingTxnLink, productTypeToTrnType } from "../../../helpers/reportTxnLinks";

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
    if (key === undefined || key === null || key === "") continue;
    const v = lowerMap[String(key).toLowerCase()];
    if (v !== undefined && v !== null && v !== "") return v;
  }

  for (const key of candidates) {
    if (row[key] === 0 || row[key] === "0") return row[key];
  }
  for (const key of keys) {
    if (key === undefined || key === null || key === "") continue;
    const v = lowerMap[String(key).toLowerCase()];
    if (v === 0 || v === "0") return v;
  }

  return "";
};

const numVal = (row, ...keys) => {
  const raw = getRowVal(row, ...keys);
  if (raw === "" || raw === null || raw === undefined) return 0;
  const n = parseFloat(String(raw).replace(/,/g, ""));
  return Number.isNaN(n) ? 0 : n;
};

const ALL_COLUMNS = [
  { key: "view", header: "View", align: "center", excel: false },
  { key: "Date", header: "Date", align: "left" },
  { key: "InvoiceNo", header: "InvNo", align: "left" },
  { key: "TrnType", header: "TrnType", align: "left" },
  { key: "BillNo", header: "BillNo", align: "left" },
  { key: "DueDate", header: "DueDate", align: "left" },
  { key: "DueDays", header: "Due", align: "left" },
  { key: "Party", header: "Party", align: "left" },
  { key: "Totcts", header: "TotWeight", align: "right", sum: true, altKeys: ["totcts"] },
  { key: "Amount", header: "Tot Amount", align: "right", sum: true, bg: "#fed49c" },
  { key: "PaidAmount", header: "Paid Amount", align: "right", sum: true, bg: "#98ecc2" },
  { key: "ExDiff", header: "Ex.Diff", align: "right", sum: true },
  { key: "RemainAmount", header: "Remain Amount", align: "right", sum: true, bg: "#FFCCCB" },
  { key: "PostDateAmount", header: "PostDateAmount", align: "right", sum: true },
  { key: "ExportAmount", header: "ExportAmount", align: "right", sum: true },
  { key: "Seller", header: "Seller", align: "left" },
  { key: "InvType", header: "InvType", align: "left" },
  { key: "Symbol", header: "Currency", align: "left" },
  { key: "Disc", header: "Disc", align: "right" },
  { key: "PartyMobile", header: "PartyMobile", align: "left" },
  { key: "Broker", header: "Broker", align: "left" },
  { key: "BrokerMobile", header: "BrokerMobile", align: "left" },
  { key: "Rate", header: "Rate", align: "right" },
  { key: "Remarks", header: "Remarks", align: "left" },
  { key: "UserName", header: "UserName", align: "left" },
  { key: "ExpPartyName", header: "ExpParty", align: "left" }
];

const PARTYWISE_COLUMNS = [
  { key: "Date", header: "Date", align: "left" },
  { key: "InvoiceNo", header: "InvNo", align: "left" },
  { key: "TrnType", header: "TrnType", align: "left", requiredExclude: true },
  { key: "BillNo", header: "BillNo", align: "left" },
  { key: "DueDate", header: "DueDate", align: "left" },
  { key: "DueDays", header: "Due", align: "left" },
  { key: "Totcts", header: "Weight", align: "right", sum: true, altKeys: ["totcts"] },
  { key: "Amount", header: "Amount", align: "right", sum: true },
  { key: "PaidAmount", header: "PaidAmount", align: "right", sum: true },
  { key: "ExDiff", header: "Ex.Diff", align: "right", sum: true, requiredExclude: true },
  { key: "RemainAmount", header: "RemainAmount", align: "right", sum: true },
  { key: "PostDateAmount", header: "PostDateAmount", align: "right", sum: true, requiredExclude: true },
  { key: "ExportAmount", header: "ExportAmount", align: "right", sum: true, requiredExclude: true },
  { key: "Seller", header: "Seller", align: "left", requiredExclude: true },
  { key: "InvType", header: "InvType", align: "left", requiredExclude: true },
  { key: "Symbol", header: "Currency", align: "left", requiredExclude: true },
  { key: "Disc", header: "Disc", align: "right", sum: true, requiredExclude: true },
  { key: "PartyMobile", header: "PartyMobile", align: "left", requiredExclude: true },
  { key: "Broker", header: "Broker", align: "left", requiredExclude: true },
  { key: "BrokerMobile", header: "BrokerMobile", align: "left", requiredExclude: true },
  { key: "Rate", header: "Rate", align: "right", requiredExclude: true },
  { key: "Remarks", header: "Remarks", align: "left", requiredExclude: true },
  { key: "UserName", header: "UserName", align: "left", requiredExclude: true },
  { key: "ExpPartyName", header: "ExpParty", align: "left", requiredExclude: true }
];

const STATEMENT_COLUMNS = [
  { key: "InvoiceNo", header: "InvNo", align: "left" },
  { key: "Date", header: "Inv.Date", align: "left" },
  { key: "DueDate", header: "DueDate", align: "left" },
  { key: "DueDays", header: "Age", align: "left" },
  { key: "Amount", header: "Amount Due", align: "right", sum: false },
  { key: "PaidAmount", header: "Payments/Credits", align: "right", sum: false },
  { key: "RemainAmount", header: "Balance", align: "right", sum: true }
];

const OutstandingReport = () => {
  const { t } = useTranslation();
  const printRef = useRef(null);
  const { fromDate, toDate, getDates, mergeDates } = useSettingReportDates();

  const [loadingDropdowns, setLoadingDropdowns] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMode, setLoadingMode] = useState(""); // all | party | invoiceByParty
  const [hasSearched, setHasSearched] = useState(false);
  const [reportMode, setReportMode] = useState(""); // all | party | invoiceByParty
  const [dropdownData, setDropdownData] = useState({});
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
  const [loadingCommissions, setLoadingCommissions] = useState(false);

  const [brokerInput, setBrokerInput] = useState("");
  const [brokerOptions, setBrokerOptions] = useState([]);
  const [selectedBroker, setSelectedBroker] = useState(null);
  const [loadingBrokers, setLoadingBrokers] = useState(false);

  const [salesPersonOptions, setSalesPersonOptions] = useState([]);
  const [selectedSalesPerson, setSelectedSalesPerson] = useState(null);

  const [filters, setFilters] = useState({
    fromDate,
    toDate,
    fromDateDue: fromDate,
    toDateDue: toDate,
    fromDueChkBox: false,
    currency: "",
    dispCurrency: "",
    type: "",
    productType: "",
    subType: "",
    category: "",
    invNo: "",
    billNo: "",
    payable: false,
    receivable: true,
    summary: false,
    paidInvoice: false,
    checkAllCur: false
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

  const getOptions = useCallback(
    (dropdownKey, valueKey = "name") => {
      const pascalKey = dropdownKey.charAt(0).toUpperCase() + dropdownKey.slice(1);
      const list = dropdownData?.[dropdownKey] || dropdownData?.[pascalKey] || [];
      return list.map((item) => {
        const name = item.name ?? item.Name ?? item.id ?? item.ID ?? "";
        const id = item.id ?? item.ID ?? name;
        return {
          value: valueKey === "id" ? String(id) : String(name),
          label: String(name)
        };
      });
    },
    [dropdownData]
  );

  const invoiceTypeOptions = useMemo(() => {
    const fromApi = getOptions("type");
    if (fromApi.length) return fromApi;
    return INVOICE_TYPE_FALLBACK;
  }, [getOptions]);

  const productTypeOptions = useMemo(() => {
    const fromApi = getOptions("productType");
    const byValue = new Map();
    [...PRODUCT_TYPE_FALLBACK, ...fromApi].forEach((opt) => {
      const key = String(opt.value || "").trim();
      if (!key) return;
      if (!byValue.has(key.toLowerCase())) {
        byValue.set(key.toLowerCase(), { value: key, label: key });
      }
    });
    const ordered = [];
    PRODUCT_TYPE_FALLBACK.forEach((f) => {
      const hit = byValue.get(f.value.toLowerCase());
      if (hit) {
        ordered.push(hit);
        byValue.delete(f.value.toLowerCase());
      }
    });
    byValue.forEach((v) => ordered.push(v));
    return ordered.length ? ordered : PRODUCT_TYPE_FALLBACK;
  }, [getOptions]);

  const currencyLabel = useMemo(() => {
    const dispList = getOptions("currency", "id");
    const curList = getOptions("currency", "id");
    const disp = dispList.find((o) => o.value === String(filters.dispCurrency));
    const cur = curList.find((o) => o.value === String(filters.currency));
    if (disp?.label) return String(disp.label).toUpperCase();
    if (cur?.label) return String(cur.label).toUpperCase();
    return "USD";
  }, [filters.currency, filters.dispCurrency, getOptions]);

  useEffect(() => {
    const loadDropdowns = async () => {
      setLoadingDropdowns(true);
      try {
        const res = await getOutstandingReportDropdowns();
        if (res?.success || res?.Success) {
          const data = res.data || res.Data || {};
          setDropdownData(data);

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
        fromDateDue: prev.fromDueChkBox ? prev.fromDateDue || merged.fromDate : merged.fromDate,
        toDateDue: prev.fromDueChkBox ? prev.toDateDue || merged.toDate : merged.toDate
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
    const timer = setTimeout(() => handleAccountSearch(partyInput, setPartyOptions, setLoadingParties), 400);
    return () => clearTimeout(timer);
  }, [partyInput]);

  useEffect(() => {
    const timer = setTimeout(
      () => handleAccountSearch(commissionInput, setCommissionOptions, setLoadingCommissions),
      400
    );
    return () => clearTimeout(timer);
  }, [commissionInput]);

  useEffect(() => {
    const timer = setTimeout(() => handleAccountSearch(brokerInput, setBrokerOptions, setLoadingBrokers), 400);
    return () => clearTimeout(timer);
  }, [brokerInput]);

  const buildPayload = () => ({
    FromDate: filters.fromDate,
    ToDate: filters.toDate,
    FromDateDue: filters.fromDateDue,
    ToDateDue: filters.toDateDue,
    FromDueChkBox: !!filters.fromDueChkBox,
    Party: selectedParty?.value || null,
    Adat: selectedCommission?.value || null,
    Broker: selectedBroker?.value || null,
    Seller: null,
    SalesPerson: selectedSalesPerson?.value || null,
    Payable: !!filters.payable,
    Receivable: !!filters.receivable,
    SubType: filters.subType || null,
    Type: filters.type || null,
    TrnType: productTypeToTrnType(filters.productType) || null,
    Category: filters.category || null,
    InvNo: filters.invNo || null,
    BillNo: filters.billNo || null,
    Currency: filters.currency || null,
    DispCurrency: filters.dispCurrency || null,
    Summary: !!filters.summary,
    PaidInvoice: !!filters.paidInvoice,
    CheckAllCur: !!filters.checkAllCur
  });

  const runReport = async (mode) => {
    if (mode === "party" && !selectedParty?.value) {
      toast.warning(t("Please select a party before continuing."));
      return;
    }

    setLoading(true);
    setLoadingMode(mode);
    try {
      const response = await getOutstandingReport(buildPayload());
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
    setSelectedBroker(null);
    setSelectedSalesPerson(null);
    setPartyInput("");
    setCommissionInput("");
    setBrokerInput("");
    setGlobalSearch("");
    setColumnFilters({});
    setSortConfig({ key: "", direction: "" });
    setPage(1);
    setFilters(
      mergeDates(
        {
          fromDateDue: d.fromDate,
          toDateDue: d.toDate,
          fromDueChkBox: false,
          currency: "",
          dispCurrency: "",
          type: "",
          productType: "",
          subType: "",
          category: "",
          invNo: "",
          billNo: "",
          payable: false,
          receivable: true,
          summary: false,
          paidInvoice: false,
          checkAllCur: false
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
    let header = col.header;
    if (col.key === "Amount") header = `Tot ${currencyLabel} Amount`;
    if (col.key === "PaidAmount") header = `Paid ${currencyLabel} Amount`;
    if (col.key === "RemainAmount") header = `Remain ${currencyLabel} Amount`;

    const isSortable = col.key !== "view";
    const isSorted = sortConfig.key === col.key;
    return (
      <th
        key={col.key}
        className={`text-center text-nowrap small fw-semibold ${isSortable ? "cursor-pointer select-none" : ""}`}
        onClick={() => isSortable && handleSort(col.key)}
        style={isSortable ? { userSelect: "none", cursor: "pointer" } : undefined}
      >
        <div className="d-flex align-items-center justify-content-center">
          <span>{t(header)}</span>
          {isSortable && (
            <span className="ms-2">
              {isSorted ? (
                sortConfig.direction === "asc" ? (
                  <i className="mdi mdi-chevron-up text-muted"></i>
                ) : (
                  <i className="mdi mdi-chevron-down text-muted"></i>
                )
              ) : (
                <i className="mdi mdi-unfold-more-horizontal text-muted"></i>
              )}
            </span>
          )}
        </div>
      </th>
    );
  };
  const getVisiblePages = () => {
    if (totalPages <= 3) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const currentPageIdx = page - 1;
    if (currentPageIdx === 0) {
      return [1, 2, 3];
    } else if (currentPageIdx === totalPages - 1) {
      return [totalPages - 2, totalPages - 1, totalPages];
    } else {
      return [currentPageIdx, currentPageIdx + 1, currentPageIdx + 2];
    }
  };

  const sortedReportRows = useMemo(() => {
    const rows = [...(reportRows || [])];
    if (sortConfig.key && sortConfig.direction) {
      rows.sort((a, b) => {
        const col = STATEMENT_COLUMNS.find((c) => c.key === sortConfig.key) ||
                    ALL_COLUMNS.find((c) => c.key === sortConfig.key) ||
                    PARTYWISE_COLUMNS.find((c) => c.key === sortConfig.key);
        const altKeys = col ? col.altKeys || [] : [];
        let valA = getRowVal(a, sortConfig.key, ...altKeys);
        let valB = getRowVal(b, sortConfig.key, ...altKeys);

        const isNumeric = col && (
          col.sum || 
          sortConfig.key === "Code" || 
          sortConfig.key === "DueDays" || 
          sortConfig.key === "Rate" || 
          sortConfig.key === "Disc" || 
          sortConfig.key === "Pcs" ||
          sortConfig.key === "Amount" ||
          sortConfig.key === "PaidAmount" ||
          sortConfig.key === "RemainAmount"
        );

        if (isNumeric) {
          const numA = parseFloat(String(valA).replace(/,/g, "")) || 0;
          const numB = parseFloat(String(valB).replace(/,/g, "")) || 0;
          return sortConfig.direction === "asc" ? numA - numB : numB - numA;
        } else {
          const strA = String(valA).toLowerCase();
          const strB = String(valB).toLowerCase();
          if (strA < strB) return sortConfig.direction === "asc" ? -1 : 1;
          if (strA > strB) return sortConfig.direction === "asc" ? 1 : -1;
          return 0;
        }
      });
    }
    return rows;
  }, [reportRows, sortConfig]);

  const filteredAllRows = useMemo(() => {
    let rows = [...sortedReportRows];
    const q = globalSearch.trim().toLowerCase();
    if (q) {
      rows = rows.filter((r) =>
        ALL_COLUMNS.some((col) => {
          if (col.key === "view") return false;
          const val = String(getRowVal(r, col.key, ...(col.altKeys || [])) || "").toLowerCase();
          return val.includes(q);
        })
      );
    }
    Object.entries(columnFilters).forEach(([key, value]) => {
      const v = String(value || "").trim().toLowerCase();
      if (!v) return;
      rows = rows.filter((r) => {
        const col = ALL_COLUMNS.find((c) => c.key === key);
        const raw = String(getRowVal(r, key, ...((col && col.altKeys) || [])) || "").toLowerCase();
        return raw.includes(v);
      });
    });
    return rows;
  }, [sortedReportRows, globalSearch, columnFilters]);

  const pagedAllRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredAllRows.slice(start, start + pageSize);
  }, [filteredAllRows, page, pageSize]);

  const allTotals = useMemo(() => {
    const totals = {
      Totcts: 0,
      Amount: 0,
      PaidAmount: 0,
      ExDiff: 0,
      RemainAmount: 0,
      PostDateAmount: 0,
      ExportAmount: 0
    };
    filteredAllRows.forEach((r) => {
      totals.Totcts += numVal(r, "Totcts", "totcts");
      totals.Amount += numVal(r, "Amount");
      totals.PaidAmount += numVal(r, "PaidAmount");
      totals.ExDiff += numVal(r, "ExDiff");
      totals.RemainAmount += numVal(r, "RemainAmount");
      totals.PostDateAmount += numVal(r, "PostDateAmount");
      totals.ExportAmount += numVal(r, "ExportAmount");
    });
    return totals;
  }, [filteredAllRows]);

  const partyGrouped = useMemo(() => {
    const grouped = {};
    sortedReportRows.forEach((item) => {
      const key = getRowVal(item, "Party", "party") || "Unknown Party";
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(item);
    });

    const sortedParties = Object.keys(grouped);
    if (sortConfig.key === "Party" && sortConfig.direction) {
      sortedParties.sort((a, b) => {
        if (sortConfig.direction === "asc") return a.localeCompare(b);
        return b.localeCompare(a);
      });
    }

    return sortedParties.map((party) => {
      const rows = grouped[party];
      const subtotal = {
        Totcts: 0,
        Amount: 0,
        PaidAmount: 0,
        ExDiff: 0,
        RemainAmount: 0,
        PostDateAmount: 0,
        ExportAmount: 0,
        Disc: 0
      };
      rows.forEach((r) => {
        subtotal.Totcts += numVal(r, "Totcts", "totcts");
        subtotal.Amount += numVal(r, "Amount");
        subtotal.PaidAmount += numVal(r, "PaidAmount");
        subtotal.ExDiff += numVal(r, "ExDiff");
        subtotal.RemainAmount += numVal(r, "RemainAmount");
        subtotal.PostDateAmount += numVal(r, "PostDateAmount");
        subtotal.ExportAmount += numVal(r, "ExportAmount");
        subtotal.Disc += numVal(r, "Disc");
      });
      return { party, rows, subtotal };
    });
  }, [sortedReportRows, sortConfig]);

  const statementTotals = useMemo(() => {
    let balance = 0;
    sortedReportRows.forEach((r) => {
      balance += numVal(r, "RemainAmount");
    });
    return { RemainAmount: balance };
  }, [sortedReportRows]);

  const invoicePartyGrandTotal = useMemo(() => {
    const grand = {
      Totcts: 0,
      Amount: 0,
      PaidAmount: 0,
      ExDiff: 0,
      RemainAmount: 0,
      PostDateAmount: 0,
      ExportAmount: 0,
      Disc: 0
    };
    partyGrouped.forEach(({ subtotal }) => {
      Object.keys(grand).forEach((k) => {
        grand[k] += subtotal[k] || 0;
      });
    });
    return grand;
  }, [partyGrouped]);

  const companyLogoUrl = resolveCompanyLogoUrl(companyInfo?.companyLogo);

  const exportAllExcel = async () => {
    const amountHeader = `Tot ${currencyLabel} Amount`;
    const paidHeader = `Paid ${currencyLabel} Amount`;
    const remainHeader = `Remain ${currencyLabel} Amount`;
    const cols = ALL_COLUMNS.filter((c) => c.key !== "view").map((c) => {
      if (c.key === "Amount") return { ...c, header: amountHeader };
      if (c.key === "PaidAmount") return { ...c, header: paidHeader };
      if (c.key === "RemainAmount") return { ...c, header: remainHeader };
      return c;
    });
    const headers = cols.map((c) => c.header);
    const rows = filteredAllRows.map((r) =>
      cols.map((c) => {
        if (c.sum || c.key === "Rate") return fmtFixed(numVal(r, c.key, ...(c.altKeys || [])));
        return dashText(getRowVal(r, c.key, ...(c.altKeys || [])));
      })
    );
    rows.push(
      cols.map((c, idx) => {
        if (idx === 0) return t("Total");
        if (c.key === "Totcts") return fmtFixed(allTotals.Totcts, 3);
        if (c.key === "Amount") return fmtFixed(allTotals.Amount);
        if (c.key === "PaidAmount") return fmtFixed(allTotals.PaidAmount);
        if (c.key === "RemainAmount") return fmtFixed(allTotals.RemainAmount);
        return "";
      })
    );
    const res = await exportToExcel(headers, rows, "Outstanding", "Outstanding-Report");
    if (!res?.success) toast.error(t("Excel export failed."));
  };

  const exportInvoiceByPartyExcel = async (mode = "full") => {
    const cols =
      mode === "required" ? PARTYWISE_COLUMNS.filter((c) => !c.requiredExclude) : PARTYWISE_COLUMNS;
    const headers = ["Party", ...cols.map((c) => c.header)];
    const rows = [];
    let grand = {
      Totcts: 0,
      Amount: 0,
      PaidAmount: 0,
      ExDiff: 0,
      RemainAmount: 0,
      PostDateAmount: 0,
      ExportAmount: 0,
      Disc: 0
    };
    partyGrouped.forEach(({ party, rows: groupRows, subtotal }) => {
      rows.push([party, ...cols.map(() => "")]);
      groupRows.forEach((r) => {
        rows.push([
          "",
          ...cols.map((c) => {
            if (c.sum || c.key === "Rate") return fmtFixed(numVal(r, c.key, ...(c.altKeys || [])));
            return dashText(getRowVal(r, c.key, ...(c.altKeys || [])));
          })
        ]);
      });
      rows.push([
        t("Total"),
        ...cols.map((c) => (c.sum ? fmtFixed(subtotal[c.key] || 0) : ""))
      ]);
      Object.keys(grand).forEach((k) => {
        grand[k] += subtotal[k] || 0;
      });
    });
    rows.push([
      t("Grand Total"),
      ...cols.map((c) => (c.sum ? fmtFixed(grand[c.key] || 0) : ""))
    ]);
    const fileName =
      mode === "required" ? "Required-Partywise-Outstanding-Report" : "Partywise-Outstanding-Report";
    const res = await exportToExcel(headers, rows, "OutstandingParty", fileName);
    if (!res?.success) toast.error(t("Excel export failed."));
  };

  const handlePrint = () => {
    const node = printRef.current;
    if (!node) {
      toast.warning(t("No report is currently visible to print."));
      return;
    }

    const isInvoiceParty = reportMode === "invoiceByParty";
    const pageSizeCss = isInvoiceParty ? "A4 landscape" : "A4 portrait";
    const pageMargin = isInvoiceParty ? "6mm" : "10mm";
    const tableFontSize = isInvoiceParty ? "7.5px" : "11px";
    const cellPadding = isInvoiceParty ? "3px 4px" : "6px 8px";

    const clone = node.cloneNode(true);
    clone.querySelectorAll("button, .btn").forEach((el) => el.remove());
    clone.querySelectorAll(".mdi, .ri-eye-line, i.mdi-chevron-up, i.mdi-chevron-down, i.mdi-unfold-more-horizontal").forEach((el) => {
      const parent = el.closest("span.ms-2");
      if (parent) parent.remove();
      else el.remove();
    });
    clone.querySelectorAll(".table-responsive, .or-print-table-wrap").forEach((el) => {
      el.style.overflow = "visible";
      el.style.overflowX = "visible";
      el.style.overflowY = "visible";
      el.style.maxHeight = "none";
      el.style.height = "auto";
      el.classList.remove("table-responsive");
    });

    if (isInvoiceParty) {
      clone.querySelectorAll("tr").forEach((tr) => {
        if (tr.classList.contains("or-group-header")) {
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
    }

    const printWindow = window.open("", "", isInvoiceParty ? "height=900,width=1400" : "height=1000,width=1200");
    if (!printWindow) {
      toast.warning(t("Please allow pop-ups to print."));
      return;
    }

    printWindow.document.write("<html><head><title>Outstanding Report</title>");
    printWindow.document.write(`
<style>
  @page {
    size: ${pageSizeCss};
    margin: ${pageMargin};
  }

  html, body {
    margin: 0 !important;
    padding: 8px !important;
    width: 100% !important;
    background: #fff !important;
    color: #000 !important;
    font-family: Arial, Helvetica, sans-serif !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    overflow: visible !important;
  }

  * {
    box-sizing: border-box !important;
    box-shadow: none !important;
  }

  .table-responsive,
  .table-card,
  div[style] {
    overflow: visible !important;
    overflow-x: visible !important;
    overflow-y: visible !important;
    max-height: none !important;
    height: auto !important;
  }

  .no-print,
  button,
  .btn {
    display: none !important;
  }

  .d-flex { display: flex !important; }
  .flex-column { flex-direction: column !important; }
  .flex-lg-row { flex-direction: row !important; }
  .justify-content-between { justify-content: space-between !important; }
  .justify-content-md-end { justify-content: flex-end !important; }
  .align-items-start { align-items: flex-start !important; }
  .align-items-center { align-items: center !important; }
  .flex-grow-1 { flex-grow: 1 !important; }
  .gap-3 { gap: 12px !important; }
  .border-bottom { border-bottom: 1px solid #ccc !important; }
  .pb-3 { padding-bottom: 10px !important; }
  .mb-3 { margin-bottom: 12px !important; }
  .fw-bold { font-weight: 700 !important; }
  .fs-3 { font-size: 22px !important; }
  .fs-5 { font-size: 18px !important; }
  .text-uppercase { text-transform: uppercase !important; }
  .text-center { text-align: center !important; }
  .text-end, .text-lg-end { text-align: right !important; }
  .text-muted { color: #666 !important; }
  .small { font-size: ${isInvoiceParty ? "7.5px" : "11px"} !important; }

  .row {
    display: flex !important;
    flex-wrap: nowrap !important;
    flex-direction: row !important;
    width: 100% !important;
    gap: 16px !important;
    margin: 0 0 12px 0 !important;
  }
  .col-md-6 {
    flex: 1 1 50% !important;
    width: 50% !important;
    max-width: 50% !important;
  }

  .or-statement-title {
    font-size: 28px !important;
    font-weight: 800 !important;
    text-align: center !important;
    letter-spacing: 0.5px !important;
    color: #000 !important;
  }

  .or-party-box,
  .or-period-box {
    border: 1px solid #060708 !important;
    border-radius: 0 !important;
    padding: 10px 12px !important;
    min-height: 90px !important;
    background: #fff !important;
    color: #000 !important;
  }

  img {
    max-width: 96px !important;
    max-height: 90px !important;
    object-fit: contain !important;
  }

  table {
    width: 100% !important;
    max-width: 100% !important;
    border-collapse: collapse !important;
    table-layout: ${isInvoiceParty ? "fixed" : "auto"} !important;
    font-size: ${tableFontSize} !important;
    margin-top: 8px !important;
    page-break-inside: auto !important;
  }

  thead { display: table-header-group !important; }
  tfoot { display: table-footer-group !important; }
  tr { page-break-inside: avoid !important; }

  th, td {
    border: 1px solid #999 !important;
    padding: ${cellPadding} !important;
    color: #000 !important;
    vertical-align: middle !important;
    white-space: ${isInvoiceParty ? "normal" : "nowrap"} !important;
    word-break: break-word !important;
    overflow-wrap: anywhere !important;
  }

  th {
    background: #f2f2f2 !important;
    font-weight: 700 !important;
    text-align: center !important;
  }

  .or-group-header td {
    background: #f3f6f9 !important;
    font-weight: 700 !important;
    text-align: left !important;
    border-top: 2px solid #b3b3b3 !important;
    border-bottom: 2px solid #b3b3b3 !important;
  }

  .or-subtotal td,
  .or-grand-total td {
    font-weight: 700 !important;
    border-top: 2px solid #999 !important;
    border-bottom: 2px solid #999 !important;
  }

  @media print {
    html, body {
      overflow: visible !important;
      height: auto !important;
    }
    .table-responsive,
    .table-card {
      overflow: visible !important;
      max-height: none !important;
    }
  }
</style></head><body>`);
    printWindow.document.write(clone.innerHTML);
    printWindow.document.write("</body></html>");
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 400);
  };

  const renderCellValue = (row, col) => {
    if (col.key === "view") {
      const code = getRowVal(row, "Code", "code");
      const trn = getRowVal(row, "TrnType", "trnType");
      return (
        <button
          type="button"
          className="btn btn-soft-primary btn-sm"
          onClick={() => openOutstandingTxnLink(code, trn, filters.payable)}
          title={t("View")}
        >
          <i className="ri-eye-line" />
        </button>
      );
    }
    if (col.sum || col.key === "Rate" || col.key === "Amount" || col.key === "PaidAmount" || col.key === "RemainAmount") {
      const decimals = col.key === "Totcts" ? 3 : 2;
      return fmtFixed(numVal(row, col.key, ...(col.altKeys || [])), decimals);
    }
    return dashText(getRowVal(row, col.key, ...(col.altKeys || [])));
  };

  const todayLabel = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });

  document.title = `${t("Outstanding Report")} | ${t("Admin")}`;

  const totalPages = Math.max(1, Math.ceil(filteredAllRows.length / pageSize));

  return (
    <React.Fragment>
      <style>{`
        .or-amt-total { background-color: #fed49c !important; }
        .or-amt-paid { background-color: #98ecc2 !important; }
        .or-amt-remain { background-color: #FFCCCB !important; }
        .or-group-header td {
          background: #f3f6f9;
          font-weight: 700;
          border-top: 2px solid #b3b3b3;
          border-bottom: 2px solid #b3b3b3;
        }
        .or-subtotal td, .or-grand-total td {
          font-weight: 700;
          border-top: 2px solid #999;
          border-bottom: 2px solid #999;
        }
        .or-statement-title {
          font-size: 28px;
          font-weight: 800;
          letter-spacing: 0.5px;
        }
        .or-party-box, .or-period-box {
          border: 1px solid #060708;
          border-radius: 4px;
          padding: 10px 12px;
          min-height: 96px;
        }
        [data-layout-mode="dark"] .or-group-header td {
          background: #2b2c32;
        }
      `}</style>
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title={t("Payable Receivable Report")} pageTitle={t("Reports")} />

          <div className="card d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between mb-3 p-3 rounded-3 shadow-sm border gap-3">
            <h5 className="mb-0 fw-bold text-primary d-flex align-items-center gap-2">
              <i className="ri-file-list-3-line fs-20 text-primary" />
              {t("Payable Receivable Report")}
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
                    onClick={() => runReport("all")}
                  >
                    {loadingMode === "all" ? t("Loading...") : t("Outstanding (All)")}
                  </Button>
                  <Button
                    color="primary"
                    className="btn-sm rounded-2 px-3 py-1"
                    disabled={loading || loadingDropdowns}
                    onClick={() => runReport("party")}
                  >
                    {loadingMode === "party" ? t("Loading...") : t("Outstanding (Party)")}
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
                  {reportMode === "all" && (
                    <Button color="soft-success" className="btn-sm rounded-2 px-3 py-1" onClick={exportAllExcel}>
                      <i className="ri-file-excel-2-line align-middle me-1" />
                      {t("Excel")}
                    </Button>
                  )}
                  {reportMode === "invoiceByParty" && (
                    <>
                      <UncontrolledDropdown>
                        <DropdownToggle color="success" className="btn-sm rounded-2 px-3 py-1" caret>
                          <i className="ri-file-excel-2-line align-middle me-1" />
                          {t("Excel")}
                        </DropdownToggle>
                        <DropdownMenu style={{ minWidth: "180px", zIndex: 1050 }}>
                          <DropdownItem onClick={() => exportInvoiceByPartyExcel("full")}>
                            {t("Full Excel")}
                          </DropdownItem>
                          <DropdownItem onClick={() => exportInvoiceByPartyExcel("required")}>
                            {t("Required Filled Excel")}
                          </DropdownItem>
                        </DropdownMenu>
                      </UncontrolledDropdown>
                      <Button color="primary" className="btn-sm rounded-2 px-3 py-1" onClick={handlePrint}>
                        <i className="ri-printer-line align-middle me-1" />
                        {t("Print")}
                      </Button>
                    </>
                  )}
                  {reportMode === "party" && (
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
                      <Label className="fw-medium mb-1 small">{t("Currency")}</Label>
                      <Select
                        classNamePrefix="react-select"
                        styles={customStyles}
                        isClearable
                        options={getOptions("currency", "id")}
                        value={getOptions("currency", "id").find((o) => o.value === String(filters.currency)) || null}
                        onChange={(sel) => setFilters((p) => ({ ...p, currency: sel?.value || "" }))}
                        placeholder={t("Select Currency")}
                      />
                    </FormGroup>
                  </Col>
                  <Col sm={2}>
                    <FormGroup className="mb-0">
                      <Label className="fw-medium mb-1 small">{t("Type")}</Label>
                      <Select
                        classNamePrefix="react-select"
                        styles={customStyles}
                        isClearable
                        options={invoiceTypeOptions}
                        value={invoiceTypeOptions.find((o) => o.value === filters.type) || null}
                        onChange={(sel) => setFilters((p) => ({ ...p, type: sel?.value || "" }))}
                        placeholder={t("Select Type")}
                      />
                    </FormGroup>
                  </Col>
                  <Col sm={2}>
                    <FormGroup className="mb-0">
                      <Label className="fw-medium mb-1 small">{t("Sub Type")}</Label>
                      <Select
                        classNamePrefix="react-select"
                        styles={customStyles}
                        isClearable
                        options={getOptions("subType")}
                        value={getOptions("subType").find((o) => o.value === filters.subType) || null}
                        onChange={(sel) => setFilters((p) => ({ ...p, subType: sel?.value || "" }))}
                        placeholder={t("Select SubType")}
                      />
                    </FormGroup>
                  </Col>
                  <Col sm={2}>
                    <FormGroup className="mb-0">
                      <Label className="fw-medium mb-1 small">{t("Category")}</Label>
                      <Select
                        classNamePrefix="react-select"
                        styles={customStyles}
                        isClearable
                        options={getOptions("category")}
                        value={getOptions("category").find((o) => o.value === filters.category) || null}
                        onChange={(sel) => setFilters((p) => ({ ...p, category: sel?.value || "" }))}
                        placeholder={t("Select Category")}
                      />
                    </FormGroup>
                  </Col>
                </Row>

                <Row className="g-2 mb-2">
                  <Col sm={2}>
                    <FormGroup className="mb-0">
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <Input
                          type="checkbox"
                          id="fromDueChk"
                          checked={!!filters.fromDueChkBox}
                          onChange={(e) => setFilters((p) => ({ ...p, fromDueChkBox: e.target.checked }))}
                        />
                        <Label className="fw-medium mb-0 small" htmlFor="fromDueChk">
                          {t("From Due Date")}
                        </Label>
                      </div>
                      <Input
                        type="date"
                        className="form-control form-control-sm"
                        style={{ height: "35px" }}
                        disabled={!filters.fromDueChkBox}
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
                        disabled={!filters.fromDueChkBox}
                        value={filters.toDateDue || ""}
                        onChange={(e) => setFilters((p) => ({ ...p, toDateDue: e.target.value }))}
                      />
                    </FormGroup>
                  </Col>
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
                      <Label className="fw-medium mb-1 small">{t("Comm.Agent")}</Label>
                      <Select
                        classNamePrefix="react-select"
                        styles={customStyles}
                        isClearable
                        isLoading={loadingCommissions}
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
                        placeholder={t("Search Commission")}
                        noOptionsMessage={() =>
                          commissionInput.length < 2 ? t("Type 2+ characters") : t("No options")
                        }
                      />
                    </FormGroup>
                  </Col>
                  <Col sm={2}>
                    <FormGroup className="mb-0">
                      <Label className="fw-medium mb-1 small">{t("Broker")}</Label>
                      <Select
                        classNamePrefix="react-select"
                        styles={customStyles}
                        isClearable
                        isLoading={loadingBrokers}
                        options={brokerOptions}
                        value={selectedBroker}
                        inputValue={brokerInput}
                        onInputChange={(val, meta) => {
                          if (meta.action === "input-change") setBrokerInput(val);
                        }}
                        onChange={(sel) => {
                          setSelectedBroker(sel);
                          setBrokerInput("");
                          setBrokerOptions([]);
                        }}
                        placeholder={t("Search Broker")}
                        noOptionsMessage={() =>
                          brokerInput.length < 2 ? t("Type 2+ characters") : t("No options")
                        }
                      />
                    </FormGroup>
                  </Col>
                  <Col sm={2}>
                    <FormGroup className="mb-0">
                      <Label className="fw-medium mb-1 small d-block">{t("Payable / Receivable")}</Label>
                      <div className="d-flex align-items-center gap-3" style={{ height: "35px" }}>
                        <div className="form-check mb-0">
                          <Input
                            className="form-check-input"
                            type="radio"
                            name="payRec"
                            id="rdPayable"
                            checked={!!filters.payable}
                            onChange={() => setFilters((p) => ({ ...p, payable: true, receivable: false }))}
                          />
                          <Label className="form-check-label small" htmlFor="rdPayable">
                            {t("Payable")}
                          </Label>
                        </div>
                        <div className="form-check mb-0">
                          <Input
                            className="form-check-input"
                            type="radio"
                            name="payRec"
                            id="rdReceivable"
                            checked={!!filters.receivable}
                            onChange={() => setFilters((p) => ({ ...p, payable: false, receivable: true }))}
                          />
                          <Label className="form-check-label small" htmlFor="rdReceivable">
                            {t("Receivable")}
                          </Label>
                        </div>
                      </div>
                    </FormGroup>
                  </Col>
                </Row>

                <Row className="g-2 mb-2">
                  <Col sm={2}>
                    <FormGroup className="mb-0">
                      <Label className="fw-medium mb-1 small">{t("Invoice Number")}</Label>
                      <Input
                        type="text"
                        className="form-control form-control-sm"
                        style={{ height: "35px" }}
                        value={filters.invNo}
                        placeholder={t("InvNo")}
                        onChange={(e) => setFilters((p) => ({ ...p, invNo: e.target.value }))}
                      />
                    </FormGroup>
                  </Col>
                  <Col sm={2}>
                    <FormGroup className="mb-0">
                      <Label className="fw-medium mb-1 small">{t("Bill No")}</Label>
                      <Input
                        type="text"
                        className="form-control form-control-sm"
                        style={{ height: "35px" }}
                        value={filters.billNo}
                        placeholder={t("Bill No")}
                        onChange={(e) => setFilters((p) => ({ ...p, billNo: e.target.value }))}
                      />
                    </FormGroup>
                  </Col>
                  <Col sm={2}>
                    <FormGroup className="mb-0">
                      <Label className="fw-medium mb-1 small">{t("Display Currency")}</Label>
                      <Select
                        classNamePrefix="react-select"
                        styles={customStyles}
                        isClearable
                        options={getOptions("currency", "id")}
                        value={
                          getOptions("currency", "id").find((o) => o.value === String(filters.dispCurrency)) ||
                          null
                        }
                        onChange={(sel) => setFilters((p) => ({ ...p, dispCurrency: sel?.value || "" }))}
                        placeholder={t("Select Currency")}
                      />
                    </FormGroup>
                  </Col>
                  <Col sm={2}>
                    <FormGroup className="mb-0">
                      <Label className="fw-medium mb-1 small">{t("Type")}</Label>
                      <Select
                        classNamePrefix="react-select"
                        styles={customStyles}
                        isClearable
                        options={productTypeOptions}
                        value={productTypeOptions.find((o) => o.value === filters.productType) || null}
                        onChange={(sel) => setFilters((p) => ({ ...p, productType: sel?.value || "" }))}
                        placeholder={t("Select Type")}
                      />
                    </FormGroup>
                  </Col>
                  <Col sm={4}>
                    <FormGroup className="mb-0">
                      <Label className="fw-medium mb-1 small d-block">&nbsp;</Label>
                      <div className="d-flex flex-wrap align-items-center gap-3" style={{ minHeight: "35px" }}>
                        <div className="form-check mb-0">
                          <Input
                            className="form-check-input"
                            type="checkbox"
                            id="chkSummary"
                            checked={!!filters.summary}
                            onChange={(e) => setFilters((p) => ({ ...p, summary: e.target.checked }))}
                          />
                          <Label className="form-check-label small" htmlFor="chkSummary">
                            {t("Summary")}
                          </Label>
                        </div>
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
                            id="chkAllCur"
                            checked={!!filters.checkAllCur}
                            onChange={(e) => setFilters((p) => ({ ...p, checkAllCur: e.target.checked }))}
                          />
                          <Label className="form-check-label small" htmlFor="chkAllCur">
                            {t("Show all cur")}
                          </Label>
                        </div>
                      </div>
                    </FormGroup>
                  </Col>
                </Row>

                <Row className="g-2">
                  <Col sm={2}>
                    <FormGroup className="mb-0">
                      <Label className="fw-medium mb-1 small">{t("Salesperson")}</Label>
                      <Select
                        classNamePrefix="react-select"
                        styles={customStyles}
                        isClearable
                        isLoading={loadingDropdowns}
                        options={salesPersonOptions}
                        value={selectedSalesPerson}
                        onChange={(sel) => setSelectedSalesPerson(sel)}
                        placeholder={t("Select Salesperson")}
                        noOptionsMessage={() => t("No options")}
                      />
                    </FormGroup>
                  </Col>
                </Row>
              </CardBody>
            </Card>
          )}

          {hasSearched && reportMode === "all" && (
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
                      <i className="bx bx-search-alt search-icon"></i>
                    </div>
                  </Col>
                </Row>

                <div className="table-responsive table-card" style={{ maxHeight: "620px", overflow: "auto" }}>
                  <table className="table table-bordered table-hover table-sm align-middle mb-0">
                    <thead className="table-light" style={{ position: "sticky", top: 0, zIndex: 2 }}>
                      <tr>
                        {ALL_COLUMNS.map(renderHeader)}
                      </tr>
                      <tr>
                        {ALL_COLUMNS.map((col) => (
                          <th key={`f-${col.key}`} className="p-1">
                            {col.key === "view" ? null : (
                              <Input
                                type="text"
                                className="form-control form-control-sm"
                                value={columnFilters[col.key] || ""}
                                onChange={(e) => {
                                  setColumnFilters((p) => ({ ...p, [col.key]: e.target.value }));
                                  setPage(1);
                                }}
                              />
                            )}
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
                            {ALL_COLUMNS.map((col) => {
                              let cls = `text-nowrap small ${col.align === "right" ? "text-end" : col.align === "center" ? "text-center" : "text-start"}`;
                              if (col.key === "Amount") cls += " or-amt-total";
                              if (col.key === "PaidAmount") cls += " or-amt-paid";
                              if (col.key === "RemainAmount") cls += " or-amt-remain";
                              return (
                                <td key={col.key} className={cls} style={col.bg ? { backgroundColor: col.bg } : undefined}>
                                  {renderCellValue(row, col)}
                                </td>
                              );
                            })}
                          </tr>
                        ))
                      )}
                    </tbody>
                    <tfoot className="table-light" style={{ position: "sticky", bottom: 0, backgroundColor: "var(--vz-light, #f2f2f2)", zIndex: 2, borderTop: "2px solid var(--vz-border-color)" }}>
                      <tr className="or-grand-total">
                        {ALL_COLUMNS.map((col, idx) => {
                          let content = "";
                          if (idx === 0) {
                            content = t("Total");
                          } else if (col.sum) {
                            content = fmtFixed(allTotals[col.key] || 0, col.key === "Totcts" ? 3 : 2);
                          }
                          return (
                            <td
                              key={`t-${col.key}`}
                              className={`text-nowrap small fw-bold ${col.align === "right" ? "text-end" : "text-start"}`}
                            >
                              {content}
                            </td>
                          );
                        })}
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div className="mt-3" style={{ backgroundColor: "var(--vz-card-bg, #fff)", paddingTop: "8px", paddingBottom: "4px", borderTop: "1px solid var(--vz-border-color, #e9ebec)" }}>
                  <Row className="align-items-center mt-0 g-3 text-center text-sm-start">
                    <div className="col-sm">
                      <div className="text-muted">
                        {t("Showing")}{" "}
                        <span className="fw-semibold">
                          {filteredAllRows.length === 0 ? 0 : (page - 1) * pageSize + 1}
                        </span>{" "}
                        {t("to")}{" "}
                        <span className="fw-semibold">
                          {Math.min(page * pageSize, filteredAllRows.length)}
                        </span>{" "}
                        {t("of")}{" "}
                        <span className="fw-semibold">{filteredAllRows.length}</span>{" "}
                        {t("entries")}
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

          {hasSearched && reportMode === "party" && (
            <Card className="shadow-lg border-0 rounded-3 mb-4">
              <CardBody>
                <div ref={printRef}>
                  <div className="d-flex flex-column flex-lg-row justify-content-between align-items-start gap-3 mb-3 border-bottom pb-3">
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
                      <div className="or-statement-title text-body">{t("STATEMENT")}</div>
                    </div>
                    <div style={{ width: 180 }} />
                  </div>

                  <Row className="g-3 mb-3">
                    <Col md={6}>
                      <div className="or-party-box">
                        <div className="fw-bold text-body">{selectedParty?.label || getRowVal(reportRows[0], "Party", "party")}</div>
                        <div className="small text-body">{getRowVal(reportRows[0], "AddressLine1", "addressLine1")}</div>
                        <div className="small text-body">{getRowVal(reportRows[0], "AddressLine2", "addressLine2")}</div>
                        <div className="small text-body">{getRowVal(reportRows[0], "AddressLine3", "addressLine3")}</div>
                        <div className="small text-body">{getRowVal(reportRows[0], "PartyMobile", "partyMobile")}</div>
                      </div>
                    </Col>
                    <Col md={6} className="d-flex justify-content-md-end">
                      <div className="or-period-box text-center" style={{ width: "100%", maxWidth: 360 }}>
                        <div className="fw-bold mb-2">{t("Statement Period")}</div>
                        <div>
                          {t("Through")} {todayLabel}
                        </div>
                      </div>
                    </Col>
                  </Row>

                  <div className="table-responsive or-print-table-wrap">
                    <table className="table table-bordered table-sm align-middle mb-0">
                      <thead className="table-light">
                        <tr>
                          {STATEMENT_COLUMNS.map(renderHeader)}
                        </tr>
                      </thead>
                      <tbody>
                        {sortedReportRows.length === 0 ? (
                          <tr>
                            <td colSpan={STATEMENT_COLUMNS.length} className="text-center text-muted py-4">
                              {t("No data available.")}
                            </td>
                          </tr>
                        ) : (
                          sortedReportRows.map((row, idx) => (
                            <tr key={`st-${idx}`}>
                              {STATEMENT_COLUMNS.map((col) => (
                                <td
                                  key={col.key}
                                  className={`text-nowrap small ${col.align === "right" ? "text-end" : "text-start"}`}
                                >
                                  {col.align === "right"
                                    ? fmtFixed(numVal(row, col.key))
                                    : dashText(getRowVal(row, col.key))}
                                </td>
                              ))}
                            </tr>
                          ))
                        )}
                        <tr className="or-grand-total">
                          <td colSpan={5} className="fw-bold">
                            {t("Grand Total")} :
                          </td>
                          <td />
                          <td className="text-end fw-bold">{fmtFixed(statementTotals.RemainAmount)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {companyInfo.companyFooter ? (
                    <div className="small text-muted mt-3">{companyInfo.companyFooter}</div>
                  ) : null}
                </div>
              </CardBody>
            </Card>
          )}

          {hasSearched && reportMode === "invoiceByParty" && (
            <Card className="shadow-lg border-0 rounded-3 mb-4">
              <CardBody>
                <div ref={printRef}>
                  <div className="d-flex flex-column flex-lg-row justify-content-between align-items-start gap-3 mb-3 border-bottom pb-3">
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
                    <div className="text-lg-end">
                      <div className="fw-bold fs-5 text-body">{t("Payable Receivable Report")}</div>
                      <div className="small text-muted">
                        {t("Date")}: {todayLabel}
                      </div>
                    </div>
                  </div>

                  <div className="table-responsive or-print-table-wrap" style={{ maxHeight: "650px", overflow: "auto" }}>
                    <table className="table table-bordered table-sm align-middle mb-0">
                      <thead className="table-light" style={{ position: "sticky", top: 0, zIndex: 2 }}>
                        <tr>
                          <th className="text-center text-nowrap small fw-semibold no-print" />
                          {PARTYWISE_COLUMNS.map(renderHeader)}
                        </tr>
                      </thead>
                      <tbody>
                        {partyGrouped.length === 0 ? (
                          <tr>
                            <td colSpan={PARTYWISE_COLUMNS.length + 1} className="text-center text-muted py-4">
                              {t("No data available.")}
                            </td>
                          </tr>
                        ) : (
                          partyGrouped.map(({ party, rows, subtotal }) => (
                            <React.Fragment key={party}>
                              <tr className="or-group-header">
                                <td colSpan={PARTYWISE_COLUMNS.length + 1}>{party}</td>
                              </tr>
                              {rows.map((row, idx) => (
                                <tr key={`${party}-${idx}`}>
                                  <td className="text-center no-print">
                                    <button
                                      type="button"
                                      className="btn btn-soft-primary btn-sm no-print"
                                      onClick={() =>
                                        openOutstandingTxnLink(
                                          getRowVal(row, "Code", "code"),
                                          getRowVal(row, "TrnType", "trnType"),
                                          filters.payable
                                        )
                                      }
                                    >
                                      <i className="ri-eye-line" />
                                    </button>
                                  </td>
                                  {PARTYWISE_COLUMNS.map((col) => (
                                    <td
                                      key={col.key}
                                      className={`text-nowrap small ${col.align === "right" ? "text-end" : "text-start"}`}
                                    >
                                      {col.sum || col.key === "Rate"
                                        ? fmtFixed(numVal(row, col.key, ...(col.altKeys || [])), col.key === "Totcts" ? 3 : 2)
                                        : dashText(getRowVal(row, col.key, ...(col.altKeys || [])))}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                              <tr className="or-subtotal">
                                <td className="no-print" />
                                <td className="fw-bold">{t("Total")} :</td>
                                {PARTYWISE_COLUMNS.slice(1).map((col) => (
                                  <td key={`sub-${col.key}`} className="text-end fw-bold">
                                    {col.sum
                                      ? fmtFixed(subtotal[col.key] || 0, col.key === "Totcts" ? 3 : 2)
                                      : ""}
                                  </td>
                                ))}
                              </tr>
                            </React.Fragment>
                          ))
                        )}
                      </tbody>
                      {partyGrouped.length > 0 ? (
                        <tfoot className="table-light" style={{ position: "sticky", bottom: 0, backgroundColor: "var(--vz-light, #f2f2f2)", zIndex: 2, borderTop: "2px solid var(--vz-border-color)" }}>
                          <tr className="or-grand-total">
                            <td className="no-print" />
                            <td className="fw-bold">{t("Grand Total")} :</td>
                            {PARTYWISE_COLUMNS.slice(1).map((col) => (
                              <td key={`grand-${col.key}`} className="text-end fw-bold">
                                {col.sum
                                  ? fmtFixed(invoicePartyGrandTotal[col.key] || 0, col.key === "Totcts" ? 3 : 2)
                                  : ""}
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
      <ToastContainer />
    </React.Fragment>
  );
};

export default OutstandingReport;
