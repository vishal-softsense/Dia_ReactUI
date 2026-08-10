import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Button,
    Card,
    CardBody,
    Col,
    Container,
    FormGroup,
    Label,
    Row,
    Spinner,
    Table
} from "reactstrap";
import Select from "react-select";
import { toast, ToastContainer } from "react-toastify";

import BreadCrumb from "../../../Components/Common/BreadCrumb";
import { useSettingReportDates } from "../../../Components/Hooks/useSettingReportDates";
import {
    getAccGrpMasters,
    getLedgerReportList1,
    getLedgerReportLists,
    getLedgerReportPrintJS,
    getSettingData
} from "../../../helpers/fakebackend_helper";
import {
    getCachedReportCompany,
    getReportCompanySettings,
    resolveCompanyLogoUrl
} from "../../../helpers/reportCompanyDefaults";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const REPORT_STYLES = [
    { value: "Dual Ledger", label: "Dual Ledger" },
    { value: "Running Balance Ledger", label: "Running Balance Ledger" }
];

const JV_LINK_TYPES = new Set(["JV", "JVPAY", "JVREC", "PAY", "REC", "IPAY", "IREC"]);

const fmtPrintAmt = (value) => {
    const n = Number(value);
    if (Number.isNaN(n)) return "0.00";
    return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const escapeHtml = (value) =>
    String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

/**
 * Builds HTML matching MVC Views/AccReport/LedgerReportJS_Print.cshtml
 * (tight spacing — no empty filler rows that create blank print pages).
 */
const writeLedgerPrintWindow = (printWin, printData, company) => {
    if (!printWin || printWin.closed) {
        throw new Error("Print window was closed.");
    }

    const items = Array.isArray(printData?.Items || printData?.items)
        ? printData.Items || printData.items
        : [];
    // Browser print fits fewer rows than Rotativa PDF — keep pages compact
    const rowsPerPage = 28;
    const totalItems = items.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage) || 1);

    const partyName = printData?.PartyName || printData?.partyName || "";
    const throuhDate = printData?.ThrouhDate || printData?.throuhDate || printData?.DateRange || "";
    const toDate = printData?.ToDate || printData?.toDate || printData?.GenerateDate || "";
    const balanceAmt = printData?.BalanceAmt ?? printData?.balanceAmt ?? 0;
    const address1 = printData?.AddressLine1 || printData?.addressLine1 || "";
    const address2 = printData?.AddressLine2 || printData?.addressLine2 || "";
    const address3 = printData?.AddressLine3 || printData?.addressLine3 || "";

    const logo = resolveCompanyLogoUrl(company?.companyLogo) || "";
    const companyName = company?.companyName || "";
    const companyAdd = company?.companyAddress || "";
    const companyAdd1 = company?.companyAddress1 || "";
    const companyAdd2 = company?.companyAddress2 || "";
    const companyNum = company?.companyPhone || "";
    const companyEmail = company?.companyEmail || "";
    const companyFooter = company?.companyFooter || "";

    const renderHeader = () => `
        <table class="hdr-table">
            <tr>
                <td class="hdr-logo">
                    ${logo ? `<img src="${escapeHtml(logo)}" alt="" />` : ""}
                </td>
                <td class="hdr-company">
                    <div class="co-name">${escapeHtml(companyName)}</div>
                    <div>${escapeHtml(companyAdd)}</div>
                    <div>${escapeHtml(companyAdd1)}</div>
                    <div>${escapeHtml(companyAdd2)}</div>
                    <div class="co-contact"><b>Tel:</b>&nbsp;&nbsp;${escapeHtml(companyNum)}</div>
                    <div class="co-contact"><b>Email:</b>&nbsp;&nbsp;${escapeHtml(companyEmail)}</div>
                </td>
                <td class="hdr-title">
                    <div class="statement-word">STATEMENT</div>
                </td>
            </tr>
        </table>

        <table class="meta-table">
            <tr>
                <td class="meta-left">
                    <fieldset class="address-box">
                        <legend>Consigned To:</legend>
                        <div class="party-name">${escapeHtml(partyName)}</div>
                        ${address1 ? `<div>${escapeHtml(address1)}</div>` : ""}
                        ${address2 ? `<div>${escapeHtml(address2)}</div>` : ""}
                        ${address3 ? `<div>${escapeHtml(address3)}</div>` : ""}
                    </fieldset>
                </td>
                <td class="meta-gap"></td>
                <td class="meta-right">
                    <div class="statement-box">
                        <div class="statement-title">Statement Period</div>
                        <div class="statement-content">${escapeHtml(throuhDate)}</div>
                    </div>
                    <div class="generated-on">Generated on ${escapeHtml(toDate)}</div>
                </td>
            </tr>
        </table>`;

    let pagesHtml = "";
    for (let page = 0; page < totalPages; page++) {
        const isLastPage = page === totalPages - 1;
        const skip = page * rowsPerPage;
        const pageItems = items.slice(skip, skip + rowsPerPage);
        let srNo = skip + 1;

        const rowsHtml = pageItems
            .map((item) => {
                const jv = item.JVDate || item.jvDate || "";
                const vtype = item.VType || item.vType || "";
                const account = item.Account || item.account || "";
                const invNo = item.InvNo || item.invNo || "";
                const debit = item.StockDebit ?? item.stockDebit;
                const credit = item.StockCredit ?? item.stockCredit;
                const bal = item.StockFinalAmount ?? item.stockFinalAmount;
                const row = `
                    <tr>
                        <td class="c-sr">${srNo}</td>
                        <td class="c-date">${escapeHtml(jv)}</td>
                        <td class="c-type">${escapeHtml(vtype)}</td>
                        <td class="c-desc">${escapeHtml(account)}</td>
                        <td class="c-ref">${escapeHtml(invNo)}</td>
                        <td class="c-amt">${fmtPrintAmt(debit)}</td>
                        <td class="c-amt">${fmtPrintAmt(credit)}</td>
                        <td class="c-amt">${fmtPrintAmt(bal)}</td>
                    </tr>`;
                srNo += 1;
                return row;
            })
            .join("");

        const totalsRow = isLastPage
            ? `<tr class="total-row">
                    <td colspan="6"></td>
                    <td colspan="2" class="total-amt">${fmtPrintAmt(balanceAmt)}</td>
               </tr>`
            : "";

        pagesHtml += `
            <div class="print-page${page < totalPages - 1 ? " page-break" : ""}">
                ${renderHeader()}
                <table class="invoice-item-table">
                    <thead>
                        <tr>
                            <th>Sr No</th>
                            <th>DATE</th>
                            <th>Type</th>
                            <th>DESCRIPTION</th>
                            <th>REF #</th>
                            <th>CHARGES/DEBITS</th>
                            <th>CREDITS</th>
                            <th>BALANCE</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml || `<tr><td colspan="8" style="text-align:center;">&nbsp;</td></tr>`}
                        ${totalsRow}
                    </tbody>
                </table>
                <div class="page-footer">
                    <span>${escapeHtml(companyFooter)}</span>
                    <span>${page + 1}</span>
                </div>
            </div>`;
    }

    const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <title>Ledger_${escapeHtml(partyName)}</title>
    <style>
        * { box-sizing: border-box; }
        html, body {
            margin: 0;
            padding: 0;
            font-family: Verdana, Arial, sans-serif;
            font-size: 12px;
            color: #000;
            background: #fff;
        }
        .print-page { padding: 8px 12px 6px; }
        .page-break { page-break-after: always; break-after: page; }

        .hdr-table { width: 100%; border-collapse: collapse; margin: 0 0 4px; }
        .hdr-logo { width: 13%; vertical-align: top; }
        .hdr-logo img { width: 80px; height: auto; display: block; }
        .hdr-company { width: 48%; vertical-align: top; font-size: 12px; line-height: 1.35; padding-left: 6px; }
        .co-name { font-weight: bold; font-size: 14px; margin-bottom: 2px; }
        .co-contact { margin-top: 2px; }
        .hdr-title { width: 39%; vertical-align: middle; text-align: center; }
        .statement-word { font-weight: bold; font-size: 32px; letter-spacing: 0.5px; padding-top: 18px; }

        .meta-table { width: 100%; border-collapse: collapse; margin: 4px 0 6px; }
        .meta-left { width: 50%; vertical-align: top; padding-right: 8px; }
        .meta-gap { width: 4%; }
        .meta-right { width: 46%; vertical-align: top; padding-left: 8px; }

        .address-box {
            border: 1px solid #000;
            border-radius: 10px;
            padding: 4px 10px 6px;
            margin: 0;
            min-height: 0;
        }
        .address-box legend {
            font-weight: bold;
            font-size: 13px;
            padding: 0 8px;
            margin-left: 8px;
            background: #fff;
            border: none;
            width: auto;
        }
        .address-box div { line-height: 1.35; font-size: 13px; margin: 0 0 1px; }
        .party-name { font-size: 14px; }

        .statement-box {
            border: 1px solid #000;
            border-radius: 10px;
            overflow: hidden;
            width: 100%;
            margin: 0;
        }
        .statement-title {
            text-align: center;
            font-weight: bold;
            padding: 4px 0;
            border-bottom: 1px solid #000;
            font-size: 13px;
        }
        .statement-content {
            text-align: center;
            padding: 4px 0;
            font-size: 13px;
        }
        .generated-on {
            text-align: center;
            font-size: 13px;
            padding-top: 2px;
            margin: 0;
        }

        .invoice-item-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            margin: 0;
        }
        .invoice-item-table th {
            background-color: #BFBFBF !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            border: 1px solid #000;
            padding: 4px 2px;
            text-align: center;
            font-size: 8px;
            font-weight: bold;
        }
        .invoice-item-table td {
            border: 1px solid #000;
            padding: 2px 5px;
            vertical-align: middle;
            height: 20px;
            font-size: 8px;
        }
        .c-sr { text-align: left; width: 6%; }
        .c-date { text-align: left; width: 11%; }
        .c-type { text-align: left; width: 8%; }
        .c-desc { text-align: left; width: 22%; }
        .c-ref { text-align: right; width: 10%; }
        .c-amt { text-align: right; width: 14%; }

        .total-row td {
            border: 1px solid #000;
            font-weight: bold;
        }
        .total-amt {
            text-align: right !important;
            font-size: 16px !important;
            font-weight: bold;
            padding: 4px 6px !important;
        }

        .page-footer {
            margin-top: 6px;
            display: flex;
            justify-content: space-between;
            font-size: 12px;
        }

        @page { size: A4 landscape; margin: 8mm; }
        @media print {
            body { margin: 0; }
            .print-page { padding: 0; }
        }
    </style>
</head>
<body>
${pagesHtml}
<script>
    window.onload = function () {
        setTimeout(function () { window.focus(); window.print(); }, 250);
    };
</script>
</body>
</html>`;

    printWin.document.open();
    printWin.document.write(html);
    printWin.document.close();
    try {
        printWin.focus();
    } catch {
        /* ignore */
    }
};
/** MVC Ledger.js setlink / setlink1 URL map */
const VTYPE_URL_MAP = {
    PPUR: "/purchaseparcel/edit-purchaseparcel",
    PUR: "/purchase/edit-purchase",
    SALE: "/sale/edit-sale",
    PSALE: "/saleParcel/edit-saleParcel",
    CPUR: "/mix-purchase/edit-mixpur",
    CSALE: "/mix/edit-mixdata",
    PJEW: "/jewpurchase/edit-jew-purchase",
    SJEW: "/jewsale/edit-jew-sale",
    PPurRtn: "/PurchaseParcelReturn/edit-ppurchasertnview",
    PSaleRtn: "/SaleReturnPartial/edit-salereturnParcel",
    PurRtn: "/purchasereturn/edit-purchasereturn",
    SaleRtn: "/salereturn/edit-salereturn",
    CPurrtn: "/MixPurchaseReturn/edit-mixpurchasertndata",
    CSaleRtn: "/MixSaleReturn/edit-mixsalereturnParcel",
    SJEWRtn: "/jewsalertn/edit-jew-salereturn",
    MJEW: "/jewMemo/edit-jew-Memo",
    JV: "/JournalEntry/GetJournalEntries",
    JVPAY: "/Payment/GetJVEdit",
    JVREC: "/Payment/GetJVEdit",
    PAY: "/Payment/GetIncomeExpense",
    REC: "/Payment/GetIncomeExpense",
    IPAY: "/Payment/GetPayment",
    IREC: "/Payment/GetPayment"
};

const getRowVal = (row, ...keys) => {
    if (!row) return undefined;
    for (const key of keys) {
        if (Object.prototype.hasOwnProperty.call(row, key) && row[key] !== undefined && row[key] !== null) {
            return row[key];
        }
        const match = Object.keys(row).find((k) => k.toLowerCase() === String(key).toLowerCase());
        if (match && row[match] !== undefined && row[match] !== null) {
            return row[match];
        }
    }
    return undefined;
};

const safeText = (value) => {
    if (value === null || value === undefined || value === "" || value === "None") return "";
    return String(value);
};

const toNumber = (value) => {
    if (value === null || value === undefined || value === "") return 0;
    const n = parseFloat(String(value).replace(/,/g, ""));
    return Number.isNaN(n) ? 0 : n;
};

const formatLedgerDate = (value) => {
    if (value === null || value === undefined || value === "") return "";
    const text = String(value);

    const msMatch = /Date\((\d+)\)/.exec(text);
    if (msMatch) {
        const d = new Date(parseInt(msMatch[1], 10));
        if (!Number.isNaN(d.getTime())) {
            return `${String(d.getDate()).padStart(2, "0")}-${MONTH_NAMES[d.getMonth()]}-${d.getFullYear()}`;
        }
    }

    const d = new Date(text);
    if (!Number.isNaN(d.getTime())) {
        return `${String(d.getDate()).padStart(2, "0")}-${MONTH_NAMES[d.getMonth()]}-${d.getFullYear()}`;
    }

    return text;
};

const formatAnyDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
};

/** Running balance date: DD MMM YYYY (MVC formatDate) */
const formatRunningDate = (value) => {
    if (value === null || value === undefined || value === "") return "";
    const text = String(value);
    const msMatch = /Date\((\d+)\)/.exec(text);
    const d = msMatch ? new Date(parseInt(msMatch[1], 10)) : new Date(text);
    if (Number.isNaN(d.getTime())) return text;
    return `${String(d.getDate()).padStart(2, "0")} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
};

/**
 * MVC Dual Ledger = 1 SP row -> 1 table row (DataTables columns).
 * Right side uses Date1 / DueDate1 / VType1 / Account1 / Carats1
 * (API renames duplicate SP columns the same way MVC DataTable.Load does).
 */
const mapDualLedgerRow = (row) => ({
    date: getRowVal(row, "Date", "date", "TrnDate", "trnDate"),
    dueDate: getRowVal(row, "DueDate", "dueDate"),
    vtype: safeText(getRowVal(row, "VType", "vType")),
    account: safeText(getRowVal(row, "Account", "account", "DebitAccount", "debitAccount")),
    carats: getRowVal(row, "Carats", "carats"),
    sDebit: getRowVal(row, "SDebitAmount", "sDebitAmount", "SDebit", "sDebit"),
    mDebit: getRowVal(row, "MDebitAmount", "mDebitAmount", "MDebit", "mDebit"),
    invDesc: safeText(getRowVal(row, "InvDescription", "invDescription", "Description")),
    date1: getRowVal(row, "Date1", "date1", "TrnDate1", "trnDate1"),
    dueDate1: getRowVal(row, "DueDate1", "dueDate1"),
    vtype1: safeText(getRowVal(row, "VType1", "vType1")),
    account1: safeText(getRowVal(row, "Account1", "account1", "CreditAccount", "creditAccount")),
    carats1: getRowVal(row, "Carats1", "carats1"),
    sCredit: getRowVal(row, "SCreditAmount", "sCreditAmount", "SCredit", "sCredit"),
    mCredit: getRowVal(row, "MCreditAmount", "mCreditAmount", "MCredit", "mCredit"),
    invDesc1: safeText(getRowVal(row, "InvDescription1", "invDescription1", "Description1")),
    gCode: getRowVal(row, "GCode", "gCode"),
    vCode: getRowVal(row, "VCode", "vCode", "Vcode", "vcode"),
    gCode1: getRowVal(row, "GCode1", "gCode1"),
    vCode1: getRowVal(row, "VCode1", "vCode1")
});

const fmtCarats = (value) => {
    if (value === null || value === undefined || value === "") return "";
    const num = Number(value);
    if (Number.isNaN(num)) return String(value);
    return String(num);
};

const fmtAmt = (value) => {
    const num = toNumber(value);
    return num.toFixed(2);
};

const openVTypeLink = (id, vtype) => {
    if (!vtype || !id) return;
    const path = VTYPE_URL_MAP[vtype];
    if (!path) return;
    window.open(`${path}?Id=${encodeURIComponent(id)}&Mode=view`, "_blank");
};

const VTypeLink = ({ vtype, gCode, vCode }) => {
    if (!vtype) return null;
    const linkId = JV_LINK_TYPES.has(vtype) ? gCode : vCode;
    if (linkId === null || linkId === undefined || linkId === "") {
        return <span>{vtype}</span>;
    }
    return (
        <a
            href="#"
            className="ledger-vtype-link"
            onClick={(e) => {
                e.preventDefault();
                openVTypeLink(linkId, vtype);
            }}
        >
            {vtype}
        </a>
    );
};

/* Same dark/light theme select styles as MixSaleReport (CSS vars follow Velzon theme). */
const customSelectStyles = {
    control: (provided) => ({
        ...provided,
        backgroundColor: "var(--vz-secondary-bg, #fff)",
        borderColor: "var(--vz-border-color, #ced4da)",
        color: "var(--vz-body-color, #495057)",
        minHeight: "35px",
        height: "auto",
        fontSize: 13
    }),
    valueContainer: (provided) => ({
        ...provided,
        minHeight: "35px",
        padding: "2px 6px",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        rowGap: "4px"
    }),
    input: (provided) => ({
        ...provided,
        margin: "0px",
        padding: "0px",
        color: "var(--vz-body-color, #495057)"
    }),
    indicatorSeparator: () => ({ display: "none" }),
    indicatorsContainer: (provided) => ({
        ...provided,
        minHeight: "35px",
        height: "35px",
        alignSelf: "flex-start"
    }),
    menu: (provided) => ({
        ...provided,
        backgroundColor: "var(--vz-secondary-bg, #fff)",
        color: "var(--vz-body-color, #495057)",
        border: "1px solid var(--vz-border-color, #dee2e6)",
        zIndex: 20
    }),
    menuList: (provided) => ({
        ...provided,
        backgroundColor: "var(--vz-secondary-bg, #fff)",
        color: "var(--vz-body-color, #495057)"
    }),
    option: (provided, state) => ({
        ...provided,
        backgroundColor: state.isFocused
            ? "#3b5de7"
            : state.isSelected
                ? "rgba(59, 93, 231, 0.25)"
                : "transparent",
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
        fontSize: "10px",
        borderRadius: "4px",
        margin: "2px"
    }),
    clearIndicator: (provided) => ({
        ...provided,
        color: "var(--vz-secondary-color, #878a99)",
        padding: "4px",
        ":hover": { color: "var(--vz-body-color, #495057)" }
    }),
    dropdownIndicator: (provided) => ({
        ...provided,
        color: "var(--vz-secondary-color, #878a99)",
        padding: "4px",
        ":hover": { color: "var(--vz-body-color, #495057)" }
    })
};

const LedgerReport = () => {
    const { t } = useTranslation();
    const printRef = useRef(null);
    const { fromDate, toDate, getDates, mergeDates } = useSettingReportDates();

    const [filters, setFilters] = useState(() =>
        mergeDates({ reportStyle: "Dual Ledger", curcode: 0 }, { fromDate, toDate })
    );
    const [selectedParty, setSelectedParty] = useState(null);
    const [partyOptions, setPartyOptions] = useState([]);
    const [partyInput, setPartyInput] = useState("");
    const [loadingParties, setLoadingParties] = useState(false);
    const [loading, setLoading] = useState(false);
    const [printing, setPrinting] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [reportMode, setReportMode] = useState(null);
    const [dualRows, setDualRows] = useState([]);
    const [runningRows, setRunningRows] = useState([]);
    const [companyInfo, setCompanyInfo] = useState(() => getCachedReportCompany());
    const [stockSymbol, setStockSymbol] = useState("");
    const [masterSymbol, setMasterSymbol] = useState("");

    const loadSymbols = useCallback(async () => {
        try {
            const cached = getCachedReportCompany();
            let sSym = cached.stockSymbol || "";
            let mSym = "";

            const auth = JSON.parse(sessionStorage.getItem("authUser") || localStorage.getItem("authUser") || "{}");
            sSym = sSym || auth?.SSymbol || auth?.sSymbol || auth?.data?.SSymbol || "";
            mSym = auth?.MSymbol || auth?.mSymbol || auth?.data?.MSymbol || "";

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
        } catch {
            setStockSymbol("USD");
            setMasterSymbol("INR");
        }
    }, []);

    useEffect(() => {
        loadSymbols();
        getReportCompanySettings({ forceRefresh: true })
            .then((c) => setCompanyInfo(c || getCachedReportCompany()))
            .catch(() => setCompanyInfo(getCachedReportCompany()));
    }, [loadSymbols]);

    useEffect(() => {
        setFilters((prev) => mergeDates(prev, { fromDate, toDate }));
    }, [fromDate, toDate, mergeDates]);

    const handleAccountSearch = useCallback(async (term) => {
        setLoadingParties(true);
        try {
            const response = await getAccGrpMasters(term || "");
            const data = response?.data || response?.Data || (Array.isArray(response) ? response : []);
            setPartyOptions(
                (data || [])
                    .map((item) => {
                        const code = item.accGrpCode ?? item.AccGrpCode;
                        const name = item.accGrpName || item.AccGrpName || "";
                        if (code === null || code === undefined || code === "") return null;
                        return {
                            value: code,
                            label: String(name || code).toUpperCase(),
                            accGrpCode: code,
                            accGrpName: name
                        };
                    })
                    .filter(Boolean)
            );
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingParties(false);
        }
    }, []);

    useEffect(() => {
        handleAccountSearch("");
    }, [handleAccountSearch]);

    useEffect(() => {
        const timer = setTimeout(() => {
            handleAccountSearch(partyInput);
        }, 300);
        return () => clearTimeout(timer);
    }, [partyInput, handleAccountSearch]);

    const resetResults = () => {
        setDualRows([]);
        setRunningRows([]);
        setReportMode(null);
        setHasSearched(false);
    };

    const handleClear = async () => {
        const d = await getDates();
        setFilters(mergeDates({ reportStyle: "Dual Ledger", curcode: 0 }, d));
        setSelectedParty(null);
        setPartyInput("");
        resetResults();
        handleAccountSearch("");
    };

    const handleNewSelection = () => {
        setHasSearched(false);
        setDualRows([]);
        setRunningRows([]);
        setReportMode(null);
    };

    const handleReport = async () => {
        if (!selectedParty?.value && selectedParty?.value !== 0) {
            toast.warning(t("Please select a party before continuing."));
            return;
        }
        if (!filters.fromDate || !filters.toDate) {
            toast.warning(t("Please select From Date and To Date."));
            return;
        }

        const partyCode = parseInt(String(selectedParty.value), 10);
        if (Number.isNaN(partyCode)) {
            toast.warning(t("Invalid party selected."));
            return;
        }

        const payload = {
            FromDate: filters.fromDate,
            ToDate: filters.toDate,
            Party: partyCode,
            Curcode: filters.curcode || 0,
            PartyName: selectedParty.accGrpName || selectedParty.label || ""
        };

        setLoading(true);
        try {
            const company = await getReportCompanySettings();
            if (company) setCompanyInfo(company);

            if (filters.reportStyle === "Dual Ledger") {
                const response = await getLedgerReportLists(payload);
                const list = response?.data || response?.Data || [];
                setDualRows(Array.isArray(list) ? list : []);
                setRunningRows([]);
                setReportMode("dual");
                setHasSearched(true);
                toast.success(t("Report loaded successfully."));
            } else {
                const response = await getLedgerReportList1(payload);
                if (response?.success === false) {
                    toast.warning(safeText(response?.Data || response?.data || t("No data found.")));
                    return;
                }
                const list = response?.Data || response?.data || [];
                setRunningRows(Array.isArray(list) ? list : []);
                setDualRows([]);
                setReportMode("running");
                setHasSearched(true);
                toast.success(t("Report loaded successfully."));
            }
        } catch (err) {
            console.error(err);
            toast.error(err?.response?.data?.message || err?.message || t("Error fetching ledger report."));
        } finally {
            setLoading(false);
        }
    };

    const handleLedgerPrint = async () => {
        if (!selectedParty?.value && selectedParty?.value !== 0) {
            toast.warning(t("Please select a party before continuing."));
            return;
        }
        if (!filters.fromDate || !filters.toDate) {
            toast.warning(t("Please select From Date and To Date."));
            return;
        }

        const partyCode = parseInt(String(selectedParty.value), 10);
        if (Number.isNaN(partyCode)) {
            toast.warning(t("Invalid party selected."));
            return;
        }

        // Open window synchronously on click — browsers block window.open() after await
        const printWin = window.open("about:blank", "_blank");
        if (!printWin) {
            toast.error(t("Popup blocked. Please allow popups for ledger print."));
            return;
        }
        try {
            printWin.document.write(
                "<!DOCTYPE html><html><head><title>Ledger Print</title></head>" +
                "<body style=\"font-family:Verdana,Arial,sans-serif;padding:24px;color:#333;\">" +
                "<p>Loading ledger statement...</p></body></html>"
            );
            printWin.document.close();
        } catch {
            /* ignore */
        }

        const payload = {
            FromDate: filters.fromDate,
            ToDate: filters.toDate,
            Party: partyCode,
            Curcode: filters.curcode || 0,
            PartyName: selectedParty.accGrpName || selectedParty.label || ""
        };

        setPrinting(true);
        try {
            const company = await getReportCompanySettings();
            if (company) setCompanyInfo(company);

            const response = await getLedgerReportPrintJS(payload);
            if (response?.success === false) {
                try {
                    printWin.close();
                } catch {
                    /* ignore */
                }
                toast.error(response?.message || t("Error generating ledger print."));
                return;
            }

            const printData = response?.data || response?.Data;
            if (!printData) {
                try {
                    printWin.close();
                } catch {
                    /* ignore */
                }
                toast.warning(t("No data found."));
                return;
            }

            writeLedgerPrintWindow(printWin, printData, company || companyInfo || getCachedReportCompany());
        } catch (err) {
            console.error(err);
            try {
                if (printWin && !printWin.closed) printWin.close();
            } catch {
                /* ignore */
            }
            toast.error(err?.response?.data?.message || err?.message || t("Error generating ledger print."));
        } finally {
            setPrinting(false);
        }
    };

    const handlePrint = () => {
        if (!hasSearched || (!reportMode)) {
            toast.warning(t("Please generate a report first."));
            return;
        }

        const printArea = printRef.current || document.getElementById("ledger-print-area");
        if (!printArea) {
            toast.warning(t("No report is currently visible to print."));
            return;
        }

        // Open synchronously on click (avoid popup block), match MVC A4 landscape
        const printWin = window.open("about:blank", "_blank");
        if (!printWin) {
            toast.error(t("Popup blocked. Please allow popups for print."));
            return;
        }

        const title =
            reportMode === "dual"
                ? "Dual Ledger Report"
                : "Running Balance Ledger Report";

        const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <title>${escapeHtml(title)}</title>
    <style>
        * { box-sizing: border-box; }
        html, body {
            margin: 0;
            padding: 8px;
            font-family: Arial, Verdana, sans-serif;
            font-size: 11px;
            color: #000;
            background: #fff;
        }
        table {
            border-collapse: collapse;
            width: 100%;
            table-layout: auto;
        }
        th, td {
            border: 1px solid #000 !important;
            padding: 1px 4px !important;
            vertical-align: middle;
            line-height: 1.15;
            color: #000;
        }
        th {
            background-color: #dbdbdb !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            font-weight: 600;
            text-align: center;
        }
        .text-end, .text-right { text-align: right !important; }
        .text-start, .text-left { text-align: left !important; padding-left: 8px !important; }
        .text-center { text-align: center !important; }
        .text-nowrap { white-space: nowrap; }
        a { color: blue; text-decoration: underline; }
        #company-header { margin-bottom: 8px; padding-bottom: 6px; border-bottom: 1px solid #ccc; }
        #company-header .row {
            display: flex;
            flex-wrap: wrap;
            align-items: flex-start;
            width: 100%;
        }
        #company-header .col-md-7 { width: 58%; flex: 0 0 58%; }
        #company-header .col-md-5 { width: 42%; flex: 0 0 42%; text-align: right; }
        #company-header .d-flex { display: flex; }
        #cpny-footer { margin-top: 8px; font-size: 11px; }
        .table-responsive { width: 100%; overflow: visible; }
        table.table { width: 100%; }
        @page {
            size: A4 landscape;
            margin: 8mm;
        }
        @media print {
            html, body { margin: 0; padding: 0; }
        }
    </style>
</head>
<body>
${printArea.innerHTML}
<script>
    window.onload = function () {
        setTimeout(function () { window.focus(); window.print(); }, 250);
    };
</script>
</body>
</html>`;

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
            toast.error(t("Unable to open print window."));
        }
    };

    const dualMappedRows = useMemo(() => (dualRows || []).map(mapDualLedgerRow), [dualRows]);

    const dualTotals = useMemo(() => {
        let sDebit = 0;
        let mDebit = 0;
        let sCredit = 0;
        let mCredit = 0;
        dualMappedRows.forEach((row) => {
            sDebit += toNumber(row.sDebit);
            mDebit += toNumber(row.mDebit);
            sCredit += toNumber(row.sCredit);
            mCredit += toNumber(row.mCredit);
        });
        return { sDebit, mDebit, sCredit, mCredit };
    }, [dualMappedRows]);

    const runningTotals = useMemo(() => {
        const totals = {
            StockDebit: 0,
            StockCredit: 0,
            MasterDebit: 0,
            MasterCredit: 0
        };
        runningRows.forEach((row) => {
            totals.StockDebit += toNumber(getRowVal(row, "StockDebit", "stockDebit"));
            totals.StockCredit += toNumber(getRowVal(row, "StockCredit", "stockCredit"));
            totals.MasterDebit += toNumber(getRowVal(row, "MasterDebit", "masterDebit"));
            totals.MasterCredit += toNumber(getRowVal(row, "MasterCredit", "masterCredit"));
        });
        return totals;
    }, [runningRows]);

    const companyLogoUrl = resolveCompanyLogoUrl(companyInfo?.companyLogo);
    const partyTitle = selectedParty?.accGrpName || selectedParty?.label || "";

    const renderCompanyHeader = () => (
        <div className="border-bottom mb-2 pb-2 ledger-company-header" id="company-header">
            <Row className="align-items-start">
                <Col md={7} className="d-flex">
                    {companyLogoUrl ? (
                        <img
                            src={companyLogoUrl}
                            alt="Company Logo"
                            style={{ maxHeight: 90, width: 96, objectFit: "contain" }}
                        />
                    ) : null}
                    <div className="ledger-company-meta" style={{ fontSize: 13, lineHeight: 1.8, paddingLeft: 15 }}>
                        <div style={{ fontWeight: "bold" }}>{companyInfo?.companyName}</div>
                        <div>{companyInfo?.companyAddress}</div>
                        <div>{companyInfo?.companyAddress1}</div>
                        <div>{companyInfo?.companyAddress2}</div>
                        <div>
                            <strong>Tel:</strong> {companyInfo?.companyPhone}
                        </div>
                        <div>
                            <strong>Email:</strong> {companyInfo?.companyEmail}
                        </div>
                    </div>
                </Col>
                <Col md={5} className="text-end ledger-company-title">
                    <div style={{ fontSize: 22, fontWeight: 800 }}>{partyTitle}</div>
                    <div style={{ fontSize: 15, fontWeight: "bold" }}>
                        ACCOUNT LEDGER : FROM DATE : {formatAnyDate(filters.fromDate)}
                    </div>
                    <div style={{ fontSize: 15, fontWeight: "bold" }}>
                        TO DATE : {formatAnyDate(filters.toDate)}
                    </div>
                </Col>
            </Row>
        </div>
    );

    const renderDualTable = () => (
        <div className="table-responsive">
            <Table
                id="ledgerTable"
                bordered
                className="align-middle mb-0 ledger-report-table"
                style={{ fontSize: "0.8rem", textAlign: "center" }}
            >
                <thead>
                    <tr className="text-center ledger-thead-row">
                        <th>{t("Date")}</th>
                        <th>{t("Due Date")}</th>
                        <th>{t("VType")}</th>
                        <th>{t("Debit Account")}</th>
                        <th>{t("Carats")}</th>
                        <th>{stockSymbol ? `${stockSymbol} Amt` : t("USD Amt")}</th>
                        <th>{masterSymbol ? `${masterSymbol} Amt` : t("INR Amt")}</th>
                        <th>{t("Description")}</th>
                        <th>{t("Date")}</th>
                        <th>{t("Due Date")}</th>
                        <th>{t("VType")}</th>
                        <th>{t("Credit Account")}</th>
                        <th>{t("Carats")}</th>
                        <th>{stockSymbol ? `${stockSymbol} Amt` : t("USD Amt")}</th>
                        <th>{masterSymbol ? `${masterSymbol} Amt` : t("INR Amt")}</th>
                        <th>{t("Description")}</th>
                    </tr>
                </thead>
                <tbody>
                    {dualMappedRows.length === 0 ? (
                        <tr>
                            <td colSpan={16} className="text-center text-muted py-4">
                                {t("No data found.")}
                            </td>
                        </tr>
                    ) : (
                        dualMappedRows.map((row, idx) => (
                            <tr key={`dual-${idx}`}>
                                <td className="text-center text-nowrap">{formatLedgerDate(row.date)}</td>
                                <td className="text-center text-nowrap">{formatLedgerDate(row.dueDate)}</td>
                                <td className="text-center text-nowrap">
                                    <VTypeLink vtype={row.vtype} gCode={row.gCode} vCode={row.vCode} />
                                </td>
                                <td className="text-start text-nowrap">{row.account}</td>
                                <td className="text-end text-nowrap">{fmtCarats(row.carats)}</td>
                                <td className="text-end text-nowrap">{fmtAmt(row.sDebit)}</td>
                                <td className="text-end text-nowrap">{fmtAmt(row.mDebit)}</td>
                                <td className="text-start">{row.invDesc}</td>
                                <td className="text-center text-nowrap">{formatLedgerDate(row.date1)}</td>
                                <td className="text-center text-nowrap">{formatLedgerDate(row.dueDate1)}</td>
                                <td className="text-center text-nowrap">
                                    <VTypeLink vtype={row.vtype1} gCode={row.gCode1} vCode={row.vCode1} />
                                </td>
                                <td className="text-start text-nowrap">{row.account1}</td>
                                <td className="text-end text-nowrap">{fmtCarats(row.carats1)}</td>
                                <td className="text-end text-nowrap">{fmtAmt(row.sCredit)}</td>
                                <td className="text-end text-nowrap">{fmtAmt(row.mCredit)}</td>
                                <td className="text-start">{row.invDesc1}</td>
                            </tr>
                        ))
                    )}
                </tbody>
                {dualMappedRows.length > 0 ? (
                    <tfoot>
                        <tr className="ledger-total-row">
                            <td colSpan={5} className="text-end">
                                {t("Total")}:
                            </td>
                            <td className="text-end">{dualTotals.sDebit.toFixed(2)}</td>
                            <td className="text-end">{dualTotals.mDebit.toFixed(2)}</td>
                            <td />
                            <td />
                            <td />
                            <td />
                            <td />
                            <td />
                            <td className="text-end">{dualTotals.sCredit.toFixed(2)}</td>
                            <td className="text-end">{dualTotals.mCredit.toFixed(2)}</td>
                            <td />
                        </tr>
                        <tr id="closing-bal-row">
                            {Array.from({ length: 16 }).map((_, i) => {
                                // MVC LedgerReport.cshtml footerCallback indices
                                const closingTdStyle = {
                                    fontWeight: "bold",
                                    textAlign: "right"
                                };
                                if (i === 2) {
                                    return (
                                        <td key={i} style={{ fontWeight: "bold", textAlign: "right" }}>
                                            {t("Closing Bal.")}
                                        </td>
                                    );
                                }
                                if (i === 6 && dualTotals.sDebit > dualTotals.sCredit) {
                                    return (
                                        <td key={i} className="ledger-closing-amt" style={closingTdStyle}>
                                            {(dualTotals.sDebit - dualTotals.sCredit).toFixed(2)}
                                        </td>
                                    );
                                }
                                if (i === 11 && dualTotals.sCredit > dualTotals.sDebit) {
                                    return (
                                        <td key={i} className="ledger-closing-amt" style={closingTdStyle}>
                                            {(dualTotals.sCredit - dualTotals.sDebit).toFixed(2)}
                                        </td>
                                    );
                                }
                                if (i === 5 && dualTotals.mDebit > dualTotals.mCredit) {
                                    return (
                                        <td key={i} className="ledger-closing-amt" style={closingTdStyle}>
                                            {(dualTotals.mDebit - dualTotals.mCredit).toFixed(2)}
                                        </td>
                                    );
                                }
                                if (i === 14 && dualTotals.mCredit > dualTotals.mDebit) {
                                    return (
                                        <td key={i} className="ledger-closing-amt" style={closingTdStyle}>
                                            {(dualTotals.mCredit - dualTotals.mDebit).toFixed(2)}
                                        </td>
                                    );
                                }
                                return <td key={i} />;
                            })}
                        </tr>
                    </tfoot>
                ) : null}
            </Table>
        </div>
    );

    const renderRunningTable = () => (
        <div className="table-responsive">
            <Table
                id="dynamic-LedgerReport"
                bordered
                className="align-middle mb-0 ledger-report-table"
                style={{ fontSize: "0.8rem" }}
            >
                <thead>
                    <tr className="text-center ledger-thead-row">
                        <th>{t("jvdate")}</th>
                        <th>{t("type")}</th>
                        <th>{t("description")}</th>
                        <th>{`debit ${stockSymbol} `}</th>
                        <th>{`credit ${stockSymbol} `}</th>
                        <th>{t("cL balance")}</th>
                        <th>{`debit ${masterSymbol} `}</th>
                        <th>{`credit ${masterSymbol} `}</th>
                        <th>{t("c balance")}</th>
                    </tr>
                </thead>
                <tbody>
                    {runningRows.length === 0 ? (
                        <tr>
                            <td colSpan={9} className="text-center text-muted py-4">
                                {t("No data found.")}
                            </td>
                        </tr>
                    ) : (
                        runningRows.map((row, idx) => {
                            const vtype = safeText(getRowVal(row, "VType", "vType"));
                            const gCode = getRowVal(row, "GCode", "gCode");
                            const vCode = getRowVal(row, "vcode", "Vcode", "VCode", "vCode");
                            return (
                                <tr key={`run-${idx}`}>
                                    <td className="text-nowrap">
                                        {formatRunningDate(getRowVal(row, "JVDate", "jvDate", "FormattedJvDate"))}
                                    </td>
                                    <td className="text-center text-nowrap">
                                        <VTypeLink vtype={vtype} gCode={gCode} vCode={vCode} />
                                    </td>
                                    <td style={{ whiteSpace: "pre", minWidth: 242 }}>
                                        {safeText(getRowVal(row, "Account", "account"))}
                                    </td>
                                    <td className="text-end">
                                        {fmtAmt(getRowVal(row, "StockDebit", "stockDebit"))}
                                    </td>
                                    <td className="text-end">
                                        {fmtAmt(getRowVal(row, "StockCredit", "stockCredit"))}
                                    </td>
                                    <td className="text-end">
                                        {fmtAmt(getRowVal(row, "StockFinalAmount", "stockFinalAmount"))}
                                    </td>
                                    <td className="text-end">
                                        {fmtAmt(getRowVal(row, "MasterDebit", "masterDebit"))}
                                    </td>
                                    <td className="text-end">
                                        {fmtAmt(getRowVal(row, "MasterCredit", "masterCredit"))}
                                    </td>
                                    <td className="text-end">
                                        {fmtAmt(getRowVal(row, "MasterFinalAmount", "masterFinalAmount"))}
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
                {runningRows.length > 0 ? (
                    <tfoot>
                        <tr className="ledger-total-row">
                            <td style={{ textAlign: "left" }}>{t("Grand Total")}:</td>
                            <td />
                            <td />
                            <td className="text-end">{runningTotals.StockDebit.toFixed(2)}</td>
                            <td className="text-end">{runningTotals.StockCredit.toFixed(2)}</td>
                            <td />
                            <td className="text-end">{runningTotals.MasterDebit.toFixed(2)}</td>
                            <td className="text-end">{runningTotals.MasterCredit.toFixed(2)}</td>
                            <td />
                        </tr>
                    </tfoot>
                ) : null}
            </Table>
        </div>
    );

    document.title = `${t("Ledger Report")} | ${t("Account Report")}`;

    return (
        <React.Fragment>
            <ToastContainer position="top-right" autoClose={2500} />
            <style>{`
                .ledger-company-header,
                .ledger-company-meta,
                .ledger-company-title {
                    color: var(--vz-body-color, #212529);
                }
                .ledger-report-table {
                    color: var(--vz-body-color, #212529);
                    --bs-table-bg: transparent;
                    --bs-table-color: var(--vz-body-color, #212529);
                    --bs-table-border-color: var(--vz-border-color, #dee2e6);
                }
                .ledger-report-table > :not(caption) > * > * {
                    border-color: var(--vz-border-color, #dee2e6);
                    color: inherit;
                    background-color: transparent;
                }
                .ledger-report-table .ledger-thead-row,
                .ledger-report-table .ledger-thead-row > th {
                    background-color: #dbdbdb !important;
                    color: #212529 !important;
                }
                .ledger-report-table .ledger-total-row,
                .ledger-report-table .ledger-total-row > td {
                    background-color: #e8e8e8 !important;
                    color: #212529 !important;
                    font-weight: bold;
                }
                .ledger-report-table .ledger-closing-amt {
                    color: #0a58ca !important;
                }
                .ledger-report-table a,
                .ledger-vtype-link {
                    color: #0d6efd;
                    text-decoration: underline;
                }

                [data-layout-mode="dark"] .ledger-company-header,
                [data-bs-theme="dark"] .ledger-company-header,
                [data-layout-mode="dark"] .ledger-company-meta,
                [data-bs-theme="dark"] .ledger-company-meta,
                [data-layout-mode="dark"] .ledger-company-title,
                [data-bs-theme="dark"] .ledger-company-title {
                    color: var(--vz-body-color, #e9ecef) !important;
                }
                [data-layout-mode="dark"] .ledger-report-table,
                [data-bs-theme="dark"] .ledger-report-table {
                    color: var(--vz-body-color, #e9ecef) !important;
                    --bs-table-color: var(--vz-body-color, #e9ecef);
                    --bs-table-border-color: var(--vz-border-color, #32383e);
                    --bs-table-bg: transparent;
                }
                [data-layout-mode="dark"] .ledger-report-table > :not(caption) > * > *,
                [data-bs-theme="dark"] .ledger-report-table > :not(caption) > * > * {
                    border-color: var(--vz-border-color, #32383e) !important;
                    color: inherit !important;
                    background-color: transparent !important;
                }
                [data-layout-mode="dark"] .ledger-report-table .ledger-thead-row,
                [data-bs-theme="dark"] .ledger-report-table .ledger-thead-row,
                [data-layout-mode="dark"] .ledger-report-table .ledger-thead-row > th,
                [data-bs-theme="dark"] .ledger-report-table .ledger-thead-row > th {
                    background-color: #2b303c !important;
                    color: #f3f6f9 !important;
                }
                [data-layout-mode="dark"] .ledger-report-table .ledger-total-row,
                [data-bs-theme="dark"] .ledger-report-table .ledger-total-row,
                [data-layout-mode="dark"] .ledger-report-table .ledger-total-row > td,
                [data-bs-theme="dark"] .ledger-report-table .ledger-total-row > td {
                    background-color: #353b48 !important;
                    color: #ffffff !important;
                }
                [data-layout-mode="dark"] .ledger-report-table tbody tr:nth-child(even) > td,
                [data-bs-theme="dark"] .ledger-report-table tbody tr:nth-child(even) > td {
                    background-color: rgba(255, 255, 255, 0.03) !important;
                }
                [data-layout-mode="dark"] .ledger-report-table .ledger-closing-amt,
                [data-bs-theme="dark"] .ledger-report-table .ledger-closing-amt {
                    color: #6ea8fe !important;
                }
                [data-layout-mode="dark"] .ledger-report-table a,
                [data-bs-theme="dark"] .ledger-report-table a,
                [data-layout-mode="dark"] .ledger-vtype-link,
                [data-bs-theme="dark"] .ledger-vtype-link {
                    color: #6ea8fe !important;
                }
            `}</style>

            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title={t("Ledger Report")} pageTitle={t("Account Report")} />

                    <div className="card stock-search-header-bar d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between mb-3 p-3 rounded-3 shadow-sm border gap-2">
                        <h5 className="mb-0 fw-bold text-primary d-flex align-items-center gap-2">
                            <i
                                className={
                                    hasSearched
                                        ? "ri-database-2-line fs-20 text-primary"
                                        : "ri-search-eye-line fs-20 text-primary"
                                }
                            />
                            {hasSearched ? t("Ledger Report Results") : t("Ledger Report Filters")}
                        </h5>

                        <div className="d-flex flex-wrap gap-2">
                            {!hasSearched ? (
                                <>
                                    <Button
                                        color="primary"
                                        className="btn-sm rounded-2 px-3 py-1"
                                        onClick={handleLedgerPrint}
                                        disabled={loading || printing}
                                    >
                                        {printing ? (
                                            <>
                                                <Spinner size="sm" className="me-1" />
                                                {t("Loading...")}
                                            </>
                                        ) : (
                                            t("Ledger Print")
                                        )}
                                    </Button>
                                    <Button
                                        color="primary"
                                        className="btn-sm rounded-2 px-3 py-1"
                                        onClick={handleReport}
                                        disabled={loading || printing}
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
                                        disabled={loading}
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
                                    <Button
                                        color="primary"
                                        className="btn-sm rounded-2 px-3 py-1"
                                        onClick={handleLedgerPrint}
                                        disabled={printing}
                                    >
                                        {printing ? (
                                            <>
                                                <Spinner size="sm" className="me-1" />
                                                {t("Loading...")}
                                            </>
                                        ) : (
                                            t("Ledger Print")
                                        )}
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>

                    {!hasSearched ? (
                        <Card className="shadow-lg border-0 rounded-3 mb-4">
                            <CardBody className="bg-light-subtle">
                                <Row className="g-2">
                                    <Col sm={3}>
                                        <FormGroup className="mb-0">
                                            <Label className="fw-medium mb-1 small">{t("From Date")}</Label>
                                            <input
                                                type="date"
                                                className="form-control form-control-sm"
                                                style={{ height: "35px" }}
                                                value={filters.fromDate || ""}
                                                onChange={(e) =>
                                                    setFilters((prev) => ({ ...prev, fromDate: e.target.value }))
                                                }
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col sm={3}>
                                        <FormGroup className="mb-0">
                                            <Label className="fw-medium mb-1 small">{t("To Date")}</Label>
                                            <input
                                                type="date"
                                                className="form-control form-control-sm"
                                                style={{ height: "35px" }}
                                                value={filters.toDate || ""}
                                                onChange={(e) =>
                                                    setFilters((prev) => ({ ...prev, toDate: e.target.value }))
                                                }
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col sm={3}>
                                        <FormGroup className="mb-0">
                                            <Label className="fw-medium mb-1 small">{t("Party")}</Label>
                                            <Select
                                                classNamePrefix="react-select"
                                                styles={customSelectStyles}
                                                isClearable
                                                options={partyOptions}
                                                value={selectedParty}
                                                onMenuOpen={() => {
                                                    setPartyInput("");
                                                    handleAccountSearch("");
                                                }}
                                                onInputChange={(val, { action }) => {
                                                    if (action === "input-change") setPartyInput(val);
                                                }}
                                                onChange={(sel) => {
                                                    setSelectedParty(sel);
                                                    if (!sel) {
                                                        setPartyInput("");
                                                        handleAccountSearch("");
                                                    }
                                                }}
                                                placeholder={t("Search Party")}
                                                isLoading={loadingParties}
                                                maxMenuHeight={280}
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col sm={3}>
                                        <FormGroup className="mb-0">
                                            <Label className="fw-medium mb-1 small">{t("Report Style")}</Label>
                                            <Select
                                                classNamePrefix="react-select"
                                                styles={customSelectStyles}
                                                options={REPORT_STYLES.map((x) => ({
                                                    value: x.value,
                                                    label: t(x.label)
                                                }))}
                                                value={{
                                                    value: filters.reportStyle,
                                                    label: t(filters.reportStyle)
                                                }}
                                                onChange={(sel) =>
                                                    setFilters((prev) => ({
                                                        ...prev,
                                                        reportStyle: sel?.value || "Dual Ledger"
                                                    }))
                                                }
                                            />
                                        </FormGroup>
                                    </Col>
                                </Row>
                            </CardBody>
                        </Card>
                    ) : (
                        <Card className="shadow-lg border-0 rounded-3 mb-4">
                            <CardBody>
                                <div ref={printRef} id="ledger-print-area">
                                    {renderCompanyHeader()}
                                    {reportMode === "dual" ? renderDualTable() : null}
                                    {reportMode === "running" ? renderRunningTable() : null}
                                    {companyInfo?.companyFooter ? (
                                        <div className="mt-3 mb-1" id="cpny-footer">
                                            {companyInfo.companyFooter}
                                        </div>
                                    ) : null}
                                </div>
                            </CardBody>
                        </Card>
                    )}
                </Container>
            </div>
        </React.Fragment>
    );
};

export default LedgerReport;