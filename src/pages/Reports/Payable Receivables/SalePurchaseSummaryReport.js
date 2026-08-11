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
  Row
} from "reactstrap";
import Select from "react-select";
import { toast, ToastContainer } from "react-toastify";

import BreadCrumb from "../../../Components/Common/BreadCrumb";
import { useSettingReportDates } from "../../../Components/Hooks/useSettingReportDates";
import { exportToExcel } from "../../../helpers/excel_helper";
import {
  getAccGrpMasters,
  getSalePurchaseSummaryReport,
  getSalePurchaseSummaryReportDropdowns,
  getSettingData
} from "../../../helpers/fakebackend_helper";
import { getCachedReportCompany } from "../../../helpers/reportCompanyDefaults";

const dashText = (value) =>
  value === null || value === undefined || value === "" ? "-" : String(value);

const fmtFixed = (value, decimals = 2) => {
  if (value === null || value === undefined || value === "" || Number.isNaN(Number(value)))
    return (0).toFixed(decimals);
  return Number(value).toFixed(decimals);
};

const toCamelKey = (key) =>
  typeof key === "string" && key.length > 0 ? key.charAt(0).toLowerCase() + key.slice(1) : key;

const toPascalKey = (key) =>
  typeof key === "string" && key.length > 0 ? key.charAt(0).toUpperCase() + key.slice(1) : key;

const getRowVal = (row, ...keys) => {
  if (!row) return "";
  const candidates = [];
  keys.forEach((key) => {
    if (key === undefined || key === null || key === "") return;
    candidates.push(key, toCamelKey(key), toPascalKey(key));
  });
  for (const key of candidates) {
    if (row[key] !== undefined && row[key] !== null && row[key] !== "") return row[key];
  }
  const lowerMap = {};
  Object.keys(row).forEach((k) => {
    lowerMap[String(k).toLowerCase()] = row[k];
  });
  for (const key of keys) {
    if (!key) continue;
    const v = lowerMap[String(key).toLowerCase()];
    if (v !== undefined && v !== null && v !== "") return v;
  }
  for (const key of candidates) {
    if (row[key] === 0 || row[key] === "0") return row[key];
  }
  return "";
};

const numVal = (row, ...keys) => {
  const raw = getRowVal(row, ...keys);
  if (raw === "" || raw === null || raw === undefined) return 0;
  const n = parseFloat(String(raw).replace(/,/g, ""));
  return Number.isNaN(n) ? 0 : n;
};

const MONTH_ORDER = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12
};

const parseReportDate = (value) => {
  if (!value) return 0;
  const parts = String(value).split("-");
  if (parts.length !== 3) return 0;
  const day = parts[0].padStart(2, "0");
  const month = MONTH_ORDER[parts[1]?.toLowerCase()] || 0;
  const year = parts[2];
  if (!month) return 0;
  return Number(`${year}${String(month).padStart(2, "0")}${day}`);
};

const TRN_TYPES = [
  { id: "Sale", label: "Sale", payloadKey: "Sale" },
  { id: "Purchase", label: "Purchase", payloadKey: "PUR" },
  { id: "SaleReturn", label: "Sale Return", payloadKey: "SaleRtn" },
  { id: "PurchaseReturn", label: "Purchase Return", payloadKey: "PurRtn" },
  { id: "SaleParcel", label: "Sale Parcel", payloadKey: "PSALE" },
  { id: "PurchaseParcel", label: "Purchase Parcel", payloadKey: "PPUR" },
  { id: "SaleParcelReturn", label: "Sale Parcel Return", payloadKey: "PSaleRtn" }
];

const buildColumns = (masterSymbol, stockSymbol) => [
  { key: "SPDate", header: "Date", align: "left", sortType: "date" },
  { key: "BillNo", header: "BillNo", align: "left" },
  { key: "Invno", header: "InvNo", align: "left", altKeys: ["invno"] },
  { key: "PartyName", header: "Party", align: "left", altKeys: ["partyName"] },
  { key: "Totcts", header: "Carats", align: "right", sum: true, decimals: 3, footerDecimals: 2, altKeys: ["totcts"] },
  { key: "Rate", header: "Rate", align: "right", avgRate: true, decimals: 2 },
  { key: "Totamount", header: "Amount", align: "right", sum: true, altKeys: ["totamount"] },
  { key: "Plusminamount", header: "+/-Amt", align: "right", sum: true, altKeys: ["plusminamount"] },
  { key: "InvAmt", header: "InvAmt", align: "right", sum: true, altKeys: ["invAmt"] },
  {
    key: "MasterCurrencyFinalAmount",
    header: `${masterSymbol || "INR"} Amount`,
    align: "right",
    sum: true,
    altKeys: ["masterCurrencyFinalAmount"]
  },
  {
    key: "baserate",
    header: `${stockSymbol || "USD"} Rate`,
    align: "right",
    decimals: 2,
    altKeys: ["baseRate"]
  },
  { key: "InvType", header: "InvType", align: "left", altKeys: ["invType"] },
  { key: "Sellername", header: "Seller", align: "left", altKeys: ["sellername"] },
  { key: "duedays", header: "Due", align: "left", altKeys: ["dueDays"] },
  { key: "Remarks", header: "Remarks", align: "left", altKeys: ["remarks"] },
  { key: "ExpParty", header: "ExpParty", align: "left", altKeys: ["expParty"] },
  { key: "BrokerName", header: "Broker", align: "left", altKeys: ["brokerName"] },
  { key: "Subtype", header: "SubType", align: "left", altKeys: ["subtype"] },
  { key: "Status", header: "Status", align: "left", altKeys: ["status"] },
  { key: "VatAmt", header: "VatAmount", align: "right", sum: true, altKeys: ["vatAmt"] },
  {
    key: "VatAmtMasterCur",
    header: "VatRsAmount",
    align: "right",
    sum: true,
    altKeys: ["vatAmtMasterCur"]
  },
  { key: "VatPer", header: "VatPer", align: "right", decimals: 2, altKeys: ["vatPer"] }
];

const mapBasicOptions = (items, useNameAsValue = false) =>
  (Array.isArray(items) ? items : [])
    .map((item) => {
      const id = item.id ?? item.ID ?? "";
      const name = item.name ?? item.Name ?? "";
      if (!id && !name) return null;
      return {
        value: useNameAsValue ? String(name) : String(id),
        label: String(name || id)
      };
    })
    .filter(Boolean);

const SalePurchaseSummaryReport = () => {
  const { t } = useTranslation();
  const { fromDate, toDate, getDates, mergeDates } = useSettingReportDates();

  const [loadingDropdowns, setLoadingDropdowns] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [reportRows, setReportRows] = useState([]);
  const [globalSearch, setGlobalSearch] = useState("");
  const [pageSize, setPageSize] = useState(500);
  const [page, setPage] = useState(1);
  const [columnFilters, setColumnFilters] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: "Rate", direction: "asc" });
  const [trnType, setTrnType] = useState("Sale");
  const [masterSymbol, setMasterSymbol] = useState("INR");
  const [stockSymbol, setStockSymbol] = useState("USD");

  const [currencyOptions, setCurrencyOptions] = useState([]);
  const [typeOptions, setTypeOptions] = useState([]);
  const [subTypeOptions, setSubTypeOptions] = useState([]);
  const [buyerOptions, setBuyerOptions] = useState([]);

  const [selectedCurrency, setSelectedCurrency] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [selectedSubType, setSelectedSubType] = useState(null);
  const [selectedBuyer, setSelectedBuyer] = useState(null);

  const [partyInput, setPartyInput] = useState("");
  const [partyOptions, setPartyOptions] = useState([]);
  const [selectedParty, setSelectedParty] = useState(null);
  const [loadingParties, setLoadingParties] = useState(false);

  const [brokerInput, setBrokerInput] = useState("");
  const [brokerOptions, setBrokerOptions] = useState([]);
  const [selectedBroker, setSelectedBroker] = useState(null);
  const [loadingBrokers, setLoadingBrokers] = useState(false);

  const [expPartyInput, setExpPartyInput] = useState("");
  const [expPartyOptions, setExpPartyOptions] = useState([]);
  const [selectedExpParty, setSelectedExpParty] = useState(null);
  const [loadingExpParties, setLoadingExpParties] = useState(false);

  // MVC FillList() converts Seller to ajax account search (/common/get-account)
  const [sellerInput, setSellerInput] = useState("");
  const [sellerOptions, setSellerOptions] = useState([]);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [loadingSellers, setLoadingSellers] = useState(false);

  const [filters, setFilters] = useState({ fromDate, toDate });

  const columns = useMemo(
    () => buildColumns(masterSymbol, stockSymbol),
    [masterSymbol, stockSymbol]
  );

  const customStyles = useMemo(
    () => ({
      control: (provided) => ({
        ...provided,
        backgroundColor: "var(--vz-secondary-bg, #fff)",
        borderColor: "var(--vz-border-color, #ced4da)",
        color: "var(--vz-body-color, #495057)",
        minHeight: "35px"
      }),
      valueContainer: (provided) => ({
        ...provided,
        minHeight: "35px",
        padding: "0 6px"
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
      })
    }),
    []
  );

  const loadSymbols = useCallback(async () => {
    try {
      const cached = getCachedReportCompany();
      let sSym = cached.stockSymbol || "";
      let mSym = "";

      const auth = JSON.parse(sessionStorage.getItem("authUser") || localStorage.getItem("authUser") || "{}");
      sSym = sSym || auth?.SSymbol || auth?.sSymbol || auth?.data?.SSymbol || "";
      mSym = auth?.MSymbol || auth?.mSymbol || auth?.data?.MSymbol || "";

      try {
        const settings = await getSettingData();
        const rows = Array.isArray(settings) ? settings : settings?.data || settings?.Data || [];
        const pick = (name) => {
          const target = String(name).toLowerCase();
          const row = rows.find(
            (x) => String(x?.Name ?? x?.name ?? "").trim().toLowerCase() === target
          );
          return row?.Value ?? row?.value ?? "";
        };
        sSym = pick("SSymbol") || sSym;
        mSym = pick("MSymbol") || mSym;
      } catch {
        /* ignore */
      }

      setStockSymbol(sSym || "USD");
      setMasterSymbol(mSym || "INR");
    } catch {
      setStockSymbol("USD");
      setMasterSymbol("INR");
    }
  }, []);

  useEffect(() => {
    loadSymbols();
  }, [loadSymbols]);

  useEffect(() => {
    const loadDropdowns = async () => {
      setLoadingDropdowns(true);
      try {
        const res = await getSalePurchaseSummaryReportDropdowns();
        if (res?.success || res?.Success) {
          const data = res.data || res.Data || {};
          setCurrencyOptions(mapBasicOptions(data.currency || data.Currency));
          setTypeOptions(mapBasicOptions(data.type || data.Type));
          setSubTypeOptions(mapBasicOptions(data.subType || data.SubType, true));
          setBuyerOptions(mapBasicOptions(data.buyer || data.Buyer));
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

  const handleAccountSearch = async (term, setOptions, setLoadingState) => {
    if (!term || term.length < 2) {
      setOptions([]);
      return;
    }
    setLoadingState(true);
    try {
      const response = await getAccGrpMasters(term);
      if (response.success || response.Success) {
        const d = response.data || response.Data || [];
        setOptions(
          d.map((item) => ({
            value: String(item.accGrpCode || item.AccGrpCode || ""),
            label: item.accGrpName || item.AccGrpName || ""
          }))
        );
      }
    } catch {
      /* ignore */
    } finally {
      setLoadingState(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(
      () => handleAccountSearch(partyInput, setPartyOptions, setLoadingParties),
      400
    );
    return () => clearTimeout(timer);
  }, [partyInput]);

  useEffect(() => {
    const timer = setTimeout(
      () => handleAccountSearch(brokerInput, setBrokerOptions, setLoadingBrokers),
      400
    );
    return () => clearTimeout(timer);
  }, [brokerInput]);

  useEffect(() => {
    const timer = setTimeout(
      () => handleAccountSearch(expPartyInput, setExpPartyOptions, setLoadingExpParties),
      400
    );
    return () => clearTimeout(timer);
  }, [expPartyInput]);

  useEffect(() => {
    const timer = setTimeout(
      () => handleAccountSearch(sellerInput, setSellerOptions, setLoadingSellers),
      400
    );
    return () => clearTimeout(timer);
  }, [sellerInput]);

  const buildPayload = () => {
    const payload = {
      FromDate: filters.fromDate || null,
      ToDate: filters.toDate || null,
      Currency: selectedCurrency?.value || null,
      InvTypeId: selectedType?.value ? parseInt(selectedType.value, 10) : 0,
      SubTypeId: selectedSubType?.value || null,
      PartyCode: selectedParty?.value ? parseInt(selectedParty.value, 10) : 0,
      BrokerCode: selectedBroker?.value ? parseInt(selectedBroker.value, 10) : 0,
      ExpPartyCode: selectedExpParty?.value ? parseInt(selectedExpParty.value, 10) : 0,
      SellerCode: selectedSeller?.value ? parseInt(selectedSeller.value, 10) : 0,
      BuyerCode: selectedBuyer?.value ? parseInt(selectedBuyer.value, 10) : 0,
      Sale: false,
      PUR: false,
      SaleRtn: false,
      PurRtn: false,
      PSALE: false,
      PPUR: false,
      PSaleRtn: false,
      MemoOut: false
    };

    const selected = TRN_TYPES.find((item) => item.id === trnType);
    if (selected) payload[selected.payloadKey] = true;
    return payload;
  };

  const runReport = async () => {
    setLoading(true);
    try {
      const response = await getSalePurchaseSummaryReport(buildPayload());
      const ok = response?.success || response?.Success;
      if (!ok) {
        toast.warning(response?.Data || response?.data || response?.message || t("Failed to load report."));
        return;
      }
      const data = response.Data || response.data || [];
      setReportRows(Array.isArray(data) ? data : []);
      setHasSearched(true);
      setPage(1);
      setGlobalSearch("");
      setColumnFilters({});
      setSortConfig({ key: "Rate", direction: "asc" });
      toast.success(t("Report loaded successfully."));
    } catch (err) {
      console.error(err);
      toast.error(t("Server Connection Problem.."));
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    const d = await getDates();
    setHasSearched(false);
    setReportRows([]);
    setSelectedCurrency(null);
    setSelectedType(null);
    setSelectedSubType(null);
    setSelectedSeller(null);
    setSelectedBuyer(null);
    setSelectedParty(null);
    setSelectedBroker(null);
    setSelectedExpParty(null);
    setPartyInput("");
    setBrokerInput("");
    setExpPartyInput("");
    setSellerInput("");
    setSellerOptions([]);
    setTrnType("Sale");
    setGlobalSearch("");
    setColumnFilters({});
    setSortConfig({ key: "Rate", direction: "asc" });
    setPage(1);
    setFilters(mergeDates({}, d));
  };

  const handleNewSelection = () => {
    setHasSearched(false);
    setReportRows([]);
    setGlobalSearch("");
    setColumnFilters({});
    setSortConfig({ key: "Rate", direction: "asc" });
    setPage(1);
  };

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        if (prev.direction === "asc") return { key, direction: "desc" };
        return { key: "", direction: "" };
      }
      return { key, direction: "asc" };
    });
  };

  const formatCell = (row, col) => {
    const altKeys = col.altKeys || [];
    if (col.sum || col.avgRate || col.decimals !== undefined) {
      const decimals = col.decimals ?? 2;
      return fmtFixed(numVal(row, col.key, ...altKeys), decimals);
    }
    return dashText(getRowVal(row, col.key, ...altKeys));
  };

  const sortedReportRows = useMemo(() => {
    const rows = [...(reportRows || [])];
    if (sortConfig.key && sortConfig.direction) {
      const col = columns.find((c) => c.key === sortConfig.key);
      const altKeys = col?.altKeys || [];
      rows.sort((a, b) => {
        if (col?.sortType === "date") {
          const numA = parseReportDate(getRowVal(a, sortConfig.key, ...altKeys));
          const numB = parseReportDate(getRowVal(b, sortConfig.key, ...altKeys));
          return sortConfig.direction === "asc" ? numA - numB : numB - numA;
        }

        let valA = getRowVal(a, sortConfig.key, ...altKeys);
        let valB = getRowVal(b, sortConfig.key, ...altKeys);
        const isNumeric = col?.sum || col?.avgRate || col?.decimals !== undefined;
        if (isNumeric) {
          const numA = parseFloat(String(valA).replace(/,/g, "")) || 0;
          const numB = parseFloat(String(valB).replace(/,/g, "")) || 0;
          return sortConfig.direction === "asc" ? numA - numB : numB - numA;
        }
        valA = String(valA || "").toLowerCase();
        valB = String(valB || "").toLowerCase();
        if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
        if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return rows;
  }, [reportRows, sortConfig, columns]);

  const filteredRows = useMemo(() => {
    let rows = sortedReportRows;
    const g = (globalSearch || "").trim().toLowerCase();
    if (g) {
      rows = rows.filter((row) =>
        columns.some((col) =>
          String(getRowVal(row, col.key, ...(col.altKeys || [])))
            .toLowerCase()
            .includes(g)
        )
      );
    }
    Object.entries(columnFilters).forEach(([key, val]) => {
      const v = (val || "").trim().toLowerCase();
      if (!v) return;
      const col = columns.find((c) => c.key === key);
      rows = rows.filter((row) =>
        String(getRowVal(row, key, ...(col?.altKeys || [])))
          .toLowerCase()
          .includes(v)
      );
    });
    return rows;
  }, [sortedReportRows, globalSearch, columnFilters, columns]);

  const pagedRows = useMemo(() => {
    if (pageSize >= 999999) return filteredRows;
    const start = (page - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, page, pageSize]);

  const totals = useMemo(() => {
    const result = {
      Totcts: 0,
      Totamount: 0,
      Plusminamount: 0,
      InvAmt: 0,
      MasterCurrencyFinalAmount: 0,
      VatAmt: 0,
      VatAmtMasterCur: 0
    };
    filteredRows.forEach((row) => {
      result.Totcts += numVal(row, "Totcts", "totcts");
      result.Totamount += numVal(row, "Totamount", "totamount");
      result.Plusminamount += numVal(row, "Plusminamount", "plusminamount");
      result.InvAmt += numVal(row, "InvAmt", "invAmt");
      result.MasterCurrencyFinalAmount += numVal(row, "MasterCurrencyFinalAmount", "masterCurrencyFinalAmount");
      result.VatAmt += numVal(row, "VatAmt", "vatAmt");
      result.VatAmtMasterCur += numVal(row, "VatAmtMasterCur", "vatAmtMasterCur");
    });
    result.Rate = result.Totcts > 0 ? result.Totamount / result.Totcts : 0;
    return result;
  }, [filteredRows]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));

  const getVisiblePages = () => {
    if (totalPages <= 3) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (page === 1) return [1, 2, 3];
    if (page === totalPages) return [totalPages - 2, totalPages - 1, totalPages];
    return [page - 1, page, page + 1];
  };

  const exportReportExcel = async () => {
    const headers = columns.map((c) => c.header);
    const rows = filteredRows.map((row) => columns.map((col) => formatCell(row, col)));
    rows.push(
      columns.map((col, idx) => {
        if (idx === 0) return t("Total");
        if (col.key === "Rate") return fmtFixed(totals.Rate, 2);
        if (col.sum) return fmtFixed(totals[col.key] || 0, col.footerDecimals ?? col.decimals ?? 2);
        return "";
      })
    );
    const res = await exportToExcel(headers, rows, "SalePurchaseSummary", "sale-pur-summary-report");
    if (!res?.success) toast.error(t("Excel export failed."));
  };

  const renderHeader = (col) => {
    const isSorted = sortConfig.key === col.key;
    return (
      <th
        key={col.key}
        className="text-center text-nowrap small fw-semibold cursor-pointer select-none"
        onClick={() => handleSort(col.key)}
        style={{ userSelect: "none", cursor: "pointer" }}
      >
        <div className="d-flex align-items-center justify-content-center">
          <span>{t(col.header)}</span>
          <span className="ms-2">
            {isSorted ? (
              sortConfig.direction === "asc" ? (
                <i className="mdi mdi-chevron-up text-muted" />
              ) : (
                <i className="mdi mdi-chevron-down text-muted" />
              )
            ) : (
              <i className="mdi mdi-unfold-more-horizontal text-muted" />
            )}
          </span>
        </div>
      </th>
    );
  };

  const renderFooterCell = (col, idx) => {
    if (idx === 0) return t("Total");
    if (col.key === "Rate") return fmtFixed(totals.Rate, 2);
    if (col.sum) return fmtFixed(totals[col.key] || 0, col.footerDecimals ?? col.decimals ?? 2);
    return "";
  };

  document.title = `${t("Sale - Purchase Summary Report")} | ${t("Admin")}`;

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title={t("Sale - Purchase Summary Report")} pageTitle={t("Reports")} />

          <div className="card d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between mb-3 p-3 rounded-3 shadow-sm border gap-3">
            <h5 className="mb-0 fw-bold text-primary d-flex align-items-center gap-2">
              <i className="ri-file-list-3-line fs-20 text-primary" />
              {t("Sale - Purchase Summary Report")}
            </h5>

            <div className="d-flex align-items-center flex-wrap gap-2">
              {!hasSearched ? (
                <>
                  <Button
                    color="soft-primary"
                    className="btn-sm rounded-2 px-3 py-1"
                    disabled={loading || loadingDropdowns}
                    onClick={handleClear}
                  >
                    {t("Clear")}
                  </Button>
                  <Button
                    color="primary"
                    className="btn-sm rounded-2 px-3 py-1"
                    disabled={loading || loadingDropdowns}
                    onClick={runReport}
                  >
                    {loading ? t("Loading...") : t("Report")}
                  </Button>
                </>
              ) : (
                <>
                  <Button color="primary" className="btn-sm rounded-2 px-3 py-1" onClick={handleNewSelection}>
                    {t("New Search")}
                  </Button>
                  <Button color="soft-success" className="btn-sm rounded-2 px-3 py-1" onClick={exportReportExcel}>
                    <i className="ri-file-excel-2-line align-middle me-1" />
                    {t("Excel")}
                  </Button>
                </>
              )}
            </div>
          </div>

          {!hasSearched && (
            <Card className="shadow-lg border-0 rounded-3 mb-4">
              <CardBody className="bg-light-subtle">
                <Row className="g-2 mb-2">
                  <Col sm={6} md={2}>
                    <FormGroup className="mb-0">
                      <Label className="fw-medium mb-1 small">{t("Date")}</Label>
                      <Input
                        type="date"
                        className="form-control form-control-sm"
                        style={{ height: "35px" }}
                        value={filters.fromDate || ""}
                        onChange={(e) => setFilters((p) => ({ ...p, fromDate: e.target.value }))}
                      />
                    </FormGroup>
                  </Col>
                  <Col sm={6} md={2}>
                    <FormGroup className="mb-0">
                      <Label className="fw-medium mb-1 small">{t("To Date")}</Label>
                      <Input
                        type="date"
                        className="form-control form-control-sm"
                        style={{ height: "35px" }}
                        value={filters.toDate || ""}
                        onChange={(e) => setFilters((p) => ({ ...p, toDate: e.target.value }))}
                      />
                    </FormGroup>
                  </Col>
                  <Col sm={6} md={2}>
                    <FormGroup className="mb-0">
                      <Label className="fw-medium mb-1 small">{t("Currency")}</Label>
                      <Select
                        classNamePrefix="react-select"
                        styles={customStyles}
                        isClearable
                        isLoading={loadingDropdowns}
                        options={currencyOptions}
                        value={selectedCurrency}
                        onChange={setSelectedCurrency}
                        placeholder={t("Select Currency")}
                      />
                    </FormGroup>
                  </Col>
                  <Col sm={6} md={3}>
                    <FormGroup className="mb-0">
                      <Label className="fw-medium mb-1 small">{t("Type")}</Label>
                      <Select
                        classNamePrefix="react-select"
                        styles={customStyles}
                        isClearable
                        isLoading={loadingDropdowns}
                        options={typeOptions}
                        value={selectedType}
                        onChange={setSelectedType}
                        placeholder={t("Select Type")}
                      />
                    </FormGroup>
                  </Col>
                  <Col sm={6} md={3}>
                    <FormGroup className="mb-0">
                      <Label className="fw-medium mb-1 small">{t("SubType")}</Label>
                      <Select
                        classNamePrefix="react-select"
                        styles={customStyles}
                        isClearable
                        isLoading={loadingDropdowns}
                        options={subTypeOptions}
                        value={selectedSubType}
                        onChange={setSelectedSubType}
                        placeholder={t("Select SubType")}
                      />
                    </FormGroup>
                  </Col>
                </Row>

                <Row className="g-2 mb-2">
                  <Col sm={6} md={3}>
                    <FormGroup className="mb-0">
                      <Label className="fw-medium mb-1 small">{t("Party")}</Label>
                      <Select
                        classNamePrefix="react-select"
                        styles={customStyles}
                        isClearable
                        isLoading={loadingParties}
                        options={partyOptions}
                        value={selectedParty}
                        inputValue={partyInput}
                        onInputChange={(val, meta) => {
                          if (meta.action === "input-change") setPartyInput(val);
                        }}
                        onChange={(sel) => {
                          setSelectedParty(sel);
                          setPartyInput("");
                          setPartyOptions([]);
                        }}
                        placeholder={t("Search Party")}
                        noOptionsMessage={() =>
                          partyInput.length < 2 ? t("Type 2+ characters") : t("No options")
                        }
                      />
                    </FormGroup>
                  </Col>
                  <Col sm={6} md={3}>
                    <FormGroup className="mb-0">
                      <Label className="fw-medium mb-1 small">{t("Broker")}</Label>
                      <Select
                        classNamePrefix="react-select"
                        styles={customStyles}
                        isClearable
                        isLoading={loadingBrokers}
                        options={brokerOptions}
                        value={selectedBroker}
                        inputValue={brokerInput}
                        onInputChange={(val, meta) => {
                          if (meta.action === "input-change") setBrokerInput(val);
                        }}
                        onChange={(sel) => {
                          setSelectedBroker(sel);
                          setBrokerInput("");
                          setBrokerOptions([]);
                        }}
                        placeholder={t("Search Broker")}
                        noOptionsMessage={() =>
                          brokerInput.length < 2 ? t("Type 2+ characters") : t("No options")
                        }
                      />
                    </FormGroup>
                  </Col>
                  <Col sm={6} md={3}>
                    <FormGroup className="mb-0">
                      <Label className="fw-medium mb-1 small">{t("Exp.Party")}</Label>
                      <Select
                        classNamePrefix="react-select"
                        styles={customStyles}
                        isClearable
                        isLoading={loadingExpParties}
                        options={expPartyOptions}
                        value={selectedExpParty}
                        inputValue={expPartyInput}
                        onInputChange={(val, meta) => {
                          if (meta.action === "input-change") setExpPartyInput(val);
                        }}
                        onChange={(sel) => {
                          setSelectedExpParty(sel);
                          setExpPartyInput("");
                          setExpPartyOptions([]);
                        }}
                        placeholder={t("Search Export Party")}
                        noOptionsMessage={() =>
                          expPartyInput.length < 2 ? t("Type 2+ characters") : t("No options")
                        }
                      />
                    </FormGroup>
                  </Col>
                  <Col sm={6} md={3}>
                    <FormGroup className="mb-0">
                      <Label className="fw-medium mb-1 small">{t("Seller")}</Label>
                      <Select
                        classNamePrefix="react-select"
                        styles={customStyles}
                        isClearable
                        isLoading={loadingSellers}
                        options={sellerOptions}
                        value={selectedSeller}
                        inputValue={sellerInput}
                        onInputChange={(val, meta) => {
                          if (meta.action === "input-change") setSellerInput(val);
                        }}
                        onChange={(sel) => {
                          setSelectedSeller(sel);
                          setSellerInput("");
                          setSellerOptions([]);
                        }}
                        placeholder={t("Search Seller")}
                        noOptionsMessage={() =>
                          sellerInput.length < 2 ? t("Type 2+ characters") : t("No options")
                        }
                      />
                    </FormGroup>
                  </Col>
                </Row>

                <Row className="g-2">
                  <Col sm={6} md={3}>
                    <FormGroup className="mb-0">
                      <Label className="fw-medium mb-1 small">{t("Buyer")}</Label>
                      <Select
                        classNamePrefix="react-select"
                        styles={customStyles}
                        isClearable
                        isLoading={loadingDropdowns}
                        options={buyerOptions}
                        value={selectedBuyer}
                        onChange={setSelectedBuyer}
                        placeholder={t("Select Buyer")}
                      />
                    </FormGroup>
                  </Col>
                  <Col sm={12} md={9}>
                    <FormGroup className="mb-0">
                      <Label className="fw-medium mb-1 small d-block">&nbsp;</Label>
                      <div className="d-flex align-items-center flex-wrap gap-3" style={{ minHeight: "35px" }}>
                        {TRN_TYPES.map((item) => (
                          <div className="form-check mb-0" key={item.id}>
                            <Input
                              className="form-check-input"
                              type="radio"
                              name="salePurTrnType"
                              id={`trn-${item.id}`}
                              checked={trnType === item.id}
                              onChange={() => setTrnType(item.id)}
                            />
                            <Label className="form-check-label small" htmlFor={`trn-${item.id}`}>
                              {t(item.label)}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </FormGroup>
                  </Col>
                </Row>
              </CardBody>
            </Card>
          )}

          {hasSearched && (
            <Card className="shadow-lg border-0 rounded-3 mb-4">
              <CardBody>
                <Row className="mb-3 align-items-center g-3">
                  <Col sm={12} md="auto">
                    <div className="d-flex align-items-center">
                      <span className="me-2 text-muted text-uppercase">{t("Show")}</span>
                      <select
                        className="form-select form-select-sm w-auto"
                        value={pageSize}
                        onChange={(e) => {
                          setPageSize(Number(e.target.value));
                          setPage(1);
                        }}
                      >
                        {[500, 1000, 1500].map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                        <option value={999999}>{t("All")}</option>
                      </select>
                      <span className="ms-2 text-muted text-uppercase">{t("Entries")}</span>
                    </div>
                  </Col>
                  <Col sm={12} md className="d-flex justify-content-md-end mt-2 mt-md-0">
                    <div className="search-box me-2 d-inline-block">
                      <input
                        type="text"
                        className="form-control search"
                        value={globalSearch}
                        onChange={(e) => {
                          setGlobalSearch(e.target.value);
                          setPage(1);
                        }}
                        placeholder={t("Search...")}
                      />
                      <i className="bx bx-search-alt search-icon" />
                    </div>
                  </Col>
                </Row>

                <div className="table-responsive table-card" style={{ maxHeight: "620px", overflow: "auto" }}>
                  <table className="table table-bordered table-hover table-sm align-middle mb-0">
                    <thead className="table-light" style={{ position: "sticky", top: 0, zIndex: 2 }}>
                      <tr>{columns.map(renderHeader)}</tr>
                      <tr>
                        {columns.map((col) => (
                          <th key={`f-${col.key}`} className="p-1">
                            <Input
                              type="text"
                              className="form-control form-control-sm"
                              value={columnFilters[col.key] || ""}
                              onChange={(e) => {
                                setColumnFilters((p) => ({ ...p, [col.key]: e.target.value }));
                                setPage(1);
                              }}
                            />
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pagedRows.length === 0 ? (
                        <tr>
                          <td colSpan={columns.length} className="text-center text-muted py-4">
                            {t("No data available.")}
                          </td>
                        </tr>
                      ) : (
                        pagedRows.map((row, idx) => (
                          <tr key={`${getRowVal(row, "Invno", "invno")}-${idx}`}>
                            {columns.map((col) => (
                              <td
                                key={col.key}
                                className={`text-nowrap small ${
                                  col.align === "right" ? "text-end" : "text-start"
                                }`}
                              >
                                {formatCell(row, col)}
                              </td>
                            ))}
                          </tr>
                        ))
                      )}
                    </tbody>
                    <tfoot
                      className="table-light"
                      style={{
                        position: "sticky",
                        bottom: 0,
                        backgroundColor: "var(--vz-light, #f2f2f2)",
                        zIndex: 2,
                        borderTop: "2px solid var(--vz-border-color)"
                      }}
                    >
                      <tr className="fw-bold">
                        {columns.map((col, idx) => (
                          <td
                            key={`total-${col.key}`}
                            className={`small ${col.align === "right" ? "text-end" : "text-start"}`}
                          >
                            {renderFooterCell(col, idx)}
                          </td>
                        ))}
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <Row className="align-items-center mt-3 g-2">
                  <Col sm={12} md={6}>
                    <div className="text-muted small">
                      {t("Showing")}{" "}
                      {filteredRows.length === 0
                        ? 0
                        : pageSize >= 999999
                          ? 1
                          : (page - 1) * pageSize + 1}{" "}
                      {t("to")}{" "}
                      {filteredRows.length === 0
                        ? 0
                        : pageSize >= 999999
                          ? filteredRows.length
                          : Math.min(page * pageSize, filteredRows.length)}{" "}
                      {t("of")} {filteredRows.length} {t("entries")}
                    </div>
                  </Col>
                  <Col sm={12} md={6}>
                    <div className="d-flex justify-content-md-end gap-1">
                      <Button
                        color="light"
                        size="sm"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                      >
                        {t("Previous")}
                      </Button>
                      {getVisiblePages().map((p) => (
                        <Button
                          key={p}
                          color={p === page ? "primary" : "light"}
                          size="sm"
                          onClick={() => setPage(p)}
                        >
                          {p}
                        </Button>
                      ))}
                      <Button
                        color="light"
                        size="sm"
                        disabled={page >= totalPages}
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      >
                        {t("Next")}
                      </Button>
                    </div>
                  </Col>
                </Row>
              </CardBody>
            </Card>
          )}
        </Container>
        <ToastContainer closeButton={false} limit={1} />
      </div>
    </React.Fragment>
  );
};

export default SalePurchaseSummaryReport;
