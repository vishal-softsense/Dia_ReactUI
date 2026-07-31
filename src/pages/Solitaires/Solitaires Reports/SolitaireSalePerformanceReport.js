import React, { useCallback, useEffect, useMemo, useState } from "react";
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
  getSolitaireSalePerformanceDropdowns,
  getSolitaireSalePerformanceReport
} from "../../../helpers/fakebackend_helper";
import { useSettingReportDates } from "../../../Components/Hooks/useSettingReportDates";

const CYAN_BG = "rgb(204, 255, 255)";
const BLUE_BG = "rgb(153, 204, 255)";
const PINK_BG = "rgb(255, 153, 204)";
const ORANGE_BG = "rgb(255, 204, 153)";
const GREEN_BG = "rgb(204, 255, 204)";
const LIGHT_BLUE_BG = "rgb(204, 204, 255)";
const YELLOW_BG = "rgb(255, 255, 153)";
const BRIGHT_YELLOW_BG = "rgb(255, 255, 0)";
const BRIGHT_CYAN_BG = "rgb(0, 255, 255)";

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

const cellWithBg = (content, bg) => {
  if (!bg) return content;
  return (
    <span
      className="d-block"
      style={{
        backgroundColor: bg,
        color: "#000000",
        margin: "-0.5rem",
        padding: "0.5rem",
        fontWeight: "500"
      }}
    >
      {content}
    </span>
  );
};

const getSalePerformanceTableTotals = (table) => {
  const rows = table.getFilteredRowModel().rows.map((r) => r.original);
  const totals = {
    totalPCarats: 0,
    totalPurDollar: 0,
    totalSaledollar: 0,
    totalPLdollar: 0,
    totalInterestdollar: 0,
    totalFinalPLdollarAfterInt: 0,
    totalInterestRs: 0,
    totalFinalPLRsAfterInt: 0
  };

  rows.forEach((r) => {
    totals.totalPCarats += Number(getRowVal(r, "PCarats", "pCarats") || 0);
    totals.totalPurDollar += Number(getRowVal(r, "PurDollar", "purDollar") || 0);
    totals.totalSaledollar += Number(getRowVal(r, "Saledollar", "saledollar") || 0);
    totals.totalPLdollar += Number(getRowVal(r, "PLdollar", "pLdollar") || 0);
    totals.totalInterestdollar += Number(getRowVal(r, "Interestdollar", "interestdollar") || 0);
    totals.totalFinalPLdollarAfterInt += Number(
      getRowVal(r, "FinalPLdollarAfterInt", "finalPLdollarAfterInt") || 0
    );
    totals.totalInterestRs += Number(getRowVal(r, "InterestRs", "interestRs") || 0);
    totals.totalFinalPLRsAfterInt += Number(
      getRowVal(r, "FinalPLRsAfterInt", "finalPLRsAfterInt") || 0
    );
  });

  return totals;
};

const showOptions = [
  { value: "All", label: "ALL" },
  { value: "Sold", label: "SOLD" },
  { value: "Unsold", label: "UNSOLD" }
];

const holdUnHoldOptions = [
  { value: "All", label: "ALL" },
  { value: "Hold", label: "HOLD" },
  { value: "Unhold", label: "UNHOLD" }
];

const stoneTypesOptions = [
  { value: "Single", label: "SINGLE" },
  { value: "Parcel", label: "PARCEL" },
  { value: "All", label: "ALL" }
];

const statusOptions = [
  { value: "All", label: "ALL" },
  { value: "OnHand", label: "ONHAND" },
  { value: "OnMemo", label: "ONMEMO" },
  { value: "OnHand&Int.Memo", label: "ONHAND&INT.MEMO" },
  { value: "OnHand + Memo In", label: "ONHAND + MEMO IN" },
  { value: "OnHand + Party Hold", label: "ONHAND + PARTY HOLD" },
  { value: "Memo In", label: "MEMO IN" },
  { value: "Party Hold", label: "PARTY HOLD" },
  { value: "All - Party Hold", label: "ALL - PARTY HOLD" }
];

const stockPricesOptions = [
  { value: "Purchase Price", label: "PURCHASE PRICE" },
  { value: "Base Price", label: "BASE PRICE" },
  { value: "Asking Price", label: "ASKING PRICE" }
];

const SolitaireSalePerformanceReport = () => {
  const { t } = useTranslation();

  const { fromDate, toDate, getDates, mergeDates } = useSettingReportDates();

  const [loadingDropdowns, setLoadingDropdowns] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [dropdownData, setDropdownData] = useState({});
  const [reportRows, setReportRows] = useState([]);

  const [filters, setFilters] = useState({
    fromDate,
    toDate,
    currency: "",
    show: "All",
    holdUnHold: "All",
    stoneTypes: "All",
    status: "All",
    stockPrices: "Purchase Price",
    expParty: "",
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
        value:
          key === "account"
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
        const res = await getSolitaireSalePerformanceDropdowns();
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
    setReportRows([]);
    setFilters(
      mergeDates(
        {
          currency: "",
          show: "All",
          holdUnHold: "All",
          stoneTypes: "All",
          status: "All",
          stockPrices: "Purchase Price",
          expParty: "",
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

  const buildPayload = () => ({
    FromDate: filters.fromDate,
    ToDate: filters.toDate,
    Currency: filters.currency || null,
    Show: filters.show || "All",
    HoldUnHold: filters.holdUnHold || "All",
    StoneTypes: filters.stoneTypes || "All",
    Status: filters.status || "All",
    StockPrices: filters.stockPrices || "Purchase Price",
    ExpParty: filters.expParty || null,
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
      const response = await getSolitaireSalePerformanceReport(buildPayload());
      const ok = response?.success || response?.Success;
      if (ok) {
        setReportRows(response.Data || response.data || []);
        setHasSearched(true);
        toast.success(t("Report loaded successfully."));
      } else {
        toast.warning(response?.Message || response?.Data || t("Failed to load report."));
      }
    } catch (err) {
      console.error("Sale Performance report request failed:", err);
      const msg =
        typeof err === "string"
          ? err
          : err?.response?.data?.message || err?.response?.data?.Message || null;
      toast.error(msg || t("Server Connection Problem.."));
    } finally {
      setLoading(false);
    }
  };

  const handleNewSearch = () => {
    setHasSearched(false);
    setReportRows([]);
  };

  const columns = useMemo(
    () => [
      {
        header: t("LotNo"),
        accessorKey: "lotNo",
        cell: ({ row }) => dashText(getRowVal(row.original, "lotNo", "LotNo")),
        footer: () => <span className="fw-bold text-center d-block">{t("Total")}</span>
      },
      {
        header: t("Status"),
        accessorKey: "status",
        cell: ({ row }) => dashText(getRowVal(row.original, "status", "Status"))
      },
      {
        header: t("Cert"),
        accessorKey: "certId",
        cell: ({ row }) => dashText(getRowVal(row.original, "certId", "CertId"))
      },
      {
        header: t("Shape"),
        accessorKey: "shapeId",
        cell: ({ row }) => dashText(getRowVal(row.original, "shapeId", "ShapeId"))
      },
      {
        header: t("Color"),
        accessorKey: "colorId",
        cell: ({ row }) => dashText(getRowVal(row.original, "colorId", "ColorId"))
      },
      {
        header: t("Clarity"),
        accessorKey: "clarityId",
        cell: ({ row }) => dashText(getRowVal(row.original, "clarityId", "ClarityId"))
      },
      {
        header: t("Prop"),
        accessorKey: "propId",
        cell: ({ row }) => dashText(getRowVal(row.original, "propId", "PropId"))
      },
      {
        header: t("Polish"),
        accessorKey: "polishId",
        cell: ({ row }) => dashText(getRowVal(row.original, "polishId", "PolishId"))
      },
      {
        header: t("Sym"),
        accessorKey: "symId",
        cell: ({ row }) => dashText(getRowVal(row.original, "symId", "SymId"))
      },
      {
        header: t("PCarats"),
        accessorKey: "pCarats",
        className: "text-end",
        cell: ({ row }) =>
          cellWithBg(fmtFixed(getRowVal(row.original, "pCarats", "PCarats"), 2), CYAN_BG),
        footer: ({ table }) => {
          const { totalPCarats } = getSalePerformanceTableTotals(table);
          return <span className="fw-bold text-end d-block">{fmtFixed(totalPCarats, 2)}</span>;
        }
      },
      {
        header: t("ConsDate"),
        accessorKey: "consDate",
        className: "text-center",
        cell: ({ row }) =>
          cellWithBg(dashText(getRowVal(row.original, "consDate", "ConsDate")), CYAN_BG)
      },
      {
        header: t("ProcessDays"),
        accessorKey: "processDays",
        className: "text-center",
        cell: ({ row }) =>
          cellWithBg(dashText(getRowVal(row.original, "processDays", "ProcessDays")), BLUE_BG)
      },
      {
        header: t("Pur.Date"),
        accessorKey: "pDate",
        className: "text-center",
        cell: ({ row }) => cellWithBg(dashText(getRowVal(row.original, "pDate", "PDate")), BLUE_BG)
      },
      {
        header: t("Pur.Price"),
        accessorKey: "purPrice",
        className: "text-end",
        cell: ({ row }) =>
          cellWithBg(fmtFixed(getRowVal(row.original, "purPrice", "PurPrice"), 2), BLUE_BG)
      },
      {
        header: t("Pur.USD"),
        accessorKey: "purDollar",
        className: "text-end",
        cell: ({ row }) =>
          cellWithBg(fmtFixed(getRowVal(row.original, "purDollar", "PurDollar"), 2), BLUE_BG),
        footer: ({ table }) => {
          const { totalPurDollar } = getSalePerformanceTableTotals(table);
          return <span className="fw-bold text-end d-block">{fmtFixed(totalPurDollar, 2)}</span>;
        }
      },
      {
        header: t("BaseRate"),
        accessorKey: "purBaseRate",
        className: "text-end",
        cell: ({ row }) =>
          cellWithBg(fmtFixed(getRowVal(row.original, "purBaseRate", "PurBaseRate"), 2), BLUE_BG)
      },
      {
        header: t("Pur.INR"),
        accessorKey: "purRs",
        className: "text-end",
        cell: ({ row }) =>
          cellWithBg(fmtFixed(getRowVal(row.original, "purRs", "PurRs"), 2), BLUE_BG)
      },
      {
        header: t("Cert Exp USD"),
        accessorKey: "certExpdollar",
        className: "text-end",
        cell: ({ row }) => cellWithBg(fmtFixed(getRowVal(row.original, "certExpdollar", "CertExpdollar"), 2), PINK_BG)
      },
      {
        header: t("Cert Exp INR"),
        accessorKey: "certExpRs",
        className: "text-end",
        cell: ({ row }) => cellWithBg(fmtFixed(getRowVal(row.original, "certExpRs", "CertExpRs"), 2), PINK_BG)
      },
      {
        header: t("Pur Cost USD"),
        accessorKey: "purCostdollar",
        className: "text-end",
        cell: ({ row }) => cellWithBg(fmtFixed(getRowVal(row.original, "purCostdollar", "PurCostdollar"), 2), PINK_BG)
      },
      {
        header: t("Pur Cost INR"),
        accessorKey: "purCostRs",
        className: "text-end",
        cell: ({ row }) => cellWithBg(fmtFixed(getRowVal(row.original, "purCostRs", "PurCostRs"), 2), PINK_BG)
      },
      {
        header: t("Sale Due Date"),
        accessorKey: "sDueDate",
        className: "text-center",
        cell: ({ row }) => cellWithBg(dashText(getRowVal(row.original, "sDueDate", "SDueDate")), ORANGE_BG)
      },
      {
        header: t("Sale Days"),
        accessorKey: "saleDays",
        className: "text-center",
        cell: ({ row }) => cellWithBg(dashText(getRowVal(row.original, "saleDays", "SaleDays")), ORANGE_BG)
      },
      {
        header: t("Sale Price"),
        accessorKey: "salePrice",
        className: "text-end",
        cell: ({ row }) => cellWithBg(fmtFixed(getRowVal(row.original, "salePrice", "SalePrice"), 2), ORANGE_BG)
      },
      {
        header: t("Sale USD"),
        accessorKey: "saledollar",
        className: "text-end",
        cell: ({ row }) => cellWithBg(fmtFixed(getRowVal(row.original, "saledollar", "Saledollar"), 2), ORANGE_BG),
        footer: ({ table }) => {
          const { totalSaledollar } = getSalePerformanceTableTotals(table);
          return <span className="fw-bold text-end d-block">{fmtFixed(totalSaledollar, 2)}</span>;
        }
      },
      {
        header: t("BaseRate"),
        accessorKey: "baseRate",
        className: "text-end",
        cell: ({ row }) => cellWithBg(fmtFixed(getRowVal(row.original, "baseRate", "BaseRate"), 2), ORANGE_BG)
      },
      {
        header: t("Sale INR"),
        accessorKey: "saleRs",
        className: "text-end",
        cell: ({ row }) => cellWithBg(fmtFixed(getRowVal(row.original, "saleRs", "SaleRs"), 2), ORANGE_BG)
      },
      {
        header: t("PL USD"),
        accessorKey: "pLdollar",
        className: "text-end",
        cell: ({ row }) => cellWithBg(fmtFixed(getRowVal(row.original, "pLdollar", "PLdollar"), 2), GREEN_BG),
        footer: ({ table }) => {
          const { totalPLdollar } = getSalePerformanceTableTotals(table);
          return <span className="fw-bold text-end d-block">{fmtFixed(totalPLdollar, 2)}</span>;
        }
      },
      {
        header: t("PL USD Per"),
        accessorKey: "pLdollarper",
        className: "text-end",
        cell: ({ row }) => cellWithBg(fmtFixed(getRowVal(row.original, "pLdollarper", "PLdollarper"), 2), GREEN_BG)
      },
      {
        header: t("PL INR"),
        accessorKey: "pLRs",
        className: "text-end",
        cell: ({ row }) => cellWithBg(fmtFixed(getRowVal(row.original, "pLRs", "PLRs"), 2), GREEN_BG)
      },
      {
        header: t("PL INR Per"),
        accessorKey: "pLRsper",
        className: "text-end",
        cell: ({ row }) => cellWithBg(fmtFixed(getRowVal(row.original, "pLRsper", "PLRsper"), 2), GREEN_BG)
      },
      {
        header: t("Adat USD"),
        accessorKey: "adatdollar",
        className: "text-end",
        cell: ({ row }) => cellWithBg(fmtFixed(getRowVal(row.original, "adatdollar", "Adatdollar"), 2), LIGHT_BLUE_BG)
      },
      {
        header: t("Adat INR"),
        accessorKey: "adatRs",
        className: "text-end",
        cell: ({ row }) => cellWithBg(fmtFixed(getRowVal(row.original, "adatRs", "AdatRs"), 2), LIGHT_BLUE_BG)
      },
      {
        header: t("Brokerage USD"),
        accessorKey: "brokeragedollar",
        className: "text-end",
        cell: ({ row }) => cellWithBg(fmtFixed(getRowVal(row.original, "brokeragedollar", "Brokeragedollar"), 2), LIGHT_BLUE_BG)
      },
      {
        header: t("Brokerage INR"),
        accessorKey: "brokerageRs",
        className: "text-end",
        cell: ({ row }) => cellWithBg(fmtFixed(getRowVal(row.original, "brokerageRs", "BrokerageRs"), 2), LIGHT_BLUE_BG)
      },
      {
        header: t("Tot Pur Cost USD"),
        accessorKey: "totPurCostdollar",
        className: "text-end",
        cell: ({ row }) => cellWithBg(fmtFixed(getRowVal(row.original, "totPurCostdollar", "TotPurCostdollar"), 2), YELLOW_BG)
      },
      {
        header: t("Final PL USD"),
        accessorKey: "finalPLdollar",
        className: "text-end",
        cell: ({ row }) => cellWithBg(fmtFixed(getRowVal(row.original, "finalPLdollar", "FinalPLdollar"), 2), YELLOW_BG)
      },
      {
        header: t("Final PL USD Per"),
        accessorKey: "finalPLdollarper",
        className: "text-end",
        cell: ({ row }) => cellWithBg(fmtFixed(getRowVal(row.original, "finalPLdollarper", "FinalPLdollarper"), 2), YELLOW_BG)
      },
      {
        header: t("Tot Pur Cost INR"),
        accessorKey: "totPurCostRs",
        className: "text-end",
        cell: ({ row }) => cellWithBg(fmtFixed(getRowVal(row.original, "totPurCostRs", "TotPurCostRs"), 2), CYAN_BG)
      },
      {
        header: t("Final PL INR"),
        accessorKey: "finalPLRs",
        className: "text-end",
        cell: ({ row }) => cellWithBg(fmtFixed(getRowVal(row.original, "finalPLRs", "FinalPLRs"), 2), CYAN_BG)
      },
      {
        header: t("Final PL INR Per"),
        accessorKey: "finalPLRsper",
        className: "text-end",
        cell: ({ row }) => cellWithBg(fmtFixed(getRowVal(row.original, "finalPLRsper", "FinalPLRsper"), 2), CYAN_BG)
      },
      {
        header: t("Interest USD"),
        accessorKey: "interestdollar",
        className: "text-end",
        cell: ({ row }) => cellWithBg(fmtFixed(getRowVal(row.original, "interestdollar", "Interestdollar"), 2), BRIGHT_YELLOW_BG),
        footer: ({ table }) => {
          const { totalInterestdollar } = getSalePerformanceTableTotals(table);
          return (
            <span className="fw-bold text-end d-block">{fmtFixed(totalInterestdollar, 2)}</span>
          );
        }
      },
      {
        header: t("Tot Pur Cost USD With Int"),
        accessorKey: "totPurCostdollarWithInt",
        className: "text-end",
        cell: ({ row }) => cellWithBg(fmtFixed(getRowVal(row.original, "totPurCostdollarWithInt", "TotPurCostdollarWithInt"), 2), BRIGHT_YELLOW_BG)
      },
      {
        header: t("Final PL USD After Int"),
        accessorKey: "finalPLdollarAfterInt",
        className: "text-end",
        cell: ({ row }) => cellWithBg(fmtFixed(getRowVal(row.original, "finalPLdollarAfterInt", "FinalPLdollarAfterInt"), 2), BRIGHT_YELLOW_BG),
        footer: ({ table }) => {
          const { totalFinalPLdollarAfterInt } = getSalePerformanceTableTotals(table);
          return (
            <span className="fw-bold text-end d-block">
              {fmtFixed(totalFinalPLdollarAfterInt, 2)}
            </span>
          );
        }
      },
      {
        header: t("Interest INR"),
        accessorKey: "interestRs",
        className: "text-end",
        cell: ({ row }) => cellWithBg(fmtFixed(getRowVal(row.original, "interestRs", "InterestRs"), 2), BRIGHT_CYAN_BG),
        footer: ({ table }) => {
          const { totalInterestRs } = getSalePerformanceTableTotals(table);
          return <span className="fw-bold text-end d-block">{fmtFixed(totalInterestRs, 2)}</span>;
        }
      },
      {
        header: t("Tot Pur Cost INR With Int"),
        accessorKey: "totPurCostRsWithInt",
        className: "text-end",
        cell: ({ row }) => cellWithBg(fmtFixed(getRowVal(row.original, "totPurCostRsWithInt", "TotPurCostRsWithInt"), 2), BRIGHT_CYAN_BG)
      },
      {
        header: t("Final PL INR After Int"),
        accessorKey: "finalPLRsAfterInt",
        className: "text-end",
        cell: ({ row }) => cellWithBg(fmtFixed(getRowVal(row.original, "finalPLRsAfterInt", "FinalPLRsAfterInt"), 2), BRIGHT_CYAN_BG),
        footer: ({ table }) => {
          const { totalFinalPLRsAfterInt } = getSalePerformanceTableTotals(table);
          return (
            <span className="fw-bold text-end d-block">{fmtFixed(totalFinalPLRsAfterInt, 2)}</span>
          );
        }
      },
      {
        header: t("Itemcode"),
        accessorKey: "itemcode",
        cell: ({ row }) => dashText(getRowVal(row.original, "itemcode", "Itemcode"))
      },
      {
        header: t("Kapan No"),
        accessorKey: "kapanNo",
        cell: ({ row }) => dashText(getRowVal(row.original, "kapanNo", "KapanNo"))
      },
      {
        header: t("Size Id"),
        accessorKey: "sizeId",
        cell: ({ row }) => dashText(getRowVal(row.original, "sizeId", "SizeId"))
      }
    ],
    [t]
  );

  const excelHeaders = [
    "LotNo",
    "Status",
    "Cert",
    "Shape",
    "Color",
    "Clarity",
    "Prop",
    "Polish",
    "Sym",
    "PCarats",
    "ConsDate",
    "ProcessDays",
    "Pur.Date",
    "Pur.Price",
    "Pur.USD",
    "BaseRate",
    "Pur.INR",
    "Cert Exp USD",
    "Cert Exp INR",
    "Pur Cost USD",
    "Pur Cost INR",
    "Sale Due Date",
    "Sale Days",
    "Sale Price",
    "Sale USD",
    "BaseRate",
    "Sale INR",
    "PL USD",
    "PL USD Per",
    "PL INR",
    "PL INR Per",
    "Adat USD",
    "Adat INR",
    "Brokerage USD",
    "Brokerage INR",
    "Tot Pur Cost USD",
    "Final PL USD",
    "Final PL USD Per",
    "Tot Pur Cost INR",
    "Final PL INR",
    "Final PL INR Per",
    "Interest USD",
    "Tot Pur Cost USD With Int",
    "Final PL USD After Int",
    "Interest INR",
    "Tot Pur Cost INR With Int",
    "Final PL INR After Int",
    "Itemcode",
    "Kapan No",
    "Size Id"
  ];

  const handleExcel = async () => {
    if (!reportRows || reportRows.length === 0) {
      toast.warning(t("No data available to export."));
      return;
    }

    const rows = reportRows.map((r) => [
      dashText(getRowVal(r, "LotNo", "lotNo")),
      dashText(getRowVal(r, "Status", "status")),
      dashText(getRowVal(r, "CertId", "certId")),
      dashText(getRowVal(r, "ShapeId", "shapeId")),
      dashText(getRowVal(r, "ColorId", "colorId")),
      dashText(getRowVal(r, "ClarityId", "clarityId")),
      dashText(getRowVal(r, "PropId", "propId")),
      dashText(getRowVal(r, "PolishId", "polishId")),
      dashText(getRowVal(r, "SymId", "symId")),
      fmtFixed(getRowVal(r, "PCarats", "pCarats"), 2),
      dashText(getRowVal(r, "ConsDate", "consDate")),
      dashText(getRowVal(r, "ProcessDays", "processDays")),
      dashText(getRowVal(r, "PDate", "pDate")),
      fmtFixed(getRowVal(r, "PurPrice", "purPrice"), 2),
      fmtFixed(getRowVal(r, "PurDollar", "purDollar"), 2),
      fmtFixed(getRowVal(r, "PurBaseRate", "purBaseRate"), 2),
      fmtFixed(getRowVal(r, "PurRs", "purRs"), 2),
      fmtFixed(getRowVal(r, "CertExpdollar", "certExpdollar"), 2),
      fmtFixed(getRowVal(r, "CertExpRs", "certExpRs"), 2),
      fmtFixed(getRowVal(r, "PurCostdollar", "purCostdollar"), 2),
      fmtFixed(getRowVal(r, "PurCostRs", "purCostRs"), 2),
      dashText(getRowVal(r, "SDueDate", "sDueDate")),
      dashText(getRowVal(r, "SaleDays", "saleDays")),
      fmtFixed(getRowVal(r, "SalePrice", "salePrice"), 2),
      fmtFixed(getRowVal(r, "Saledollar", "saledollar"), 2),
      fmtFixed(getRowVal(r, "BaseRate", "baseRate"), 2),
      fmtFixed(getRowVal(r, "SaleRs", "saleRs"), 2),
      fmtFixed(getRowVal(r, "PLdollar", "pLdollar"), 2),
      fmtFixed(getRowVal(r, "PLdollarper", "pLdollarper"), 2),
      fmtFixed(getRowVal(r, "PLRs", "pLRs"), 2),
      fmtFixed(getRowVal(r, "PLRsper", "pLRsper"), 2),
      fmtFixed(getRowVal(r, "Adatdollar", "adatdollar"), 2),
      fmtFixed(getRowVal(r, "AdatRs", "adatRs"), 2),
      fmtFixed(getRowVal(r, "Brokeragedollar", "brokeragedollar"), 2),
      fmtFixed(getRowVal(r, "BrokerageRs", "brokerageRs"), 2),
      fmtFixed(getRowVal(r, "TotPurCostdollar", "totPurCostdollar"), 2),
      fmtFixed(getRowVal(r, "FinalPLdollar", "finalPLdollar"), 2),
      fmtFixed(getRowVal(r, "FinalPLdollarper", "finalPLdollarper"), 2),
      fmtFixed(getRowVal(r, "TotPurCostRs", "totPurCostRs"), 2),
      fmtFixed(getRowVal(r, "FinalPLRs", "finalPLRs"), 2),
      fmtFixed(getRowVal(r, "FinalPLRsper", "finalPLRsper"), 2),
      fmtFixed(getRowVal(r, "Interestdollar", "interestdollar"), 2),
      fmtFixed(getRowVal(r, "TotPurCostdollarWithInt", "totPurCostdollarWithInt"), 2),
      fmtFixed(getRowVal(r, "FinalPLdollarAfterInt", "finalPLdollarAfterInt"), 2),
      fmtFixed(getRowVal(r, "InterestRs", "interestRs"), 2),
      fmtFixed(getRowVal(r, "TotPurCostRsWithInt", "totPurCostRsWithInt"), 2),
      fmtFixed(getRowVal(r, "FinalPLRsAfterInt", "finalPLRsAfterInt"), 2),
      dashText(getRowVal(r, "Itemcode", "itemcode")),
      dashText(getRowVal(r, "KapanNo", "kapanNo")),
      dashText(getRowVal(r, "SizeId", "sizeId"))
    ]);

    const res = await exportToExcel(excelHeaders, rows, "SalePerformanceReport", "SalePerformanceReport");
    if (!res?.success) toast.error(t("Excel export failed."));
  };

  document.title = `${t("Sale Performance Report")} | ${t("Reports")}`;

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
    { label: "ProductType", key: "productType" },
    { label: "Sieve", key: "sieve" }
  ];

  return (
    <React.Fragment>
      <ToastContainer />
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title={t("Sale Performance Report")} pageTitle={t("Reports")} />

          <div className="card stock-search-header-bar d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between mb-3 p-3 rounded-3 shadow-sm border gap-2">
            <h5 className="mb-0 fw-bold text-primary d-flex align-items-center gap-2">
              <i
                className={
                  hasSearched
                    ? "ri-database-2-line fs-20 text-primary"
                    : "ri-search-eye-line fs-20 text-primary"
                }
              ></i>
              {hasSearched
                ? `${t("Sale Performance Report")} ${t("Results")}`
                : `${t("Sale Performance Report")} ${t("Filters")}`}
            </h5>
            <div className="d-flex gap-2">
              {!hasSearched ? (
                <>
                  <Button
                    color="primary"
                    className="btn-sm rounded-2 px-3 py-1"
                    onClick={handleReport}
                    disabled={loading}
                  >
                    {loading ? t("Loading...") : t("Report")}
                  </Button>
                  <Button
                    color="soft-secondary"
                    className="btn-sm rounded-2 px-3 py-1"
                    onClick={handleClear}
                    disabled={loading}
                  >
                    {t("Clear")}
                  </Button>
                </>
              ) : (
                <>
                  <UncontrolledDropdown>
                    <DropdownToggle
                      color="success"
                      className="btn-sm rounded-2 px-3 py-1 animate-btn"
                      caret
                      disabled={reportRows.length === 0}
                    >
                      {t("Excel")} / {t("Print")}
                    </DropdownToggle>
                    <DropdownMenu>
                      <DropdownItem onClick={handleExcel}>{t("Direct Print")}</DropdownItem>
                      <DropdownItem onClick={handleExcel}>{t("SalePerformance Print")}</DropdownItem>
                    </DropdownMenu>
                  </UncontrolledDropdown>
                  <Button
                    color="primary"
                    className="btn-sm rounded-2 px-3 py-1"
                    onClick={handleNewSearch}
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
                          <input
                            type="date"
                            className="form-control form-control-sm"
                            style={{ height: "35px" }}
                            value={filters.fromDate}
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
                            value={
                              getOptions("currency").find((o) => o.value === filters.currency) ||
                              null
                            }
                            onChange={(sel) =>
                              setFilters((p) => ({ ...p, currency: sel?.value || "" }))
                            }
                            placeholder={t("Select Currency")}
                            isLoading={loadingDropdowns}
                          />
                        </FormGroup>
                      </Col>
                      <Col sm={2}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1 small">{t("Show")}</Label>
                          <Select
                            classNamePrefix="react-select"
                            styles={customStyles}
                            options={showOptions}
                            value={showOptions.find((o) => o.value === filters.show) || showOptions[0]}
                            onChange={(sel) =>
                              setFilters((p) => ({ ...p, show: sel?.value || "All" }))
                            }
                          />
                        </FormGroup>
                      </Col>
                      <Col sm={2}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1 small">{t("Hold/UnHold")}</Label>
                          <Select
                            classNamePrefix="react-select"
                            styles={customStyles}
                            options={holdUnHoldOptions}
                            value={
                              holdUnHoldOptions.find((o) => o.value === filters.holdUnHold) ||
                              holdUnHoldOptions[0]
                            }
                            onChange={(sel) =>
                              setFilters((p) => ({ ...p, holdUnHold: sel?.value || "All" }))
                            }
                          />
                        </FormGroup>
                      </Col>
                      <Col sm={2}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1 small">{t("Single/Parcel")}</Label>
                          <Select
                            classNamePrefix="react-select"
                            styles={customStyles}
                            options={stoneTypesOptions}
                            value={
                              stoneTypesOptions.find((o) => o.value === filters.stoneTypes) ||
                              stoneTypesOptions[2]
                            }
                            onChange={(sel) =>
                              setFilters((p) => ({ ...p, stoneTypes: sel?.value || "All" }))
                            }
                          />
                        </FormGroup>
                      </Col>
                    </Row>
                    <Row className="g-2">
                      <Col sm={4}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1 small">{t("Status")}</Label>
                          <Input
                            type="select"
                            className="form-control form-control-sm"
                            style={{ height: "35px" }}
                            value={filters.status}
                            onChange={(e) =>
                              setFilters((p) => ({ ...p, status: e.target.value }))
                            }
                          >
                            {statusOptions.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </Input>
                        </FormGroup>
                      </Col>
                      <Col sm={4}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1 small">{t("Stock At Value")}</Label>
                          <Select
                            classNamePrefix="react-select"
                            styles={customStyles}
                            options={stockPricesOptions}
                            value={
                              stockPricesOptions.find((o) => o.value === filters.stockPrices) ||
                              stockPricesOptions[0]
                            }
                            onChange={(sel) =>
                              setFilters((p) => ({
                                ...p,
                                stockPrices: sel?.value || "Purchase Price"
                              }))
                            }
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
                        value={filters.lotNo}
                        onChange={(e) => setFilters((p) => ({ ...p, lotNo: e.target.value }))}
                        placeholder={t("Search by lot no")}
                        className="form-control-sm"
                        style={{ height: "115px", resize: "none" }}
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
                          value={getOptions(key).filter((o) => filters[key].includes(o.value))}
                          onChange={(sel) => handleMultiChange(key, sel)}
                          isLoading={loadingDropdowns}
                          placeholder={t(label)}
                        />
                      </FormGroup>
                    </Col>
                  ))}
                  <Col sm={2}>
                    <FormGroup className="mb-0">
                      <Label className="fw-medium mb-1 small">{t("Exp Party")}</Label>
                      <Select
                        classNamePrefix="react-select"
                        styles={customStyles}
                        isClearable
                        options={getOptions("account")}
                        value={
                          getOptions("account").find((o) => o.value === filters.expParty) || null
                        }
                        onChange={(sel) =>
                          setFilters((p) => ({ ...p, expParty: sel?.value || "" }))
                        }
                        placeholder={t("Exp Party")}
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
                    {t("Showing")}: {reportRows.length} {t("rows")}
                  </span>
                </div>
                {reportRows.length === 0 ? (
                  <div className="text-center py-4 text-muted">{t("No data available.")}</div>
                ) : (
                  <TableContainer
                    columns={columns}
                    data={reportRows}
                    isGlobalFilter={true}
                    customPageSize={500}
                    customPageSizes={[500, 1000, 1500]}
                    divClass="table-responsive table-card mb-3"
                    tableClass="align-middle table-nowrap mb-0 table-hover table-striped"
                    theadClass="table-light"
                    SearchPlaceholder={t("SEARCH:")}
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

export default SolitaireSalePerformanceReport;
