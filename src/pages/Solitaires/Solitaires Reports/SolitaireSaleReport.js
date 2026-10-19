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
  getSolitaireSaleDropdowns,
  getSolitaireSaleReport
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

  // Sale No = BillNo from report API (SolitaireSaleReportDto.BillNo).
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
    #dynamic-solitaire-sale-report-table {
        border-collapse: collapse;
        table-layout: fixed;
        width: 100%;
        max-width: 270mm;
        margin: 16px auto 0 auto;
    }
    #dynamic-solitaire-sale-report-table th,
    #dynamic-solitaire-sale-report-table td {
        padding: 2px;
        font-size: 10px;
        border: 1px solid #000;
        vertical-align: middle;
        word-break: break-word;
        white-space: normal;
    }
    #dynamic-solitaire-sale-report-table thead th {
        background: #f2f2f2;
        text-align: center;
        font-weight: 600;
        white-space: nowrap;
    }
    /* Print widths: Sale No → Amount */
    #dynamic-solitaire-sale-report-table col:nth-child(1) { width: 10%; }
    #dynamic-solitaire-sale-report-table col:nth-child(2) { width: 10%; }
    #dynamic-solitaire-sale-report-table col:nth-child(3) { width: 22%; }
    #dynamic-solitaire-sale-report-table col:nth-child(4) { width: 12%; }
    #dynamic-solitaire-sale-report-table col:nth-child(5) { width: 12%; }
    #dynamic-solitaire-sale-report-table col:nth-child(6) { width: 15%; }
    #dynamic-solitaire-sale-report-table col:nth-child(7) { width: 15%; }
    #dynamic-solitaire-sale-report-table th:nth-child(n+4),
    #dynamic-solitaire-sale-report-table td.col-num {
        text-align: right !important;
    }
    #dynamic-solitaire-sale-report-table tbody td.col-text {
        text-align: center;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    #dynamic-solitaire-sale-report-table tbody td.col-num {
        white-space: nowrap;
        word-break: keep-all;
    }
    #dynamic-solitaire-sale-report-table .invoice-info td {
        background: #f5f5f5;
        font-weight: 600;
        text-align: left !important;
        padding: 6px 8px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    #dynamic-solitaire-sale-report-table .subtotal td,
    #dynamic-solitaire-sale-report-table .grand-total td {
        font-weight: 700;
    }
    #dynamic-solitaire-sale-report-table .subtotal td.col-label,
    #dynamic-solitaire-sale-report-table .grand-total td.col-label {
        text-align: left !important;
        white-space: nowrap;
    }
    #dynamic-solitaire-sale-report-table .subtotal td.col-num,
    #dynamic-solitaire-sale-report-table .grand-total td.col-num {
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

const calcGroupedAvgRate = (subtotal) =>
  subtotal.Carats > 0 ? subtotal.Amount / subtotal.Carats : 0;

const getTableTotals = (table) => {
  const rows = table.getFilteredRowModel().rows.map((r) => r.original);
  let parentCarat = 0;
  let parentAmt = 0;
  let parentPurAmt = 0;
  let parentMRPAmt = 0;
  let parentINR = 0;
  let parentUSD = 0;

  rows.forEach((r) => {
    if (r?.isParent) {
      parentCarat += Number(getRowVal(r, "Carats", "carats") || 0);
      parentAmt += Number(getRowVal(r, "Amount", "amount") || 0);
      parentPurAmt += Number(getRowVal(r, "PurchaseAmount", "purchaseAmount") || 0);
      parentMRPAmt += Number(getRowVal(r, "MRPAmt", "mrpAmt") || 0);
      parentINR += Number(getRowVal(r, "MasterCurrencyAmount", "masterCurrencyAmount") || 0);
      parentUSD += Number(getRowVal(r, "StockCurrencyAmount", "stockCurrencyAmount") || 0);
    }
  });

  return { parentCarat, parentAmt, parentPurAmt, parentMRPAmt, parentINR, parentUSD };
};

const getAgGrandTotalsFromRows = (rows) => {
  let caratTotal = 0;
  let amtTotal = 0;
  let puramttotal = 0;
  let mrpamtTotal = 0;
  let INRamt = 0;
  let USDamt = 0;

  (rows || []).forEach((row) => {
    caratTotal += Number(getRowVal(row, "Carats", "carats") || 0);
    amtTotal += Number(getRowVal(row, "Amount", "amount") || 0);
    puramttotal += Number(getRowVal(row, "PurchaseAmount", "purchaseAmount") || 0);
    mrpamtTotal += Number(getRowVal(row, "MRPAmt", "mrpAmt") || 0);
    INRamt += Number(getRowVal(row, "MasterCurrencyAmount", "masterCurrencyAmount") || 0);
    USDamt += Number(getRowVal(row, "StockCurrencyAmount", "stockCurrencyAmount") || 0);
  });

  const totalmrp = caratTotal > 0 ? mrpamtTotal / caratTotal : 0;
  const disc = mrpamtTotal > 0 ? (amtTotal / mrpamtTotal) * 100 - 100 : 0;
  const rate = caratTotal > 0 ? amtTotal / caratTotal : 0;

  return { caratTotal, amtTotal, puramttotal, mrpamtTotal, INRamt, USDamt, totalmrp, disc, rate };
};

const SolitaireSaleReport = () => {
  const { t } = useTranslation();

  const { fromDate, toDate, getDates, mergeDates } = useSettingReportDates({
    includePrintDates: true
  });

  const [loadingDropdowns, setLoadingDropdowns] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [reportMode, setReportMode] = useState("standard");

  const [dropdownData, setDropdownData] = useState({});
  const [companyInfo, setCompanyInfo] = useState(() => getCachedReportCompany());
  const [expandedGroups, setExpandedGroups] = useState(() => new Set());
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
    purRtn: false,
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
        const res = await getSolitaireSaleDropdowns();
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
    setFilters((prev) => ({
      ...prev,
      [name]: selected ? selected.map((x) => x.value) : []
    }));
  };

  const defaultFilters = useCallback(
    (fromDate, toDate) => ({
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
      purRtn: false,
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
      groupBy: "InvNo"
    }),
    []
  );

  const handleClear = async () => {
    const d = await getDates();
    setHasSearched(false);
    setReportMode("standard");
    setExpandedGroups(new Set());
    setReportRows([]);
    setFilters(mergeDates(defaultFilters(d.fromDate, d.toDate), d));
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
    PurRtn: filters.purRtn,
    FromRChkBox: filters.fromRChkBox,
    RDate: filters.rDate || null,
    RToDate: filters.rToDate || null,
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

  const handleReport = async (mode) => {
    setLoading(true);
    try {
      const response = await getSolitaireSaleReport(buildPayload());
      const ok = response?.success || response?.Success;

      if (ok) {
        const data = response.Data || response.data || [];
        setReportRows(data);
        setReportMode(mode);
        setHasSearched(true);
        setExpandedGroups(new Set());
        toast.success(t("Report loaded successfully."));
      } else {
        toast.warning(response?.Data || response?.data || response?.Message || t("Failed to load report."));
      }
    } catch (err) {
      console.error("Sale report request failed:", err);
      const msg =
        typeof err === "string"
          ? err
          : err?.response?.data?.message || err?.response?.data?.Message || null;
      toast.error(msg || t("Server Connection Problem.."));
    } finally {
      setLoading(false);
    }
  };

  const handleGroupedReport = () => handleReport("grouped");

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
                    <div class="report-title">${escapeHtml(t("Sale Report"))}</div>
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
                        <td class="col-text">${escapeHtml(getRowVal(row, "BillNo", "billNo", "billno") || "")}</td>
                        <td class="col-text">${escapeHtml(getGroupedInvNo(row))}</td>
                        <td class="col-text">${escapeHtml(getGroupedLotNo(row))}</td>
                        <td class="col-num">${escapeHtml(fmtFixed(getGroupedNumeric(row, "Carats"), GROUPED_DECIMALS.Carats))}</td>
                        <td class="col-num">${escapeHtml(fmtFixed(getGroupedNumeric(row, "ReturnCarats"), GROUPED_DECIMALS.ReturnCarats))}</td>
                        <td class="col-num">${escapeHtml(fmtFixed(getRowVal(row, "Rate", "rate"), 2))}</td>
                        <td class="col-num">${escapeHtml(fmtFixed(getGroupedNumeric(row, "Amount"), GROUPED_DECIMALS.Amount))}</td>
                    </tr>
                `;
      });

      // Print: colspan covers Sale No + InvNo, then LotNo + numeric cols
      bodyRows += `
                <tr class="subtotal">
                    <td colspan="2" class="col-label" style="padding-left:24px;"><strong>${escapeHtml(t("Total"))}</strong></td>
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
                <td colspan="2" class="col-label" style="padding-left:24px;"><strong>${escapeHtml(t("Grand Total"))}</strong></td>
                <td></td>
                <td class="col-num"><strong>${escapeHtml(fmtFixed(grandTotal.Carats, GROUPED_DECIMALS.Carats))}</strong></td>
                <td class="col-num"><strong>${escapeHtml(fmtFixed(grandTotal.ReturnCarats, GROUPED_DECIMALS.ReturnCarats))}</strong></td>
                <td class="col-num"><strong>${escapeHtml(fmtFixed(calcGroupedAvgRate(grandTotal), 2))}</strong></td>
                <td class="col-num"><strong>${escapeHtml(fmtFixed(grandTotal.Amount, GROUPED_DECIMALS.Amount))}</strong></td>
            </tr>
        `;

    const tableHtml = `
            <table id="dynamic-solitaire-sale-report-table">
                <colgroup>
                    <col /><col /><col /><col /><col /><col /><col />
                </colgroup>
                <thead>
                    <tr>
                        <th>${escapeHtml(t("Sale No"))}</th>
                        <th>InvNo</th>
                        <th>${escapeHtml(t("LotNo"))}</th>
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

    printWindow.document.write(`<!DOCTYPE html><html><head><title>${escapeHtml(t("Sale Report"))}</title>`);
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

  const agGrandTotals = useMemo(() => getAgGrandTotalsFromRows(reportRows), [reportRows]);

  const toggleGroupExpand = (groupKey, allowMultiple = false) => {
    setExpandedGroups((prev) => {
      if (allowMultiple) {
        const next = new Set(prev);
        if (next.has(groupKey)) next.delete(groupKey);
        else next.add(groupKey);
        return next;
      }
      const next = new Set();
      if (!prev.has(groupKey)) next.add(groupKey);
      return next;
    });
  };

  const buildStandardParentRow = (groupKey, rows) => {
    const first = rows[0];

    const totalCarat = rows.reduce((s, r) => s + Number(getRowVal(r, "Carats", "carats") || 0), 0);
    const totalAmount = rows.reduce((s, r) => s + Number(getRowVal(r, "Amount", "amount") || 0), 0);
    const totalPurAmt = rows.reduce((s, r) => s + Number(getRowVal(r, "PurchaseAmount", "purchaseAmount") || 0), 0);
    const totalMRPAmt = rows.reduce((s, r) => s + Number(getRowVal(r, "MRPAmt", "mrpAmt") || 0), 0);
    const totalINR = rows.reduce((s, r) => s + Number(getRowVal(r, "MasterCurrencyAmount", "masterCurrencyAmount") || 0), 0);
    const totalUSD = rows.reduce((s, r) => s + Number(getRowVal(r, "StockCurrencyAmount", "stockCurrencyAmount") || 0), 0);

    const totalMRP = totalCarat > 0 ? totalMRPAmt / totalCarat : 0;
    const totalRate = totalCarat > 0 ? totalAmount / totalCarat : 0;
    const totalDiscount = totalMRPAmt > 0 ? (totalAmount / totalMRPAmt) * 100 - 100 : 0;
    const totalPurchaseRate = totalCarat > 0 ? totalPurAmt / totalCarat : 0;

    return {
      isParent: true,
      isAgGroup: false,
      groupKey,
      Code: "",
      ConDATE: getRowVal(first, "ConDATE", "conDATE", "conDate", "Date", "date"),
      BillNo: getRowVal(first, "BillNo", "billNo", "billno"),
      Invno: groupKey,
      Due: getRowVal(first, "Due", "due"),
      Party: getRowVal(first, "Party", "party"),
      Commission: getRowVal(first, "Commission", "commission", "commAgent", "CommAgent"),
      Broker: getRowVal(first, "Broker", "broker"),
      Exportparty: getRowVal(first, "Exportparty", "exportparty", "ExpParty", "expParty"),
      Item: "Total",
      Carats: totalCarat,
      ShapeId: null,
      ColorId: null,
      ClarityId: null,
      PropId: null,
      PolishId: null,
      SymId: null,
      FLId: null,
      MRP: totalMRP,
      Discount: totalDiscount,
      Rate: totalRate,
      Less1: null,
      Less2: null,
      Less3: null,
      Amount: totalAmount,
      PurchaseAmount: totalPurAmt,
      Symbol: null,
      DRate: null,
      Cert: null,
      CertificateNo: null,
      Invtype: null,
      Category: null,
      MilkyId: null,
      NattsId: null,
      LusterId: null,
      RoughId: null,
      MfgSeriesID: null,
      MfgPacketID: null,
      User: null,
      Seller: null,
      Term: null,
      ColCla: null,
      PurchaseRate: totalPurchaseRate,
      PDate: null,
      City: null,
      EyeClean: null,
      MRPAmt: totalMRPAmt,
      MasterCurrencyRate: null,
      MasterCurrencyAmount: totalINR,
      StockCurrencyRate: null,
      StockCurrencyAmount: totalUSD,
      childRecords: rows
    };
  };

  const buildAgParentRow = (partyKey, rows) => {
    const totalCarat = rows.reduce((s, r) => s + Number(getRowVal(r, "Carats", "carats") || 0), 0);
    const totalAmount = rows.reduce((s, r) => s + Number(getRowVal(r, "Amount", "amount") || 0), 0);
    const totalPurAmt = rows.reduce((s, r) => s + Number(getRowVal(r, "PurchaseAmount", "purchaseAmount") || 0), 0);
    const totalMRPAmt = rows.reduce((s, r) => s + Number(getRowVal(r, "MRPAmt", "mrpAmt") || 0), 0);
    const totalINR = rows.reduce((s, r) => s + Number(getRowVal(r, "MasterCurrencyAmount", "masterCurrencyAmount") || 0), 0);
    const totalUSD = rows.reduce((s, r) => s + Number(getRowVal(r, "StockCurrencyAmount", "stockCurrencyAmount") || 0), 0);
    const totalMRP = totalCarat > 0 ? totalMRPAmt / totalCarat : 0;
    const totalRate = totalCarat > 0 ? totalAmount / totalCarat : 0;
    const totalDiscount = totalMRPAmt > 0 ? (totalAmount / totalMRPAmt) * 100 - 100 : 0;

    return {
      isParent: true,
      isAgGroup: true,
      groupKey: partyKey,
      groupLabel: `${partyKey} (${rows.length})`,
      Code: "",
      ConDATE: "",
      BillNo: "",
      Invno: "",
      Due: "",
      Party: "",
      Commission: "",
      Broker: "",
      Exportparty: "",
      Item: "",
      Carats: totalCarat,
      ShapeId: "",
      ColorId: "",
      ClarityId: "",
      PropId: "",
      PolishId: "",
      SymId: "",
      FLId: "",
      MRP: totalMRP,
      Discount: totalDiscount,
      Rate: totalRate,
      Less1: "",
      Less2: "",
      Less3: "",
      Amount: totalAmount,
      PurchaseAmount: totalPurAmt,
      Symbol: "",
      DRate: "",
      Cert: "",
      CertificateNo: "",
      Invtype: "",
      Category: "",
      MilkyId: "",
      NattsId: "",
      LusterId: "",
      RoughId: "",
      MfgSeriesID: "",
      MfgPacketID: "",
      User: "",
      Seller: "",
      Term: "",
      ColCla: "",
      PurchaseRate: "",
      PDate: "",
      City: "",
      EyeClean: "",
      MRPAmt: totalMRPAmt,
      MasterCurrencyRate: "",
      MasterCurrencyAmount: totalINR,
      StockCurrencyRate: "",
      StockCurrencyAmount: totalUSD,
      childRecords: rows
    };
  };

  const groupedVisibleRows = useMemo(() => {
    const out = [];

    if (reportMode === "ag") {
      const grouped = {};
      (reportRows || []).forEach((r) => {
        const partyVal = getRowVal(r, "Party", "party");
        const key = partyVal !== "" ? String(partyVal) : "UNKNOWN";
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(r);
      });

      Object.keys(grouped)
        .sort()
        .forEach((partyKey) => {
          const rows = grouped[partyKey] || [];
          out.push(buildAgParentRow(partyKey, rows));
        });
    } else {
      const grouped = {};
      (reportRows || []).forEach((r) => {
        const invNoVal = getRowVal(r, "Invno", "invno", "InvNo", "invNo");
        const key = invNoVal !== undefined && invNoVal !== null && invNoVal !== "" ? String(invNoVal) : "UNKNOWN";
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(r);
      });

      Object.keys(grouped)
        .sort()
        .forEach((invnoKey) => {
          const rows = grouped[invnoKey] || [];
          out.push(buildStandardParentRow(invnoKey, rows));
        });
    }

    return out;
  }, [reportRows, reportMode]);

  const renderSubRows = useCallback(
    (row) => {
      const parent = row.original;
      const groupKey = String(parent.groupKey ?? "");
      if (!expandedGroups.has(groupKey)) return null;

      const children = parent.childRecords || [];
      return children.map((child, index) => {
        const childRow = {
          ...child,
          isParent: false,
          groupKey
        };

        return (
          <tr key={`child-${groupKey}-${index}`} className="child-row">
            {row.getVisibleCells().map((cell) => {
              const column = cell.column;
              return (
                <td key={cell.id} className={column.columnDef.className || ""}>
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
    [expandedGroups]
  );

  const openViewLink = (code) => {
    const url = filters.purRtn
      ? `../purchasereturn/edit-purchasereturn?Id=${code}&Mode=view`
      : `../sale/edit-sale?Id=${code}&Mode=view`;
    const win = window.open(url, "_blank");
    if (win) win.focus();
  };

  const agDetailCell = (row, ...keys) => {
    if (row.original?.isParent) return "";
    return dashText(getRowVal(row.original, ...keys));
  };

  const agNumericCell = (row, decimals, ...keys) => {
    if (row.original?.isParent) return "";
    return fmtFixed(getRowVal(row.original, ...keys), decimals);
  };

  const standardColumns = useMemo(
    () => [
      {
        header: "",
        accessorKey: "isParent",
        enableColumnFilter: false,
        enableSorting: false,
        cell: ({ row }) => {
          const r = row.original;
          if (!r?.isParent) return "";
          const groupKey = String(r.groupKey ?? "");
          const expanded = expandedGroups.has(groupKey);
          return (
            <i
              className={expanded ? "bx bx-chevron-down" : "bx bx-chevron-right"}
              style={{ cursor: "pointer", color: "#2c7be5", fontSize: "18px", verticalAlign: "middle" }}
              onClick={() => toggleGroupExpand(groupKey, false)}
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
              <a href="#" onClick={(e) => { e.preventDefault(); openViewLink(code); }}>
                <i className="bx bx-show-alt"></i>
              </a>
            </div>
          );
        },
        footer: () => <span className="fw-bold text-center d-block">{t("Total")}:</span>
      },
      {
        header: t("Date"),
        accessorKey: "ConDATE",
        cell: ({ row }) => dashText(getRowVal(row.original, "ConDATE", "conDATE", "condate", "Date", "date"))
      },
      {
        header: t("BillNo"),
        accessorKey: "BillNo",
        cell: ({ row }) => dashText(getRowVal(row.original, "BillNo", "billNo", "billno"))
      },
      {
        header: t("InvNo"),
        accessorKey: "Invno",
        cell: ({ row }) => dashText(getRowVal(row.original, "Invno", "invno", "InvNo", "invNo"))
      },
      {
        header: t("Due"),
        accessorKey: "Due",
        cell: ({ row }) => fmtFixed(getRowVal(row.original, "Due", "due"), 0)
      },
      {
        header: t("Party"),
        accessorKey: "Party",
        cell: ({ row }) => dashText(getRowVal(row.original, "Party", "party"))
      },
      {
        header: t("Comm.Agent"),
        accessorKey: "Commission",
        cell: ({ row }) => dashText(getRowVal(row.original, "Commission", "commission", "commAgent", "CommAgent"))
      },
      {
        header: t("Broker"),
        accessorKey: "Broker",
        cell: ({ row }) => dashText(getRowVal(row.original, "Broker", "broker"))
      },
      {
        header: t("ExpParty"),
        accessorKey: "Exportparty",
        cell: ({ row }) => dashText(getRowVal(row.original, "Exportparty", "exportparty", "ExpParty", "expParty"))
      },
      {
        header: t("Item"),
        accessorKey: "Item",
        cell: ({ row }) => dashText(getRowVal(row.original, "Item", "item")),
        footer: () => <span className="fw-bold text-center d-block">{t("AVG")}</span>
      },
      {
        header: t("Carats"),
        accessorKey: "Carats",
        className: "text-end",
        cell: ({ row }) => fmtFixed(getRowVal(row.original, "Carats", "carats"), 3),
        footer: ({ table }) => {
          const { parentCarat } = getTableTotals(table);
          return <span className="fw-bold text-end d-block">{fmtFixed(parentCarat, 3)}</span>;
        }
      },
      {
        header: t("Shape"),
        accessorKey: "ShapeId",
        cell: ({ row }) => agDetailCell(row, "ShapeId", "shapeId")
      },
      {
        header: t("Color"),
        accessorKey: "ColorId",
        cell: ({ row }) => agDetailCell(row, "ColorId", "colorId")
      },
      {
        header: t("Clarity"),
        accessorKey: "ClarityId",
        cell: ({ row }) => agDetailCell(row, "ClarityId", "clarityId")
      },
      { header: t("Prop"), accessorKey: "PropId", cell: ({ row }) => agDetailCell(row, "PropId", "propId") },
      { header: t("Polish"), accessorKey: "PolishId", cell: ({ row }) => agDetailCell(row, "PolishId", "polishId") },
      { header: t("Sym"), accessorKey: "SymId", cell: ({ row }) => agDetailCell(row, "SymId", "symId") },
      { header: t("FL"), accessorKey: "FLId", cell: ({ row }) => agDetailCell(row, "FLId", "flId") },
      {
        header: t("MRP"),
        accessorKey: "MRP",
        className: "text-end",
        cell: ({ row }) => (row.original?.isParent ? fmtFixed(getRowVal(row.original, "MRP", "mrp"), 2) : agNumericCell(row, 2, "MRP", "mrp")),
        footer: ({ table }) => {
          const { parentCarat, parentMRPAmt } = getTableTotals(table);
          return <span className="fw-bold text-end d-block">{fmtFixed(parentCarat > 0 ? parentMRPAmt / parentCarat : 0, 2)}</span>;
        }
      },
      {
        header: t("Disc"),
        accessorKey: "Discount",
        className: "text-end",
        cell: ({ row }) => (row.original?.isParent ? fmtFixed(getRowVal(row.original, "Discount", "discount"), 2) : agNumericCell(row, 2, "Discount", "discount")),
        footer: ({ table }) => {
          const { parentAmt, parentMRPAmt } = getTableTotals(table);
          return <span className="fw-bold text-end d-block">{fmtFixed(parentMRPAmt > 0 ? (parentAmt / parentMRPAmt) * 100 - 100 : 0, 2)}</span>;
        }
      },
      {
        header: t("Rate"),
        accessorKey: "Rate",
        className: "text-end",
        cell: ({ row }) => fmtFixed(getRowVal(row.original, "Rate", "rate"), 2),
        footer: ({ table }) => {
          const { parentCarat, parentAmt } = getTableTotals(table);
          return <span className="fw-bold text-end d-block">{fmtFixed(parentCarat > 0 ? parentAmt / parentCarat : 0, 2)}</span>;
        }
      },
      { header: t("Less1"), accessorKey: "Less1", className: "text-end", cell: ({ row }) => agNumericCell(row, 2, "Less1", "less1") },
      { header: t("Less2"), accessorKey: "Less2", className: "text-end", cell: ({ row }) => agNumericCell(row, 2, "Less2", "less2") },
      { header: t("Less3"), accessorKey: "Less3", className: "text-end", cell: ({ row }) => agNumericCell(row, 2, "Less3", "less3") },
      {
        header: t("Amount"),
        accessorKey: "Amount",
        className: "text-end",
        cell: ({ row }) => fmtFixed(getRowVal(row.original, "Amount", "amount"), 2),
        footer: ({ table }) => {
          const { parentAmt } = getTableTotals(table);
          return <span className="fw-bold text-end d-block">{fmtFixed(parentAmt, 2)}</span>;
        }
      },
      {
        header: t("PurAmount"),
        accessorKey: "PurchaseAmount",
        className: "text-end",
        cell: ({ row }) => fmtFixed(getRowVal(row.original, "PurchaseAmount", "purchaseAmount"), 2),
        footer: ({ table }) => {
          const { parentPurAmt } = getTableTotals(table);
          return <span className="fw-bold text-end d-block">{fmtFixed(parentPurAmt, 2)}</span>;
        }
      },
      { header: t("Symbol"), accessorKey: "Symbol", cell: ({ row }) => agDetailCell(row, "Symbol", "symbol") },
      { header: t("$Rate"), accessorKey: "DRate", className: "text-end", cell: ({ row }) => agNumericCell(row, 2, "DRate", "dRate", "drate") },
      { header: t("Cert"), accessorKey: "Cert", cell: ({ row }) => agDetailCell(row, "Cert", "cert") },
      { header: t("Cert No"), accessorKey: "CertificateNo", cell: ({ row }) => agDetailCell(row, "CertificateNo", "certificateNo") },
      { header: t("InvType"), accessorKey: "Invtype", cell: ({ row }) => agDetailCell(row, "Invtype", "invtype", "InvType", "invType") },
      { header: t("Category"), accessorKey: "Category", cell: ({ row }) => agDetailCell(row, "Category", "category") },
      { header: t("MilkyId"), accessorKey: "MilkyId", cell: ({ row }) => agDetailCell(row, "MilkyId", "milkyId") },
      { header: t("NattsId"), accessorKey: "NattsId", cell: ({ row }) => agDetailCell(row, "NattsId", "nattsId") },
      { header: t("LusterId"), accessorKey: "LusterId", cell: ({ row }) => agDetailCell(row, "LusterId", "lusterId") },
      { header: t("RoughId"), accessorKey: "RoughId", cell: ({ row }) => agDetailCell(row, "RoughId", "roughId") },
      { header: t("KapanNo"), accessorKey: "MfgSeriesID", cell: ({ row }) => agDetailCell(row, "MfgSeriesID", "mfgSeriesID", "kapanNo") },
      { header: t("Kapan Packet No"), accessorKey: "MfgPacketID", cell: ({ row }) => agDetailCell(row, "MfgPacketID", "mfgPacketID", "kapanPacketNo") },
      { header: t("User"), accessorKey: "User", cell: ({ row }) => agDetailCell(row, "User", "user") },
      { header: t("Seller"), accessorKey: "Seller", cell: ({ row }) => agDetailCell(row, "Seller", "seller") },
      { header: t("Term"), accessorKey: "Term", cell: ({ row }) => agDetailCell(row, "Term", "term") },
      { header: t("Col/Cla"), accessorKey: "ColCla", cell: ({ row }) => agDetailCell(row, "ColCla", "colCla", "colcla") },
      { header: t("PurchaseRate"), accessorKey: "PurchaseRate", className: "text-end", cell: ({ row }) => agNumericCell(row, 2, "PurchaseRate", "purchaseRate") },
      { header: t("PDate"), accessorKey: "PDate", cell: ({ row }) => agDetailCell(row, "PDate", "pDate", "pdate") },
      { header: t("City"), accessorKey: "City", cell: ({ row }) => agDetailCell(row, "City", "city") },
      { header: t("EyeClean"), accessorKey: "EyeClean", cell: ({ row }) => agDetailCell(row, "EyeClean", "eyeClean") },
      {
        header: t("MRP Amt"),
        accessorKey: "MRPAmt",
        className: "text-end",
        cell: ({ row }) => fmtFixed(getRowVal(row.original, "MRPAmt", "mrpAmt"), 2),
        footer: ({ table }) => {
          const { parentMRPAmt } = getTableTotals(table);
          return <span className="fw-bold text-end d-block">{fmtFixed(parentMRPAmt, 2)}</span>;
        }
      },
      { header: t("INR Rate"), accessorKey: "MasterCurrencyRate", className: "text-end", cell: ({ row }) => agNumericCell(row, 2, "MasterCurrencyRate", "masterCurrencyRate") },
      {
        header: t("INR Amount"),
        accessorKey: "MasterCurrencyAmount",
        className: "text-end",
        cell: ({ row }) => fmtFixed(getRowVal(row.original, "MasterCurrencyAmount", "masterCurrencyAmount"), 2),
        footer: ({ table }) => {
          const { parentINR } = getTableTotals(table);
          return <span className="fw-bold text-end d-block">{fmtFixed(parentINR, 2)}</span>;
        }
      },
      { header: t("USD Rate"), accessorKey: "StockCurrencyRate", className: "text-end", cell: ({ row }) => agNumericCell(row, 2, "StockCurrencyRate", "stockCurrencyRate") },
      {
        header: t("USD Amount"),
        accessorKey: "StockCurrencyAmount",
        className: "text-end",
        cell: ({ row }) => fmtFixed(getRowVal(row.original, "StockCurrencyAmount", "stockCurrencyAmount"), 2),
        footer: ({ table }) => {
          const { parentUSD } = getTableTotals(table);
          return <span className="fw-bold text-end d-block">{fmtFixed(parentUSD, 2)}</span>;
        }
      }
    ],
    [expandedGroups, t]
  );

  const agColumns = useMemo(
    () => [
      {
        header: t("Group"),
        accessorKey: "groupLabel",
        enableColumnFilter: false,
        enableSorting: false,
        cell: ({ row }) => {
          const r = row.original;
          if (!r?.isParent) return "";
          const groupKey = String(r.groupKey ?? "");
          const expanded = expandedGroups.has(groupKey);
          return (
            <span className="d-flex align-items-center gap-1 fw-semibold">
              <i
                className={expanded ? "bx bx-chevron-down" : "bx bx-chevron-right"}
                style={{ cursor: "pointer", color: "#2c7be5", fontSize: "18px" }}
                onClick={() => toggleGroupExpand(groupKey, true)}
              />
              {r.groupLabel}
            </span>
          );
        },
        footer: () => <span className="fw-bold text-center d-block">{t("Grand Total")}</span>
      },
      {
        header: t("View"),
        accessorKey: "Code",
        enableColumnFilter: false,
        enableSorting: false,
        cell: ({ row }) => {
          const r = row.original;
          if (r?.isParent) {
            return <i className="bx bx-show-alt" style={{ opacity: 0.4, cursor: "not-allowed" }} />;
          }
          const code = getRowVal(r, "Code", "code");
          return (
            <div className="report-action">
              <a href="#" onClick={(e) => { e.preventDefault(); openViewLink(code); }}>
                <i className="bx bx-show-alt"></i>
              </a>
            </div>
          );
        }
      },
      { header: t("Date"), accessorKey: "ConDATE", cell: ({ row }) => agDetailCell(row, "ConDATE", "conDATE", "condate", "Date", "date") },
      { header: t("BillNo"), accessorKey: "BillNo", cell: ({ row }) => agDetailCell(row, "BillNo", "billNo", "billno") },
      { header: t("InvNo"), accessorKey: "Invno", cell: ({ row }) => agDetailCell(row, "Invno", "invno", "InvNo", "invNo") },
      { header: t("Due"), accessorKey: "Due", cell: ({ row }) => (row.original?.isParent ? "" : fmtFixed(getRowVal(row.original, "Due", "due"), 0)) },
      {
        header: t("Party"),
        accessorKey: "Party",
        cell: ({ row }) => agDetailCell(row, "Party", "party")
      },
      { header: t("Comm.Agent"), accessorKey: "Commission", cell: ({ row }) => agDetailCell(row, "Commission", "commission", "commAgent", "CommAgent") },
      { header: t("Broker"), accessorKey: "Broker", cell: ({ row }) => agDetailCell(row, "Broker", "broker") },
      { header: t("ExpParty"), accessorKey: "Exportparty", cell: ({ row }) => agDetailCell(row, "Exportparty", "exportparty", "ExpParty", "expParty") },
      { header: t("Item"), accessorKey: "Item", cell: ({ row }) => agDetailCell(row, "Item", "item") },
      {
        header: t("sum(Carats)"),
        accessorKey: "Carats",
        className: "text-end",
        cell: ({ row }) => fmtFixed(getRowVal(row.original, "Carats", "carats"), 3),
        footer: ({ table }) => {
          const { parentCarat } = getTableTotals(table);
          return <span className="fw-bold text-end d-block">{fmtFixed(parentCarat, 3)}</span>;
        }
      },
      { header: t("Shape"), accessorKey: "ShapeId", cell: ({ row }) => agDetailCell(row, "ShapeId", "shapeId") },
      { header: t("Color"), accessorKey: "ColorId", cell: ({ row }) => agDetailCell(row, "ColorId", "colorId") },
      { header: t("Clarity"), accessorKey: "ClarityId", cell: ({ row }) => agDetailCell(row, "ClarityId", "clarityId") },
      { header: t("Prop"), accessorKey: "PropId", cell: ({ row }) => agDetailCell(row, "PropId", "propId") },
      { header: t("Polish"), accessorKey: "PolishId", cell: ({ row }) => agDetailCell(row, "PolishId", "polishId") },
      { header: t("Sym"), accessorKey: "SymId", cell: ({ row }) => agDetailCell(row, "SymId", "symId") },
      { header: t("FL"), accessorKey: "FLId", cell: ({ row }) => agDetailCell(row, "FLId", "flId") },
      {
        header: t("MRP"),
        accessorKey: "MRP",
        className: "text-end",
        cell: ({ row }) => (row.original?.isParent ? fmtFixed(getRowVal(row.original, "MRP", "mrp"), 2) : agNumericCell(row, 2, "MRP", "mrp")),
        footer: ({ table }) => {
          const { parentCarat, parentMRPAmt } = getTableTotals(table);
          return <span className="fw-bold text-end d-block">{fmtFixed(parentCarat > 0 ? parentMRPAmt / parentCarat : 0, 2)}</span>;
        }
      },
      {
        header: t("Disc"),
        accessorKey: "Discount",
        className: "text-end",
        cell: ({ row }) => (row.original?.isParent ? fmtFixed(getRowVal(row.original, "Discount", "discount"), 2) : agNumericCell(row, 2, "Discount", "discount")),
        footer: ({ table }) => {
          const { parentAmt, parentMRPAmt } = getTableTotals(table);
          return <span className="fw-bold text-end d-block">{fmtFixed(parentMRPAmt > 0 ? (parentAmt / parentMRPAmt) * 100 - 100 : 0, 2)}</span>;
        }
      },
      {
        header: t("Rate"),
        accessorKey: "Rate",
        className: "text-end",
        cell: ({ row }) => (row.original?.isParent ? fmtFixed(getRowVal(row.original, "Rate", "rate"), 2) : agNumericCell(row, 2, "Rate", "rate")),
        footer: ({ table }) => {
          const { parentCarat, parentAmt } = getTableTotals(table);
          return <span className="fw-bold text-end d-block">{fmtFixed(parentCarat > 0 ? parentAmt / parentCarat : 0, 2)}</span>;
        }
      },
      { header: t("Less1"), accessorKey: "Less1", className: "text-end", cell: ({ row }) => agNumericCell(row, 2, "Less1", "less1") },
      { header: t("Less2"), accessorKey: "Less2", className: "text-end", cell: ({ row }) => agNumericCell(row, 2, "Less2", "less2") },
      { header: t("Less3"), accessorKey: "Less3", className: "text-end", cell: ({ row }) => agNumericCell(row, 2, "Less3", "less3") },
      {
        header: t("Amount"),
        accessorKey: "Amount",
        className: "text-end",
        cell: ({ row }) => (row.original?.isParent ? fmtFixed(getRowVal(row.original, "Amount", "amount"), 2) : agNumericCell(row, 2, "Amount", "amount")),
        footer: ({ table }) => {
          const { parentAmt } = getTableTotals(table);
          return <span className="fw-bold text-end d-block">{fmtFixed(parentAmt, 2)}</span>;
        }
      },
      {
        header: t("PurAmount"),
        accessorKey: "PurchaseAmount",
        className: "text-end",
        cell: ({ row }) => (row.original?.isParent ? fmtFixed(getRowVal(row.original, "PurchaseAmount", "purchaseAmount"), 2) : agNumericCell(row, 2, "PurchaseAmount", "purchaseAmount")),
        footer: ({ table }) => {
          const { parentPurAmt } = getTableTotals(table);
          return <span className="fw-bold text-end d-block">{fmtFixed(parentPurAmt, 2)}</span>;
        }
      },
      { header: t("Symbol"), accessorKey: "Symbol", cell: ({ row }) => agDetailCell(row, "Symbol", "symbol") },
      { header: t("$Rate"), accessorKey: "DRate", className: "text-end", cell: ({ row }) => agNumericCell(row, 2, "DRate", "dRate", "drate") },
      { header: t("Cert"), accessorKey: "Cert", cell: ({ row }) => agDetailCell(row, "Cert", "cert") },
      { header: t("Cert No"), accessorKey: "CertificateNo", cell: ({ row }) => agDetailCell(row, "CertificateNo", "certificateNo") },
      { header: t("InvType"), accessorKey: "Invtype", cell: ({ row }) => agDetailCell(row, "Invtype", "invtype", "InvType", "invType") },
      { header: t("Category"), accessorKey: "Category", cell: ({ row }) => agDetailCell(row, "Category", "category") },
      { header: t("MilkyId"), accessorKey: "MilkyId", cell: ({ row }) => agDetailCell(row, "MilkyId", "milkyId") },
      { header: t("NattsId"), accessorKey: "NattsId", cell: ({ row }) => agDetailCell(row, "NattsId", "nattsId") },
      { header: t("LusterId"), accessorKey: "LusterId", cell: ({ row }) => agDetailCell(row, "LusterId", "lusterId") },
      { header: t("RoughId"), accessorKey: "RoughId", cell: ({ row }) => agDetailCell(row, "RoughId", "roughId") },
      { header: t("KapanNo"), accessorKey: "MfgSeriesID", cell: ({ row }) => agDetailCell(row, "MfgSeriesID", "mfgSeriesID", "kapanNo") },
      { header: t("Kapan Packet No"), accessorKey: "MfgPacketID", cell: ({ row }) => agDetailCell(row, "MfgPacketID", "mfgPacketID", "kapanPacketNo") },
      { header: t("User"), accessorKey: "User", cell: ({ row }) => agDetailCell(row, "User", "user") },
      { header: t("Seller"), accessorKey: "Seller", cell: ({ row }) => agDetailCell(row, "Seller", "seller") },
      { header: t("Term"), accessorKey: "Term", cell: ({ row }) => agDetailCell(row, "Term", "term") },
      { header: t("Col/Cla"), accessorKey: "ColCla", cell: ({ row }) => agDetailCell(row, "ColCla", "colCla", "colcla") },
      { header: t("PurchaseRate"), accessorKey: "PurchaseRate", className: "text-end", cell: ({ row }) => agNumericCell(row, 2, "PurchaseRate", "purchaseRate") },
      { header: t("PDate"), accessorKey: "PDate", cell: ({ row }) => agDetailCell(row, "PDate", "pDate", "pdate") },
      { header: t("City"), accessorKey: "City", cell: ({ row }) => agDetailCell(row, "City", "city") },
      { header: t("EyeClean"), accessorKey: "EyeClean", cell: ({ row }) => agDetailCell(row, "EyeClean", "eyeClean") },
      {
        header: t("MRP Amt"),
        accessorKey: "MRPAmt",
        className: "text-end",
        cell: ({ row }) => (row.original?.isParent ? fmtFixed(getRowVal(row.original, "MRPAmt", "mrpAmt"), 2) : agNumericCell(row, 2, "MRPAmt", "mrpAmt")),
        footer: ({ table }) => {
          const { parentMRPAmt } = getTableTotals(table);
          return <span className="fw-bold text-end d-block">{fmtFixed(parentMRPAmt, 2)}</span>;
        }
      },
      { header: t("INR Rate"), accessorKey: "MasterCurrencyRate", className: "text-end", cell: ({ row }) => agNumericCell(row, 2, "MasterCurrencyRate", "masterCurrencyRate") },
      {
        header: t("INR Amount"),
        accessorKey: "MasterCurrencyAmount",
        className: "text-end",
        cell: ({ row }) => (row.original?.isParent ? fmtFixed(getRowVal(row.original, "MasterCurrencyAmount", "masterCurrencyAmount"), 2) : agNumericCell(row, 2, "MasterCurrencyAmount", "masterCurrencyAmount")),
        footer: ({ table }) => {
          const { parentINR } = getTableTotals(table);
          return <span className="fw-bold text-end d-block">{fmtFixed(parentINR, 2)}</span>;
        }
      },
      { header: t("USD Rate"), accessorKey: "StockCurrencyRate", className: "text-end", cell: ({ row }) => agNumericCell(row, 2, "StockCurrencyRate", "stockCurrencyRate") },
      {
        header: t("USD Amount"),
        accessorKey: "StockCurrencyAmount",
        className: "text-end",
        cell: ({ row }) => (row.original?.isParent ? fmtFixed(getRowVal(row.original, "StockCurrencyAmount", "stockCurrencyAmount"), 2) : agNumericCell(row, 2, "StockCurrencyAmount", "stockCurrencyAmount")),
        footer: ({ table }) => {
          const { parentUSD } = getTableTotals(table);
          return <span className="fw-bold text-end d-block">{fmtFixed(parentUSD, 2)}</span>;
        }
      }
    ],
    [expandedGroups, t]
  );

  const activeColumns = reportMode === "ag" ? agColumns : standardColumns;

  const handleExcel = async () => {
    if (!reportRows || reportRows.length === 0) {
      toast.warning(t("No data available to export."));
      return;
    }

    const headers = [
      "Date",
      "BillNo",
      "InvNo",
      "Due",
      "Party",
      "Comm.Agent",
      "Broker",
      "ExpParty",
      "Item",
      "Carats",
      "Shape",
      "Color",
      "Clarity",
      "Prop",
      "Polish",
      "Sym",
      "FL",
      "MRP",
      "Disc",
      "Rate",
      "Less1",
      "Less2",
      "Less3",
      "Amount",
      "PurAmount",
      "Symbol",
      "$Rate",
      "Cert",
      "Cert No",
      "InvType",
      "Category",
      "MilkyId",
      "NattsId",
      "LusterId",
      "RoughId",
      "KapanNo",
      "Kapan Packet No",
      "User",
      "Seller",
      "Term",
      "Col/Cla",
      "PurchaseRate",
      "PDate",
      "City",
      "EyeClean",
      "MRP Amt",
      "INR Rate",
      "INR Amount",
      "USD Rate",
      "USD Amount"
    ];

    const rows = reportRows.map((row) => [
      dashText(getRowVal(row, "ConDATE", "conDATE", "condate", "Date", "date")),
      dashText(getRowVal(row, "BillNo", "billNo", "billno")),
      dashText(getRowVal(row, "Invno", "invno", "InvNo", "invNo")),
      fmtFixed(getRowVal(row, "Due", "due"), 0),
      dashText(getRowVal(row, "Party", "party")),
      dashText(getRowVal(row, "Commission", "commission", "commAgent", "CommAgent")),
      dashText(getRowVal(row, "Broker", "broker")),
      dashText(getRowVal(row, "Exportparty", "exportparty", "ExpParty", "expParty")),
      dashText(getRowVal(row, "Item", "item")),
      fmtFixed(getRowVal(row, "Carats", "carats"), 3),
      dashText(getRowVal(row, "ShapeId", "shapeId")),
      dashText(getRowVal(row, "ColorId", "colorId")),
      dashText(getRowVal(row, "ClarityId", "clarityId")),
      dashText(getRowVal(row, "PropId", "propId")),
      dashText(getRowVal(row, "PolishId", "polishId")),
      dashText(getRowVal(row, "SymId", "symId")),
      dashText(getRowVal(row, "FLId", "flId")),
      fmtFixed(getRowVal(row, "MRP", "mrp"), 2),
      fmtFixed(getRowVal(row, "Discount", "discount"), 2),
      fmtFixed(getRowVal(row, "Rate", "rate"), 2),
      fmtFixed(getRowVal(row, "Less1", "less1"), 2),
      fmtFixed(getRowVal(row, "Less2", "less2"), 2),
      fmtFixed(getRowVal(row, "Less3", "less3"), 2),
      fmtFixed(getRowVal(row, "Amount", "amount"), 2),
      fmtFixed(getRowVal(row, "PurchaseAmount", "purchaseAmount"), 2),
      dashText(getRowVal(row, "Symbol", "symbol")),
      fmtFixed(getRowVal(row, "DRate", "dRate", "drate"), 2),
      dashText(getRowVal(row, "Cert", "cert")),
      dashText(getRowVal(row, "CertificateNo", "certificateNo")),
      dashText(getRowVal(row, "Invtype", "invtype", "InvType", "invType")),
      dashText(getRowVal(row, "Category", "category")),
      dashText(getRowVal(row, "MilkyId", "milkyId")),
      dashText(getRowVal(row, "NattsId", "nattsId")),
      dashText(getRowVal(row, "LusterId", "lusterId")),
      dashText(getRowVal(row, "RoughId", "roughId")),
      dashText(getRowVal(row, "MfgSeriesID", "mfgSeriesID", "kapanNo")),
      dashText(getRowVal(row, "MfgPacketID", "mfgPacketID", "kapanPacketNo")),
      dashText(getRowVal(row, "User", "user")),
      dashText(getRowVal(row, "Seller", "seller")),
      dashText(getRowVal(row, "Term", "term")),
      dashText(getRowVal(row, "ColCla", "colCla", "colcla")),
      fmtFixed(getRowVal(row, "PurchaseRate", "purchaseRate"), 2),
      dashText(getRowVal(row, "PDate", "pDate", "pdate")),
      dashText(getRowVal(row, "City", "city")),
      dashText(getRowVal(row, "EyeClean", "eyeClean")),
      fmtFixed(getRowVal(row, "MRPAmt", "mrpAmt"), 2),
      fmtFixed(getRowVal(row, "MasterCurrencyRate", "masterCurrencyRate"), 2),
      fmtFixed(getRowVal(row, "MasterCurrencyAmount", "masterCurrencyAmount"), 2),
      fmtFixed(getRowVal(row, "StockCurrencyRate", "stockCurrencyRate"), 2),
      fmtFixed(getRowVal(row, "StockCurrencyAmount", "stockCurrencyAmount"), 2)
    ]);

    const res = await exportToExcel(headers, rows, "SaleReport", "SaleReport");
    if (!res?.success) toast.error(t("Excel export failed."));
  };

  document.title = t("Sale Report");

  return (
    <React.Fragment>
      <ToastContainer />

      <div className="page-content">
        <Container fluid>
          <BreadCrumb title={t("Sale Report")} pageTitle={t("Reports")} />

          <div className="card stock-search-header-bar d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between mb-3 p-3 rounded-3 shadow-sm border gap-2">
            <h5 className="mb-0 fw-bold text-primary d-flex align-items-center gap-2">
              <i className={hasSearched ? "ri-database-2-line fs-20 text-primary" : "ri-search-eye-line fs-20 text-primary"}></i>
              {hasSearched ? t("Sale Report Results") : t("Sale Report Filters")}
            </h5>

            <div className="d-flex gap-2">
              {!hasSearched ? (
                <>
                  <Button color="primary" className="btn-sm rounded-2 px-3 py-1" onClick={() => handleReport("standard")} disabled={loading}>
                    {loading ? t("Loading...") : t("Report")}
                  </Button>
                  <Button color="primary" className="btn-sm rounded-2 px-3 py-1" onClick={() => handleReport("ag")} disabled={loading}>
                    {loading ? t("Loading...") : t("ReportAG")}
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
                      setReportRows([]);
                      setExpandedGroups(new Set());
                      setReportMode("standard");
                    }}
                    disabled={loading}
                  >
                    {t("New Search")}
                  </Button>
                  {reportMode === "grouped" && (
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
                  {reportMode !== "grouped" && (
                    <UncontrolledDropdown>
                      <DropdownToggle color="success" className="btn-sm rounded-2 px-3 py-1" caret disabled={reportRows.length === 0}>
                        {t("Excel")} / {t("Print")}
                      </DropdownToggle>
                      <DropdownMenu>
                        <DropdownItem onClick={handleExcel}>{t("Direct Print")}</DropdownItem>
                        <DropdownItem onClick={handleExcel}>{t("Sale Report Print")}</DropdownItem>
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
                              id="purRtnCheckbox"
                              checked={filters.purRtn}
                              onChange={(e) => setFilters((prev) => ({ ...prev, purRtn: e.target.checked }))}
                            />
                            <Label htmlFor="purRtnCheckbox" className="fw-medium mb-0 small">
                              {t("PurRtn")}
                            </Label>
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
                </Row>

                {/* MVC SaleReport: Print Date / Print To Date / Group By */}
                <Row className="g-2 mt-2">
                  <Col sm={2}>
                    <FormGroup className="mb-0">
                      <div className="d-flex align-items-center gap-1 mb-1">
                        <input
                          type="checkbox"
                          id="fromRChkBox"
                          checked={filters.fromRChkBox}
                          onChange={(e) => setFilters((prev) => ({ ...prev, fromRChkBox: e.target.checked }))}
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
                        onChange={(e) => setFilters((prev) => ({ ...prev, rDate: e.target.value }))}
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
                        onChange={(e) => setFilters((prev) => ({ ...prev, rToDate: e.target.value }))}
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

          {hasSearched && reportMode !== "grouped" && (
            <Card className="shadow-lg border-0 rounded-3 mb-4">
              <CardBody>
                <div className="d-flex justify-content-end gap-4 mb-3 small fw-semibold">
                  <span>
                    {reportMode === "ag"
                      ? `${t("Showing")}: ${groupedVisibleRows.length} ${t("groups")} (${reportRows.length} ${t("entries")})`
                      : `${t("Showing")}: ${groupedVisibleRows.length} ${t("rows")} (${reportRows.length} ${t("entries")})`}
                  </span>
                </div>

                {groupedVisibleRows.length === 0 ? (
                  <div className="text-center py-4 text-muted">{t("No data available.")}</div>
                ) : (
                  <TableContainer
                    columns={activeColumns}
                    data={groupedVisibleRows}
                    isGlobalFilter={true}
                    customPageSize={reportMode === "ag" ? 100 : 500}
                    customPageSizes={reportMode === "ag" ? [100, 250, 500] : [500, 1000, 1500]}
                    divClass="table-responsive table-card mb-3"
                    tableClass="align-middle table-nowrap mb-0 table-hover table-striped"
                    theadClass="table-light"
                    SearchPlaceholder={t("SEARCH:")}
                    getRowClass={(row) => (row.original?.isParent ? "parent-row fw-bold bg-light-subtle" : "child-row")}
                    renderSubRows={renderSubRows}
                  />
                )}
              </CardBody>
            </Card>
          )}

          {hasSearched && reportMode === "grouped" && (
            <Card className="shadow-lg border-0 rounded-3 mb-4">
              <CardBody>
                <style>{`
                    #dynamic-solitaire-sale-report-table th {
                        white-space: nowrap;
                    }
                    #dynamic-solitaire-sale-report-table .invoice-info td {
                        background: #f5f5f5;
                        font-weight: 600;
                    }
                    [data-bs-theme="dark"] #dynamic-solitaire-sale-report-table th,
                    [data-bs-theme="dark"] #dynamic-solitaire-sale-report-table td {
                        border-color: rgba(255, 255, 255, 0.15) !important;
                        color: var(--vz-body-color, #e9ecef);
                    }
                    [data-bs-theme="dark"] #dynamic-solitaire-sale-report-table thead th {
                        background: #262a2f !important;
                        color: var(--vz-body-color, #e9ecef) !important;
                    }
                    [data-bs-theme="dark"] #dynamic-solitaire-sale-report-table .invoice-info td {
                        background: #2c3238 !important;
                        color: var(--vz-body-color, #e9ecef) !important;
                    }
                    [data-bs-theme="dark"] #dynamic-solitaire-sale-report-table .subtotal td,
                    [data-bs-theme="dark"] #dynamic-solitaire-sale-report-table .grand-total td {
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
                      <div className="fs-5 fw-bold">{t("Sale Report")}</div>
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
                  <div className="table-responsive sol-sale-grouped-table-wrap" style={{ maxHeight: "750px", overflow: "auto" }}>
                    <table className="table table-bordered align-middle mb-0" id="dynamic-solitaire-sale-report-table" style={{ tableLayout: "fixed", minWidth: "860px" }}>
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
                          <th>{t("Sale No")}</th>
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
                              const viewUrl = filters.purRtn
                                ? `/salereturn/edit-salereturn?Id=${code}&Mode=view`
                                : `/sale/edit-sale?Id=${code}&Mode=view`;
                              return (
                                <tr key={`${section.groupKey}-${rowIndex}`}>
                                  <td className="text-center">
                                    {code ? (
                                      <div className="report-action">
                                        <a href={viewUrl} target="_blank" rel="noreferrer">
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

export default SolitaireSaleReport;
