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
  getSolitairePurchaseDropdowns,
  getSolitairePurchaseReport
} from "../../../helpers/fakebackend_helper";

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

const SolitairePurchaseReport = () => {
  const { t } = useTranslation();

  const todayYMD = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  const [loadingDropdowns, setLoadingDropdowns] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const [dropdownData, setDropdownData] = useState({});
  const [expandedInvnos, setExpandedInvnos] = useState(() => new Set());
  const [reportRows, setReportRows] = useState([]);

  const [filters, setFilters] = useState({
    fromDate: "2020-01-01",
    toDate: todayYMD,
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
        // MVC uses different "values" for different dropdowns:
        // - Currency uses ID
        // - Type/SubType/Category use Name for both value+text
        // - Party/Broker/ExpParty uses select2 .text() (name)
        // - Most attribute listboxes use ID
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

  const handleMultiChange = (name, selected) => {
    setFilters((prev) => ({
      ...prev,
      [name]: selected ? selected.map((x) => x.value) : []
    }));
  };

  const handleClear = () => {
    setHasSearched(false);
    setExpandedInvnos(new Set());
    setReportRows([]);
    setFilters({
      fromDate: "2020-01-01",
      toDate: todayYMD,
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
      sieve: []
    });
  };

  const handleReport = async () => {
    setLoading(true);
    try {
      const payload = {
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
      };

      const response = await getSolitairePurchaseReport(payload);
      const ok = response?.success || response?.Success;

      if (ok) {
        const data = response.Data || response.data || [];
        setReportRows(data);
        setHasSearched(true);
        toast.success(t("Report loaded successfully."));
        setExpandedInvnos(new Set()); // reset toggles
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
    // Build parent rows grouped by Invno.
    const grouped = {};
    (reportRows || []).forEach((r) => {
      const invNoVal = getRowVal(r, "Invno", "invno", "InvNo", "invNo");
      const key = invNoVal !== undefined && invNoVal !== null && invNoVal !== "" ? String(invNoVal) : "UNKNOWN";
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(r);
    });

    const out = [];
    const invnos = Object.keys(grouped);
    invnos.sort(); // stable order

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
                  // Same behavior as MVC setlink() for purchase records.
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

  const handleExcel = async () => {
    if (!reportRows || reportRows.length === 0) {
      toast.warning(t("No data available to export."));
      return;
    }

    // MVC export uses the grid fields with camelCase for totals computed in JS.
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

    // Export child rows (detailed records) like the nested grid contains.
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

                  <UncontrolledDropdown>
                    <DropdownToggle color="success" className="btn-sm rounded-2 px-3 py-1" caret disabled={reportRows.length === 0}>
                      {t("Excel")} / {t("Print")}
                    </DropdownToggle>
                    <DropdownMenu>
                      <DropdownItem
                        onClick={() => {
                          // MVC uses DP vs PR. For now export the detailed child rows.
                          handleExcel();
                        }}
                      >
                        Direct Print
                      </DropdownItem>
                      <DropdownItem
                        onClick={() => {
                          // Placeholder for PR generation (server-side formatted excel).
                          handleExcel();
                        }}
                      >
                        PurchaseReport Print
                      </DropdownItem>
                    </DropdownMenu>
                  </UncontrolledDropdown>
                </>
              )}
            </div>
          </div>

          {!hasSearched && (
            <Card className="shadow-lg border-0 rounded-3 mb-4">
              <CardBody className="bg-light-subtle">
                <Row className="g-3">
                  {/* Left Side: 10/12 cols */}
                  <Col md={10}>
                    {/* Row 1: Date, To Date, Currency, Invoice No, Bill No, Type */}
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
                            placeholder={t("Currency")}
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
                            placeholder={t("Type")}
                          />
                        </FormGroup>
                      </Col>
                    </Row>

                    {/* Row 2: SubType, Category, Party, Broker, Sale Return checkbox */}
                    <Row className="g-2">
                      <Col sm={2}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1 small">{t("SubType")}</Label>
                          <Select
                            classNamePrefix="react-select"
                            styles={customStyles}
                            isClearable
                            options={getOptions("subType")}
                            value={getOptions("subType").find((o) => o.value === filters.subType) || null}
                            onChange={(sel) => setFilters((prev) => ({ ...prev, subType: sel?.value || "" }))}
                            placeholder={t("SubType")}
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
                            placeholder={t("Category")}
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
                            placeholder={t("Party")}
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
                            placeholder={t("Broker")}
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

                  {/* Right Side: 2/12 cols - Enter Lot No */}
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

                {/* Attributes Multi-Select Lists */}
                {/* Row 3: Shape, Color, Clarity, Size, Proportion, Polish */}
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

                {/* Row 4: Symmetry, Lab, Fluorescence, Milky, Luster, Natts */}
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

                {/* Row 5: Mines, ProductType, Sieve, Exp Party */}
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
                      <Label className="fw-medium mb-1 small">{t("ProductType")}</Label>
                      <Select
                        isMulti
                        classNamePrefix="react-select"
                        styles={customStyles}
                        options={getOptions("productType")}
                        value={getOptions("productType").filter((o) => filters.productType.includes(o.value))}
                        onChange={(sel) => handleMultiChange("productType", sel)}
                        isLoading={loadingDropdowns}
                        placeholder={t("ProductType")}
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
                      <Label className="fw-medium mb-1 small">{t("ExpParty")}</Label>
                      <Select
                        classNamePrefix="react-select"
                        styles={customStyles}
                        isClearable
                        options={getOptions("account")}
                        value={getOptions("account").find((o) => o.value === filters.expParty) || null}
                        onChange={(sel) => setFilters((prev) => ({ ...prev, expParty: sel?.value || "" }))}
                        placeholder={t("ExpParty")}
                        isLoading={loadingDropdowns}
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

export default SolitairePurchaseReport;

