import React, { useCallback, useEffect, useMemo, useState } from "react";
import { flexRender } from "@tanstack/react-table";
import { useTranslation } from "react-i18next";
import { Button, Card, CardBody, Col, Container, FormGroup, Input, Label, Row } from "reactstrap";
import Select from "react-select";
import { toast, ToastContainer } from "react-toastify";

import BreadCrumb from "../../../Components/Common/BreadCrumb";
import TableContainer from "../../../Components/Common/TableContainer";
import { exportToExcel } from "../../../helpers/excel_helper";
import {
    getAccGrpMasters,
    getMixMemoOutRtnReport,
    getMixMemoOutRtnReportDropdowns
} from "../../../helpers/fakebackend_helper";
import { useSettingReportDates } from "../../../Components/Hooks/useSettingReportDates";

/** MVC safe(): empty → blank; numbers → fixed decimals */
const safeText = (value) => {
    if (value === null || value === undefined || value === "" || value === "None") return "";
    return String(value);
};

const safeFixed = (value, decimals) => {
    if (value === null || value === undefined || value === "" || value === "None") return "";
    const num = Number(value);
    if (Number.isNaN(num)) return "";
    return num.toFixed(decimals);
};

const fmtFixed = (value, decimals) => {
    if (value === null || value === undefined || value === "" || Number.isNaN(Number(value))) {
        return (0).toFixed(decimals);
    }
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
    jan: 1,
    feb: 2,
    mar: 3,
    apr: 4,
    may: 5,
    jun: 6,
    jul: 7,
    aug: 8,
    sep: 9,
    oct: 10,
    nov: 11,
    dec: 12
};

// Single source of truth for parsing a report date value (dd-mm-yyyy, dd-Mmm-yyyy,
// yyyy-mm-dd, or anything the Date constructor understands) into { day, month, year }.
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

    const parsed = new Date(text);
    if (!Number.isNaN(parsed.getTime())) {
        return { day: parsed.getDate(), month: parsed.getMonth() + 1, year: parsed.getFullYear() };
    }

    return null;
};

/** Display like dd-Mmm-yyyy, e.g. 19-Nov-2025 */
const formatReportDisplayDate = (value) => {
    if (value === null || value === undefined || value === "") return "";

    const parts = parseReportDateParts(value);
    if (!parts) {
        const text = String(value).trim();
        return text || "";
    }

    const d = String(parts.day).padStart(2, "0");
    const mmm = MONTH_NAMES[parts.month - 1] || "Jan";
    return `${d}-${mmm}-${parts.year}`;
};

/** Sort key: YYYYMMDD, so chronological sort is a plain string compare */
const getReportDateSortKey = (value) => {
    const parts = parseReportDateParts(value);
    if (!parts) return "00000000";
    const m = String(parts.month).padStart(2, "0");
    const d = String(parts.day).padStart(2, "0");
    return `${parts.year}${m}${d}`;
};

// Comparable Date object for the From/To Date range filter, built on the same parser.
const parseRowDateForCompare = (value) => {
    const parts = parseReportDateParts(value);
    if (!parts) return null;
    return new Date(parts.year, parts.month - 1, parts.day);
};

const getRowDateRaw = (row) => getRowVal(row, "TrnDate", "trnDate");

const MixMemoOutRtnReport = () => {
    const { t } = useTranslation();
    const { fromDate, toDate, getDates, mergeDates } = useSettingReportDates();

    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    const [dropdownData, setDropdownData] = useState({});

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
        lotNo: ""
    });

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
                alignItems: "center",
                rowGap: "4px"
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
            }),
            multiValue: (provided) => ({
                ...provided,
                backgroundColor: "var(--vz-light)",
                fontSize: "10px",
                borderRadius: "4px",
                margin: "2px"
            })
        }),
        []
    );

    const getOptions = useCallback(
        (dropdownKey) => {
            const keyVariants = {
                currency: ["currency", "Currency"]
            };

            const aliases = keyVariants[dropdownKey] || [dropdownKey];
            let list = [];
            for (const alias of aliases) {
                const candidate = dropdownData?.[alias];
                if (Array.isArray(candidate) && candidate.length) {
                    list = candidate;
                    break;
                }
            }

            return (list || []).map((item) => ({
                value: item?.id ?? item?.ID ?? item?.value ?? "",
                label: String(item?.name ?? item?.Name ?? item?.label ?? "").toUpperCase()
            }));
        },
        [dropdownData]
    );

    const handleAccountSearch = async (term, setOptions, setLoadingState) => {
        setLoadingState(true);
        try {
            const response = await getAccGrpMasters(term || "");
            const data = response?.data || response?.Data || (Array.isArray(response) ? response : []);
            setOptions(
                (data || []).map((item) => ({
                    value: item.accGrpName || item.AccGrpName || item.accGrpCode || item.AccGrpCode || "",
                    label: item.accGrpName || item.AccGrpName || ""
                }))
            );
        } catch (err) {
            console.error(err);
            toast.error(t("Failed to load accounts."));
        } finally {
            setLoadingState(false);
        }
    };

    useEffect(() => {
        const loadDropdowns = async () => {
            try {
                const res = await getMixMemoOutRtnReportDropdowns();
                if (res?.success || res?.Success) {
                    setDropdownData(res.data || res.Data || {});
                }
            } catch (err) {
                console.error(err);
                toast.error(t("Failed to load dropdown data."));
            }
        };

        loadDropdowns();
        handleAccountSearch("", setPartyOptions, setLoadingParties);
        handleAccountSearch("", setBrokerOptions, setLoadingBrokers);
    }, [t]);

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
                    lotNo: ""
                },
                d
            )
        );
    };

    const typeOptions = [
        { value: "ALL", label: "ALL" },
        { value: "External", label: "EXTERNAL" },
        { value: "Internal", label: "INTERNAL" },
        { value: "Local", label: "LOCAL" },
        { value: "LAB", label: "LAB" },
        { value: "Pend Sale", label: "PEND SALE" }
    ];

    const buildPayload = () => ({
        FromDate: filters.fromDate,
        ToDate: filters.toDate,
        Currency: filters.currency || null,
        InvNo: filters.invNo || null,
        Type: filters.type || "ALL",
        Party: filters.party || null,
        Broker: filters.broker || null,
        LotNo: filters.lotNo || null
    });

    const handleReport = async () => {
        setLoading(true);
        try {
            const response = await getMixMemoOutRtnReport(buildPayload());
            const ok = response?.success || response?.Success;
            if (ok) {
                setReportRows(response.Data || response.data || []);
                setHasSearched(true);
                setExpandedMemoNos(new Set());
                toast.success(t("Report loaded successfully."));
            } else {
                toast.warning(response?.message || response?.Message || t("Failed to load report."));
            }
        } catch (err) {
            console.error(err);
            const msg =
                typeof err === "string"
                    ? err
                    : err?.response?.data?.message || err?.response?.data?.Message || null;
            toast.error(msg || t("Server Connection Problem.."));
        } finally {
            setLoading(false);
        }
    };

    // Enforce the selected From/To Date range on the client side too, so the report
    // always respects the date filter even if the backend response includes rows
    // outside the requested range. Rows whose date can't be parsed are kept.
    const filteredReportRows = useMemo(() => {
        if (!filters.fromDate && !filters.toDate) return reportRows || [];

        const from = filters.fromDate ? new Date(`${filters.fromDate}T00:00:00`) : null;
        const to = filters.toDate ? new Date(`${filters.toDate}T00:00:00`) : null;

        return (reportRows || []).filter((r) => {
            const rowDate = parseRowDateForCompare(getRowDateRaw(r));
            if (!rowDate) return true;
            if (from && rowDate < from) return false;
            if (to && rowDate > to) return false;
            return true;
        });
    }, [reportRows, filters.fromDate, filters.toDate]);

    const groupedVisibleRows = useMemo(() => {
        const grouped = {};

        (filteredReportRows || []).forEach((r) => {
            const key = String(getRowVal(r, "MemoNo", "memoNo") || "UNKNOWN");
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(r);
        });

        const out = [];
        Object.keys(grouped).forEach((memoNo) => {
            const rows = grouped[memoNo] || [];
            const first = rows[0];

            const totalReturn = rows.reduce((s, r) => s + Number(getRowVal(r, "Return", "return") || 0), 0);
            const totalAmount = rows.reduce((s, r) => s + Number(getRowVal(r, "Amount", "amount") || 0), 0);
            // MVC sums Price on parent row (footer shows weighted avg separately)
            const totalPrice = rows.reduce((s, r) => s + Number(getRowVal(r, "Price", "price") || 0), 0);

            // Parent row fields match MVC MixMemoReturnreport FillDataTable
            out.push({
                isParent: true,
                MemoNo: memoNo,
                BillNo: getRowVal(first, "BillNo", "billNo"),
                TrnDate: getRowDateRaw(first),
                AccGrpName: getRowVal(first, "AccGrpName", "accGrpName", "Party", "party"),
                Lotno: "",
                ItemName: "Total",
                Return: totalReturn,
                Price: totalPrice,
                Amount: totalAmount,
                Broker: getRowVal(first, "Broker", "broker"),
                invtype: getRowVal(first, "invtype", "Invtype", "InvType", "invType"),
                StockType: getRowVal(first, "StockType", "stockType"),
                childRecords: rows
            });
        });

        // Order chronologically by TrnDate (then by memo no.) — matches MVC date sort
        out.sort((a, b) => {
            const ak = getReportDateSortKey(getRowDateRaw(a));
            const bk = getReportDateSortKey(getRowDateRaw(b));
            if (ak !== bk) return ak < bk ? -1 : 1;
            return String(a.MemoNo ?? "").localeCompare(String(b.MemoNo ?? ""), undefined, { numeric: true });
        });

        return out;
    }, [filteredReportRows]);

    const getTableTotals = (table) => {
        const rows = table.getFilteredRowModel().rows.map((r) => r.original);
        let totalReturn = 0;
        let totalAmount = 0;

        rows.forEach((r) => {
            if (r?.isParent) {
                totalReturn += Number(getRowVal(r, "Return", "return") || 0);
                totalAmount += Number(getRowVal(r, "Amount", "amount") || 0);
            }
        });

        return { totalReturn, totalAmount };
    };

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
                                    : safeText(child[column.columnDef.accessorKey])}
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
                                    if (prev.has(memoKey)) return new Set();
                                    return new Set([memoKey]);
                                });
                            }}
                        />
                    );
                }
            },
            {
                header: t("DATE"),
                id: "TrnDate",
                accessorFn: (row) => formatReportDisplayDate(getRowDateRaw(row)),
                sortingFn: (rowA, rowB) => {
                    const a = getReportDateSortKey(getRowDateRaw(rowA.original));
                    const b = getReportDateSortKey(getRowDateRaw(rowB.original));
                    return a < b ? -1 : a > b ? 1 : 0;
                },
                filterFn: (row, columnId, filterValue) => {
                    const search = String(filterValue ?? "").trim().toLowerCase();
                    if (!search) return true;
                    const display = String(row.getValue(columnId) ?? "").toLowerCase();
                    return display.includes(search);
                },
                cell: ({ getValue }) => safeText(getValue()),
                footer: () => <span className="fw-bold">{t("Total")}:</span>
            },
            { header: t("MemoNo"), accessorKey: "MemoNo", cell: ({ row }) => safeText(getRowVal(row.original, "MemoNo", "memoNo")) },
            { header: t("BillNo"), accessorKey: "BillNo", cell: ({ row }) => safeText(getRowVal(row.original, "BillNo", "billNo")) },
            {
                header: t("Party"),
                accessorKey: "AccGrpName",
                cell: ({ row }) => safeText(getRowVal(row.original, "AccGrpName", "accGrpName", "Party", "party"))
            },
            {
                header: t("LotNo"),
                accessorKey: "Lotno",
                cell: ({ row }) => (row.original?.isParent ? "" : safeText(getRowVal(row.original, "Lotno", "lotno", "LotNo")))
            },
            {
                header: t("ItemName"),
                accessorKey: "ItemName",
                cell: ({ row }) => {
                    const r = row.original;
                    if (r?.isParent) return <strong>Total</strong>;
                    return safeText(getRowVal(r, "ItemName", "itemName"));
                }
            },
            {
                header: t("Return"),
                accessorKey: "Return",
                className: "text-end",
                cell: ({ row }) => safeFixed(getRowVal(row.original, "Return", "return"), 3),
                footer: ({ table }) => {
                    const { totalReturn } = getTableTotals(table);
                    return <span className="fw-bold text-end d-block">{fmtFixed(totalReturn, 3)}</span>;
                }
            },
            {
                header: t("Price"),
                accessorKey: "Price",
                className: "text-end",
                cell: ({ row }) => safeFixed(getRowVal(row.original, "Price", "price"), 2),
                footer: ({ table }) => {
                    const { totalReturn, totalAmount } = getTableTotals(table);
                    const price = totalReturn > 0 ? totalAmount / totalReturn : 0;
                    return <span className="fw-bold text-end d-block">{fmtFixed(price, 2)}</span>;
                }
            },
            {
                header: t("Amount"),
                accessorKey: "Amount",
                className: "text-end",
                cell: ({ row }) => safeFixed(getRowVal(row.original, "Amount", "amount"), 2),
                footer: ({ table }) => {
                    const { totalAmount } = getTableTotals(table);
                    return <span className="fw-bold text-end d-block">{fmtFixed(totalAmount, 2)}</span>;
                }
            },
            { header: t("Broker"), accessorKey: "Broker", cell: ({ row }) => safeText(getRowVal(row.original, "Broker", "broker")) },
            {
                header: t("invtype"),
                accessorKey: "invtype",
                cell: ({ row }) => safeText(getRowVal(row.original, "invtype", "Invtype", "InvType", "invType"))
            },
            {
                header: t("StockType"),
                accessorKey: "StockType",
                cell: ({ row }) => safeText(getRowVal(row.original, "StockType", "stockType"))
            }
        ],
        [expandedMemoNos, t]
    );

    const handleExcel = async () => {
        if (!filteredReportRows || filteredReportRows.length === 0) {
            toast.warning(t("No data available to export."));
            return;
        }

        const headers = [
            "Date",
            "MemoNo",
            "BillNo",
            "Party",
            "LotNo",
            "ItemName",
            "Return",
            "Price",
            "Amount",
            "Broker",
            "invtype",
            "StockType"
        ];

        const rows = filteredReportRows.map((r) => [
            safeText(formatReportDisplayDate(getRowDateRaw(r))),
            safeText(getRowVal(r, "MemoNo", "memoNo")),
            safeText(getRowVal(r, "BillNo", "billNo")),
            safeText(getRowVal(r, "AccGrpName", "accGrpName", "Party", "party")),
            safeText(getRowVal(r, "Lotno", "lotno")),
            safeText(getRowVal(r, "ItemName", "itemName")),
            safeFixed(getRowVal(r, "Return", "return"), 3),
            safeFixed(getRowVal(r, "Price", "price"), 2),
            safeFixed(getRowVal(r, "Amount", "amount"), 2),
            safeText(getRowVal(r, "Broker", "broker")),
            safeText(getRowVal(r, "invtype", "Invtype", "InvType", "invType")),
            safeText(getRowVal(r, "StockType", "stockType"))
        ]);

        const totalReturn = filteredReportRows.reduce((s, r) => s + Number(getRowVal(r, "Return", "return") || 0), 0);
        const totalAmount = filteredReportRows.reduce((s, r) => s + Number(getRowVal(r, "Amount", "amount") || 0), 0);
        const totalPrice = totalReturn > 0 ? totalAmount / totalReturn : 0;

        rows.push([
            "Total:",
            "",
            "",
            "",
            "",
            "",
            fmtFixed(totalReturn, 3),
            fmtFixed(totalPrice, 2),
            fmtFixed(totalAmount, 2),
            "",
            "",
            ""
        ]);

        const res = await exportToExcel(headers, rows, "MixMemoReturn-Report", "MixMemoReturn-Report");
        if (!res?.success) toast.error(t("Excel export failed."));
    };

    document.title = `${t("General Memo Return Report")} | ${t("Reports")}`;

    return (
        <React.Fragment>
            <ToastContainer />

            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title={t("General Memo Return Report")} pageTitle={t("Parcel Reports")} />

                    <div className="card stock-search-header-bar d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between mb-3 p-3 rounded-3 shadow-sm border gap-2">
                        <h5 className="mb-0 fw-bold text-primary d-flex align-items-center gap-2">
                            <i className={hasSearched ? "ri-database-2-line fs-20 text-primary" : "ri-search-eye-line fs-20 text-primary"} />
                            {hasSearched ? t("General Memo Return Report Results") : t("General Memo Return Report Filters")}
                        </h5>

                        <div className="d-flex gap-2">
                            {!hasSearched ? (
                                <>
                                    <Button color="primary" className="btn-sm rounded-2 px-3 py-1" onClick={handleReport} disabled={loading}>
                                        {loading ? t("Loading...") : t("Report")}
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
                                            setExpandedMemoNos(new Set());
                                        }}
                                        disabled={loading}
                                    >
                                        {t("New Search")}
                                    </Button>
                                    <Button
                                        color="success"
                                        className="btn-sm rounded-2 px-3 py-1"
                                        onClick={handleExcel}
                                        disabled={filteredReportRows.length === 0}
                                    >
                                        {t("Excel")}
                                    </Button>
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
                                                        max={filters.toDate || undefined}
                                                        onChange={(e) =>
                                                            setFilters((p) => ({ ...p, fromDate: e.target.value }))
                                                        }
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
                                                        min={filters.fromDate || undefined}
                                                        onChange={(e) =>
                                                            setFilters((p) => ({ ...p, toDate: e.target.value }))
                                                        }
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
                                                        onChange={(sel) => setFilters((p) => ({ ...p, currency: sel?.value || "" }))}
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
                                                        placeholder={t("MemoNo")}
                                                        onChange={(e) => setFilters((p) => ({ ...p, invNo: e.target.value }))}
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
                                                        onChange={(sel) => setFilters((p) => ({ ...p, type: sel?.value || "ALL" }))}
                                                        placeholder={t("Select Type")}
                                                    />
                                                </FormGroup>
                                            </Col>
                                        </Row>

                                        <Row className="g-2">
                                            <Col sm={2}>
                                                <FormGroup className="mb-0">
                                                    <Label className="fw-medium mb-1 small">{t("Party")}</Label>
                                                    <Select
                                                        classNamePrefix="react-select"
                                                        styles={customStyles}
                                                        isClearable
                                                        options={partyOptions}
                                                        value={filters.party ? { value: filters.party, label: filters.party } : null}
                                                        onMenuOpen={() => {
                                                            setPartyInput("");
                                                            handleAccountSearch("", setPartyOptions, setLoadingParties);
                                                        }}
                                                        onInputChange={(val, { action }) => {
                                                            if (action === "input-change") setPartyInput(val);
                                                        }}
                                                        onChange={(sel) => setFilters((p) => ({ ...p, party: sel?.value || "" }))}
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
                                                        value={filters.broker ? { value: filters.broker, label: filters.broker } : null}
                                                        onMenuOpen={() => {
                                                            setBrokerInput("");
                                                            handleAccountSearch("", setBrokerOptions, setLoadingBrokers);
                                                        }}
                                                        onInputChange={(val, { action }) => {
                                                            if (action === "input-change") setBrokerInput(val);
                                                        }}
                                                        onChange={(sel) => setFilters((p) => ({ ...p, broker: sel?.value || "" }))}
                                                        placeholder={t("Search Broker")}
                                                        isLoading={loadingBrokers}
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
                                                rows={7}
                                                value={filters.lotNo}
                                                placeholder={t("Search by lot no")}
                                                onChange={(e) => setFilters((p) => ({ ...p, lotNo: e.target.value }))}
                                            />
                                        </FormGroup>
                                    </Col>
                                </Row>
                            </CardBody>
                        </Card>
                    )}

                    {hasSearched && (
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
                </Container>
            </div>
        </React.Fragment>
    );
};

export default MixMemoOutRtnReport;