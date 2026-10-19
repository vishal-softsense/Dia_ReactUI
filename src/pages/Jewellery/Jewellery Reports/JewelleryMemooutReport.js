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
  Row
} from "reactstrap";
import Select from "react-select";
import { toast, ToastContainer } from "react-toastify";

import BreadCrumb from "../../../Components/Common/BreadCrumb";
import TableContainer from "../../../Components/Common/TableContainer";
import { exportToExcel } from "../../../helpers/excel_helper";
import {
  getAccGrpMasters,
  getJewelleryMemoOutReport,
  getJewelleryMemoOutReportDropdowns
} from "../../../helpers/fakebackend_helper";
import {
  getCachedReportCompany,
  getReportCompanySettings,
  REPORT_COMPANY_SETTINGS_EVENT,
  resolveCompanyLogoUrl
} from "../../../helpers/reportCompanyDefaults";
import { useSettingReportDates } from "../../../Components/Hooks/useSettingReportDates";

const dashText = (value) => (value === null || value === undefined || value === "" ? "-" : String(value));

const fmtFixed = (value, decimals) => {
  if (value === null || value === undefined || value === "" || Number.isNaN(Number(value))) return (0).toFixed(decimals);
  return Number(value).toFixed(decimals);
};

const getRowVal = (row, ...keys) => {
  for (const key of keys) {
    if (row?.[key] !== undefined && row?.[key] !== null && row?.[key] !== "") return row[key];
  }
  return "";
};

const getTableTotals = (table) => {
  const rows = table.getFilteredRowModel().rows.map((r) => r.original);
  let totalPcs = 0;
  let totalAmount = 0;
  let totalReturn = 0;
  let totalBalance = 0;
  let totalBalanceAmt = 0;

  rows.forEach((r) => {
    if (r?.isParent) {
      totalPcs += Number(getRowVal(r, "Pcs", "pcs", "Carats", "carats") || 0);
      totalAmount += Number(getRowVal(r, "Amount", "amount") || 0);
      totalReturn += Number(getRowVal(r, "Return", "return") || 0);
      totalBalance += Number(getRowVal(r, "Balance", "balance") || 0);
      totalBalanceAmt += Number(getRowVal(r, "BalanceAmt", "balanceAmt") || 0);
    }
  });

  return { totalPcs, totalAmount, totalReturn, totalBalance, totalBalanceAmt };
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
    Carats: ["Pcs", "pcs", "Carats", "carats"],
    Estimate: ["Estimate", "estimate"],
    Return: ["Return", "return"],
    Balance: ["Balance", "balance"],
    Price: ["Price", "price"],
    BalanceAmt: ["BalanceAmt", "balanceAmt"]
  };
  return Number(getRowVal(row, ...(aliases[key] || [key])) || 0);
};

const getGroupedStockId = (row) => getRowVal(row, "Stock_ID", "stock_ID", "stock_id");

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

  // Sale No = BillNo from report API (JewelleryMemoOutReportDto.BillNo).
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

    return { groupKey, first, rows: groupRows, subtotal };
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
        font-size: 11px;
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
    /* Print widths: Sale No → Amount */
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

const TYPE_OPTIONS = [
  { value: "ALL", label: "ALL" },
  { value: "External", label: "EXTERNAL" },
  { value: "Internal", label: "INTERNAL" },
  { value: "Local", label: "LOCAL" },
  { value: "LAB", label: "LAB" },
  { value: "Pend Sale", label: "PEND SALE" }
];

const JewelleryMemooutReport = () => {
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

  const [partyInput, setPartyInput] = useState("");
  const [partyOptions, setPartyOptions] = useState([]);
  const [loadingParties, setLoadingParties] = useState(false);

  const [brokerInput, setBrokerInput] = useState("");
  const [brokerOptions, setBrokerOptions] = useState([]);
  const [loadingBrokers, setLoadingBrokers] = useState(false);

  const [filters, setFilters] = useState({
    fromDate,
    toDate,
    currency: "",
    invNo: "",
    type: "ALL",
    party: "",
    broker: "",
    chkRtnDate: false,
    fromRtnDate: fromDate,
    toRtnDate: toDate,
    clear: false,
    stockId: "",
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
        minHeight: "35px",
        height: "auto"
      }),
      valueContainer: (provided) => ({
        ...provided,
        minHeight: "35px",
        padding: "2px 6px",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center"
      }),
      input: (provided) => ({ ...provided, margin: "0px", padding: "0px" }),
      indicatorSeparator: () => ({ display: "none" }),
      indicatorsContainer: (provided) => ({ ...provided, minHeight: "35px", alignSelf: "flex-start" }),
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

  const currencyOptions = useMemo(() => {
    const list = dropdownData?.currency || [];
    return list.map((item) => ({
      value: String(item.id ?? item.ID ?? ""),
      label: String(item.name ?? item.Name ?? "").toUpperCase()
    }));
  }, [dropdownData]);

  const handleAccountSearch = async (term, setOptions, setLoadingState) => {
    setLoadingState(true);
    try {
      const response = await getAccGrpMasters(term || "");
      const data = response?.data || response?.Data || (Array.isArray(response) ? response : []);
      setOptions(
        data.map((item) => ({
          value: item.accGrpName || item.AccGrpName || item.accGrpCode || item.AccGrpCode,
          label: item.accGrpName || item.AccGrpName
        }))
      );
    } catch (err) {
      console.error("Account search error:", err);
    } finally {
      setLoadingState(false);
    }
  };

  useEffect(() => {
    const loadDropdowns = async () => {
      setLoadingDropdowns(true);
      try {
        const res = await getJewelleryMemoOutReportDropdowns();
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
    handleAccountSearch("", setPartyOptions, setLoadingParties);
    handleAccountSearch("", setBrokerOptions, setLoadingBrokers);
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

  useEffect(() => {
    const timer = setTimeout(() => {
      handleAccountSearch(partyInput, setPartyOptions, setLoadingParties);
    }, 300);
    return () => clearTimeout(timer);
  }, [partyInput]);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleAccountSearch(brokerInput, setBrokerOptions, setLoadingBrokers);
    }, 300);
    return () => clearTimeout(timer);
  }, [brokerInput]);

  const handleClear = async () => {
    const d = await getDates();
    setHasSearched(false);
    setViewType("table");
    setExpandedMemoNos(new Set());
    setReportRows([]);
    setPartyInput("");
    setBrokerInput("");
    handleAccountSearch("", setPartyOptions, setLoadingParties);
    handleAccountSearch("", setBrokerOptions, setLoadingBrokers);
    setFilters(
      mergeDates(
        {
          currency: "",
          invNo: "",
          type: "ALL",
          party: "",
          broker: "",
          chkRtnDate: false,
          clear: false,
          stockId: "",
          fromRChkBox: false,
          groupBy: "MemoNo"
        },
        d
      )
    );
  };

  const buildPayload = () => ({
    FromDate: filters.fromDate,
    ToDate: filters.toDate,
    Currency: filters.currency || null,
    InvNo: filters.invNo || null,
    Type: filters.type || "ALL",
    Party: filters.party || null,
    Broker: filters.broker || null,
    ChkRtnDate: filters.chkRtnDate,
    FromRtnDate: filters.fromRtnDate,
    ToRtnDate: filters.toRtnDate,
    FromRChkBox: filters.fromRChkBox,
    RDate: filters.rDate || null,
    RToDate: filters.rToDate || null,
    Clear: filters.clear,
    Stock_ID: filters.stockId || null
  });

  const loadReportData = async (mode) => {
    setLoading(true);
    try {
      const response = await getJewelleryMemoOutReport(buildPayload());
      const ok = response?.success || response?.Success;
      if (ok) {
        setReportRows(response.Data || response.data || []);
        setHasSearched(true);
        setViewType(mode);
        setExpandedMemoNos(new Set());
        toast.success(t("Report loaded successfully."));
      } else {
        toast.warning(response?.Data || response?.data || response?.Message || t("Failed to load report."));
      }
    } catch (err) {
      console.error(err);
      toast.error(t("Server Connection Problem.."));
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
          <div class="report-title">${escapeHtml(t("Jewellery Memo Out Report"))}</div>
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
            <td class="col-text">${escapeHtml(getRowVal(row, "BillNo", "billNo", "billno") || "")}</td>
            <td class="col-text">${escapeHtml(getRowVal(row, "MemoNo", "memoNo"))}</td>
            <td class="col-text">${escapeHtml(getGroupedStockId(row))}</td>
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

      // Print: colspan covers Sale No + MemoNo, then empty Stock ID + Product
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
            <th>${escapeHtml(t("Sale No"))}</th>
            <th>MemoNo</th>
            <th>${escapeHtml(t("Jew Stock ID"))}</th>
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

    printWindow.document.write(`<!DOCTYPE html><html><head><title>${escapeHtml(t("Jewellery Memo Out Report"))}</title>`);
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

      const totalPcs = rows.reduce((s, r) => s + Number(getRowVal(r, "Pcs", "pcs", "Carats", "carats") || 0), 0);
      const totalAmount = rows.reduce((s, r) => s + Number(getRowVal(r, "Amount", "amount") || 0), 0);
      const totalReturn = rows.reduce((s, r) => s + Number(getRowVal(r, "Return", "return") || 0), 0);
      const totalBalance = rows.reduce((s, r) => s + Number(getRowVal(r, "Balance", "balance") || 0), 0);
      const totalBalanceAmt = rows.reduce((s, r) => s + Number(getRowVal(r, "BalanceAmt", "balanceAmt") || 0), 0);
      const avgPrice = totalPcs > 0 ? totalAmount / totalPcs : 0;

      out.push({
        ...first,
        isParent: true,
        MemoNo: memoNo,
        ItemName: "Total",
        Pcs: totalPcs,
        Price: avgPrice,
        Amount: totalAmount,
        Return: totalReturn,
        Balance: totalBalance,
        BalanceAmt: totalBalanceAmt,
        memoViewHtml: "",
        imageLinkHtml: "",
        childRecords: rows
      });
    });

    return out;
  }, [reportRows]);

  const renderSubRows = useCallback(
    (row) => {
      const parent = row.original;
      const memoKey = String(getRowVal(parent, "MemoNo", "memoNo") || "");
      if (!expandedMemoNos.has(memoKey)) return null;

      const children = parent.childRecords || [];
      return children.map((child, index) => {
        const childRow = { ...child, isParent: false };
        return (
          <tr key={`child-${memoKey}-${index}`} className="child-row">
            {row.getVisibleCells().map((cell) => {
              const column = cell.column;
              return (
                <td key={cell.id}>
                  {column.columnDef.cell
                    ? flexRender(column.columnDef.cell, {
                        ...cell.getContext(),
                        row: { ...row, original: childRow }
                      })
                    : dashText(childRow[column.columnDef.accessorKey])}
                </td>
              );
            })}
          </tr>
        );
      });
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
          const memoKey = String(getRowVal(r, "MemoNo", "memoNo") || "");
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
                  // MVC: ../jewMemo/edit-jew-Memo?Id=...&Mode=view
                  if (code) window.open(`/jewMemo/edit-jew-Memo?Id=${code}&Mode=view`, "_blank");
                }}
              >
                <i className="bx bx-show-alt fs-18" />
              </a>
            </div>
          );
        },
        footer: () => <span className="fw-bold text-center d-block">Total</span>
      },
      {
        header: t("Image"),
        accessorKey: "ImagePath",
        enableColumnFilter: false,
        enableSorting: false,
        cell: ({ row }) => {
          const r = row.original;
          if (r?.isParent) return "";
          const imageUrl = getRowVal(r, "ImagePath", "imagePath");
          const itemCode = getRowVal(r, "ItemCode", "itemCode");
          if (!imageUrl) return "";
          return (
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                if (itemCode) window.open(`/JewDnaReport/edit-jewellery-Mode?Id=${itemCode}&Mode=view`, "_blank");
              }}
            >
              <img
                src={imageUrl}
                alt="Image"
                style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 4 }}
              />
            </a>
          );
        }
      },
      {
        header: t("DATE"),
        accessorKey: "ConDATE",
        accessorFn: (row) => dashText(getRowVal(row, "ConDATE", "conDATE")),
        cell: ({ row }) => dashText(getRowVal(row.original, "ConDATE", "conDATE"))
      },
      {
        header: t("DateDiff"),
        accessorKey: "DateDiff",
        accessorFn: (row) => dashText(getRowVal(row, "DateDiff", "dateDiff")),
        cell: ({ row }) => dashText(getRowVal(row.original, "DateDiff", "dateDiff"))
      },
      {
        header: t("MemoNo"),
        accessorKey: "MemoNo",
        accessorFn: (row) => dashText(getRowVal(row, "MemoNo", "memoNo")),
        cell: ({ row }) => dashText(getRowVal(row.original, "MemoNo", "memoNo"))
      },
      {
        header: t("BillNo"),
        accessorKey: "BillNo",
        accessorFn: (row) => dashText(getRowVal(row, "BillNo", "billNo")),
        cell: ({ row }) => dashText(getRowVal(row.original, "BillNo", "billNo"))
      },
      {
        header: t("Party"),
        accessorKey: "Party",
        accessorFn: (row) => dashText(getRowVal(row, "Party", "party")),
        cell: ({ row }) => dashText(getRowVal(row.original, "Party", "party"))
      },
      {
        header: t("Jew Stock ID"),
        accessorKey: "Stock_ID",
        accessorFn: (row) => dashText(getRowVal(row, "Stock_ID", "stock_ID", "stock_id")),
        cell: ({ row }) => dashText(getRowVal(row.original, "Stock_ID", "stock_ID", "stock_id"))
      },
      {
        header: t("ItemName"),
        accessorKey: "ItemName",
        accessorFn: (row) => dashText(getRowVal(row, "ItemName", "itemName")),
        cell: ({ row }) => dashText(getRowVal(row.original, "ItemName", "itemName"))
      },
      {
        header: t("Carats"),
        accessorKey: "Pcs",
        accessorFn: (row) => fmtFixed(getRowVal(row, "Pcs", "pcs", "Carats", "carats"), 3),
        cell: ({ row }) => fmtFixed(getRowVal(row.original, "Pcs", "pcs", "Carats", "carats"), 3),
        footer: ({ table }) => {
          const { totalPcs } = getTableTotals(table);
          return <span className="fw-bold text-end d-block">{fmtFixed(totalPcs, 3)}</span>;
        }
      },
      {
        header: t("Price"),
        accessorKey: "Price",
        accessorFn: (row) => fmtFixed(getRowVal(row, "Price", "price"), 2),
        cell: ({ row }) => fmtFixed(getRowVal(row.original, "Price", "price"), 2),
        footer: ({ table }) => {
          const { totalPcs, totalAmount } = getTableTotals(table);
          return <span className="fw-bold text-end d-block">{fmtFixed(totalPcs > 0 ? totalAmount / totalPcs : 0, 2)}</span>;
        }
      },
      {
        header: t("Amount"),
        accessorKey: "Amount",
        accessorFn: (row) => fmtFixed(getRowVal(row, "Amount", "amount"), 2),
        cell: ({ row }) => fmtFixed(getRowVal(row.original, "Amount", "amount"), 2),
        footer: ({ table }) => {
          const { totalAmount } = getTableTotals(table);
          return <span className="fw-bold text-end d-block">{fmtFixed(totalAmount, 2)}</span>;
        }
      },
      {
        header: t("Return"),
        accessorKey: "Return",
        accessorFn: (row) => fmtFixed(getRowVal(row, "Return", "return"), 3),
        cell: ({ row }) => fmtFixed(getRowVal(row.original, "Return", "return"), 3),
        footer: ({ table }) => {
          const { totalReturn } = getTableTotals(table);
          return <span className="fw-bold text-end d-block">{fmtFixed(totalReturn, 3)}</span>;
        }
      },
      {
        header: t("ReturnDate"),
        accessorKey: "MemoReturnDate",
        accessorFn: (row) => dashText(getRowVal(row, "MemoReturnDate", "memoReturnDate", "ReturnDate")),
        cell: ({ row }) => dashText(getRowVal(row.original, "MemoReturnDate", "memoReturnDate", "ReturnDate"))
      },
      {
        header: t("Balance"),
        accessorKey: "Balance",
        accessorFn: (row) => fmtFixed(getRowVal(row, "Balance", "balance"), 2),
        cell: ({ row }) => fmtFixed(getRowVal(row.original, "Balance", "balance"), 2),
        footer: ({ table }) => {
          const { totalBalance } = getTableTotals(table);
          return <span className="fw-bold text-end d-block">{fmtFixed(totalBalance, 2)}</span>;
        }
      },
      {
        header: t("BalanceAmt"),
        accessorKey: "BalanceAmt",
        accessorFn: (row) => fmtFixed(getRowVal(row, "BalanceAmt", "balanceAmt"), 2),
        cell: ({ row }) => fmtFixed(getRowVal(row.original, "BalanceAmt", "balanceAmt"), 2),
        footer: ({ table }) => {
          const { totalBalanceAmt } = getTableTotals(table);
          return <span className="fw-bold text-end d-block">{fmtFixed(totalBalanceAmt, 2)}</span>;
        }
      },
      {
        header: t("Broker"),
        accessorKey: "Broker",
        accessorFn: (row) => dashText(getRowVal(row, "Broker", "broker")),
        cell: ({ row }) => dashText(getRowVal(row.original, "Broker", "broker"))
      },
      {
        header: t("IssUser"),
        accessorKey: "IssUser",
        accessorFn: (row) => dashText(getRowVal(row, "IssUser", "issUser")),
        cell: ({ row }) => dashText(getRowVal(row.original, "IssUser", "issUser"))
      },
      {
        header: t("Symbol"),
        accessorKey: "Symbol",
        accessorFn: (row) => dashText(getRowVal(row, "Symbol", "symbol")),
        cell: ({ row }) => dashText(getRowVal(row.original, "Symbol", "symbol"))
      },
      {
        header: t("Cert"),
        accessorKey: "CertId",
        accessorFn: (row) => dashText(getRowVal(row, "CertId", "certId", "Cert")),
        cell: ({ row }) => dashText(getRowVal(row.original, "CertId", "certId", "Cert"))
      },
      {
        header: t("InvType"),
        accessorKey: "Invtype",
        accessorFn: (row) => dashText(getRowVal(row, "Invtype", "InvType", "invtype")),
        cell: ({ row }) => dashText(getRowVal(row.original, "Invtype", "InvType", "invtype"))
      },
      {
        header: t("MemoTime"),
        accessorKey: "MemoTime",
        accessorFn: (row) => dashText(getRowVal(row, "MemoTime", "memoTime")),
        cell: ({ row }) => dashText(getRowVal(row.original, "MemoTime", "memoTime"))
      },
      {
        header: t("MemoReturnDate"),
        accessorKey: "MemoReturnDate2",
        accessorFn: (row) => dashText(getRowVal(row, "MemoReturnDate", "memoReturnDate")),
        cell: ({ row }) => dashText(getRowVal(row.original, "MemoReturnDate", "memoReturnDate"))
      },
      {
        header: t("MemoReturnTime"),
        accessorKey: "MemoReturnTime",
        accessorFn: (row) => dashText(getRowVal(row, "MemoReturnTime", "memoReturnTime")),
        cell: ({ row }) => dashText(getRowVal(row.original, "MemoReturnTime", "memoReturnTime"))
      }
    ],
    [expandedMemoNos, t]
  );

  const handleExcel = async () => {
    if (!reportRows || reportRows.length === 0) {
      toast.warning(t("No data available to export."));
      return;
    }

    const headers = [
      "DATE", "DateDiff", "MemoNo", "BillNo", "Party", "Jew Stock ID", "ItemName",
      "Carats", "Price", "Amount", "Return", "ReturnDate", "Balance", "BalanceAmt",
      "Broker", "IssUser", "Symbol", "Cert", "InvType", "MemoTime", "MemoReturnDate", "MemoReturnTime"
    ];

    const rows = reportRows.map((row) => [
      dashText(getRowVal(row, "ConDATE", "conDATE")),
      dashText(getRowVal(row, "DateDiff", "dateDiff")),
      dashText(getRowVal(row, "MemoNo", "memoNo")),
      dashText(getRowVal(row, "BillNo", "billNo")),
      dashText(getRowVal(row, "Party", "party")),
      dashText(getRowVal(row, "Stock_ID", "stock_ID")),
      dashText(getRowVal(row, "ItemName", "itemName")),
      fmtFixed(getRowVal(row, "Pcs", "pcs", "Carats", "carats"), 3),
      fmtFixed(getRowVal(row, "Price", "price"), 2),
      fmtFixed(getRowVal(row, "Amount", "amount"), 2),
      fmtFixed(getRowVal(row, "Return", "return"), 3),
      dashText(getRowVal(row, "MemoReturnDate", "memoReturnDate")),
      fmtFixed(getRowVal(row, "Balance", "balance"), 2),
      fmtFixed(getRowVal(row, "BalanceAmt", "balanceAmt"), 2),
      dashText(getRowVal(row, "Broker", "broker")),
      dashText(getRowVal(row, "IssUser", "issUser")),
      dashText(getRowVal(row, "Symbol", "symbol")),
      dashText(getRowVal(row, "CertId", "certId")),
      dashText(getRowVal(row, "Invtype", "InvType")),
      dashText(getRowVal(row, "MemoTime", "memoTime")),
      dashText(getRowVal(row, "MemoReturnDate", "memoReturnDate")),
      dashText(getRowVal(row, "MemoReturnTime", "memoReturnTime"))
    ]);

    const res = await exportToExcel(headers, rows, "JewMemoReport", "JewMemoReport");
    if (!res?.success) toast.error(t("Excel export failed."));
  };

  document.title = `${t("Jewellery MemoOut Report")} | ${t("Reports")}`;

  return (
    <React.Fragment>
      <ToastContainer />

      <div className="page-content">
        <Container fluid>
          <BreadCrumb title={t("Jewellery Memo Report")} pageTitle={t("JewMemo Reports")} />

          <div className="card stock-search-header-bar d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between mb-3 p-3 rounded-3 shadow-sm border gap-2">
            <h5 className="mb-0 fw-bold text-primary d-flex align-items-center gap-2">
              <i className={hasSearched ? "ri-database-2-line fs-20 text-primary" : "ri-search-eye-line fs-20 text-primary"}></i>
              {hasSearched ? t("Jewellery Memo Report Results") : t("Jewellery Memo Report Filters")}
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
                    <Button color="success" className="btn-sm rounded-2 px-3 py-1" onClick={handleExcel} disabled={reportRows.length === 0}>
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
                          <Select classNamePrefix="react-select" styles={customStyles} isClearable options={currencyOptions} value={currencyOptions.find((o) => o.value === filters.currency) || null} onChange={(sel) => setFilters((p) => ({ ...p, currency: sel?.value || "" }))} placeholder={t("Select Currency")} isLoading={loadingDropdowns} />
                        </FormGroup>
                      </Col>
                      <Col sm={2}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1 small">{t("Memo No")}</Label>
                          <Input type="text" className="form-control form-control-sm" style={{ height: "35px" }} value={filters.invNo} placeholder={t("MemoNo")} onChange={(e) => setFilters((p) => ({ ...p, invNo: e.target.value }))} />
                        </FormGroup>
                      </Col>
                      <Col sm={2}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1 small">{t("Type")}</Label>
                          <Select classNamePrefix="react-select" styles={customStyles} options={TYPE_OPTIONS} value={TYPE_OPTIONS.find((o) => o.value === filters.type) || TYPE_OPTIONS[0]} onChange={(sel) => setFilters((p) => ({ ...p, type: sel?.value || "ALL" }))} placeholder={t("Select Type")} />
                        </FormGroup>
                      </Col>
                      <Col sm={2}>
                        <FormGroup className="mb-0">
                          <Label className="w-100 mb-1"></Label>
                          <div className="d-flex align-items-center gap-1" style={{ height: "35px" }}>
                            <input type="checkbox" id="jewClearMemoCheckbox" checked={filters.clear} onChange={(e) => setFilters((p) => ({ ...p, clear: e.target.checked }))} />
                            <Label htmlFor="jewClearMemoCheckbox" className="mb-0 small">{t("Show Clear Memo")}</Label>
                          </div>
                        </FormGroup>
                      </Col>
                    </Row>

                    <Row className="g-2">
                      <Col sm={2}>
                        <FormGroup className="mb-0">
                          <div className="d-flex align-items-center gap-1 mb-1">
                            <input type="checkbox" id="jewRtnDateCheckbox" checked={filters.chkRtnDate} onChange={(e) => setFilters((p) => ({ ...p, chkRtnDate: e.target.checked }))} />
                            <Label htmlFor="jewRtnDateCheckbox" className="fw-medium mb-0 small">{t("Rtn Date")}</Label>
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
                          <Select classNamePrefix="react-select" styles={customStyles} isClearable options={partyOptions} value={partyOptions.find((o) => o.value === filters.party) || null} onInputChange={(val) => setPartyInput(val)} onChange={(sel) => setFilters((p) => ({ ...p, party: sel?.value || "" }))} placeholder={t("Search Party")} isLoading={loadingParties} />
                        </FormGroup>
                      </Col>
                      <Col sm={2}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1 small">{t("Broker")}</Label>
                          <Select classNamePrefix="react-select" styles={customStyles} isClearable options={brokerOptions} value={brokerOptions.find((o) => o.value === filters.broker) || null} onInputChange={(val) => setBrokerInput(val)} onChange={(sel) => setFilters((p) => ({ ...p, broker: sel?.value || "" }))} placeholder={t("Search Broker")} isLoading={loadingBrokers} />
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

                    {/* MVC JewMemoReport: Print Date / Print To Date (RoundDate filter) */}
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
                  </Col>

                  <Col md={2}>
                    <FormGroup className="mb-0">
                      <Label className="fw-medium mb-1 small">{t("Enter Jew Stock ID")}</Label>
                      <Input type="textarea" rows={7} value={filters.stockId} placeholder={t("Search by Jew Stock ID")} onChange={(e) => setFilters((p) => ({ ...p, stockId: e.target.value }))} />
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
                  <span>
                    {t("Showing")}: {groupedVisibleRows.length} {t("entries")} ({reportRows.length})
                  </span>
                </div>

                <TableContainer
                  columns={columns}
                  data={groupedVisibleRows}
                  isGlobalFilter={true}
                  customPageSize={500}
                  customPageSizes={[500, 1000, 1500, -1]}
                  divClass="table-responsive table-card mb-3"
                  tableClass="align-middle table-nowrap mb-0 table-hover table-striped"
                  theadClass="table-light"
                  SearchPlaceholder={t("SEARCH:")}
                  getRowClass={(row) => (row.original?.isParent ? "parent-row fw-bold" : "child-row")}
                  renderSubRows={renderSubRows}
                  showFooter={true}
                />
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
                      <div className="fs-5 fw-bold">{t("Jewellery Memo Out Report")}</div>
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
                          <th>{t("Sale No")}</th>
                          <th>MemoNo</th>
                          <th>{t("Jew Stock ID")}</th>
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
                                          href={`/jewMemo/edit-jew-Memo?Id=${code}&Mode=view`}
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
                                  <td className="text-center">
                                    {dashText(getRowVal(row, "BillNo", "billNo", "billno"))}
                                  </td>
                                  <td className="text-center">
                                    {dashText(getRowVal(row, "MemoNo", "memoNo"))}
                                  </td>
                                  <td className="text-center">{dashText(getGroupedStockId(row))}</td>
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

export default JewelleryMemooutReport;
