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
  Spinner,
  Table
} from "reactstrap";
import Select from "react-select";

import { toast, ToastContainer } from "react-toastify";

import BreadCrumb from "../../../Components/Common/BreadCrumb";
import TableContainer from "../../../Components/Common/TableContainer";
import { exportToExcel } from "../../../helpers/excel_helper";
import {
  getSolitaireGradingComparisonDropdowns,
  getSolitaireGradingComparisonReport,
  makeSolitaireLabWeightDiffEntry
} from "../../../helpers/fakebackend_helper";
import { useSettingReportDates } from "../../../Components/Hooks/useSettingReportDates";

const fmtNum = (value, decimals = 2) => {
  if (value === null || value === undefined || value === "") return "-";
  const num = Number(value);
  if (Number.isNaN(num)) return "-";
  return num.toFixed(decimals);
};

const getRowVal = (row, ...keys) => {
  for (const key of keys) {
    if (row?.[key] !== undefined && row?.[key] !== null && row?.[key] !== "") {
      return row[key];
    }
  }
  return "";
};

const toNum = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

/**
 * Lab/GIA rows from GetGradingComparision often return rate/amount/back as 0.
 * Collect pricing from the stock/"Selected" row for each LotNo so paired lab rows can display it.
 */
const buildLotFinancialMap = (rows) => {
  const map = {};
  (rows || []).forEach((row) => {
    const lot = String(getRowVal(row, "lotNo", "LotNo") || "").trim();
    if (!lot) return;
    if (!map[lot]) {
      map[lot] = { rate: 0, amount: 0, back: 0, msp: 0, hasBack: false };
    }

    const rate = toNum(getRowVal(row, "rate", "Rate"));
    const amount = toNum(getRowVal(row, "amount", "Amount"));
    const rawBack = getRowVal(row, "back", "Back");
    const back = toNum(rawBack);
    const msp = toNum(getRowVal(row, "msp", "MSP", "mrp", "MRP"));
    const carats = toNum(getRowVal(row, "carats", "Carats"));

    if (rate !== 0) map[lot].rate = rate;
    if (amount !== 0) map[lot].amount = amount;
    if (msp !== 0) map[lot].msp = msp;
    if (rawBack !== "" && back !== 0) {
      map[lot].back = back;
      map[lot].hasBack = true;
    }

    // If this stock row has amount but rate is 0, derive from its own carats
    if (map[lot].rate === 0 && amount !== 0 && carats > 0) {
      map[lot].rate = amount / carats;
    }
  });

  Object.values(map).forEach((fin) => {
    if (!fin.hasBack && fin.msp > 0 && fin.rate !== 0) {
      fin.back = (fin.rate / fin.msp) * 100 - 100;
      fin.hasBack = true;
    }
  });

  return map;
};

const getLotFinance = (row, lotFinMap) => {
  const lot = String(getRowVal(row, "lotNo", "LotNo") || "").trim();
  return (lot && lotFinMap?.[lot]) || null;
};

/**
 * Rate = MRP × (1 + Back/100) when Back + MRP exist; else row/lot rate; else Amount/Carats.
 * Matches stock entry: MRP 43000, Back -30 → Rate 30100.
 */
const getDisplayRate = (row, lotFinMap) => {
  const fin = getLotFinance(row, lotFinMap);
  const msp = toNum(getRowVal(row, "msp", "MSP", "mrp", "MRP")) || fin?.msp || 0;
  const rawBack = getRowVal(row, "back", "Back");
  const back = rawBack !== "" && toNum(rawBack) !== 0
    ? toNum(rawBack)
    : (fin?.hasBack ? fin.back : 0);

  if (msp > 0 && (rawBack !== "" || fin?.hasBack)) {
    return msp * (1 + back / 100);
  }

  const rawRate = getRowVal(row, "rate", "Rate");
  const rate = toNum(rawRate);
  if (rawRate !== "" && rate !== 0) return rate;
  if (fin?.rate) return fin.rate;

  const carats = toNum(getRowVal(row, "carats", "Carats"));
  const amount = toNum(getRowVal(row, "amount", "Amount")) || fin?.amount || 0;
  if (carats > 0 && amount !== 0) return amount / carats;
  return rate;
};

/**
 * Amount = Rate × this row's Carats (Selected uses 10.5, GIA uses 10.000).
 * Do not copy Selected amount onto lab rows — that caused 316050 on 10.000 cts.
 */
const getDisplayAmount = (row, lotFinMap) => {
  const rate = getDisplayRate(row, lotFinMap);
  const carats = toNum(getRowVal(row, "carats", "Carats"));
  if (rate !== 0 && carats > 0) return rate * carats;

  const rawAmount = getRowVal(row, "amount", "Amount");
  const amount = toNum(rawAmount);
  if (rawAmount !== "" && amount !== 0) return amount;

  const fin = getLotFinance(row, lotFinMap);
  if (fin?.amount) return fin.amount;
  return amount;
};

/**
 * Prefer row Back; else lot stock Back; else derive from Rate vs MRP:
 * Back = (Rate / MRP) × 100 - 100.
 */
const getDisplayBack = (row, lotFinMap) => {
  const rawBack = getRowVal(row, "back", "Back");
  const back = toNum(rawBack);
  if (rawBack !== "" && back !== 0) return back;

  const fin = getLotFinance(row, lotFinMap);
  if (fin?.hasBack && fin.back !== 0) return fin.back;

  const msp = toNum(getRowVal(row, "msp", "MSP", "mrp", "MRP")) || fin?.msp || 0;
  const rawRate = getRowVal(row, "rate", "Rate");
  const rate = (rawRate !== "" && toNum(rawRate) !== 0)
    ? toNum(rawRate)
    : (fin?.rate || 0);
  if (msp > 0 && rate !== 0) return (rate / msp) * 100 - 100;
  return back;
};

const dash = (val) => (val === "" || val === null || val === undefined) ? "-" : val;

const compareBg = (flag) => {
  if (flag === "Red") return { bg: "#dc3545", color: "#fff" };
  if (flag === "Green") return { bg: "#198754", color: "#fff" };
  return null;
};

const formatGDate = (value) => {
  if (!value) return "";
  return String(value).split(" ")[0];
};

const formatLocalDate = (date) => {
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};




const CompareCell = ({ value, colorFlag, boldFlag, decimals, align = "center" }) => {
  const colorInfo = compareBg(colorFlag);
  const rawDisplay = decimals !== undefined ? fmtNum(value, decimals) : (value === "" || value === null || value === undefined ? "-" : value);
  const isEmpty = rawDisplay === "-";

  const style = {
    ...(colorInfo && !isEmpty
      ? {
          backgroundColor: colorInfo.bg,
          color: colorInfo.color,
          padding: "1px 5px",
          borderRadius: "4px",
          display: "inline-block"
        }
      : {}),
    ...(isEmpty ? { color: "var(--vz-text-muted, #878a99)", fontSize: "0.85em" } : {}),
    fontWeight: boldFlag && !isEmpty ? "bold" : "normal",
    textAlign: align
  };

  return <span style={style}>{rawDisplay}</span>;
};

const getGradingCompTableTotals = (table) => {
  const rows = table.getFilteredRowModel().rows.map((r) => r.original);
  let totalCarats = 0;
  let totalAmount = 0;

  rows.forEach((r) => {
    totalCarats += Number(getRowVal(r, "carats", "Carats") || 0);
    totalAmount += Number(getRowVal(r, "amount", "Amount") || 0);
  });

  const avgRate = totalCarats > 0 ? totalAmount / totalCarats : 0;
  return { totalCarats, totalAmount, avgRate };
};

const SolitaireGradingComparisonReport = () => {
  const { t } = useTranslation();

  const { fromDate, toDate, getDates, mergeDates } = useSettingReportDates();

  const [dropdownData, setDropdownData] = useState({});
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [reportRows, setReportRows] = useState([]);
  const [labWeightRows, setLabWeightRows] = useState([]);
  const [selectedLabLots, setSelectedLabLots] = useState({});
  const [showLabWeightDiff, setShowLabWeightDiff] = useState(false);
  const [useLabWeightDate, setUseLabWeightDate] = useState(false);
  const [labWeightDate, setLabWeightDate] = useState(formatLocalDate(new Date()));
  const [makingEntry, setMakingEntry] = useState(false);

  const [filters, setFilters] = useState({
    fromDate,
    toDate,
    shape: [],
    color: [],
    clarity: [],
    size: [],
    proportion: [],
    polish: [],
    symmetry: [],
    lab: [],
    fluorescence: [],
    lotNo: "",
    labWeightDifference: false
  });

  const customStyles = useMemo(() => ({
    control: (provided) => ({
      ...provided,
      backgroundColor: "var(--vz-secondary-bg, #fff)",
      borderColor: "var(--vz-border-color, #ced4da)",
      color: "var(--vz-body-color, #495057)",
      minHeight: "31px",
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: "var(--vz-secondary-bg, #fff)",
      color: "var(--vz-body-color, #495057)",
      border: "1px solid var(--vz-border-color, #dee2e6)",
      zIndex: 20,
    }),
    menuList: (provided) => ({
      ...provided,
      backgroundColor: "var(--vz-secondary-bg, #fff)",
      color: "var(--vz-body-color, #495057)",
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isFocused ? "#3b5de7" : "transparent",
      color: state.isFocused ? "#ffffff" : "var(--vz-body-color, #495057)",
      cursor: "pointer",
      ":active": {
        backgroundColor: "#3b5de7",
      },
    }),
    input: (provided) => ({
      ...provided,
      color: "var(--vz-body-color, #495057)",
    }),
    placeholder: (provided) => ({
      ...provided,
      color: "var(--vz-secondary-color, #878a99)",
    }),
    singleValue: (provided) => ({
      ...provided,
      color: "var(--vz-body-color, #495057)",
    }),
    multiValue: (provided) => ({
      ...provided,
      backgroundColor: "transparent",
    }),
    indicatorsContainer: (provided) => ({
      ...provided,
      color: "var(--vz-body-color, #495057)",
    }),
    clearIndicator: (provided) => ({
      ...provided,
      color: "var(--vz-secondary-color, #878a99)",
      ":hover": {
        color: "var(--vz-body-color, #495057)",
      },
    }),
    dropdownIndicator: (provided) => ({
      ...provided,
      color: "var(--vz-secondary-color, #878a99)",
      ":hover": {
        color: "var(--vz-body-color, #495057)",
      },
    }),
  }), []);


  useEffect(() => {
    const loadDropdowns = async () => {
      setLoadingDropdowns(true);
      try {
        const res = await getSolitaireGradingComparisonDropdowns();
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

  const getOptions = useCallback(
    (key) => {
      const list = dropdownData?.[key] || [];
      return list.map((item) => ({
        value: item.id || item.ID || item.name || item.Name,
        label: String(item.name || item.Name || item.id || item.ID || "").toUpperCase()
      }));
    },
    [dropdownData]
  );

  const handleMultiChange = (name, selected) => {
    setFilters((prev) => ({
      ...prev,
      [name]: selected ? selected.map((x) => x.value) : []
    }));
  };

  const resetLabWeightSelection = (rows) => {
    const next = {};
    (rows || []).forEach((row, idx) => {
      const key = String(getRowVal(row, "lotNo", "LotNo") || idx);
      next[key] = true;
    });
    setSelectedLabLots(next);
  };

  const handleClear = async () => {
    const d = await getDates();
    setHasSearched(false);
    setShowLabWeightDiff(false);
    setReportRows([]);
    setLabWeightRows([]);
    setSelectedLabLots({});
    setUseLabWeightDate(false);
    setLabWeightDate(formatLocalDate(new Date()));
    setFilters(mergeDates({
      shape: [],
      color: [],
      clarity: [],
      size: [],
      proportion: [],
      polish: [],
      symmetry: [],
      lab: [],
      fluorescence: [],
      lotNo: "",
      labWeightDifference: false
    }, d));
  };

  const handleReport = async () => {
    setLoading(true);
    try {
      const payload = {
        FromDate: filters.fromDate,
        ToDate: filters.toDate,
        Shape: filters.shape,
        Color: filters.color,
        Clarity: filters.clarity,
        Size: filters.size,
        Proportion: filters.proportion,
        Polish: filters.polish,
        Symmetry: filters.symmetry,
        LAB: filters.lab,
        Fluorescence: filters.fluorescence,
        LotNo: filters.lotNo,
        LabWeightDifference: !!filters.labWeightDifference
      };

      const response = await getSolitaireGradingComparisonReport(payload);
      const ok = response?.success || response?.Success;

      if (ok) {
        const data = response.Data || response.data || [];
        if (filters.labWeightDifference) {
          setLabWeightRows(Array.isArray(data) ? data : []);
          resetLabWeightSelection(Array.isArray(data) ? data : []);
          setShowLabWeightDiff(true);
          setHasSearched(false);
          setReportRows([]);
          toast.success(t("Report loaded successfully."));
        } else {
          setReportRows(data);
          setHasSearched(true);
          setShowLabWeightDiff(false);
          setLabWeightRows([]);
          setSelectedLabLots({});
          toast.success(t("Report loaded successfully."));
        }
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

  const handleNewSearch = () => {
    setHasSearched(false);
    setShowLabWeightDiff(false);
    setLabWeightRows([]);
    setSelectedLabLots({});
  };

  const allLabSelected = useMemo(() => {
    if (!labWeightRows.length) return false;
    return labWeightRows.every((row, idx) => {
      const key = String(getRowVal(row, "lotNo", "LotNo") || idx);
      return !!selectedLabLots[key];
    });
  }, [labWeightRows, selectedLabLots]);

  const handleSelectAllLab = (checked) => {
    const next = {};
    labWeightRows.forEach((row, idx) => {
      const key = String(getRowVal(row, "lotNo", "LotNo") || idx);
      next[key] = checked;
    });
    setSelectedLabLots(next);
  };

  const handleSelectLabRow = (key, checked) => {
    setSelectedLabLots((prev) => ({ ...prev, [key]: checked }));
  };

  const getDiffColor = (oldWeight, newWeight) => {
    const oldW = Number(oldWeight) || 0;
    const newW = Number(newWeight) || 0;
    if (oldW > newW) return "#dc3545";
    if (newW > oldW) return "#0d6efd";
    return "inherit";
  };

  const handleMakeLabWeightDiffEntry = async () => {
    if (makingEntry) return;

    const selectedRows = labWeightRows.filter((row, idx) => {
      const key = String(getRowVal(row, "lotNo", "LotNo") || idx);
      return !!selectedLabLots[key];
    });

    if (!selectedRows.length) {
      toast.warning(t("Please select at least one lot."));
      return;
    }

    setMakingEntry(true);
    try {
      const payload = {
        UseLabWeightDate: !!useLabWeightDate,
        LabWeightDate: useLabWeightDate ? labWeightDate : null,
        Rows: selectedRows.map((row) => ({
          LotNo: getRowVal(row, "lotNo", "LotNo"),
          OldWeight: Number(getRowVal(row, "oldWeight", "OldWeight") || 0),
          NewWeight: Number(getRowVal(row, "newWeight", "NewWeight") || 0)
        }))
      };

      const response = await makeSolitaireLabWeightDiffEntry(payload);
      const ok = response?.success || response?.Success;
      if (ok) {
        toast.success(response?.Message || response?.message || t("LabWeightDiff Done!!!"));
      } else {
        toast.error(response?.Message || response?.message || t("Failed to make Lab Weight Diff entry."));
      }
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.Message ||
        err?.response?.data?.message ||
        err?.message ||
        t("Server Connection Problem..");
      toast.error(msg);
    } finally {
      setMakingEntry(false);
    }
  };

  const lotFinancialMap = useMemo(() => buildLotFinancialMap(reportRows), [reportRows]);

  const footerTotals = useMemo(() => {
    let caratTotal = 0;
    let amtTotal = 0;

    // Keep original API amounts for totals so GIA display fill does not double-count.
    reportRows.forEach((row) => {
      caratTotal += Number(getRowVal(row, "carats", "Carats") || 0);
      amtTotal += Number(getRowVal(row, "amount", "Amount") || 0);
    });

    const rate = caratTotal > 0 ? amtTotal / caratTotal : 0;
    return { caratTotal, amtTotal, rate };
  }, [reportRows]);

  const columns = useMemo(
    () => [
      {
        header: t("LotNo"),
        accessorKey: "lotNo",
        cell: ({ row }) => dash(getRowVal(row.original, "lotNo", "LotNo")),
        footer: () => <span className="fw-bold text-start d-block">{t("Total")}:</span>
      },
      {
        header: t("Kapan"),
        accessorKey: "kapan",
        cell: ({ row }) => dash(getRowVal(row.original, "kapan", "Kapan"))
      },
      {
        header: t("PacketNo"),
        accessorKey: "packetNo",
        cell: ({ row }) => dash(getRowVal(row.original, "packetNo", "PacketNo"))
      },
      {
        header: t("ReportDate"),
        accessorKey: "gDate",
        cell: ({ row }) => dash(formatGDate(getRowVal(row.original, "gDate", "GDate", "reportDate", "ReportDate")))
      },
      {
        header: t("Grader"),
        accessorKey: "grader",
        cell: ({ row }) => dash(getRowVal(row.original, "grader", "Grader"))
      },
      {
        header: t("Carats"),
        accessorKey: "carats",
        cell: ({ row }) => (
          <CompareCell
            value={getRowVal(row.original, "carats", "Carats")}
            colorFlag={getRowVal(row.original, "colorCarats", "ColorCarats")}
            decimals={3}
            align="right"
          />
        ),
        footer: ({ table }) => (
          <CompareCell
            value={getGradingCompTableTotals(table).totalCarats}
            decimals={3}
            align="right"
            boldFlag={true}
          />
        )
      },
      {
        header: t("Rate"),
        accessorKey: "rate",
        cell: ({ row }) => (
          <CompareCell value={getDisplayRate(row.original, lotFinancialMap)} decimals={2} align="right" />
        ),
        footer: ({ table }) => (
          <CompareCell
            value={getGradingCompTableTotals(table).avgRate}
            decimals={2}
            align="right"
            boldFlag={true}
          />
        )
      },
      {
        header: t("Amount"),
        accessorKey: "amount",
        cell: ({ row }) => (
          <CompareCell value={getDisplayAmount(row.original, lotFinancialMap)} decimals={2} align="right" />
        ),
        footer: ({ table }) => (
          <CompareCell
            value={getGradingCompTableTotals(table).totalAmount}
            decimals={2}
            align="right"
            boldFlag={true}
          />
        )
      },
      {
        header: t("MRP"),
        accessorKey: "msp",
        cell: ({ row }) => <CompareCell value={getRowVal(row.original, "msp", "MSP", "mrp", "MRP")} decimals={2} align="right" />
      },
      {
        header: t("Back"),
        accessorKey: "back",
        cell: ({ row }) => (
          <CompareCell value={getDisplayBack(row.original, lotFinancialMap)} decimals={2} align="right" />
        )
      },
      {
        header: t("Shape"),
        accessorKey: "shape",
        cell: ({ row }) => dash(getRowVal(row.original, "shape", "Shape"))
      },
      {
        header: t("Color"),
        accessorKey: "color",
        cell: ({ row }) => (
          <CompareCell
            value={getRowVal(row.original, "color", "Color")}
            colorFlag={getRowVal(row.original, "colorColor", "ColorColor")}
          />
        )
      },
      {
        header: t("Clarity"),
        accessorKey: "clarity",
        cell: ({ row }) => (
          <CompareCell
            value={getRowVal(row.original, "clarity", "Clarity")}
            colorFlag={getRowVal(row.original, "clarityColor", "ClarityColor")}
          />
        )
      },
      {
        header: t("Proportion"),
        accessorKey: "proportion",
        cell: ({ row }) => (
          <CompareCell
            value={getRowVal(row.original, "proportion", "Proportion")}
            colorFlag={getRowVal(row.original, "propColor", "PropColor")}
          />
        )
      },
      {
        header: t("Polish"),
        accessorKey: "polish",
        cell: ({ row }) => (
          <CompareCell
            value={getRowVal(row.original, "polish", "Polish")}
            colorFlag={getRowVal(row.original, "polishColor", "PolishColor")}
          />
        )
      },
      {
        header: t("Sym"),
        accessorKey: "symm",
        cell: ({ row }) => (
          <CompareCell
            value={getRowVal(row.original, "symm", "Symm")}
            colorFlag={getRowVal(row.original, "symColor", "SymColor")}
          />
        )
      },
      {
        header: t("Fl"),
        accessorKey: "flCode",
        cell: ({ row }) => (
          <CompareCell
            value={getRowVal(row.original, "flCode", "FLCode")}
            colorFlag={getRowVal(row.original, "flCodeColor", "FLCodeColor")}
          />
        )
      },
      { header: t("HA"), accessorKey: "haCode", cell: ({ row }) => dash(getRowVal(row.original, "haCode", "HACode")) },
      { header: t("Diameter"), accessorKey: "diameter", cell: ({ row }) => dash(getRowVal(row.original, "diameter", "Diameter")) },
      {
        header: t("Depth"),
        accessorKey: "depth",
        cell: ({ row }) => (
          <CompareCell
            value={getRowVal(row.original, "depth", "Depth")}
            boldFlag={!!getRowVal(row.original, "depthColor", "DepthColor")}
            decimals={2}
            align="right"
          />
        )
      },
      {
        header: t("Table"),
        accessorKey: "table",
        cell: ({ row }) => (
          <CompareCell
            value={getRowVal(row.original, "table", "Table")}
            boldFlag={!!getRowVal(row.original, "tableColor", "TableColor")}
            decimals={2}
            align="right"
          />
        )
      },
      {
        header: t("CH"),
        accessorKey: "ch",
        cell: ({ row }) => (
          <CompareCell
            value={getRowVal(row.original, "ch", "CH")}
            boldFlag={!!getRowVal(row.original, "chColor", "CHColor")}
            decimals={2}
            align="right"
          />
        )
      },
      {
        header: t("CA"),
        accessorKey: "ca",
        cell: ({ row }) => (
          <CompareCell
            value={getRowVal(row.original, "ca", "CA")}
            boldFlag={!!getRowVal(row.original, "caColor", "CAColor")}
            decimals={2}
            align="right"
          />
        )
      },
      { header: t("GirdleMin"), accessorKey: "gerdleMin", cell: ({ row }) => dash(getRowVal(row.original, "gerdleMin", "GerdleMin")) },
      {
        header: t("Girdle"),
        accessorKey: "girdle",
        cell: ({ row }) => <CompareCell value={getRowVal(row.original, "girdle", "Girdle")} decimals={2} align="right" />
      },
      {
        header: t("PA"),
        accessorKey: "pa",
        cell: ({ row }) => (
          <CompareCell
            value={getRowVal(row.original, "pa", "PA")}
            boldFlag={!!getRowVal(row.original, "paColor", "PAColor")}
            decimals={2}
            align="right"
          />
        )
      },
      {
        header: t("PH"),
        accessorKey: "ph",
        cell: ({ row }) => (
          <CompareCell
            value={getRowVal(row.original, "ph", "PH")}
            boldFlag={!!getRowVal(row.original, "phColor", "PHColor")}
            decimals={2}
            align="right"
          />
        )
      },
      { header: t("Culet"), accessorKey: "culet", cell: ({ row }) => dash(getRowVal(row.original, "culet", "Culet")) },
      { header: t("MilkyCode"), accessorKey: "milkyCode", cell: ({ row }) => dash(getRowVal(row.original, "milkyCode", "MilkyCode")) },
      { header: t("Brown"), accessorKey: "brown", cell: ({ row }) => dash(getRowVal(row.original, "brown", "Brown")) },
      { header: t("LusterCode"), accessorKey: "lusterCode", cell: ({ row }) => dash(getRowVal(row.original, "lusterCode", "LusterCode")) },
      { header: t("Natts"), accessorKey: "natts", cell: ({ row }) => dash(getRowVal(row.original, "natts", "Natts")) },
      { header: t("TableInclusion"), accessorKey: "tableInclusion", cell: ({ row }) => dash(getRowVal(row.original, "tableInclusion", "TableInclusion")) },
      { header: t("CrownInclusion"), accessorKey: "crownInclusion", cell: ({ row }) => dash(getRowVal(row.original, "crownInclusion", "CrownInclusion")) },
      { header: t("IP"), accessorKey: "ip", cell: ({ row }) => dash(getRowVal(row.original, "ip", "IP")) },
      { header: t("CertificateNo"), accessorKey: "certificateNo", cell: ({ row }) => dash(getRowVal(row.original, "certificateNo", "CertificateNo")) },
      { header: t("KeyToSymbols"), accessorKey: "keyToSymbols", cell: ({ row }) => dash(getRowVal(row.original, "keyToSymbols", "KeyToSymbols")) },
      { header: t("ReportComments"), accessorKey: "reportComments", cell: ({ row }) => dash(getRowVal(row.original, "reportComments", "ReportComments")) },
      { header: t("LaserInscriptionText"), accessorKey: "laserInscriptionText", cell: ({ row }) => dash(getRowVal(row.original, "laserInscriptionText", "LaserInscriptionText")) },
      { header: t("ControlNo"), accessorKey: "controlNo", cell: ({ row }) => dash(getRowVal(row.original, "controlNo", "ControlNo")) },
      { header: t("SuratRemarks"), accessorKey: "suratRemarks", cell: ({ row }) => dash(getRowVal(row.original, "suratRemarks", "SuratRemarks")) },
      { header: t("IGICut"), accessorKey: "igiCut", cell: ({ row }) => dash(getRowVal(row.original, "igiCut", "IGICut")) },
      { header: t("Buth"), accessorKey: "buth", cell: ({ row }) => dash(getRowVal(row.original, "buth", "Buth")) },
      { header: t("ClarityStatus"), accessorKey: "clarityStatus", cell: ({ row }) => dash(getRowVal(row.original, "clarityStatus", "ClarityStatus")) },
      { header: t("HRDcut"), accessorKey: "hRDcut", cell: ({ row }) => dash(getRowVal(row.original, "hRDcut", "HRDcut")) },
      {
        header: t("Fees"),
        accessorKey: "fees",
        cell: ({ row }) => <CompareCell value={getRowVal(row.original, "fees", "Fees")} decimals={2} align="right" />
      }
    ],
    [t, lotFinancialMap]
  );

  const handleExcel = async () => {
    if (!reportRows.length) {
      toast.warning(t("No data available to export."));
      return;
    }

    const headers = columns.map((c) => c.header);
    const rows = reportRows.map((row) =>
      columns.map((col) => {
        const key = col.accessorKey;
        const pascal = key.charAt(0).toUpperCase() + key.slice(1);
        if (key === "gDate") return formatGDate(getRowVal(row, "gDate", "GDate"));
        if (key === "rate") return getDisplayRate(row, lotFinancialMap);
        if (key === "amount") return getDisplayAmount(row, lotFinancialMap);
        if (key === "back") return getDisplayBack(row, lotFinancialMap);
        return getRowVal(row, key, pascal);
      })
    );

    await exportToExcel(headers, rows, "Grading_Comparison", "Grading-Comparison");
  };

  const renderSelect = (label, name, placeholder) => (
    <Col lg={2} md={4} sm={6}>
      <FormGroup className="mb-0">
        <Label className="fw-medium mb-1">{t(label)}</Label>
        <Select
          isMulti
          options={getOptions(name)}
          value={getOptions(name).filter((o) => filters[name].includes(o.value))}
          onChange={(sel) => handleMultiChange(name, sel)}
          isLoading={loadingDropdowns}
          classNamePrefix="react-select"
          styles={customStyles}
          placeholder={t(placeholder)}
        />
      </FormGroup>
    </Col>
  );

  document.title = `${t("Grading Comparison Report")} | ${t("Reports")}`;

  return (
    <React.Fragment>
      <ToastContainer />
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title={t("Grading Comparison Report")} pageTitle={t("Reports")} />

          <div className="card stock-search-header-bar d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between mb-3 p-3 rounded-3 shadow-sm border gap-2">
            <h5 className="mb-0 fw-bold text-primary d-flex align-items-center gap-2">
              <i className={hasSearched && !showLabWeightDiff ? "ri-database-2-line fs-20 text-primary" : "ri-search-eye-line fs-20 text-primary"}></i>
              {hasSearched && !showLabWeightDiff ? t("Grading Comparison Report Results") : t("Grading Comparison Report Filters")}
            </h5>
            <div className="d-flex gap-2">
              {!hasSearched || showLabWeightDiff ? (
                <>
                  <Button color="primary" className="btn-sm rounded-2 px-3 py-1" onClick={handleReport} disabled={loading || makingEntry}>
                    {loading ? t("Loading...") : t("Report")}
                  </Button>
                  <Button color="soft-secondary" className="btn-sm rounded-2 px-3 py-1" onClick={handleClear} disabled={loading || makingEntry}>
                    {t("Clear")}
                  </Button>
                </>
              ) : (
                <>
                  <Button color="primary" className="btn-sm rounded-2 px-3 py-1" onClick={handleNewSearch}>
                    {t("New Search")}
                  </Button>
                  {reportRows.length > 0 && (
                    <Button color="success" className="btn-sm rounded-2 px-3 py-1" onClick={handleExcel}>
                      <i className="ri-file-excel-2-line align-middle me-1"></i>
                      {t("Excel")}
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>

          {(!hasSearched || showLabWeightDiff) && (
            <Card className="shadow-lg border-0 rounded-3 mb-4">
              <CardBody className="bg-light-subtle">
                <Row className="g-3">
                  <Col lg={10} md={9}>
                    <Row className="g-3 mb-3">
                      <Col lg={2} md={4} sm={6}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1">{t("Date")}</Label>
                          <input
                            type="date"
                            className="form-control form-control-sm"
                            style={{ height: "35px" }}
                            value={filters.fromDate}
                            onChange={(e) => setFilters((prev) => ({ ...prev, fromDate: e.target.value }))}
                          />
                        </FormGroup>
                      </Col>
                      <Col lg={2} md={4} sm={6}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1">{t("To Date")}</Label>
                          <input
                            type="date"
                            className="form-control form-control-sm"
                            style={{ height: "35px" }}
                            value={filters.toDate}
                            onChange={(e) => setFilters((prev) => ({ ...prev, toDate: e.target.value }))}
                          />
                        </FormGroup>
                      </Col>
                      {renderSelect("Shape", "shape", "Shape")}
                      {renderSelect("Color", "color", "Color")}
                      {renderSelect("Clarity", "clarity", "Clarity")}
                      {renderSelect("Size", "size", "Size")}
                    </Row>
                    <Row className="g-3">
                      {renderSelect("Prop.", "proportion", "Proportion")}
                      {renderSelect("Polish", "polish", "Polish")}
                      {renderSelect("Sym.", "symmetry", "Symmetry")}
                      {renderSelect("LAB", "lab", "LAB")}
                      {renderSelect("Fluorescence", "fluorescence", "Fluorescence")}
                    </Row>
                    <Row className="g-2 mt-2">
                      <Col xs="auto">
                        <FormGroup check className="mb-0 d-flex align-items-center gap-2">
                          <Input
                            id="chkLabWeightDifference"
                            type="checkbox"
                            checked={!!filters.labWeightDifference}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setFilters((prev) => ({ ...prev, labWeightDifference: checked }));
                              if (!checked) {
                                setShowLabWeightDiff(false);
                                setLabWeightRows([]);
                                setSelectedLabLots({});
                              }
                            }}
                          />
                          <Label check htmlFor="chkLabWeightDifference" className="fw-medium mb-0">
                            {t("Lab Weight Difference")}
                          </Label>
                        </FormGroup>
                      </Col>
                    </Row>
                  </Col>
                  <Col lg={2} md={3}>
                    <FormGroup className="mb-0">
                      <Label className="fw-medium mb-1">{t("Enter Lot No")}</Label>
                      <Input
                        type="textarea"
                        value={filters.lotNo}
                        onChange={(e) => setFilters((prev) => ({ ...prev, lotNo: e.target.value }))}
                        rows="7"
                        placeholder={t("Search by lot no")}
                        className="form-control-sm"
                        style={{ resize: "none" }}
                      />
                    </FormGroup>
                  </Col>
                </Row>
              </CardBody>
            </Card>
          )}

          {showLabWeightDiff && (
            <Card className="shadow-lg border-0 rounded-3 mb-4">
              <CardBody>
                <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-2 mb-3">
                  <h5 className="mb-0 fw-bold text-primary d-flex align-items-center gap-2">
                    <i className="ri-scales-3-line fs-20 text-primary"></i>
                    {t("Lab Weight Difference")}
                  </h5>
                  <div className="d-flex flex-wrap align-items-center gap-3">
                    <FormGroup check className="mb-0 d-flex align-items-center gap-2">
                      <Input
                        id="chkUseLabWeightDate"
                        type="checkbox"
                        checked={useLabWeightDate}
                        onChange={(e) => setUseLabWeightDate(e.target.checked)}
                        disabled={makingEntry}
                      />
                      <Label check htmlFor="chkUseLabWeightDate" className="fw-medium mb-0">
                        {t("Use Lab Weight Date")}
                      </Label>
                    </FormGroup>
                    {useLabWeightDate && (
                      <input
                        type="date"
                        className="form-control form-control-sm"
                        style={{ height: "31px", width: "160px" }}
                        value={labWeightDate}
                        onChange={(e) => setLabWeightDate(e.target.value)}
                        disabled={makingEntry}
                      />
                    )}
                    <Button
                      color="primary"
                      className="btn-sm rounded-2 px-3 py-1"
                      onClick={handleMakeLabWeightDiffEntry}
                      disabled={makingEntry || !labWeightRows.length}
                    >
                      {makingEntry ? (
                        <>
                          <Spinner size="sm" className="me-1" />
                          {t("Making entry...")}
                        </>
                      ) : (
                        <>
                          <i className="ri-file-add-line align-middle me-1"></i>
                          {t("Make Lab Weight Diff Entry")}
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {labWeightRows.length === 0 ? (
                  <div className="text-center py-4 text-muted">{t("No lab weight difference data available.")}</div>
                ) : (
                  <>
                    <FormGroup check className="mb-3">
                      <Input
                        id="chkSelectAllLabWeight"
                        type="checkbox"
                        checked={allLabSelected}
                        onChange={(e) => handleSelectAllLab(e.target.checked)}
                        disabled={makingEntry}
                      />
                      <Label check htmlFor="chkSelectAllLabWeight" className="fw-medium">
                        {t("Select All")}
                      </Label>
                    </FormGroup>
                    <div className="table-responsive table-card mb-0">
                      <Table className="align-middle table-nowrap mb-0 table-hover table-striped" size="sm">
                        <thead className="table-light">
                          <tr>
                            <th style={{ width: "60px" }}>{t("Select")}</th>
                            <th style={{ width: "50px" }}>#</th>
                            <th>{t("Lot No")}</th>
                            <th className="text-end">{t("Old Weight")}</th>
                            <th className="text-end">{t("New Weight")}</th>
                            <th className="text-end">{t("Difference")}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {labWeightRows.map((row, idx) => {
                            const lotNo = String(getRowVal(row, "lotNo", "LotNo") || "");
                            const key = lotNo || String(idx);
                            const oldWeight = Number(getRowVal(row, "oldWeight", "OldWeight") || 0);
                            const newWeight = Number(getRowVal(row, "newWeight", "NewWeight") || 0);
                            const difference = Math.abs(
                              Number(getRowVal(row, "difference", "Difference") || (oldWeight - newWeight))
                            );
                            return (
                              <tr key={key}>
                                <td>
                                  <Input
                                    type="checkbox"
                                    checked={!!selectedLabLots[key]}
                                    onChange={(e) => handleSelectLabRow(key, e.target.checked)}
                                    disabled={makingEntry}
                                  />
                                </td>
                                <td>{idx + 1}</td>
                                <td>{lotNo || "-"}</td>
                                <td className="text-end">{oldWeight.toFixed(3)}</td>
                                <td className="text-end">{newWeight.toFixed(3)}</td>
                                <td
                                  className="text-end fw-semibold"
                                  style={{ color: getDiffColor(oldWeight, newWeight) }}
                                >
                                  {difference.toFixed(3)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </Table>
                    </div>
                  </>
                )}
              </CardBody>
            </Card>
          )}

          {hasSearched && !showLabWeightDiff && (
            <Card className="shadow-lg border-0 rounded-3 mb-4">
              <CardBody>
                {reportRows.length === 0 ? (
                  <div className="text-center py-4 text-muted">{t("No data available.")}</div>
                ) : (
                  <>
                    <div className="d-flex justify-content-end gap-4 mb-3 small fw-semibold">
                      <span>{t("Total")}:</span>
                      <span>{t("Carats")}: {footerTotals.caratTotal.toFixed(2)}</span>
                      <span>{t("Rate")}: {footerTotals.rate.toFixed(2)}</span>
                      <span>{t("Amount")}: {footerTotals.amtTotal.toFixed(2)}</span>
                    </div>
                    <TableContainer
                      columns={columns}
                      data={reportRows}
                      isGlobalFilter={true}
                      customPageSize={500}
                      customPageSizes={[500, 1000, 1500]}
                      divClass="table-responsive table-card mb-3"
                      tableClass="align-middle table-nowrap mb-0 table-hover table-striped"
                      theadClass="table-light"
                      SearchPlaceholder={t("Search...")}
                      getRowClass={(row) => {
                        if (row.index === 0) return "";
                        const prevLot = getRowVal(reportRows[row.index - 1], "lotNo", "LotNo");
                        const currLot = getRowVal(row.original, "lotNo", "LotNo");
                        return prevLot !== currLot ? "lot-group-start" : "";
                      }}
                    />
                  </>
                )}
              </CardBody>
            </Card>
          )}
        </Container>
      </div>

      <style>{`
        .lot-group-start td {
          border-top: 6px solid var(--vz-border-color, #ced4da) !important;
        }
      `}</style>
    </React.Fragment>
  );
};

export default SolitaireGradingComparisonReport;
