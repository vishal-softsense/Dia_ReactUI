import React, { useCallback, useEffect, useMemo, useState } from "react";
import { flexRender } from "@tanstack/react-table";
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
  Row,
  UncontrolledDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem
} from "reactstrap";
import Select from "react-select";
import { toast, ToastContainer } from "react-toastify";

import BreadCrumb from "../../../Components/Common/BreadCrumb";
import TableContainer from "../../../Components/Common/TableContainer";
import { exportToExcel } from "../../../helpers/excel_helper";

import {
  getSolitaireConsignmentInDropdowns,
  getSolitaireConsignmentInReport,
  getSolitaireConsignmentInSummary
} from "../../../helpers/fakebackend_helper";
import {
  getCachedReportCompany,
  getReportCompanySettings,
  REPORT_COMPANY_SETTINGS_EVENT,
  resolveCompanyLogoUrl
} from "../../../helpers/reportCompanyDefaults";
import { useSettingReportDates } from "../../../Components/Hooks/useSettingReportDates";

const dashText = (value) =>
  value === null || value === undefined || value === "" ? "-" : String(value);

const fmtFixed = (value, decimals) => {
  if (value === null || value === undefined || value === "" || Number.isNaN(Number(value)))
    return (0).toFixed(decimals);
  return Number(value).toFixed(decimals);
};

const getRowVal = (row, ...keys) => {
  for (const key of keys) {
    if (row?.[key] !== undefined && row?.[key] !== null && row?.[key] !== "") return row[key];
  }
  return "";
};

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH_MAP = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12
};

const parseReportDateParts = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const text = String(value).trim();
  if (!text) return null;

  const dmyMatch = text.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (dmyMatch) {
    return { day: Number(dmyMatch[1]), month: Number(dmyMatch[2]), year: Number(dmyMatch[3]) };
  }

  const dmyMmm = text.match(/^(\d{1,2})[-/]([A-Za-z]{3,9})[-/](\d{4})/);
  if (dmyMmm) {
    const monthKey = dmyMmm[2].slice(0, 3).toLowerCase();
    return {
      day: Number(dmyMmm[1]),
      month: MONTH_MAP[monthKey] || 1,
      year: Number(dmyMmm[3])
    };
  }

  const isoMatch = text.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (isoMatch) {
    return { day: Number(isoMatch[3]), month: Number(isoMatch[2]), year: Number(isoMatch[1]) };
  }

  return null;
};

const formatReportDisplayDate = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  const parts = parseReportDateParts(value);
  if (!parts) {
    const text = String(value).trim();
    return text || "-";
  }
  const d = String(parts.day).padStart(2, "0");
  const mmm = MONTH_NAMES[parts.month - 1] || "Jan";
  return `${d}-${mmm}-${parts.year}`;
};

const getRowDueDateRaw = (row) => getRowVal(row, "ConDATE", "conDATE", "condate", "Date", "date");

const getGroupedProduct = (row) => {
  const itemName = getRowVal(row, "ItemName", "itemName");
  if (itemName) return itemName;
  return [getRowVal(row, "ShapeId", "shapeId", "Shape", "shape"), getRowVal(row, "ColorId", "colorId", "Color", "color"), getRowVal(row, "ClarityId", "clarityId", "Clarity", "clarity")]
    .filter(Boolean)
    .join(" ");
};

const GROUPED_SUM_COLUMNS = ["Carats", "Purchase", "Return", "Balance", "Price", "Amount"];
const GROUPED_DECIMALS = {
  Carats: 3,
  Purchase: 3,
  Return: 3,
  Balance: 3,
  Price: 2,
  Amount: 2
};

const getGroupedNumeric = (row, key) => {
  const aliases = {
    Carats: ["Carats", "carats"],
    Purchase: ["Purchase", "purchase"],
    Return: ["Return", "return"],
    Balance: ["Balance", "balance"],
    Price: ["Price", "price"],
    Amount: ["Amount", "amount"]
  };
  return Number(getRowVal(row, ...(aliases[key] || [key])) || 0);
};

const buildGroupedReportSections = (rows, groupBy) => {
  const grouped = {};

  (rows || []).forEach((item) => {
    const key =
      groupBy === "PartyName"
        ? String(getRowVal(item, "Party", "party") || "Unknown Party")
        : String(getRowVal(item, "MemoNo", "memoNo") || "Unknown Memo");
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(item);
  });

  // Match MVC consignment-report.js: client-side Sr No (not SP RowIndex).
  // MemoNo group → one Sr No per memo (shared by all lines).
  // PartyName group → one Sr No per distinct MemoNo, global counter across parties.
  let srNo = 1;
  const sections = Object.keys(grouped).map((groupKey) => {
    const groupRows = grouped[groupKey];
    const first = groupRows[0];
    const subtotal = {};
    GROUPED_SUM_COLUMNS.forEach((c) => {
      subtotal[c] = 0;
    });
    groupRows.forEach((item) => {
      GROUPED_SUM_COLUMNS.forEach((c) => {
        subtotal[c] += getGroupedNumeric(item, c);
      });
    });

    let rowsWithSrNo;
    if (groupBy === "PartyName") {
      const invSrMap = {};
      rowsWithSrNo = groupRows.map((item) => {
        const invKey = String(getRowVal(item, "MemoNo", "memoNo", "InvNo", "invNo") || "");
        if (!(invKey in invSrMap)) {
          invSrMap[invKey] = srNo++;
        }
        return { ...item, _srNo: invSrMap[invKey] };
      });
    } else {
      const currentSrNo = srNo++;
      rowsWithSrNo = groupRows.map((item) => ({ ...item, _srNo: currentSrNo }));
    }

    return { groupKey, first, rows: rowsWithSrNo, subtotal };
  });

  const grandTotal = {};
  GROUPED_SUM_COLUMNS.forEach((c) => {
    grandTotal[c] = 0;
  });
  sections.forEach((section) => {
    GROUPED_SUM_COLUMNS.forEach((c) => {
      grandTotal[c] += section.subtotal[c];
    });
  });

  return { sections, grandTotal };
};

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const GROUPED_PRINT_STYLES = `
    @page {
        size: A4 landscape;
        margin: 2mm;
    }
    *, *::before, *::after { box-sizing: border-box; }
    html, body {
        font-family: Arial, sans-serif;
        font-size: 13.5px;
        color: #000;
        padding: 0;
        margin: 0;
    }
    #header {
        display: flex;
        flex-wrap: nowrap;
        justify-content: space-between;
        align-items: flex-start;
        max-width: 270mm;
        width: 100%;
        margin: 0 auto 8px auto;
    }
    #header .company-block {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        max-width: 70%;
    }
    #header img {
        max-height: 90px;
        width: 96px;
        object-fit: contain;
    }
    #header .company-text {
        font-size: 13px;
        line-height: 1.6;
    }
    #header .report-title {
        text-align: right;
        font-size: 20px;
        font-weight: 700;
        min-width: 180px;
    }
    #report-date-range {
        font-size: 12px;
        color: #555;
        margin-top: 4px;
        text-align: right;
    }
    #dynamic-consignment-report-table {
        border-collapse: collapse;
        table-layout: fixed;
        width: 100%;
        max-width: 270mm;
        margin: 16px auto 0 auto;
    }
    #dynamic-consignment-report-table th,
    #dynamic-consignment-report-table td {
        padding: 2px;
        font-size: 10px;
        border: 1px solid #000;
        vertical-align: middle;
        word-break: break-word;
        white-space: normal;
    }
    #dynamic-consignment-report-table thead th {
        background: #f2f2f2;
        text-align: center;
        font-weight: 600;
        white-space: nowrap;
    }
    /* Match MVC print widths (View omitted): Sr No → Amount */
    #dynamic-consignment-report-table col:nth-child(1) { width: 15mm; }
    #dynamic-consignment-report-table col:nth-child(2) { width: 15mm; }
    #dynamic-consignment-report-table col:nth-child(3) { width: 55mm; }
    #dynamic-consignment-report-table col:nth-child(4) { width: 80mm; }
    #dynamic-consignment-report-table col:nth-child(5) { width: 20mm; }
    #dynamic-consignment-report-table col:nth-child(6) { width: 20mm; }
    #dynamic-consignment-report-table col:nth-child(7) { width: 20mm; }
    #dynamic-consignment-report-table col:nth-child(8) { width: 20mm; }
    #dynamic-consignment-report-table col:nth-child(9) { width: 20mm; }
    #dynamic-consignment-report-table col:nth-child(10) { width: 20mm; }
    #dynamic-consignment-report-table th:nth-child(n+5),
    #dynamic-consignment-report-table td.col-num {
        text-align: right !important;
    }
    #dynamic-consignment-report-table tbody td.col-product {
        word-break: break-word;
        text-align: center;
    }
    #dynamic-consignment-report-table tbody td.col-text {
        text-align: center;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    #dynamic-consignment-report-table tbody td.col-num {
        white-space: nowrap;
        word-break: keep-all;
    }
    #dynamic-consignment-report-table .memo-info td {
        background: #f5f5f5;
        font-weight: 600;
        text-align: left !important;
        padding: 6px 8px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    #dynamic-consignment-report-table .subtotal td,
    #dynamic-consignment-report-table .grand-total td {
        font-weight: 700;
    }
    #dynamic-consignment-report-table .subtotal td.col-label,
    #dynamic-consignment-report-table .grand-total td.col-label {
        text-align: left !important;
        white-space: nowrap;
    }
    #dynamic-consignment-report-table .subtotal td.col-num,
    #dynamic-consignment-report-table .grand-total td.col-num {
        text-align: right !important;
        white-space: nowrap;
        word-break: keep-all;
    }
    #cpny-footer {
        max-width: 270mm;
        width: 100%;
        margin: 20px auto 0 auto;
        font-size: 12px;
    }
`;

const getTableTotals = (table) => {
  const rows = table.getFilteredRowModel().rows.map((r) => r.original);
  let totalCarats = 0, totalAmount = 0, totalReturn = 0, totalPurchase = 0;
  let totalMemoOut = 0, totalSale = 0, totalBalance = 0, totalBalanceAmt = 0;

  rows.forEach((r) => {
    if (r?.isParent) {
      totalCarats   += Number(r.Carats   || 0);
      totalAmount   += Number(r.Amount   || 0);
      totalReturn   += Number(r.Return   || 0);
      totalPurchase += Number(r.Purchase || 0);
      totalMemoOut  += Number(r.MemoOut  || 0);
      totalSale     += Number(r.Sale     || 0);
      totalBalance  += Number(r.Balance  || 0);
      totalBalanceAmt += Number(r.BalanceAmt || 0);
    }
  });

  return { totalCarats, totalAmount, totalReturn, totalPurchase, totalMemoOut, totalSale, totalBalance, totalBalanceAmt };
};

const SolitaireConsignmentReport = () => {
  const { t } = useTranslation();

  const { fromDate, toDate, getDates, mergeDates } = useSettingReportDates({ includeReturnDates: true });

  const [loadingDropdowns, setLoadingDropdowns] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSummaryMode, setIsSummaryMode] = useState(false);
  const [viewType, setViewType] = useState("table");

  const [dropdownData, setDropdownData] = useState({});
  const [companyInfo, setCompanyInfo] = useState(() => getCachedReportCompany());
  const [expandedMemoNos, setExpandedMemoNos] = useState(() => new Set());
  const [reportRows, setReportRows] = useState([]);
  const [summaryRows, setSummaryRows] = useState([]);

  const [filters, setFilters] = useState({
    fromDate,
    toDate,
    currency: "",
    invNo: "",
    type: "ALL",
    party: "",
    broker: "",
    seller: "",
    chkRtnDate: false,
    fromRtnDate: fromDate,
    toRtnDate: toDate,
    clear: false,
    summary: false,
    lotNo: "",
    shape: [],
    color: [],
    clarity: [],
    size: [],
    proportion: [],
    polish: [],
    symmetry: [],
    lab: [],
    fluorescence: [],
    milky: [],
    luster: [],
    natts: [],
    mines: [],
    productType: [],
    sieve: [],
    groupBy: "MemoNo"
  });

  const groupByOptions = useMemo(
    () => [
      { value: "MemoNo", label: t("Group by MemoNo") },
      { value: "PartyName", label: t("Group by PartyName") }
    ],
    [t]
  );

  const customStyles = useMemo(
    () => ({
      control: (provided) => ({
        ...provided,
        backgroundColor: "var(--vz-secondary-bg, #fff)",
        borderColor: "var(--vz-border-color, #ced4da)",
        color: "var(--vz-body-color, #495057)",
        height: "auto",
        minHeight: "35px"
      }),
      valueContainer: (provided) => ({
        ...provided,
        height: "auto",
        minHeight: "35px",
        padding: "0 6px",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center"
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
      }),
      multiValue: (provided) => ({ ...provided, backgroundColor: "var(--vz-light)", fontSize: "10px" })
    }),
    []
  );

  const getOptions = useCallback(
    (key) => {
      const list = dropdownData?.[key] || [];
      return list.map((item) => ({
        value: item.id ?? item.ID ?? item.value ?? "",
        label: String(item.name ?? item.Name ?? item.label ?? "").toUpperCase()
      }));
    },
    [dropdownData]
  );

  const getAccountOptions = useCallback(() => {
    const list = dropdownData?.["account"] || [];
    return list.map((item) => ({
      value: item.name ?? item.Name ?? "",
      label: String(item.name ?? item.Name ?? "").toUpperCase()
    }));
  }, [dropdownData]);

  useEffect(() => {
    const loadDropdowns = async () => {
      setLoadingDropdowns(true);
      try {
        const res = await getSolitaireConsignmentInDropdowns();
        if (res?.success || res?.Success) {
          setDropdownData(res.data || res.Data || {});
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
    setFilters((prev) => mergeDates(prev));
  }, [fromDate, toDate, mergeDates]);

  const handleMultiChange = (name, selected) => {
    setFilters((prev) => ({ ...prev, [name]: selected ? selected.map((x) => x.value) : [] }));
  };

  const handleClear = async () => {
    const d = await getDates();
    setHasSearched(false);
    setViewType("table");
    setExpandedMemoNos(new Set());
    setReportRows([]);
    setSummaryRows([]);
    setIsSummaryMode(false);
    setFilters(mergeDates({
      currency: "",
      invNo: "",
      type: "ALL",
      party: "",
      broker: "",
      seller: "",
      chkRtnDate: false,
      clear: false,
      summary: false,
      lotNo: "",
      shape: [], color: [], clarity: [], size: [], proportion: [], polish: [],
      symmetry: [], lab: [], fluorescence: [], milky: [], luster: [], natts: [],
      mines: [], productType: [], sieve: [],
      groupBy: "MemoNo"
    }, d));
  };

  const buildPayload = () => ({
    FromDate: filters.fromDate,
    ToDate: filters.toDate,
    Currency: filters.currency || null,
    InvNo: filters.invNo || null,
    Type: filters.type || "ALL",
    Party: filters.party || null,
    Broker: filters.broker || null,
    Seller: filters.seller || null,
    ExpParty: filters.seller || null,
    ChkRtnDate: filters.chkRtnDate,
    FromRtnDate: filters.fromRtnDate,
    ToRtnDate: filters.toRtnDate,
    Clear: filters.clear,
    Summary: filters.summary,
    LotNo: filters.lotNo || null,
    Shape: filters.shape,
    Color: filters.color,
    Clarity: filters.clarity,
    Size: filters.size,
    Proportion: filters.proportion,
    Polish: filters.polish,
    Symmetry: filters.symmetry,
    LAB: filters.lab,
    Fluorescence: filters.fluorescence,
    Milky: filters.milky,
    Luster: filters.luster,
    Natts: filters.natts,
    Mines: filters.mines,
    ProductType: filters.productType,
    Sieve: filters.sieve
  });

  const handleReport = async () => {
    setLoading(true);
    try {
      const payload = buildPayload();
      const isSummary = filters.summary;
      setIsSummaryMode(isSummary);

      if (isSummary) {
        const response = await getSolitaireConsignmentInSummary(payload);
        const ok = response?.success || response?.Success;
        if (ok) {
          setSummaryRows(response.Data || response.data || []);
          setReportRows([]);
          setHasSearched(true);
          setViewType("table");
          setExpandedMemoNos(new Set());
          toast.success(t("Report loaded successfully."));
        } else {
          toast.warning(response?.Message || t("Failed to load report."));
        }
      } else {
        const response = await getSolitaireConsignmentInReport(payload);
        const ok = response?.success || response?.Success;
        if (ok) {
          setReportRows(response.Data || response.data || []);
          setSummaryRows([]);
          setHasSearched(true);
          setViewType("table");
          setExpandedMemoNos(new Set());
          toast.success(t("Report loaded successfully."));
        } else {
          toast.warning(response?.Message || t("Failed to load report."));
        }
      }
    } catch (err) {
      console.error("Consignment report request failed:", err);
      const msg =
        typeof err === "string"
          ? err
          : err?.response?.data?.message || err?.response?.data?.Message || null;
      toast.error(msg || t("Server Connection Problem.."));
    } finally {
      setLoading(false);
    }
  };

  const handleGroupedReport = async () => {
    setLoading(true);
    try {
      const response = await getSolitaireConsignmentInReport(buildPayload());
      const ok = response?.success || response?.Success;
      if (ok) {
        setIsSummaryMode(false);
        setSummaryRows([]);
        setReportRows(response.Data || response.data || []);
        setHasSearched(true);
        setViewType("grouped");
        setExpandedMemoNos(new Set());
        toast.success(t("Report loaded successfully."));
      } else {
        toast.warning(response?.Message || t("Failed to load report."));
      }
    } catch (err) {
      console.error("Consignment grouped report request failed:", err);
      const msg =
        typeof err === "string"
          ? err
          : err?.response?.data?.message || err?.response?.data?.Message || null;
      toast.error(msg || t("Server Connection Problem.."));
    } finally {
      setLoading(false);
    }
  };

  const groupedReportData = useMemo(
    () => buildGroupedReportSections(reportRows, filters.groupBy || "MemoNo"),
    [reportRows, filters.groupBy]
  );

  const companyLogoUrl = useMemo(() => resolveCompanyLogoUrl(companyInfo?.companyLogo), [companyInfo?.companyLogo]);

  const handlePrintGroupedReport = () => {
    const { sections, grandTotal } = groupedReportData;
    if (!sections.length) return;

    const logoHtml = companyLogoUrl
      ? `<img src="${escapeHtml(companyLogoUrl)}" alt="Company Logo" />`
      : "";

    const headerHtml = `
            <div id="header">
                <div class="company-block">
                    ${logoHtml}
                    <div class="company-text">
                        <div><strong>${escapeHtml(companyInfo?.companyName)}</strong></div>
                        <div>${escapeHtml(companyInfo?.companyAddress)}</div>
                        ${companyInfo?.companyAddress1 ? `<div>${escapeHtml(companyInfo.companyAddress1)}</div>` : ""}
                        ${companyInfo?.companyAddress2 ? `<div>${escapeHtml(companyInfo.companyAddress2)}</div>` : ""}
                        ${companyInfo?.companyPhone ? `<div><strong>${escapeHtml(t("Tel"))}:</strong> ${escapeHtml(companyInfo.companyPhone)}</div>` : ""}
                        ${companyInfo?.companyEmail ? `<div><strong>${escapeHtml(t("Email"))}:</strong> ${escapeHtml(companyInfo.companyEmail)}</div>` : ""}
                    </div>
                </div>
                <div>
                    <div class="report-title">${escapeHtml(t("Consignment Report"))}</div>
                    <div id="report-date-range">
                        <div><strong>${escapeHtml(t("From"))}:</strong> ${escapeHtml(filters.fromDate)}</div>
                        <div><strong>${escapeHtml(t("To"))}:</strong> ${escapeHtml(filters.toDate)}</div>
                    </div>
                </div>
            </div>
        `;

    let bodyRows = "";
    sections.forEach((section) => {
      const infoText =
        filters.groupBy === "PartyName"
          ? `<strong>${escapeHtml(t("Party"))}:</strong> ${escapeHtml(section.groupKey)} &nbsp;|&nbsp; <strong>${escapeHtml(t("Date"))}:</strong> ${escapeHtml(formatReportDisplayDate(getRowDueDateRaw(section.first)))}`
          : `<strong>${escapeHtml(t("Party"))}:</strong> ${escapeHtml(getRowVal(section.first, "Party", "party"))} &nbsp;|&nbsp; <strong>${escapeHtml(t("Memo No"))}:</strong> ${escapeHtml(section.groupKey)} &nbsp;|&nbsp; <strong>${escapeHtml(t("Date"))}:</strong> ${escapeHtml(formatReportDisplayDate(getRowDueDateRaw(section.first)))}`;

      bodyRows += `<tr class="memo-info"><td colspan="10">${infoText}</td></tr>`;

      section.rows.forEach((row) => {
        bodyRows += `
                    <tr>
                        <td class="col-text">${escapeHtml(row._srNo ?? "")}</td>
                        <td class="col-text">${escapeHtml(getRowVal(row, "MemoNo", "memoNo"))}</td>
                        <td class="col-text">${escapeHtml(getRowVal(row, "Lotno", "lotno", "LotNo"))}</td>
                        <td class="col-product">${escapeHtml(getGroupedProduct(row))}</td>
                        <td class="col-num">${escapeHtml(fmtFixed(getGroupedNumeric(row, "Carats"), GROUPED_DECIMALS.Carats))}</td>
                        <td class="col-num">${escapeHtml(fmtFixed(getGroupedNumeric(row, "Purchase"), GROUPED_DECIMALS.Purchase))}</td>
                        <td class="col-num">${escapeHtml(fmtFixed(getGroupedNumeric(row, "Return"), GROUPED_DECIMALS.Return))}</td>
                        <td class="col-num">${escapeHtml(fmtFixed(getGroupedNumeric(row, "Balance"), GROUPED_DECIMALS.Balance))}</td>
                        <td class="col-num">${escapeHtml(fmtFixed(getGroupedNumeric(row, "Price"), GROUPED_DECIMALS.Price))}</td>
                        <td class="col-num">${escapeHtml(fmtFixed(getGroupedNumeric(row, "Amount"), GROUPED_DECIMALS.Amount))}</td>
                    </tr>
                `;
      });

      // MVC print (View removed): colspan covers Sr No + MemoNo, then empty LotNo + Product
      bodyRows += `
                <tr class="subtotal">
                    <td colspan="2" class="col-label" style="padding-left:24px;"><strong>${escapeHtml(t("Total"))}</strong></td>
                    <td></td>
                    <td></td>
                    ${GROUPED_SUM_COLUMNS.map(
                      (colKey) =>
                        `<td class="col-num"><strong>${escapeHtml(fmtFixed(section.subtotal[colKey], GROUPED_DECIMALS[colKey]))}</strong></td>`
                    ).join("")}
                </tr>
            `;
    });

    bodyRows += `
            <tr class="grand-total">
                <td colspan="2" class="col-label" style="padding-left:24px;"><strong>${escapeHtml(t("Grand Total"))}</strong></td>
                <td></td>
                <td></td>
                ${GROUPED_SUM_COLUMNS.map(
                  (colKey) =>
                    `<td class="col-num"><strong>${escapeHtml(fmtFixed(grandTotal[colKey], GROUPED_DECIMALS[colKey]))}</strong></td>`
                ).join("")}
            </tr>
        `;

    const tableHtml = `
            <table id="dynamic-consignment-report-table">
                <colgroup>
                    <col /><col /><col /><col /><col />
                    <col /><col /><col /><col /><col />
                </colgroup>
                <thead>
                    <tr>
                        <th>Sr No</th>
                        <th>MemoNo</th>
                        <th>${escapeHtml(t("LotNo"))}</th>
                        <th>${escapeHtml(t("Product"))}</th>
                        <th>${escapeHtml(t("Carats"))}</th>
                        <th>${escapeHtml(t("Purchase"))}</th>
                        <th>${escapeHtml(t("Return"))}</th>
                        <th>${escapeHtml(t("Balance"))}</th>
                        <th>${escapeHtml(t("Price"))}</th>
                        <th>${escapeHtml(t("Amount"))}</th>
                    </tr>
                </thead>
                <tbody>${bodyRows}</tbody>
            </table>
        `;

    const footerHtml = companyInfo?.companyFooter
      ? `<div id="cpny-footer">${escapeHtml(companyInfo.companyFooter)}</div>`
      : `<div id="cpny-footer"></div>`;

    const printWindow = window.open("", "", "height=1000,width=1200");
    if (!printWindow) return;

    printWindow.document.write(`<!DOCTYPE html><html><head><title>${escapeHtml(t("Consignment Report"))}</title>`);
    printWindow.document.write(`<style>${GROUPED_PRINT_STYLES}</style>`);
    printWindow.document.write("</head><body>");
    printWindow.document.write(headerHtml);
    printWindow.document.write(tableHtml);
    printWindow.document.write(footerHtml);
    printWindow.document.write("</body></html>");
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const renderGroupedValue = (row, key) => {
    if (GROUPED_DECIMALS[key] !== undefined) {
      return fmtFixed(getGroupedNumeric(row, key), GROUPED_DECIMALS[key]);
    }
    return dashText(getRowVal(row, key));
  };

  const groupedVisibleRows = useMemo(() => {
    const grouped = {};
    (reportRows || []).forEach((r) => {
      const key = String(r.MemoNo ?? r.memoNo ?? "UNKNOWN");
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(r);
    });

    const out = [];
    Object.keys(grouped).forEach((memoNo) => {
      const rows = grouped[memoNo];
      const first = rows[0];

      const totalCarats    = rows.reduce((s, r) => s + Number(getRowVal(r, "Carats", "carats") || 0), 0);
      const totalAmount    = rows.reduce((s, r) => s + Number(getRowVal(r, "Amount", "amount") || 0), 0);
      const totalReturn    = rows.reduce((s, r) => s + Number(getRowVal(r, "Return", "return") || 0), 0);
      const totalPurchase  = rows.reduce((s, r) => s + Number(getRowVal(r, "Purchase", "purchase") || 0), 0);
      const totalMemoOut   = rows.reduce((s, r) => s + Number(getRowVal(r, "MemoOut", "memoOut", "memoout") || 0), 0);
      const totalSale      = rows.reduce((s, r) => s + Number(getRowVal(r, "Sale", "sale") || 0), 0);
      const totalBalance   = rows.reduce((s, r) => s + Number(getRowVal(r, "Balance", "balance") || 0), 0);
      const totalBalanceAmt = rows.reduce((s, r) => s + Number(getRowVal(r, "BalanceAmt", "balanceAmt", "balanceamt") || 0), 0);
      const totalPrice     = totalCarats > 0 ? totalAmount / totalCarats : 0;

      out.push({
        isParent: true,
        MemoNo: memoNo,
        ConDATE: getRowVal(first, "ConDATE", "conDATE", "condate"),
        BillNo: getRowVal(first, "BillNo", "billNo", "billno"),
        Party: getRowVal(first, "Party", "party"),
        Broker: getRowVal(first, "Broker", "broker"),
        IssUser: getRowVal(first, "IssUser", "issUser"),
        Seller: getRowVal(first, "Seller", "seller"),
        Invtype: getRowVal(first, "Invtype", "invtype", "InvType", "invType"),
        Status: getRowVal(first, "Status", "status"),
        Code: getRowVal(first, "Code", "code"),
        Carats: totalCarats,
        Price: totalPrice,
        Amount: totalAmount,
        Return: totalReturn,
        Purchase: totalPurchase,
        MemoOut: totalMemoOut,
        Sale: totalSale,
        Balance: totalBalance,
        BalanceAmt: totalBalanceAmt,
        childRecords: rows
      });
    });

    return out;
  }, [reportRows]);

  const renderSubRows = useCallback(
    (row) => {
      const parent = row.original;
      const memoKey = String(parent.MemoNo ?? "");
      if (!expandedMemoNos.has(memoKey)) return null;

      const children = parent.childRecords || [];
      return children.map((child, index) => (
        <tr key={`child-${memoKey}-${index}`} className="child-row">
          {row.getVisibleCells().map((cell) => {
            const column = cell.column;
            return (
              <td key={cell.id} className={column.columnDef.className || ""}>
                {column.columnDef.cell
                  ? flexRender(column.columnDef.cell, {
                      ...cell.getContext(),
                      row: { ...row, original: { ...child, isParent: false } }
                    })
                  : dashText(child[column.columnDef.accessorKey])}
              </td>
            );
          })}
        </tr>
      ));
    },
    [expandedMemoNos]
  );

  const columns = useMemo(
    () => [
      {
        header: "",
        accessorKey: "isParent",
        enableColumnFilter: false,
        enableSorting: false,
        cell: ({ row }) => {
          const r = row.original;
          if (!r?.isParent) return "";
          const memoKey = String(r.MemoNo ?? "");
          const expanded = expandedMemoNos.has(memoKey);
          return (
            <i
              className={expanded ? "bx bx-chevron-down" : "bx bx-chevron-right"}
              style={{ cursor: "pointer", color: "#2c7be5", fontSize: "18px", verticalAlign: "middle" }}
              onClick={() => {
                setExpandedMemoNos((prev) => {
                  const next = new Set();
                  if (!prev.has(memoKey)) next.add(memoKey);
                  return next;
                });
              }}
            />
          );
        }
      },
      {
        header: t("View"),
        accessorKey: "Code",
        enableColumnFilter: false,
        enableSorting: false,
        cell: ({ row }) => {
          const r = row.original;
          if (r?.isParent) return "";
          const code = getRowVal(r, "Code", "code");
          return (
            <div className="report-action">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  window.open(`../consignment/edit-consignment?Id=${code}&Mode=view`, "_blank");
                }}
              >
                <i className="bx bx-show-alt"></i>
              </a>
            </div>
          );
        },
        footer: () => <span className="fw-bold text-center d-block">Total</span>
      },
      {
        header: t("DATE"),
        accessorKey: "ConDATE",
        cell: ({ row }) => dashText(getRowVal(row.original, "ConDATE", "conDATE"))
      },
      {
        header: t("BillNo"),
        accessorKey: "BillNo",
        cell: ({ row }) => row.original.isParent ? "" : dashText(getRowVal(row.original, "BillNo", "billNo"))
      },
      {
        header: t("MemoNo"),
        accessorKey: "MemoNo",
        cell: ({ row }) => dashText(getRowVal(row.original, "MemoNo", "memoNo"))
      },
      {
        header: t("Party"),
        accessorKey: "Party",
        cell: ({ row }) => dashText(getRowVal(row.original, "Party", "party"))
      },
      {
        header: t("LotNo"),
        accessorKey: "Lotno",
        cell: ({ row }) => row.original.isParent ? "" : dashText(getRowVal(row.original, "Lotno", "lotno", "LotNo"))
      },
      {
        header: t("Shape"),
        accessorKey: "ShapeId",
        cell: ({ row }) => row.original.isParent ? "" : dashText(getRowVal(row.original, "ShapeId", "shapeId"))
      },
      {
        header: t("Color"),
        accessorKey: "ColorId",
        cell: ({ row }) => row.original.isParent ? "" : dashText(getRowVal(row.original, "ColorId", "colorId"))
      },
      {
        header: t("Clarity"),
        accessorKey: "ClarityId",
        cell: ({ row }) => row.original.isParent ? "" : dashText(getRowVal(row.original, "ClarityId", "clarityId"))
      },
      {
        header: t("Carats"),
        accessorKey: "Carats",
        className: "carat-col text-end",
        cell: ({ row }) => fmtFixed(getRowVal(row.original, "Carats", "carats"), 3),
        footer: ({ table }) => {
          const { totalCarats } = getTableTotals(table);
          return <span className="fw-bold text-end d-block" style={{ background: "rgb(204,204,255)", color: "#000" }}>{fmtFixed(totalCarats, 3)}</span>;
        }
      },
      {
        header: t("Price"),
        accessorKey: "Price",
        cell: ({ row }) => fmtFixed(getRowVal(row.original, "Price", "price"), 2),
        footer: ({ table }) => {
          const { totalCarats, totalAmount } = getTableTotals(table);
          return <span className="fw-bold text-end d-block">{fmtFixed(totalCarats > 0 ? totalAmount / totalCarats : 0, 2)}</span>;
        }
      },
      {
        header: t("Amount"),
        accessorKey: "Amount",
        cell: ({ row }) => fmtFixed(getRowVal(row.original, "Amount", "amount"), 2),
        footer: ({ table }) => {
          const { totalAmount } = getTableTotals(table);
          return <span className="fw-bold text-end d-block">{fmtFixed(totalAmount, 2)}</span>;
        }
      },
      {
        header: t("Status"),
        accessorKey: "Status",
        cell: ({ row }) => {
          const val = dashText(getRowVal(row.original, "Status", "status"));
          return <span style={{ color: "#725f5f", fontWeight: "bold" }}>{val}</span>;
        }
      },
      {
        header: t("Return"),
        accessorKey: "Return",
        className: "rtn-col text-end",
        cell: ({ row }) => fmtFixed(getRowVal(row.original, "Return", "return"), 3),
        footer: ({ table }) => {
          const { totalReturn } = getTableTotals(table);
          return <span className="fw-bold text-end d-block" style={{ background: "rgb(153,204,255)", color: "#000" }}>{fmtFixed(totalReturn, 3)}</span>;
        }
      },
      {
        header: t("Purchase"),
        accessorKey: "Purchase",
        className: "pur-col text-end",
        cell: ({ row }) => fmtFixed(getRowVal(row.original, "Purchase", "purchase"), 3),
        footer: ({ table }) => {
          const { totalPurchase } = getTableTotals(table);
          return <span className="fw-bold text-end d-block" style={{ background: "rgb(204,255,201)", color: "#000" }}>{fmtFixed(totalPurchase, 3)}</span>;
        }
      },
      {
        header: t("MemoOut"),
        accessorKey: "MemoOut",
        cell: ({ row }) => fmtFixed(getRowVal(row.original, "MemoOut", "memoOut"), 3),
        footer: ({ table }) => {
          const { totalMemoOut } = getTableTotals(table);
          return <span className="fw-bold text-end d-block">{fmtFixed(totalMemoOut, 3)}</span>;
        }
      },
      {
        header: t("Sale"),
        accessorKey: "Sale",
        cell: ({ row }) => fmtFixed(getRowVal(row.original, "Sale", "sale"), 3),
        footer: ({ table }) => {
          const { totalSale } = getTableTotals(table);
          return <span className="fw-bold text-end d-block">{fmtFixed(totalSale, 3)}</span>;
        }
      },
      {
        header: t("Balance"),
        accessorKey: "Balance",
        className: "bal-col text-end",
        cell: ({ row }) => fmtFixed(getRowVal(row.original, "Balance", "balance"), 3),
        footer: ({ table }) => {
          const { totalBalance } = getTableTotals(table);
          return <span className="fw-bold text-end d-block" style={{ background: "rgb(255,204,153)", color: "#000" }}>{fmtFixed(totalBalance, 3)}</span>;
        }
      },
      {
        header: t("BalanceAmt"),
        accessorKey: "BalanceAmt",
        cell: ({ row }) => fmtFixed(getRowVal(row.original, "BalanceAmt", "balanceAmt"), 2),
        footer: ({ table }) => {
          const { totalBalanceAmt } = getTableTotals(table);
          return <span className="fw-bold text-end d-block">{fmtFixed(totalBalanceAmt, 2)}</span>;
        }
      },
      { header: t("Broker"), accessorKey: "Broker", cell: ({ row }) => dashText(getRowVal(row.original, "Broker", "broker")) },
      { header: t("IssUser"), accessorKey: "IssUser", cell: ({ row }) => dashText(getRowVal(row.original, "IssUser", "issUser")) },
      { header: t("Seller"), accessorKey: "Seller", cell: ({ row }) => dashText(getRowVal(row.original, "Seller", "seller")) },
      { header: t("RtnUser"), accessorKey: "RtnUser", cell: ({ row }) => row.original.isParent ? "" : dashText(getRowVal(row.original, "RtnUser", "rtnUser")) },
      { header: t("Remarks"), accessorKey: "Remarks", cell: ({ row }) => row.original.isParent ? "" : dashText(getRowVal(row.original, "Remarks", "remarks")) },
      { header: t("Estimate"), accessorKey: "Estimate", cell: ({ row }) => row.original.isParent ? "" : fmtFixed(getRowVal(row.original, "Estimate", "estimate"), 2) },
      { header: t("MRP"), accessorKey: "MRP", cell: ({ row }) => row.original.isParent ? "" : fmtFixed(getRowVal(row.original, "MRP", "mrp"), 2) },
      { header: t("Symbol"), accessorKey: "Symbol", cell: ({ row }) => row.original.isParent ? "" : dashText(getRowVal(row.original, "Symbol", "symbol")) },
      { header: t("Prop"), accessorKey: "PropId", cell: ({ row }) => row.original.isParent ? "" : dashText(getRowVal(row.original, "PropId", "propId")) },
      { header: t("Polish"), accessorKey: "PolishId", cell: ({ row }) => row.original.isParent ? "" : dashText(getRowVal(row.original, "PolishId", "polishId")) },
      { header: t("Sym"), accessorKey: "SymId", cell: ({ row }) => row.original.isParent ? "" : dashText(getRowVal(row.original, "SymId", "symId")) },
      { header: t("FL"), accessorKey: "FLId", cell: ({ row }) => row.original.isParent ? "" : dashText(getRowVal(row.original, "FLId", "flId")) },
      { header: t("Cert"), accessorKey: "CertId", cell: ({ row }) => row.original.isParent ? "" : dashText(getRowVal(row.original, "CertId", "certId")) },
      { header: t("CertificateNo"), accessorKey: "CertificateNo", cell: ({ row }) => row.original.isParent ? "" : dashText(getRowVal(row.original, "CertificateNo", "certificateNo")) },
      { header: t("InvType"), accessorKey: "Invtype", cell: ({ row }) => dashText(getRowVal(row.original, "Invtype", "invtype")) },
      { header: t("MemoTime"), accessorKey: "MemoTime", cell: ({ row }) => row.original.isParent ? "" : dashText(getRowVal(row.original, "MemoTime", "memoTime")) },
      { header: t("MemoReturnDate"), accessorKey: "MemoReturnDate", cell: ({ row }) => row.original.isParent ? "" : dashText(getRowVal(row.original, "MemoReturnDate", "memoReturnDate")) },
      { header: t("MemoReturnTime"), accessorKey: "MemoReturnTime", cell: ({ row }) => row.original.isParent ? "" : dashText(getRowVal(row.original, "MemoReturnTime", "memoReturnTime")) }
    ],
    [expandedMemoNos, t]
  );

  const summaryColumns = useMemo(
    () => [
      {
        header: t("Carats"),
        accessorKey: "Carats",
        className: "carat-col text-end",
        cell: ({ row }) => fmtFixed(getRowVal(row.original, "Carats", "carats"), 3)
      },
      {
        header: t("ReturnCarat"),
        accessorKey: "ReturnCrt",
        className: "rtn-col text-end",
        cell: ({ row }) => fmtFixed(getRowVal(row.original, "ReturnCrt", "returnCrt"), 3)
      },
      {
        header: t("PurCarat"),
        accessorKey: "PurCrt",
        className: "pur-col text-end",
        cell: ({ row }) => fmtFixed(getRowVal(row.original, "PurCrt", "purCrt"), 3)
      },
      {
        header: t("OnMemoCarat"),
        accessorKey: "OnmemoCrt",
        className: "text-end",
        cell: ({ row }) => fmtFixed(getRowVal(row.original, "OnmemoCrt", "onmemoCrt"), 3)
      },
      {
        header: t("SoldCarat"),
        accessorKey: "SoldCrt",
        className: "text-end",
        cell: ({ row }) => fmtFixed(getRowVal(row.original, "SoldCrt", "soldCrt"), 3)
      },
      {
        header: t("OnHandCarat"),
        accessorKey: "OnHandCrt",
        className: "bal-col text-end",
        cell: ({ row }) => fmtFixed(getRowVal(row.original, "OnHandCrt", "onHandCrt"), 3)
      }
    ],
    [t]
  );

  const handleExcel = async () => {
    if (isSummaryMode) {
      if (!summaryRows || summaryRows.length === 0) {
        toast.warning(t("No data available to export."));
        return;
      }
      const headers = ["Carats", "ReturnCarat", "PurCarat", "OnMemoCarat", "SoldCarat", "OnHandCarat"];
      const rows = summaryRows.map((r) => [
        fmtFixed(r.Carats || r.carats, 3),
        fmtFixed(r.ReturnCrt || r.returnCrt, 3),
        fmtFixed(r.PurCrt || r.purCrt, 3),
        fmtFixed(r.OnmemoCrt || r.onmemoCrt, 3),
        fmtFixed(r.SoldCrt || r.soldCrt, 3),
        fmtFixed(r.OnHandCrt || r.onHandCrt, 3)
      ]);
      const res = await exportToExcel(headers, rows, "ConsignmentSummaryReport", "ConsignmentSummaryReport");
      if (!res?.success) toast.error(t("Excel export failed."));
      return;
    }

    if (!reportRows || reportRows.length === 0) {
      toast.warning(t("No data available to export."));
      return;
    }

    const headers = [
      "Date", "BillNo", "MemoNo", "Party", "LotNo", "Shape", "Color", "Clarity",
      "Carats", "Price", "Amount", "Status", "Return", "Purchase", "MemoOut", "Sale",
      "Balance", "BalanceAmt", "Broker", "IssUser", "Seller", "RtnUser", "Remarks",
      "Estimate", "MRP", "Symbol", "Prop", "Polish", "Sym", "FL", "Cert",
      "CertificateNo", "InvType", "MemoTime", "MemoReturnDate", "MemoReturnTime"
    ];

    const rows = reportRows.map((r) => [
      dashText(r.ConDATE || r.conDATE),
      dashText(r.BillNo || r.billNo),
      dashText(r.MemoNo || r.memoNo),
      dashText(r.Party || r.party),
      dashText(r.Lotno || r.lotno),
      dashText(r.ShapeId || r.shapeId),
      dashText(r.ColorId || r.colorId),
      dashText(r.ClarityId || r.clarityId),
      fmtFixed(r.Carats || r.carats, 3),
      fmtFixed(r.Price || r.price, 2),
      fmtFixed(r.Amount || r.amount, 2),
      dashText(r.Status || r.status),
      fmtFixed(r.Return || r.return, 3),
      fmtFixed(r.Purchase || r.purchase, 3),
      fmtFixed(r.MemoOut || r.memoOut, 3),
      fmtFixed(r.Sale || r.sale, 3),
      fmtFixed(r.Balance || r.balance, 3),
      fmtFixed(r.BalanceAmt || r.balanceAmt, 2),
      dashText(r.Broker || r.broker),
      dashText(r.IssUser || r.issUser),
      dashText(r.Seller || r.seller),
      dashText(r.RtnUser || r.rtnUser),
      dashText(r.Remarks || r.remarks),
      fmtFixed(r.Estimate || r.estimate, 2),
      fmtFixed(r.MRP || r.mrp, 2),
      dashText(r.Symbol || r.symbol),
      dashText(r.PropId || r.propId),
      dashText(r.PolishId || r.polishId),
      dashText(r.SymId || r.symId),
      dashText(r.FLId || r.flId),
      dashText(r.CertId || r.certId),
      dashText(r.CertificateNo || r.certificateNo),
      dashText(r.Invtype || r.invtype),
      dashText(r.MemoTime || r.memoTime),
      dashText(r.MemoReturnDate || r.memoReturnDate),
      dashText(r.MemoReturnTime || r.memoReturnTime)
    ]);

    const res = await exportToExcel(headers, rows, "ConsignmentReport", "ConsignmentReport");
    if (!res?.success) toast.error(t("Excel export failed."));
  };

  document.title = `${t("Consignment Report")} | ${t("Reports")}`;

  const typeOptions = [
    { value: "ALL", label: "ALL" },
    { value: "External", label: "EXTERNAL" },
    { value: "Internal", label: "INTERNAL" },
    { value: "Local", label: "LOCAL" },
    { value: "LAB", label: "LAB" },
    { value: "Pend Sale", label: "PEND SALE" }
  ];

  return (
    <React.Fragment>
      <ToastContainer />

      <div className="page-content">
        <Container fluid>
          <BreadCrumb title={t("Consignment Report")} pageTitle={t("Reports")} />

          <div className="card stock-search-header-bar d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between mb-3 p-3 rounded-3 shadow-sm border gap-2">
            <h5 className="mb-0 fw-bold text-primary d-flex align-items-center gap-2">
              <i className={hasSearched ? "ri-database-2-line fs-20 text-primary" : "ri-search-eye-line fs-20 text-primary"}></i>
              {hasSearched ? t("Consignment Report Results") : t("Consignment Report Filters")}
            </h5>

            <div className="d-flex gap-2">
              {!hasSearched ? (
                <>
                  <Button color="primary" className="btn-sm rounded-2 px-3 py-1" onClick={handleReport} disabled={loading}>
                    {loading ? t("Loading...") : t("Report")}
                  </Button>
                  <Button color="primary" className="btn-sm rounded-2 px-3 py-1" onClick={handleGroupedReport} disabled={loading}>
                    {loading ? t("Loading...") : t("View Grouped Memos")}
                  </Button>
                  <Button color="soft-secondary" className="btn-sm rounded-2 px-3 py-1" onClick={handleClear} disabled={loading}>
                    {t("Clear")}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    color="primary"
                    className="btn-sm rounded-2 px-3 py-1"
                    onClick={() => {
                      setHasSearched(false);
                      setViewType("table");
                      setReportRows([]);
                      setSummaryRows([]);
                      setExpandedMemoNos(new Set());
                    }}
                    disabled={loading}
                  >
                    {t("New Search")}
                  </Button>
                  {viewType === "grouped" && (
                    <Button
                      color="primary"
                      className="btn-sm rounded-2 px-3 py-1"
                      onClick={handlePrintGroupedReport}
                      disabled={reportRows.length === 0}
                    >
                      <i className="ri-printer-line align-middle me-1" />
                      {t("print")}
                    </Button>
                  )}
                  {viewType === "table" && (
                    <UncontrolledDropdown>
                      <DropdownToggle
                        color="success"
                        className="btn-sm rounded-2 px-3 py-1"
                        caret
                        disabled={(isSummaryMode ? summaryRows.length : reportRows.length) === 0}
                      >
                        {t("Excel")} / {t("Print")}
                      </DropdownToggle>
                      <DropdownMenu>
                        <DropdownItem onClick={handleExcel}>Direct Print</DropdownItem>
                        <DropdownItem onClick={handleExcel}>Consignment Report Print</DropdownItem>
                      </DropdownMenu>
                    </UncontrolledDropdown>
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
                    <Row className="g-2 mb-2">
                      <Col sm={2}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1 small">{t("Date")}</Label>
                          <input
                            type="date"
                            className="form-control form-control-sm"
                            style={{ height: "35px" }}
                            value={filters.fromDate}
                            onChange={(e) => setFilters((prev) => ({ ...prev, fromDate: e.target.value }))}
                          />
                        </FormGroup>
                      </Col>
                      <Col sm={2}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1 small">{t("To Date")}</Label>
                          <input
                            type="date"
                            className="form-control form-control-sm"
                            style={{ height: "35px" }}
                            value={filters.toDate}
                            onChange={(e) => setFilters((prev) => ({ ...prev, toDate: e.target.value }))}
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
                            options={getOptions("currency")}
                            value={getOptions("currency").find((o) => o.value === filters.currency) || null}
                            onChange={(sel) => setFilters((prev) => ({ ...prev, currency: sel?.value || "" }))}
                            placeholder={t("Select Currency")}
                          />
                        </FormGroup>
                      </Col>
                      <Col sm={2}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1 small">{t("Memo No")}</Label>
                          <Input
                            type="text"
                            className="form-control form-control-sm"
                            style={{ height: "35px" }}
                            value={filters.invNo}
                            placeholder={t("Memo No")}
                            onChange={(e) => setFilters((prev) => ({ ...prev, invNo: e.target.value }))}
                          />
                        </FormGroup>
                      </Col>
                      <Col sm={2}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1 small">{t("Type")}</Label>
                          <Select
                            classNamePrefix="react-select"
                            styles={customStyles}
                            options={typeOptions}
                            value={typeOptions.find((o) => o.value === filters.type) || typeOptions[0]}
                            onChange={(sel) => setFilters((prev) => ({ ...prev, type: sel?.value || "ALL" }))}
                            placeholder={t("Select Type")}
                          />
                        </FormGroup>
                      </Col>
                      <Col sm={2}>
                        <FormGroup className="mb-0">
                          <div className="d-flex align-items-center gap-1 mb-2" style={{ height: "20px" }}>
                            <input
                              type="checkbox"
                              id="summaryCheckbox"
                              checked={filters.summary}
                              onChange={(e) => setFilters((prev) => ({ ...prev, summary: e.target.checked }))}
                            />
                            <Label htmlFor="summaryCheckbox" className="mb-0 small" style={{ color: "red", fontWeight: "bold" }}>
                              {t("Consignment Summary")}
                            </Label>
                          </div>
                          <div className="d-flex align-items-center gap-1" style={{ height: "20px" }}>
                            <input
                              type="checkbox"
                              id="clearCheckbox"
                              checked={filters.clear}
                              onChange={(e) => setFilters((prev) => ({ ...prev, clear: e.target.checked }))}
                            />
                            <Label htmlFor="clearCheckbox" className="mb-0 small">{t("Show Clear Consignment")}</Label>
                          </div>
                        </FormGroup>
                      </Col>
                    </Row>

                    <Row className="g-2 mb-2">
                      <Col sm={2}>
                        <FormGroup className="mb-0">
                          <div className="d-flex align-items-center gap-1 mb-1">
                            <input
                              type="checkbox"
                              id="rtnDateCheckbox"
                              checked={filters.chkRtnDate}
                              onChange={(e) => setFilters((prev) => ({ ...prev, chkRtnDate: e.target.checked }))}
                            />
                            <Label htmlFor="rtnDateCheckbox" className="fw-medium mb-0 small">{t("Rtn Date")}</Label>
                          </div>
                          <input
                            type="date"
                            className="form-control form-control-sm"
                            style={{ height: "35px" }}
                            value={filters.fromRtnDate}
                            disabled={!filters.chkRtnDate}
                            onChange={(e) => setFilters((prev) => ({ ...prev, fromRtnDate: e.target.value }))}
                          />
                        </FormGroup>
                      </Col>
                      <Col sm={2}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1 small">{t("To Date")}</Label>
                          <input
                            type="date"
                            className="form-control form-control-sm"
                            style={{ height: "35px" }}
                            value={filters.toRtnDate}
                            disabled={!filters.chkRtnDate}
                            onChange={(e) => setFilters((prev) => ({ ...prev, toRtnDate: e.target.value }))}
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
                            options={getAccountOptions()}
                            value={getAccountOptions().find((o) => o.value === filters.party) || null}
                            onChange={(sel) => setFilters((prev) => ({ ...prev, party: sel?.value || "" }))}
                            placeholder={t("Search Party")}
                            isLoading={loadingDropdowns}
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
                            options={getAccountOptions()}
                            value={getAccountOptions().find((o) => o.value === filters.broker) || null}
                            onChange={(sel) => setFilters((prev) => ({ ...prev, broker: sel?.value || "" }))}
                            placeholder={t("Search Broker")}
                            isLoading={loadingDropdowns}
                          />
                        </FormGroup>
                      </Col>
                      <Col sm={2}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1 small">{t("Seller")}</Label>
                          <Select
                            classNamePrefix="react-select"
                            styles={customStyles}
                            isClearable
                            options={getAccountOptions()}
                            value={getAccountOptions().find((o) => o.value === filters.seller) || null}
                            onChange={(sel) => setFilters((prev) => ({ ...prev, seller: sel?.value || "" }))}
                            placeholder={t("Search Seller")}
                            isLoading={loadingDropdowns}
                          />
                        </FormGroup>
                      </Col>
                      <Col sm={2}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1 small">{t("Group By")}</Label>
                          <Select
                            classNamePrefix="react-select"
                            styles={customStyles}
                            options={groupByOptions}
                            value={groupByOptions.find((o) => o.value === filters.groupBy) || groupByOptions[0]}
                            onChange={(sel) => setFilters((prev) => ({ ...prev, groupBy: sel?.value || "MemoNo" }))}
                            placeholder={t("Group By")}
                          />
                        </FormGroup>
                      </Col>
                    </Row>
                  </Col>

                  <Col md={2}>
                    <FormGroup className="mb-0">
                      <Label className="fw-medium mb-1 small">{t("Enter Lot No")}</Label>
                      <Input
                        type="textarea"
                        value={filters.lotNo}
                        onChange={(e) => setFilters((prev) => ({ ...prev, lotNo: e.target.value }))}
                        placeholder={t("Search by lot no")}
                        className="form-control-sm"
                        style={{ height: "115px", resize: "none" }}
                      />
                    </FormGroup>
                  </Col>
                </Row>

                <hr className="my-3 text-muted opacity-25" />

                <Row className="g-2 mb-2">
                  {[
                    { label: "Shape", key: "shape" },
                    { label: "Color", key: "color" },
                    { label: "Clarity", key: "clarity" },
                    { label: "Size", key: "size" },
                    { label: "Proportion", key: "proportion" },
                    { label: "Polish", key: "polish" }
                  ].map(({ label, key }) => (
                    <Col sm={2} key={key}>
                      <FormGroup className="mb-0">
                        <Label className="fw-medium mb-1 small">{t(label)}</Label>
                        <Select
                          isMulti
                          classNamePrefix="react-select"
                          styles={customStyles}
                          options={getOptions(key)}
                          value={getOptions(key).filter((o) => filters[key].includes(o.value))}
                          onChange={(sel) => handleMultiChange(key, sel)}
                          isLoading={loadingDropdowns}
                          placeholder={t(label)}
                        />
                      </FormGroup>
                    </Col>
                  ))}
                </Row>

                <Row className="g-2 mb-2">
                  {[
                    { label: "Symmetry", key: "symmetry" },
                    { label: "LAB", key: "lab" },
                    { label: "Fluorescence", key: "fluorescence" },
                    { label: "Milky", key: "milky" },
                    { label: "Luster", key: "luster" },
                    { label: "Natts", key: "natts" }
                  ].map(({ label, key }) => (
                    <Col sm={2} key={key}>
                      <FormGroup className="mb-0">
                        <Label className="fw-medium mb-1 small">{t(label)}</Label>
                        <Select
                          isMulti
                          classNamePrefix="react-select"
                          styles={customStyles}
                          options={getOptions(key)}
                          value={getOptions(key).filter((o) => filters[key].includes(o.value))}
                          onChange={(sel) => handleMultiChange(key, sel)}
                          isLoading={loadingDropdowns}
                          placeholder={t(label)}
                        />
                      </FormGroup>
                    </Col>
                  ))}
                </Row>

                <Row className="g-2">
                  {[
                    { label: "Mines", key: "mines" },
                    { label: "Product Type", key: "productType" },
                    { label: "Sieve", key: "sieve" }
                  ].map(({ label, key }) => (
                    <Col sm={2} key={key}>
                      <FormGroup className="mb-0">
                        <Label className="fw-medium mb-1 small">{t(label)}</Label>
                        <Select
                          isMulti
                          classNamePrefix="react-select"
                          styles={customStyles}
                          options={getOptions(key)}
                          value={getOptions(key).filter((o) => filters[key].includes(o.value))}
                          onChange={(sel) => handleMultiChange(key, sel)}
                          isLoading={loadingDropdowns}
                          placeholder={t(label)}
                        />
                      </FormGroup>
                    </Col>
                  ))}
                </Row>
              </CardBody>
            </Card>
          )}

          {hasSearched && viewType === "table" && (
            <Card className="shadow-lg border-0 rounded-3 mb-4">
              <CardBody>
                <div className="d-flex justify-content-end gap-4 mb-3 small fw-semibold">
                  <span>
                    {t("Showing")}: {isSummaryMode ? summaryRows.length : groupedVisibleRows.length} {t("rows")}
                  </span>
                </div>

                {isSummaryMode ? (
                  summaryRows.length === 0 ? (
                    <div className="text-center py-4 text-muted">{t("No data available.")}</div>
                  ) : (
                    <TableContainer
                      columns={summaryColumns}
                      data={summaryRows}
                      isGlobalFilter={true}
                      customPageSize={500}
                      customPageSizes={[500, 1000, 1500]}
                      divClass="table-responsive table-card mb-3"
                      tableClass="align-middle table-nowrap mb-0 table-hover table-striped"
                      theadClass="table-light"
                      SearchPlaceholder={t("SEARCH:")}
                    />
                  )
                ) : groupedVisibleRows.length === 0 ? (
                  <div className="text-center py-4 text-muted">{t("No data available.")}</div>
                ) : (
                  <TableContainer
                    columns={columns}
                    data={groupedVisibleRows}
                    isGlobalFilter={true}
                    customPageSize={500}
                    customPageSizes={[500, 1000, 1500]}
                    divClass="table-responsive table-card mb-3"
                    tableClass="align-middle table-nowrap mb-0 table-hover table-striped"
                    theadClass="table-light"
                    SearchPlaceholder={t("SEARCH:")}
                    getRowClass={(row) => (row.original?.isParent ? "parent-row fw-bold" : "child-row")}
                    renderSubRows={renderSubRows}
                  />
                )}
              </CardBody>
            </Card>
          )}

          {hasSearched && viewType === "grouped" && (
            <Card className="shadow-lg border-0 rounded-3 mb-4">
              <CardBody>
                <style>{`
                    #dynamic-consignment-report-table th {
                        white-space: nowrap;
                    }
                    #dynamic-consignment-report-table .memo-info td {
                        background: #f5f5f5;
                        font-weight: 600;
                    }
                    [data-bs-theme="dark"] #dynamic-consignment-report-table th,
                    [data-bs-theme="dark"] #dynamic-consignment-report-table td {
                        border-color: rgba(255, 255, 255, 0.15) !important;
                        color: var(--vz-body-color, #e9ecef);
                    }
                    [data-bs-theme="dark"] #dynamic-consignment-report-table thead th {
                        background: #262a2f !important;
                        color: var(--vz-body-color, #e9ecef) !important;
                    }
                    [data-bs-theme="dark"] #dynamic-consignment-report-table .memo-info td {
                        background: #2c3238 !important;
                        color: var(--vz-body-color, #e9ecef) !important;
                    }
                    [data-bs-theme="dark"] #dynamic-consignment-report-table .subtotal td,
                    [data-bs-theme="dark"] #dynamic-consignment-report-table .grand-total td {
                        background: #262a2f !important;
                        color: var(--vz-body-color, #e9ecef) !important;
                    }
                `}</style>
                <div className="mb-3">
                  <div className="row align-items-start">
                    <div className="col-sm-10 d-flex">
                      {companyLogoUrl ? (
                        <div className="pe-3 pt-2">
                          <img src={companyLogoUrl} alt="Company Logo" style={{ maxHeight: "90px", width: "96px" }} />
                        </div>
                      ) : null}
                      <div style={{ fontSize: "14px", lineHeight: 1.8, paddingTop: "12px" }}>
                        <div className="fw-bold">{companyInfo?.companyName}</div>
                        <div>{companyInfo?.companyAddress}</div>
                        {companyInfo?.companyAddress1 ? <div>{companyInfo.companyAddress1}</div> : null}
                        {companyInfo?.companyAddress2 ? <div>{companyInfo.companyAddress2}</div> : null}
                        {companyInfo?.companyPhone ? (
                          <div>
                            <strong>{t("Tel")}:</strong> {companyInfo.companyPhone}
                          </div>
                        ) : null}
                        {companyInfo?.companyEmail ? (
                          <div>
                            <strong>{t("Email")}:</strong> {companyInfo.companyEmail}
                          </div>
                        ) : null}
                      </div>
                    </div>
                    <div className="col-sm-2 text-end pt-2">
                      <div className="fs-5 fw-bold">{t("Consignment Report")}</div>
                      <div className="small text-muted">
                        <div>
                          <strong>{t("From")}:</strong> {filters.fromDate}
                        </div>
                        <div>
                          <strong>{t("To")}:</strong> {filters.toDate}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {groupedReportData.sections.length === 0 ? (
                  <div className="text-center py-4 text-muted">{t("No data available.")}</div>
                ) : (
                  <div className="table-responsive consignment-grouped-table-wrap" style={{ maxHeight: "750px", overflow: "auto" }}>
                    <table className="table table-bordered align-middle mb-0" id="dynamic-consignment-report-table" style={{ tableLayout: "fixed", minWidth: "1160px" }}>
                      <colgroup>
                        <col style={{ width: "48px" }} />
                        <col style={{ width: "56px" }} />
                        <col style={{ width: "70px" }} />
                        <col style={{ width: "110px" }} />
                        <col style={{ width: "220px" }} />
                        <col style={{ width: "90px" }} />
                        <col style={{ width: "90px" }} />
                        <col style={{ width: "90px" }} />
                        <col style={{ width: "90px" }} />
                        <col style={{ width: "90px" }} />
                        <col style={{ width: "100px" }} />
                      </colgroup>
                      <thead>
                        <tr className="table-light text-center">
                          <th>{t("View")}</th>
                          <th>Sr No</th>
                          <th>MemoNo</th>
                          <th>{t("LotNo")}</th>
                          <th>{t("Product")}</th>
                          <th className="text-end">{t("Carats")}</th>
                          <th className="text-end">{t("Purchase")}</th>
                          <th className="text-end">{t("Return")}</th>
                          <th className="text-end">{t("Balance")}</th>
                          <th className="text-end">{t("Price")}</th>
                          <th className="text-end">{t("Amount")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupedReportData.sections.map((section) => (
                          <React.Fragment key={section.groupKey}>
                            <tr className="memo-info">
                              <td colSpan={11} className="text-start">
                                {filters.groupBy === "PartyName" ? (
                                  <>
                                    <strong>{t("Party")}:</strong> {dashText(section.groupKey)} &nbsp;|&nbsp;
                                    <strong>{t("Date")}:</strong>{" "}
                                    {dashText(formatReportDisplayDate(getRowDueDateRaw(section.first)))}
                                  </>
                                ) : (
                                  <>
                                    <strong>{t("Party")}:</strong> {dashText(getRowVal(section.first, "Party", "party"))} &nbsp;|&nbsp;
                                    <strong>{t("Memo No")}:</strong> {dashText(section.groupKey)} &nbsp;|&nbsp;
                                    <strong>{t("Date")}:</strong>{" "}
                                    {dashText(formatReportDisplayDate(getRowDueDateRaw(section.first)))}
                                  </>
                                )}
                              </td>
                            </tr>
                            {section.rows.map((row, rowIndex) => {
                              const code = getRowVal(row, "Code", "code");
                              return (
                                <tr key={`${section.groupKey}-${rowIndex}`}>
                                  <td className="text-center">
                                    {code ? (
                                      <div className="report-action">
                                        <a
                                          href={`/consignment/edit-consignment?Id=${code}&Mode=view`}
                                          target="_blank"
                                          rel="noreferrer"
                                        >
                                          <i className="bx bx-show-alt" />
                                        </a>
                                      </div>
                                    ) : (
                                      ""
                                    )}
                                  </td>
                                  <td className="text-center">{row._srNo ?? ""}</td>
                                  <td className="text-center">{dashText(getRowVal(row, "MemoNo", "memoNo"))}</td>
                                  <td className="text-center">{dashText(getRowVal(row, "Lotno", "lotno", "LotNo"))}</td>
                                  <td className="text-center">{dashText(getGroupedProduct(row))}</td>
                                  <td className="text-end">{renderGroupedValue(row, "Carats")}</td>
                                  <td className="text-end">{renderGroupedValue(row, "Purchase")}</td>
                                  <td className="text-end">{renderGroupedValue(row, "Return")}</td>
                                  <td className="text-end">{renderGroupedValue(row, "Balance")}</td>
                                  <td className="text-end">{renderGroupedValue(row, "Price")}</td>
                                  <td className="text-end">{renderGroupedValue(row, "Amount")}</td>
                                </tr>
                              );
                            })}
                            <tr className="subtotal">
                              <td />
                              <td colSpan={2} className="text-start ps-5">
                                <strong>{t("Total")}</strong>
                              </td>
                              <td />
                              <td />
                              {GROUPED_SUM_COLUMNS.map((colKey) => (
                                <td key={`${section.groupKey}-${colKey}`} className="text-end">
                                  <strong>{fmtFixed(section.subtotal[colKey], GROUPED_DECIMALS[colKey])}</strong>
                                </td>
                              ))}
                            </tr>
                          </React.Fragment>
                        ))}
                        <tr className="grand-total">
                          <td />
                          <td colSpan={2} className="text-start ps-5">
                            <strong>{t("Grand Total")}</strong>
                          </td>
                          <td />
                          <td />
                          {GROUPED_SUM_COLUMNS.map((colKey) => (
                            <td key={`grand-${colKey}`} className="text-end">
                              <strong>{fmtFixed(groupedReportData.grandTotal[colKey], GROUPED_DECIMALS[colKey])}</strong>
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {companyInfo?.companyFooter ? (
                  <div className="mt-3 mb-1 small">{companyInfo.companyFooter}</div>
                ) : null}
              </CardBody>
            </Card>
          )}
        </Container>
      </div>
    </React.Fragment>
  );
};

export default SolitaireConsignmentReport;
