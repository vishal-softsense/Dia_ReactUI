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
import {
  exportToExcel,
  exportSolitairePurchaseReportExcel,
  exportPurchaseReportPrintExcel,
  exportSolitairePurchaseExportReportExcel
} from "../../../helpers/excel_helper";

import {
  getSolitairePurchaseDropdowns,
  getSolitairePurchaseReport
} from "../../../helpers/fakebackend_helper";
import {
  getCachedReportCompany,
  getReportCompanySettings,
  REPORT_COMPANY_SETTINGS_EVENT,
  resolveCompanyLogoUrl
} from "../../../helpers/reportCompanyDefaults";
import { useSettingReportDates } from "../../../Components/Hooks/useSettingReportDates";

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

const getTableTotals = (table) => {
  const rows = table.getFilteredRowModel().rows.map((r) => r.original);
  let parentCarat = 0;
  let parentAmt = 0;
  let parentMRPAmt = 0;
  let parentINR = 0;
  let parentUSD = 0;

  rows.forEach((r) => {
    if (r?.isParent) {
      parentCarat += Number(getRowVal(r, "Carats", "carats") || 0);
      parentAmt += Number(getRowVal(r, "Amount", "amount") || 0);
      parentMRPAmt += Number(getRowVal(r, "MRPAmt", "mrpAmt") || 0);
      parentINR += Number(getRowVal(r, "MasterCurrencyAmount", "masterCurrencyAmount") || 0);
      parentUSD += Number(getRowVal(r, "StockCurrencyAmount", "stockCurrencyAmount") || 0);
    }
  });

  return { parentCarat, parentAmt, parentMRPAmt, parentINR, parentUSD };
};

const getRowDueDateRaw = (row) => getRowVal(row, "ConDATE", "conDATE", "condate", "Date", "date");

const GROUPED_SUM_COLUMNS = ["Carats", "ReturnCarats", "Amount"];
const GROUPED_DECIMALS = {
  Carats: 3,
  ReturnCarats: 2,
  Amount: 2
};

const getGroupedNumeric = (row, key) => {
  const aliases = {
    Carats: ["Carats", "carats"],
    ReturnCarats: ["ReturnCarats", "returnCarats", "RtnCarats", "rtnCarats"],
    Amount: ["Amount", "amount"]
  };
  return Number(getRowVal(row, ...(aliases[key] || [key])) || 0);
};

const getGroupedInvNo = (row) => getRowVal(row, "Invno", "invno", "InvNo", "invNo");
const getGroupedLotNo = (row) => getRowVal(row, "Item", "item");

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

  // Match MVC purchase-report.js: client-side Sr No (not SP RowIndex).
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

/* MVC purchase-report.js printTable — A4 landscape, 2mm margins, View column omitted */
const GROUPED_PRINT_STYLES = `
    @page {
        size: A4 landscape;
        margin: 2mm 2mm 2mm 2mm;
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
        display: flex !important;
        flex-wrap: nowrap !important;
        justify-content: space-between !important;
        align-items: flex-start !important;
        max-width: 270mm !important;
        width: 100% !important;
        margin: 0 auto !important;
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
        line-height: 1.8;
    }
    #header .report-title {
        text-align: right;
        font-size: 20px;
        font-weight: 700;
        min-width: 180px;
        color: #000;
    }
    #report-date-range {
        font-size: 12px;
        color: #555;
        margin-top: 4px;
        text-align: right;
    }
    #cpny-footer {
        max-width: 270mm !important;
        width: 100% !important;
        margin: 20px auto 0 auto !important;
        font-size: 12px;
    }
    #dynamic-sol-purchase-report-table {
        border-collapse: collapse;
        table-layout: fixed;
        max-width: 270mm !important;
        width: 100% !important;
        min-width: auto !important;
        margin: 20px auto 0 auto;
    }
    #dynamic-sol-purchase-report-table th,
    #dynamic-sol-purchase-report-table td {
        padding: 2px !important;
        font-size: 10px;
        border: 1px solid black;
        word-break: break-word;
        white-space: normal;
        vertical-align: middle;
    }
    #dynamic-sol-purchase-report-table thead th {
        background: #f2f2f2;
        text-align: center;
        font-weight: 600;
        white-space: nowrap;
    }
    #dynamic-sol-purchase-report-table col:nth-child(1) { width: 10%; }
    #dynamic-sol-purchase-report-table col:nth-child(2) { width: 10%; }
    #dynamic-sol-purchase-report-table col:nth-child(3) { width: 22%; }
    #dynamic-sol-purchase-report-table col:nth-child(4) { width: 12%; }
    #dynamic-sol-purchase-report-table col:nth-child(5) { width: 12%; }
    #dynamic-sol-purchase-report-table col:nth-child(6) { width: 15%; }
    #dynamic-sol-purchase-report-table col:nth-child(7) { width: 15%; }
    #dynamic-sol-purchase-report-table th:nth-child(n+4),
    #dynamic-sol-purchase-report-table td.col-num {
        text-align: right !important;
    }
    #dynamic-sol-purchase-report-table tbody td.col-text {
        text-align: center;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    #dynamic-sol-purchase-report-table tbody td.col-num {
        white-space: nowrap;
        word-break: keep-all;
    }
    #dynamic-sol-purchase-report-table .memo-info td {
        background: #f5f5f5;
        font-weight: 600;
        text-align: left !important;
        padding: 6px 8px !important;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    #dynamic-sol-purchase-report-table .subtotal td,
    #dynamic-sol-purchase-report-table .grand-total td {
        font-weight: 700;
    }
    #dynamic-sol-purchase-report-table .subtotal td.col-label,
    #dynamic-sol-purchase-report-table .grand-total td.col-label {
        text-align: left !important;
        white-space: nowrap;
    }
    #dynamic-sol-purchase-report-table .subtotal td.col-num,
    #dynamic-sol-purchase-report-table .grand-total td.col-num {
        text-align: right !important;
        white-space: nowrap;
        word-break: keep-all;
    }
`;

const calcGroupedAvgRate = (subtotal) =>
  subtotal.Carats > 0 ? subtotal.Amount / subtotal.Carats : 0;

const SolitairePurchaseReport = () => {
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
    expParty: "",
    broker: "",
    saleRtn: false,
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
      input: (provided) => ({
        ...provided,
        margin: "0px",
        padding: "0px"
      }),
      indicatorSeparator: () => ({
        display: "none"
      }),
      indicatorsContainer: (provided) => ({
        ...provided,
        height: "33px"
      }),
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
      multiValue: (provided) => ({
        ...provided,
        backgroundColor: "var(--vz-light)",
        fontSize: "10px"
      })
    }),
    []
  );

  const getOptions = useCallback(
    (dropdownKey) => {
      const list = dropdownData?.[dropdownKey] || [];
      return list.map((item) => ({
        value:
          dropdownKey === "type" ||
            dropdownKey === "subType" ||
            dropdownKey === "category" ||
            dropdownKey === "account"
            ? item.name ?? item.Name ?? item.label ?? ""
            : item.id ?? item.ID ?? item.value ?? "",
        label: String(item.name ?? item.Name ?? item.label ?? "").toUpperCase()
      }));
    },
    [dropdownData]
  );

  useEffect(() => {
    const loadDropdowns = async () => {
      setLoadingDropdowns(true);
      try {
        const res = await getSolitairePurchaseDropdowns();
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

  const handleMultiChange = (name, selected) => {
    setFilters((prev) => ({
      ...prev,
      [name]: selected ? selected.map((x) => x.value) : []
    }));
  };

  const handleClear = async () => {
    const d = await getDates();
    setHasSearched(false);
    setViewType("table");
    setExpandedInvnos(new Set());
    setReportRows([]);
    setFilters(mergeDates({
      currency: "",
      invNo: "",
      billNo: "",
      type: "",
      subType: "",
      category: "",
      party: "",
      expParty: "",
      broker: "",
      saleRtn: false,
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
      groupBy: "InvNo"
    }, d));
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
    ExpParty: filters.expParty || null,
    Broker: filters.broker || null,
    SaleRtn: filters.saleRtn,
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
      const response = await getSolitairePurchaseReport(buildPayload());
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
                    <div class="report-title">${escapeHtml(t("Purchase Report"))}</div>
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

      // MVC memo-info group header (printTable clones this class)
      bodyRows += `<tr class="memo-info"><td colspan="7">${infoText}</td></tr>`;

      section.rows.forEach((row) => {
        bodyRows += `
                    <tr>
                        <td class="col-text">${escapeHtml(row._srNo ?? "")}</td>
                        <td class="col-text">${escapeHtml(getGroupedInvNo(row))}</td>
                        <td class="col-text">${escapeHtml(getGroupedLotNo(row))}</td>
                        <td class="col-num">${escapeHtml(fmtFixed(getGroupedNumeric(row, "Carats"), GROUPED_DECIMALS.Carats))}</td>
                        <td class="col-num">${escapeHtml(fmtFixed(getGroupedNumeric(row, "ReturnCarats"), GROUPED_DECIMALS.ReturnCarats))}</td>
                        <td class="col-num">${escapeHtml(fmtFixed(getRowVal(row, "Rate", "rate"), 2))}</td>
                        <td class="col-num">${escapeHtml(fmtFixed(getGroupedNumeric(row, "Amount"), GROUPED_DECIMALS.Amount))}</td>
                    </tr>
                `;
      });

      // MVC printTable (View column removed): colspan Sr No+InvNo, then Item + numeric cols
      bodyRows += `
                <tr class="subtotal">
                    <td colspan="2" class="col-label" style="padding-left:50px;"><strong>${escapeHtml(t("Total"))}</strong></td>
                    <td></td>
                    <td class="col-num"><strong>${escapeHtml(fmtFixed(section.subtotal.Carats, GROUPED_DECIMALS.Carats))}</strong></td>
                    <td class="col-num"><strong>${escapeHtml(fmtFixed(section.subtotal.ReturnCarats, GROUPED_DECIMALS.ReturnCarats))}</strong></td>
                    <td class="col-num"><strong>${escapeHtml(fmtFixed(calcGroupedAvgRate(section.subtotal), 2))}</strong></td>
                    <td class="col-num"><strong>${escapeHtml(fmtFixed(section.subtotal.Amount, GROUPED_DECIMALS.Amount))}</strong></td>
                </tr>
            `;
    });

    bodyRows += `
            <tr class="grand-total">
                <td colspan="2" class="col-label" style="padding-left:50px;"><strong>${escapeHtml(t("Grand Total"))}</strong></td>
                <td></td>
                <td class="col-num"><strong>${escapeHtml(fmtFixed(grandTotal.Carats, GROUPED_DECIMALS.Carats))}</strong></td>
                <td class="col-num"><strong>${escapeHtml(fmtFixed(grandTotal.ReturnCarats, GROUPED_DECIMALS.ReturnCarats))}</strong></td>
                <td class="col-num"><strong>${escapeHtml(fmtFixed(calcGroupedAvgRate(grandTotal), 2))}</strong></td>
                <td class="col-num"><strong>${escapeHtml(fmtFixed(grandTotal.Amount, GROUPED_DECIMALS.Amount))}</strong></td>
            </tr>
        `;

    const tableHtml = `
            <table id="dynamic-sol-purchase-report-table">
                <colgroup>
                    <col /><col /><col /><col /><col /><col /><col />
                </colgroup>
                <thead>
                    <tr>
                        <th>Sr No</th>
                        <th>InvNo</th>
                        <th>${escapeHtml(t("Item"))}</th>
                        <th>${escapeHtml(t("Carats"))}</th>
                        <th>${escapeHtml(t("Return"))}</th>
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

    printWindow.document.write(`<!DOCTYPE html><html><head><title>${escapeHtml(t("Purchase Report"))}</title>`);
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
    return dashText(getRowVal(row, "Rate", "rate"));
  };

  const groupedVisibleRows = useMemo(() => {
    const grouped = {};
    (reportRows || []).forEach((r) => {
      const invNoVal = getRowVal(r, "Invno", "invno", "InvNo", "invNo");
      const key = invNoVal !== undefined && invNoVal !== null && invNoVal !== "" ? String(invNoVal) : "UNKNOWN";
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(r);
    });

    const out = [];
    const invnos = Object.keys(grouped);
    invnos.sort();

    invnos.forEach((invnoKey) => {
      const rows = grouped[invnoKey] || [];
      const first = rows[0];

      const totalCarat = rows.reduce((s, r) => s + Number(getRowVal(r, "Carats", "carats") || 0), 0);
      const totalAmount = rows.reduce((s, r) => s + Number(getRowVal(r, "Amount", "amount") || 0), 0);
      const totalMRPAmt = rows.reduce((s, r) => s + Number(getRowVal(r, "MRPAmt", "mrpAmt") || 0), 0);
      const totalINR = rows.reduce((s, r) => s + Number(getRowVal(r, "MasterCurrencyAmount", "masterCurrencyAmount") || 0), 0);
      const totalUSD = rows.reduce((s, r) => s + Number(getRowVal(r, "StockCurrencyAmount", "stockCurrencyAmount") || 0), 0);

      const parentRow = {
        isParent: true,
        Code: "",
        ConDATE: getRowVal(first, "ConDATE", "conDATE", "conDate", "date"),
        Due: getRowVal(first, "Due", "due"),
        Invno: invnoKey,
        BillNo: getRowVal(first, "BillNo", "billNo", "billno"),
        Party: getRowVal(first, "Party", "party"),
        Commission: getRowVal(first, "Commission", "commAgent", "CommAgent"),
        Broker: getRowVal(first, "Broker", "broker"),
        Item: "Total",
        ItemName: "",
        MRP: null,
        Discount: null,
        ColCla: null,
        Carats: totalCarat,
        Rate: totalCarat > 0 ? totalAmount / totalCarat : 0,
        Less1: null,
        Less2: null,
        Less3: null,
        Amount: totalAmount,
        Symbol: null,
        DRate: null,
        Cert: null,
        CertificateNo: null,
        ShapeId: null,
        ColorId: null,
        ClarityId: null,
        PropId: null,
        PolishId: null,
        SymId: null,
        FLId: null,
        User: null,
        Purchaser: null,
        Expparty: null,
        ExportNo: null,
        SinglePcs: null,
        Invtype: null,
        MRPAmt: totalMRPAmt,
        MasterCurrencyRate: null,
        MasterCurrencyAmount: totalINR,
        StockCurrencyRate: null,
        StockCurrencyAmount: totalUSD,
        childRecords: rows
      };

      out.push(parentRow);
    });

    return out;
  }, [reportRows]);

  const renderSubRows = useCallback(
    (row) => {
      const parent = row.original;
      const invnoKey = String(parent.Invno ?? "");
      if (!expandedInvnos.has(invnoKey)) return null;

      const children = parent.childRecords || [];
      return children.map((child, index) => {
        const childRow = {
          ...child,
          isParent: false,
          invnoKey
        };

        return (
          <tr key={`child-${invnoKey}-${index}`} className="child-row">
            {row.getVisibleCells().map((cell) => {
              const column = cell.column;
              return (
                <td key={cell.id}>
                  {column.columnDef.cell
                    ? flexRender(column.columnDef.cell, {
                      ...cell.getContext(),
                      row: {
                        ...row,
                        original: childRow
                      }
                    })
                    : dashText(child[column.columnDef.accessorKey])}
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
          const invnoKey = String(r.Invno ?? "");
          const expanded = expandedInvnos.has(invnoKey);
          return (
            <i
              className={expanded ? "bx bx-chevron-down" : "bx bx-chevron-right"}
              style={{
                cursor: "pointer",
                color: "#2c7be5",
                fontSize: "18px",
                verticalAlign: "middle"
              }}
              onClick={() => {
                setExpandedInvnos((prev) => {
                  const next = new Set();
                  if (!prev.has(invnoKey)) {
                    next.add(invnoKey);
                  }
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
                  const url = `../purchase/edit-purchase?Id=${code}&Mode=view`;
                  const win = window.open(url, "_blank");
                  if (win) win.focus();
                }}
              >
                <i className="bx bx-show-alt"></i>
              </a>
            </div>
          );
        },
        footer: () => <span className="fw-bold text-center d-block">Total:</span>
      },
      {
        header: t("Date"),
        accessorKey: "ConDATE",
        cell: ({ row }) => dashText(getRowVal(row.original, "ConDATE", "conDATE", "condate", "Date", "date"))
      },
      {
        header: t("Due"),
        accessorKey: "Due",
        cell: ({ row }) => fmtFixed(getRowVal(row.original, "Due", "due"), 0)
      },
      { header: t("InvNo"), accessorKey: "Invno", cell: ({ row }) => dashText(getRowVal(row.original, "Invno", "invno", "InvNo", "invNo")) },
      { header: t("BillNo"), accessorKey: "BillNo", cell: ({ row }) => dashText(getRowVal(row.original, "BillNo", "billNo", "billno")) },
      { header: t("Party"), accessorKey: "Party", cell: ({ row }) => dashText(getRowVal(row.original, "Party", "party")) },
      { header: t("Comm.Agent"), accessorKey: "Commission", cell: ({ row }) => dashText(getRowVal(row.original, "Commission", "commission", "commAgent", "CommAgent")) },
      { header: t("Broker"), accessorKey: "Broker", cell: ({ row }) => dashText(getRowVal(row.original, "Broker", "broker")) },
      { header: t("Item"), accessorKey: "Item", cell: ({ row }) => dashText(getRowVal(row.original, "Item", "item")) },
      {
        header: t("ItemName"),
        accessorKey: "ItemName",
        cell: ({ row }) => dashText(getRowVal(row.original, "ItemName", "itemName")),
        footer: () => <span className="fw-bold text-center d-block">AVG</span>
      },
      {
        header: t("MRP"),
        accessorKey: "MRP",
        cell: ({ row }) => fmtFixed(getRowVal(row.original, "MRP", "mrp"), 2),
        footer: ({ table }) => {
          const { parentCarat, parentMRPAmt } = getTableTotals(table);
          return <span className="fw-bold text-end d-block">{fmtFixed(parentCarat > 0 ? parentMRPAmt / parentCarat : 0, 2)}</span>;
        }
      },
      {
        header: t("Disc"),
        accessorKey: "Discount",
        cell: ({ row }) => fmtFixed(getRowVal(row.original, "Discount", "discount"), 2),
        footer: ({ table }) => {
          const { parentAmt, parentMRPAmt } = getTableTotals(table);
          return <span className="fw-bold text-end d-block">{fmtFixed(parentMRPAmt > 0 ? ((parentAmt / parentMRPAmt) * 100) - 100 : 0, 2)}</span>;
        }
      },
      { header: t("Col/Cla"), accessorKey: "ColCla", cell: ({ row }) => dashText(getRowVal(row.original, "ColCla", "colCla", "colcla")) },
      {
        header: t("Carats"),
        accessorKey: "Carats",
        cell: ({ row }) => fmtFixed(getRowVal(row.original, "Carats", "carats"), 3),
        footer: ({ table }) => {
          const { parentCarat } = getTableTotals(table);
          return <span className="fw-bold text-end d-block">{fmtFixed(parentCarat, 3)}</span>;
        }
      },
      {
        header: t("Rate"),
        accessorKey: "Rate",
        cell: ({ row }) => fmtFixed(getRowVal(row.original, "Rate", "rate"), 2),
        footer: ({ table }) => {
          const { parentCarat, parentAmt } = getTableTotals(table);
          return <span className="fw-bold text-end d-block">{fmtFixed(parentCarat > 0 ? parentAmt / parentCarat : 0, 2)}</span>;
        }
      },
      { header: t("Less1"), accessorKey: "Less1", cell: ({ row }) => fmtFixed(getRowVal(row.original, "Less1", "less1"), 2) },
      { header: t("Less2"), accessorKey: "Less2", cell: ({ row }) => fmtFixed(getRowVal(row.original, "Less2", "less2"), 2) },
      { header: t("Less3"), accessorKey: "Less3", cell: ({ row }) => fmtFixed(getRowVal(row.original, "Less3", "less3"), 2) },
      {
        header: t("Amount"),
        accessorKey: "Amount",
        cell: ({ row }) => fmtFixed(getRowVal(row.original, "Amount", "amount"), 2),
        footer: ({ table }) => {
          const { parentAmt } = getTableTotals(table);
          return <span className="fw-bold text-end d-block">{fmtFixed(parentAmt, 2)}</span>;
        }
      },
      { header: t("Symbol"), accessorKey: "Symbol", cell: ({ row }) => dashText(getRowVal(row.original, "Symbol", "symbol")) },
      { header: t("$Rate"), accessorKey: "DRate", cell: ({ row }) => fmtFixed(getRowVal(row.original, "DRate", "dRate", "drate"), 2) },
      { header: t("Cert"), accessorKey: "Cert", cell: ({ row }) => dashText(getRowVal(row.original, "Cert", "cert")) },
      { header: t("Cert No"), accessorKey: "CertificateNo", cell: ({ row }) => dashText(getRowVal(row.original, "CertificateNo", "certificateNo")) },
      { header: t("Shape"), accessorKey: "ShapeId", cell: ({ row }) => dashText(getRowVal(row.original, "ShapeId", "shapeId")) },
      { header: t("Color"), accessorKey: "ColorId", cell: ({ row }) => dashText(getRowVal(row.original, "ColorId", "colorId")) },
      { header: t("Clarity"), accessorKey: "ClarityId", cell: ({ row }) => dashText(getRowVal(row.original, "ClarityId", "clarityId")) },
      { header: t("Prop"), accessorKey: "PropId", cell: ({ row }) => dashText(getRowVal(row.original, "PropId", "propId")) },
      { header: t("Polish"), accessorKey: "PolishId", cell: ({ row }) => dashText(getRowVal(row.original, "PolishId", "polishId")) },
      { header: t("Sym"), accessorKey: "SymId", cell: ({ row }) => dashText(getRowVal(row.original, "SymId", "symId")) },
      { header: t("FL"), accessorKey: "FLId", cell: ({ row }) => dashText(getRowVal(row.original, "FLId", "flId")) },
      { header: t("User"), accessorKey: "User", cell: ({ row }) => dashText(getRowVal(row.original, "User", "user")) },
      { header: t("Purchaser"), accessorKey: "Purchaser", cell: ({ row }) => dashText(getRowVal(row.original, "Purchaser", "purchaser")) },
      { header: t("ExpParty"), accessorKey: "Expparty", cell: ({ row }) => dashText(getRowVal(row.original, "Expparty", "expparty", "ExpParty", "expParty")) },
      { header: t("ExpNo"), accessorKey: "ExportNo", cell: ({ row }) => dashText(getRowVal(row.original, "ExportNo", "exportNo")) },
      { header: t("SinglePcs"), accessorKey: "SinglePcs", cell: ({ row }) => dashText(getRowVal(row.original, "SinglePcs", "singlePcs")) },
      { header: t("InvType"), accessorKey: "Invtype", cell: ({ row }) => dashText(getRowVal(row.original, "Invtype", "invtype", "InvType", "invType")) },
      {
        header: t("MRP Amt"),
        accessorKey: "MRPAmt",
        cell: ({ row }) => fmtFixed(getRowVal(row.original, "MRPAmt", "mrpAmt"), 2),
        footer: ({ table }) => {
          const { parentMRPAmt } = getTableTotals(table);
          return <span className="fw-bold text-end d-block">{fmtFixed(parentMRPAmt, 2)}</span>;
        }
      },
      { header: t("INR Rate"), accessorKey: "MasterCurrencyRate", cell: ({ row }) => fmtFixed(getRowVal(row.original, "MasterCurrencyRate", "masterCurrencyRate"), 2) },
      {
        header: t("INR Amount"),
        accessorKey: "MasterCurrencyAmount",
        cell: ({ row }) => fmtFixed(getRowVal(row.original, "MasterCurrencyAmount", "masterCurrencyAmount"), 2),
        footer: ({ table }) => {
          const { parentINR } = getTableTotals(table);
          return <span className="fw-bold text-end d-block">{fmtFixed(parentINR, 2)}</span>;
        }
      },
      { header: t("USD Rate"), accessorKey: "StockCurrencyRate", cell: ({ row }) => fmtFixed(getRowVal(row.original, "StockCurrencyRate", "stockCurrencyRate"), 2) },
      {
        header: t("USD Amount"),
        accessorKey: "StockCurrencyAmount",
        cell: ({ row }) => fmtFixed(getRowVal(row.original, "StockCurrencyAmount", "stockCurrencyAmount"), 2),
        footer: ({ table }) => {
          const { parentUSD } = getTableTotals(table);
          return <span className="fw-bold text-end d-block">{fmtFixed(parentUSD, 2)}</span>;
        }
      }
    ],
    [expandedInvnos, t]
  );

  // MVC PurchasePrint: DP = Direct Print (table Excel), PR = PurchaseReport Print, SPR = Solitaire Purchase Report Print
  const handleDirectPrintExcel = async () => {
    if (!reportRows || reportRows.length === 0) {
      toast.warning(t("No data available to export."));
      return;
    }

    const headers = [
      "Date",
      "Due",
      "InvNo",
      "BillNo",
      "Party",
      "Comm.Agent",
      "Broker",
      "Item",
      "ItemName",
      "MRP",
      "Disc",
      "Col/Cla",
      "Carats",
      "Rate",
      "Less1",
      "Less2",
      "Less3",
      "Amount",
      "Symbol",
      "$Rate",
      "Cert",
      "Cert No",
      "Shape",
      "Color",
      "Clarity",
      "Prop",
      "Polish",
      "Sym",
      "FL",
      "User",
      "Purchaser",
      "ExpParty",
      "ExpNo",
      "SinglePcs",
      "InvType",
      "MRP Amt",
      "INR Rate",
      "INR Amount",
      "USD Rate",
      "USD Amount"
    ];

    const rows = reportRows.map((row) => [
      dashText(getRowVal(row, "ConDATE", "conDATE", "condate", "Date", "date")),
      fmtFixed(getRowVal(row, "Due", "due"), 0),
      dashText(getRowVal(row, "Invno", "invno", "InvNo", "invNo")),
      dashText(getRowVal(row, "BillNo", "billNo", "billno")),
      dashText(getRowVal(row, "Party", "party")),
      dashText(getRowVal(row, "Commission", "commission", "commAgent", "CommAgent")),
      dashText(getRowVal(row, "Broker", "broker")),
      dashText(getRowVal(row, "Item", "item")),
      dashText(getRowVal(row, "ItemName", "itemName")),
      fmtFixed(getRowVal(row, "MRP", "mrp"), 2),
      fmtFixed(getRowVal(row, "Discount", "discount"), 2),
      dashText(getRowVal(row, "ColCla", "colCla", "colcla")),
      fmtFixed(getRowVal(row, "Carats", "carats"), 3),
      fmtFixed(getRowVal(row, "Rate", "rate"), 2),
      fmtFixed(getRowVal(row, "Less1", "less1"), 2),
      fmtFixed(getRowVal(row, "Less2", "less2"), 2),
      fmtFixed(getRowVal(row, "Less3", "less3"), 2),
      fmtFixed(getRowVal(row, "Amount", "amount"), 2),
      dashText(getRowVal(row, "Symbol", "symbol")),
      fmtFixed(getRowVal(row, "DRate", "dRate", "drate"), 2),
      dashText(getRowVal(row, "Cert", "cert")),
      dashText(getRowVal(row, "CertificateNo", "certificateNo")),
      dashText(getRowVal(row, "ShapeId", "shapeId")),
      dashText(getRowVal(row, "ColorId", "colorId")),
      dashText(getRowVal(row, "ClarityId", "clarityId")),
      dashText(getRowVal(row, "PropId", "propId")),
      dashText(getRowVal(row, "PolishId", "polishId")),
      dashText(getRowVal(row, "SymId", "symId")),
      dashText(getRowVal(row, "FLId", "flId")),
      dashText(getRowVal(row, "User", "user")),
      dashText(getRowVal(row, "Purchaser", "purchaser")),
      dashText(getRowVal(row, "Expparty", "expparty", "ExpParty", "expParty")),
      dashText(getRowVal(row, "ExportNo", "exportNo")),
      dashText(getRowVal(row, "SinglePcs", "singlePcs")),
      dashText(getRowVal(row, "Invtype", "invtype", "InvType", "invType")),
      fmtFixed(getRowVal(row, "MRPAmt", "mrpAmt"), 2),
      fmtFixed(getRowVal(row, "MasterCurrencyRate", "masterCurrencyRate"), 2),
      fmtFixed(getRowVal(row, "MasterCurrencyAmount", "masterCurrencyAmount"), 2),
      fmtFixed(getRowVal(row, "StockCurrencyRate", "stockCurrencyRate"), 2),
      fmtFixed(getRowVal(row, "StockCurrencyAmount", "stockCurrencyAmount"), 2)
    ]);

    const res = await exportToExcel(headers, rows, "PurchaseReport", "PurchaseReport");
    if (!res?.success) toast.error(t("Excel export failed."));
  };

  const handlePurchaseReportPrintExcel = async () => {
    if (!reportRows || reportRows.length === 0) {
      toast.warning(t("No data available to export."));
      return;
    }
    const res = await exportPurchaseReportPrintExcel(reportRows, "PurchaseReportList");
    if (!res?.success) toast.error(t("Excel export failed."));
  };

  const handleSolitairePurchaseReportPrint = async () => {
    if (!reportRows || reportRows.length === 0) {
      toast.warning(t("No data available to export."));
      return;
    }
    const res = await exportSolitairePurchaseReportExcel(reportRows, "SolitairePurchaseReport");
    if (!res?.success) toast.error(t("Excel export failed."));
  };

  const handleExportReportExcel = async () => {
    if (!reportRows || reportRows.length === 0) {
      toast.warning(t("No data available to export."));
      return;
    }
    const res = await exportSolitairePurchaseExportReportExcel(reportRows, "ExportReport");
    if (!res?.success) toast.error(t("Excel export failed."));
  };

  document.title = `${t("Purchase Report")} | ${t("Reports")}`;

  return (
    <React.Fragment>
      <ToastContainer />

      <div className="page-content">
        <Container fluid>
          <BreadCrumb title={t("Purchase Report")} pageTitle={t("Reports")} />

          <div className="card stock-search-header-bar d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between mb-3 p-3 rounded-3 shadow-sm border gap-2">
            <h5 className="mb-0 fw-bold text-primary d-flex align-items-center gap-2">
              <i className={hasSearched ? "ri-database-2-line fs-20 text-primary" : "ri-search-eye-line fs-20 text-primary"}></i>
              {hasSearched ? t("Purchase Report Results") : t("Purchase Report Filters")}
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
                    <UncontrolledDropdown>
                      <DropdownToggle color="success" className="btn-sm rounded-2 px-3 py-1" caret disabled={reportRows.length === 0}>
                        {t("Excel")} / {t("Print")}
                      </DropdownToggle>
                      <DropdownMenu>
                        <DropdownItem onClick={handleDirectPrintExcel}>
                          {t("Direct Print")}
                        </DropdownItem>
                        <DropdownItem onClick={handlePurchaseReportPrintExcel}>
                          {t("PurchaseReport Print")}
                        </DropdownItem>
                        <DropdownItem onClick={handleSolitairePurchaseReportPrint}>
                          {t("Solitaire Purchase Report Print")}
                        </DropdownItem>
                        <DropdownItem onClick={handleExportReportExcel}>
                          {t("Solitaire Purchase Export Report Print")}
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
                          <Label className="fw-medium mb-1 small">{t("Invoice No")}</Label>
                          <Input
                            type="text"
                            className="form-control form-control-sm"
                            style={{ height: "35px" }}
                            value={filters.invNo}
                            placeholder={t("Invoice No")}
                            onChange={(e) => setFilters((prev) => ({ ...prev, invNo: e.target.value }))}
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
                          />
                        </FormGroup>
                      </Col>
                    </Row>

                    <Row className="g-2">
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
                            placeholder={t("Select Sub Type")}
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
                            options={getOptions("account")}
                            value={getOptions("account").find((o) => o.value === filters.party) || null}
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
                            options={getOptions("account")}
                            value={getOptions("account").find((o) => o.value === filters.broker) || null}
                            onChange={(sel) => setFilters((prev) => ({ ...prev, broker: sel?.value || "" }))}
                            placeholder={t("Search Broker")}
                            isLoading={loadingDropdowns}
                          />
                        </FormGroup>
                      </Col>

                      <Col sm={2}>
                        <FormGroup className="mb-0">
                          <Label className="w-100 mb-1"></Label>
                          <div className="d-flex align-items-center gap-2" style={{ height: "35px" }}>
                            <input
                              type="checkbox"
                              id="saleRtnCheckbox"
                              checked={filters.saleRtn}
                              onChange={(e) => setFilters((prev) => ({ ...prev, saleRtn: e.target.checked }))}
                            />
                            <Label htmlFor="saleRtnCheckbox" className="fw-medium mb-0 small">{t("Sale Rtn")}</Label>
                          </div>
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
                  <Col sm={2}>
                    <FormGroup className="mb-0">
                      <Label className="fw-medium mb-1 small">{t("Shape")}</Label>
                      <Select
                        isMulti
                        classNamePrefix="react-select"
                        styles={customStyles}
                        options={getOptions("shape")}
                        value={getOptions("shape").filter((o) => filters.shape.includes(o.value))}
                        onChange={(sel) => handleMultiChange("shape", sel)}
                        isLoading={loadingDropdowns}
                        placeholder={t("Shape")}
                      />
                    </FormGroup>
                  </Col>

                  <Col sm={2}>
                    <FormGroup className="mb-0">
                      <Label className="fw-medium mb-1 small">{t("Color")}</Label>
                      <Select
                        isMulti
                        classNamePrefix="react-select"
                        styles={customStyles}
                        options={getOptions("color")}
                        value={getOptions("color").filter((o) => filters.color.includes(o.value))}
                        onChange={(sel) => handleMultiChange("color", sel)}
                        isLoading={loadingDropdowns}
                        placeholder={t("Color")}
                      />
                    </FormGroup>
                  </Col>

                  <Col sm={2}>
                    <FormGroup className="mb-0">
                      <Label className="fw-medium mb-1 small">{t("Clarity")}</Label>
                      <Select
                        isMulti
                        classNamePrefix="react-select"
                        styles={customStyles}
                        options={getOptions("clarity")}
                        value={getOptions("clarity").filter((o) => filters.clarity.includes(o.value))}
                        onChange={(sel) => handleMultiChange("clarity", sel)}
                        isLoading={loadingDropdowns}
                        placeholder={t("Clarity")}
                      />
                    </FormGroup>
                  </Col>

                  <Col sm={2}>
                    <FormGroup className="mb-0">
                      <Label className="fw-medium mb-1 small">{t("Size")}</Label>
                      <Select
                        isMulti
                        classNamePrefix="react-select"
                        styles={customStyles}
                        options={getOptions("size")}
                        value={getOptions("size").filter((o) => filters.size.includes(o.value))}
                        onChange={(sel) => handleMultiChange("size", sel)}
                        isLoading={loadingDropdowns}
                        placeholder={t("Size")}
                      />
                    </FormGroup>
                  </Col>

                  <Col sm={2}>
                    <FormGroup className="mb-0">
                      <Label className="fw-medium mb-1 small">{t("Proportion")}</Label>
                      <Select
                        isMulti
                        classNamePrefix="react-select"
                        styles={customStyles}
                        options={getOptions("proportion")}
                        value={getOptions("proportion").filter((o) => filters.proportion.includes(o.value))}
                        onChange={(sel) => handleMultiChange("proportion", sel)}
                        isLoading={loadingDropdowns}
                        placeholder={t("Proportion")}
                      />
                    </FormGroup>
                  </Col>

                  <Col sm={2}>
                    <FormGroup className="mb-0">
                      <Label className="fw-medium mb-1 small">{t("Polish")}</Label>
                      <Select
                        isMulti
                        classNamePrefix="react-select"
                        styles={customStyles}
                        options={getOptions("polish")}
                        value={getOptions("polish").filter((o) => filters.polish.includes(o.value))}
                        onChange={(sel) => handleMultiChange("polish", sel)}
                        isLoading={loadingDropdowns}
                        placeholder={t("Polish")}
                      />
                    </FormGroup>
                  </Col>
                </Row>

                <Row className="g-2 mb-2">
                  <Col sm={2}>
                    <FormGroup className="mb-0">
                      <Label className="fw-medium mb-1 small">{t("Symmetry")}</Label>
                      <Select
                        isMulti
                        classNamePrefix="react-select"
                        styles={customStyles}
                        options={getOptions("symmetry")}
                        value={getOptions("symmetry").filter((o) => filters.symmetry.includes(o.value))}
                        onChange={(sel) => handleMultiChange("symmetry", sel)}
                        isLoading={loadingDropdowns}
                        placeholder={t("Symmetry")}
                      />
                    </FormGroup>
                  </Col>

                  <Col sm={2}>
                    <FormGroup className="mb-0">
                      <Label className="fw-medium mb-1 small">{t("LAB")}</Label>
                      <Select
                        isMulti
                        classNamePrefix="react-select"
                        styles={customStyles}
                        options={getOptions("lab")}
                        value={getOptions("lab").filter((o) => filters.lab.includes(o.value))}
                        onChange={(sel) => handleMultiChange("lab", sel)}
                        isLoading={loadingDropdowns}
                        placeholder={t("LAB")}
                      />
                    </FormGroup>
                  </Col>

                  <Col sm={2}>
                    <FormGroup className="mb-0">
                      <Label className="fw-medium mb-1 small">{t("Fluorescence")}</Label>
                      <Select
                        isMulti
                        classNamePrefix="react-select"
                        styles={customStyles}
                        options={getOptions("fluorescence")}
                        value={getOptions("fluorescence").filter((o) => filters.fluorescence.includes(o.value))}
                        onChange={(sel) => handleMultiChange("fluorescence", sel)}
                        isLoading={loadingDropdowns}
                        placeholder={t("Fluorescence")}
                      />
                    </FormGroup>
                  </Col>

                  <Col sm={2}>
                    <FormGroup className="mb-0">
                      <Label className="fw-medium mb-1 small">{t("Milky")}</Label>
                      <Select
                        isMulti
                        classNamePrefix="react-select"
                        styles={customStyles}
                        options={getOptions("milky")}
                        value={getOptions("milky").filter((o) => filters.milky.includes(o.value))}
                        onChange={(sel) => handleMultiChange("milky", sel)}
                        isLoading={loadingDropdowns}
                        placeholder={t("Milky")}
                      />
                    </FormGroup>
                  </Col>

                  <Col sm={2}>
                    <FormGroup className="mb-0">
                      <Label className="fw-medium mb-1 small">{t("Luster")}</Label>
                      <Select
                        isMulti
                        classNamePrefix="react-select"
                        styles={customStyles}
                        options={getOptions("luster")}
                        value={getOptions("luster").filter((o) => filters.luster.includes(o.value))}
                        onChange={(sel) => handleMultiChange("luster", sel)}
                        isLoading={loadingDropdowns}
                        placeholder={t("Luster")}
                      />
                    </FormGroup>
                  </Col>

                  <Col sm={2}>
                    <FormGroup className="mb-0">
                      <Label className="fw-medium mb-1 small">{t("Natts")}</Label>
                      <Select
                        isMulti
                        classNamePrefix="react-select"
                        styles={customStyles}
                        options={getOptions("natts")}
                        value={getOptions("natts").filter((o) => filters.natts.includes(o.value))}
                        onChange={(sel) => handleMultiChange("natts", sel)}
                        isLoading={loadingDropdowns}
                        placeholder={t("Natts")}
                      />
                    </FormGroup>
                  </Col>
                </Row>

                <Row className="g-2">
                  <Col sm={2}>
                    <FormGroup className="mb-0">
                      <Label className="fw-medium mb-1 small">{t("Mines")}</Label>
                      <Select
                        isMulti
                        classNamePrefix="react-select"
                        styles={customStyles}
                        options={getOptions("mines")}
                        value={getOptions("mines").filter((o) => filters.mines.includes(o.value))}
                        onChange={(sel) => handleMultiChange("mines", sel)}
                        isLoading={loadingDropdowns}
                        placeholder={t("Mines")}
                      />
                    </FormGroup>
                  </Col>

                  <Col sm={2}>
                    <FormGroup className="mb-0">
                      <Label className="fw-medium mb-1 small">{t("Product Type")}</Label>
                      <Select
                        isMulti
                        classNamePrefix="react-select"
                        styles={customStyles}
                        options={getOptions("productType")}
                        value={getOptions("productType").filter((o) => filters.productType.includes(o.value))}
                        onChange={(sel) => handleMultiChange("productType", sel)}
                        isLoading={loadingDropdowns}
                        placeholder={t("Product Type")}
                      />
                    </FormGroup>
                  </Col>

                  <Col sm={2}>
                    <FormGroup className="mb-0">
                      <Label className="fw-medium mb-1 small">{t("Sieve")}</Label>
                      <Select
                        isMulti
                        classNamePrefix="react-select"
                        styles={customStyles}
                        options={getOptions("sieve")}
                        value={getOptions("sieve").filter((o) => filters.sieve.includes(o.value))}
                        onChange={(sel) => handleMultiChange("sieve", sel)}
                        isLoading={loadingDropdowns}
                        placeholder={t("Sieve")}
                      />
                    </FormGroup>
                  </Col>

                  <Col sm={2}>
                    <FormGroup className="mb-0">
                      <Label className="fw-medium mb-1 small">{t("Exp Party")}</Label>
                      <Select
                        classNamePrefix="react-select"
                        styles={customStyles}
                        isClearable
                        options={getOptions("account")}
                        value={getOptions("account").find((o) => o.value === filters.expParty) || null}
                        onChange={(sel) => setFilters((prev) => ({ ...prev, expParty: sel?.value || "" }))}
                        placeholder={t("Search Exp Party")}
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
              </CardBody>
            </Card>
          )}

          {hasSearched && viewType === "table" && (
            <Card className="shadow-lg border-0 rounded-3 mb-4">
              <CardBody>
                <div className="d-flex justify-content-end gap-4 mb-3 small fw-semibold">
                  <span>
                    {t("Showing")}: {groupedVisibleRows.length} {t("rows")}
                  </span>
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
                  #dynamic-sol-purchase-report-table th {
                    white-space: nowrap;
                  }
                  #dynamic-sol-purchase-report-table .invoice-info td {
                    background: #f5f5f5;
                    font-weight: 600;
                  }
                  [data-bs-theme="dark"] #dynamic-sol-purchase-report-table th,
                  [data-bs-theme="dark"] #dynamic-sol-purchase-report-table td {
                    border-color: rgba(255, 255, 255, 0.15) !important;
                    color: var(--vz-body-color, #e9ecef);
                  }
                  [data-bs-theme="dark"] #dynamic-sol-purchase-report-table thead th {
                    background: #262a2f !important;
                    color: var(--vz-body-color, #e9ecef) !important;
                  }
                  [data-bs-theme="dark"] #dynamic-sol-purchase-report-table .invoice-info td {
                    background: #2c3238 !important;
                    color: var(--vz-body-color, #e9ecef) !important;
                  }
                  [data-bs-theme="dark"] #dynamic-sol-purchase-report-table .subtotal td,
                  [data-bs-theme="dark"] #dynamic-sol-purchase-report-table .grand-total td {
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
                      <div className="fs-5 fw-bold">{t("Purchase Report")}</div>
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
                  <div className="table-responsive sol-purchase-grouped-table-wrap" style={{ maxHeight: "750px", overflow: "auto" }}>
                    <table className="table table-bordered align-middle mb-0" id="dynamic-sol-purchase-report-table" style={{ tableLayout: "fixed", minWidth: "910px" }}>
                      <colgroup>
                        <col style={{ width: "48px" }} />
                        <col style={{ width: "56px" }} />
                        <col style={{ width: "70px" }} />
                        <col style={{ width: "110px" }} />
                        <col style={{ width: "100px" }} />
                        <col style={{ width: "90px" }} />
                        <col style={{ width: "90px" }} />
                        <col style={{ width: "100px" }} />
                      </colgroup>
                      <thead>
                        <tr className="table-light text-center">
                          <th>{t("View")}</th>
                          <th>Sr No</th>
                          <th>InvNo</th>
                          <th>{t("LotNo")}</th>
                          <th className="text-end">{t("Carats")}</th>
                          <th className="text-end">{t("Return")}</th>
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
                            {section.rows.map((row, rowIndex) => {
                              const code = getRowVal(row, "Code", "code");
                              return (
                                <tr key={`${section.groupKey}-${rowIndex}`}>
                                  <td className="text-center">
                                    {code ? (
                                      <div className="report-action">
                                        <a
                                          href={`../purchase/edit-purchase?Id=${code}&Mode=view`}
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
                                  <td className="text-center">{dashText(getGroupedInvNo(row))}</td>
                                  <td className="text-center">{dashText(getGroupedLotNo(row))}</td>
                                  <td className="text-end">{renderGroupedValue(row, "Carats")}</td>
                                  <td className="text-end">{renderGroupedValue(row, "ReturnCarats")}</td>
                                  <td className="text-end">{fmtFixed(getRowVal(row, "Rate", "rate"), 2)}</td>
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
                              <td className="text-end">
                                <strong>{fmtFixed(section.subtotal.Carats, GROUPED_DECIMALS.Carats)}</strong>
                              </td>
                              <td className="text-end">
                                <strong>{fmtFixed(section.subtotal.ReturnCarats, GROUPED_DECIMALS.ReturnCarats)}</strong>
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
                            <strong>{fmtFixed(groupedReportData.grandTotal.ReturnCarats, GROUPED_DECIMALS.ReturnCarats)}</strong>
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

export default SolitairePurchaseReport;

