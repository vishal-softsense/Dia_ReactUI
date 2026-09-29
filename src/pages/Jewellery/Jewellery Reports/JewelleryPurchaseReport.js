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
  getJewelleryPurchaseReport,
  getJewelleryPurchaseReportDropdowns
} from "../../../helpers/fakebackend_helper";
import {
  getCachedReportCompany,
  getReportCompanySettings,
  REPORT_COMPANY_SETTINGS_EVENT,
  resolveCompanyLogoUrl
} from "../../../helpers/reportCompanyDefaults";
import { useSettingReportDates } from "../../../Components/Hooks/useSettingReportDates";
import { api } from "../../../config";

const dashText = (value) => (value === null || value === undefined || value === "" ? "-" : String(value));

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

const numericSortFn = (rowA, rowB, columnId) => {
  const a = parseFloat(rowA.getValue(columnId)) || 0;
  const b = parseFloat(rowB.getValue(columnId)) || 0;
  return a - b;
};

const normalizeMediaPath = (path) => {
  if (!path || typeof path !== "string") return "";
  let trimmed = path.trim();
  if (!trimmed || trimmed.toLowerCase() === "null" || trimmed.toLowerCase() === "undefined") return "";
  return trimmed.replace(/\\/g, "/").replace(/^~\//, "/");
};

const resolveMediaUrl = (path) => {
  const trimmed = normalizeMediaPath(path);
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("data:") || trimmed.startsWith("blob:")) return trimmed;
  const baseUrl = (api.IMAGE_URL || api.API_URL || "").replace(/\/$/, "");
  const clean = trimmed.replace(/^(\.\.\/)+/, "");
  if (clean.startsWith("/")) return `${baseUrl}${clean}`;
  return `${baseUrl}/${clean}`;
};

const getTableTotals = (table) => {
  const rows = table.getFilteredRowModel().rows.map((r) => r.original);
  let parentPcs = 0;
  let parentAmt = 0;
  let parentINR = 0;
  let parentUSD = 0;

  rows.forEach((r) => {
    if (r?.isParent) {
      parentPcs += Number(getRowVal(r, "Pcs", "pcs") || 0);
      parentAmt += Number(getRowVal(r, "amount", "Amount") || 0);
      parentINR += Number(getRowVal(r, "MasterCurrencyAmount", "masterCurrencyAmount") || 0);
      parentUSD += Number(getRowVal(r, "StockCurrencyAmount", "stockCurrencyAmount") || 0);
    }
  });

  return { parentPcs, parentAmt, parentINR, parentUSD };
};

const getRowDueDateRaw = (row) => getRowVal(row, "ConDATE", "conDATE", "conDate", "Date", "date");

const GROUPED_SUM_COLUMNS = ["Carats", "Return", "Amount"];
const GROUPED_DECIMALS = {
  Carats: 3,
  Return: 2,
  Amount: 2
};

const getGroupedNumeric = (row, key) => {
  const aliases = {
    Carats: ["Pcs", "pcs"],
    Return: ["ReturnCarats", "returnCarats", "Return", "return"],
    Amount: ["amount", "Amount"]
  };
  return Number(getRowVal(row, ...(aliases[key] || [key])) || 0);
};

const getGroupedInvNo = (row) => getRowVal(row, "Invno", "invno", "InvNo", "invNo");
const getGroupedProduct = (row) => getRowVal(row, "ItemName", "itemName");

const buildGroupedReportSections = (rows, groupBy) => {
  const grouped = {};

  (rows || []).forEach((item) => {
    const key =
      groupBy === "PartyName"
        ? String(getRowVal(item, "Party", "party") || "Unknown Party")
        : String(getGroupedInvNo(item) || "Unknown Invoice");
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(item);
  });

  // Match MVC Jewpurchase-report.js: client-side Sr No (not SP RowIndex).
  // InvNo group → one Sr No per invoice (shared by all lines).
  // PartyName group → one Sr No per distinct InvNo, global counter across parties.
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
        const invKey = String(getGroupedInvNo(item) || "");
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
        margin: 5mm;
    }
    *, *::before, *::after { box-sizing: border-box; }
    html, body {
        font-family: Arial, Helvetica, sans-serif;
        font-size: 12px;
        color: #000;
        padding: 0;
        margin: 0;
        background: #fff;
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
        max-width: 68%;
    }
    #header img {
        max-height: 70px;
        width: auto;
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
        font-size: 11px;
        color: #555;
        margin-top: 4px;
        text-align: right;
    }
    #dynamic-jew-purchase-report-table {
        border-collapse: collapse;
        table-layout: fixed;
        width: 100%;
        max-width: 270mm;
        margin: 10px auto 0 auto;
    }
    #dynamic-jew-purchase-report-table th,
    #dynamic-jew-purchase-report-table td {
        padding: 3px 4px;
        font-size: 10px;
        border: 1px solid #333;
        vertical-align: middle;
        word-wrap: break-word;
        overflow-wrap: break-word;
    }
    #dynamic-jew-purchase-report-table thead th {
        background: #f2f2f2;
        text-align: center;
        font-weight: 700;
        white-space: nowrap;
    }
    /* Match MVC print widths (View omitted): Sr No → Amount */
    #dynamic-jew-purchase-report-table col:nth-child(1) { width: 20mm; }
    #dynamic-jew-purchase-report-table col:nth-child(2) { width: 20mm; }
    #dynamic-jew-purchase-report-table col:nth-child(3) { width: 95mm; }
    #dynamic-jew-purchase-report-table col:nth-child(4) { width: 24mm; }
    #dynamic-jew-purchase-report-table col:nth-child(5) { width: 24mm; }
    #dynamic-jew-purchase-report-table col:nth-child(6) { width: 28mm; }
    #dynamic-jew-purchase-report-table col:nth-child(7) { width: 30mm; }
    #dynamic-jew-purchase-report-table th:nth-child(n+4),
    #dynamic-jew-purchase-report-table td.col-num {
        text-align: right !important;
    }
    #dynamic-jew-purchase-report-table tbody td.col-product {
        word-break: break-word;
        text-align: center;
    }
    #dynamic-jew-purchase-report-table tbody td.col-text {
        text-align: center;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    #dynamic-jew-purchase-report-table tbody td.col-num {
        white-space: nowrap;
        word-break: keep-all;
    }
    #dynamic-jew-purchase-report-table .invoice-info td {
        background: #f5f5f5;
        font-weight: 600;
        text-align: left !important;
        padding: 6px 8px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    #dynamic-jew-purchase-report-table .subtotal td,
    #dynamic-jew-purchase-report-table .grand-total td {
        font-weight: 700;
    }
    #dynamic-jew-purchase-report-table .subtotal td.col-label,
    #dynamic-jew-purchase-report-table .grand-total td.col-label {
        text-align: left !important;
        white-space: nowrap;
    }
    #dynamic-jew-purchase-report-table .subtotal td.col-num,
    #dynamic-jew-purchase-report-table .grand-total td.col-num {
        text-align: right !important;
        white-space: nowrap;
        word-break: keep-all;
    }
    #cpny-footer {
        max-width: 270mm;
        width: 100%;
        margin: 12px auto 0 auto;
        font-size: 11px;
    }
`;

const calcGroupedAvgRate = (subtotal) =>
  subtotal.Carats > 0 ? subtotal.Amount / subtotal.Carats : 0;

const mapDropdownItems = (list, useNameAsValue = false) => {
  if (!Array.isArray(list)) return [];
  return list.map((item) => ({
    value: String(useNameAsValue ? (item.name ?? item.Name ?? item.id ?? item.ID ?? "") : (item.id ?? item.ID ?? item.name ?? item.Name ?? "")),
    label: String(item.name ?? item.Name ?? item.id ?? item.ID ?? "").toUpperCase()
  }));
};

const JewelleryPurchaseReport = () => {
  const { t } = useTranslation();
  const { fromDate, toDate, getDates, mergeDates } = useSettingReportDates();

  const [loadingDropdowns, setLoadingDropdowns] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [viewType, setViewType] = useState("table");

  const [dropdownData, setDropdownData] = useState({});
  const [companyInfo, setCompanyInfo] = useState(() => getCachedReportCompany());
  const [expandedInvnos, setExpandedInvnos] = useState(() => new Set());
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
    billNo: "",
    type: "",
    subType: "",
    category: "",
    party: "",
    broker: "",
    lotNo: "",
    groupBy: "InvNo"
  });

  const groupByOptions = useMemo(
    () => [
      { value: "InvNo", label: t("Group by InvNo") },
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

  const getOptions = useCallback(
    (dropdownKey) => {
      const useName = dropdownKey === "type" || dropdownKey === "subType" || dropdownKey === "category";
      const list = dropdownData?.[dropdownKey] || [];
      if (list.length && list[0]?.value !== undefined) return list;
      return mapDropdownItems(list, useName);
    },
    [dropdownData]
  );

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
        const res = await getJewelleryPurchaseReportDropdowns();
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
    const loadCompany = async () => {
      const info = await getReportCompanySettings();
      if (info) setCompanyInfo(info);
    };
    loadCompany();

    const handleCompanyRefresh = async () => {
      const info = await getReportCompanySettings();
      if (info) setCompanyInfo(info);
    };

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
    setExpandedInvnos(new Set());
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
          billNo: "",
          type: "",
          subType: "",
          category: "",
          party: "",
          broker: "",
          lotNo: "",
          groupBy: "InvNo"
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
    BillNo: filters.billNo || null,
    Type: filters.type || null,
    SubType: filters.subType || null,
    Category: filters.category || null,
    Party: filters.party || null,
    Broker: filters.broker || null,
    LotNo: filters.lotNo || null
  });

  const loadReportData = async (mode) => {
    setLoading(true);
    try {
      const response = await getJewelleryPurchaseReport(buildPayload());
      const ok = response?.success || response?.Success;

      if (ok) {
        const data = response.Data || response.data || [];
        setReportRows(data);
        setHasSearched(true);
        setViewType(mode);
        setExpandedInvnos(new Set());
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
    () => buildGroupedReportSections(reportRows, filters.groupBy || "InvNo"),
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
          <div class="report-title">JewPurchase Report</div>
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
          : `<strong>${escapeHtml(t("Party"))}:</strong> ${escapeHtml(getRowVal(section.first, "Party", "party"))} &nbsp;|&nbsp; <strong>${escapeHtml(t("Inv No"))}:</strong> ${escapeHtml(section.groupKey)} &nbsp;|&nbsp; <strong>${escapeHtml(t("Date"))}:</strong> ${escapeHtml(formatReportDisplayDate(getRowDueDateRaw(section.first)))}`;

      bodyRows += `<tr class="invoice-info"><td colspan="7">${infoText}</td></tr>`;

      section.rows.forEach((row) => {
        bodyRows += `
          <tr>
            <td class="col-text">${escapeHtml(row._srNo ?? "")}</td>
            <td class="col-text">${escapeHtml(getGroupedInvNo(row))}</td>
            <td class="col-product">${escapeHtml(getGroupedProduct(row))}</td>
            <td class="col-num">${escapeHtml(fmtFixed(getGroupedNumeric(row, "Carats"), GROUPED_DECIMALS.Carats))}</td>
            <td class="col-num">${escapeHtml(fmtFixed(getGroupedNumeric(row, "Return"), GROUPED_DECIMALS.Return))}</td>
            <td class="col-num">${escapeHtml(fmtFixed(getRowVal(row, "rate", "Rate"), 2))}</td>
            <td class="col-num">${escapeHtml(fmtFixed(getGroupedNumeric(row, "Amount"), GROUPED_DECIMALS.Amount))}</td>
          </tr>
        `;
      });

      // MVC print (View removed): colspan covers Sr No + Invno, then Product + numeric cols
      bodyRows += `
        <tr class="subtotal">
          <td colspan="2" class="col-label" style="padding-left:24px;"><strong>${escapeHtml(t("Total"))}</strong></td>
          <td></td>
          <td class="col-num"><strong>${escapeHtml(fmtFixed(section.subtotal.Carats, GROUPED_DECIMALS.Carats))}</strong></td>
          <td class="col-num"><strong>${escapeHtml(fmtFixed(section.subtotal.Return, GROUPED_DECIMALS.Return))}</strong></td>
          <td class="col-num"><strong>${escapeHtml(fmtFixed(calcGroupedAvgRate(section.subtotal), 2))}</strong></td>
          <td class="col-num"><strong>${escapeHtml(fmtFixed(section.subtotal.Amount, GROUPED_DECIMALS.Amount))}</strong></td>
        </tr>
      `;
    });

    bodyRows += `
      <tr class="grand-total">
        <td colspan="2" class="col-label" style="padding-left:24px;"><strong>${escapeHtml(t("Grand Total"))}</strong></td>
        <td></td>
        <td class="col-num"><strong>${escapeHtml(fmtFixed(grandTotal.Carats, GROUPED_DECIMALS.Carats))}</strong></td>
        <td class="col-num"><strong>${escapeHtml(fmtFixed(grandTotal.Return, GROUPED_DECIMALS.Return))}</strong></td>
        <td class="col-num"><strong>${escapeHtml(fmtFixed(calcGroupedAvgRate(grandTotal), 2))}</strong></td>
        <td class="col-num"><strong>${escapeHtml(fmtFixed(grandTotal.Amount, GROUPED_DECIMALS.Amount))}</strong></td>
      </tr>
    `;

    const tableHtml = `
      <table id="dynamic-jew-purchase-report-table">
        <colgroup>
          <col /><col /><col /><col /><col /><col /><col />
        </colgroup>
        <thead>
          <tr>
            <th>Sr No</th>
            <th>Invno</th>
            <th>Product</th>
            <th>Carats</th>
            <th>Return</th>
            <th>${escapeHtml(t("Rate"))}</th>
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

    printWindow.document.write(`<!DOCTYPE html><html><head><title>${escapeHtml(t("Jewellery Purchase Report"))}</title>`);
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
    return dashText(getRowVal(row, "rate", "Rate"));
  };

  const renderGroupedViewLink = (row) => {
    const itemCode = getRowVal(row, "ItemCode", "itemCode");
    const imagePath = getRowVal(row, "ImagePath", "imagePath");
    const imageUrl = resolveMediaUrl(imagePath);
    if (!itemCode) return "";

    return (
      <div className="report-action">
        <a
          href={`/master/edit-Mounting-stock?id=${itemCode}&mode=view`}
          target="_blank"
          rel="noreferrer"
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt=""
              style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 4 }}
              onError={(ev) => {
                ev.target.style.display = "none";
              }}
            />
          ) : (
            <i className="bx bx-image-alt fs-18 text-muted" />
          )}
        </a>
      </div>
    );
  };

  const groupedVisibleRows = useMemo(() => {
    const grouped = {};
    (reportRows || []).forEach((r) => {
      const invNoVal = getRowVal(r, "Invno", "invno", "InvNo", "invNo");
      const key = invNoVal !== "" ? String(invNoVal) : "UNKNOWN";
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(r);
    });

    const out = [];
    Object.keys(grouped)
      .sort()
      .forEach((invnoKey) => {
        const rows = grouped[invnoKey] || [];
        const first = rows[0];

        const totalPcs = rows.reduce((s, r) => s + Number(getRowVal(r, "Pcs", "pcs") || 0), 0);
        const totalAmount = rows.reduce((s, r) => s + Number(getRowVal(r, "amount", "Amount") || 0), 0);
        const totalINR = rows.reduce(
          (s, r) => s + Number(getRowVal(r, "MasterCurrencyAmount", "masterCurrencyAmount") || 0),
          0
        );
        const totalUSD = rows.reduce(
          (s, r) => s + Number(getRowVal(r, "StockCurrencyAmount", "stockCurrencyAmount") || 0),
          0
        );

        out.push({
          ...first,
          isParent: true,
          ItemName: "Total",
          Pcs: totalPcs,
          amount: totalAmount,
          rate: totalPcs > 0 ? totalAmount / totalPcs : 0,
          MasterCurrencyRate: totalPcs > 0 ? totalINR / totalPcs : 0,
          MasterCurrencyAmount: totalINR,
          StockCurrencyRate: totalPcs > 0 ? totalUSD / totalPcs : 0,
          StockCurrencyAmount: totalUSD,
          ImagePath: "",
          childRecords: rows
        });
      });

    return out;
  }, [reportRows]);

  const renderSubRows = useCallback(
    (row) => {
      const parent = row.original;
      const invnoKey = String(getRowVal(parent, "Invno", "invno", "InvNo", "invNo") || "");
      if (!expandedInvnos.has(invnoKey)) return null;

      const children = parent.childRecords || [];
      return children.map((child, index) => {
        const childRow = { ...child, isParent: false, invnoKey };
        return (
          <tr key={`child-${invnoKey}-${index}`} className="child-row">
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
    [expandedInvnos]
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
          const invnoKey = String(getRowVal(r, "Invno", "invno", "InvNo", "invNo") || "");
          const expanded = expandedInvnos.has(invnoKey);
          return (
            <i
              className={expanded ? "bx bx-chevron-down" : "bx bx-chevron-right"}
              style={{ cursor: "pointer", color: "#2c7be5", fontSize: "18px", verticalAlign: "middle" }}
              onClick={() => {
                setExpandedInvnos((prev) => {
                  const next = new Set();
                  if (!prev.has(invnoKey)) next.add(invnoKey);
                  return next;
                });
              }}
            />
          );
        }
      },
      {
        header: t("View"),
        accessorKey: "ItemCode",
        enableColumnFilter: false,
        enableSorting: false,
        cell: ({ row }) => {
          const r = row.original;
          if (r?.isParent) return "";
          const itemCode = getRowVal(r, "ItemCode", "itemCode");
          const imagePath = getRowVal(r, "ImagePath", "imagePath");
          const imageUrl = resolveMediaUrl(imagePath);
          return (
            <div className="report-action">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (itemCode) {
                    window.open(`/master/edit-Mounting-stock?id=${itemCode}&mode=view`, "_blank");
                  }
                }}
              >
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt=""
                    style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 4 }}
                    onError={(ev) => {
                      ev.target.style.display = "none";
                    }}
                  />
                ) : (
                  <i className="bx bx-image-alt fs-18 text-muted" />
                )}
              </a>
            </div>
          );
        },
        footer: () => <span className="fw-bold text-center d-block">Total:</span>
      },
      {
        header: t("Date"),
        accessorKey: "ConDATE",
        accessorFn: (row) => dashText(getRowVal(row, "ConDATE", "conDATE", "conDate", "Date", "date")),
        cell: ({ row }) => dashText(getRowVal(row.original, "ConDATE", "conDATE", "conDate", "Date", "date"))
      },
      {
        header: t("InvNo"),
        accessorKey: "Invno",
        accessorFn: (row) => dashText(getRowVal(row, "Invno", "invno", "InvNo", "invNo")),
        cell: ({ row }) => dashText(getRowVal(row.original, "Invno", "invno", "InvNo", "invNo"))
      },
      {
        header: t("BillNo"),
        accessorKey: "BillNo",
        accessorFn: (row) => dashText(getRowVal(row, "BillNo", "billNo", "billno")),
        cell: ({ row }) => dashText(getRowVal(row.original, "BillNo", "billNo", "billno"))
      },
      {
        header: t("Party"),
        accessorKey: "Party",
        accessorFn: (row) => dashText(getRowVal(row, "Party", "party")),
        cell: ({ row }) => dashText(getRowVal(row.original, "Party", "party"))
      },
      {
        header: t("LotNo"),
        accessorKey: "Item",
        accessorFn: (row) => dashText(getRowVal(row, "Item", "item")),
        cell: ({ row }) => dashText(getRowVal(row.original, "Item", "item"))
      },
      {
        header: t("ItemName"),
        accessorKey: "ItemName",
        accessorFn: (row) => dashText(getRowVal(row, "ItemName", "itemName")),
        cell: ({ row }) => dashText(getRowVal(row.original, "ItemName", "itemName"))
      },
      {
        header: t("Pcs"),
        accessorKey: "Pcs",
        accessorFn: (row) => fmtFixed(getRowVal(row, "Pcs", "pcs"), 3),
        cell: ({ row }) => fmtFixed(getRowVal(row.original, "Pcs", "pcs"), 3),
        sortingFn: numericSortFn,
        footer: ({ table }) => {
          const { parentPcs } = getTableTotals(table);
          return <span className="fw-bold text-end d-block">{fmtFixed(parentPcs, 3)}</span>;
        }
      },
      {
        header: t("Rate"),
        accessorKey: "rate",
        accessorFn: (row) => fmtFixed(getRowVal(row, "rate", "Rate"), 2),
        cell: ({ row }) => fmtFixed(getRowVal(row.original, "rate", "Rate"), 2),
        sortingFn: numericSortFn,
        footer: ({ table }) => {
          const { parentPcs, parentAmt } = getTableTotals(table);
          return <span className="fw-bold text-end d-block">{fmtFixed(parentPcs > 0 ? parentAmt / parentPcs : 0, 2)}</span>;
        }
      },
      {
        header: t("Amount"),
        accessorKey: "amount",
        accessorFn: (row) => fmtFixed(getRowVal(row, "amount", "Amount"), 2),
        cell: ({ row }) => fmtFixed(getRowVal(row.original, "amount", "Amount"), 2),
        sortingFn: numericSortFn,
        footer: ({ table }) => {
          const { parentAmt } = getTableTotals(table);
          return <span className="fw-bold text-end d-block">{fmtFixed(parentAmt, 2)}</span>;
        }
      },
      {
        header: t("Broker"),
        accessorKey: "Broker",
        accessorFn: (row) => dashText(getRowVal(row, "Broker", "broker")),
        cell: ({ row }) => dashText(getRowVal(row.original, "Broker", "broker"))
      },
      {
        header: t("Less1"),
        accessorKey: "Less1",
        accessorFn: (row) => dashText(getRowVal(row, "Less1", "less1")),
        cell: ({ row }) => dashText(getRowVal(row.original, "Less1", "less1"))
      },
      {
        header: t("Less2"),
        accessorKey: "Less2",
        accessorFn: (row) => dashText(getRowVal(row, "Less2", "less2")),
        cell: ({ row }) => dashText(getRowVal(row.original, "Less2", "less2"))
      },
      {
        header: t("Less3"),
        accessorKey: "Less3",
        accessorFn: (row) => dashText(getRowVal(row, "Less3", "less3")),
        cell: ({ row }) => dashText(getRowVal(row.original, "Less3", "less3"))
      },
      {
        header: t("InvType"),
        accessorKey: "invtype",
        accessorFn: (row) => dashText(getRowVal(row, "invtype", "Invtype", "InvType")),
        cell: ({ row }) => dashText(getRowVal(row.original, "invtype", "Invtype", "InvType"))
      },
      {
        header: t("Symbol"),
        accessorKey: "Symbol",
        accessorFn: (row) => dashText(getRowVal(row, "Symbol", "symbol")),
        cell: ({ row }) => dashText(getRowVal(row.original, "Symbol", "symbol"))
      },
      {
        header: t("INR Rate"),
        accessorKey: "MasterCurrencyRate",
        accessorFn: (row) => {
          const val = getRowVal(row, "MasterCurrencyRate", "masterCurrencyRate");
          return val ? fmtFixed(val, 2) : "";
        },
        cell: ({ row }) => {
          const val = getRowVal(row.original, "MasterCurrencyRate", "masterCurrencyRate");
          return val ? fmtFixed(val, 2) : "";
        },
        sortingFn: numericSortFn
      },
      {
        header: t("INR Amount"),
        accessorKey: "MasterCurrencyAmount",
        accessorFn: (row) => fmtFixed(getRowVal(row, "MasterCurrencyAmount", "masterCurrencyAmount"), 2),
        cell: ({ row }) => fmtFixed(getRowVal(row.original, "MasterCurrencyAmount", "masterCurrencyAmount"), 2),
        sortingFn: numericSortFn,
        footer: ({ table }) => {
          const { parentINR } = getTableTotals(table);
          return <span className="fw-bold text-end d-block">{fmtFixed(parentINR, 2)}</span>;
        }
      },
      {
        header: t("USD Rate"),
        accessorKey: "StockCurrencyRate",
        accessorFn: (row) => {
          const val = getRowVal(row, "StockCurrencyRate", "stockCurrencyRate");
          return val ? fmtFixed(val, 2) : "";
        },
        cell: ({ row }) => {
          const val = getRowVal(row.original, "StockCurrencyRate", "stockCurrencyRate");
          return val ? fmtFixed(val, 2) : "";
        },
        sortingFn: numericSortFn
      },
      {
        header: t("USD Amount"),
        accessorKey: "StockCurrencyAmount",
        accessorFn: (row) => fmtFixed(getRowVal(row, "StockCurrencyAmount", "stockCurrencyAmount"), 2),
        cell: ({ row }) => fmtFixed(getRowVal(row.original, "StockCurrencyAmount", "stockCurrencyAmount"), 2),
        sortingFn: numericSortFn,
        footer: ({ table }) => {
          const { parentUSD } = getTableTotals(table);
          return <span className="fw-bold text-end d-block">{fmtFixed(parentUSD, 2)}</span>;
        }
      }
    ],
    [expandedInvnos, t]
  );

  const handleExcel = async () => {
    if (!reportRows || reportRows.length === 0) {
      toast.warning(t("No data available to export."));
      return;
    }

    const headers = [
      "Date",
      "InvNo",
      "BillNo",
      "Party",
      "LotNo",
      "ItemName",
      "Pcs",
      "Rate",
      "Amount",
      "Broker",
      "Less1",
      "Less2",
      "Less3",
      "InvType",
      "Symbol",
      "INR Rate",
      "INR Amount",
      "USD Rate",
      "USD Amount"
    ];

    const rows = reportRows.map((row) => [
      dashText(getRowVal(row, "ConDATE", "conDATE", "conDate", "Date", "date")),
      dashText(getRowVal(row, "Invno", "invno", "InvNo", "invNo")),
      dashText(getRowVal(row, "BillNo", "billNo", "billno")),
      dashText(getRowVal(row, "Party", "party")),
      dashText(getRowVal(row, "Item", "item")),
      dashText(getRowVal(row, "ItemName", "itemName")),
      fmtFixed(getRowVal(row, "Pcs", "pcs"), 3),
      fmtFixed(getRowVal(row, "rate", "Rate"), 2),
      fmtFixed(getRowVal(row, "amount", "Amount"), 2),
      dashText(getRowVal(row, "Broker", "broker")),
      dashText(getRowVal(row, "Less1", "less1")),
      dashText(getRowVal(row, "Less2", "less2")),
      dashText(getRowVal(row, "Less3", "less3")),
      dashText(getRowVal(row, "invtype", "Invtype", "InvType")),
      dashText(getRowVal(row, "Symbol", "symbol")),
      fmtFixed(getRowVal(row, "MasterCurrencyRate", "masterCurrencyRate"), 2),
      fmtFixed(getRowVal(row, "MasterCurrencyAmount", "masterCurrencyAmount"), 2),
      fmtFixed(getRowVal(row, "StockCurrencyRate", "stockCurrencyRate"), 2),
      fmtFixed(getRowVal(row, "StockCurrencyAmount", "stockCurrencyAmount"), 2)
    ]);

    const res = await exportToExcel(headers, rows, "JewPur-report", "JewPur-report");
    if (!res?.success) toast.error(t("Excel export failed."));
  };

  document.title = `${t("Jewellery Purchase Report")} | ${t("Reports")}`;

  return (
    <React.Fragment>
      <ToastContainer />

      <div className="page-content">
        <Container fluid>
          <BreadCrumb title={t("Jewellery Purchase Report")} pageTitle={t("JewPurchase Reports")} />

          <div className="card stock-search-header-bar d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between mb-3 p-3 rounded-3 shadow-sm border gap-2">
            <h5 className="mb-0 fw-bold text-primary d-flex align-items-center gap-2">
              <i className={hasSearched ? "ri-database-2-line fs-20 text-primary" : "ri-search-eye-line fs-20 text-primary"}></i>
              {hasSearched ? t("Jewellery Purchase Report Results") : t("Jewellery Purchase Report Filters")}
            </h5>

            <div className="d-flex gap-2">
              {!hasSearched ? (
                <>
                  <Button color="primary" className="btn-sm rounded-2 px-3 py-1" onClick={handleReport} disabled={loading}>
                    {loading ? t("Loading...") : t("Report")}
                  </Button>
                  <Button color="primary" className="btn-sm rounded-2 px-3 py-1" onClick={handleGroupedReport} disabled={loading}>
                    {loading ? t("Loading...") : t("View Grouped Invoices")}
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
                      setExpandedInvnos(new Set());
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
                            isLoading={loadingDropdowns}
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
                            options={partyOptions}
                            value={partyOptions.find((o) => o.value === filters.party) || null}
                            onInputChange={(val) => setPartyInput(val)}
                            onChange={(sel) => setFilters((prev) => ({ ...prev, party: sel?.value || "" }))}
                            placeholder={t("Search Party")}
                            isLoading={loadingParties}
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
                            options={brokerOptions}
                            value={brokerOptions.find((o) => o.value === filters.broker) || null}
                            onInputChange={(val) => setBrokerInput(val)}
                            onChange={(sel) => setFilters((prev) => ({ ...prev, broker: sel?.value || "" }))}
                            placeholder={t("Search Broker")}
                            isLoading={loadingBrokers}
                          />
                        </FormGroup>
                      </Col>
                      <Col sm={2}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1 small">{t("Invoice No")}</Label>
                          <Input
                            type="text"
                            className="form-control form-control-sm"
                            style={{ height: "35px" }}
                            value={filters.invNo}
                            placeholder={t("InvNo")}
                            onChange={(e) => setFilters((prev) => ({ ...prev, invNo: e.target.value }))}
                          />
                        </FormGroup>
                      </Col>
                    </Row>

                    <Row className="g-2">
                      <Col sm={2}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1 small">{t("Bill No")}</Label>
                          <Input
                            type="text"
                            className="form-control form-control-sm"
                            style={{ height: "35px" }}
                            value={filters.billNo}
                            placeholder={t("Bill No")}
                            onChange={(e) => setFilters((prev) => ({ ...prev, billNo: e.target.value }))}
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
                            options={getOptions("type")}
                            value={getOptions("type").find((o) => o.value === filters.type) || null}
                            onChange={(sel) => setFilters((prev) => ({ ...prev, type: sel?.value || "" }))}
                            placeholder={t("Select Type")}
                            isLoading={loadingDropdowns}
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
                            onChange={(sel) => setFilters((prev) => ({ ...prev, subType: sel?.value || "" }))}
                            placeholder={t("Select SubType")}
                            isLoading={loadingDropdowns}
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
                            onChange={(sel) => setFilters((prev) => ({ ...prev, category: sel?.value || "" }))}
                            placeholder={t("Select Category")}
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
                            onChange={(sel) => setFilters((prev) => ({ ...prev, groupBy: sel?.value || "InvNo" }))}
                            placeholder={t("Group By")}
                          />
                        </FormGroup>
                      </Col>
                    </Row>
                  </Col>

                  <Col md={2}>
                    <FormGroup className="mb-0">
                      <Label className="fw-medium mb-1 small">{t("Enter Jew Stock ID")}</Label>
                      <Input
                        type="textarea"
                        rows={7}
                        value={filters.lotNo}
                        placeholder={t("Search by Jew Stock ID")}
                        onChange={(e) => setFilters((prev) => ({ ...prev, lotNo: e.target.value }))}
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
                  #dynamic-jew-purchase-report-table th {
                    white-space: nowrap;
                  }
                  #dynamic-jew-purchase-report-table .invoice-info td {
                    background: #f5f5f5;
                    font-weight: 600;
                  }
                  [data-bs-theme="dark"] #dynamic-jew-purchase-report-table th,
                  [data-bs-theme="dark"] #dynamic-jew-purchase-report-table td {
                    border-color: rgba(255, 255, 255, 0.15) !important;
                    color: var(--vz-body-color, #e9ecef);
                  }
                  [data-bs-theme="dark"] #dynamic-jew-purchase-report-table thead th {
                    background: #262a2f !important;
                    color: var(--vz-body-color, #e9ecef) !important;
                  }
                  [data-bs-theme="dark"] #dynamic-jew-purchase-report-table .invoice-info td {
                    background: #2c3238 !important;
                    color: var(--vz-body-color, #e9ecef) !important;
                  }
                  [data-bs-theme="dark"] #dynamic-jew-purchase-report-table .subtotal td,
                  [data-bs-theme="dark"] #dynamic-jew-purchase-report-table .grand-total td {
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
                      <div className="fs-5 fw-bold">JewPurchase Report</div>
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
                  <div className="table-responsive jew-purchase-grouped-table-wrap" style={{ maxHeight: "750px", overflow: "auto" }}>
                    <table className="table table-bordered align-middle mb-0" id="dynamic-jew-purchase-report-table" style={{ tableLayout: "fixed", minWidth: "920px" }}>
                      <colgroup>
                        <col style={{ width: "48px" }} />
                        <col style={{ width: "56px" }} />
                        <col style={{ width: "70px" }} />
                        <col style={{ width: "220px" }} />
                        <col style={{ width: "90px" }} />
                        <col style={{ width: "90px" }} />
                        <col style={{ width: "90px" }} />
                        <col style={{ width: "100px" }} />
                      </colgroup>
                      <thead>
                        <tr className="table-light text-center">
                          <th>{t("View")}</th>
                          <th>Sr No</th>
                          <th>Invno</th>
                          <th>Product</th>
                          <th className="text-end">Carats</th>
                          <th className="text-end">Return</th>
                          <th className="text-end">{t("Rate")}</th>
                          <th className="text-end">{t("Amount")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupedReportData.sections.map((section) => (
                          <React.Fragment key={section.groupKey}>
                            <tr className="invoice-info">
                              <td colSpan={8} className="text-start">
                                {filters.groupBy === "PartyName" ? (
                                  <>
                                    <strong>{t("Party")}:</strong> {dashText(section.groupKey)} &nbsp;|&nbsp;
                                    <strong>{t("Date")}:</strong>{" "}
                                    {dashText(formatReportDisplayDate(getRowDueDateRaw(section.first)))}
                                  </>
                                ) : (
                                  <>
                                    <strong>{t("Party")}:</strong> {dashText(getRowVal(section.first, "Party", "party"))} &nbsp;|&nbsp;
                                    <strong>{t("Inv No")}:</strong> {dashText(section.groupKey)} &nbsp;|&nbsp;
                                    <strong>{t("Date")}:</strong>{" "}
                                    {dashText(formatReportDisplayDate(getRowDueDateRaw(section.first)))}
                                  </>
                                )}
                              </td>
                            </tr>
                            {section.rows.map((row, rowIndex) => (
                              <tr key={`${section.groupKey}-${rowIndex}`}>
                                <td className="text-center">{renderGroupedViewLink(row)}</td>
                                <td className="text-center">{row._srNo ?? ""}</td>
                                <td className="text-center">{dashText(getGroupedInvNo(row))}</td>
                                <td className="text-center">{dashText(getGroupedProduct(row))}</td>
                                <td className="text-end">{renderGroupedValue(row, "Carats")}</td>
                                <td className="text-end">{renderGroupedValue(row, "Return")}</td>
                                <td className="text-end">{fmtFixed(getRowVal(row, "rate", "Rate"), 2)}</td>
                                <td className="text-end">{renderGroupedValue(row, "Amount")}</td>
                              </tr>
                            ))}
                            <tr className="subtotal">
                              <td />
                              <td colSpan={2} className="text-start ps-5">
                                <strong>{t("Total")}</strong>
                              </td>
                              <td />
                              <td className="text-end">
                                <strong>{fmtFixed(section.subtotal.Carats, GROUPED_DECIMALS.Carats)}</strong>
                              </td>
                              <td className="text-end">
                                <strong>{fmtFixed(section.subtotal.Return, GROUPED_DECIMALS.Return)}</strong>
                              </td>
                              <td className="text-end">
                                <strong>{fmtFixed(calcGroupedAvgRate(section.subtotal), 2)}</strong>
                              </td>
                              <td className="text-end">
                                <strong>{fmtFixed(section.subtotal.Amount, GROUPED_DECIMALS.Amount)}</strong>
                              </td>
                            </tr>
                          </React.Fragment>
                        ))}
                        <tr className="grand-total">
                          <td />
                          <td colSpan={2} className="text-start ps-5">
                            <strong>{t("Grand Total")}</strong>
                          </td>
                          <td />
                          <td className="text-end">
                            <strong>{fmtFixed(groupedReportData.grandTotal.Carats, GROUPED_DECIMALS.Carats)}</strong>
                          </td>
                          <td className="text-end">
                            <strong>{fmtFixed(groupedReportData.grandTotal.Return, GROUPED_DECIMALS.Return)}</strong>
                          </td>
                          <td className="text-end">
                            <strong>{fmtFixed(calcGroupedAvgRate(groupedReportData.grandTotal), 2)}</strong>
                          </td>
                          <td className="text-end">
                            <strong>{fmtFixed(groupedReportData.grandTotal.Amount, GROUPED_DECIMALS.Amount)}</strong>
                          </td>
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

export default JewelleryPurchaseReport;
