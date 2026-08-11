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
  getJewelleryConsignMentInReport,
  getJewelleryConsignMentInReportDropdowns,
  getJewelleryConsignMentInSummary
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
      totalPcs += Number(getRowVal(r, "Pcs", "pcs") || 0);
      totalAmount += Number(getRowVal(r, "Amount", "amount") || 0);
      totalReturn += Number(getRowVal(r, "Return", "return") || 0);
      totalBalance += Number(getRowVal(r, "Balance", "balance") || 0);
      totalBalanceAmt += Number(getRowVal(r, "BalanceAmt", "balanceAmt") || 0);
    }
  });

  return { totalPcs, totalAmount, totalReturn, totalBalance, totalBalanceAmt };
};

const mapDropdownItems = (list) => {
  if (!Array.isArray(list)) return [];
  return list.map((item) => ({
    value: String(item.id ?? item.ID ?? item.name ?? item.Name ?? ""),
    label: String(item.name ?? item.Name ?? item.id ?? item.ID ?? "").toUpperCase()
  })).filter((o) => o.value);
};

const TYPE_OPTIONS = [
  { value: "ALL", label: "ALL" },
  { value: "External", label: "EXTERNAL" },
  { value: "Internal", label: "INTERNAL" },
  { value: "Local", label: "LOCAL" },
  { value: "LAB", label: "LAB" },
  { value: "Pend Sale", label: "PEND SALE" }
];

const CERTIFICATE_OPTIONS = [
  { value: "IGI", label: "IGI" },
  { value: "GIA", label: "GIA" }
];

const JewelleryConsignMentInReport = () => {
  const { t } = useTranslation();
  const { fromDate, toDate, getDates, mergeDates } = useSettingReportDates({ includeReturnDates: true });

  const [loadingDropdowns, setLoadingDropdowns] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSummary, setIsSummary] = useState(false);

  const [dropdownData, setDropdownData] = useState({});
  const [purityOptions, setPurityOptions] = useState([]);
  const [loadingPurity, setLoadingPurity] = useState(false);
  const [expandedMemoNos, setExpandedMemoNos] = useState(() => new Set());
  const [reportRows, setReportRows] = useState([]);
  const [summaryRows, setSummaryRows] = useState([]);

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
    summary: false,
    stockId: "",
    jewDesign: "",
    jewCategory: "",
    jewSubCategory: "",
    jewCertificate: "",
    jewMetalType: "",
    jewColor: "",
    jewPurity: ""
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
    (key) => mapDropdownItems(dropdownData?.[key] || []),
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
        (Array.isArray(data) ? data : [])
          .map((item) => ({
            value: String(item.metalPurityID || item.MetalPurityID || item.MetalPurityId || ""),
            label: String(item.metalPurityID || item.MetalPurityID || item.MetalPurityId || "")
          }))
          .filter((o) => o.value)
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
        const res = await getJewelleryConsignMentInReportDropdowns();
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
    loadPurityOptions(filters.jewMetalType);
  }, [filters.jewMetalType]);

  const handleClear = async () => {
    const d = await getDates();
    setHasSearched(false);
    setIsSummary(false);
    setExpandedMemoNos(new Set());
    setReportRows([]);
    setSummaryRows([]);
    setPartyInput("");
    setBrokerInput("");
    setPurityOptions([]);
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
          summary: false,
          stockId: "",
          jewDesign: "",
          jewCategory: "",
          jewSubCategory: "",
          jewCertificate: "",
          jewMetalType: "",
          jewColor: "",
          jewPurity: ""
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
    Stock_ID: filters.stockId || null,
    JewDesign: filters.jewDesign || null,
    JewCategory: filters.jewCategory || null,
    JewSubCategory: filters.jewSubCategory || null,
    JewCertificate: filters.jewCertificate || null,
    JewMetalType: filters.jewMetalType || null,
    JewColor: filters.jewColor || null,
    JewPurity: filters.jewPurity || null
  });

  const handleReport = async () => {
    setLoading(true);
    try {
      const payload = buildPayload();
      if (filters.summary) {
        const response = await getJewelleryConsignMentInSummary(payload);
        const ok = response?.success || response?.Success;
        if (ok) {
          setSummaryRows(response.Data || response.data || []);
          setReportRows([]);
          setIsSummary(true);
          setHasSearched(true);
          setExpandedMemoNos(new Set());
          toast.success(t("Report loaded successfully."));
        } else {
          toast.warning(response?.Data || response?.data || response?.Message || t("Failed to load report."));
        }
      } else {
        const response = await getJewelleryConsignMentInReport(payload);
        const ok = response?.success || response?.Success;
        if (ok) {
          setReportRows(response.Data || response.data || []);
          setSummaryRows([]);
          setIsSummary(false);
          setHasSearched(true);
          setExpandedMemoNos(new Set());
          toast.success(t("Report loaded successfully."));
        } else {
          toast.warning(response?.Data || response?.data || response?.Message || t("Failed to load report."));
        }
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

      const totalPcs = rows.reduce((s, r) => s + Number(getRowVal(r, "Pcs", "pcs") || 0), 0);
      const totalAmount = rows.reduce((s, r) => s + Number(getRowVal(r, "Amount", "amount") || 0), 0);
      const totalReturn = rows.reduce((s, r) => s + Number(getRowVal(r, "Return", "return") || 0), 0);
      const totalBalance = rows.reduce((s, r) => s + Number(getRowVal(r, "Balance", "balance") || 0), 0);
      const totalBalanceAmt = rows.reduce((s, r) => s + Number(getRowVal(r, "BalanceAmt", "balanceAmt") || 0), 0);

      out.push({
        ...first,
        isParent: true,
        MemoNo: memoNo,
        ItemName: "Total",
        Pcs: totalPcs,
        Price: totalPcs > 0 ? totalAmount / totalPcs : 0,
        Amount: totalAmount,
        Return: totalReturn,
        Balance: totalBalance,
        BalanceAmt: totalBalanceAmt,
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
                  if (code) window.open(`/JewConsignmentIn/edit-Con?Id=${code}&Mode=view`, "_blank");
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
                if (itemCode) window.open(`/master/edit-jewellery-stock?ID=${itemCode}&Mode=view`, "_blank");
              }}
            >
              <img src={imageUrl} alt="Image" style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 4 }} />
            </a>
          );
        }
      },
      {
        header: t("DATE"),
        accessorKey: "ConDATE",
        cell: ({ row }) => dashText(getRowVal(row.original, "ConDATE", "conDATE"))
      },
      {
        header: t("DateDiff"),
        accessorKey: "DateDiff",
        cell: ({ row }) => dashText(getRowVal(row.original, "DateDiff", "dateDiff"))
      },
      {
        header: t("MemoNo"),
        accessorKey: "MemoNo",
        cell: ({ row }) => dashText(getRowVal(row.original, "MemoNo", "memoNo"))
      },
      {
        header: t("BillNo"),
        accessorKey: "BillNo",
        cell: ({ row }) => dashText(getRowVal(row.original, "BillNo", "billNo"))
      },
      {
        header: t("Party"),
        accessorKey: "Party",
        cell: ({ row }) => dashText(getRowVal(row.original, "Party", "party"))
      },
      {
        header: t("Jew Stock ID"),
        accessorKey: "Stock_ID",
        cell: ({ row }) => dashText(getRowVal(row.original, "Stock_ID", "stock_ID"))
      },
      {
        header: t("ItemName"),
        accessorKey: "ItemName",
        cell: ({ row }) => dashText(getRowVal(row.original, "ItemName", "itemName"))
      },
      {
        header: t("Carats"),
        accessorKey: "Pcs",
        cell: ({ row }) => fmtFixed(getRowVal(row.original, "Pcs", "pcs"), 3),
        footer: ({ table }) => {
          const { totalPcs } = getTableTotals(table);
          return <span className="fw-bold text-end d-block">{fmtFixed(totalPcs, 3)}</span>;
        }
      },
      {
        header: t("Price"),
        accessorKey: "Price",
        cell: ({ row }) => fmtFixed(getRowVal(row.original, "Price", "price"), 2),
        footer: ({ table }) => {
          const { totalPcs, totalAmount } = getTableTotals(table);
          return <span className="fw-bold text-end d-block">{fmtFixed(totalPcs > 0 ? totalAmount / totalPcs : 0, 2)}</span>;
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
        header: t("Return"),
        accessorKey: "Return",
        cell: ({ row }) => fmtFixed(getRowVal(row.original, "Return", "return"), 3),
        footer: ({ table }) => {
          const { totalReturn } = getTableTotals(table);
          return <span className="fw-bold text-end d-block">{fmtFixed(totalReturn, 3)}</span>;
        }
      },
      {
        header: t("ReturnDate"),
        accessorKey: "MemoReturnDate",
        cell: ({ row }) => dashText(getRowVal(row.original, "MemoReturnDate", "memoReturnDate"))
      },
      {
        header: t("Balance"),
        accessorKey: "Balance",
        cell: ({ row }) => fmtFixed(getRowVal(row.original, "Balance", "balance"), 2),
        footer: ({ table }) => {
          const { totalBalance } = getTableTotals(table);
          return <span className="fw-bold text-end d-block">{fmtFixed(totalBalance, 2)}</span>;
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
      {
        header: t("Broker"),
        accessorKey: "Broker",
        cell: ({ row }) => dashText(getRowVal(row.original, "Broker", "broker"))
      },
      {
        header: t("IssUser"),
        accessorKey: "IssUser",
        cell: ({ row }) => dashText(getRowVal(row.original, "IssUser", "issUser"))
      },
      {
        header: t("Symbol"),
        accessorKey: "Symbol",
        cell: ({ row }) => dashText(getRowVal(row.original, "Symbol", "symbol"))
      },
      {
        header: t("Cert"),
        accessorKey: "CertId",
        cell: ({ row }) => dashText(getRowVal(row.original, "CertId", "certId"))
      },
      {
        header: t("InvType"),
        accessorKey: "Invtype",
        cell: ({ row }) => dashText(getRowVal(row.original, "Invtype", "InvType", "invtype"))
      },
      {
        header: t("MemoTime"),
        accessorKey: "MemoTime",
        cell: ({ row }) => dashText(getRowVal(row.original, "MemoTime", "memoTime"))
      },
      {
        header: t("MemoReturnDate"),
        accessorKey: "MemoReturnDate2",
        cell: ({ row }) => dashText(getRowVal(row.original, "MemoReturnDate", "memoReturnDate"))
      },
      {
        header: t("MemoReturnTime"),
        accessorKey: "MemoReturnTime",
        cell: ({ row }) => dashText(getRowVal(row.original, "MemoReturnTime", "memoReturnTime"))
      }
    ],
    [expandedMemoNos, t]
  );

  const summaryColumns = useMemo(
    () => [
      {
        header: t("Carats"),
        accessorKey: "TotalCarats",
        cell: ({ row }) => fmtFixed(getRowVal(row.original, "TotalCarats", "totalCarats"), 3)
      },
      {
        header: t("Return"),
        accessorKey: "ReturnCarats",
        cell: ({ row }) => fmtFixed(getRowVal(row.original, "ReturnCarats", "returnCarats"), 3)
      },
      {
        header: t("Purchased"),
        accessorKey: "PurchasedCarats",
        cell: ({ row }) => fmtFixed(getRowVal(row.original, "PurchasedCarats", "purchasedCarats"), 3)
      },
      {
        header: t("Balance"),
        accessorKey: "BalanceCarats",
        cell: ({ row }) => fmtFixed(getRowVal(row.original, "BalanceCarats", "balanceCarats"), 3)
      }
    ],
    [t]
  );

  const handleExcel = async () => {
    if (isSummary) {
      if (!summaryRows || summaryRows.length === 0) {
        toast.warning(t("No data available to export."));
        return;
      }
      const headers = ["Carats", "Return", "Purchased", "Balance"];
      const rows = summaryRows.map((row) => [
        fmtFixed(getRowVal(row, "TotalCarats", "totalCarats"), 3),
        fmtFixed(getRowVal(row, "ReturnCarats", "returnCarats"), 3),
        fmtFixed(getRowVal(row, "PurchasedCarats", "purchasedCarats"), 3),
        fmtFixed(getRowVal(row, "BalanceCarats", "balanceCarats"), 3)
      ]);
      const res = await exportToExcel(headers, rows, "JewSummaryconReport", "JewSummaryconReport");
      if (!res?.success) toast.error(t("Excel export failed."));
      return;
    }

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
      fmtFixed(getRowVal(row, "Pcs", "pcs"), 3),
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

    const res = await exportToExcel(headers, rows, "JewConsignmentInReport", "JewConsignmentInReport");
    if (!res?.success) toast.error(t("Excel export failed."));
  };

  document.title = `${t("Jewellery ConsignMentIn Report")} | ${t("Reports")}`;

  return (
    <React.Fragment>
      <ToastContainer />

      <div className="page-content">
        <Container fluid>
          <BreadCrumb title={t("Jewellery Consignment Report")} pageTitle={t("Jewellery")} />

          <div className="card stock-search-header-bar d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between mb-3 p-3 rounded-3 shadow-sm border gap-2">
            <h5 className="mb-0 fw-bold text-primary d-flex align-items-center gap-2">
              <i className={hasSearched ? "ri-database-2-line fs-20 text-primary" : "ri-search-eye-line fs-20 text-primary"}></i>
              {hasSearched
                ? isSummary
                  ? t("Jew Consignment Summary Results")
                  : t("Jewellery Consignment Report Results")
                : t("Jewellery Consignment Report Filters")}
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
                      setIsSummary(false);
                      setReportRows([]);
                      setSummaryRows([]);
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
                    disabled={isSummary ? summaryRows.length === 0 : reportRows.length === 0}
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
                          <Select classNamePrefix="react-select" styles={customStyles} isClearable options={getOptions("currency")} value={getOptions("currency").find((o) => o.value === filters.currency) || null} onChange={(sel) => setFilters((p) => ({ ...p, currency: sel?.value || "" }))} placeholder={t("Select Currency")} isLoading={loadingDropdowns} />
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
                          <div className="d-flex flex-column gap-1" style={{ minHeight: "35px" }}>
                            <div className="d-flex align-items-center gap-1">
                              <input type="checkbox" id="jewConsSummaryCheckbox" checked={filters.summary} onChange={(e) => setFilters((p) => ({ ...p, summary: e.target.checked }))} />
                              <Label htmlFor="jewConsSummaryCheckbox" className="mb-0 small text-danger">{t("JewConsignment Summary")}</Label>
                            </div>
                            <div className="d-flex align-items-center gap-1">
                              <input type="checkbox" id="jewConsClearCheckbox" checked={filters.clear} onChange={(e) => setFilters((p) => ({ ...p, clear: e.target.checked }))} />
                              <Label htmlFor="jewConsClearCheckbox" className="mb-0 small">{t("Show Clear Consignment")}</Label>
                            </div>
                          </div>
                        </FormGroup>
                      </Col>
                    </Row>

                    <Row className="g-2 mb-2">
                      <Col sm={2}>
                        <FormGroup className="mb-0">
                          <div className="d-flex align-items-center gap-1 mb-1">
                            <input type="checkbox" id="jewConsRtnDateCheckbox" checked={filters.chkRtnDate} onChange={(e) => setFilters((p) => ({ ...p, chkRtnDate: e.target.checked }))} />
                            <Label htmlFor="jewConsRtnDateCheckbox" className="fw-medium mb-0 small">{t("Rtn Date")}</Label>
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
                      <Col sm={2}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1 small">{t("Design")}</Label>
                          <Select classNamePrefix="react-select" styles={customStyles} isClearable options={getOptions("design")} value={getOptions("design").find((o) => o.value === filters.jewDesign) || null} onChange={(sel) => setFilters((p) => ({ ...p, jewDesign: sel?.value || "" }))} placeholder={t("Select Design")} isLoading={loadingDropdowns} />
                        </FormGroup>
                      </Col>
                      <Col sm={2}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1 small">{t("Category")}</Label>
                          <Select classNamePrefix="react-select" styles={customStyles} isClearable options={getOptions("category")} value={getOptions("category").find((o) => o.value === filters.jewCategory) || null} onChange={(sel) => setFilters((p) => ({ ...p, jewCategory: sel?.value || "" }))} placeholder={t("Select Category")} isLoading={loadingDropdowns} />
                        </FormGroup>
                      </Col>
                    </Row>

                    <Row className="g-2">
                      <Col sm={2}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1 small">{t("SubCategory")}</Label>
                          <Select classNamePrefix="react-select" styles={customStyles} isClearable options={getOptions("subCategory")} value={getOptions("subCategory").find((o) => o.value === filters.jewSubCategory) || null} onChange={(sel) => setFilters((p) => ({ ...p, jewSubCategory: sel?.value || "" }))} placeholder={t("Select SubCategory")} isLoading={loadingDropdowns} />
                        </FormGroup>
                      </Col>
                      <Col sm={2}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1 small">{t("Jewellery Certificate")}</Label>
                          <Select classNamePrefix="react-select" styles={customStyles} isClearable options={CERTIFICATE_OPTIONS} value={CERTIFICATE_OPTIONS.find((o) => o.value === filters.jewCertificate) || null} onChange={(sel) => setFilters((p) => ({ ...p, jewCertificate: sel?.value || "" }))} placeholder={t("Select Certificate")} />
                        </FormGroup>
                      </Col>
                      <Col sm={2}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1 small">{t("MetalType")}</Label>
                          <Select classNamePrefix="react-select" styles={customStyles} isClearable options={getOptions("metal")} value={getOptions("metal").find((o) => o.value === filters.jewMetalType) || null} onChange={(sel) => setFilters((p) => ({ ...p, jewMetalType: sel?.value || "", jewPurity: "" }))} placeholder={t("Select MetalType")} isLoading={loadingDropdowns} />
                        </FormGroup>
                      </Col>
                      <Col sm={2}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1 small">{t("Color")}</Label>
                          <Select classNamePrefix="react-select" styles={customStyles} isClearable options={getOptions("color")} value={getOptions("color").find((o) => o.value === filters.jewColor) || null} onChange={(sel) => setFilters((p) => ({ ...p, jewColor: sel?.value || "" }))} placeholder={t("Select Color")} isLoading={loadingDropdowns} />
                        </FormGroup>
                      </Col>
                      <Col sm={2}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1 small">{t("Purity")}</Label>
                          <Select classNamePrefix="react-select" styles={customStyles} isClearable options={purityOptions} value={purityOptions.find((o) => o.value === filters.jewPurity) || null} onChange={(sel) => setFilters((p) => ({ ...p, jewPurity: sel?.value || "" }))} placeholder={t("Select Metal Purity")} isLoading={loadingPurity} isDisabled={!filters.jewMetalType} />
                        </FormGroup>
                      </Col>
                    </Row>
                  </Col>

                  <Col md={2}>
                    <FormGroup className="mb-0">
                      <Label className="fw-medium mb-1 small">{t("Enter Jew Stock ID")}</Label>
                      <Input type="textarea" rows={7} value={filters.stockId} placeholder={t("Search by stock id")} onChange={(e) => setFilters((p) => ({ ...p, stockId: e.target.value }))} />
                    </FormGroup>
                  </Col>
                </Row>
              </CardBody>
            </Card>
          )}

          {hasSearched && !isSummary && (
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

          {hasSearched && isSummary && (
            <Card className="shadow-lg border-0 rounded-3 mb-4">
              <CardBody>
                <div className="d-flex justify-content-end gap-4 mb-3 small fw-semibold">
                  <span>
                    {t("Showing")}: {summaryRows.length} {t("entries")}
                  </span>
                </div>

                <TableContainer
                  columns={summaryColumns}
                  data={summaryRows}
                  isGlobalFilter={true}
                  customPageSize={500}
                  customPageSizes={[500, 1000, 1500, -1]}
                  divClass="table-responsive table-card mb-3"
                  tableClass="align-middle table-nowrap mb-0 table-hover table-striped"
                  theadClass="table-light"
                  SearchPlaceholder={t("SEARCH:")}
                />
              </CardBody>
            </Card>
          )}
        </Container>
      </div>
    </React.Fragment>
  );
};

export default JewelleryConsignMentInReport;
