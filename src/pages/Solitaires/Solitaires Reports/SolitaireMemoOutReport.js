import React, { useCallback, useEffect, useMemo, useState } from "react";
import { flexRender } from "@tanstack/react-table";
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
import TableContainer from "../../../Components/Common/TableContainer";
import { exportToExcel, loadExcelJS } from "../../../helpers/excel_helper";

import {
  getSolitaireMemoOutDropdowns,
  getSolitaireMemoOutReport
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

const getRowDueDateRaw = (row) => getRowVal(row, "ConDATE", "conDATE", "condate", "DueDate", "dueDate");

const GROUPED_SUM_COLUMNS = ["Carats", "Estimate", "Return", "Balance", "Price", "BalanceAmt"];
const GROUPED_DECIMALS = {
  Carats: 3,
  Estimate: 2,
  Return: 3,
  Balance: 2,
  Price: 2,
  BalanceAmt: 2
};

const getGroupedNumeric = (row, key) => {
  const aliases = {
    Carats: ["Carats", "carats"],
    Estimate: ["Estimate", "estimate"],
    Return: ["Return", "return"],
    Balance: ["Balance", "balance"],
    Price: ["Price", "price"],
    BalanceAmt: ["BalanceAmt", "balanceAmt"]
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

  // Match MVC memo-report.js: client-side Sr No (not SP RowIndex).
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
    #dynamic-memoOut-report-table {
        border-collapse: collapse;
        table-layout: fixed;
        width: 100%;
        max-width: 270mm;
        margin: 16px auto 0 auto;
    }
    #dynamic-memoOut-report-table th,
    #dynamic-memoOut-report-table td {
        padding: 2px;
        font-size: 10px;
        border: 1px solid #000;
        vertical-align: middle;
        word-break: break-word;
        white-space: normal;
    }
    #dynamic-memoOut-report-table thead th {
        background: #f2f2f2;
        text-align: center;
        font-weight: 600;
        white-space: nowrap;
    }
    /* Match MVC print widths (View column omitted): Sr No → Amount */
    #dynamic-memoOut-report-table col:nth-child(1) { width: 15mm; }
    #dynamic-memoOut-report-table col:nth-child(2) { width: 15mm; }
    #dynamic-memoOut-report-table col:nth-child(3) { width: 55mm; }
    #dynamic-memoOut-report-table col:nth-child(4) { width: 80mm; }
    #dynamic-memoOut-report-table col:nth-child(5) { width: 20mm; }
    #dynamic-memoOut-report-table col:nth-child(6) { width: 20mm; }
    #dynamic-memoOut-report-table col:nth-child(7) { width: 20mm; }
    #dynamic-memoOut-report-table col:nth-child(8) { width: 20mm; }
    #dynamic-memoOut-report-table col:nth-child(9) { width: 20mm; }
    #dynamic-memoOut-report-table col:nth-child(10) { width: 20mm; }
    #dynamic-memoOut-report-table th:nth-child(n+5),
    #dynamic-memoOut-report-table td.col-num {
        text-align: right !important;
    }
    #dynamic-memoOut-report-table tbody td.col-product {
        word-break: break-word;
        text-align: center;
    }
    #dynamic-memoOut-report-table tbody td.col-text {
        text-align: center;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    #dynamic-memoOut-report-table tbody td.col-num {
        white-space: nowrap;
        word-break: keep-all;
    }
    #dynamic-memoOut-report-table .memo-info td {
        background: #f5f5f5;
        font-weight: 600;
        text-align: left !important;
        padding: 6px 8px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    #dynamic-memoOut-report-table .subtotal td,
    #dynamic-memoOut-report-table .grand-total td {
        font-weight: 700;
    }
    #dynamic-memoOut-report-table .subtotal td.col-label,
    #dynamic-memoOut-report-table .grand-total td.col-label {
        text-align: left !important;
        white-space: nowrap;
    }
    #dynamic-memoOut-report-table .subtotal td.col-num,
    #dynamic-memoOut-report-table .grand-total td.col-num {
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
  let totalCarats = 0;
  let totalAmount = 0;
  let totalReturn = 0;
  let totalBalance = 0;
  let totalBalanceAmt = 0;

  rows.forEach((r) => {
    if (r?.isParent) {
      totalCarats += Number(r.Carats || 0);
      totalAmount += Number(r.Amount || 0);
      totalReturn += Number(r.Return || 0);
      totalBalance += Number(r.Balance || 0);
      totalBalanceAmt += Number(r.BalanceAmt || 0);
    }
  });

  return { totalCarats, totalAmount, totalReturn, totalBalance, totalBalanceAmt };
};

const SolitaireMemoOutReport = () => {
  const { t } = useTranslation();

  const { fromDate, toDate, getDates, mergeDates } = useSettingReportDates({
    includeReturnDates: true,
    includePrintDates: true
  });

  const [loadingDropdowns, setLoadingDropdowns] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [viewType, setViewType] = useState("table");

  const [dropdownData, setDropdownData] = useState({});
  const [companyInfo, setCompanyInfo] = useState(() => getCachedReportCompany());
  const [expandedMemoNos, setExpandedMemoNos] = useState(() => new Set());
  const [reportRows, setReportRows] = useState([]);

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
    fromRChkBox: false,
    rDate: fromDate,
    rToDate: toDate,
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
        const res = await getSolitaireMemoOutDropdowns();
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
    setFilters(mergeDates({
      currency: "",
      invNo: "",
      type: "ALL",
      party: "",
      broker: "",
      seller: "",
      chkRtnDate: false,
      fromRChkBox: false,
      clear: false,
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
    FromRChkBox: filters.fromRChkBox,
    RDate: filters.rDate || null,
    RToDate: filters.rToDate || null,
    Clear: filters.clear,
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

  const loadReportData = async (mode) => {
    setLoading(true);
    try {
      const response = await getSolitaireMemoOutReport(buildPayload());
      const ok = response?.success || response?.Success;
      if (ok) {
        setReportRows(response.Data || response.data || []);
        setHasSearched(true);
        setViewType(mode);
        setExpandedMemoNos(new Set());
        toast.success(t("Report loaded successfully."));
      } else {
        toast.warning(response?.Message || t("Failed to load report."));
      }
    } catch (err) {
      console.error("Memo report request failed:", err);
      const msg =
        typeof err === "string"
          ? err
          : err?.response?.data?.message || err?.response?.data?.Message || null;
      toast.error(msg || t("Server Connection Problem.."));
    } finally {
      setLoading(false);
    }
  };

  const handleReport = () => loadReportData("table");

  const handleGroupedReport = () => loadReportData("grouped");

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
          <div class="report-title">${escapeHtml(t("Memo Out Report"))}</div>
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
            <td class="col-text">${escapeHtml(getRowVal(row, "Lotno", "lotno"))}</td>
            <td class="col-product">${escapeHtml(getRowVal(row, "ItemName", "itemName"))}</td>
            <td class="col-num">${escapeHtml(fmtFixed(getGroupedNumeric(row, "Carats"), GROUPED_DECIMALS.Carats))}</td>
            <td class="col-num">${escapeHtml(fmtFixed(getGroupedNumeric(row, "Estimate"), GROUPED_DECIMALS.Estimate))}</td>
            <td class="col-num">${escapeHtml(fmtFixed(getGroupedNumeric(row, "Return"), GROUPED_DECIMALS.Return))}</td>
            <td class="col-num">${escapeHtml(fmtFixed(getGroupedNumeric(row, "Balance"), GROUPED_DECIMALS.Balance))}</td>
            <td class="col-num">${escapeHtml(fmtFixed(getGroupedNumeric(row, "Price"), GROUPED_DECIMALS.Price))}</td>
            <td class="col-num">${escapeHtml(fmtFixed(getGroupedNumeric(row, "BalanceAmt"), GROUPED_DECIMALS.BalanceAmt))}</td>
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
      <table id="dynamic-memoOut-report-table">
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
            <th>${escapeHtml(t("Sold"))}</th>
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

    printWindow.document.write(`<!DOCTYPE html><html><head><title>${escapeHtml(t("Memo Out Report"))}</title>`);
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
      const key = String(getRowVal(r, "MemoNo", "memoNo") || "UNKNOWN");
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(r);
    });

    const out = [];
    Object.keys(grouped).forEach((memoNo) => {
      const rows = grouped[memoNo];
      const first = rows[0];

      const totalCarats = rows.reduce((s, r) => s + Number(getRowVal(r, "Carats", "carats") || 0), 0);
      const totalAmount = rows.reduce((s, r) => s + Number(getRowVal(r, "Amount", "amount") || 0), 0);
      const totalReturn = rows.reduce((s, r) => s + Number(getRowVal(r, "Return", "return") || 0), 0);
      const totalBalance = rows.reduce((s, r) => s + Number(getRowVal(r, "Balance", "balance") || 0), 0);
      const totalBalanceAmt = rows.reduce((s, r) => s + Number(getRowVal(r, "BalanceAmt", "balanceAmt") || 0), 0);
      const totalEstimate = rows.reduce((s, r) => s + Number(getRowVal(r, "Estimate", "estimate") || 0), 0);
      const totalPrice = totalCarats > 0 ? totalAmount / totalCarats : 0;

      out.push({
        ...first,
        isParent: true,
        Code: "",
        MemoNo: memoNo,
        Carats: totalCarats,
        Price: totalPrice,
        Amount: totalAmount,
        Return: totalReturn,
        Balance: totalBalance,
        BalanceAmt: totalBalanceAmt,
        Estimate: totalEstimate,
        Discount: "",
        Lotno: "",
        ItemName: "",
        MemoReturnDate: "",
        RtnUser: "",
        BalanceCarats3Dec: "",
        MRP: "",
        Symbol: "",
        ShapeId: "",
        ColorId: "",
        ClarityId: "",
        PropId: "",
        PolishId: "",
        SymId: "",
        FLId: "",
        CertId: "",
        CertificateNo: "",
        MemoTime: "",
        MemoReturnTime: "",
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
                  window.open(`../memo/edit-memo?Id=${code}&Mode=view`, "_blank");
                }}
              >
                <i className="bx bx-show-alt"></i>
              </a>
            </div>
          );
        },
        footer: () => <span className="fw-bold text-center d-block">Total</span>
      },
      { header: t("DATE"), accessorKey: "ConDATE", cell: ({ row }) => dashText(getRowVal(row.original, "ConDATE", "conDATE")) },
      { header: t("DateDiff"), accessorKey: "DateDiff", cell: ({ row }) => fmtFixed(getRowVal(row.original, "DateDiff", "dateDiff"), 0) },
      { header: t("MemoNo"), accessorKey: "MemoNo", cell: ({ row }) => dashText(getRowVal(row.original, "MemoNo", "memoNo")) },
      { header: t("BillNo"), accessorKey: "BillNo", cell: ({ row }) => dashText(getRowVal(row.original, "BillNo", "billNo")) },
      { header: t("Party"), accessorKey: "Party", cell: ({ row }) => dashText(getRowVal(row.original, "Party", "party")) },
      { header: t("LotNo"), accessorKey: "Lotno", cell: ({ row }) => row.original.isParent ? "" : dashText(getRowVal(row.original, "Lotno", "lotno", "LotNo")) },
      { header: t("ItemName"), accessorKey: "ItemName", cell: ({ row }) => row.original.isParent ? "" : dashText(getRowVal(row.original, "ItemName", "itemName")) },
      { header: t("Discount"), accessorKey: "Discount", cell: ({ row }) => row.original.isParent ? "" : fmtFixed(getRowVal(row.original, "Discount", "discount"), 2) },
      {
        header: t("Price"),
        accessorKey: "Price",
        className: "text-end",
        cell: ({ row }) => fmtFixed(getRowVal(row.original, "Price", "price"), 2),
        footer: ({ table }) => {
          const { totalCarats, totalAmount } = getTableTotals(table);
          return <span className="fw-bold text-end d-block">{fmtFixed(totalCarats > 0 ? totalAmount / totalCarats : 0, 2)}</span>;
        }
      },
      {
        header: t("Amount"),
        accessorKey: "Amount",
        className: "text-end",
        cell: ({ row }) => fmtFixed(getRowVal(row.original, "Amount", "amount"), 2),
        footer: ({ table }) => {
          const { totalAmount } = getTableTotals(table);
          return <span className="fw-bold text-end d-block">{fmtFixed(totalAmount, 2)}</span>;
        }
      },
      {
        header: t("Return"),
        accessorKey: "Return",
        className: "text-end",
        cell: ({ row }) => fmtFixed(getRowVal(row.original, "Return", "return"), 3),
        footer: ({ table }) => {
          const { totalReturn } = getTableTotals(table);
          return <span className="fw-bold text-end d-block">{fmtFixed(totalReturn, 3)}</span>;
        }
      },
      { header: t("ReturnDate"), accessorKey: "MemoReturnDate", cell: ({ row }) => row.original.isParent ? "" : dashText(getRowVal(row.original, "MemoReturnDate", "memoReturnDate", "ReturnDate")) },
      {
        header: t("Balance"),
        accessorKey: "Balance",
        className: "text-end",
        cell: ({ row }) => fmtFixed(getRowVal(row.original, "Balance", "balance"), 3),
        footer: ({ table }) => {
          const { totalBalance } = getTableTotals(table);
          return <span className="fw-bold text-end d-block">{fmtFixed(totalBalance, 3)}</span>;
        }
      },
      {
        header: t("BalanceAmt"),
        accessorKey: "BalanceAmt",
        className: "text-end",
        cell: ({ row }) => fmtFixed(getRowVal(row.original, "BalanceAmt", "balanceAmt"), 2),
        footer: ({ table }) => {
          const { totalBalanceAmt } = getTableTotals(table);
          return <span className="fw-bold text-end d-block">{fmtFixed(totalBalanceAmt, 2)}</span>;
        }
      },
      { header: t("Broker"), accessorKey: "Broker", cell: ({ row }) => dashText(getRowVal(row.original, "Broker", "broker")) },
      {
        header: t("Carats"),
        accessorKey: "Carats",
        className: "text-end",
        cell: ({ row }) => fmtFixed(getRowVal(row.original, "Carats", "carats"), 3),
        footer: ({ table }) => {
          const { totalCarats } = getTableTotals(table);
          return <span className="fw-bold text-end d-block">{fmtFixed(totalCarats, 3)}</span>;
        }
      },
      { header: t("IssUser"), accessorKey: "IssUser", cell: ({ row }) => dashText(getRowVal(row.original, "IssUser", "issUser")) },
      { header: t("Seller"), accessorKey: "Seller", cell: ({ row }) => dashText(getRowVal(row.original, "Seller", "seller")) },
      { header: t("RtnUser"), accessorKey: "RtnUser", cell: ({ row }) => row.original.isParent ? "" : dashText(getRowVal(row.original, "RtnUser", "rtnUser")) },
      { header: t("Remarks"), accessorKey: "Remarks", cell: ({ row }) => row.original.isParent ? "" : dashText(getRowVal(row.original, "Remarks", "remarks")) },
      { header: t("CaratsCl"), accessorKey: "BalanceCarats3Dec", cell: ({ row }) => row.original.isParent ? "" : dashText(getRowVal(row.original, "BalanceCarats3Dec", "balanceCarats3Dec")) },
      { header: t("Estimate"), accessorKey: "Estimate", className: "text-end", cell: ({ row }) => fmtFixed(getRowVal(row.original, "Estimate", "estimate"), 2) },
      { header: t("MRP"), accessorKey: "MRP", className: "text-end", cell: ({ row }) => row.original.isParent ? "" : fmtFixed(getRowVal(row.original, "MRP", "mrp"), 2) },
      { header: t("Symbol"), accessorKey: "Symbol", cell: ({ row }) => row.original.isParent ? "" : dashText(getRowVal(row.original, "Symbol", "symbol")) },
      { header: t("Shape"), accessorKey: "ShapeId", cell: ({ row }) => row.original.isParent ? "" : dashText(getRowVal(row.original, "ShapeId", "shapeId")) },
      { header: t("Color"), accessorKey: "ColorId", cell: ({ row }) => row.original.isParent ? "" : dashText(getRowVal(row.original, "ColorId", "colorId")) },
      { header: t("Clarity"), accessorKey: "ClarityId", cell: ({ row }) => row.original.isParent ? "" : dashText(getRowVal(row.original, "ClarityId", "clarityId")) },
      { header: t("Prop"), accessorKey: "PropId", cell: ({ row }) => row.original.isParent ? "" : dashText(getRowVal(row.original, "PropId", "propId")) },
      { header: t("Polish"), accessorKey: "PolishId", cell: ({ row }) => row.original.isParent ? "" : dashText(getRowVal(row.original, "PolishId", "polishId")) },
      { header: t("Sym"), accessorKey: "SymId", cell: ({ row }) => row.original.isParent ? "" : dashText(getRowVal(row.original, "SymId", "symId")) },
      { header: t("FL"), accessorKey: "FLId", cell: ({ row }) => row.original.isParent ? "" : dashText(getRowVal(row.original, "FLId", "flId")) },
      { header: t("Cert"), accessorKey: "CertId", cell: ({ row }) => row.original.isParent ? "" : dashText(getRowVal(row.original, "CertId", "certId")) },
      { header: t("CertificateNo"), accessorKey: "CertificateNo", cell: ({ row }) => row.original.isParent ? "" : dashText(getRowVal(row.original, "CertificateNo", "certificateNo")) },
      { header: t("InvType"), accessorKey: "Invtype", cell: ({ row }) => row.original.isParent ? "" : dashText(getRowVal(row.original, "Invtype", "invtype")) },
      { header: t("MemoTime"), accessorKey: "MemoTime", cell: ({ row }) => dashText(getRowVal(row.original, "MemoTime", "memoTime")) },
      { header: t("MemoReturnDate"), accessorKey: "MemoReturnDate2", cell: ({ row }) => row.original.isParent ? "" : dashText(getRowVal(row.original, "MemoReturnDate", "memoReturnDate")) },
      { header: t("MemoReturnTime"), accessorKey: "MemoReturnTime", cell: ({ row }) => row.original.isParent ? "" : dashText(getRowVal(row.original, "MemoReturnTime", "memoReturnTime")) }
    ],
    [expandedMemoNos, t]
  );

  const handleExcel = async () => {
    if (!reportRows || reportRows.length === 0) {
      toast.warning(t("No data available to export."));
      return;
    }

    const headers = [
      "Date", "DateDiff", "MemoNo", "BillNo", "Party", "LotNo", "ItemName", "Discount",
      "Price", "Amount", "Return", "ReturnDate", "Balance", "BalanceAmt", "Broker", "Carats",
      "IssUser", "Seller", "RtnUser", "Remarks", "CaratsCl", "Estimate", "MRP", "Symbol",
      "Shape", "Color", "Clarity", "Prop", "Polish", "Sym", "FL", "Cert", "CertNo", "InvType"
    ];

    const rows = reportRows.map((r) => [
      dashText(r.ConDATE || r.conDATE),
      fmtFixed(r.DateDiff || r.dateDiff, 0),
      dashText(r.MemoNo || r.memoNo),
      dashText(r.BillNo || r.billNo),
      dashText(r.Party || r.party),
      dashText(r.Lotno || r.lotno),
      dashText(r.ItemName || r.itemName),
      fmtFixed(r.Discount || r.discount, 2),
      fmtFixed(r.Price || r.price, 2),
      fmtFixed(r.Amount || r.amount, 2),
      fmtFixed(r.Return || r.return, 3),
      dashText(r.MemoReturnDate || r.memoReturnDate),
      fmtFixed(r.Balance || r.balance, 2),
      fmtFixed(r.BalanceAmt || r.balanceAmt, 2),
      dashText(r.Broker || r.broker),
      fmtFixed(r.Carats || r.carats, 3),
      dashText(r.IssUser || r.issUser),
      dashText(r.Seller || r.seller),
      dashText(r.RtnUser || r.rtnUser),
      dashText(r.Remarks || r.remarks),
      dashText(r.BalanceCarats3Dec || r.balanceCarats3Dec),
      fmtFixed(r.Estimate || r.estimate, 2),
      fmtFixed(r.MRP || r.mrp, 2),
      dashText(r.Symbol || r.symbol),
      dashText(r.ShapeId || r.shapeId),
      dashText(r.ColorId || r.colorId),
      dashText(r.ClarityId || r.clarityId),
      dashText(r.PropId || r.propId),
      dashText(r.PolishId || r.polishId),
      dashText(r.SymId || r.symId),
      dashText(r.FLId || r.flId),
      dashText(r.CertId || r.certId),
      dashText(r.CertificateNo || r.certificateNo),
      dashText(r.Invtype || r.invtype)
    ]);

    const res = await exportToExcel(headers, rows, "MemoReport", "MemoReport");
    if (!res?.success) toast.error(t("Excel export failed."));
  };

  /** MVC ReportController.MemoExcelGenerate → MemoReportList.xlsx (PrintName = MR) */
  const handleMemoReportPrintExcel = async () => {
    if (!reportRows || reportRows.length === 0) {
      toast.warning(t("No data available to export."));
      return;
    }

    try {
      const ExcelJS = await loadExcelJS();
      const workbook = new ExcelJS.Workbook();
      const ws = workbook.addWorksheet("GetMemoReportData");

      ws.views = [{ state: "frozen", xSplit: 0, ySplit: 1, topLeftCell: "A2", activePane: "bottomLeft" }];

      const headers = [
        "Date", "DateDiff", "MemoNo", "BillNo", "Party", "Broker", "Item", "ItemName",
        "Carats", "Price", "Amount", "Estimate", "Return", "Rtn Date", "Balance", "BalanceAmt",
        "rap.Rate", "Dwn%", "IssUser", "Seller", "ReturnUser", "Remarks", "Symbol", "ColorId",
        "ClarityId", "Prio", "CaratsCI", "Per", "MemoTime", "MemoReturnDate", "MemoReturnTime", "KapanNo"
      ];

      const headerRow = ws.addRow(headers);
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, name: "Calibri", size: 11, color: { argb: "FF000000" } };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = {
          top: { style: "thin", color: { argb: "FF000000" } },
          left: { style: "thin", color: { argb: "FF000000" } },
          bottom: { style: "thin", color: { argb: "FF000000" } },
          right: { style: "thin", color: { argb: "FF000000" } }
        };
      });

      const colWidths = [13, 10, 11, 8, 15, 10, 11, 20, 12, 8, 10, 8, 7, 11, 9, 12, 8, 8, 8, 6, 12, 8, 8, 7, 8, 7, 10, 6, 28, 18, 18, 10];
      colWidths.forEach((w, i) => {
        ws.getColumn(i + 1).width = w;
      });

      const toNum = (v) => {
        const n = Number(v);
        return Number.isFinite(n) ? n : null;
      };

      reportRows.forEach((r) => {
        const row = ws.addRow([
          getRowVal(r, "ConDATE", "conDATE") || "",
          getRowVal(r, "DateDiff", "dateDiff") ?? "",
          getRowVal(r, "MemoNo", "memoNo") || "",
          getRowVal(r, "BillNo", "billNo") || "",
          getRowVal(r, "Party", "party") || "",
          getRowVal(r, "Broker", "broker") || "",
          getRowVal(r, "Lotno", "LotNo", "lotno") || "",
          getRowVal(r, "ItemName", "itemName") || "",
          null, // Carats
          null, // Price
          null, // Amount
          getRowVal(r, "Estimate", "estimate") ?? "",
          getRowVal(r, "Return", "return") ?? "",
          getRowVal(r, "MemoReturnDate", "memoReturnDate", "ReturnDate", "returnDate") || "",
          null, // Balance
          null, // BalanceAmt
          "", // rap.Rate (MVC leaves blank)
          null, // Dwn%
          getRowVal(r, "IssUser", "issUser") || "",
          getRowVal(r, "Seller", "seller") || "",
          getRowVal(r, "RtnUser", "rtnUser") || "",
          getRowVal(r, "Remarks", "remarks") || "",
          getRowVal(r, "Symbol", "symbol") || "",
          getRowVal(r, "ColorId", "colorId", "Colorid") || "",
          getRowVal(r, "ClarityId", "clarityId") || "",
          getRowVal(r, "Prio", "prio") || "",
          "", // CaratsCI
          "", // Per
          getRowVal(r, "MemoTime", "memoTime") || "",
          getRowVal(r, "MemoReturnDate", "memoReturnDate") || "",
          getRowVal(r, "MemoReturnTime", "memoReturnTime") || "",
          "" // KapanNo
        ]);

        row.alignment = { horizontal: "center", vertical: "middle" };
        row.font = { name: "Calibri", size: 10 };

        const setNum = (col, value, format) => {
          const n = toNum(value);
          if (n === null) return;
          const cell = row.getCell(col);
          cell.value = n;
          cell.numFmt = format;
          cell.alignment = { horizontal: "right", vertical: "middle" };
        };

        setNum(9, getRowVal(r, "Carats", "carats"), "0.000");
        setNum(10, getRowVal(r, "Price", "price"), "0.000");
        setNum(11, getRowVal(r, "Amount", "amount"), "0.00");
        setNum(15, getRowVal(r, "Balance", "balance"), "0.00");
        setNum(16, getRowVal(r, "BalanceAmt", "balanceAmt"), "0.00");
        setNum(18, getRowVal(r, "Discount", "discount"), "0.00");
      });

      const dataEnd = reportRows.length + 1;
      const totalRow = dataEnd + 1;
      const redFont = { color: { argb: "FFFF0000" }, name: "Calibri", size: 10 };

      ws.getCell(`E${totalRow}`).value = { formula: `"Total: " & COUNTA(E2:E${dataEnd})` };
      ws.getCell(`E${totalRow}`).font = redFont;

      const sumCell = (col, format) => {
        const cell = ws.getCell(`${col}${totalRow}`);
        cell.value = { formula: `SUM(${col}2:${col}${dataEnd})` };
        cell.font = redFont;
        cell.numFmt = format;
        cell.alignment = { horizontal: "right", vertical: "middle" };
      };

      sumCell("I", "0.00");
      sumCell("K", "0.00");
      sumCell("O", "0.00");
      sumCell("P", "0.00");

      const avgPrice = ws.getCell(`J${totalRow}`);
      avgPrice.value = { formula: `IF(I${totalRow}=0,0,K${totalRow}/I${totalRow})` };
      avgPrice.font = redFont;
      avgPrice.numFmt = "0.00";
      avgPrice.alignment = { horizontal: "right", vertical: "middle" };

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "MemoReportList.xlsx";
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (err) {
      console.error("MemoReport Print Excel failed:", err);
      toast.error(t("Excel export failed."));
    }
  };

  document.title = `${t("Memo Report")} | ${t("Reports")}`;

  const typeOptions = [
    { value: "ALL", label: "ALL" },
    { value: "External", label: "EXTERNAL" },
    { value: "Internal", label: "INTERNAL" },
    { value: "Local", label: "LOCAL" },
    { value: "LAB", label: "LAB" },
    { value: "Pend Sale", label: "PEND SALE" }
  ];

  const attributeFields = [
    { label: "Shape", key: "shape" },
    { label: "Color", key: "color" },
    { label: "Clarity", key: "clarity" },
    { label: "Size", key: "size" },
    { label: "Proportion", key: "proportion" },
    { label: "Polish", key: "polish" },
    { label: "Symmetry", key: "symmetry" },
    { label: "LAB", key: "lab" },
    { label: "Fluorescence", key: "fluorescence" },
    { label: "Milky", key: "milky" },
    { label: "Luster", key: "luster" },
    { label: "Natts", key: "natts" },
    { label: "Mines", key: "mines" },
    { label: "Product Type", key: "productType" },
    { label: "Sieve", key: "sieve" }
  ];

  return (
    <React.Fragment>
      <ToastContainer />
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title={t("Memo Report")} pageTitle={t("Reports")} />

          <div className="card stock-search-header-bar d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between mb-3 p-3 rounded-3 shadow-sm border gap-2">
            <h5 className="mb-0 fw-bold text-primary d-flex align-items-center gap-2">
              <i className={hasSearched ? "ri-database-2-line fs-20 text-primary" : "ri-search-eye-line fs-20 text-primary"}></i>
              {hasSearched ? t("Memo Report Results") : t("Memo Report Filters")}
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
                        disabled={reportRows.length === 0}
                      >
                        <i className="ri-file-excel-2-line align-middle me-1" />
                        {t("Excel")} / {t("Print")}
                      </DropdownToggle>
                      <DropdownMenu style={{ minWidth: "180px", zIndex: 1050 }}>
                        <DropdownItem onClick={handleExcel}>
                          {t("Direct Print")}
                        </DropdownItem>
                        <DropdownItem onClick={handleMemoReportPrintExcel}>
                          {t("MemoReport Print")}
                        </DropdownItem>
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
                          <input type="date" className="form-control form-control-sm" style={{ height: "35px" }} value={filters.fromDate} onChange={(e) => setFilters((p) => ({ ...p, fromDate: e.target.value }))} />
                        </FormGroup>
                      </Col>
                      <Col sm={2}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1 small">{t("To Date")}</Label>
                          <input type="date" className="form-control form-control-sm" style={{ height: "35px" }} value={filters.toDate} onChange={(e) => setFilters((p) => ({ ...p, toDate: e.target.value }))} />
                        </FormGroup>
                      </Col>
                      <Col sm={2}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1 small">{t("Currency")}</Label>
                          <Select classNamePrefix="react-select" styles={customStyles} isClearable options={getOptions("currency")} value={getOptions("currency").find((o) => o.value === filters.currency) || null} onChange={(sel) => setFilters((p) => ({ ...p, currency: sel?.value || "" }))} placeholder={t("Select Currency")} />
                        </FormGroup>
                      </Col>
                      <Col sm={2}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1 small">{t("Memo No")}</Label>
                          <Input type="text" className="form-control form-control-sm" style={{ height: "35px" }} value={filters.invNo} placeholder={t("Memo No")} onChange={(e) => setFilters((p) => ({ ...p, invNo: e.target.value }))} />
                        </FormGroup>
                      </Col>
                      <Col sm={2}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1 small">{t("Type")}</Label>
                          <Select classNamePrefix="react-select" styles={customStyles} options={typeOptions} value={typeOptions.find((o) => o.value === filters.type) || typeOptions[0]} onChange={(sel) => setFilters((p) => ({ ...p, type: sel?.value || "ALL" }))} placeholder={t("Select Type")} />
                        </FormGroup>
                      </Col>
                      <Col sm={2}>
                        <FormGroup className="mb-0">
                          <Label className="w-100 mb-1"></Label>
                          <div className="d-flex align-items-center gap-1" style={{ height: "35px" }}>
                            <input type="checkbox" id="clearMemoCheckbox" checked={filters.clear} onChange={(e) => setFilters((p) => ({ ...p, clear: e.target.checked }))} />
                            <Label htmlFor="clearMemoCheckbox" className="mb-0 small">{t("Show Clear Memo")}</Label>
                          </div>
                        </FormGroup>
                      </Col>
                    </Row>
                    <Row className="g-2">
                      <Col sm={2}>
                        <FormGroup className="mb-0">
                          <div className="d-flex align-items-center gap-1 mb-1">
                            <input type="checkbox" id="rtnDateCheckbox" checked={filters.chkRtnDate} onChange={(e) => setFilters((p) => ({ ...p, chkRtnDate: e.target.checked }))} />
                            <Label htmlFor="rtnDateCheckbox" className="fw-medium mb-0 small">{t("Rtn Date")}</Label>
                          </div>
                          <input type="date" className="form-control form-control-sm" style={{ height: "35px" }} value={filters.fromRtnDate} disabled={!filters.chkRtnDate} onChange={(e) => setFilters((p) => ({ ...p, fromRtnDate: e.target.value }))} />
                        </FormGroup>
                      </Col>
                      <Col sm={2}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1 small">{t("To Date")}</Label>
                          <input type="date" className="form-control form-control-sm" style={{ height: "35px" }} value={filters.toRtnDate} disabled={!filters.chkRtnDate} onChange={(e) => setFilters((p) => ({ ...p, toRtnDate: e.target.value }))} />
                        </FormGroup>
                      </Col>
                      <Col sm={2}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1 small">{t("Party")}</Label>
                          <Select classNamePrefix="react-select" styles={customStyles} isClearable options={getAccountOptions()} value={getAccountOptions().find((o) => o.value === filters.party) || null} onChange={(sel) => setFilters((p) => ({ ...p, party: sel?.value || "" }))} placeholder={t("Search Party")} isLoading={loadingDropdowns} />
                        </FormGroup>
                      </Col>
                      <Col sm={2}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1 small">{t("Broker")}</Label>
                          <Select classNamePrefix="react-select" styles={customStyles} isClearable options={getAccountOptions()} value={getAccountOptions().find((o) => o.value === filters.broker) || null} onChange={(sel) => setFilters((p) => ({ ...p, broker: sel?.value || "" }))} placeholder={t("Search Broker")} isLoading={loadingDropdowns} />
                        </FormGroup>
                      </Col>
                      <Col sm={2}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1 small">{t("Seller")}</Label>
                          <Select classNamePrefix="react-select" styles={customStyles} isClearable options={getAccountOptions()} value={getAccountOptions().find((o) => o.value === filters.seller) || null} onChange={(sel) => setFilters((p) => ({ ...p, seller: sel?.value || "" }))} placeholder={t("Search Seller")} isLoading={loadingDropdowns} />
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
                            onChange={(sel) => setFilters((p) => ({ ...p, groupBy: sel?.value || "MemoNo" }))}
                            placeholder={t("Group By")}
                          />
                        </FormGroup>
                      </Col>
                    </Row>
                  </Col>
                  <Col md={2}>
                    <FormGroup className="mb-0">
                      <Label className="fw-medium mb-1 small">{t("Enter Lot No")}</Label>
                      <Input type="textarea" value={filters.lotNo} onChange={(e) => setFilters((p) => ({ ...p, lotNo: e.target.value }))} placeholder={t("Search by lot no")} className="form-control-sm" style={{ height: "115px", resize: "none" }} />
                    </FormGroup>
                  </Col>
                </Row>
                <hr className="my-3 text-muted opacity-25" />
                <Row className="g-2">
                  {attributeFields.map(({ label, key }) => (
                    <Col sm={2} key={key}>
                      <FormGroup className="mb-0">
                        <Label className="fw-medium mb-1 small">{t(label)}</Label>
                        <Select isMulti classNamePrefix="react-select" styles={customStyles} options={getOptions(key)} value={getOptions(key).filter((o) => filters[key].includes(o.value))} onChange={(sel) => handleMultiChange(key, sel)} isLoading={loadingDropdowns} placeholder={t(label)} />
                      </FormGroup>
                    </Col>
                  ))}
                </Row>

                {/* MVC MemoReport: Print Date / Print To Date (RoundDate filter) */}
                <Row className="g-2 mt-2">
                  <Col sm={2}>
                    <FormGroup className="mb-0">
                      <div className="d-flex align-items-center gap-1 mb-1">
                        <input
                          type="checkbox"
                          id="fromRChkBox"
                          checked={filters.fromRChkBox}
                          onChange={(e) => setFilters((p) => ({ ...p, fromRChkBox: e.target.checked }))}
                        />
                        <Label htmlFor="fromRChkBox" className="fw-medium mb-0 small">
                          {t("Print Date")}
                        </Label>
                      </div>
                      <Input
                        type="date"
                        className="form-control form-control-sm"
                        style={{ height: "35px" }}
                        value={filters.rDate}
                        onChange={(e) => setFilters((p) => ({ ...p, rDate: e.target.value }))}
                      />
                    </FormGroup>
                  </Col>
                  <Col sm={2}>
                    <FormGroup className="mb-0">
                      <Label className="fw-medium mb-1 small">{t("Print To Date")}</Label>
                      <Input
                        type="date"
                        className="form-control form-control-sm"
                        style={{ height: "35px" }}
                        value={filters.rToDate}
                        onChange={(e) => setFilters((p) => ({ ...p, rToDate: e.target.value }))}
                      />
                    </FormGroup>
                  </Col>
                </Row>
              </CardBody>
            </Card>
          )}

          {hasSearched && viewType === "table" && (
            <Card className="shadow-lg border-0 rounded-3 mb-4">
              <CardBody>
                <div className="d-flex justify-content-end gap-4 mb-3 small fw-semibold">
                  <span>{t("Showing")}: {groupedVisibleRows.length} {t("rows")}</span>
                </div>
                {groupedVisibleRows.length === 0 ? (
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
                  #dynamic-memoOut-report-table th {
                    white-space: nowrap;
                  }
                  #dynamic-memoOut-report-table .memo-info td {
                    background: #f5f5f5;
                    font-weight: 600;
                  }
                  [data-bs-theme="dark"] #dynamic-memoOut-report-table th,
                  [data-bs-theme="dark"] #dynamic-memoOut-report-table td {
                    border-color: rgba(255, 255, 255, 0.15) !important;
                    color: var(--vz-body-color, #e9ecef);
                  }
                  [data-bs-theme="dark"] #dynamic-memoOut-report-table thead th {
                    background: #262a2f !important;
                    color: var(--vz-body-color, #e9ecef) !important;
                  }
                  [data-bs-theme="dark"] #dynamic-memoOut-report-table .memo-info td {
                    background: #2c3238 !important;
                    color: var(--vz-body-color, #e9ecef) !important;
                  }
                  [data-bs-theme="dark"] #dynamic-memoOut-report-table .subtotal td,
                  [data-bs-theme="dark"] #dynamic-memoOut-report-table .grand-total td {
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
                      <div className="fs-5 fw-bold">{t("Memo Out Report")}</div>
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
                  <div className="table-responsive mix-memo-grouped-table-wrap" style={{ maxHeight: "750px", overflow: "auto" }}>
                    <table className="table table-bordered align-middle mb-0" id="dynamic-memoOut-report-table" style={{ tableLayout: "fixed", minWidth: "1160px" }}>
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
                          <th className="text-end">{t("Sold")}</th>
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
                                          href={`../memo/edit-memo?Id=${code}&Mode=view`}
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
                                  <td className="text-center">
                                    {dashText(getRowVal(row, "MemoNo", "memoNo"))}
                                  </td>
                                  <td className="text-center">{dashText(getRowVal(row, "Lotno", "lotno"))}</td>
                                  <td className="text-center">{dashText(getRowVal(row, "ItemName", "itemName"))}</td>
                                  <td className="text-end">{renderGroupedValue(row, "Carats")}</td>
                                  <td className="text-end">{renderGroupedValue(row, "Estimate")}</td>
                                  <td className="text-end">{renderGroupedValue(row, "Return")}</td>
                                  <td className="text-end">{renderGroupedValue(row, "Balance")}</td>
                                  <td className="text-end">{renderGroupedValue(row, "Price")}</td>
                                  <td className="text-end">{renderGroupedValue(row, "BalanceAmt")}</td>
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

export default SolitaireMemoOutReport;
