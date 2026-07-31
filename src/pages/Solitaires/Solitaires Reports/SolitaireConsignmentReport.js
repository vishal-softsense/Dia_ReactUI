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
  getSolitaireConsignmentInDropdowns,
  getSolitaireConsignmentInReport,
  getSolitaireConsignmentInSummary
} from "../../../helpers/fakebackend_helper";
import { useSettingReportDates } from "../../../Components/Hooks/useSettingReportDates";

const dashText = (value) =>
  value === null || value === undefined || value === "" ? "-" : String(value);

const fmtFixed = (value, decimals) => {
  if (value === null || value === undefined || value === "" || Number.isNaN(Number(value)))
    return (0).toFixed(decimals);
  return Number(value).toFixed(decimals);
};

const getRowVal = (row, ...keys) => {
  for (const key of keys) {
    if (row?.[key] !== undefined && row?.[key] !== null && row?.[key] !== "") return row[key];
  }
  return "";
};

// ──────────────────────────────────────────────
// Footer totals for main report (parent rows)
// ──────────────────────────────────────────────
const getTableTotals = (table) => {
  const rows = table.getFilteredRowModel().rows.map((r) => r.original);
  let totalCarats = 0, totalAmount = 0, totalReturn = 0, totalPurchase = 0;
  let totalMemoOut = 0, totalSale = 0, totalBalance = 0, totalBalanceAmt = 0;

  rows.forEach((r) => {
    if (r?.isParent) {
      totalCarats   += Number(r.Carats   || 0);
      totalAmount   += Number(r.Amount   || 0);
      totalReturn   += Number(r.Return   || 0);
      totalPurchase += Number(r.Purchase || 0);
      totalMemoOut  += Number(r.MemoOut  || 0);
      totalSale     += Number(r.Sale     || 0);
      totalBalance  += Number(r.Balance  || 0);
      totalBalanceAmt += Number(r.BalanceAmt || 0);
    }
  });

  return { totalCarats, totalAmount, totalReturn, totalPurchase, totalMemoOut, totalSale, totalBalance, totalBalanceAmt };
};

const SolitaireConsignmentReport = () => {
  const { t } = useTranslation();

  const { fromDate, toDate, getDates, mergeDates } = useSettingReportDates({ includeReturnDates: true });

  const [loadingDropdowns, setLoadingDropdowns] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSummaryMode, setIsSummaryMode] = useState(false);

  const [dropdownData, setDropdownData] = useState({});
  const [expandedMemoNos, setExpandedMemoNos] = useState(() => new Set());
  const [reportRows, setReportRows] = useState([]);
  const [summaryRows, setSummaryRows] = useState([]);

  const [filters, setFilters] = useState({
    fromDate,
    toDate,
    currency: "",
    invNo: "",
    type: "ALL",
    party: "",
    broker: "",
    seller: "",
    chkRtnDate: false,
    fromRtnDate: fromDate,
    toRtnDate: toDate,
    clear: false,
    summary: false,
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
        height: "35px",
        minHeight: "35px"
      }),
      valueContainer: (provided) => ({
        ...provided,
        height: "35px",
        padding: "0 6px",
        display: "flex",
        alignItems: "center"
      }),
      input: (provided) => ({ ...provided, margin: "0px", padding: "0px" }),
      indicatorSeparator: () => ({ display: "none" }),
      indicatorsContainer: (provided) => ({ ...provided, height: "33px" }),
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
      multiValue: (provided) => ({ ...provided, backgroundColor: "var(--vz-light)", fontSize: "10px" })
    }),
    []
  );

  const getOptions = useCallback(
    (key) => {
      const list = dropdownData?.[key] || [];
      return list.map((item) => ({
        value: item.id ?? item.ID ?? item.value ?? "",
        label: String(item.name ?? item.Name ?? item.label ?? "").toUpperCase()
      }));
    },
    [dropdownData]
  );

  const getAccountOptions = useCallback(() => {
    const list = dropdownData?.["account"] || [];
    return list.map((item) => ({
      value: item.name ?? item.Name ?? "",
      label: String(item.name ?? item.Name ?? "").toUpperCase()
    }));
  }, [dropdownData]);

  useEffect(() => {
    const loadDropdowns = async () => {
      setLoadingDropdowns(true);
      try {
        const res = await getSolitaireConsignmentInDropdowns();
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
    setFilters((prev) => mergeDates(prev));
  }, [fromDate, toDate, mergeDates]);

  const handleMultiChange = (name, selected) => {
    setFilters((prev) => ({ ...prev, [name]: selected ? selected.map((x) => x.value) : [] }));
  };

  const handleClear = async () => {
    const d = await getDates();
    setHasSearched(false);
    setExpandedMemoNos(new Set());
    setReportRows([]);
    setSummaryRows([]);
    setIsSummaryMode(false);
    setFilters(mergeDates({
      currency: "",
      invNo: "",
      type: "ALL",
      party: "",
      broker: "",
      seller: "",
      chkRtnDate: false,
      clear: false,
      summary: false,
      lotNo: "",
      shape: [], color: [], clarity: [], size: [], proportion: [], polish: [],
      symmetry: [], lab: [], fluorescence: [], milky: [], luster: [], natts: [],
      mines: [], productType: [], sieve: []
    }, d));
  };

  const buildPayload = () => ({
    FromDate: filters.fromDate,
    ToDate: filters.toDate,
    Currency: filters.currency || null,
    InvNo: filters.invNo || null,
    Type: filters.type || "ALL",
    Party: filters.party || null,
    Broker: filters.broker || null,
    Seller: filters.seller || null,
    ExpParty: filters.seller || null,
    ChkRtnDate: filters.chkRtnDate,
    FromRtnDate: filters.fromRtnDate,
    ToRtnDate: filters.toRtnDate,
    Clear: filters.clear,
    Summary: filters.summary,
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
      const payload = buildPayload();
      const isSummary = filters.summary;
      setIsSummaryMode(isSummary);

      if (isSummary) {
        const response = await getSolitaireConsignmentInSummary(payload);
        const ok = response?.success || response?.Success;
        if (ok) {
          setSummaryRows(response.Data || response.data || []);
          setReportRows([]);
          setHasSearched(true);
          setExpandedMemoNos(new Set());
          toast.success(t("Report loaded successfully."));
        } else {
          toast.warning(response?.Message || t("Failed to load report."));
        }
      } else {
        const response = await getSolitaireConsignmentInReport(payload);
        const ok = response?.success || response?.Success;
        if (ok) {
          setReportRows(response.Data || response.data || []);
          setSummaryRows([]);
          setHasSearched(true);
          setExpandedMemoNos(new Set());
          toast.success(t("Report loaded successfully."));
        } else {
          toast.warning(response?.Message || t("Failed to load report."));
        }
      }
    } catch (err) {
      console.error("Consignment report request failed:", err);
      const msg =
        typeof err === "string"
          ? err
          : err?.response?.data?.message || err?.response?.data?.Message || null;
      toast.error(msg || t("Server Connection Problem.."));
    } finally {
      setLoading(false);
    }
  };

  // ──────────────────────────────────────────────
  // Group raw rows by MemoNo → parent + children
  // ──────────────────────────────────────────────
  const groupedVisibleRows = useMemo(() => {
    const grouped = {};
    (reportRows || []).forEach((r) => {
      const key = String(r.MemoNo ?? r.memoNo ?? "UNKNOWN");
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(r);
    });

    const out = [];
    Object.keys(grouped).forEach((memoNo) => {
      const rows = grouped[memoNo];
      const first = rows[0];

      const totalCarats    = rows.reduce((s, r) => s + Number(getRowVal(r, "Carats", "carats") || 0), 0);
      const totalAmount    = rows.reduce((s, r) => s + Number(getRowVal(r, "Amount", "amount") || 0), 0);
      const totalReturn    = rows.reduce((s, r) => s + Number(getRowVal(r, "Return", "return") || 0), 0);
      const totalPurchase  = rows.reduce((s, r) => s + Number(getRowVal(r, "Purchase", "purchase") || 0), 0);
      const totalMemoOut   = rows.reduce((s, r) => s + Number(getRowVal(r, "MemoOut", "memoOut", "memoout") || 0), 0);
      const totalSale      = rows.reduce((s, r) => s + Number(getRowVal(r, "Sale", "sale") || 0), 0);
      const totalBalance   = rows.reduce((s, r) => s + Number(getRowVal(r, "Balance", "balance") || 0), 0);
      const totalBalanceAmt = rows.reduce((s, r) => s + Number(getRowVal(r, "BalanceAmt", "balanceAmt", "balanceamt") || 0), 0);
      const totalPrice     = totalCarats > 0 ? totalAmount / totalCarats : 0;

      out.push({
        isParent: true,
        MemoNo: memoNo,
        ConDATE: getRowVal(first, "ConDATE", "conDATE", "condate"),
        BillNo: getRowVal(first, "BillNo", "billNo", "billno"),
        Party: getRowVal(first, "Party", "party"),
        Broker: getRowVal(first, "Broker", "broker"),
        IssUser: getRowVal(first, "IssUser", "issUser"),
        Seller: getRowVal(first, "Seller", "seller"),
        Invtype: getRowVal(first, "Invtype", "invtype", "InvType", "invType"),
        Status: getRowVal(first, "Status", "status"),
        Code: getRowVal(first, "Code", "code"),
        Carats: totalCarats,
        Price: totalPrice,
        Amount: totalAmount,
        Return: totalReturn,
        Purchase: totalPurchase,
        MemoOut: totalMemoOut,
        Sale: totalSale,
        Balance: totalBalance,
        BalanceAmt: totalBalanceAmt,
        childRecords: rows
      });
    });

    return out;
  }, [reportRows]);

  // ──────────────────────────────────────────────
  // Render child rows on expand
  // ──────────────────────────────────────────────
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

  // ──────────────────────────────────────────────
  // Main report columns (normal mode)
  // ──────────────────────────────────────────────
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
                  window.open(`../consignment/edit-consignment?Id=${code}&Mode=view`, "_blank");
                }}
              >
                <i className="bx bx-show-alt"></i>
              </a>
            </div>
          );
        },
        footer: () => <span className="fw-bold text-center d-block">Total</span>
      },
      {
        header: t("DATE"),
        accessorKey: "ConDATE",
        cell: ({ row }) => dashText(getRowVal(row.original, "ConDATE", "conDATE"))
      },
      {
        header: t("BillNo"),
        accessorKey: "BillNo",
        cell: ({ row }) => row.original.isParent ? "" : dashText(getRowVal(row.original, "BillNo", "billNo"))
      },
      {
        header: t("MemoNo"),
        accessorKey: "MemoNo",
        cell: ({ row }) => dashText(getRowVal(row.original, "MemoNo", "memoNo"))
      },
      {
        header: t("Party"),
        accessorKey: "Party",
        cell: ({ row }) => dashText(getRowVal(row.original, "Party", "party"))
      },
      {
        header: t("LotNo"),
        accessorKey: "Lotno",
        cell: ({ row }) => row.original.isParent ? "" : dashText(getRowVal(row.original, "Lotno", "lotno", "LotNo"))
      },
      {
        header: t("Shape"),
        accessorKey: "ShapeId",
        cell: ({ row }) => row.original.isParent ? "" : dashText(getRowVal(row.original, "ShapeId", "shapeId"))
      },
      {
        header: t("Color"),
        accessorKey: "ColorId",
        cell: ({ row }) => row.original.isParent ? "" : dashText(getRowVal(row.original, "ColorId", "colorId"))
      },
      {
        header: t("Clarity"),
        accessorKey: "ClarityId",
        cell: ({ row }) => row.original.isParent ? "" : dashText(getRowVal(row.original, "ClarityId", "clarityId"))
      },
      {
        header: t("Carats"),
        accessorKey: "Carats",
        className: "carat-col text-end",
        cell: ({ row }) => fmtFixed(getRowVal(row.original, "Carats", "carats"), 3),
        footer: ({ table }) => {
          const { totalCarats } = getTableTotals(table);
          return <span className="fw-bold text-end d-block" style={{ background: "rgb(204,204,255)", color: "#000" }}>{fmtFixed(totalCarats, 3)}</span>;
        }
      },
      {
        header: t("Price"),
        accessorKey: "Price",
        cell: ({ row }) => fmtFixed(getRowVal(row.original, "Price", "price"), 2),
        footer: ({ table }) => {
          const { totalCarats, totalAmount } = getTableTotals(table);
          return <span className="fw-bold text-end d-block">{fmtFixed(totalCarats > 0 ? totalAmount / totalCarats : 0, 2)}</span>;
        }
      },
      {
        header: t("Amount"),
        accessorKey: "Amount",
        cell: ({ row }) => fmtFixed(getRowVal(row.original, "Amount", "amount"), 2),
        footer: ({ table }) => {
          const { totalAmount } = getTableTotals(table);
          return <span className="fw-bold text-end d-block">{fmtFixed(totalAmount, 2)}</span>;
        }
      },
      {
        header: t("Status"),
        accessorKey: "Status",
        cell: ({ row }) => {
          const val = dashText(getRowVal(row.original, "Status", "status"));
          return <span style={{ color: "#725f5f", fontWeight: "bold" }}>{val}</span>;
        }
      },
      {
        header: t("Return"),
        accessorKey: "Return",
        className: "rtn-col text-end",
        cell: ({ row }) => fmtFixed(getRowVal(row.original, "Return", "return"), 3),
        footer: ({ table }) => {
          const { totalReturn } = getTableTotals(table);
          return <span className="fw-bold text-end d-block" style={{ background: "rgb(153,204,255)", color: "#000" }}>{fmtFixed(totalReturn, 3)}</span>;
        }
      },
      {
        header: t("Purchase"),
        accessorKey: "Purchase",
        className: "pur-col text-end",
        cell: ({ row }) => fmtFixed(getRowVal(row.original, "Purchase", "purchase"), 3),
        footer: ({ table }) => {
          const { totalPurchase } = getTableTotals(table);
          return <span className="fw-bold text-end d-block" style={{ background: "rgb(204,255,201)", color: "#000" }}>{fmtFixed(totalPurchase, 3)}</span>;
        }
      },
      {
        header: t("MemoOut"),
        accessorKey: "MemoOut",
        cell: ({ row }) => fmtFixed(getRowVal(row.original, "MemoOut", "memoOut"), 3),
        footer: ({ table }) => {
          const { totalMemoOut } = getTableTotals(table);
          return <span className="fw-bold text-end d-block">{fmtFixed(totalMemoOut, 3)}</span>;
        }
      },
      {
        header: t("Sale"),
        accessorKey: "Sale",
        cell: ({ row }) => fmtFixed(getRowVal(row.original, "Sale", "sale"), 3),
        footer: ({ table }) => {
          const { totalSale } = getTableTotals(table);
          return <span className="fw-bold text-end d-block">{fmtFixed(totalSale, 3)}</span>;
        }
      },
      {
        header: t("Balance"),
        accessorKey: "Balance",
        className: "bal-col text-end",
        cell: ({ row }) => fmtFixed(getRowVal(row.original, "Balance", "balance"), 3),
        footer: ({ table }) => {
          const { totalBalance } = getTableTotals(table);
          return <span className="fw-bold text-end d-block" style={{ background: "rgb(255,204,153)", color: "#000" }}>{fmtFixed(totalBalance, 3)}</span>;
        }
      },
      {
        header: t("BalanceAmt"),
        accessorKey: "BalanceAmt",
        cell: ({ row }) => fmtFixed(getRowVal(row.original, "BalanceAmt", "balanceAmt"), 2),
        footer: ({ table }) => {
          const { totalBalanceAmt } = getTableTotals(table);
          return <span className="fw-bold text-end d-block">{fmtFixed(totalBalanceAmt, 2)}</span>;
        }
      },
      { header: t("Broker"), accessorKey: "Broker", cell: ({ row }) => dashText(getRowVal(row.original, "Broker", "broker")) },
      { header: t("IssUser"), accessorKey: "IssUser", cell: ({ row }) => dashText(getRowVal(row.original, "IssUser", "issUser")) },
      { header: t("Seller"), accessorKey: "Seller", cell: ({ row }) => dashText(getRowVal(row.original, "Seller", "seller")) },
      { header: t("RtnUser"), accessorKey: "RtnUser", cell: ({ row }) => row.original.isParent ? "" : dashText(getRowVal(row.original, "RtnUser", "rtnUser")) },
      { header: t("Remarks"), accessorKey: "Remarks", cell: ({ row }) => row.original.isParent ? "" : dashText(getRowVal(row.original, "Remarks", "remarks")) },
      { header: t("Estimate"), accessorKey: "Estimate", cell: ({ row }) => row.original.isParent ? "" : fmtFixed(getRowVal(row.original, "Estimate", "estimate"), 2) },
      { header: t("MRP"), accessorKey: "MRP", cell: ({ row }) => row.original.isParent ? "" : fmtFixed(getRowVal(row.original, "MRP", "mrp"), 2) },
      { header: t("Symbol"), accessorKey: "Symbol", cell: ({ row }) => row.original.isParent ? "" : dashText(getRowVal(row.original, "Symbol", "symbol")) },
      { header: t("Prop"), accessorKey: "PropId", cell: ({ row }) => row.original.isParent ? "" : dashText(getRowVal(row.original, "PropId", "propId")) },
      { header: t("Polish"), accessorKey: "PolishId", cell: ({ row }) => row.original.isParent ? "" : dashText(getRowVal(row.original, "PolishId", "polishId")) },
      { header: t("Sym"), accessorKey: "SymId", cell: ({ row }) => row.original.isParent ? "" : dashText(getRowVal(row.original, "SymId", "symId")) },
      { header: t("FL"), accessorKey: "FLId", cell: ({ row }) => row.original.isParent ? "" : dashText(getRowVal(row.original, "FLId", "flId")) },
      { header: t("Cert"), accessorKey: "CertId", cell: ({ row }) => row.original.isParent ? "" : dashText(getRowVal(row.original, "CertId", "certId")) },
      { header: t("CertificateNo"), accessorKey: "CertificateNo", cell: ({ row }) => row.original.isParent ? "" : dashText(getRowVal(row.original, "CertificateNo", "certificateNo")) },
      { header: t("InvType"), accessorKey: "Invtype", cell: ({ row }) => dashText(getRowVal(row.original, "Invtype", "invtype")) },
      { header: t("MemoTime"), accessorKey: "MemoTime", cell: ({ row }) => row.original.isParent ? "" : dashText(getRowVal(row.original, "MemoTime", "memoTime")) },
      { header: t("MemoReturnDate"), accessorKey: "MemoReturnDate", cell: ({ row }) => row.original.isParent ? "" : dashText(getRowVal(row.original, "MemoReturnDate", "memoReturnDate")) },
      { header: t("MemoReturnTime"), accessorKey: "MemoReturnTime", cell: ({ row }) => row.original.isParent ? "" : dashText(getRowVal(row.original, "MemoReturnTime", "memoReturnTime")) }
    ],
    [expandedMemoNos, t]
  );

  // ──────────────────────────────────────────────
  // Summary mode columns
  // ──────────────────────────────────────────────
  const summaryColumns = useMemo(
    () => [
      {
        header: t("Carats"),
        accessorKey: "Carats",
        className: "carat-col text-end",
        cell: ({ row }) => fmtFixed(getRowVal(row.original, "Carats", "carats"), 3)
      },
      {
        header: t("ReturnCarat"),
        accessorKey: "ReturnCrt",
        className: "rtn-col text-end",
        cell: ({ row }) => fmtFixed(getRowVal(row.original, "ReturnCrt", "returnCrt"), 3)
      },
      {
        header: t("PurCarat"),
        accessorKey: "PurCrt",
        className: "pur-col text-end",
        cell: ({ row }) => fmtFixed(getRowVal(row.original, "PurCrt", "purCrt"), 3)
      },
      {
        header: t("OnMemoCarat"),
        accessorKey: "OnmemoCrt",
        className: "text-end",
        cell: ({ row }) => fmtFixed(getRowVal(row.original, "OnmemoCrt", "onmemoCrt"), 3)
      },
      {
        header: t("SoldCarat"),
        accessorKey: "SoldCrt",
        className: "text-end",
        cell: ({ row }) => fmtFixed(getRowVal(row.original, "SoldCrt", "soldCrt"), 3)
      },
      {
        header: t("OnHandCarat"),
        accessorKey: "OnHandCrt",
        className: "bal-col text-end",
        cell: ({ row }) => fmtFixed(getRowVal(row.original, "OnHandCrt", "onHandCrt"), 3)
      }
    ],
    [t]
  );

  // ──────────────────────────────────────────────
  // Excel export
  // ──────────────────────────────────────────────
  const handleExcel = async () => {
    if (isSummaryMode) {
      if (!summaryRows || summaryRows.length === 0) {
        toast.warning(t("No data available to export."));
        return;
      }
      const headers = ["Carats", "ReturnCarat", "PurCarat", "OnMemoCarat", "SoldCarat", "OnHandCarat"];
      const rows = summaryRows.map((r) => [
        fmtFixed(r.Carats || r.carats, 3),
        fmtFixed(r.ReturnCrt || r.returnCrt, 3),
        fmtFixed(r.PurCrt || r.purCrt, 3),
        fmtFixed(r.OnmemoCrt || r.onmemoCrt, 3),
        fmtFixed(r.SoldCrt || r.soldCrt, 3),
        fmtFixed(r.OnHandCrt || r.onHandCrt, 3)
      ]);
      const res = await exportToExcel(headers, rows, "ConsignmentSummaryReport", "ConsignmentSummaryReport");
      if (!res?.success) toast.error(t("Excel export failed."));
      return;
    }

    if (!reportRows || reportRows.length === 0) {
      toast.warning(t("No data available to export."));
      return;
    }

    const headers = [
      "Date", "BillNo", "MemoNo", "Party", "LotNo", "Shape", "Color", "Clarity",
      "Carats", "Price", "Amount", "Status", "Return", "Purchase", "MemoOut", "Sale",
      "Balance", "BalanceAmt", "Broker", "IssUser", "Seller", "RtnUser", "Remarks",
      "Estimate", "MRP", "Symbol", "Prop", "Polish", "Sym", "FL", "Cert",
      "CertificateNo", "InvType", "MemoTime", "MemoReturnDate", "MemoReturnTime"
    ];

    const rows = reportRows.map((r) => [
      dashText(r.ConDATE || r.conDATE),
      dashText(r.BillNo || r.billNo),
      dashText(r.MemoNo || r.memoNo),
      dashText(r.Party || r.party),
      dashText(r.Lotno || r.lotno),
      dashText(r.ShapeId || r.shapeId),
      dashText(r.ColorId || r.colorId),
      dashText(r.ClarityId || r.clarityId),
      fmtFixed(r.Carats || r.carats, 3),
      fmtFixed(r.Price || r.price, 2),
      fmtFixed(r.Amount || r.amount, 2),
      dashText(r.Status || r.status),
      fmtFixed(r.Return || r.return, 3),
      fmtFixed(r.Purchase || r.purchase, 3),
      fmtFixed(r.MemoOut || r.memoOut, 3),
      fmtFixed(r.Sale || r.sale, 3),
      fmtFixed(r.Balance || r.balance, 3),
      fmtFixed(r.BalanceAmt || r.balanceAmt, 2),
      dashText(r.Broker || r.broker),
      dashText(r.IssUser || r.issUser),
      dashText(r.Seller || r.seller),
      dashText(r.RtnUser || r.rtnUser),
      dashText(r.Remarks || r.remarks),
      fmtFixed(r.Estimate || r.estimate, 2),
      fmtFixed(r.MRP || r.mrp, 2),
      dashText(r.Symbol || r.symbol),
      dashText(r.PropId || r.propId),
      dashText(r.PolishId || r.polishId),
      dashText(r.SymId || r.symId),
      dashText(r.FLId || r.flId),
      dashText(r.CertId || r.certId),
      dashText(r.CertificateNo || r.certificateNo),
      dashText(r.Invtype || r.invtype),
      dashText(r.MemoTime || r.memoTime),
      dashText(r.MemoReturnDate || r.memoReturnDate),
      dashText(r.MemoReturnTime || r.memoReturnTime)
    ]);

    const res = await exportToExcel(headers, rows, "ConsignmentReport", "ConsignmentReport");
    if (!res?.success) toast.error(t("Excel export failed."));
  };

  document.title = `${t("Consignment Report")} | ${t("Reports")}`;

  const typeOptions = [
    { value: "ALL", label: "ALL" },
    { value: "External", label: "EXTERNAL" },
    { value: "Internal", label: "INTERNAL" },
    { value: "Local", label: "LOCAL" },
    { value: "LAB", label: "LAB" },
    { value: "Pend Sale", label: "PEND SALE" }
  ];

  return (
    <React.Fragment>
      <ToastContainer />

      <div className="page-content">
        <Container fluid>
          <BreadCrumb title={t("Consignment Report")} pageTitle={t("Reports")} />

          {/* ── Header Bar ── */}
          <div className="card stock-search-header-bar d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between mb-3 p-3 rounded-3 shadow-sm border gap-2">
            <h5 className="mb-0 fw-bold text-primary d-flex align-items-center gap-2">
              <i className={hasSearched ? "ri-database-2-line fs-20 text-primary" : "ri-search-eye-line fs-20 text-primary"}></i>
              {hasSearched ? t("Consignment Report Results") : t("Consignment Report Filters")}
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
                      setSummaryRows([]);
                      setExpandedMemoNos(new Set());
                    }}
                    disabled={loading}
                  >
                    {t("New Search")}
                  </Button>

                  <UncontrolledDropdown>
                    <DropdownToggle
                      color="success"
                      className="btn-sm rounded-2 px-3 py-1"
                      caret
                      disabled={(isSummaryMode ? summaryRows.length : reportRows.length) === 0}
                    >
                      {t("Excel")} / {t("Print")}
                    </DropdownToggle>
                    <DropdownMenu>
                      <DropdownItem onClick={handleExcel}>Direct Print</DropdownItem>
                      <DropdownItem onClick={handleExcel}>Consignment Report Print</DropdownItem>
                    </DropdownMenu>
                  </UncontrolledDropdown>
                </>
              )}
            </div>
          </div>

          {/* ── Filter Panel ── */}
          {!hasSearched && (
            <Card className="shadow-lg border-0 rounded-3 mb-4">
              <CardBody className="bg-light-subtle">
                <Row className="g-3">
                  {/* Left 10 cols */}
                  <Col md={10}>
                    {/* Row 1: Date, ToDate, Currency, MemoNo, Type, Summary+Clear */}
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
                          <Label className="fw-medium mb-1 small">{t("Memo No")}</Label>
                          <Input
                            type="text"
                            className="form-control form-control-sm"
                            style={{ height: "35px" }}
                            value={filters.invNo}
                            placeholder={t("MemoNo")}
                            onChange={(e) => setFilters((prev) => ({ ...prev, invNo: e.target.value }))}
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
                            onChange={(sel) => setFilters((prev) => ({ ...prev, type: sel?.value || "ALL" }))}
                          />
                        </FormGroup>
                      </Col>
                      <Col sm={2}>
                        <FormGroup className="mb-0">
                          <div className="d-flex align-items-center gap-1 mb-2" style={{ height: "20px" }}>
                            <input
                              type="checkbox"
                              id="summaryCheckbox"
                              checked={filters.summary}
                              onChange={(e) => setFilters((prev) => ({ ...prev, summary: e.target.checked }))}
                            />
                            <Label htmlFor="summaryCheckbox" className="mb-0 small" style={{ color: "red", fontWeight: "bold" }}>
                              {t("Consignment Summary")}
                            </Label>
                          </div>
                          <div className="d-flex align-items-center gap-1" style={{ height: "20px" }}>
                            <input
                              type="checkbox"
                              id="clearCheckbox"
                              checked={filters.clear}
                              onChange={(e) => setFilters((prev) => ({ ...prev, clear: e.target.checked }))}
                            />
                            <Label htmlFor="clearCheckbox" className="mb-0 small">{t("Show Clear Consignment")}</Label>
                          </div>
                        </FormGroup>
                      </Col>
                    </Row>

                    {/* Row 2: Return Date, Party, Broker, Seller */}
                    <Row className="g-2 mb-2">
                      <Col sm={2}>
                        <FormGroup className="mb-0">
                          <div className="d-flex align-items-center gap-1 mb-1">
                            <input
                              type="checkbox"
                              id="rtnDateCheckbox"
                              checked={filters.chkRtnDate}
                              onChange={(e) => setFilters((prev) => ({ ...prev, chkRtnDate: e.target.checked }))}
                            />
                            <Label htmlFor="rtnDateCheckbox" className="fw-medium mb-0 small">{t("Rtn Date")}</Label>
                          </div>
                          <input
                            type="date"
                            className="form-control form-control-sm"
                            style={{ height: "35px" }}
                            value={filters.fromRtnDate}
                            disabled={!filters.chkRtnDate}
                            onChange={(e) => setFilters((prev) => ({ ...prev, fromRtnDate: e.target.value }))}
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
                            onChange={(e) => setFilters((prev) => ({ ...prev, toRtnDate: e.target.value }))}
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
                            options={getAccountOptions()}
                            value={getAccountOptions().find((o) => o.value === filters.party) || null}
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
                            options={getAccountOptions()}
                            value={getAccountOptions().find((o) => o.value === filters.broker) || null}
                            onChange={(sel) => setFilters((prev) => ({ ...prev, broker: sel?.value || "" }))}
                            placeholder={t("Search Broker")}
                            isLoading={loadingDropdowns}
                          />
                        </FormGroup>
                      </Col>
                      <Col sm={2}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1 small">{t("Seller")}</Label>
                          <Select
                            classNamePrefix="react-select"
                            styles={customStyles}
                            isClearable
                            options={getAccountOptions()}
                            value={getAccountOptions().find((o) => o.value === filters.seller) || null}
                            onChange={(sel) => setFilters((prev) => ({ ...prev, seller: sel?.value || "" }))}
                            placeholder={t("Search Seller")}
                            isLoading={loadingDropdowns}
                          />
                        </FormGroup>
                      </Col>
                    </Row>
                  </Col>

                  {/* Right 2 cols — Lot No textarea */}
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

                {/* Row 3: Shape, Color, Clarity, Size, Proportion, Polish */}
                <Row className="g-2 mb-2">
                  {[
                    { label: "Shape", key: "shape" },
                    { label: "Color", key: "color" },
                    { label: "Clarity", key: "clarity" },
                    { label: "Size", key: "size" },
                    { label: "Proportion", key: "proportion" },
                    { label: "Polish", key: "polish" }
                  ].map(({ label, key }) => (
                    <Col sm={2} key={key}>
                      <FormGroup className="mb-0">
                        <Label className="fw-medium mb-1 small">{t(label)}</Label>
                        <Select
                          isMulti
                          classNamePrefix="react-select"
                          styles={customStyles}
                          options={getOptions(key)}
                          value={getOptions(key).filter((o) => filters[key].includes(o.value))}
                          onChange={(sel) => handleMultiChange(key, sel)}
                          isLoading={loadingDropdowns}
                          placeholder={t(label)}
                        />
                      </FormGroup>
                    </Col>
                  ))}
                </Row>

                {/* Row 4: Symmetry, LAB, Fluorescence, Milky, Luster, Natts */}
                <Row className="g-2 mb-2">
                  {[
                    { label: "Symmetry", key: "symmetry" },
                    { label: "LAB", key: "lab" },
                    { label: "Fluorescence", key: "fluorescence" },
                    { label: "Milky", key: "milky" },
                    { label: "Luster", key: "luster" },
                    { label: "Natts", key: "natts" }
                  ].map(({ label, key }) => (
                    <Col sm={2} key={key}>
                      <FormGroup className="mb-0">
                        <Label className="fw-medium mb-1 small">{t(label)}</Label>
                        <Select
                          isMulti
                          classNamePrefix="react-select"
                          styles={customStyles}
                          options={getOptions(key)}
                          value={getOptions(key).filter((o) => filters[key].includes(o.value))}
                          onChange={(sel) => handleMultiChange(key, sel)}
                          isLoading={loadingDropdowns}
                          placeholder={t(label)}
                        />
                      </FormGroup>
                    </Col>
                  ))}
                </Row>

                {/* Row 5: Mines, ProductType, Sieve */}
                <Row className="g-2">
                  {[
                    { label: "Mines", key: "mines" },
                    { label: "ProductType", key: "productType" },
                    { label: "Sieve", key: "sieve" }
                  ].map(({ label, key }) => (
                    <Col sm={2} key={key}>
                      <FormGroup className="mb-0">
                        <Label className="fw-medium mb-1 small">{t(label)}</Label>
                        <Select
                          isMulti
                          classNamePrefix="react-select"
                          styles={customStyles}
                          options={getOptions(key)}
                          value={getOptions(key).filter((o) => filters[key].includes(o.value))}
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

          {/* ── Results Panel ── */}
          {hasSearched && (
            <Card className="shadow-lg border-0 rounded-3 mb-4">
              <CardBody>
                <div className="d-flex justify-content-end gap-4 mb-3 small fw-semibold">
                  <span>
                    {t("Showing")}: {isSummaryMode ? summaryRows.length : groupedVisibleRows.length} {t("rows")}
                  </span>
                </div>

                {isSummaryMode ? (
                  summaryRows.length === 0 ? (
                    <div className="text-center py-4 text-muted">{t("No data available.")}</div>
                  ) : (
                    <TableContainer
                      columns={summaryColumns}
                      data={summaryRows}
                      isGlobalFilter={true}
                      customPageSize={500}
                      customPageSizes={[500, 1000, 1500]}
                      divClass="table-responsive table-card mb-3"
                      tableClass="align-middle table-nowrap mb-0 table-hover table-striped"
                      theadClass="table-light"
                      SearchPlaceholder={t("SEARCH:")}
                    />
                  )
                ) : groupedVisibleRows.length === 0 ? (
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

export default SolitaireConsignmentReport;
