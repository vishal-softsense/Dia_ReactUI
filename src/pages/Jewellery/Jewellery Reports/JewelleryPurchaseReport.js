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
  getJewelleryPurchaseReport,
  getJewelleryPurchaseReportDropdowns
} from "../../../helpers/fakebackend_helper";
import { useSettingReportDates } from "../../../Components/Hooks/useSettingReportDates";
import { api } from "../../../config";

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

const normalizeMediaPath = (path) => {
  if (!path || typeof path !== "string") return "";
  let trimmed = path.trim();
  if (!trimmed || trimmed.toLowerCase() === "null" || trimmed.toLowerCase() === "undefined") return "";
  return trimmed.replace(/\\/g, "/").replace(/^~\//, "/");
};

const resolveMediaUrl = (path) => {
  const trimmed = normalizeMediaPath(path);
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("data:") || trimmed.startsWith("blob:")) return trimmed;
  const baseUrl = (api.IMAGE_URL || api.API_URL || "").replace(/\/$/, "");
  const clean = trimmed.replace(/^(\.\.\/)+/, "");
  if (clean.startsWith("/")) return `${baseUrl}${clean}`;
  return `${baseUrl}/${clean}`;
};

const getTableTotals = (table) => {
  const rows = table.getFilteredRowModel().rows.map((r) => r.original);
  let parentPcs = 0;
  let parentAmt = 0;
  let parentINR = 0;
  let parentUSD = 0;

  rows.forEach((r) => {
    if (r?.isParent) {
      parentPcs += Number(getRowVal(r, "Pcs", "pcs") || 0);
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

const JewelleryPurchaseReport = () => {
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

  const [filters, setFilters] = useState({
    fromDate,
    toDate,
    currency: "",
    invNo: "",
    billNo: "",
    type: "",
    subType: "",
    category: "",
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

  useEffect(() => {
    const loadDropdowns = async () => {
      setLoadingDropdowns(true);
      try {
        const res = await getJewelleryPurchaseReportDropdowns();
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
          billNo: "",
          type: "",
          subType: "",
          category: "",
          party: "",
          broker: "",
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
        Currency: filters.currency || null,
        InvNo: filters.invNo || null,
        BillNo: filters.billNo || null,
        Type: filters.type || null,
        SubType: filters.subType || null,
        Category: filters.category || null,
        Party: filters.party || null,
        Broker: filters.broker || null,
        LotNo: filters.lotNo || null
      };

      const response = await getJewelleryPurchaseReport(payload);
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

        const totalPcs = rows.reduce((s, r) => s + Number(getRowVal(r, "Pcs", "pcs") || 0), 0);
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
          ItemName: "Total",
          Pcs: totalPcs,
          amount: totalAmount,
          rate: totalPcs > 0 ? totalAmount / totalPcs : 0,
          MasterCurrencyRate: totalPcs > 0 ? totalINR / totalPcs : 0,
          MasterCurrencyAmount: totalINR,
          StockCurrencyRate: totalPcs > 0 ? totalUSD / totalPcs : 0,
          StockCurrencyAmount: totalUSD,
          ImagePath: "",
          childRecords: rows
        });
      });

    return out;
  }, [reportRows]);

  const renderSubRows = useCallback(
    (row) => {
      const parent = row.original;
      const invnoKey = String(getRowVal(parent, "Invno", "invno", "InvNo", "invNo") || "");
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
          const invnoKey = String(getRowVal(r, "Invno", "invno", "InvNo", "invNo") || "");
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
        accessorKey: "ItemCode",
        enableColumnFilter: false,
        enableSorting: false,
        cell: ({ row }) => {
          const r = row.original;
          if (r?.isParent) return "";
          const itemCode = getRowVal(r, "ItemCode", "itemCode");
          const imagePath = getRowVal(r, "ImagePath", "imagePath");
          const imageUrl = resolveMediaUrl(imagePath);
          return (
            <div className="report-action">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (itemCode) {
                    window.open(`/master/edit-Mounting-stock?id=${itemCode}&mode=view`, "_blank");
                  }
                }}
              >
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt=""
                    style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 4 }}
                    onError={(ev) => {
                      ev.target.style.display = "none";
                    }}
                  />
                ) : (
                  <i className="bx bx-image-alt fs-18 text-muted" />
                )}
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
        accessorKey: "Invno",
        accessorFn: (row) => dashText(getRowVal(row, "Invno", "invno", "InvNo", "invNo")),
        cell: ({ row }) => dashText(getRowVal(row.original, "Invno", "invno", "InvNo", "invNo"))
      },
      {
        header: t("BillNo"),
        accessorKey: "BillNo",
        accessorFn: (row) => dashText(getRowVal(row, "BillNo", "billNo", "billno")),
        cell: ({ row }) => dashText(getRowVal(row.original, "BillNo", "billNo", "billno"))
      },
      {
        header: t("Party"),
        accessorKey: "Party",
        accessorFn: (row) => dashText(getRowVal(row, "Party", "party")),
        cell: ({ row }) => dashText(getRowVal(row.original, "Party", "party"))
      },
      {
        header: t("LotNo"),
        accessorKey: "Item",
        accessorFn: (row) => dashText(getRowVal(row, "Item", "item")),
        cell: ({ row }) => dashText(getRowVal(row.original, "Item", "item"))
      },
      {
        header: t("ItemName"),
        accessorKey: "ItemName",
        accessorFn: (row) => dashText(getRowVal(row, "ItemName", "itemName")),
        cell: ({ row }) => dashText(getRowVal(row.original, "ItemName", "itemName"))
      },
      {
        header: t("Pcs"),
        accessorKey: "Pcs",
        accessorFn: (row) => fmtFixed(getRowVal(row, "Pcs", "pcs"), 3),
        cell: ({ row }) => fmtFixed(getRowVal(row.original, "Pcs", "pcs"), 3),
        sortingFn: numericSortFn,
        footer: ({ table }) => {
          const { parentPcs } = getTableTotals(table);
          return <span className="fw-bold text-end d-block">{fmtFixed(parentPcs, 3)}</span>;
        }
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
        header: t("Broker"),
        accessorKey: "Broker",
        accessorFn: (row) => dashText(getRowVal(row, "Broker", "broker")),
        cell: ({ row }) => dashText(getRowVal(row.original, "Broker", "broker"))
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
        header: t("InvType"),
        accessorKey: "invtype",
        accessorFn: (row) => dashText(getRowVal(row, "invtype", "Invtype", "InvType")),
        cell: ({ row }) => dashText(getRowVal(row.original, "invtype", "Invtype", "InvType"))
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
      "Date",
      "InvNo",
      "BillNo",
      "Party",
      "LotNo",
      "ItemName",
      "Pcs",
      "Rate",
      "Amount",
      "Broker",
      "Less1",
      "Less2",
      "Less3",
      "InvType",
      "Symbol",
      "INR Rate",
      "INR Amount",
      "USD Rate",
      "USD Amount"
    ];

    const rows = reportRows.map((row) => [
      dashText(getRowVal(row, "ConDATE", "conDATE", "conDate", "Date", "date")),
      dashText(getRowVal(row, "Invno", "invno", "InvNo", "invNo")),
      dashText(getRowVal(row, "BillNo", "billNo", "billno")),
      dashText(getRowVal(row, "Party", "party")),
      dashText(getRowVal(row, "Item", "item")),
      dashText(getRowVal(row, "ItemName", "itemName")),
      fmtFixed(getRowVal(row, "Pcs", "pcs"), 3),
      fmtFixed(getRowVal(row, "rate", "Rate"), 2),
      fmtFixed(getRowVal(row, "amount", "Amount"), 2),
      dashText(getRowVal(row, "Broker", "broker")),
      dashText(getRowVal(row, "Less1", "less1")),
      dashText(getRowVal(row, "Less2", "less2")),
      dashText(getRowVal(row, "Less3", "less3")),
      dashText(getRowVal(row, "invtype", "Invtype", "InvType")),
      dashText(getRowVal(row, "Symbol", "symbol")),
      fmtFixed(getRowVal(row, "MasterCurrencyRate", "masterCurrencyRate"), 2),
      fmtFixed(getRowVal(row, "MasterCurrencyAmount", "masterCurrencyAmount"), 2),
      fmtFixed(getRowVal(row, "StockCurrencyRate", "stockCurrencyRate"), 2),
      fmtFixed(getRowVal(row, "StockCurrencyAmount", "stockCurrencyAmount"), 2)
    ]);

    const res = await exportToExcel(headers, rows, "JewPur-report", "JewPur-report");
    if (!res?.success) toast.error(t("Excel export failed."));
  };

  document.title = `${t("Jewellery Purchase Report")} | ${t("Reports")}`;

  return (
    <React.Fragment>
      <ToastContainer />

      <div className="page-content">
        <Container fluid>
          <BreadCrumb title={t("Jewellery Purchase Report")} pageTitle={t("JewPurchase Reports")} />

          <div className="card stock-search-header-bar d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between mb-3 p-3 rounded-3 shadow-sm border gap-2">
            <h5 className="mb-0 fw-bold text-primary d-flex align-items-center gap-2">
              <i className={hasSearched ? "ri-database-2-line fs-20 text-primary" : "ri-search-eye-line fs-20 text-primary"}></i>
              {hasSearched ? t("Jewellery Purchase Report Results") : t("Jewellery Purchase Report Filters")}
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
                            isLoading={loadingDropdowns}
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
                            value={partyOptions.find((o) => o.value === filters.party) || null}
                            onInputChange={(val) => setPartyInput(val)}
                            onChange={(sel) => setFilters((prev) => ({ ...prev, party: sel?.value || "" }))}
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
                            value={brokerOptions.find((o) => o.value === filters.broker) || null}
                            onInputChange={(val) => setBrokerInput(val)}
                            onChange={(sel) => setFilters((prev) => ({ ...prev, broker: sel?.value || "" }))}
                            placeholder={t("Search Broker")}
                            isLoading={loadingBrokers}
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
                    </Row>

                    <Row className="g-2">
                      <Col sm={2}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1 small">{t("Bill No")}</Label>
                          <Input
                            type="text"
                            className="form-control form-control-sm"
                            style={{ height: "35px" }}
                            value={filters.billNo}
                            placeholder={t("Bill No")}
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
                            placeholder={t("Select Type")}
                            isLoading={loadingDropdowns}
                          />
                        </FormGroup>
                      </Col>
                      <Col sm={2}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1 small">{t("Sub Type")}</Label>
                          <Select
                            classNamePrefix="react-select"
                            styles={customStyles}
                            isClearable
                            options={getOptions("subType")}
                            value={getOptions("subType").find((o) => o.value === filters.subType) || null}
                            onChange={(sel) => setFilters((prev) => ({ ...prev, subType: sel?.value || "" }))}
                            placeholder={t("Select SubType")}
                            isLoading={loadingDropdowns}
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
                            placeholder={t("Select Category")}
                            isLoading={loadingDropdowns}
                          />
                        </FormGroup>
                      </Col>
                    </Row>
                  </Col>

                  <Col md={2}>
                    <FormGroup className="mb-0">
                      <Label className="fw-medium mb-1 small">{t("Enter Jew Stock ID")}</Label>
                      <Input
                        type="textarea"
                        rows={7}
                        value={filters.lotNo}
                        placeholder={t("Search by Jew Stock ID")}
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

export default JewelleryPurchaseReport;
