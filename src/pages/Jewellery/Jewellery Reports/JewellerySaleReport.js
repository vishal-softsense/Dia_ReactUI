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
  getAccGrpMasters,
  getJewMetalMastersPurity,
  getJewellerySaleReport,
  getJewellerySaleReportDropdowns
} from "../../../helpers/fakebackend_helper";
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

const numericSortFn = (rowA, rowB, columnId) => {
  const a = parseFloat(rowA.getValue(columnId)) || 0;
  const b = parseFloat(rowB.getValue(columnId)) || 0;
  return a - b;
};

const getTableTotals = (table) => {
  const rows = table.getFilteredRowModel().rows.map((r) => r.original);
  let parentPcs = 0;
  let parentAmt = 0;
  let parentINR = 0;
  let parentUSD = 0;

  rows.forEach((r) => {
    if (r?.isParent) {
      parentPcs += Number(getRowVal(r, "carats", "Carats", "Pcs", "pcs") || 0);
      parentAmt += Number(getRowVal(r, "amount", "Amount") || 0);
      parentINR += Number(getRowVal(r, "MasterCurrencyAmount", "masterCurrencyAmount") || 0);
      parentUSD += Number(getRowVal(r, "StockCurrencyAmount", "stockCurrencyAmount") || 0);
    }
  });

  return { parentPcs, parentAmt, parentINR, parentUSD };
};

const mapDropdownItems = (list, useNameAsValue = false) => {
  if (!Array.isArray(list)) return [];
  return list.map((item) => ({
    value: String(useNameAsValue ? (item.name ?? item.Name ?? item.id ?? item.ID ?? "") : (item.id ?? item.ID ?? item.name ?? item.Name ?? "")),
    label: String(item.name ?? item.Name ?? item.id ?? item.ID ?? "").toUpperCase()
  }));
};

const CERTIFICATE_OPTIONS = [
  { value: "IGI", label: "IGI" },
  { value: "GIA", label: "GIA" }
];

const JewellerySaleReport = () => {
  const { t } = useTranslation();
  const { fromDate, toDate, getDates, mergeDates } = useSettingReportDates();

  const [loadingDropdowns, setLoadingDropdowns] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const [dropdownData, setDropdownData] = useState({});
  const [purityOptions, setPurityOptions] = useState([]);
  const [loadingPurity, setLoadingPurity] = useState(false);
  const [expandedInvnos, setExpandedInvnos] = useState(() => new Set());
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
    type: "",
    party: "",
    category: "",
    broker: "",
    designName: "",
    subType: "",
    subCategory: "",
    jewelleryCertificate: "",
    metalType: "",
    jewColor: "",
    jewPurity: "",
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
        alignItems: "center"
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
      })
    }),
    []
  );

  const getOptions = useCallback(
    (dropdownKey) => {
      const useName = dropdownKey === "type" || dropdownKey === "subType" || dropdownKey === "category";
      const list = dropdownData?.[dropdownKey] || [];
      if (list.length && list[0]?.value !== undefined) return list;
      return mapDropdownItems(list, useName);
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

  const loadPurityOptions = async (metalType) => {
    if (!metalType) {
      setPurityOptions([]);
      return;
    }
    setLoadingPurity(true);
    try {
      const response = await getJewMetalMastersPurity(metalType);
      const data = response?.data || response?.Data || (Array.isArray(response) ? response : []);
      setPurityOptions(
        (Array.isArray(data) ? data : []).map((item) => ({
          value: String(item.metalPurityID || item.MetalPurityID || item.MetalPurityId || ""),
          label: String(item.metalPurityID || item.MetalPurityID || item.MetalPurityId || "")
        })).filter((o) => o.value)
      );
    } catch (err) {
      console.error(err);
      setPurityOptions([]);
    } finally {
      setLoadingPurity(false);
    }
  };

  useEffect(() => {
    const loadDropdowns = async () => {
      setLoadingDropdowns(true);
      try {
        const res = await getJewellerySaleReportDropdowns();
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

  useEffect(() => {
    loadPurityOptions(filters.metalType);
  }, [filters.metalType]);

  const handleClear = async () => {
    const d = await getDates();
    setHasSearched(false);
    setExpandedInvnos(new Set());
    setReportRows([]);
    setPartyInput("");
    setBrokerInput("");
    setPurityOptions([]);
    handleAccountSearch("", setPartyOptions, setLoadingParties);
    handleAccountSearch("", setBrokerOptions, setLoadingBrokers);
    setFilters(
      mergeDates(
        {
          type: "",
          party: "",
          category: "",
          broker: "",
          designName: "",
          subType: "",
          subCategory: "",
          jewelleryCertificate: "",
          metalType: "",
          jewColor: "",
          jewPurity: "",
          lotNo: ""
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
        Type: filters.type || null,
        Party: filters.party || null,
        Category: filters.category || null,
        Broker: filters.broker || null,
        DesignName: filters.designName || null,
        SubType: filters.subType || null,
        SubCategory: filters.subCategory || null,
        JewelleryCertificate: filters.jewelleryCertificate || null,
        MetalType: filters.metalType || null,
        JewColor: filters.jewColor || null,
        JewPurity: filters.jewPurity || null,
        LotNo: filters.lotNo || null
      };

      const response = await getJewellerySaleReport(payload);
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
      const invNoVal = getRowVal(r, "invno", "Invno", "InvNo", "invNo");
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

        const totalCarats = rows.reduce((s, r) => s + Number(getRowVal(r, "carats", "Carats", "Pcs", "pcs") || 0), 0);
        const totalAmount = rows.reduce((s, r) => s + Number(getRowVal(r, "amount", "Amount") || 0), 0);
        const totalINR = rows.reduce(
          (s, r) => s + Number(getRowVal(r, "MasterCurrencyAmount", "masterCurrencyAmount") || 0),
          0
        );
        const totalUSD = rows.reduce(
          (s, r) => s + Number(getRowVal(r, "StockCurrencyAmount", "stockCurrencyAmount") || 0),
          0
        );

        out.push({
          ...first,
          isParent: true,
          invno: invnoKey,
          ItemName: "Total",
          carats: totalCarats,
          amount: totalAmount,
          rate: totalCarats > 0 ? totalAmount / totalCarats : 0,
          MasterCurrencyRate: totalCarats > 0 ? totalINR / totalCarats : 0,
          MasterCurrencyAmount: totalINR,
          StockCurrencyRate: totalCarats > 0 ? totalUSD / totalCarats : 0,
          StockCurrencyAmount: totalUSD,
          childRecords: rows
        });
      });

    return out;
  }, [reportRows]);

  const renderSubRows = useCallback(
    (row) => {
      const parent = row.original;
      const invnoKey = String(getRowVal(parent, "invno", "Invno", "InvNo", "invNo") || "");
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
          const invnoKey = String(getRowVal(r, "invno", "Invno", "InvNo", "invNo") || "");
          const expanded = expandedInvnos.has(invnoKey);
          return (
            <i
              className={expanded ? "bx bx-chevron-down" : "bx bx-chevron-right"}
              style={{ cursor: "pointer", color: "#2c7be5", fontSize: "18px", verticalAlign: "middle" }}
              onClick={() => {
                setExpandedInvnos((prev) => {
                  const next = new Set();
                  if (!prev.has(invnoKey)) next.add(invnoKey);
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
                  if (code) window.open(`/jewsale/edit-jew-sale?Id=${code}&Mode=view`, "_blank");
                }}
              >
                <i className="bx bx-show-alt fs-18" />
              </a>
            </div>
          );
        },
        footer: () => <span className="fw-bold text-center d-block">Total:</span>
      },
      {
        header: t("Date"),
        accessorKey: "ConDATE",
        accessorFn: (row) => dashText(getRowVal(row, "ConDATE", "conDATE", "conDate", "Date", "date")),
        cell: ({ row }) => dashText(getRowVal(row.original, "ConDATE", "conDATE", "conDate", "Date", "date"))
      },
      {
        header: t("InvNo"),
        accessorKey: "invno",
        accessorFn: (row) => dashText(getRowVal(row, "invno", "Invno", "InvNo", "invNo")),
        cell: ({ row }) => dashText(getRowVal(row.original, "invno", "Invno", "InvNo", "invNo"))
      },
      {
        header: t("Due"),
        accessorKey: "Due",
        accessorFn: (row) => dashText(getRowVal(row, "Due", "due")),
        cell: ({ row }) => dashText(getRowVal(row.original, "Due", "due"))
      },
      {
        header: t("InvType"),
        accessorKey: "invtype",
        accessorFn: (row) => dashText(getRowVal(row, "invtype", "Invtype", "InvType")),
        cell: ({ row }) => dashText(getRowVal(row.original, "invtype", "Invtype", "InvType"))
      },
      {
        header: t("Party"),
        accessorKey: "Party",
        accessorFn: (row) => dashText(getRowVal(row, "Party", "party")),
        cell: ({ row }) => dashText(getRowVal(row.original, "Party", "party"))
      },
      {
        header: t("Category"),
        accessorKey: "Category",
        accessorFn: (row) => dashText(getRowVal(row, "Category", "category")),
        cell: ({ row }) => dashText(getRowVal(row.original, "Category", "category"))
      },
      {
        header: t("Broker"),
        accessorKey: "Broker",
        accessorFn: (row) => dashText(getRowVal(row, "Broker", "broker")),
        cell: ({ row }) => dashText(getRowVal(row.original, "Broker", "broker"))
      },
      {
        header: t("DesignName"),
        accessorKey: "DesignName",
        accessorFn: (row) => dashText(getRowVal(row, "DesignName", "designName")),
        cell: ({ row }) => dashText(getRowVal(row.original, "DesignName", "designName"))
      },
      {
        header: t("Sub Type"),
        accessorKey: "SubType",
        accessorFn: (row) => dashText(getRowVal(row, "SubType", "subType")),
        cell: ({ row }) => dashText(getRowVal(row.original, "SubType", "subType"))
      },
      {
        header: t("SubCategory"),
        accessorKey: "SubCategory",
        accessorFn: (row) => dashText(getRowVal(row, "SubCategory", "subCategory")),
        cell: ({ row }) => dashText(getRowVal(row.original, "SubCategory", "subCategory"))
      },
      {
        header: t("JewelleryCertificate"),
        accessorKey: "JewelleryCertificate",
        accessorFn: (row) => dashText(getRowVal(row, "JewelleryCertificate", "jewelleryCertificate")),
        cell: ({ row }) => dashText(getRowVal(row.original, "JewelleryCertificate", "jewelleryCertificate"))
      },
      {
        header: t("Metal Type"),
        accessorKey: "MetalType",
        accessorFn: (row) => dashText(getRowVal(row, "MetalType", "metalType")),
        cell: ({ row }) => dashText(getRowVal(row.original, "MetalType", "metalType"))
      },
      {
        header: t("Color"),
        accessorKey: "Color",
        accessorFn: (row) => dashText(getRowVal(row, "Color", "color")),
        cell: ({ row }) => dashText(getRowVal(row.original, "Color", "color"))
      },
      {
        header: t("Purity"),
        accessorKey: "Purity",
        accessorFn: (row) => dashText(getRowVal(row, "Purity", "purity")),
        cell: ({ row }) => dashText(getRowVal(row.original, "Purity", "purity"))
      },
      {
        header: t("LotNo"),
        accessorKey: "StockItem",
        accessorFn: (row) => dashText(getRowVal(row, "StockItem", "stockItem", "Item", "item")),
        cell: ({ row }) => dashText(getRowVal(row.original, "StockItem", "stockItem", "Item", "item"))
      },
      {
        header: t("ItemName"),
        accessorKey: "ItemName",
        accessorFn: (row) => dashText(getRowVal(row, "ItemName", "itemName")),
        cell: ({ row }) => dashText(getRowVal(row.original, "ItemName", "itemName"))
      },
      {
        header: t("Pcs"),
        accessorKey: "carats",
        accessorFn: (row) => fmtFixed(getRowVal(row, "carats", "Carats", "Pcs", "pcs"), 3),
        cell: ({ row }) => fmtFixed(getRowVal(row.original, "carats", "Carats", "Pcs", "pcs"), 3),
        sortingFn: numericSortFn,
        footer: ({ table }) => {
          const { parentPcs } = getTableTotals(table);
          return <span className="fw-bold text-end d-block">{fmtFixed(parentPcs, 3)}</span>;
        }
      },
      {
        header: t("Less1"),
        accessorKey: "Less1",
        accessorFn: (row) => dashText(getRowVal(row, "Less1", "less1")),
        cell: ({ row }) => dashText(getRowVal(row.original, "Less1", "less1"))
      },
      {
        header: t("Less2"),
        accessorKey: "Less2",
        accessorFn: (row) => dashText(getRowVal(row, "Less2", "less2")),
        cell: ({ row }) => dashText(getRowVal(row.original, "Less2", "less2"))
      },
      {
        header: t("Less3"),
        accessorKey: "Less3",
        accessorFn: (row) => dashText(getRowVal(row, "Less3", "less3")),
        cell: ({ row }) => dashText(getRowVal(row.original, "Less3", "less3"))
      },
      {
        header: t("Rate"),
        accessorKey: "rate",
        accessorFn: (row) => fmtFixed(getRowVal(row, "rate", "Rate"), 2),
        cell: ({ row }) => fmtFixed(getRowVal(row.original, "rate", "Rate"), 2),
        sortingFn: numericSortFn,
        footer: ({ table }) => {
          const { parentPcs, parentAmt } = getTableTotals(table);
          return <span className="fw-bold text-end d-block">{fmtFixed(parentPcs > 0 ? parentAmt / parentPcs : 0, 2)}</span>;
        }
      },
      {
        header: t("Amount"),
        accessorKey: "amount",
        accessorFn: (row) => fmtFixed(getRowVal(row, "amount", "Amount"), 2),
        cell: ({ row }) => fmtFixed(getRowVal(row.original, "amount", "Amount"), 2),
        sortingFn: numericSortFn,
        footer: ({ table }) => {
          const { parentAmt } = getTableTotals(table);
          return <span className="fw-bold text-end d-block">{fmtFixed(parentAmt, 2)}</span>;
        }
      },
      {
        header: t("Symbol"),
        accessorKey: "Symbol",
        accessorFn: (row) => dashText(getRowVal(row, "Symbol", "symbol")),
        cell: ({ row }) => dashText(getRowVal(row.original, "Symbol", "symbol"))
      },
      {
        header: t("INR Rate"),
        accessorKey: "MasterCurrencyRate",
        accessorFn: (row) => {
          const val = getRowVal(row, "MasterCurrencyRate", "masterCurrencyRate");
          return val ? fmtFixed(val, 2) : "";
        },
        cell: ({ row }) => {
          const val = getRowVal(row.original, "MasterCurrencyRate", "masterCurrencyRate");
          return val ? fmtFixed(val, 2) : "";
        },
        sortingFn: numericSortFn
      },
      {
        header: t("INR Amount"),
        accessorKey: "MasterCurrencyAmount",
        accessorFn: (row) => fmtFixed(getRowVal(row, "MasterCurrencyAmount", "masterCurrencyAmount"), 2),
        cell: ({ row }) => fmtFixed(getRowVal(row.original, "MasterCurrencyAmount", "masterCurrencyAmount"), 2),
        sortingFn: numericSortFn,
        footer: ({ table }) => {
          const { parentINR } = getTableTotals(table);
          return <span className="fw-bold text-end d-block">{fmtFixed(parentINR, 2)}</span>;
        }
      },
      {
        header: t("USD Rate"),
        accessorKey: "StockCurrencyRate",
        accessorFn: (row) => {
          const val = getRowVal(row, "StockCurrencyRate", "stockCurrencyRate");
          return val ? fmtFixed(val, 2) : "";
        },
        cell: ({ row }) => {
          const val = getRowVal(row.original, "StockCurrencyRate", "stockCurrencyRate");
          return val ? fmtFixed(val, 2) : "";
        },
        sortingFn: numericSortFn
      },
      {
        header: t("USD Amount"),
        accessorKey: "StockCurrencyAmount",
        accessorFn: (row) => fmtFixed(getRowVal(row, "StockCurrencyAmount", "stockCurrencyAmount"), 2),
        cell: ({ row }) => fmtFixed(getRowVal(row.original, "StockCurrencyAmount", "stockCurrencyAmount"), 2),
        sortingFn: numericSortFn,
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

    const headers = [
      "Date", "InvNo", "Due", "InvType", "Party", "Category", "Broker", "DesignName", "Sub Type",
      "SubCategory", "JewelleryCertificate", "Metal Type", "Color", "Purity", "LotNo", "ItemName",
      "Pcs", "Less1", "Less2", "Less3", "Rate", "Amount", "Symbol", "INR Rate", "INR Amount", "USD Rate", "USD Amount"
    ];

    const rows = reportRows.map((row) => [
      dashText(getRowVal(row, "ConDATE", "conDATE", "conDate", "Date", "date")),
      dashText(getRowVal(row, "invno", "Invno", "InvNo", "invNo")),
      dashText(getRowVal(row, "Due", "due")),
      dashText(getRowVal(row, "invtype", "Invtype", "InvType")),
      dashText(getRowVal(row, "Party", "party")),
      dashText(getRowVal(row, "Category", "category")),
      dashText(getRowVal(row, "Broker", "broker")),
      dashText(getRowVal(row, "DesignName", "designName")),
      dashText(getRowVal(row, "SubType", "subType")),
      dashText(getRowVal(row, "SubCategory", "subCategory")),
      dashText(getRowVal(row, "JewelleryCertificate", "jewelleryCertificate")),
      dashText(getRowVal(row, "MetalType", "metalType")),
      dashText(getRowVal(row, "Color", "color")),
      dashText(getRowVal(row, "Purity", "purity")),
      dashText(getRowVal(row, "StockItem", "stockItem", "Item", "item")),
      dashText(getRowVal(row, "ItemName", "itemName")),
      fmtFixed(getRowVal(row, "carats", "Carats", "Pcs", "pcs"), 3),
      dashText(getRowVal(row, "Less1", "less1")),
      dashText(getRowVal(row, "Less2", "less2")),
      dashText(getRowVal(row, "Less3", "less3")),
      fmtFixed(getRowVal(row, "rate", "Rate"), 2),
      fmtFixed(getRowVal(row, "amount", "Amount"), 2),
      dashText(getRowVal(row, "Symbol", "symbol")),
      fmtFixed(getRowVal(row, "MasterCurrencyRate", "masterCurrencyRate"), 2),
      fmtFixed(getRowVal(row, "MasterCurrencyAmount", "masterCurrencyAmount"), 2),
      fmtFixed(getRowVal(row, "StockCurrencyRate", "stockCurrencyRate"), 2),
      fmtFixed(getRowVal(row, "StockCurrencyAmount", "stockCurrencyAmount"), 2)
    ]);

    const res = await exportToExcel(headers, rows, "JewSale-report", "JewSale-report");
    if (!res?.success) toast.error(t("Excel export failed."));
  };

  document.title = `${t("Jewellery Sale Report")} | ${t("Reports")}`;

  return (
    <React.Fragment>
      <ToastContainer />

      <div className="page-content">
        <Container fluid>
          <BreadCrumb title={t("Jewellery Sale Report")} pageTitle={t("JewSale Reports")} />

          <div className="card stock-search-header-bar d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between mb-3 p-3 rounded-3 shadow-sm border gap-2">
            <h5 className="mb-0 fw-bold text-primary d-flex align-items-center gap-2">
              <i className={hasSearched ? "ri-database-2-line fs-20 text-primary" : "ri-search-eye-line fs-20 text-primary"}></i>
              {hasSearched ? t("Jewellery Sale Report Results") : t("Jewellery Sale Report Filters")}
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
                          <input type="date" className="form-control form-control-sm" style={{ height: "35px" }} value={filters.fromDate} onChange={(e) => setFilters((prev) => ({ ...prev, fromDate: e.target.value }))} />
                        </FormGroup>
                      </Col>
                      <Col sm={2}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1 small">{t("To Date")}</Label>
                          <input type="date" className="form-control form-control-sm" style={{ height: "35px" }} value={filters.toDate} onChange={(e) => setFilters((prev) => ({ ...prev, toDate: e.target.value }))} />
                        </FormGroup>
                      </Col>
                      <Col sm={2}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1 small">{t("Type")}</Label>
                          <Select classNamePrefix="react-select" styles={customStyles} isClearable options={getOptions("type")} value={getOptions("type").find((o) => o.value === filters.type) || null} onChange={(sel) => setFilters((prev) => ({ ...prev, type: sel?.value || "" }))} placeholder={t("Select Type")} isLoading={loadingDropdowns} />
                        </FormGroup>
                      </Col>
                      <Col sm={2}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1 small">{t("Party")}</Label>
                          <Select classNamePrefix="react-select" styles={customStyles} isClearable options={partyOptions} value={partyOptions.find((o) => o.value === filters.party) || null} onInputChange={(val) => setPartyInput(val)} onChange={(sel) => setFilters((prev) => ({ ...prev, party: sel?.value || "" }))} placeholder={t("Search Party")} isLoading={loadingParties} />
                        </FormGroup>
                      </Col>
                      <Col sm={2}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1 small">{t("Category")}</Label>
                          <Select classNamePrefix="react-select" styles={customStyles} isClearable options={getOptions("category")} value={getOptions("category").find((o) => o.value === filters.category) || null} onChange={(sel) => setFilters((prev) => ({ ...prev, category: sel?.value || "" }))} placeholder={t("Select Category")} isLoading={loadingDropdowns} />
                        </FormGroup>
                      </Col>
                      <Col sm={2}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1 small">{t("Broker")}</Label>
                          <Select classNamePrefix="react-select" styles={customStyles} isClearable options={brokerOptions} value={brokerOptions.find((o) => o.value === filters.broker) || null} onInputChange={(val) => setBrokerInput(val)} onChange={(sel) => setFilters((prev) => ({ ...prev, broker: sel?.value || "" }))} placeholder={t("Search Broker")} isLoading={loadingBrokers} />
                        </FormGroup>
                      </Col>
                    </Row>

                    <Row className="g-2 mb-2">
                      <Col sm={2}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1 small">{t("Design")}</Label>
                          <Select classNamePrefix="react-select" styles={customStyles} isClearable options={getOptions("design")} value={getOptions("design").find((o) => o.value === filters.designName) || null} onChange={(sel) => setFilters((prev) => ({ ...prev, designName: sel?.value || "" }))} placeholder={t("Select Design")} isLoading={loadingDropdowns} />
                        </FormGroup>
                      </Col>
                      <Col sm={2}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1 small">{t("Sub Type")}</Label>
                          <Select classNamePrefix="react-select" styles={customStyles} isClearable options={getOptions("subType")} value={getOptions("subType").find((o) => o.value === filters.subType) || null} onChange={(sel) => setFilters((prev) => ({ ...prev, subType: sel?.value || "" }))} placeholder={t("Select SubType")} isLoading={loadingDropdowns} />
                        </FormGroup>
                      </Col>
                      <Col sm={2}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1 small">{t("SubCategory")}</Label>
                          <Select classNamePrefix="react-select" styles={customStyles} isClearable options={getOptions("subCategory")} value={getOptions("subCategory").find((o) => o.value === filters.subCategory) || null} onChange={(sel) => setFilters((prev) => ({ ...prev, subCategory: sel?.value || "" }))} placeholder={t("Select SubCategory")} isLoading={loadingDropdowns} />
                        </FormGroup>
                      </Col>
                      <Col sm={2}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1 small">{t("Jewellery Certificate")}</Label>
                          <Select classNamePrefix="react-select" styles={customStyles} isClearable options={CERTIFICATE_OPTIONS} value={CERTIFICATE_OPTIONS.find((o) => o.value === filters.jewelleryCertificate) || null} onChange={(sel) => setFilters((prev) => ({ ...prev, jewelleryCertificate: sel?.value || "" }))} placeholder={t("Select Certificate")} />
                        </FormGroup>
                      </Col>
                      <Col sm={2}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1 small">{t("MetalType")}</Label>
                          <Select classNamePrefix="react-select" styles={customStyles} isClearable options={getOptions("metal")} value={getOptions("metal").find((o) => o.value === filters.metalType) || null} onChange={(sel) => setFilters((prev) => ({ ...prev, metalType: sel?.value || "", jewPurity: "" }))} placeholder={t("Select MetalType")} isLoading={loadingDropdowns} />
                        </FormGroup>
                      </Col>
                      <Col sm={2}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1 small">{t("Color")}</Label>
                          <Select classNamePrefix="react-select" styles={customStyles} isClearable options={getOptions("color")} value={getOptions("color").find((o) => o.value === filters.jewColor) || null} onChange={(sel) => setFilters((prev) => ({ ...prev, jewColor: sel?.value || "" }))} placeholder={t("Select Color")} isLoading={loadingDropdowns} />
                        </FormGroup>
                      </Col>
                    </Row>

                    <Row className="g-2">
                      <Col sm={2}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1 small">{t("Purity")}</Label>
                          <Select classNamePrefix="react-select" styles={customStyles} isClearable options={purityOptions} value={purityOptions.find((o) => o.value === filters.jewPurity) || null} onChange={(sel) => setFilters((prev) => ({ ...prev, jewPurity: sel?.value || "" }))} placeholder={t("Select Metal Purity")} isLoading={loadingPurity} isDisabled={!filters.metalType} />
                        </FormGroup>
                      </Col>
                    </Row>
                  </Col>

                  <Col md={2}>
                    <FormGroup className="mb-0">
                      <Label className="fw-medium mb-1 small">{t("Enter Jew Stock ID")}</Label>
                      <Input type="textarea" rows={7} value={filters.lotNo} placeholder={t("Search by Jew Stock ID")} onChange={(e) => setFilters((prev) => ({ ...prev, lotNo: e.target.value }))} />
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
                    {t("Showing")}: {groupedVisibleRows.length} {t("entries")} ({reportRows.length})
                  </span>
                </div>

                <TableContainer
                  columns={columns}
                  data={groupedVisibleRows}
                  isGlobalFilter={true}
                  customPageSize={500}
                  customPageSizes={[500, 1000, 1500, -1]}
                  divClass="table-responsive table-card mb-3"
                  tableClass="align-middle table-nowrap mb-0 table-hover table-striped"
                  theadClass="table-light"
                  SearchPlaceholder={t("SEARCH:")}
                  getRowClass={(row) => (row.original?.isParent ? "parent-row fw-bold" : "child-row")}
                  renderSubRows={renderSubRows}
                  showFooter={true}
                />
              </CardBody>
            </Card>
          )}
        </Container>
      </div>
    </React.Fragment>
  );
};

export default JewellerySaleReport;
