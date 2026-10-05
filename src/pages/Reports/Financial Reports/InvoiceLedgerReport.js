import React, { useCallback, useEffect, useMemo, useState } from "react";
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
    Spinner,
    Table
} from "reactstrap";
import Select from "react-select";
import { toast, ToastContainer } from "react-toastify";

import BreadCrumb from "../../../Components/Common/BreadCrumb";
import { useSettingReportDates } from "../../../Components/Hooks/useSettingReportDates";
import { loadExcelJS } from "../../../helpers/excel_helper";
import {
    getAccGrpMasters,
    getInvoiceLedgerReport,
    getInvoiceLedgerReportPermission
} from "../../../helpers/fakebackend_helper";
import { openReportTxnView, resolveVTypePath } from "../../../helpers/reportTxnLinks";
import {
    getCachedReportCompany,
    getReportCompanySettings,
    resolveCompanyLogoUrl
} from "../../../helpers/reportCompanyDefaults";

const INTEREST_DAY_OPTIONS = [
    { value: "30", label: "30" },
    { value: "365", label: "365" }
];

const COLUMNS = [
    { header: "Date", key: "TrnDate", isDate: true },
    { header: "Inv.No", key: "InvNo" },
    { header: "Bill.No", key: "BillNo" },
    { header: "Inv.Type", key: "InvType" },
    { header: "Trn.Type", key: "TrnType" },
    { header: "Broker", key: "BrokerName" },
    { header: "Tot.Cts.", key: "TotCts", isNum: true, sum: true },
    { header: "Tot.Amt.", key: "StockCurrencyFinalAmount", isNum: true, sum: true },
    { header: "DueDate", key: "DueDate", isDate: true },
    { header: "PRDate", key: "PayRecDate", isDate: true },
    { header: "Paid Amt.", key: "PayRecStockCurrencyAmount", isNum: true, sum: true },
    { header: "Ex.Diff", key: "ExDiff" },
    { header: "Balance Amount", key: "StockCurrencyRemainAmount", isNum: true },
    { header: "Mode of Payment", key: "ModeOfPayment" },
    { header: "PRDays", key: "PayRecDays" },
    { header: "Interest", key: "StockCurrencyInterest", isNum: true, sum: true }
];

const SUM_KEYS = COLUMNS.filter((c) => c.sum).map((c) => c.key);

const getRowVal = (row, key) => {
    if (!row || !key) return "";
    if (row[key] !== undefined && row[key] !== null && row[key] !== "") return row[key];
    const camel = key.charAt(0).toLowerCase() + key.slice(1);
    if (row[camel] !== undefined && row[camel] !== null && row[camel] !== "") return row[camel];
    const lower = String(key).toLowerCase();
    const found = Object.keys(row).find((k) => String(k).toLowerCase() === lower);
    return found != null ? row[found] : "";
};

const numVal = (row, key) => {
    const raw = getRowVal(row, key);
    if (raw === "" || raw === null || raw === undefined) return 0;
    const n = parseFloat(String(raw).replace(/,/g, ""));
    return Number.isNaN(n) ? 0 : n;
};

const formatDate = (value) => {
    if (!value) return "";
    const str = String(value);
    const match = /Date\((\d+)\)/.exec(str);
    if (match) {
        const d = new Date(parseInt(match[1], 10));
        return Number.isNaN(d.getTime()) ? str : d.toLocaleDateString();
    }
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d.toLocaleDateString();
    return str;
};

const fmtFixed = (value) => {
    const n = Number(value);
    if (Number.isNaN(n)) return "";
    return n.toFixed(2);
};

/** MVC Invoice Ledger setlink — open sale/parcel/mix edit in view mode. */
const openTxnLink = (code, trnType) => {
    // Sale forms read `Id` (case-sensitive); map CSALE → mix, etc. via shared helper.
    // Unknown types fall back to SALE (same as MVC else-branch).
    const type = String(trnType || "").trim();
    openReportTxnView(code, resolveVTypePath(type) ? type : "SALE");
};

const InvoiceLedgerReport = () => {
    const { t } = useTranslation();
    const { fromDate, toDate, getDates, mergeDates } = useSettingReportDates({
        includeDueDates: true
    });

    const [authorized, setAuthorized] = useState(true);
    const [loading, setLoading] = useState(false);
    const [checkingPermission, setCheckingPermission] = useState(true);
    const [hasSearched, setHasSearched] = useState(false);
    const [reportData, setReportData] = useState([]);
    const [companyInfo, setCompanyInfo] = useState(() => getCachedReportCompany());
    const [reportDate, setReportDate] = useState("");
    const [partyInfo, setPartyInfo] = useState("");

    const [filters, setFilters] = useState(() =>
        mergeDates({
            intedatadays: "30",
            intedataper: "1",
            paidInvoice: false,
            invNo: "",
            billNo: ""
        })
    );

    const [selectedParty, setSelectedParty] = useState(null);
    const [selectedCommission, setSelectedCommission] = useState(null);
    const [partyOptions, setPartyOptions] = useState([]);
    const [commissionOptions, setCommissionOptions] = useState([]);
    const [partyInput, setPartyInput] = useState("");
    const [commissionInput, setCommissionInput] = useState("");
    const [loadingParties, setLoadingParties] = useState(false);
    const [loadingCommissions, setLoadingCommissions] = useState(false);

    const customStyles = useMemo(
        () => ({
            control: (provided, state) => ({
                ...provided,
                backgroundColor: "var(--vz-secondary-bg, #fff)",
                borderColor: state.isFocused ? "#3b5de7" : "var(--vz-border-color, #ced4da)",
                boxShadow: state.isFocused ? "0 0 0 1px #3b5de7" : "none",
                color: "var(--vz-body-color, #495057)",
                minHeight: "35px",
                height: "auto",
                fontSize: 13,
                "&:hover": {
                    borderColor: state.isFocused ? "#3b5de7" : "var(--vz-border-color, #ced4da)"
                }
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
        }),
        []
    );

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setCheckingPermission(true);
            try {
                const permission = await getInvoiceLedgerReportPermission();
                if (cancelled) return;
                if (permission?.success === false) {
                    setAuthorized(false);
                    toast.error(permission?.message || t("You are not authorized to perform this task."));
                } else {
                    setAuthorized(true);
                }
            } catch (err) {
                if (cancelled) return;
                const status = err?.response?.status || err?.status;
                if (status === 403) {
                    setAuthorized(false);
                    toast.error(t("You are not authorized to perform this task."));
                }
            } finally {
                if (!cancelled) setCheckingPermission(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [t]);

    useEffect(() => {
        getReportCompanySettings({ forceRefresh: true })
            .then((c) => setCompanyInfo(c || getCachedReportCompany()))
            .catch(() => setCompanyInfo(getCachedReportCompany()));
    }, []);

    useEffect(() => {
        setFilters((prev) => mergeDates(prev));
    }, [fromDate, toDate, mergeDates]);

    const mapAccountOptions = (data) =>
        (data || [])
            .map((item) => {
                const code = item.accGrpCode ?? item.AccGrpCode;
                const name = item.accGrpName || item.AccGrpName || "";
                if (code === null || code === undefined || code === "") return null;
                return {
                    value: String(code),
                    label: String(name || code).toUpperCase(),
                    accGrpCode: code,
                    accGrpName: name
                };
            })
            .filter(Boolean);

    const handlePartySearch = useCallback(async (term) => {
        setLoadingParties(true);
        try {
            const response = await getAccGrpMasters(term || "");
            const data = response?.data || response?.Data || (Array.isArray(response) ? response : []);
            setPartyOptions(mapAccountOptions(data));
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingParties(false);
        }
    }, []);

    const handleCommissionSearch = useCallback(async (term) => {
        setLoadingCommissions(true);
        try {
            const response = await getAccGrpMasters(term || "");
            const data = response?.data || response?.Data || (Array.isArray(response) ? response : []);
            setCommissionOptions(mapAccountOptions(data));
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingCommissions(false);
        }
    }, []);

    useEffect(() => {
        handlePartySearch("");
        handleCommissionSearch("");
    }, [handlePartySearch, handleCommissionSearch]);

    useEffect(() => {
        const timer = setTimeout(() => {
            handlePartySearch(partyInput);
        }, 300);
        return () => clearTimeout(timer);
    }, [partyInput, handlePartySearch]);

    useEffect(() => {
        const timer = setTimeout(() => {
            handleCommissionSearch(commissionInput);
        }, 300);
        return () => clearTimeout(timer);
    }, [commissionInput, handleCommissionSearch]);

    const buildPayload = () => ({
        FromDate: filters.fromDate || null,
        ToDate: filters.toDate || null,
        FromDateDue: filters.fromDateDue || null,
        ToDateDue: filters.toDateDue || null,
        FromDueChkBox: false,
        Summary: false,
        PaidInvoice: !!filters.paidInvoice,
        PaidBrokerage: false,
        PartyName: selectedParty?.accGrpName || selectedParty?.label || null,
        BrokerName: selectedCommission?.accGrpName || selectedCommission?.label || null,
        intedatadays: filters.intedatadays || "30",
        intedataper: filters.intedataper != null && filters.intedataper !== ""
            ? String(filters.intedataper)
            : "1",
        InvNo: filters.invNo || null,
        BillNo: filters.billNo || null
    });

    const handleSearch = async () => {
        setLoading(true);
        try {
            const response = await getInvoiceLedgerReport(buildPayload());
            if (response?.success === false) {
                toast.error(response?.message || response?.Data || t("Error fetching invoice ledger report."));
                setReportData([]);
                setHasSearched(false);
                return;
            }

            if (response?.success !== true) {
                toast.warning(t("Please set Interest Calculation Days and %."));
                setReportData([]);
                setHasSearched(false);
                return;
            }

            const list = response?.data || response?.Data || [];
            setReportData(Array.isArray(list) ? list : []);
            setHasSearched(true);
            setPartyInfo(selectedParty?.label || "");

            const today = new Date().toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric"
            });
            setReportDate(`Date: ${today}`);
        } catch (err) {
            console.error(err);
            const status = err?.response?.status || err?.status;
            if (status === 403) {
                setAuthorized(false);
                toast.error(t("You are not authorized to perform this task."));
            } else {
                toast.error(err?.message || t("Error fetching invoice ledger report."));
            }
            setReportData([]);
            setHasSearched(false);
        } finally {
            setLoading(false);
        }
    };

    const handleClear = async () => {
        const d = await getDates();
        setFilters(
            mergeDates(
                {
                    intedatadays: "30",
                    intedataper: "1",
                    paidInvoice: false,
                    invNo: "",
                    billNo: ""
                },
                d
            )
        );
        setSelectedParty(null);
        setSelectedCommission(null);
        setPartyInput("");
        setCommissionInput("");
        setReportData([]);
        setHasSearched(false);
        setPartyInfo("");
        setReportDate("");
        handlePartySearch("");
        handleCommissionSearch("");
    };

    const handleNewSelection = () => {
        setHasSearched(false);
        setReportData([]);
        setPartyInfo("");
        setReportDate("");
    };

    const handleExportExcel = async () => {
        if (!reportData.length) {
            toast.warning(t("No report is currently visible to export."));
            return;
        }

        try {
            const ExcelJS = await loadExcelJS();
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet("InvoiceLedger");

            // Match MVC table2excel: blank first col + report columns
            const headers = ["", ...COLUMNS.map((c) => c.header)];
            const colCount = headers.length;
            const dateColIdx = 2; // Excel 1-based: col1 blank, col2 Date
            const colIndexByKey = {};
            COLUMNS.forEach((c, i) => {
                colIndexByKey[c.key] = i + 2;
            });

            const headerRow = worksheet.addRow(headers);
            headerRow.font = { bold: true, name: "Calibri", size: 11 };
            headerRow.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFEAEAEA" }
            };
            headerRow.alignment = { vertical: "middle", horizontal: "center" };

            const styleBoldRow = (row, fillArgb) => {
                row.font = { bold: true, name: "Calibri", size: 11 };
                if (fillArgb) {
                    row.eachCell({ includeEmpty: true }, (cell) => {
                        cell.fill = {
                            type: "pattern",
                            pattern: "solid",
                            fgColor: { argb: fillArgb }
                        };
                    });
                }
            };

            const blankRowValues = () => Array(colCount).fill("");

            const cellValue = (item, col) => {
                let v = getRowVal(item, col.key);
                if (col.isDate) return formatDate(v) || "";
                if (col.isNum || col.key === "StockCurrencyRemainAmount") {
                    const n = parseFloat(v);
                    return Number.isNaN(n) ? "" : Number(Number(n).toFixed(2));
                }
                if (col.key === "ExDiff") {
                    const n = parseFloat(v);
                    return Number.isNaN(n) || v === "" || v == null ? 0 : Number(Number(n).toFixed(2));
                }
                return v ?? "";
            };

            const grandTotal = SUM_KEYS.reduce((acc, c) => {
                acc[c] = 0;
                return acc;
            }, {});

            Object.keys(groupedRows).forEach((groupName) => {
                const items = groupedRows[groupName];
                const subtotal = SUM_KEYS.reduce((acc, c) => {
                    acc[c] = 0;
                    return acc;
                }, {});
                const invoiceSummaryMap = {};
                const renderedInvoices = new Set();
                let lastInvNo = "";

                // Party group heading (Column A) — matches Excel export style
                const groupRow = worksheet.addRow([groupName, ...Array(colCount - 1).fill("")]);
                styleBoldRow(groupRow, "FFF2F2F2");
                groupRow.getCell(1).alignment = { horizontal: "left" };

                items.forEach((item, i) => {
                    const rawInv = String(getRowVal(item, "InvNo") || "").trim();
                    if (rawInv) lastInvNo = rawInv;
                    const invNo = lastInvNo;

                    const interest = numVal(item, "StockCurrencyInterest");
                    const total = numVal(item, "StockCurrencyFinalAmount");
                    const paid = numVal(item, "PayRecStockCurrencyAmount");

                    if (!invoiceSummaryMap[invNo]) {
                        invoiceSummaryMap[invNo] = { Interest: 0, TotalAmount: 0, PaidAmount: 0 };
                    }
                    invoiceSummaryMap[invNo].Interest += interest;
                    invoiceSummaryMap[invNo].TotalAmount += total;
                    invoiceSummaryMap[invNo].PaidAmount += paid;

                    SUM_KEYS.forEach((c) => {
                        const v = numVal(item, c);
                        subtotal[c] += v;
                        grandTotal[c] += v;
                    });

                    const dataVals = blankRowValues();
                    COLUMNS.forEach((col, idx) => {
                        dataVals[idx + 1] = cellValue(item, col);
                    });
                    worksheet.addRow(dataVals);

                    const nextInv =
                        i === items.length - 1
                            ? null
                            : String(getRowVal(items[i + 1], "InvNo") || "").trim() || lastInvNo;

                    if (
                        invNo &&
                        !renderedInvoices.has(invNo) &&
                        (i === items.length - 1 || nextInv !== invNo)
                    ) {
                        renderedInvoices.add(invNo);
                        const summary = invoiceSummaryMap[invNo];
                        const invVals = blankRowValues();
                        invVals[dateColIdx - 1] = "Invoice Total:";
                        invVals[colIndexByKey.StockCurrencyFinalAmount - 1] = Number(
                            summary.TotalAmount.toFixed(2)
                        );
                        invVals[colIndexByKey.PayRecStockCurrencyAmount - 1] = Number(
                            summary.PaidAmount.toFixed(2)
                        );
                        invVals[colIndexByKey.StockCurrencyInterest - 1] = Number(
                            summary.Interest.toFixed(2)
                        );
                        const invRow = worksheet.addRow(invVals);
                        styleBoldRow(invRow);
                    }
                });

                // Subtotal heading row
                const subVals = blankRowValues();
                subVals[dateColIdx - 1] = "Subtotal:";
                SUM_KEYS.forEach((key) => {
                    subVals[colIndexByKey[key] - 1] = Number(subtotal[key].toFixed(2));
                });
                const subRow = worksheet.addRow(subVals);
                styleBoldRow(subRow, "FFF8F8F8");
            });

            // Grand Total
            const grandVals = blankRowValues();
            grandVals[dateColIdx - 1] = "Grand Total:";
            SUM_KEYS.forEach((key) => {
                grandVals[colIndexByKey[key] - 1] = Number(grandTotal[key].toFixed(2));
            });
            const grandRow = worksheet.addRow(grandVals);
            styleBoldRow(grandRow, "FFE8E8E8");

            worksheet.columns.forEach((column, i) => {
                let maxLen = headers[i] ? String(headers[i]).length : 8;
                column.eachCell({ includeEmpty: true }, (cell) => {
                    const valLen =
                        cell.value !== null && cell.value !== undefined
                            ? String(cell.value).length
                            : 0;
                    if (valLen > maxLen) maxLen = valLen;
                });
                column.width = Math.min(Math.max(maxLen + 2, 10), 28);
            });

            worksheet.views = [
                { state: "frozen", xSplit: 0, ySplit: 1, topLeftCell: "A2", activePane: "bottomLeft" }
            ];

            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = "Invoice-Ledger-Report.xlsx";
            link.click();
            URL.revokeObjectURL(link.href);
            toast.success(t("Excel exported successfully."));
        } catch (err) {
            console.error(err);
            toast.error(t("Excel export failed."));
        }
    };

    const groupedRows = useMemo(() => {
        const grouped = {};
        (reportData || []).forEach((item) => {
            const key = getRowVal(item, "PartyName") || "Unknown Party";
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(item);
        });
        return grouped;
    }, [reportData]);

    const renderGroupedTable = () => {
        const grandTotal = SUM_KEYS.reduce((acc, c) => {
            acc[c] = 0;
            return acc;
        }, {});

        const body = [];

        Object.keys(groupedRows).forEach((groupName) => {
            const items = groupedRows[groupName];
            const subtotal = SUM_KEYS.reduce((acc, c) => {
                acc[c] = 0;
                return acc;
            }, {});
            const invoiceSummaryMap = {};
            const renderedInvoices = new Set();
            const shownInvoices = new Set();
            let lastInvNo = "";

            body.push(
                <tr key={`g-${groupName}`} className="group-header">
                    <td style={{ textAlign: "left" }} colSpan={COLUMNS.length + 1}>
                        {groupName}
                    </td>
                </tr>
            );

            items.forEach((item, i) => {
                const rawInv = String(getRowVal(item, "InvNo") || "").trim();
                if (rawInv) lastInvNo = rawInv;
                const invNo = lastInvNo;

                const interest = numVal(item, "StockCurrencyInterest");
                const total = numVal(item, "StockCurrencyFinalAmount");
                const paid = numVal(item, "PayRecStockCurrencyAmount");

                if (!invoiceSummaryMap[invNo]) {
                    invoiceSummaryMap[invNo] = { Interest: 0, TotalAmount: 0, PaidAmount: 0 };
                }
                invoiceSummaryMap[invNo].Interest += interest;
                invoiceSummaryMap[invNo].TotalAmount += total;
                invoiceSummaryMap[invNo].PaidAmount += paid;

                SUM_KEYS.forEach((c) => {
                    const v = numVal(item, c);
                    subtotal[c] += v;
                    grandTotal[c] += v;
                });

                let actionCell = null;
                if (invNo && !shownInvoices.has(invNo)) {
                    const code = getRowVal(item, "Code");
                    const trnType = getRowVal(item, "TrnType");
                    actionCell = (
                        <a
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                openTxnLink(code, trnType);
                            }}
                        >
                            <i className="bx bx-show-alt" />
                        </a>
                    );
                    shownInvoices.add(invNo);
                }

                body.push(
                    <tr key={`r-${groupName}-${i}`}>
                        <td className="report-action text-center">{actionCell}</td>
                        {COLUMNS.map((col) => {
                            let v = getRowVal(item, col.key);
                            if (col.isDate) v = formatDate(v);
                            else if (col.isNum || col.key === "StockCurrencyRemainAmount") {
                                const n = parseFloat(v);
                                v = Number.isNaN(n) ? "" : n.toFixed(2);
                            }
                            return <td key={col.key}>{v || ""}</td>;
                        })}
                    </tr>
                );

                const nextInv = i === items.length - 1
                    ? null
                    : String(getRowVal(items[i + 1], "InvNo") || "").trim() || lastInvNo;

                if (invNo && !renderedInvoices.has(invNo) && (i === items.length - 1 || nextInv !== invNo)) {
                    renderedInvoices.add(invNo);
                    const summary = invoiceSummaryMap[invNo];
                    body.push(
                        <tr key={`inv-${groupName}-${invNo}`} className="invoice-subtotal">
                            <td />
                            {COLUMNS.map((col, idx) => {
                                let cell = "";
                                if (idx === 0) cell = <strong>Invoice Total:</strong>;
                                else if (col.key === "StockCurrencyFinalAmount")
                                    cell = <strong>{fmtFixed(summary.TotalAmount)}</strong>;
                                else if (col.key === "PayRecStockCurrencyAmount")
                                    cell = <strong>{fmtFixed(summary.PaidAmount)}</strong>;
                                else if (col.key === "StockCurrencyInterest")
                                    cell = <strong>{fmtFixed(summary.Interest)}</strong>;
                                return <td key={col.key}>{cell}</td>;
                            })}
                        </tr>
                    );
                }
            });

            body.push(
                <tr key={`sub-${groupName}`} className="subtotal">
                    <td />
                    {COLUMNS.map((col, idx) => {
                        let cell = "";
                        if (idx === 0) cell = <strong>Subtotal:</strong>;
                        else if (SUM_KEYS.includes(col.key))
                            cell = <strong>{fmtFixed(subtotal[col.key])}</strong>;
                        return <td key={col.key}>{cell}</td>;
                    })}
                </tr>
            );
        });

        body.push(
            <tr key="grand" className="grand-total">
                <td />
                {COLUMNS.map((col, idx) => {
                    let cell = "";
                    if (idx === 0) cell = <strong>Grand Total:</strong>;
                    else if (SUM_KEYS.includes(col.key))
                        cell = <strong>{fmtFixed(grandTotal[col.key])}</strong>;
                    return <td key={col.key}>{cell}</td>;
                })}
            </tr>
        );

        return body;
    };

    document.title = `${t("Invoice Ledger Report")} | ${t("Account Report")}`;
    const logoUrl = resolveCompanyLogoUrl(companyInfo?.companyLogo);

    return (
        <React.Fragment>
            <ToastContainer position="top-right" autoClose={2500} />
            <style>{`
                #company-info.invoice-ledger-report-paper {
                    color: var(--vz-body-color, #212529);
                }
                #dynamic-invoice-ledger-table-container {
                    max-height: 750px;
                    overflow: auto;
                    padding: 12px;
                    border: 1px solid var(--vz-border-color, #dcdcdc);
                    border-radius: 8px;
                    background-color: transparent;
                    color: var(--vz-body-color, #212529);
                }
                #dynamic-invoice-ledger-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 13px;
                    min-width: 1200px;
                    color: var(--vz-body-color, #212529);
                    --bs-table-color: var(--vz-body-color, #212529);
                    --bs-table-border-color: var(--vz-border-color, #dee2e6);
                    --bs-table-bg: transparent;
                }
                #dynamic-invoice-ledger-table thead th {
                    padding: 10px 12px;
                    border-bottom: 1px solid var(--vz-border-color, #999);
                    text-align: center;
                    font-weight: 600;
                    white-space: nowrap;
                    color: var(--vz-body-color, #212529);
                    background-color: var(--vz-tertiary-bg, #f2f2f2);
                }
                #dynamic-invoice-ledger-table tbody td {
                    padding: 8px 10px;
                    border-bottom: 1px solid var(--vz-border-color, #999);
                    text-align: right;
                    white-space: nowrap;
                    color: inherit;
                    background-color: transparent;
                }
                #dynamic-invoice-ledger-table tbody td.report-action {
                    text-align: center;
                }
                #dynamic-invoice-ledger-table tbody td.report-action a {
                    color: #0d6efd;
                }
                .group-header td {
                    font-weight: 700;
                    font-size: 15px;
                    padding: 10px !important;
                    border-top: 2px solid var(--vz-border-color, #b3b3b3);
                    border-bottom: 2px solid var(--vz-border-color, #b3b3b3);
                    color: var(--vz-body-color, #000) !important;
                    text-align: left !important;
                    background-color: var(--vz-tertiary-bg, #f2f2f2) !important;
                }
                .invoice-subtotal td {
                    font-weight: bold;
                    font-size: 14px;
                    text-align: right;
                    color: var(--vz-body-color, #212529) !important;
                }
                .subtotal td {
                    padding: 10px 15px;
                    font-size: 13px;
                    font-weight: bold;
                    border-top: 2px solid var(--vz-border-color, #999);
                    border-bottom: 2px solid var(--vz-border-color, #999);
                    color: var(--vz-body-color, #000) !important;
                    text-align: right;
                    background-color: var(--vz-tertiary-bg, #f8f8f8) !important;
                }
                .grand-total td {
                    font-weight: bold;
                    font-size: 15px;
                    text-align: right;
                    border-top: 2px solid var(--vz-border-color, #999);
                    border-bottom: 2px solid var(--vz-border-color, #999);
                    color: var(--vz-body-color, #212529) !important;
                    background-color: var(--vz-tertiary-bg, #e8e8e8) !important;
                }

                [data-layout-mode="dark"] #company-info.invoice-ledger-report-paper,
                [data-bs-theme="dark"] #company-info.invoice-ledger-report-paper {
                    color: var(--vz-body-color, #e9ecef) !important;
                    background-color: var(--vz-card-bg, #212529) !important;
                    border-color: var(--vz-border-color, #32383e) !important;
                }
                [data-layout-mode="dark"] #dynamic-invoice-ledger-table-container,
                [data-bs-theme="dark"] #dynamic-invoice-ledger-table-container {
                    border-color: var(--vz-border-color, #32383e) !important;
                    color: var(--vz-body-color, #e9ecef) !important;
                    background-color: transparent !important;
                }
                [data-layout-mode="dark"] #dynamic-invoice-ledger-table,
                [data-bs-theme="dark"] #dynamic-invoice-ledger-table {
                    color: var(--vz-body-color, #e9ecef) !important;
                    --bs-table-color: var(--vz-body-color, #e9ecef);
                    --bs-table-border-color: var(--vz-border-color, #32383e);
                    --bs-table-bg: transparent;
                }
                [data-layout-mode="dark"] #dynamic-invoice-ledger-table thead th,
                [data-bs-theme="dark"] #dynamic-invoice-ledger-table thead th {
                    background-color: #2b303c !important;
                    color: #f3f6f9 !important;
                    border-color: var(--vz-border-color, #32383e) !important;
                }
                [data-layout-mode="dark"] #dynamic-invoice-ledger-table tbody td,
                [data-bs-theme="dark"] #dynamic-invoice-ledger-table tbody td {
                    border-color: var(--vz-border-color, #32383e) !important;
                    color: var(--vz-body-color, #e9ecef) !important;
                    background-color: transparent !important;
                }
                [data-layout-mode="dark"] #dynamic-invoice-ledger-table tbody tr:nth-child(even) > td,
                [data-bs-theme="dark"] #dynamic-invoice-ledger-table tbody tr:nth-child(even) > td {
                    background-color: rgba(255, 255, 255, 0.03) !important;
                }
                [data-layout-mode="dark"] .group-header td,
                [data-bs-theme="dark"] .group-header td {
                    background-color: #2b2c32 !important;
                    color: #f3f6f9 !important;
                    border-color: var(--vz-border-color, #4a5060) !important;
                }
                [data-layout-mode="dark"] .invoice-subtotal td,
                [data-bs-theme="dark"] .invoice-subtotal td {
                    color: #f3f6f9 !important;
                }
                [data-layout-mode="dark"] .subtotal td,
                [data-bs-theme="dark"] .subtotal td {
                    background-color: #353b48 !important;
                    color: #ffffff !important;
                    border-color: var(--vz-border-color, #4a5060) !important;
                }
                [data-layout-mode="dark"] .grand-total td,
                [data-bs-theme="dark"] .grand-total td {
                    background-color: #3a4050 !important;
                    color: #ffffff !important;
                    border-color: var(--vz-border-color, #4a5060) !important;
                }
                [data-layout-mode="dark"] #dynamic-invoice-ledger-table tbody td.report-action a,
                [data-bs-theme="dark"] #dynamic-invoice-ledger-table tbody td.report-action a {
                    color: #6ea8fe !important;
                }
            `}</style>

            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title={t("Invoice Ledger Report")} pageTitle={t("Account Report")} />

                    <div className="card stock-search-header-bar d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between mb-3 p-3 rounded-3 shadow-sm border gap-2">
                        <h5 className="mb-0 fw-bold text-primary d-flex align-items-center gap-2">
                            <i
                                className={
                                    hasSearched
                                        ? "ri-database-2-line fs-20 text-primary"
                                        : "ri-search-eye-line fs-20 text-primary"
                                }
                            />
                            {hasSearched
                                ? t("Invoice Ledger Report Results")
                                : t("Invoice Ledger Report Filters")}
                        </h5>
                        <div className="d-flex flex-wrap gap-2">
                            {!hasSearched ? (
                                <>
                                    <Button
                                        color="primary"
                                        className="btn-sm rounded-2 px-3 py-1"
                                        onClick={handleSearch}
                                        disabled={loading || !authorized}
                                    >
                                        {loading ? (
                                            <>
                                                <Spinner size="sm" className="me-1" />
                                                {t("Loading...")}
                                            </>
                                        ) : (
                                            t("Invoice Report")
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
                                        color="soft-success"
                                        className="btn-sm rounded-2 px-3 py-1"
                                        onClick={handleExportExcel}
                                        disabled={loading || !reportData.length}
                                    >
                                        <i className="ri-file-excel-2-line align-middle me-1" />
                                        {t("Excel")}
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>

                    {checkingPermission ? (
                        <Card className="shadow-sm border-0">
                            <CardBody className="text-center py-5">
                                <Spinner color="primary" />
                            </CardBody>
                        </Card>
                    ) : !authorized ? (
                        <Card className="shadow-sm border-0">
                            <CardBody className="text-center text-danger py-5">
                                {t("You are not authorized to perform this task.")}
                            </CardBody>
                        </Card>
                    ) : (
                        <>
                            {!hasSearched ? (
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
                                                        onChange={(e) =>
                                                            setFilters((p) => ({ ...p, fromDate: e.target.value }))
                                                        }
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
                                                        onChange={(e) =>
                                                            setFilters((p) => ({ ...p, toDate: e.target.value }))
                                                        }
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
                                                        onChange={(e) =>
                                                            setFilters((p) => ({ ...p, fromDateDue: e.target.value }))
                                                        }
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
                                                        onChange={(e) =>
                                                            setFilters((p) => ({ ...p, toDateDue: e.target.value }))
                                                        }
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
                                                        value={selectedParty}
                                                        onMenuOpen={() => {
                                                            setPartyInput("");
                                                            handlePartySearch("");
                                                        }}
                                                        onInputChange={(val, { action }) => {
                                                            if (action === "input-change") setPartyInput(val);
                                                        }}
                                                        onChange={(sel) => {
                                                            setSelectedParty(sel);
                                                            if (!sel) {
                                                                setPartyInput("");
                                                                handlePartySearch("");
                                                            }
                                                        }}
                                                        placeholder={t("Search Party")}
                                                        isLoading={loadingParties}
                                                        maxMenuHeight={280}
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
                                                        options={commissionOptions}
                                                        value={selectedCommission}
                                                        onMenuOpen={() => {
                                                            setCommissionInput("");
                                                            handleCommissionSearch("");
                                                        }}
                                                        onInputChange={(val, { action }) => {
                                                            if (action === "input-change") setCommissionInput(val);
                                                        }}
                                                        onChange={(sel) => {
                                                            setSelectedCommission(sel);
                                                            if (!sel) {
                                                                setCommissionInput("");
                                                                handleCommissionSearch("");
                                                            }
                                                        }}
                                                        placeholder={t("Search Commission")}
                                                        isLoading={loadingCommissions}
                                                        maxMenuHeight={280}
                                                    />
                                                </FormGroup>
                                            </Col>
                                        </Row>

                                        <Row className="g-2 mb-2">
                                            <Col sm={2}>
                                                <FormGroup className="mb-0">
                                                    <Label className="fw-medium mb-1 small">
                                                        {t("Interest Calculation As Per Days")}
                                                    </Label>
                                                    <Select
                                                        classNamePrefix="react-select"
                                                        styles={customStyles}
                                                        options={INTEREST_DAY_OPTIONS}
                                                        value={
                                                            INTEREST_DAY_OPTIONS.find(
                                                                (o) => o.value === filters.intedatadays
                                                            ) || INTEREST_DAY_OPTIONS[0]
                                                        }
                                                        onChange={(sel) =>
                                                            setFilters((p) => ({
                                                                ...p,
                                                                intedatadays: sel?.value || "30"
                                                            }))
                                                        }
                                                    />
                                                </FormGroup>
                                            </Col>
                                            <Col sm={2}>
                                                <FormGroup className="mb-0">
                                                    <Label className="fw-medium mb-1 small">
                                                        {t("Interest Calculation %")}
                                                    </Label>
                                                    <Input
                                                        type="number"
                                                        className="form-control form-control-sm"
                                                        style={{ height: "35px" }}
                                                        list="interestRates"
                                                        value={filters.intedataper}
                                                        onChange={(e) =>
                                                            setFilters((p) => ({
                                                                ...p,
                                                                intedataper: e.target.value
                                                            }))
                                                        }
                                                    />
                                                    <datalist id="interestRates">
                                                        <option value="1" />
                                                        <option value="12" />
                                                    </datalist>
                                                </FormGroup>
                                            </Col>
                                            <Col sm={4}>
                                                <FormGroup className="mb-0">
                                                    <Label className="fw-medium mb-1 small d-block">&nbsp;</Label>
                                                    <div
                                                        className="d-flex flex-wrap align-items-center gap-3"
                                                        style={{ minHeight: "35px" }}
                                                    >
                                                        <div className="form-check mb-0">
                                                            <Input
                                                                className="form-check-input"
                                                                type="checkbox"
                                                                id="chkPaidInvoice"
                                                                checked={!!filters.paidInvoice}
                                                                onChange={(e) =>
                                                                    setFilters((p) => ({
                                                                        ...p,
                                                                        paidInvoice: e.target.checked
                                                                    }))
                                                                }
                                                            />
                                                            <Label
                                                                className="form-check-label small"
                                                                htmlFor="chkPaidInvoice"
                                                            >
                                                                {t("Show Paid Invoice")}
                                                            </Label>
                                                        </div>
                                                    </div>
                                                </FormGroup>
                                            </Col>
                                        </Row>

                                        <Row className="g-2">
                                            <Col sm={2}>
                                                <FormGroup className="mb-0">
                                                    <Label className="fw-medium mb-1 small">{t("Invoice No")}</Label>
                                                    <Input
                                                        type="text"
                                                        className="form-control form-control-sm"
                                                        style={{ height: "35px" }}
                                                        value={filters.invNo}
                                                        onChange={(e) =>
                                                            setFilters((p) => ({ ...p, invNo: e.target.value }))
                                                        }
                                                        placeholder={t("InvNo")}
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
                                                        onChange={(e) =>
                                                            setFilters((p) => ({ ...p, billNo: e.target.value }))
                                                        }
                                                        placeholder={t("Bill No")}
                                                    />
                                                </FormGroup>
                                            </Col>
                                        </Row>
                                    </CardBody>
                                </Card>
                            ) : null}

                            {hasSearched ? (
                                <Card className="shadow-lg border-0 rounded-3 mb-4">
                                    <CardBody>
                                        <div
                                            id="company-info"
                                            className="container-fluid mb-3 border-bottom pb-2 invoice-ledger-report-paper"
                                        >
                                            <div
                                                id="header"
                                                style={{
                                                    width: "100%",
                                                    display: "flex",
                                                    flexDirection: "row",
                                                    justifyContent: "space-between",
                                                    alignItems: "center",
                                                    gap: 15
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        flexDirection: "row",
                                                        alignItems: "center",
                                                        gap: 15,
                                                        flex: 1,
                                                        textAlign: "left"
                                                    }}
                                                >
                                                    {logoUrl ? (
                                                        <div style={{ paddingTop: 5 }}>
                                                            <img
                                                                src={logoUrl}
                                                                alt="Company Logo"
                                                                style={{ maxHeight: 90, width: 96, objectFit: "contain" }}
                                                            />
                                                        </div>
                                                    ) : null}
                                                    <div
                                                        style={{
                                                            fontSize: 13,
                                                            lineHeight: 1.8,
                                                            paddingTop: 5,
                                                            textAlign: "left"
                                                        }}
                                                    >
                                                        <div style={{ fontSize: 13, fontWeight: "bold" }}>
                                                            {companyInfo?.companyName}
                                                        </div>
                                                        {companyInfo?.companyAddress ? (
                                                            <div>{companyInfo.companyAddress}</div>
                                                        ) : null}
                                                        {companyInfo?.companyAddress1 ? (
                                                            <div>{companyInfo.companyAddress1}</div>
                                                        ) : null}
                                                        {companyInfo?.companyAddress2 ? (
                                                            <div>{companyInfo.companyAddress2}</div>
                                                        ) : null}
                                                        {companyInfo?.companyPhone ? (
                                                            <div>
                                                                <strong>Tel:</strong> {companyInfo.companyPhone}
                                                            </div>
                                                        ) : null}
                                                        {companyInfo?.companyEmail ? (
                                                            <div>
                                                                <strong>Email:</strong> {companyInfo.companyEmail}
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                </div>

                                                <div
                                                    style={{
                                                        flex: 1,
                                                        textAlign: "center",
                                                        display: "flex",
                                                        justifyContent: "center",
                                                        alignItems: "center"
                                                    }}
                                                >
                                                    {partyInfo ? (
                                                        <div
                                                            style={{
                                                                fontSize: 24,
                                                                fontWeight: "bold",
                                                                textTransform: "uppercase"
                                                            }}
                                                        >
                                                            {partyInfo}
                                                        </div>
                                                    ) : null}
                                                </div>

                                                <div
                                                    style={{
                                                        flex: 1,
                                                        textAlign: "right",
                                                        fontSize: 14,
                                                        lineHeight: 1.8,
                                                        paddingTop: 5,
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        alignItems: "flex-end"
                                                    }}
                                                >
                                                    <div style={{ fontSize: 25, fontWeight: "bold" }}>
                                                        {t("Invoice Ledger Report")}
                                                    </div>
                                                    <div style={{ fontSize: 14 }}>{reportDate}</div>
                                                </div>
                                            </div>
                                        </div>

                                        {loading ? (
                                            <div className="text-center py-5">
                                                <Spinner color="primary" />
                                            </div>
                                        ) : (
                                            <div id="dynamic-invoice-ledger-table-container">
                                                <Table
                                                    id="dynamic-invoice-ledger-table"
                                                    bordered
                                                    className="mb-0"
                                                >
                                                    <thead>
                                                        <tr>
                                                            <th />
                                                            {COLUMNS.map((col) => (
                                                                <th key={col.key}>{t(col.header)}</th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody>{renderGroupedTable()}</tbody>
                                                </Table>
                                            </div>
                                        )}

                                        {companyInfo?.companyFooter ? (
                                            <div className="mt-3">{companyInfo.companyFooter}</div>
                                        ) : null}
                                    </CardBody>
                                </Card>
                            ) : null}
                        </>
                    )}
                </Container>
            </div>
        </React.Fragment>
    );
};

export default InvoiceLedgerReport;