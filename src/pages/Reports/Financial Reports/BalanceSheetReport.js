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
    Modal,
    ModalBody,
    ModalHeader,
    Row,
    Spinner
} from "reactstrap";
import { toast, ToastContainer } from "react-toastify";

import BreadCrumb from "../../../Components/Common/BreadCrumb";
import { useSettingReportDates } from "../../../Components/Hooks/useSettingReportDates";
import {
    getBalanceSheetReport,
    getBalanceSheetReportPermission,
    getLedgerReportList1,
    getSettingData
} from "../../../helpers/fakebackend_helper";
import {
    getCachedReportCompany,
    getReportCompanySettings,
    resolveCompanyLogoUrl
} from "../../../helpers/reportCompanyDefaults";

const SUM_COLUMNS = ["LMBalAmt", "LSBalAmt", "AMBalAmt", "ASBalAmt"];
const NAME_COLUMNS = ["LAccGrpName", "AAccGrpName"];
const LEDGER_SUM_COLUMNS = ["StockDebit", "StockCredit", "MasterDebit", "MasterCredit"];
const LEDGER_AMOUNT_COLUMNS = [
    "StockDebit",
    "StockCredit",
    "StockFinalAmount",
    "MasterDebit",
    "MasterCredit",
    "MasterFinalAmount"
];

const isZero = (value) => value === "0" || value === "0.00";

/** MVC blankOnlyDoubleZeroRows — clear paired zero amount cells */
const blankOnlyDoubleZeroRows = (tableElement) => {
    if (!tableElement) return;

    tableElement.querySelectorAll("tr").forEach((row) => {
        const cells = row.querySelectorAll("td");
        for (let i = 0; i < cells.length - 1; i += 1) {
            const v1 = cells[i].textContent.trim();
            const v2 = cells[i + 1].textContent.trim();
            if (isZero(v1) && isZero(v2)) {
                cells[i].textContent = "";
                cells[i + 1].textContent = "";
            }
        }
    });
};

const escapeHtml = (value) => {
    if (value == null) return "";
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
};

const getAmountPairDisplay = (item, masterKey, stockKey, hideZeroBalance) => {
    const masterNum = parseFloat(item[masterKey]);
    const stockNum = parseFloat(item[stockKey]);
    const masterText = !Number.isNaN(masterNum) ? masterNum.toFixed(2) : "";
    const stockText = !Number.isNaN(stockNum) ? stockNum.toFixed(2) : "";
    if (hideZeroBalance && isZero(masterText) && isZero(stockText)) {
        return ["", ""];
    }
    return [masterText, stockText];
};

const formatLedgerDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return String(dateStr);
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${month}-${day}`;
};

/** MVC openLedgerModal: FromDate = ToDate minus 1 year */
const getLedgerFromDate = (toDateYmd) => {
    if (!toDateYmd) return "";
    const d = new Date(toDateYmd);
    if (Number.isNaN(d.getTime())) return "";
    d.setFullYear(d.getFullYear() - 1);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    return `${d.getFullYear()}-${mm}-${dd}`;
};

const cleanAccountName = (name) =>
    String(name ?? "")
        .replace(/&nbsp;/gi, " ")
        .replace(/\u00A0/g, " ")
        .trim();

const formatLocalAmount = (value) => {
    const num = parseFloat(value);
    return Number.isNaN(num) ? "" : num.toFixed(2);
};

/** MVC Balance Sheet print — self-contained A4 landscape document */
const buildBalanceSheetPrintHtml = ({
    companyInfo,
    logoUrl,
    reportDate,
    columns,
    reportData,
    grandTotal,
    hideZeroBalance
}) => {
    const tableRows = reportData
        .map((item) => {
            const [lMaster, lStock] = getAmountPairDisplay(item, "LMBalAmt", "LSBalAmt", hideZeroBalance);
            const [aMaster, aStock] = getAmountPairDisplay(item, "AMBalAmt", "ASBalAmt", hideZeroBalance);
            return `<tr>
                <td class="name-cell">${escapeHtml(item.LAccGrpName ?? "")}</td>
                <td class="amount-cell">${escapeHtml(lMaster)}</td>
                <td class="amount-cell">${escapeHtml(lStock)}</td>
                <td class="name-cell">${escapeHtml(item.AAccGrpName ?? "")}</td>
                <td class="amount-cell">${escapeHtml(aMaster)}</td>
                <td class="amount-cell">${escapeHtml(aStock)}</td>
            </tr>`;
        })
        .join("");

    const columnHeaders = columns.map((col) => `<th>${escapeHtml(col.header)}</th>`).join("");

    const totalCells = columns
        .map((col) => {
            if (SUM_COLUMNS.includes(col.key)) {
                return `<td class="amount-cell">${escapeHtml(grandTotal[col.key].toFixed(2))}</td>`;
            }
            return "<td></td>";
        })
        .join("");

    const logoBlock = logoUrl
        ? `<img src="${escapeHtml(logoUrl)}" alt="Company Logo" style="max-height:90px;width:96px;object-fit:contain;" />`
        : "";

    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <title>Balance Sheet</title>
    <style>
        * { box-sizing: border-box; }
        html, body {
            margin: 0;
            padding: 8px;
            font-family: Arial, sans-serif;
            font-size: 10px;
            color: #000;
            background: #fff;
        }
        #company-info {
            width: 100%;
            background: #fff;
            color: #000;
        }
        .bs-header {
            display: flex;
            align-items: flex-start;
            width: 100%;
            margin-bottom: 8px;
            padding-bottom: 6px;
            border-bottom: 1px solid #ccc;
        }
        .bs-header-left {
            display: flex;
            align-items: flex-start;
            width: 58%;
            flex: 0 0 58%;
        }
        .bs-header-right {
            width: 42%;
            flex: 0 0 42%;
            text-align: right;
            padding-top: 14px;
        }
        .bs-company-meta {
            font-size: 13px;
            line-height: 1.8;
            padding-left: 15px;
            color: #000;
        }
        .bs-title {
            font-size: 30px;
            font-weight: 800;
            color: #000;
            line-height: 1.2;
        }
        .bs-date {
            font-size: 18px;
            color: #000;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
        }
        thead { display: table-header-group; }
        tr { page-break-inside: avoid; }
        th, td {
            border: 1px solid #000;
            padding: 3px;
            word-wrap: break-word;
            line-height: 1.2;
            color: #000;
        }
        th {
            font-weight: bold;
            font-size: 10px;
            text-align: center;
        }
        td { font-size: 8.5px; }
        .section-row th {
            background: transparent !important;
            color: #000 !important;
            font-size: 14px;
        }
        .column-row th {
            background-color: #838383 !important;
            color: #fff !important;
            border: 1px solid #5a5a5a !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        .name-cell {
            white-space: nowrap;
            text-align: left;
        }
        .amount-cell {
            text-align: right;
        }
        .total-row td {
            font-weight: bold;
            background: #e8e8e8 !important;
            color: #000 !important;
            border: 1px solid #7a7a7a !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        #cpny-footer {
            margin-top: 12px;
            font-size: 11px;
            color: #000;
        }
        @page {
            size: A4 landscape;
            margin: 10mm;
        }
        @media print {
            html, body {
                margin: 0;
                padding: 0;
                color: #000 !important;
                background: #fff !important;
            }
        }
    </style>
</head>
<body>
    <div id="company-info">
        <div class="bs-header">
            <div class="bs-header-left">
                <div style="padding-left:10px;padding-top:14px;">${logoBlock}</div>
                <div class="bs-company-meta">
                    <div style="font-weight:bold;">${escapeHtml(companyInfo?.companyName)}</div>
                    <div>${escapeHtml(companyInfo?.companyAddress)}</div>
                    <div>${escapeHtml(companyInfo?.companyAddress1)}</div>
                    <div>${escapeHtml(companyInfo?.companyAddress2)}</div>
                    <div><strong>Tel:</strong> ${escapeHtml(companyInfo?.companyPhone)}</div>
                    <div><strong>Email:</strong> ${escapeHtml(companyInfo?.companyEmail)}</div>
                </div>
            </div>
            <div class="bs-header-right">
                <div class="bs-title">Balance Sheet</div>
                <div class="bs-date">${escapeHtml(reportDate)}</div>
            </div>
        </div>
        <div id="dynamic-balncessheet">
            <table class="table table-bordered">
                <thead>
                    <tr class="section-row">
                        <th colspan="3">Liabilities</th>
                        <th colspan="3">Assets</th>
                    </tr>
                    <tr class="column-row">${columnHeaders}</tr>
                </thead>
                <tbody>
                    ${tableRows}
                    <tr class="total-row">${totalCells}</tr>
                </tbody>
            </table>
        </div>
        <div id="cpny-footer">${escapeHtml(companyInfo?.companyFooter || "")}</div>
    </div>
    <script>
        window.onload = function () {
            setTimeout(function () { window.focus(); window.print(); }, 250);
        };
    </script>
</body>
</html>`;
};

const BalanceSheetReport = () => {
    const { t } = useTranslation();
    const tableRef = useRef(null);
    const { toDate: settingToDate, getDates } = useSettingReportDates();

    const [loading, setLoading] = useState(false);
    const [authorized, setAuthorized] = useState(true);
    const [showFilters, setShowFilters] = useState(true);
    const [showReport, setShowReport] = useState(false);
    const [reportData, setReportData] = useState([]);
    const [companyInfo, setCompanyInfo] = useState(() => getCachedReportCompany());
    const [reportDate, setReportDate] = useState("");
    const [stockSymbol, setStockSymbol] = useState(() => getCachedReportCompany().stockSymbol || "USD");
    const [masterSymbol, setMasterSymbol] = useState("INR");

    const [toDate, setToDate] = useState(settingToDate);
    const [calType, setCalType] = useState("Purchase Rate");
    const [hideZeroBalance, setHideZeroBalance] = useState(true);

    const [ledgerModalOpen, setLedgerModalOpen] = useState(false);
    const [ledgerLoading, setLedgerLoading] = useState(false);
    const [ledgerRows, setLedgerRows] = useState([]);
    const [modalAccountName, setModalAccountName] = useState("");
    const [modalFromDate, setModalFromDate] = useState("");
    const [modalToDate, setModalToDate] = useState("");

    useEffect(() => {
        setToDate(settingToDate);
    }, [settingToDate]);

    const columns = useMemo(
        () => [
            { header: "Account Name", key: "LAccGrpName" },
            { header: `${masterSymbol} Amount`, key: "LMBalAmt" },
            { header: `${stockSymbol} Amount`, key: "LSBalAmt" },
            { header: "Account Name", key: "AAccGrpName" },
            { header: `${masterSymbol} Amount`, key: "AMBalAmt" },
            { header: `${stockSymbol} Amount`, key: "ASBalAmt" }
        ],
        [masterSymbol, stockSymbol]
    );

    const ledgerColumns = useMemo(
        () => [
            { header: "JV Date", key: "JVDate" },
            { header: "Type", key: "VType" },
            { header: "Description", key: "Account" },
            { header: `D ${stockSymbol} Amt.`, key: "StockDebit" },
            { header: `C ${stockSymbol} Amt.`, key: "StockCredit" },
            { header: "CL Balance", key: "StockFinalAmount" },
            { header: `D ${masterSymbol} Amt.`, key: "MasterDebit" },
            { header: `C ${masterSymbol} Amt.`, key: "MasterCredit" },
            { header: "C Balance", key: "MasterFinalAmount" }
        ],
        [masterSymbol, stockSymbol]
    );

    const ledgerGrandTotal = useMemo(() => {
        const totals = {};
        LEDGER_SUM_COLUMNS.forEach((col) => {
            totals[col] = 0;
        });
        ledgerRows.forEach((item) => {
            LEDGER_SUM_COLUMNS.forEach((col) => {
                const val = parseFloat(item[col]);
                if (!Number.isNaN(val)) totals[col] += val;
            });
        });
        return totals;
    }, [ledgerRows]);

    const loadSymbols = useCallback(async () => {
        const company = await getReportCompanySettings({ forceRefresh: true });
        if (company) setCompanyInfo(company);

        let sSym = company?.stockSymbol || "";
        let mSym = "";
        try {
            const settings = await getSettingData();
            const rows = Array.isArray(settings) ? settings : settings?.data || settings?.Data || [];
            const pick = (name) => {
                const target = String(name).toLowerCase();
                const row = rows.find(
                    (x) => String(x?.Name ?? x?.name ?? "").trim().toLowerCase() === target
                );
                return row?.Value ?? row?.value ?? "";
            };
            sSym = pick("SSymbol") || sSym;
            mSym = pick("MSymbol") || mSym;
        } catch {
            /* ignore */
        }
        setStockSymbol(sSym || "USD");
        setMasterSymbol(mSym || "INR");
    }, []);

    useEffect(() => {
        const checkPermission = async () => {
            try {
                const permission = await getBalanceSheetReportPermission();
                if (permission?.success === false) {
                    setAuthorized(false);
                    toast.error(permission?.message || t("You are not authorized to perform this task."));
                    return;
                }
                setAuthorized(true);
                await loadSymbols();
            } catch (err) {
                const status = err?.response?.status || err?.status;
                if (status === 403) {
                    setAuthorized(false);
                    toast.error(t("You are not authorized to perform this task."));
                } else {
                    toast.error(err?.message || t("Error loading balance sheet report."));
                }
            }
        };

        checkPermission();
    }, [loadSymbols, t]);

    useEffect(() => {
        if (showReport && hideZeroBalance && tableRef.current) {
            blankOnlyDoubleZeroRows(tableRef.current);
        }
    }, [showReport, hideZeroBalance, reportData]);

    const grandTotal = useMemo(() => {
        const totals = {};
        SUM_COLUMNS.forEach((col) => {
            totals[col] = 0;
        });

        reportData.forEach((item) => {
            SUM_COLUMNS.forEach((col) => {
                const val = parseFloat(item[col]);
                if (!Number.isNaN(val)) totals[col] += val;
            });
        });

        return totals;
    }, [reportData]);

    const handleReport = async () => {
        setLoading(true);
        try {
            const company = await getReportCompanySettings({ forceRefresh: true });
            if (company) setCompanyInfo(company);

            const payload = {
                ToDate: toDate,
                Curcode: 0,
                CalType: calType
            };

            const response = await getBalanceSheetReport(payload, hideZeroBalance);
            if (response?.success === false) {
                toast.warning(response?.Data || response?.message || t("Unable to load report."));
                return;
            }

            const list = response?.Data || response?.data || [];
            setReportData(Array.isArray(list) ? list : []);
            setShowReport(true);
            setShowFilters(false);

            const today = new Date();
            const formattedDate = `${today.getDate().toString().padStart(2, "0")}/${today.toLocaleString("en-US", {
                month: "short"
            })}/${today.getFullYear()}`;
            setReportDate(`As on  ${formattedDate}`);
        } catch (err) {
            console.error(err);
            const status = err?.response?.status || err?.status;
            if (status === 403) {
                setAuthorized(false);
                toast.error(t("You are not authorized to perform this task."));
            } else {
                toast.error(err?.message || t("Server Connection Problem.."));
            }
        } finally {
            setLoading(false);
        }
    };

    const handleClear = async () => {
        const dates = await getDates();
        setToDate(dates.toDate);
        setCalType("Purchase Rate");
        setHideZeroBalance(true);
        setShowReport(false);
        setShowFilters(true);
        setReportData([]);
        setReportDate("");
    };

    const handleNewSelection = () => {
        setShowFilters(true);
        setShowReport(false);
    };

    /** Matches MVC openLedgerModal → POST /LedgerRpt/GetLedgerReporList1 */
    const openLedgerModal = async (accountNameRaw) => {
        const accountName = cleanAccountName(accountNameRaw);
        if (!accountName) return;

        const fromDate = getLedgerFromDate(toDate);
        setModalAccountName(accountName);
        setModalFromDate(fromDate);
        setModalToDate(toDate);
        setLedgerRows([]);
        setLedgerModalOpen(true);
        setLedgerLoading(true);

        try {
            const response = await getLedgerReportList1({
                AccountName: accountName,
                FromDate: fromDate,
                ToDate: toDate,
                Curcode: 0
            });

            if (response?.success === false) {
                toast.warning(response?.Data || response?.message || t("No data found."));
                setLedgerRows([]);
                return;
            }

            const list = response?.Data || response?.data || [];
            setLedgerRows(Array.isArray(list) ? list : []);
        } catch (err) {
            console.error(err);
            toast.error(err?.message || t("Failed to load ledger"));
            setLedgerRows([]);
        } finally {
            setLedgerLoading(false);
        }
    };

    const closeLedgerModal = () => {
        setLedgerModalOpen(false);
        setLedgerRows([]);
        setModalAccountName("");
    };

    const handlePrint = () => {
        if (!showReport || !reportData.length) {
            toast.warning(t("Please generate a report first."));
            return;
        }

        const printWin = window.open("about:blank", "_blank");
        if (!printWin) {
            toast.error(t("Popup blocked. Please allow popups for print."));
            return;
        }

        const html = buildBalanceSheetPrintHtml({
            companyInfo,
            logoUrl: resolveCompanyLogoUrl(companyInfo?.companyLogo),
            reportDate,
            columns,
            reportData,
            grandTotal,
            hideZeroBalance
        });

        try {
            printWin.document.open();
            printWin.document.write(html);
            printWin.document.close();
            printWin.focus();
        } catch (err) {
            console.error(err);
            try {
                printWin.close();
            } catch {
                /* ignore */
            }
            toast.error(t("Error opening print window."));
        }
    };

    document.title = `${t("Balance Sheet")} | ${t("Account Report")}`;

    const logoUrl = resolveCompanyLogoUrl(companyInfo?.companyLogo);

    return (
        <React.Fragment>
            <ToastContainer position="top-right" autoClose={2500} />

            <style>{`
                #company-info.balance-sheet-report-paper {
                    background-color: #fff !important;
                    color: #000 !important;
                }
                #company-info.balance-sheet-report-paper .balance-sheet-meta-line,
                #company-info.balance-sheet-report-paper .balance-sheet-title-text,
                #company-info.balance-sheet-report-paper .balance-sheet-date-text,
                #company-info.balance-sheet-report-paper #cpny-footer {
                    color: #000 !important;
                }
                #company-info.balance-sheet-report-paper .balance-sheet-report-table th {
                    border: 1px solid #000 !important;
                    text-align: center;
                }
                #company-info.balance-sheet-report-paper .balance-sheet-report-table td {
                    border: 1px solid #000 !important;
                    color: #000 !important;
                    padding: 0.2rem 1.2rem;
                }
                #company-info.balance-sheet-report-paper .balance-sheet-section-row > th {
                    background: transparent !important;
                    color: #000 !important;
                    font-weight: bold;
                    text-align: center;
                    font-size: 14px;
                    padding: 0.4rem 0.3rem;
                }
                #company-info.balance-sheet-report-paper .balance-sheet-column-row > th {
                    background: #838383 !important;
                    color: #fff !important;
                    font-weight: bold;
                    text-align: center;
                    border: 1px solid #5a5a5a !important;
                    padding: 0.4rem 0.3rem;
                }
                #company-info.balance-sheet-report-paper .balance-sheet-amount-cell {
                    text-align: right;
                    color: #000 !important;
                }
                #company-info.balance-sheet-report-paper .balance-sheet-name-cell {
                    white-space: nowrap;
                    color: #000 !important;
                }
                #company-info.balance-sheet-report-paper .balance-sheet-account-link {
                    color: #0d6efd !important;
                    cursor: pointer;
                    text-decoration: none;
                }
                #company-info.balance-sheet-report-paper .balance-sheet-account-link:hover {
                    color: #0a58ca !important;
                }
                #company-info.balance-sheet-report-paper .balance-sheet-total-row > td {
                    font-weight: bold;
                    background: #e8e8e8 !important;
                    color: #000 !important;
                    border: 1px solid #7a7a7a !important;
                }

                #ledgerModal .modal-dialog {
                    max-width: min(96vw, 1400px);
                }
                #ledgerModal .ledger-modal-header-meta,
                #ledgerModal #modalAccountName,
                #ledgerModal #modalFromDate,
                #ledgerModal #modalToDate {
                    color: inherit;
                }
                #ledgerModal .ledger-modal-table th {
                    background: #dbdbdb !important;
                    color: #000 !important;
                    border: 1px solid #000 !important;
                    text-align: center;
                    font-size: 0.8rem;
                    padding: 0.4rem 0.3rem;
                }
                #ledgerModal .ledger-modal-table td {
                    border: 1px solid #000 !important;
                    color: #000 !important;
                    white-space: nowrap;
                    background-color: transparent;
                    padding: 0.2rem 1.2rem;
                }
                #ledgerModal .ledger-modal-amount {
                    text-align: right;
                }
                #ledgerModal .ledger-modal-total-row > td {
                    font-weight: bold;
                    background: #e8e8e8 !important;
                    color: #000 !important;
                }

                [data-layout-mode="dark"] #ledgerModal .modal-content,
                [data-bs-theme="dark"] #ledgerModal .modal-content {
                    background-color: var(--vz-modal-bg, #212529) !important;
                    color: var(--vz-body-color, #e9ecef) !important;
                    border-color: var(--vz-border-color, #32383e) !important;
                }
                [data-layout-mode="dark"] #ledgerModal .modal-header,
                [data-bs-theme="dark"] #ledgerModal .modal-header {
                    background-color: var(--vz-modal-bg, #212529) !important;
                    color: var(--vz-body-color, #e9ecef) !important;
                    border-bottom-color: var(--vz-border-color, #32383e) !important;
                }
                [data-layout-mode="dark"] #ledgerModal .modal-header .btn-close,
                [data-bs-theme="dark"] #ledgerModal .modal-header .btn-close {
                    filter: invert(1) grayscale(100%);
                }
                [data-layout-mode="dark"] #ledgerModal .modal-body,
                [data-bs-theme="dark"] #ledgerModal .modal-body {
                    background-color: var(--vz-modal-bg, #212529) !important;
                    color: var(--vz-body-color, #e9ecef) !important;
                }
                [data-layout-mode="dark"] #ledgerModal #company-infos,
                [data-bs-theme="dark"] #ledgerModal #company-infos {
                    border-bottom-color: var(--vz-border-color, #32383e) !important;
                    color: var(--vz-body-color, #e9ecef) !important;
                }
                [data-layout-mode="dark"] #ledgerModal .ledger-modal-header-meta,
                [data-bs-theme="dark"] #ledgerModal .ledger-modal-header-meta,
                [data-layout-mode="dark"] #ledgerModal #modalAccountName,
                [data-bs-theme="dark"] #ledgerModal #modalAccountName,
                [data-layout-mode="dark"] #ledgerModal #modalFromDate,
                [data-bs-theme="dark"] #ledgerModal #modalFromDate,
                [data-layout-mode="dark"] #ledgerModal #modalToDate,
                [data-bs-theme="dark"] #ledgerModal #modalToDate {
                    color: var(--vz-body-color, #e9ecef) !important;
                }
                [data-layout-mode="dark"] #ledgerModal .ledger-modal-table,
                [data-bs-theme="dark"] #ledgerModal .ledger-modal-table {
                    color: var(--vz-body-color, #e9ecef) !important;
                    --bs-table-color: var(--vz-body-color, #e9ecef);
                    --bs-table-bg: transparent;
                    --bs-table-border-color: var(--vz-border-color, #32383e);
                }
                [data-layout-mode="dark"] #ledgerModal .ledger-modal-table th,
                [data-bs-theme="dark"] #ledgerModal .ledger-modal-table th {
                    background: #2b303c !important;
                    color: #f3f6f9 !important;
                    border-color: var(--vz-border-color, #32383e) !important;
                    padding: 0.4rem 0.3rem;
                }
                [data-layout-mode="dark"] #ledgerModal .ledger-modal-table td,
                [data-bs-theme="dark"] #ledgerModal .ledger-modal-table td {
                    border-color: var(--vz-border-color, #32383e) !important;
                    color: var(--vz-body-color, #e9ecef) !important;
                    background-color: transparent !important;
                    padding: 0.2rem 1.2rem;
                }
                [data-layout-mode="dark"] #ledgerModal .ledger-modal-table tbody tr:nth-child(even) > td,
                [data-bs-theme="dark"] #ledgerModal .ledger-modal-table tbody tr:nth-child(even) > td {
                    background-color: rgba(255, 255, 255, 0.03) !important;
                }
                [data-layout-mode="dark"] #ledgerModal .ledger-modal-total-row > td,
                [data-bs-theme="dark"] #ledgerModal .ledger-modal-total-row > td {
                    background-color: #353b48 !important;
                    color: #ffffff !important;
                    border-color: var(--vz-border-color, #32383e) !important;
                }

                [data-layout-mode="dark"] #company-info.balance-sheet-report-paper,
                [data-bs-theme="dark"] #company-info.balance-sheet-report-paper {
                    background-color: var(--vz-card-bg, #212529) !important;
                    color: var(--vz-body-color, #e9ecef) !important;
                }
                [data-layout-mode="dark"] #company-info.balance-sheet-report-paper .balance-sheet-meta-line,
                [data-bs-theme="dark"] #company-info.balance-sheet-report-paper .balance-sheet-meta-line,
                [data-layout-mode="dark"] #company-info.balance-sheet-report-paper .balance-sheet-title-text,
                [data-bs-theme="dark"] #company-info.balance-sheet-report-paper .balance-sheet-title-text,
                [data-layout-mode="dark"] #company-info.balance-sheet-report-paper .balance-sheet-date-text,
                [data-bs-theme="dark"] #company-info.balance-sheet-report-paper .balance-sheet-date-text,
                [data-layout-mode="dark"] #company-info.balance-sheet-report-paper #cpny-footer,
                [data-bs-theme="dark"] #company-info.balance-sheet-report-paper #cpny-footer {
                    color: var(--vz-body-color, #e9ecef) !important;
                }
                [data-layout-mode="dark"] #company-info.balance-sheet-report-paper #dynamic-balncessheet,
                [data-bs-theme="dark"] #company-info.balance-sheet-report-paper #dynamic-balncessheet {
                    background-color: transparent !important;
                }
                [data-layout-mode="dark"] #company-info.balance-sheet-report-paper .balance-sheet-report-table,
                [data-bs-theme="dark"] #company-info.balance-sheet-report-paper .balance-sheet-report-table {
                    color: var(--vz-body-color, #e9ecef) !important;
                    --bs-table-color: var(--vz-body-color, #e9ecef);
                    --bs-table-border-color: var(--vz-border-color, #32383e);
                    --bs-table-bg: transparent;
                }
                [data-layout-mode="dark"] #company-info.balance-sheet-report-paper .balance-sheet-report-table th,
                [data-bs-theme="dark"] #company-info.balance-sheet-report-paper .balance-sheet-report-table td {
                    border-color: var(--vz-border-color, #32383e) !important;
                    padding: 0.2rem 1.2rem;
                }
                [data-layout-mode="dark"] #company-info.balance-sheet-report-paper .balance-sheet-section-row > th,
                [data-bs-theme="dark"] #company-info.balance-sheet-report-paper .balance-sheet-section-row > th {
                    background: transparent !important;
                    color: var(--vz-body-color, #e9ecef) !important;
                    padding: 0.4rem 0.3rem;
                }
                [data-layout-mode="dark"] #company-info.balance-sheet-report-paper .balance-sheet-column-row > th,
                [data-bs-theme="dark"] #company-info.balance-sheet-report-paper .balance-sheet-column-row > th {
                    background: #2b303c !important;
                    color: #f3f6f9 !important;
                    border-color: var(--vz-border-color, #32383e) !important;
                    padding: 0.4rem 0.3rem;
                }
                [data-layout-mode="dark"] #company-info.balance-sheet-report-paper .balance-sheet-account-link,
                [data-bs-theme="dark"] #company-info.balance-sheet-report-paper .balance-sheet-account-link {
                    color: #6ea8fe !important;
                    text-decoration: none;
                }
                [data-layout-mode="dark"] #company-info.balance-sheet-report-paper .balance-sheet-amount-cell,
                [data-bs-theme="dark"] #company-info.balance-sheet-report-paper .balance-sheet-amount-cell,
                [data-layout-mode="dark"] #company-info.balance-sheet-report-paper .balance-sheet-name-cell,
                [data-bs-theme="dark"] #company-info.balance-sheet-report-paper .balance-sheet-name-cell {
                    color: var(--vz-body-color, #e9ecef) !important;
                    background-color: transparent !important;
                }
                [data-layout-mode="dark"] #company-info.balance-sheet-report-paper .balance-sheet-report-table tbody tr:nth-child(even) > td,
                [data-bs-theme="dark"] #company-info.balance-sheet-report-paper .balance-sheet-report-table tbody tr:nth-child(even) > td {
                    background-color: rgba(255, 255, 255, 0.03) !important;
                }
                [data-layout-mode="dark"] #company-info.balance-sheet-report-paper .balance-sheet-total-row > td,
                [data-bs-theme="dark"] #company-info.balance-sheet-report-paper .balance-sheet-total-row > td {
                    background-color: #353b48 !important;
                    color: #ffffff !important;
                    border-color: var(--vz-border-color, #32383e) !important;
                }
            `}</style>

            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title={t("Balance Sheet")} pageTitle={t("Account Report")} />

                    <div className="card stock-search-header-bar d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between mb-3 p-3 rounded-3 shadow-sm border gap-2">
                        <h5 className="mb-0 fw-bold text-primary d-flex align-items-center gap-2">
                            <i
                                className={
                                    showReport
                                        ? "ri-database-2-line fs-20 text-primary"
                                        : "ri-search-eye-line fs-20 text-primary"
                                }
                            />
                            {showReport ? t("Balance Sheet Results") : t("Balance Sheet Filters")}
                        </h5>
                        <div className="d-flex flex-wrap gap-2">
                            {showFilters ? (
                                <>
                                    <Button
                                        color="primary"
                                        className="btn-sm rounded-2 px-3 py-1"
                                        onClick={handleReport}
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <Spinner size="sm" className="me-1" />
                                                {t("Loading...")}
                                            </>
                                        ) : (
                                            t("Report")
                                        )}
                                    </Button>
                                    <Button
                                        color="soft-secondary"
                                        className="btn-sm rounded-2 px-3 py-1"
                                        onClick={handleClear}
                                        disabled={loading}
                                    >
                                        {t("Clear")}
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button
                                        color="primary"
                                        className="btn-sm rounded-2 px-3 py-1"
                                        onClick={handleNewSelection}
                                    >
                                        {t("New Selection")}
                                    </Button>
                                    <Button
                                        color="primary"
                                        className="btn-sm rounded-2 px-3 py-1"
                                        onClick={handlePrint}
                                    >
                                        <i className="ri-printer-line me-1" />
                                        {t("print")}
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>

                    {!authorized ? (
                        <Card className="shadow-sm border-0">
                            <CardBody className="text-center text-danger py-5">
                                {t("You are not authorized to perform this task.")}
                            </CardBody>
                        </Card>
                    ) : (
                        <>
                            {showFilters ? (
                                <Card className="shadow-sm border-0 mb-3">
                                    <CardBody>
                                        <Row>
                                            <Col sm={3}>
                                                <FormGroup>
                                                    <Label>
                                                        <b>{t("To Date Balance Sheet")}</b>
                                                    </Label>
                                                    <Input
                                                        type="date"
                                                        value={toDate}
                                                        onChange={(e) => setToDate(e.target.value)}
                                                    />
                                                </FormGroup>
                                            </Col>
                                            <Col xs={6} sm={4} lg={2}>
                                                <FormGroup>
                                                    <Label htmlFor="caltype">{t("Stock Report Data")}</Label>
                                                    <Input
                                                        id="caltype"
                                                        type="select"
                                                        value={calType}
                                                        onChange={(e) => setCalType(e.target.value)}
                                                    >
                                                        <option value="Purchase Rate">{t("Purchase Rate")}</option>
                                                        <option value="Asking Rate">{t("Asking Rate")}</option>
                                                    </Input>
                                                </FormGroup>
                                            </Col>
                                            <Col md={2}>
                                                <FormGroup className="mt-2">
                                                    <div className="form-check mt-4">
                                                        <Input
                                                            type="checkbox"
                                                            id="ChkBL"
                                                            checked={hideZeroBalance}
                                                            onChange={(e) => setHideZeroBalance(e.target.checked)}
                                                        />
                                                        <Label check htmlFor="ChkBL">
                                                            {t("Hide 0 Balance")}
                                                        </Label>
                                                    </div>
                                                </FormGroup>
                                            </Col>
                                        </Row>
                                    </CardBody>
                                </Card>
                            ) : null}

                            {showReport ? (
                                <div
                                    id="company-info"
                                    className="container-fluid mb-2 border-bottom pl-2 card balance-sheet-report-paper"
                                >
                                    <Row className="align-items-center">
                                        <Col md={12} className="d-flex">
                                            <div style={{ paddingLeft: 10, paddingTop: 14 }}>
                                                {logoUrl ? (
                                                    <img
                                                        src={logoUrl}
                                                        alt="Company Logo"
                                                        style={{ maxHeight: 90, width: 96 }}
                                                    />
                                                ) : null}
                                            </div>
                                            <div
                                                className="balance-sheet-company-meta"
                                                style={{
                                                    fontSize: 14,
                                                    lineHeight: 1.8,
                                                    paddingTop: 14,
                                                    paddingLeft: 15,
                                                    width: "100%"
                                                }}
                                            >
                                                <div className="balance-sheet-meta-line" style={{ fontSize: 13, fontWeight: "bold" }}>
                                                    {companyInfo?.companyName}
                                                </div>
                                                <div className="balance-sheet-meta-line" style={{ fontSize: 13 }}>
                                                    {companyInfo?.companyAddress}
                                                </div>
                                                <div className="balance-sheet-meta-line" style={{ fontSize: 13 }}>
                                                    {companyInfo?.companyAddress1}
                                                </div>
                                                <div className="balance-sheet-meta-line" style={{ fontSize: 13 }}>
                                                    {companyInfo?.companyAddress2}
                                                </div>
                                                <div className="balance-sheet-meta-line" style={{ fontSize: 13 }}>
                                                    <strong>Tel:</strong> {companyInfo?.companyPhone}
                                                </div>
                                                <div className="balance-sheet-meta-line" style={{ fontSize: 13 }}>
                                                    <strong>Email:</strong> {companyInfo?.companyEmail}
                                                </div>

                                                <div
                                                    className="balance-sheet-statement-title"
                                                    style={{
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        alignItems: "center",
                                                        marginTop: -117
                                                    }}
                                                >
                                                    <div
                                                        className="balance-sheet-title-text"
                                                        style={{
                                                            fontSize: 30,
                                                            fontWeight: 800,
                                                            marginRight: "-49%",
                                                            marginTop: 18
                                                        }}
                                                    >
                                                        Balance Sheet
                                                    </div>
                                                    <span
                                                        id="report-date"
                                                        className="balance-sheet-date-text"
                                                        style={{
                                                            fontSize: 18,
                                                            marginRight: "-49%"
                                                        }}
                                                    >
                                                        {reportDate}
                                                    </span>
                                                </div>
                                            </div>
                                        </Col>
                                    </Row>

                                    <div id="dynamic-balncessheet" className="card mt-3 mb-3">
                                        <div className="table-responsive">
                                            <table
                                                ref={tableRef}
                                                className="table table-bordered nowrap mb-0 balance-sheet-report-table"
                                                style={{ width: "100%" }}
                                            >
                                                <thead>
                                                    <tr className="balance-sheet-section-row">
                                                        <th colSpan={3}>Liabilities</th>
                                                        <th colSpan={3}>Assets</th>
                                                    </tr>
                                                    <tr className="balance-sheet-column-row">
                                                        {columns.map((col) => (
                                                            <th key={col.key}>{col.header}</th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {reportData.map((item, index) => (
                                                        <tr key={`${item.LAccGrpName}-${item.AAccGrpName}-${index}`}>
                                                            {columns.map((col) => {
                                                                const val = item[col.key];
                                                                const num = parseFloat(val);

                                                                if (SUM_COLUMNS.includes(col.key)) {
                                                                    return (
                                                                        <td key={col.key} className="balance-sheet-amount-cell">
                                                                            {!Number.isNaN(num) ? num.toFixed(2) : ""}
                                                                        </td>
                                                                    );
                                                                }

                                                                if (NAME_COLUMNS.includes(col.key)) {
                                                                    const name = val ?? "";
                                                                    return (
                                                                        <td key={col.key} className="balance-sheet-name-cell">
                                                                            {name ? (
                                                                                <a
                                                                                    href="#!"
                                                                                    className="balance-sheet-account-link"
                                                                                    onClick={(e) => {
                                                                                        e.preventDefault();
                                                                                        openLedgerModal(name);
                                                                                    }}
                                                                                >
                                                                                    {name}
                                                                                </a>
                                                                            ) : null}
                                                                        </td>
                                                                    );
                                                                }

                                                                return (
                                                                    <td key={col.key} className="balance-sheet-name-cell">
                                                                        {val ?? ""}
                                                                    </td>
                                                                );
                                                            })}
                                                        </tr>
                                                    ))}
                                                    <tr className="balance-sheet-total-row">
                                                        {columns.map((col) => {
                                                            if (SUM_COLUMNS.includes(col.key)) {
                                                                return (
                                                                    <td key={col.key} className="balance-sheet-amount-cell">
                                                                        {grandTotal[col.key].toFixed(2)}
                                                                    </td>
                                                                );
                                                            }
                                                            return <td key={col.key} />;
                                                        })}
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    <div id="cpny-footer" className="mt-3 mb-1">
                                        {companyInfo?.companyFooter}
                                    </div>
                                </div>
                            ) : null}
                        </>
                    )}
                </Container>
            </div>

            <Modal
                id="ledgerModal"
                isOpen={ledgerModalOpen}
                toggle={closeLedgerModal}
                size="xl"
                scrollable
                centered
            >
                <ModalHeader toggle={closeLedgerModal}>{t("Account Ledger")}</ModalHeader>
                <ModalBody>
                    <div id="company-infos" className="mb-2 border-bottom pb-2">
                        <div className="d-flex">
                            <div style={{ paddingLeft: 10, paddingTop: 14 }}>
                                {logoUrl ? (
                                    <img
                                        src={logoUrl}
                                        alt="Company Logo"
                                        style={{ maxHeight: 90, width: 96 }}
                                    />
                                ) : null}
                            </div>
                            <div
                                className="ledger-modal-header-meta"
                                style={{
                                    fontSize: 14,
                                    lineHeight: 1.8,
                                    paddingTop: 14,
                                    paddingLeft: 15,
                                    width: "100%"
                                }}
                            >
                                <div style={{ fontSize: 13, fontWeight: "bold" }}>
                                    {companyInfo?.companyName}
                                </div>
                                <div style={{ fontSize: 13 }}>{companyInfo?.companyAddress}</div>
                                <div style={{ fontSize: 13 }}>
                                    <strong>Tel:</strong> {companyInfo?.companyPhone}
                                </div>
                                <div style={{ fontSize: 13 }}>
                                    <strong>Email:</strong> {companyInfo?.companyEmail}
                                </div>
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "flex-end",
                                        marginTop: -90,
                                        marginRight: 20
                                    }}
                                >
                                    <span
                                        id="modalAccountName"
                                        style={{ fontSize: 25, fontWeight: 800 }}
                                    >
                                        {modalAccountName}
                                    </span>
                                    <span id="modalFromDate" style={{ fontSize: 16, fontWeight: "bold" }}>
                                        ACCOUNT LEDGER : FROM DATE : {modalFromDate}
                                    </span>
                                    <span id="modalToDate" style={{ fontSize: 16, fontWeight: "bold" }}>
                                        To Date : {modalToDate}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div id="dynamicbal-LedgerReport">
                        {ledgerLoading ? (
                            <div className="text-center py-4">
                                <Spinner color="primary" />
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table
                                    className="table table-bordered nowrap mb-0 ledger-modal-table"
                                    style={{ width: "100%" }}
                                >
                                    <thead>
                                        <tr>
                                            {ledgerColumns.map((col) => (
                                                <th key={col.key}>{col.header}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {ledgerRows.map((item, index) => (
                                            <tr key={`${item.JVDate}-${item.VType}-${index}`}>
                                                {ledgerColumns.map((col) => {
                                                    let val = item[col.key] ?? "";
                                                    if (col.key === "JVDate" && val) {
                                                        val = formatLedgerDate(val);
                                                    }
                                                    if (LEDGER_AMOUNT_COLUMNS.includes(col.key)) {
                                                        val = formatLocalAmount(val);
                                                    }
                                                    if (col.key === "VType") {
                                                        return (
                                                            <td key={col.key} className="text-center">
                                                                {item.VType ?? ""}
                                                            </td>
                                                        );
                                                    }
                                                    return (
                                                        <td
                                                            key={col.key}
                                                            className={
                                                                LEDGER_AMOUNT_COLUMNS.includes(col.key)
                                                                    ? "ledger-modal-amount"
                                                                    : ""
                                                            }
                                                        >
                                                            {val}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                        <tr className="ledger-modal-total-row">
                                            {ledgerColumns.map((col) => {
                                                if (col.key === "JVDate") {
                                                    return <td key={col.key}>Grand Total :</td>;
                                                }
                                                if (LEDGER_SUM_COLUMNS.includes(col.key)) {
                                                    return (
                                                        <td key={col.key} className="ledger-modal-amount">
                                                            {ledgerGrandTotal[col.key].toFixed(2)}
                                                        </td>
                                                    );
                                                }
                                                return <td key={col.key} />;
                                            })}
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </ModalBody>
            </Modal>
        </React.Fragment>
    );
};

export default BalanceSheetReport;
