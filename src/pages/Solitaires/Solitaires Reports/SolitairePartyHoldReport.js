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
  getSolitairePartyHoldDropdowns,
  getSolitairePartyHoldReport
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

const getTableTotals = (table) => {
  const rows = table.getFilteredRowModel().rows.map((r) => r.original);
  let totalCarats = 0;
  let totalAmount = 0;
  let totalReturn = 0;
  let totalBalance = 0;
  let totalBalanceAmt = 0;

  rows.forEach((r) => {
    if (r?.isParent) {
      totalCarats += Number(r.Carats || 0);
      totalAmount += Number(r.Amount || 0);
      totalReturn += Number(r.Return || 0);
      totalBalance += Number(r.Balance || 0);
      totalBalanceAmt += Number(r.BalanceAmt || 0);
    }
  });

  return { totalCarats, totalAmount, totalReturn, totalBalance, totalBalanceAmt };
};

const SolitairePartyHoldReport = () => {
  const { t } = useTranslation();

  const { fromDate, toDate, getDates, mergeDates } = useSettingReportDates({ includeReturnDates: true });

  const [loadingDropdowns, setLoadingDropdowns] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const [dropdownData, setDropdownData] = useState({});
  const [expandedMemoNos, setExpandedMemoNos] = useState(() => new Set());
  const [reportRows, setReportRows] = useState([]);

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
        const res = await getSolitairePartyHoldDropdowns();
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
    setFilters(mergeDates({
      currency: "",
      invNo: "",
      type: "ALL",
      party: "",
      broker: "",
      seller: "",
      chkRtnDate: false,
      clear: false,
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
      const response = await getSolitairePartyHoldReport(buildPayload());
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
      console.error("Party Hold report request failed:", err);
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
      const rows = grouped[memoNo];
      const first = rows[0];

      const totalCarats = rows.reduce((s, r) => s + Number(getRowVal(r, "Carats", "carats") || 0), 0);
      const totalAmount = rows.reduce((s, r) => s + Number(getRowVal(r, "Amount", "amount") || 0), 0);
      const totalReturn = rows.reduce((s, r) => s + Number(getRowVal(r, "Return", "return") || 0), 0);
      const totalBalance = rows.reduce((s, r) => s + Number(getRowVal(r, "Balance", "balance") || 0), 0);
      const totalBalanceAmt = rows.reduce((s, r) => s + Number(getRowVal(r, "BalanceAmt", "balanceAmt") || 0), 0);
      const totalEstimate = rows.reduce((s, r) => s + Number(getRowVal(r, "Estimate", "estimate") || 0), 0);
      const totalPrice = totalCarats > 0 ? totalAmount / totalCarats : 0;

      out.push({
        ...first,
        isParent: true,
        Code: "",
        MemoNo: memoNo,
        Carats: totalCarats,
        Price: totalPrice,
        Amount: totalAmount,
        Return: totalReturn,
        Balance: totalBalance,
        BalanceAmt: totalBalanceAmt,
        Estimate: totalEstimate,
        Discount: "",
        Lotno: "",
        ItemName: "",
        MemoReturnDate: "",
        RtnUser: "",
        BalanceCarats3Dec: "",
        MRP: "",
        Symbol: "",
        ShapeId: "",
        ColorId: "",
        ClarityId: "",
        PropId: "",
        PolishId: "",
        SymId: "",
        FLId: "",
        CertId: "",
        CertificateNo: "",
        MemoTime: "",
        MemoReturnTime: "",
        childRecords: rows
      });
    });

    return out;
  }, [reportRows]);

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
                  window.open(`../PartyHold/edit-PartyHold?Id=${code}&Mode=view`, "_blank");
                }}
              >
                <i className="bx bx-show-alt"></i>
              </a>
            </div>
          );
        },
        footer: () => <span className="fw-bold text-center d-block">Total</span>
      },
      { header: t("DATE"), accessorKey: "ConDATE", cell: ({ row }) => dashText(getRowVal(row.original, "ConDATE", "conDATE")) },
      { header: t("DateDiff"), accessorKey: "DateDiff", cell: ({ row }) => fmtFixed(getRowVal(row.original, "DateDiff", "dateDiff"), 0) },
      { header: t("PartyHoldNo"), accessorKey: "MemoNo", cell: ({ row }) => dashText(getRowVal(row.original, "MemoNo", "memoNo")) },
      { header: t("BillNo"), accessorKey: "BillNo", cell: ({ row }) => dashText(getRowVal(row.original, "BillNo", "billNo")) },
      { header: t("Party"), accessorKey: "Party", cell: ({ row }) => dashText(getRowVal(row.original, "Party", "party")) },
      { header: t("LotNo"), accessorKey: "Lotno", cell: ({ row }) => row.original.isParent ? "" : dashText(getRowVal(row.original, "Lotno", "lotno", "LotNo")) },
      { header: t("ItemName"), accessorKey: "ItemName", cell: ({ row }) => row.original.isParent ? "" : dashText(getRowVal(row.original, "ItemName", "itemName")) },
      { header: t("Discount"), accessorKey: "Discount", cell: ({ row }) => row.original.isParent ? "" : fmtFixed(getRowVal(row.original, "Discount", "discount"), 2) },
      {
        header: t("Price"),
        accessorKey: "Price",
        className: "text-end",
        cell: ({ row }) => fmtFixed(getRowVal(row.original, "Price", "price"), 2)
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
        header: t("Return"),
        accessorKey: "Return",
        className: "text-end",
        cell: ({ row }) => fmtFixed(getRowVal(row.original, "Return", "return"), 3),
        footer: ({ table }) => {
          const { totalReturn } = getTableTotals(table);
          return <span className="fw-bold text-end d-block">{fmtFixed(totalReturn, 2)}</span>;
        }
      },
      { header: t("ReturnDate"), accessorKey: "MemoReturnDate", cell: ({ row }) => row.original.isParent ? "" : dashText(getRowVal(row.original, "MemoReturnDate", "memoReturnDate", "ReturnDate")) },
      {
        header: t("Balance"),
        accessorKey: "Balance",
        className: "text-end",
        cell: ({ row }) => fmtFixed(getRowVal(row.original, "Balance", "balance"), 3),
        footer: ({ table }) => {
          const { totalBalance } = getTableTotals(table);
          return <span className="fw-bold text-end d-block">{fmtFixed(totalBalance, 2)}</span>;
        }
      },
      {
        header: t("BalanceAmt"),
        accessorKey: "BalanceAmt",
        className: "text-end",
        cell: ({ row }) => fmtFixed(getRowVal(row.original, "BalanceAmt", "balanceAmt"), 2)
      },
      { header: t("Broker"), accessorKey: "Broker", cell: ({ row }) => dashText(getRowVal(row.original, "Broker", "broker")) },
      {
        header: t("Carats"),
        accessorKey: "Carats",
        className: "text-end",
        cell: ({ row }) => fmtFixed(getRowVal(row.original, "Carats", "carats"), 3),
        footer: ({ table }) => {
          const { totalCarats } = getTableTotals(table);
          return <span className="fw-bold text-end d-block">{fmtFixed(totalCarats, 2)}</span>;
        }
      },
      { header: t("IssUser"), accessorKey: "IssUser", cell: ({ row }) => dashText(getRowVal(row.original, "IssUser", "issUser")) },
      { header: t("Seller"), accessorKey: "Seller", cell: ({ row }) => dashText(getRowVal(row.original, "Seller", "seller")) },
      { header: t("RtnUser"), accessorKey: "RtnUser", cell: ({ row }) => row.original.isParent ? "" : dashText(getRowVal(row.original, "RtnUser", "rtnUser")) },
      { header: t("Remarks"), accessorKey: "Remarks", cell: ({ row }) => row.original.isParent ? "" : dashText(getRowVal(row.original, "Remarks", "remarks")) },
      { header: t("CaratsCl"), accessorKey: "BalanceCarats3Dec", cell: ({ row }) => row.original.isParent ? "" : dashText(getRowVal(row.original, "BalanceCarats3Dec", "balanceCarats3Dec")) },
      { header: t("Estimate"), accessorKey: "Estimate", className: "text-end", cell: ({ row }) => fmtFixed(getRowVal(row.original, "Estimate", "estimate"), 2) },
      { header: t("MRP"), accessorKey: "MRP", className: "text-end", cell: ({ row }) => row.original.isParent ? "" : fmtFixed(getRowVal(row.original, "MRP", "mrp"), 2) },
      { header: t("Symbol"), accessorKey: "Symbol", cell: ({ row }) => row.original.isParent ? "" : dashText(getRowVal(row.original, "Symbol", "symbol")) },
      { header: t("Shape"), accessorKey: "ShapeId", cell: ({ row }) => row.original.isParent ? "" : dashText(getRowVal(row.original, "ShapeId", "shapeId")) },
      { header: t("Color"), accessorKey: "ColorId", cell: ({ row }) => row.original.isParent ? "" : dashText(getRowVal(row.original, "ColorId", "colorId")) },
      { header: t("Clarity"), accessorKey: "ClarityId", cell: ({ row }) => row.original.isParent ? "" : dashText(getRowVal(row.original, "ClarityId", "clarityId")) },
      { header: t("Prop"), accessorKey: "PropId", cell: ({ row }) => row.original.isParent ? "" : dashText(getRowVal(row.original, "PropId", "propId")) },
      { header: t("Polish"), accessorKey: "PolishId", cell: ({ row }) => row.original.isParent ? "" : dashText(getRowVal(row.original, "PolishId", "polishId")) },
      { header: t("Sym"), accessorKey: "SymId", cell: ({ row }) => row.original.isParent ? "" : dashText(getRowVal(row.original, "SymId", "symId")) },
      { header: t("FL"), accessorKey: "FLId", cell: ({ row }) => row.original.isParent ? "" : dashText(getRowVal(row.original, "FLId", "flId")) },
      { header: t("Cert"), accessorKey: "CertId", cell: ({ row }) => row.original.isParent ? "" : dashText(getRowVal(row.original, "CertId", "certId")) },
      { header: t("CertificateNo"), accessorKey: "CertificateNo", cell: ({ row }) => row.original.isParent ? "" : dashText(getRowVal(row.original, "CertificateNo", "certificateNo")) },
      { header: t("InvType"), accessorKey: "Invtype", cell: ({ row }) => row.original.isParent ? "" : dashText(getRowVal(row.original, "Invtype", "invtype")) },
      { header: t("MemoTime"), accessorKey: "MemoTime", cell: ({ row }) => dashText(getRowVal(row.original, "MemoTime", "memoTime")) },
      { header: t("MemoReturnDate"), accessorKey: "MemoReturnDate2", cell: ({ row }) => row.original.isParent ? "" : dashText(getRowVal(row.original, "MemoReturnDate", "memoReturnDate")) },
      { header: t("MemoReturnTime"), accessorKey: "MemoReturnTime", cell: ({ row }) => row.original.isParent ? "" : dashText(getRowVal(row.original, "MemoReturnTime", "memoReturnTime")) }
    ],
    [expandedMemoNos, t]
  );

  const handleExcel = async () => {
    if (!reportRows || reportRows.length === 0) {
      toast.warning(t("No data available to export."));
      return;
    }

    const headers = [
      "Date", "DateDiff", "PartyHoldNo", "BillNo", "Party", "LotNo", "ItemName", "Discount",
      "Price", "Amount", "Return", "ReturnDate", "Balance", "BalanceAmt", "Broker", "Carats",
      "IssUser", "Seller", "RtnUser", "Remarks", "CaratsCl", "Estimate", "MRP", "Symbol",
      "Shape", "Color", "Clarity", "Prop", "Polish", "Sym", "FL", "Cert", "CertNo", "InvType"
    ];

    const rows = reportRows.map((r) => [
      dashText(r.ConDATE || r.conDATE),
      fmtFixed(r.DateDiff || r.dateDiff, 0),
      dashText(r.MemoNo || r.memoNo),
      dashText(r.BillNo || r.billNo),
      dashText(r.Party || r.party),
      dashText(r.Lotno || r.lotno),
      dashText(r.ItemName || r.itemName),
      fmtFixed(r.Discount || r.discount, 2),
      fmtFixed(r.Price || r.price, 2),
      fmtFixed(r.Amount || r.amount, 2),
      fmtFixed(r.Return || r.return, 3),
      dashText(r.MemoReturnDate || r.memoReturnDate),
      fmtFixed(r.Balance || r.balance, 2),
      fmtFixed(r.BalanceAmt || r.balanceAmt, 2),
      dashText(r.Broker || r.broker),
      fmtFixed(r.Carats || r.carats, 3),
      dashText(r.IssUser || r.issUser),
      dashText(r.Seller || r.seller),
      dashText(r.RtnUser || r.rtnUser),
      dashText(r.Remarks || r.remarks),
      dashText(r.BalanceCarats3Dec || r.balanceCarats3Dec),
      fmtFixed(r.Estimate || r.estimate, 2),
      fmtFixed(r.MRP || r.mrp, 2),
      dashText(r.Symbol || r.symbol),
      dashText(r.ShapeId || r.shapeId),
      dashText(r.ColorId || r.colorId),
      dashText(r.ClarityId || r.clarityId),
      dashText(r.PropId || r.propId),
      dashText(r.PolishId || r.polishId),
      dashText(r.SymId || r.symId),
      dashText(r.FLId || r.flId),
      dashText(r.CertId || r.certId),
      dashText(r.CertificateNo || r.certificateNo),
      dashText(r.Invtype || r.invtype)
    ]);

    const res = await exportToExcel(headers, rows, "PartyHoldReport", "PartyHoldReport");
    if (!res?.success) toast.error(t("Excel export failed."));
  };

  document.title = `${t("Party Hold Report")} | ${t("Reports")}`;

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

  return (
    <React.Fragment>
      <ToastContainer />
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title={t("Party Hold Report")} pageTitle={t("Reports")} />

          <div className="card stock-search-header-bar d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between mb-3 p-3 rounded-3 shadow-sm border gap-2">
            <h5 className="mb-0 fw-bold text-primary d-flex align-items-center gap-2">
              <i className={hasSearched ? "ri-database-2-line fs-20 text-primary" : "ri-search-eye-line fs-20 text-primary"}></i>
              {hasSearched ? `${t("Party Hold Report")} ${t("Results")}` : `${t("Party Hold Report")} ${t("Filters")}`}
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
                  <Button color="success" className="btn-sm rounded-2 px-3 py-1" onClick={handleExcel} disabled={reportRows.length === 0}>
                    {t("Excel")}
                  </Button>
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
                          <input type="date" className="form-control form-control-sm" style={{ height: "35px" }} value={filters.fromDate} onChange={(e) => setFilters((p) => ({ ...p, fromDate: e.target.value }))} />
                        </FormGroup>
                      </Col>
                      <Col sm={2}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1 small">{t("To Date")}</Label>
                          <input type="date" className="form-control form-control-sm" style={{ height: "35px" }} value={filters.toDate} onChange={(e) => setFilters((p) => ({ ...p, toDate: e.target.value }))} />
                        </FormGroup>
                      </Col>
                      <Col sm={2}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1 small">{t("Currency")}</Label>
                          <Select classNamePrefix="react-select" styles={customStyles} isClearable options={getOptions("currency")} value={getOptions("currency").find((o) => o.value === filters.currency) || null} onChange={(sel) => setFilters((p) => ({ ...p, currency: sel?.value || "" }))} placeholder={t("Select Currency")} />
                        </FormGroup>
                      </Col>
                      <Col sm={2}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1 small">{t("Party Hold No")}</Label>
                          <Input type="text" className="form-control form-control-sm" style={{ height: "35px" }} value={filters.invNo} placeholder={t("Memo No")} onChange={(e) => setFilters((p) => ({ ...p, invNo: e.target.value }))} />
                        </FormGroup>
                      </Col>
                      <Col sm={2}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1 small">{t("Type")}</Label>
                          <Select classNamePrefix="react-select" styles={customStyles} options={typeOptions} value={typeOptions.find((o) => o.value === filters.type) || typeOptions[0]} onChange={(sel) => setFilters((p) => ({ ...p, type: sel?.value || "ALL" }))} placeholder={t("Select Type")} />
                        </FormGroup>
                      </Col>
                      <Col sm={2}>
                        <FormGroup className="mb-0">
                          <Label className="w-100 mb-1"></Label>
                          <div className="d-flex align-items-center gap-1" style={{ height: "35px" }}>
                            <input type="checkbox" id="clearPartyHoldCheckbox" checked={filters.clear} onChange={(e) => setFilters((p) => ({ ...p, clear: e.target.checked }))} />
                            <Label htmlFor="clearPartyHoldCheckbox" className="mb-0 small">{t("Show Clear Party Hold")}</Label>
                          </div>
                        </FormGroup>
                      </Col>
                    </Row>
                    <Row className="g-2">
                      <Col sm={2}>
                        <FormGroup className="mb-0">
                          <div className="d-flex align-items-center gap-1 mb-1">
                            <input type="checkbox" id="rtnDateCheckbox" checked={filters.chkRtnDate} onChange={(e) => setFilters((p) => ({ ...p, chkRtnDate: e.target.checked }))} />
                            <Label htmlFor="rtnDateCheckbox" className="fw-medium mb-0 small">{t("Rtn Date")}</Label>
                          </div>
                          <input type="date" className="form-control form-control-sm" style={{ height: "35px" }} value={filters.fromRtnDate} disabled={!filters.chkRtnDate} onChange={(e) => setFilters((p) => ({ ...p, fromRtnDate: e.target.value }))} />
                        </FormGroup>
                      </Col>
                      <Col sm={2}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1 small">{t("To Date")}</Label>
                          <input type="date" className="form-control form-control-sm" style={{ height: "35px" }} value={filters.toRtnDate} disabled={!filters.chkRtnDate} onChange={(e) => setFilters((p) => ({ ...p, toRtnDate: e.target.value }))} />
                        </FormGroup>
                      </Col>
                      <Col sm={2}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1 small">{t("Party")}</Label>
                          <Select classNamePrefix="react-select" styles={customStyles} isClearable options={getAccountOptions()} value={getAccountOptions().find((o) => o.value === filters.party) || null} onChange={(sel) => setFilters((p) => ({ ...p, party: sel?.value || "" }))} placeholder={t("Search Party")} isLoading={loadingDropdowns} />
                        </FormGroup>
                      </Col>
                      <Col sm={2}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1 small">{t("Broker")}</Label>
                          <Select classNamePrefix="react-select" styles={customStyles} isClearable options={getAccountOptions()} value={getAccountOptions().find((o) => o.value === filters.broker) || null} onChange={(sel) => setFilters((p) => ({ ...p, broker: sel?.value || "" }))} placeholder={t("Search Broker")} isLoading={loadingDropdowns} />
                        </FormGroup>
                      </Col>
                      <Col sm={2}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1 small">{t("Seller")}</Label>
                          <Select classNamePrefix="react-select" styles={customStyles} isClearable options={getAccountOptions()} value={getAccountOptions().find((o) => o.value === filters.seller) || null} onChange={(sel) => setFilters((p) => ({ ...p, seller: sel?.value || "" }))} placeholder={t("Search Seller")} isLoading={loadingDropdowns} />
                        </FormGroup>
                      </Col>
                    </Row>
                  </Col>
                  <Col md={2}>
                    <FormGroup className="mb-0">
                      <Label className="fw-medium mb-1 small">{t("Enter Lot No")}</Label>
                      <Input type="textarea" value={filters.lotNo} onChange={(e) => setFilters((p) => ({ ...p, lotNo: e.target.value }))} placeholder={t("Search by lot no")} className="form-control-sm" style={{ height: "115px", resize: "none" }} />
                    </FormGroup>
                  </Col>
                </Row>
                <hr className="my-3 text-muted opacity-25" />
                <Row className="g-2">
                  {attributeFields.map(({ label, key }) => (
                    <Col sm={2} key={key}>
                      <FormGroup className="mb-0">
                        <Label className="fw-medium mb-1 small">{t(label)}</Label>
                        <Select isMulti classNamePrefix="react-select" styles={customStyles} options={getOptions(key)} value={getOptions(key).filter((o) => filters[key].includes(o.value))} onChange={(sel) => handleMultiChange(key, sel)} isLoading={loadingDropdowns} placeholder={t(label)} />
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
                  <span>{t("Showing")}: {groupedVisibleRows.length} {t("rows")}</span>
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

export default SolitairePartyHoldReport;
