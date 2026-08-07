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
    getMixMemoOutReport,
    getMixMemoOutReportDropdowns
} from "../../../helpers/fakebackend_helper";
import { useSettingReportDates } from "../../../Components/Hooks/useSettingReportDates";

const dashText = (value) => {
    if (value === null || value === undefined || value === "") return "-";
    return String(value);
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

/** Display date in DD-MMM-YYYY format (e.g. 19-Nov-2025) */
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

/** Sort key for date ordering: YYYYMMDD */
const getReportDateSortKey = (value) => {
    const parts = parseReportDateParts(value);
    if (!parts) return "00000000";
    const m = String(parts.month).padStart(2, "0");
    const d = String(parts.day).padStart(2, "0");
    return `${parts.year}${m}${d}`;
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

const getRowDateRaw = (row) => getRowVal(row, "ConDATE", "conDATE", "condate", "Date", "date");

const MixMemoOutReport = () => {
    const { t } = useTranslation();
    const { fromDate, toDate, getDates, mergeDates } = useSettingReportDates({ includeReturnDates: true });

    const [loadingDropdowns, setLoadingDropdowns] = useState(false);
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
        sieve: []
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
                shape: ["shape", "Shape"],
                color: ["color", "Color"],
                clarity: ["clarity", "Clarity"],
                size: ["size", "Size"],
                proportion: ["proportion", "Proportion"],
                polish: ["polish", "Polish"],
                symmetry: ["symmetry", "Symmetry"],
                lab: ["lab", "LAB"],
                fluorescence: ["fluorescence", "Fluorescence"],
                milky: ["milky", "Milky"],
                luster: ["luster", "Luster"],
                natts: ["natts", "Natts"],
                mines: ["mines", "Mines"],
                productType: ["productType", "ProductType"],
                sieve: ["sieve", "Sieve"],
                currency: ["currency", "Currency"],
                type: ["type", "Type"]
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
            setLoadingDropdowns(true);
            try {
                const res = await getMixMemoOutReportDropdowns();
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

    const handleMultiChange = (name, selected) => {
        setFilters((prev) => ({
            ...prev,
            [name]: selected ? selected.map((x) => x.value) : []
        }));
    };

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
                    chkRtnDate: false,
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
                    sieve: []
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

    const handleReport = async () => {
        setLoading(true);
        try {
            const response = await getMixMemoOutReport(buildPayload());
            const ok = response?.success || response?.Success;
            if (ok) {
                setReportRows(response.Data || response.data || []);
                setHasSearched(true);
                setExpandedMemoNos(new Set());
                toast.success(t("Report loaded successfully."));
            } else {
                toast.warning(response?.Message || t("Failed to load report."));
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

    const groupedVisibleRows = useMemo(() => {
        const grouped = {};

        (reportRows || []).forEach((r) => {
            const key = String(getRowVal(r, "MemoNo", "memoNo") || "UNKNOWN");
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(r);
        });

        const out = [];
        Object.keys(grouped).forEach((memoNo) => {
            const rows = grouped[memoNo] || [];
            const first = rows[0];

            const totalCarats = rows.reduce((s, r) => s + Number(getRowVal(r, "Carats", "carats") || 0), 0);
            const totalAmount = rows.reduce((s, r) => s + Number(getRowVal(r, "Amount", "amount") || 0), 0);
            const totalEstimate = rows.reduce((s, r) => s + Number(getRowVal(r, "Estimate", "estimate") || 0), 0);
            const totalReturn = rows.reduce((s, r) => s + Number(getRowVal(r, "Return", "return") || 0), 0);
            const totalBalance = rows.reduce((s, r) => s + Number(getRowVal(r, "Balance", "balance") || 0), 0);
            const totalBalanceAmt = rows.reduce((s, r) => s + Number(getRowVal(r, "BalanceAmt", "balanceAmt") || 0), 0);

            const totalPrice = totalCarats > 0 ? totalAmount / totalCarats : 0;

            out.push({
                ...first,
                isParent: true,
                Code: "",
                ConDATE: getRowDateRaw(first),
                MemoNo: memoNo,
                Carats: totalCarats,
                Price: totalPrice,
                Amount: totalAmount,
                Estimate: totalEstimate,
                Return: totalReturn,
                Balance: totalBalance,
                BalanceAmt: totalBalanceAmt,
                childRecords: rows
            });
        });

        out.sort((a, b) => {
            const ak = getReportDateSortKey(getRowDateRaw(a));
            const bk = getReportDateSortKey(getRowDateRaw(b));
            if (ak !== bk) return ak < bk ? -1 : 1;
            return String(a.MemoNo ?? "").localeCompare(String(b.MemoNo ?? ""), undefined, { numeric: true });
        });

        return out;
    }, [reportRows]);

    const getTableTotals = (table) => {
        const rows = table.getFilteredRowModel().rows.map((r) => r.original);
        let totalCarats = 0;
        let totalAmount = 0;
        let totalEstimate = 0;
        let totalReturn = 0;
        let totalBalance = 0;
        let totalBalanceAmt = 0;

        rows.forEach((r) => {
            if (r?.isParent) {
                totalCarats += Number(getRowVal(r, "Carats", "carats") || 0);
                totalAmount += Number(getRowVal(r, "Amount", "amount") || 0);
                totalEstimate += Number(getRowVal(r, "Estimate", "estimate") || 0);
                totalReturn += Number(getRowVal(r, "Return", "return") || 0);
                totalBalance += Number(getRowVal(r, "Balance", "balance") || 0);
                totalBalanceAmt += Number(getRowVal(r, "BalanceAmt", "balanceAmt") || 0);
            }
        });

        return { totalCarats, totalAmount, totalEstimate, totalReturn, totalBalance, totalBalanceAmt };
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
                                    // Accordion behavior: only one memo group expanded at a time.
                                    // - clicking the same group: close it
                                    // - clicking a different group: close previous, open new
                                    if (prev.has(memoKey)) return new Set();
                                    return new Set([memoKey]);
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
                    if (!code) return "";
                    return (
                        <div className="report-action">
                            <a
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault();
                                    window.open(`../mix-memo/edit-mixmemo?Id=${code}&Mode=view`, "_blank");
                                }}
                            >
                                <i className="bx bx-show-alt"></i>
                            </a>
                        </div>
                    );
                }
            },
            {
                header: t("DATE"),
                id: "ConDATE",
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
                cell: ({ getValue }) => dashText(getValue()),
                footer: () => <span className="fw-bold">{t("Total")}:</span>
            },
            {
                header: t("DueDays"),
                accessorKey: "DueDays",
                className: "text-end",
                cell: ({ row }) => fmtFixed(getRowVal(row.original, "DueDays", "dueDays"), 0)
            },
            { header: t("MemoNo"), accessorKey: "MemoNo", cell: ({ row }) => dashText(getRowVal(row.original, "MemoNo", "memoNo")) },
            { header: t("BillNo"), accessorKey: "BillNo", cell: ({ row }) => dashText(getRowVal(row.original, "BillNo", "billNo")) },
            { header: t("Party"), accessorKey: "Party", cell: ({ row }) => dashText(getRowVal(row.original, "Party", "party")) },
            { header: t("LotNo"), accessorKey: "Lotno", cell: ({ row }) => dashText(getRowVal(row.original, "Lotno", "lotno", "Lotno")) },
            { header: t("ItemName"), accessorKey: "ItemName", cell: ({ row }) => dashText(getRowVal(row.original, "ItemName", "itemName")) },
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
            {
                header: t("Price"),
                accessorKey: "Price",
                className: "text-end",
                cell: ({ row }) => fmtFixed(getRowVal(row.original, "Price", "price"), 2),
                footer: ({ table }) => {
                    const { totalCarats, totalAmount } = getTableTotals(table);
                    const price = totalCarats > 0 ? totalAmount / totalCarats : 0;
                    return <span className="fw-bold text-end d-block">{fmtFixed(price, 2)}</span>;
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
                header: t("Sold"),
                accessorKey: "Estimate",
                className: "text-end",
                cell: ({ row }) => fmtFixed(getRowVal(row.original, "Estimate", "estimate"), 2),
                footer: ({ table }) => {
                    const { totalEstimate } = getTableTotals(table);
                    return <span className="fw-bold text-end d-block">{fmtFixed(totalEstimate, 2)}</span>;
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
            {
                header: t("Balance"),
                accessorKey: "Balance",
                className: "text-end",
                cell: ({ row }) => fmtFixed(getRowVal(row.original, "Balance", "balance"), 2),
                footer: ({ table }) => {
                    const { totalBalance } = getTableTotals(table);
                    return <span className="fw-bold text-end d-block">{fmtFixed(totalBalance, 2)}</span>;
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
            { header: t("Seller"), accessorKey: "Seller", cell: ({ row }) => dashText(getRowVal(row.original, "Seller", "seller")) },
            { header: t("Broker"), accessorKey: "Broker", cell: ({ row }) => dashText(getRowVal(row.original, "Broker", "broker")) },
            { header: t("MemoType"), accessorKey: "Invtype", cell: ({ row }) => dashText(getRowVal(row.original, "Invtype", "invtype")) },
            { header: t("SubType"), accessorKey: "SubType", cell: ({ row }) => dashText(getRowVal(row.original, "SubType", "subType")) },
            { header: t("Category"), accessorKey: "Category", cell: ({ row }) => dashText(getRowVal(row.original, "Category", "category")) },
            { header: t("IssUser"), accessorKey: "IssUser", cell: ({ row }) => dashText(getRowVal(row.original, "IssUser", "issUser")) },
            { header: t("StockType"), accessorKey: "StockType", cell: ({ row }) => dashText(getRowVal(row.original, "StockType", "stockType")) }
        ],
        [expandedMemoNos, t, getTableTotals]
    );

    const handleExcel = async () => {
        if (!reportRows || reportRows.length === 0) {
            toast.warning(t("No data available to export."));
            return;
        }

        const headers = [
            "Date",
            "DueDays",
            "MemoNo",
            "BillNo",
            "Party",
            "LotNo",
            "ItemName",
            "Carats",
            "Price",
            "Amount",
            "Sold",
            "Return",
            "Balance",
            "BalanceAmt",
            "Seller",
            "Broker",
            "MemoType",
            "SubType",
            "Category",
            "IssUser",
            "StockType"
        ];

        const rows = reportRows.map((r) => [
            dashText(formatReportDisplayDate(getRowDateRaw(r))),
            fmtFixed(getRowVal(r, "DueDays", "dueDays"), 0),
            dashText(getRowVal(r, "MemoNo", "memoNo")),
            dashText(getRowVal(r, "BillNo", "billNo")),
            dashText(getRowVal(r, "Party", "party")),
            dashText(getRowVal(r, "Lotno", "lotno")),
            dashText(getRowVal(r, "ItemName", "itemName")),
            fmtFixed(getRowVal(r, "Carats", "carats"), 3),
            fmtFixed(getRowVal(r, "Price", "price"), 2),
            fmtFixed(getRowVal(r, "Amount", "amount"), 2),
            fmtFixed(getRowVal(r, "Estimate", "estimate"), 2),
            fmtFixed(getRowVal(r, "Return", "return"), 3),
            fmtFixed(getRowVal(r, "Balance", "balance"), 2),
            fmtFixed(getRowVal(r, "BalanceAmt", "balanceAmt"), 2),
            dashText(getRowVal(r, "Seller", "seller")),
            dashText(getRowVal(r, "Broker", "broker")),
            dashText(getRowVal(r, "Invtype", "invtype")),
            dashText(getRowVal(r, "SubType", "subType")),
            dashText(getRowVal(r, "Category", "category")),
            dashText(getRowVal(r, "IssUser", "issUser")),
            dashText(getRowVal(r, "StockType", "stockType"))
        ]);

        const totalCarats = reportRows.reduce((s, r) => s + Number(getRowVal(r, "Carats", "carats") || 0), 0);
        const totalAmount = reportRows.reduce((s, r) => s + Number(getRowVal(r, "Amount", "amount") || 0), 0);
        const totalEstimate = reportRows.reduce((s, r) => s + Number(getRowVal(r, "Estimate", "estimate") || 0), 0);
        const totalReturn = reportRows.reduce((s, r) => s + Number(getRowVal(r, "Return", "return") || 0), 0);
        const totalBalance = reportRows.reduce((s, r) => s + Number(getRowVal(r, "Balance", "balance") || 0), 0);
        const totalBalanceAmt = reportRows.reduce((s, r) => s + Number(getRowVal(r, "BalanceAmt", "balanceAmt") || 0), 0);
        const totalPrice = totalCarats > 0 ? totalAmount / totalCarats : 0;

        rows.push([
            "Total:",
            "",
            "",
            "",
            "",
            "",
            "",
            fmtFixed(totalCarats, 3),
            fmtFixed(totalPrice, 2),
            fmtFixed(totalAmount, 2),
            fmtFixed(totalEstimate, 2),
            fmtFixed(totalReturn, 3),
            fmtFixed(totalBalance, 2),
            fmtFixed(totalBalanceAmt, 2),
            "",
            "",
            "",
            "",
            "",
            "",
            ""
        ]);

        const res = await exportToExcel(headers, rows, "MixMemoOutReport", "MixMemoOutReport");
        if (!res?.success) toast.error(t("Excel export failed."));
    };

    document.title = `${t("Mix Memo Out Report")} | ${t("Reports")}`;

    return (
        <React.Fragment>
            <ToastContainer />

            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title={t("Mix Memo Out Report")} pageTitle={t("Parcel Reports")} />

                    <div className="card stock-search-header-bar d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between mb-3 p-3 rounded-3 shadow-sm border gap-2">
                        <h5 className="mb-0 fw-bold text-primary d-flex align-items-center gap-2">
                            <i className={hasSearched ? "ri-database-2-line fs-20 text-primary" : "ri-search-eye-line fs-20 text-primary"} />
                            {hasSearched ? t("Mix Memo Out Report Results") : t("Mix Memo Out Report Filters")}
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
                                        disabled={reportRows.length === 0}
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
                                                        onChange={(e) => setFilters((p) => ({ ...p, fromDate: e.target.value }))}
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
                                                        onChange={(e) => setFilters((p) => ({ ...p, toDate: e.target.value }))}
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
                                                        placeholder={t("Memo No")}
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
                                            <Col sm={2}>
                                                <FormGroup className="mb-0">
                                                    <div className="d-flex align-items-center gap-1" style={{ height: "35px" }}>
                                                        <input
                                                            type="checkbox"
                                                            id="clearMixMemoCheckbox"
                                                            checked={filters.clear}
                                                            onChange={(e) => setFilters((p) => ({ ...p, clear: e.target.checked }))}
                                                        />
                                                        <Label htmlFor="clearMixMemoCheckbox" className="mb-0 small">
                                                            {t("Show Clear Mix Memo")}
                                                        </Label>
                                                    </div>
                                                </FormGroup>
                                            </Col>
                                        </Row>

                                        <Row className="g-2">
                                            <Col sm={2}>
                                                <FormGroup className="mb-0">
                                                    <div className="d-flex align-items-center gap-1 mb-1">
                                                        <input
                                                            type="checkbox"
                                                            id="rtnDateCheckbox"
                                                            checked={filters.chkRtnDate}
                                                            onChange={(e) => setFilters((p) => ({ ...p, chkRtnDate: e.target.checked }))}
                                                        />
                                                        <Label htmlFor="rtnDateCheckbox" className="fw-medium mb-0 small">
                                                            {t("Rtn Date")}
                                                        </Label>
                                                    </div>
                                                    <input
                                                        type="date"
                                                        className="form-control form-control-sm"
                                                        style={{ height: "35px" }}
                                                        value={filters.fromRtnDate}
                                                        disabled={!filters.chkRtnDate}
                                                        onChange={(e) => setFilters((p) => ({ ...p, fromRtnDate: e.target.value }))}
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
                                                        onChange={(e) => setFilters((p) => ({ ...p, toRtnDate: e.target.value }))}
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

                                <hr className="my-3 text-muted opacity-25" />

                                <Row className="g-2">
                                    {attributeFields.map(({ label, key }) => (
                                        <Col sm={2} key={key}>
                                            <FormGroup className="mb-0">
                                                <Label className="fw-medium mb-1 small">{t(label)}</Label>
                                                <Select
                                                    isMulti
                                                    classNamePrefix="react-select"
                                                    styles={customStyles}
                                                    options={getOptions(key)}
                                                    value={getOptions(key).filter((o) => (filters[key] || []).includes(o.value))}
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

export default MixMemoOutReport;