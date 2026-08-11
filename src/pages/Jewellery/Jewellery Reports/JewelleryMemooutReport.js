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
  getJewelleryMemoOutReport,
  getJewelleryMemoOutReportDropdowns
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

const getTableTotals = (table) => {
  const rows = table.getFilteredRowModel().rows.map((r) => r.original);
  let totalPcs = 0;
  let totalAmount = 0;
  let totalReturn = 0;
  let totalBalance = 0;
  let totalBalanceAmt = 0;

  rows.forEach((r) => {
    if (r?.isParent) {
      totalPcs += Number(getRowVal(r, "Pcs", "pcs", "Carats", "carats") || 0);
      totalAmount += Number(getRowVal(r, "Amount", "amount") || 0);
      totalReturn += Number(getRowVal(r, "Return", "return") || 0);
      totalBalance += Number(getRowVal(r, "Balance", "balance") || 0);
      totalBalanceAmt += Number(getRowVal(r, "BalanceAmt", "balanceAmt") || 0);
    }
  });

  return { totalPcs, totalAmount, totalReturn, totalBalance, totalBalanceAmt };
};

const TYPE_OPTIONS = [
  { value: "ALL", label: "ALL" },
  { value: "External", label: "EXTERNAL" },
  { value: "Internal", label: "INTERNAL" },
  { value: "Local", label: "LOCAL" },
  { value: "LAB", label: "LAB" },
  { value: "Pend Sale", label: "PEND SALE" }
];

const JewelleryMemooutReport = () => {
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
    stockId: ""
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

  const currencyOptions = useMemo(() => {
    const list = dropdownData?.currency || [];
    return list.map((item) => ({
      value: String(item.id ?? item.ID ?? ""),
      label: String(item.name ?? item.Name ?? "").toUpperCase()
    }));
  }, [dropdownData]);

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
        const res = await getJewelleryMemoOutReportDropdowns();
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
          stockId: ""
        },
        d
      )
    );
  };

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
    Stock_ID: filters.stockId || null
  });

  const handleReport = async () => {
    setLoading(true);
    try {
      const response = await getJewelleryMemoOutReport(buildPayload());
      const ok = response?.success || response?.Success;
      if (ok) {
        setReportRows(response.Data || response.data || []);
        setHasSearched(true);
        setExpandedMemoNos(new Set());
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
      const key = String(getRowVal(r, "MemoNo", "memoNo") || "UNKNOWN");
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(r);
    });

    const out = [];
    Object.keys(grouped).forEach((memoNo) => {
      const rows = grouped[memoNo];
      const first = rows[0];

      const totalPcs = rows.reduce((s, r) => s + Number(getRowVal(r, "Pcs", "pcs", "Carats", "carats") || 0), 0);
      const totalAmount = rows.reduce((s, r) => s + Number(getRowVal(r, "Amount", "amount") || 0), 0);
      const totalReturn = rows.reduce((s, r) => s + Number(getRowVal(r, "Return", "return") || 0), 0);
      const totalBalance = rows.reduce((s, r) => s + Number(getRowVal(r, "Balance", "balance") || 0), 0);
      const totalBalanceAmt = rows.reduce((s, r) => s + Number(getRowVal(r, "BalanceAmt", "balanceAmt") || 0), 0);
      const avgPrice = totalPcs > 0 ? totalAmount / totalPcs : 0;

      out.push({
        ...first,
        isParent: true,
        MemoNo: memoNo,
        ItemName: "Total",
        Pcs: totalPcs,
        Price: avgPrice,
        Amount: totalAmount,
        Return: totalReturn,
        Balance: totalBalance,
        BalanceAmt: totalBalanceAmt,
        memoViewHtml: "",
        imageLinkHtml: "",
        childRecords: rows
      });
    });

    return out;
  }, [reportRows]);

  const renderSubRows = useCallback(
    (row) => {
      const parent = row.original;
      const memoKey = String(getRowVal(parent, "MemoNo", "memoNo") || "");
      if (!expandedMemoNos.has(memoKey)) return null;

      const children = parent.childRecords || [];
      return children.map((child, index) => {
        const childRow = { ...child, isParent: false };
        return (
          <tr key={`child-${memoKey}-${index}`} className="child-row">
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
          const memoKey = String(getRowVal(r, "MemoNo", "memoNo") || "");
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
                  // MVC: ../jewMemo/edit-jew-Memo?Id=...&Mode=view
                  if (code) window.open(`/jewMemo/edit-jew-Memo?Id=${code}&Mode=view`, "_blank");
                }}
              >
                <i className="bx bx-show-alt fs-18" />
              </a>
            </div>
          );
        },
        footer: () => <span className="fw-bold text-center d-block">Total</span>
      },
      {
        header: t("Image"),
        accessorKey: "ImagePath",
        enableColumnFilter: false,
        enableSorting: false,
        cell: ({ row }) => {
          const r = row.original;
          if (r?.isParent) return "";
          const imageUrl = getRowVal(r, "ImagePath", "imagePath");
          const itemCode = getRowVal(r, "ItemCode", "itemCode");
          if (!imageUrl) return "";
          return (
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                if (itemCode) window.open(`/JewDnaReport/edit-jewellery-Mode?Id=${itemCode}&Mode=view`, "_blank");
              }}
            >
              <img
                src={imageUrl}
                alt="Image"
                style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 4 }}
              />
            </a>
          );
        }
      },
      {
        header: t("DATE"),
        accessorKey: "ConDATE",
        accessorFn: (row) => dashText(getRowVal(row, "ConDATE", "conDATE")),
        cell: ({ row }) => dashText(getRowVal(row.original, "ConDATE", "conDATE"))
      },
      {
        header: t("DateDiff"),
        accessorKey: "DateDiff",
        accessorFn: (row) => dashText(getRowVal(row, "DateDiff", "dateDiff")),
        cell: ({ row }) => dashText(getRowVal(row.original, "DateDiff", "dateDiff"))
      },
      {
        header: t("MemoNo"),
        accessorKey: "MemoNo",
        accessorFn: (row) => dashText(getRowVal(row, "MemoNo", "memoNo")),
        cell: ({ row }) => dashText(getRowVal(row.original, "MemoNo", "memoNo"))
      },
      {
        header: t("BillNo"),
        accessorKey: "BillNo",
        accessorFn: (row) => dashText(getRowVal(row, "BillNo", "billNo")),
        cell: ({ row }) => dashText(getRowVal(row.original, "BillNo", "billNo"))
      },
      {
        header: t("Party"),
        accessorKey: "Party",
        accessorFn: (row) => dashText(getRowVal(row, "Party", "party")),
        cell: ({ row }) => dashText(getRowVal(row.original, "Party", "party"))
      },
      {
        header: t("Jew Stock ID"),
        accessorKey: "Stock_ID",
        accessorFn: (row) => dashText(getRowVal(row, "Stock_ID", "stock_ID", "stock_id")),
        cell: ({ row }) => dashText(getRowVal(row.original, "Stock_ID", "stock_ID", "stock_id"))
      },
      {
        header: t("ItemName"),
        accessorKey: "ItemName",
        accessorFn: (row) => dashText(getRowVal(row, "ItemName", "itemName")),
        cell: ({ row }) => dashText(getRowVal(row.original, "ItemName", "itemName"))
      },
      {
        header: t("Carats"),
        accessorKey: "Pcs",
        accessorFn: (row) => fmtFixed(getRowVal(row, "Pcs", "pcs", "Carats", "carats"), 3),
        cell: ({ row }) => fmtFixed(getRowVal(row.original, "Pcs", "pcs", "Carats", "carats"), 3),
        footer: ({ table }) => {
          const { totalPcs } = getTableTotals(table);
          return <span className="fw-bold text-end d-block">{fmtFixed(totalPcs, 3)}</span>;
        }
      },
      {
        header: t("Price"),
        accessorKey: "Price",
        accessorFn: (row) => fmtFixed(getRowVal(row, "Price", "price"), 2),
        cell: ({ row }) => fmtFixed(getRowVal(row.original, "Price", "price"), 2),
        footer: ({ table }) => {
          const { totalPcs, totalAmount } = getTableTotals(table);
          return <span className="fw-bold text-end d-block">{fmtFixed(totalPcs > 0 ? totalAmount / totalPcs : 0, 2)}</span>;
        }
      },
      {
        header: t("Amount"),
        accessorKey: "Amount",
        accessorFn: (row) => fmtFixed(getRowVal(row, "Amount", "amount"), 2),
        cell: ({ row }) => fmtFixed(getRowVal(row.original, "Amount", "amount"), 2),
        footer: ({ table }) => {
          const { totalAmount } = getTableTotals(table);
          return <span className="fw-bold text-end d-block">{fmtFixed(totalAmount, 2)}</span>;
        }
      },
      {
        header: t("Return"),
        accessorKey: "Return",
        accessorFn: (row) => fmtFixed(getRowVal(row, "Return", "return"), 3),
        cell: ({ row }) => fmtFixed(getRowVal(row.original, "Return", "return"), 3),
        footer: ({ table }) => {
          const { totalReturn } = getTableTotals(table);
          return <span className="fw-bold text-end d-block">{fmtFixed(totalReturn, 3)}</span>;
        }
      },
      {
        header: t("ReturnDate"),
        accessorKey: "MemoReturnDate",
        accessorFn: (row) => dashText(getRowVal(row, "MemoReturnDate", "memoReturnDate", "ReturnDate")),
        cell: ({ row }) => dashText(getRowVal(row.original, "MemoReturnDate", "memoReturnDate", "ReturnDate"))
      },
      {
        header: t("Balance"),
        accessorKey: "Balance",
        accessorFn: (row) => fmtFixed(getRowVal(row, "Balance", "balance"), 2),
        cell: ({ row }) => fmtFixed(getRowVal(row.original, "Balance", "balance"), 2),
        footer: ({ table }) => {
          const { totalBalance } = getTableTotals(table);
          return <span className="fw-bold text-end d-block">{fmtFixed(totalBalance, 2)}</span>;
        }
      },
      {
        header: t("BalanceAmt"),
        accessorKey: "BalanceAmt",
        accessorFn: (row) => fmtFixed(getRowVal(row, "BalanceAmt", "balanceAmt"), 2),
        cell: ({ row }) => fmtFixed(getRowVal(row.original, "BalanceAmt", "balanceAmt"), 2),
        footer: ({ table }) => {
          const { totalBalanceAmt } = getTableTotals(table);
          return <span className="fw-bold text-end d-block">{fmtFixed(totalBalanceAmt, 2)}</span>;
        }
      },
      {
        header: t("Broker"),
        accessorKey: "Broker",
        accessorFn: (row) => dashText(getRowVal(row, "Broker", "broker")),
        cell: ({ row }) => dashText(getRowVal(row.original, "Broker", "broker"))
      },
      {
        header: t("IssUser"),
        accessorKey: "IssUser",
        accessorFn: (row) => dashText(getRowVal(row, "IssUser", "issUser")),
        cell: ({ row }) => dashText(getRowVal(row.original, "IssUser", "issUser"))
      },
      {
        header: t("Symbol"),
        accessorKey: "Symbol",
        accessorFn: (row) => dashText(getRowVal(row, "Symbol", "symbol")),
        cell: ({ row }) => dashText(getRowVal(row.original, "Symbol", "symbol"))
      },
      {
        header: t("Cert"),
        accessorKey: "CertId",
        accessorFn: (row) => dashText(getRowVal(row, "CertId", "certId", "Cert")),
        cell: ({ row }) => dashText(getRowVal(row.original, "CertId", "certId", "Cert"))
      },
      {
        header: t("InvType"),
        accessorKey: "Invtype",
        accessorFn: (row) => dashText(getRowVal(row, "Invtype", "InvType", "invtype")),
        cell: ({ row }) => dashText(getRowVal(row.original, "Invtype", "InvType", "invtype"))
      },
      {
        header: t("MemoTime"),
        accessorKey: "MemoTime",
        accessorFn: (row) => dashText(getRowVal(row, "MemoTime", "memoTime")),
        cell: ({ row }) => dashText(getRowVal(row.original, "MemoTime", "memoTime"))
      },
      {
        header: t("MemoReturnDate"),
        accessorKey: "MemoReturnDate2",
        accessorFn: (row) => dashText(getRowVal(row, "MemoReturnDate", "memoReturnDate")),
        cell: ({ row }) => dashText(getRowVal(row.original, "MemoReturnDate", "memoReturnDate"))
      },
      {
        header: t("MemoReturnTime"),
        accessorKey: "MemoReturnTime",
        accessorFn: (row) => dashText(getRowVal(row, "MemoReturnTime", "memoReturnTime")),
        cell: ({ row }) => dashText(getRowVal(row.original, "MemoReturnTime", "memoReturnTime"))
      }
    ],
    [expandedMemoNos, t]
  );

  const handleExcel = async () => {
    if (!reportRows || reportRows.length === 0) {
      toast.warning(t("No data available to export."));
      return;
    }

    const headers = [
      "DATE", "DateDiff", "MemoNo", "BillNo", "Party", "Jew Stock ID", "ItemName",
      "Carats", "Price", "Amount", "Return", "ReturnDate", "Balance", "BalanceAmt",
      "Broker", "IssUser", "Symbol", "Cert", "InvType", "MemoTime", "MemoReturnDate", "MemoReturnTime"
    ];

    const rows = reportRows.map((row) => [
      dashText(getRowVal(row, "ConDATE", "conDATE")),
      dashText(getRowVal(row, "DateDiff", "dateDiff")),
      dashText(getRowVal(row, "MemoNo", "memoNo")),
      dashText(getRowVal(row, "BillNo", "billNo")),
      dashText(getRowVal(row, "Party", "party")),
      dashText(getRowVal(row, "Stock_ID", "stock_ID")),
      dashText(getRowVal(row, "ItemName", "itemName")),
      fmtFixed(getRowVal(row, "Pcs", "pcs", "Carats", "carats"), 3),
      fmtFixed(getRowVal(row, "Price", "price"), 2),
      fmtFixed(getRowVal(row, "Amount", "amount"), 2),
      fmtFixed(getRowVal(row, "Return", "return"), 3),
      dashText(getRowVal(row, "MemoReturnDate", "memoReturnDate")),
      fmtFixed(getRowVal(row, "Balance", "balance"), 2),
      fmtFixed(getRowVal(row, "BalanceAmt", "balanceAmt"), 2),
      dashText(getRowVal(row, "Broker", "broker")),
      dashText(getRowVal(row, "IssUser", "issUser")),
      dashText(getRowVal(row, "Symbol", "symbol")),
      dashText(getRowVal(row, "CertId", "certId")),
      dashText(getRowVal(row, "Invtype", "InvType")),
      dashText(getRowVal(row, "MemoTime", "memoTime")),
      dashText(getRowVal(row, "MemoReturnDate", "memoReturnDate")),
      dashText(getRowVal(row, "MemoReturnTime", "memoReturnTime"))
    ]);

    const res = await exportToExcel(headers, rows, "JewMemoReport", "JewMemoReport");
    if (!res?.success) toast.error(t("Excel export failed."));
  };

  document.title = `${t("Jewellery MemoOut Report")} | ${t("Reports")}`;

  return (
    <React.Fragment>
      <ToastContainer />

      <div className="page-content">
        <Container fluid>
          <BreadCrumb title={t("Jewellery Memo Report")} pageTitle={t("JewMemo Reports")} />

          <div className="card stock-search-header-bar d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between mb-3 p-3 rounded-3 shadow-sm border gap-2">
            <h5 className="mb-0 fw-bold text-primary d-flex align-items-center gap-2">
              <i className={hasSearched ? "ri-database-2-line fs-20 text-primary" : "ri-search-eye-line fs-20 text-primary"}></i>
              {hasSearched ? t("Jewellery Memo Report Results") : t("Jewellery Memo Report Filters")}
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
                          <Select classNamePrefix="react-select" styles={customStyles} isClearable options={currencyOptions} value={currencyOptions.find((o) => o.value === filters.currency) || null} onChange={(sel) => setFilters((p) => ({ ...p, currency: sel?.value || "" }))} placeholder={t("Select Currency")} isLoading={loadingDropdowns} />
                        </FormGroup>
                      </Col>
                      <Col sm={2}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1 small">{t("Memo No")}</Label>
                          <Input type="text" className="form-control form-control-sm" style={{ height: "35px" }} value={filters.invNo} placeholder={t("MemoNo")} onChange={(e) => setFilters((p) => ({ ...p, invNo: e.target.value }))} />
                        </FormGroup>
                      </Col>
                      <Col sm={2}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1 small">{t("Type")}</Label>
                          <Select classNamePrefix="react-select" styles={customStyles} options={TYPE_OPTIONS} value={TYPE_OPTIONS.find((o) => o.value === filters.type) || TYPE_OPTIONS[0]} onChange={(sel) => setFilters((p) => ({ ...p, type: sel?.value || "ALL" }))} placeholder={t("Select Type")} />
                        </FormGroup>
                      </Col>
                      <Col sm={2}>
                        <FormGroup className="mb-0">
                          <Label className="w-100 mb-1"></Label>
                          <div className="d-flex align-items-center gap-1" style={{ height: "35px" }}>
                            <input type="checkbox" id="jewClearMemoCheckbox" checked={filters.clear} onChange={(e) => setFilters((p) => ({ ...p, clear: e.target.checked }))} />
                            <Label htmlFor="jewClearMemoCheckbox" className="mb-0 small">{t("Show Clear Memo")}</Label>
                          </div>
                        </FormGroup>
                      </Col>
                    </Row>

                    <Row className="g-2">
                      <Col sm={2}>
                        <FormGroup className="mb-0">
                          <div className="d-flex align-items-center gap-1 mb-1">
                            <input type="checkbox" id="jewRtnDateCheckbox" checked={filters.chkRtnDate} onChange={(e) => setFilters((p) => ({ ...p, chkRtnDate: e.target.checked }))} />
                            <Label htmlFor="jewRtnDateCheckbox" className="fw-medium mb-0 small">{t("Rtn Date")}</Label>
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
                          <Select classNamePrefix="react-select" styles={customStyles} isClearable options={partyOptions} value={partyOptions.find((o) => o.value === filters.party) || null} onInputChange={(val) => setPartyInput(val)} onChange={(sel) => setFilters((p) => ({ ...p, party: sel?.value || "" }))} placeholder={t("Search Party")} isLoading={loadingParties} />
                        </FormGroup>
                      </Col>
                      <Col sm={2}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1 small">{t("Broker")}</Label>
                          <Select classNamePrefix="react-select" styles={customStyles} isClearable options={brokerOptions} value={brokerOptions.find((o) => o.value === filters.broker) || null} onInputChange={(val) => setBrokerInput(val)} onChange={(sel) => setFilters((p) => ({ ...p, broker: sel?.value || "" }))} placeholder={t("Search Broker")} isLoading={loadingBrokers} />
                        </FormGroup>
                      </Col>
                    </Row>
                  </Col>

                  <Col md={2}>
                    <FormGroup className="mb-0">
                      <Label className="fw-medium mb-1 small">{t("Enter Jew Stock ID")}</Label>
                      <Input type="textarea" rows={7} value={filters.stockId} placeholder={t("Search by Jew Stock ID")} onChange={(e) => setFilters((p) => ({ ...p, stockId: e.target.value }))} />
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

export default JewelleryMemooutReport;
