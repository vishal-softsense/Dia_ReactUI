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
    getMixSaleReport,
    getMixSaleReportDropdowns,
    getAccGrpMasters,
    getUserDropdown
} from "../../../helpers/fakebackend_helper";
import { useSettingReportDates } from "../../../Components/Hooks/useSettingReportDates";

const dashText = (value) => (value === null || value === undefined || value === "" ? "-" : String(value));

const MONTH_MAP = {
    jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
    jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12"
};

const formatReportDisplayDate = (value) => {
    if (value === null || value === undefined || value === "") return "-";

    const text = String(value).trim();
    if (!text) return "-";

    const dmyMatch = text.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
    if (dmyMatch) {
        const day = dmyMatch[1].padStart(2, "0");
        const month = dmyMatch[2].padStart(2, "0");
        const year = dmyMatch[3];
        return `${day}-${month}-${year}`;
    }

    const dmyMmm = text.match(/^(\d{1,2})[-/]([A-Za-z]{3,9})[-/](\d{4})/);
    if (dmyMmm) {
        const day = dmyMmm[1].padStart(2, "0");
        const monthKey = dmyMmm[2].slice(0, 3).toLowerCase();
        const month = MONTH_MAP[monthKey] || "01";
        return `${day}-${month}-${dmyMmm[3]}`;
    }

    const isoMatch = text.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (isoMatch) {
        const year = isoMatch[1];
        const month = isoMatch[2].padStart(2, "0");
        const day = isoMatch[3].padStart(2, "0");
        return `${day}-${month}-${year}`;
    }

    const parsed = new Date(text);
    if (!Number.isNaN(parsed.getTime())) {
        const day = String(parsed.getDate()).padStart(2, "0");
        const month = String(parsed.getMonth() + 1).padStart(2, "0");
        const year = parsed.getFullYear();
        return `${day}-${month}-${year}`;
    }

    return text;
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
    let parentINR = 0;
    let parentUSD = 0;

    rows.forEach((r) => {
        if (r?.isParent) {
            parentCarat += Number(getRowVal(r, "Carats", "carats") || 0);
            parentAmt += Number(getRowVal(r, "Amount", "amount") || 0);
            parentINR += Number(getRowVal(r, "MasterCurrencyAmount", "masterCurrencyAmount") || 0);
            parentUSD += Number(getRowVal(r, "StockCurrencyAmount", "stockCurrencyAmount") || 0);
        }
    });

    return { parentCarat, parentAmt, parentINR, parentUSD };
};

const mapDropdownItems = (list) => {
    if (!Array.isArray(list)) return [];
    return list.map((item) => ({
        value: String(item.id ?? item.ID ?? item.name ?? item.Name ?? ""),
        label: String(item.name ?? item.Name ?? item.id ?? item.ID ?? "").toUpperCase()
    }));
};

const MixSaleReport = () => {
    const { t } = useTranslation();
    const { fromDate, toDate, getDates, mergeDates } = useSettingReportDates();

    const [loadingDropdowns, setLoadingDropdowns] = useState(false);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    const [dropdownData, setDropdownData] = useState({});
    const [expandedInvnos, setExpandedInvnos] = useState(() => new Set());
    const [reportRows, setReportRows] = useState([]);

    const [partyInput, setPartyInput] = useState("");
    const [partyOptions, setPartyOptions] = useState([]);
    const [loadingParties, setLoadingParties] = useState(false);

    const [brokerInput, setBrokerInput] = useState("");
    const [brokerOptions, setBrokerOptions] = useState([]);
    const [loadingBrokers, setLoadingBrokers] = useState(false);

    const [salesPersonOptions, setSalesPersonOptions] = useState([]);
    const [loadingSalesPersons, setLoadingSalesPersons] = useState(false);

    const [filters, setFilters] = useState({
        fromDate,
        toDate,
        currency: "",
        invNo: "",
        party: "",
        broker: "",
        salesPerson: "",
        lotNo: "",
        shape: [],
        size: [],
        color: [],
        clarity: [],
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
            input: (provided) => ({
                ...provided,
                margin: "0px",
                padding: "0px"
            }),
            indicatorSeparator: () => ({ display: "none" }),
            indicatorsContainer: (provided) => ({
                ...provided,
                minHeight: "35px",
                alignSelf: "flex-start"
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
                size: ["size", "Size"],
                color: ["color", "Color"],
                clarity: ["clarity", "Clarity"],
                sieve: ["sieve", "Sieve"],
                currency: ["currency", "Currency"]
            };
            const aliases = keyVariants[dropdownKey] || [dropdownKey];

            let list = [];
            for (const alias of aliases) {
                if (Array.isArray(dropdownData?.[alias]) && dropdownData[alias].length) {
                    list = dropdownData[alias];
                    break;
                }
            }
            if (list.length && list[0]?.value !== undefined) return list;
            return mapDropdownItems(list);
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

    const loadSalesPersons = async () => {
        setLoadingSalesPersons(true);
        try {
            const response = await getUserDropdown();
            const data = response?.data || response?.Data || (Array.isArray(response) ? response : []);
            setSalesPersonOptions(
                (data || [])
                    .map((item) => {
                        const name =
                            item.userName ||
                            item.UserName ||
                            item.name ||
                            item.Name ||
                            item.salesPerson ||
                            item.SalesPerson ||
                            "";
                        return name
                            ? {
                                value: name,
                                label: String(name)
                            }
                            : null;
                    })
                    .filter(Boolean)
            );
        } catch (err) {
            console.error("Salesperson load error:", err);
        } finally {
            setLoadingSalesPersons(false);
        }
    };

    useEffect(() => {
        const loadDropdowns = async () => {
            setLoadingDropdowns(true);
            try {
                const res = await getMixSaleReportDropdowns();
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
        loadSalesPersons();
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
                    party: "",
                    broker: "",
                    salesPerson: "",
                    lotNo: "",
                    shape: [],
                    size: [],
                    color: [],
                    clarity: [],
                    sieve: []
                },
                d
            )
        );
    };

    const handleReport = async () => {
        setLoading(true);
        try {
            const payload = {
                FromDate: filters.fromDate,
                ToDate: filters.toDate,
                Currency: filters.currency || null,
                InvNo: filters.invNo || null,
                Party: filters.party || null,
                Broker: filters.broker || null,
                SalesPerson: filters.salesPerson || null,
                LotNo: filters.lotNo || null,
                Shape: filters.shape,
                Color: filters.color,
                Clarity: filters.clarity,
                Size: filters.size,
                Sieve: filters.sieve
            };
            const response = await getMixSaleReport(payload);
            const ok = response?.success || response?.Success;
            if (ok) {
                const data = response.Data || response.data || [];
                setReportRows(data);
                setHasSearched(true);
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

                const totalCarat = rows.reduce((s, r) => s + Number(getRowVal(r, "Carats", "carats") || 0), 0);
                const totalAmount = rows.reduce((s, r) => s + Number(getRowVal(r, "Amount", "amount") || 0), 0);
                const totalINR = rows.reduce(
                    (s, r) => s + Number(getRowVal(r, "MasterCurrencyAmount", "masterCurrencyAmount") || 0),
                    0
                );
                const totalUSD = rows.reduce(
                    (s, r) => s + Number(getRowVal(r, "StockCurrencyAmount", "stockCurrencyAmount") || 0),
                    0
                );

                out.push({
                    isParent: true,
                    Code: getRowVal(first, "Code", "code"),
                    ConDATE: getRowVal(first, "ConDATE", "conDATE", "conDate", "Date", "date"),
                    Invno: invnoKey,
                    BillNo: getRowVal(first, "BillNo", "billNo", "billno"),
                    ShapeId: "",
                    SizeId: "",
                    ColorId: "",
                    ClarityId: "",
                    SieveId: "",
                    Party: getRowVal(first, "Party", "party"),
                    Item: "Total",
                    IssueCarats: "",
                    Discount: "",
                    ReturnCarats: "",
                    Carats: totalCarat,
                    Rate: totalCarat > 0 ? totalAmount / totalCarat : 0,
                    Amount: totalAmount,
                    Broker: "",
                    Less1: "",
                    Less2: "",
                    Less3: "",
                    MasterCurrencyAmount: totalINR,
                    StockCurrencyAmount: totalUSD,
                    StockType: "",
                    SalesPerson: getRowVal(first, "SalesPerson", "salesPerson"),
                    childRecords: rows
                });
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

                    const invnoKey = String(r.Invno ?? "");
                    const expanded = expandedInvnos.has(invnoKey);
                    return (
                        <i
                            className={expanded ? "bx bx-chevron-down" : "bx bx-chevron-right"}
                            style={{ cursor: "pointer", color: "#2c7be5", fontSize: "18px", verticalAlign: "middle" }}
                            onClick={() => {
                                setExpandedInvnos((prev) => {
                                    // Accordion: only one invoice expanded at a time
                                    if (prev.has(invnoKey)) return new Set();
                                    return new Set([invnoKey]);
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
                                    const url = `../mix/edit-mixdata?Id=${code}&Mode=view`;
                                    const win = window.open(url, "_blank");
                                    if (win) win.focus();
                                }}
                            >
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
                cell: ({ row }) =>
                    formatReportDisplayDate(getRowVal(row.original, "ConDATE", "conDATE", "condate", "Date", "date"))
            },
            { header: t("InvNo"), accessorKey: "Invno", cell: ({ row }) => dashText(getRowVal(row.original, "Invno", "invno", "InvNo", "invNo")) },
            { header: t("BillNo"), accessorKey: "BillNo", cell: ({ row }) => dashText(getRowVal(row.original, "BillNo", "billNo", "billno")) },
            { header: t("Party"), accessorKey: "Party", cell: ({ row }) => dashText(getRowVal(row.original, "Party", "party")) },
            {
                header: t("Item"),
                accessorKey: "Item",
                cell: ({ row }) => {
                    const val = getRowVal(row.original, "Item", "item");
                    if (row.original?.isParent) return <strong>{val}</strong>;
                    return dashText(val);
                }
            },
            { header: t("Shape"), accessorKey: "ShapeId", cell: ({ row }) => dashText(getRowVal(row.original, "ShapeId", "shapeId")) },
            { header: t("Color"), accessorKey: "ColorId", cell: ({ row }) => dashText(getRowVal(row.original, "ColorId", "colorId")) },
            { header: t("Clarity"), accessorKey: "ClarityId", cell: ({ row }) => dashText(getRowVal(row.original, "ClarityId", "clarityId")) },
            { header: t("Size"), accessorKey: "SizeId", cell: ({ row }) => dashText(getRowVal(row.original, "SizeId", "sizeId")) },
            { header: t("Sieve"), accessorKey: "SieveId", cell: ({ row }) => dashText(getRowVal(row.original, "SieveId", "sieveId")) },
            {
                header: t("Issue Carats"),
                accessorKey: "IssueCarats",
                cell: ({ row }) => fmtFixed(getRowVal(row.original, "IssueCarats", "issueCarats"), 2)
            },
            {
                header: t("RejeP"),
                accessorKey: "Discount",
                cell: ({ row }) => fmtFixed(getRowVal(row.original, "Discount", "discount"), 2)
            },
            {
                header: t("Rejection"),
                accessorKey: "ReturnCarats",
                cell: ({ row }) => fmtFixed(getRowVal(row.original, "ReturnCarats", "returnCarats"), 2)
            },
            {
                header: t("Selection Carats"),
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
            {
                header: t("Amount"),
                accessorKey: "Amount",
                cell: ({ row }) => fmtFixed(getRowVal(row.original, "Amount", "amount"), 2),
                footer: ({ table }) => {
                    const { parentAmt } = getTableTotals(table);
                    return <span className="fw-bold text-end d-block">{fmtFixed(parentAmt, 2)}</span>;
                }
            },
            { header: t("Broker"), accessorKey: "Broker", cell: ({ row }) => dashText(getRowVal(row.original, "Broker", "broker")) },
            { header: t("Less1"), accessorKey: "Less1", cell: ({ row }) => fmtFixed(getRowVal(row.original, "Less1", "less1"), 2) },
            { header: t("Less2"), accessorKey: "Less2", cell: ({ row }) => fmtFixed(getRowVal(row.original, "Less2", "less2"), 2) },
            { header: t("Less3"), accessorKey: "Less3", cell: ({ row }) => fmtFixed(getRowVal(row.original, "Less3", "less3"), 2) },
            {
                header: t("INR Amount"),
                accessorKey: "MasterCurrencyAmount",
                cell: ({ row }) => fmtFixed(getRowVal(row.original, "MasterCurrencyAmount", "masterCurrencyAmount"), 2),
                footer: ({ table }) => {
                    const { parentINR } = getTableTotals(table);
                    return <span className="fw-bold text-end d-block">{fmtFixed(parentINR, 2)}</span>;
                }
            },
            {
                header: t("USD Amount"),
                accessorKey: "StockCurrencyAmount",
                cell: ({ row }) => fmtFixed(getRowVal(row.original, "StockCurrencyAmount", "stockCurrencyAmount"), 2),
                footer: ({ table }) => {
                    const { parentUSD } = getTableTotals(table);
                    return <span className="fw-bold text-end d-block">{fmtFixed(parentUSD, 2)}</span>;
                }
            },
            { header: t("StockType"), accessorKey: "StockType", cell: ({ row }) => dashText(getRowVal(row.original, "StockType", "stockType")) },
            { header: t("SalesPerson"), accessorKey: "SalesPerson", cell: ({ row }) => dashText(getRowVal(row.original, "SalesPerson", "salesPerson")) }
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
            "Item",
            "Shape",
            "Color",
            "Clarity",
            "Size",
            "Sieve",
            "Issue Carats",
            "RejeP",
            "Rejection",
            "Selection Carats",
            "Rate",
            "Amount",
            "Broker",
            "Less1",
            "Less2",
            "Less3",
            "INR Amount",
            "USD Amount",
            "StockType",
            "SalesPerson"
        ];

        const rows = reportRows.map((row) => [
            formatReportDisplayDate(getRowVal(row, "ConDATE", "conDATE", "condate", "Date", "date")),
            dashText(getRowVal(row, "Invno", "invno", "InvNo", "invNo")),
            dashText(getRowVal(row, "BillNo", "billNo", "billno")),
            dashText(getRowVal(row, "Party", "party")),
            dashText(getRowVal(row, "Item", "item")),
            dashText(getRowVal(row, "ShapeId", "shapeId")),
            dashText(getRowVal(row, "ColorId", "colorId")),
            dashText(getRowVal(row, "ClarityId", "clarityId")),
            dashText(getRowVal(row, "SizeId", "sizeId")),
            dashText(getRowVal(row, "SieveId", "sieveId")),
            fmtFixed(getRowVal(row, "IssueCarats", "issueCarats"), 2),
            fmtFixed(getRowVal(row, "Discount", "discount"), 2),
            fmtFixed(getRowVal(row, "ReturnCarats", "returnCarats"), 2),
            fmtFixed(getRowVal(row, "Carats", "carats"), 3),
            fmtFixed(getRowVal(row, "Rate", "rate"), 2),
            fmtFixed(getRowVal(row, "Amount", "amount"), 2),
            dashText(getRowVal(row, "Broker", "broker")),
            fmtFixed(getRowVal(row, "Less1", "less1"), 2),
            fmtFixed(getRowVal(row, "Less2", "less2"), 2),
            fmtFixed(getRowVal(row, "Less3", "less3"), 2),
            fmtFixed(getRowVal(row, "MasterCurrencyAmount", "masterCurrencyAmount"), 2),
            fmtFixed(getRowVal(row, "StockCurrencyAmount", "stockCurrencyAmount"), 2),
            dashText(getRowVal(row, "StockType", "stockType")),
            dashText(getRowVal(row, "SalesPerson", "salesPerson"))
        ]);

        const totalCarat = reportRows.reduce((s, r) => s + Number(getRowVal(r, "Carats", "carats") || 0), 0);
        const totalAmount = reportRows.reduce((s, r) => s + Number(getRowVal(r, "Amount", "amount") || 0), 0);
        const totalINR = reportRows.reduce((s, r) => s + Number(getRowVal(r, "MasterCurrencyAmount", "masterCurrencyAmount") || 0), 0);
        const totalUSD = reportRows.reduce((s, r) => s + Number(getRowVal(r, "StockCurrencyAmount", "stockCurrencyAmount") || 0), 0);
        const totalRate = totalCarat > 0 ? totalAmount / totalCarat : 0;

        rows.push([
            "Total:",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            fmtFixed(totalCarat, 3),
            fmtFixed(totalRate, 2),
            fmtFixed(totalAmount, 2),
            "",
            "",
            "",
            "",
            fmtFixed(totalINR, 2),
            fmtFixed(totalUSD, 2),
            "",
            ""
        ]);

        const res = await exportToExcel(headers, rows, "MixSale-report", "MixSale-report");
        if (!res?.success) toast.error(t("Excel export failed."));
    };

    document.title = `${t("Mix Sale Report")} | ${t("Reports")}`;

    return (
        <React.Fragment>
            <ToastContainer />

            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title={t("Mix Sale Report")} pageTitle={t("Parcel Reports")} />

                    <div className="card stock-search-header-bar d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between mb-3 p-3 rounded-3 shadow-sm border gap-2">
                        <h5 className="mb-0 fw-bold text-primary d-flex align-items-center gap-2">
                            <i className={hasSearched ? "ri-database-2-line fs-20 text-primary" : "ri-search-eye-line fs-20 text-primary"}></i>
                            {hasSearched ? t("Mix Sale Report Results") : t("Mix Sale Report Filters")}
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
                                            setExpandedInvnos(new Set());
                                        }}
                                        disabled={loading}
                                    >
                                        {t("New Search")}
                                    </Button>
                                    <Button color="success" className="btn-sm rounded-2 px-3 py-1" onClick={handleExcel} disabled={reportRows.length === 0}>
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
                                                        placeholder={t("InvNo")}
                                                        onChange={(e) => setFilters((prev) => ({ ...prev, invNo: e.target.value }))}
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
                                                        onChange={(sel) => {
                                                            setFilters((prev) => ({ ...prev, party: sel?.value || "" }));
                                                            if (!sel) {
                                                                setPartyInput("");
                                                                handleAccountSearch("", setPartyOptions, setLoadingParties);
                                                            }
                                                        }}
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
                                                        onChange={(sel) => {
                                                            setFilters((prev) => ({ ...prev, broker: sel?.value || "" }));
                                                            if (!sel) {
                                                                setBrokerInput("");
                                                                handleAccountSearch("", setBrokerOptions, setLoadingBrokers);
                                                            }
                                                        }}
                                                        placeholder={t("Search Broker")}
                                                        isLoading={loadingBrokers}
                                                    />
                                                </FormGroup>
                                            </Col>
                                        </Row>

                                        <Row className="g-2">
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
                                                    <Label className="fw-medium mb-1 small">{t("Salesperson")}</Label>
                                                    <Select
                                                        classNamePrefix="react-select"
                                                        styles={customStyles}
                                                        isClearable
                                                        options={salesPersonOptions}
                                                        value={salesPersonOptions.find((o) => o.value === filters.salesPerson) || null}
                                                        onChange={(sel) => setFilters((prev) => ({ ...prev, salesPerson: sel?.value || "" }))}
                                                        placeholder={t("Select Salesperson")}
                                                        isLoading={loadingSalesPersons}
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
                                                placeholder={t("Search by lot no")}
                                                value={filters.lotNo}
                                                onChange={(e) => setFilters((prev) => ({ ...prev, lotNo: e.target.value }))}
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

export default MixSaleReport;