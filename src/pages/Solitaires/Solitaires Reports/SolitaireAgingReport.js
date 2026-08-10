import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  getSolitaireAgingDropdowns,
  getSolitaireAgingReport
} from "../../../helpers/fakebackend_helper";
import {
  getCachedReportCompany,
  getReportCompanySettings,
  REPORT_COMPANY_SETTINGS_EVENT,
  resolveCompanyLogoUrl
} from "../../../helpers/reportCompanyDefaults";

const dashText = (value) =>
  value === null || value === undefined || value === "" ? "-" : String(value);

const fmtFixed = (value, decimals = 2) => {
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

const numVal = (row, ...keys) => {
  const raw = getRowVal(row, ...keys);
  const n = parseFloat(String(raw ?? "0").replace(/,/g, ""));
  return Number.isNaN(n) ? 0 : n;
};

const SUM_KEYS = [
  "Amount",
  "RemainingAmount",
  "Days120Plus",
  "Days91To120",
  "Days61To90",
  "Days31To60",
  "Days1To30",
  "EarlyPayments2",
  "EarlyPayments1"
];

const emptyTotals = () =>
  SUM_KEYS.reduce((acc, key) => {
    acc[key] = 0;
    return acc;
  }, {});

const SolitaireAgingReport = () => {
  const { t } = useTranslation();
  const printRef = useRef(null);
  const { fromDate, toDate, getDates, mergeDates } = useSettingReportDates();

  const [loadingDropdowns, setLoadingDropdowns] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [dropdownData, setDropdownData] = useState({});
  const [reportRows, setReportRows] = useState([]);
  const [appliedGroupBy, setAppliedGroupBy] = useState("InvoiceWise");
  const [appliedDateRange, setAppliedDateRange] = useState({ from: "", to: "" });
  const [companyInfo, setCompanyInfo] = useState(() => getCachedReportCompany());

  const [partyInput, setPartyInput] = useState("");
  const [partyOptions, setPartyOptions] = useState([]);
  const [selectedParty, setSelectedParty] = useState(null);
  const [loadingParties, setLoadingParties] = useState(false);

  const [filters, setFilters] = useState({
    fromDate,
    toDate,
    type: "",
    subType: "",
    category: "",
    groupBy: "InvoiceWise",
    invNo: "",
    billNo: ""
  });

  const groupByOptions = useMemo(
    () => [
      { value: "InvoiceWise", label: t("Group by Inv") },
      { value: "PartyWise", label: t("Group by Party") }
    ],
    [t]
  );

  const customStyles = useMemo(
    () => ({
      control: (provided) => ({
        ...provided,
        backgroundColor: "var(--vz-secondary-bg, #fff)",
        borderColor: "var(--vz-border-color, #ced4da)",
        color: "var(--vz-body-color, #495057)",
        height: "auto",
        minHeight: "35px"
      }),
      valueContainer: (provided) => ({
        ...provided,
        height: "auto",
        minHeight: "35px",
        padding: "0 6px",
        display: "flex",
        flexWrap: "wrap",
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
      })
    }),
    []
  );

  const getOptions = useCallback(
    (dropdownKey) => {
      const list = dropdownData?.[dropdownKey] || [];
      return list.map((item) => ({
        value: item.name ?? item.Name ?? item.label ?? "",
        label: String(item.name ?? item.Name ?? item.label ?? "").toUpperCase()
      }));
    },
    [dropdownData]
  );

  useEffect(() => {
    const loadDropdowns = async () => {
      setLoadingDropdowns(true);
      try {
        const res = await getSolitaireAgingDropdowns();
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
    const loadCompanySettings = async () => {
      const company = await getReportCompanySettings({ forceRefresh: true });
      setCompanyInfo(company);
    };

    const handleCompanyRefresh = () => {
      setCompanyInfo(getCachedReportCompany());
    };

    loadCompanySettings();
    window.addEventListener(REPORT_COMPANY_SETTINGS_EVENT, handleCompanyRefresh);
    window.addEventListener("companyNameUpdated", handleCompanyRefresh);
    window.addEventListener("companyLogoUpdated", handleCompanyRefresh);

    return () => {
      window.removeEventListener(REPORT_COMPANY_SETTINGS_EVENT, handleCompanyRefresh);
      window.removeEventListener("companyNameUpdated", handleCompanyRefresh);
      window.removeEventListener("companyLogoUpdated", handleCompanyRefresh);
    };
  }, []);

  useEffect(() => {
    setFilters((prev) => mergeDates(prev));
  }, [fromDate, toDate, mergeDates]);

  const handleAccountSearch = async (term) => {
    if (!term || term.length < 2) {
      setPartyOptions([]);
      return;
    }
    setLoadingParties(true);
    try {
      const response = await getAccGrpMasters(term);
      if (response.success || response.Success) {
        const d = response.data || response.Data || [];
        setPartyOptions(
          d.map((item) => ({
            value: item.accGrpCode || item.AccGrpCode,
            label: item.accGrpName || item.AccGrpName
          }))
        );
      }
    } catch {
    } finally {
      setLoadingParties(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => handleAccountSearch(partyInput), 400);
    return () => clearTimeout(timer);
  }, [partyInput]);

  const handleClear = async () => {
    const d = await getDates();
    setHasSearched(false);
    setReportRows([]);
    setSelectedParty(null);
    setPartyInput("");
    setPartyOptions([]);
    setAppliedGroupBy("InvoiceWise");
    setAppliedDateRange({ from: "", to: "" });
    setFilters(
      mergeDates(
        {
          type: "",
          subType: "",
          category: "",
          groupBy: "InvoiceWise",
          invNo: "",
          billNo: ""
        },
        d
      )
    );
  };

  const buildPayload = () => ({
    FromDate: filters.fromDate,
    ToDate: filters.toDate,
    Type: filters.type || null,
    SubType: filters.subType || null,
    Category: filters.category || null,
    GroupBy: filters.groupBy || "InvoiceWise",
    Party: selectedParty?.value ? String(selectedParty.value) : null,
    InvNo: filters.invNo || null,
    BillNo: filters.billNo || null
  });

  const handleReport = async () => {
    setLoading(true);
    try {
      const response = await getSolitaireAgingReport(buildPayload());
      const ok = response?.success || response?.Success;
      if (ok) {
        const data = response.Data || response.data || [];
        setReportRows(data);
        setAppliedGroupBy(filters.groupBy || "InvoiceWise");
        setAppliedDateRange({ from: filters.fromDate, to: filters.toDate });
        setHasSearched(true);
        if (!data.length) toast.warning(t("No records found."));
        else toast.success(t("Report loaded successfully."));
      } else {
        toast.warning(response?.Message || t("Failed to load report."));
      }
    } catch (err) {
      console.error("Aging report request failed:", err);
      const msg =
        typeof err === "string"
          ? err
          : err?.response?.data?.message || err?.response?.data?.Message || null;
      toast.error(msg || t("Server Connection Problem.."));
    } finally {
      setLoading(false);
    }
  };

  const invoiceColumns = useMemo(
    () => [
      { key: "DocDate", header: t("Date"), align: "left" },
      { key: "DocId", header: t("Inv No"), align: "left" },
      { key: "DueDate", header: t("Due Date"), align: "left" },
      { key: "Amount", header: `${t("Amount")}${companyInfo.stockSymbol ? ` (${companyInfo.stockSymbol})` : ""}`, align: "right", sum: true },
      { key: "RemainingAmount", header: t("Remain Amt"), align: "right", sum: true },
      { key: "Days120Plus", header: t("120+ Days"), align: "right", sum: true },
      { key: "Days91To120", header: t("120-90 Days"), align: "right", sum: true },
      { key: "Days61To90", header: t("90-61 Days"), align: "right", sum: true },
      { key: "Days31To60", header: t("60-31 Days"), align: "right", sum: true },
      { key: "Days1To30", header: t("30-1 Days"), align: "right", sum: true },
      { key: "EarlyPayments2", header: t("0-30 Early Payments"), align: "right", sum: true },
      { key: "EarlyPayments1", header: t(">30 Early Payments"), align: "right", sum: true },
      { key: "SalesPerson", header: t("Sales Person"), align: "left" },
      { key: "City", header: t("City"), align: "left" },
      { key: "Country", header: t("Country"), align: "left" }
    ],
    [companyInfo.stockSymbol, t]
  );

  const partyColumns = useMemo(
    () => [
      { key: "AccountName", header: t("Account Name"), align: "left" },
      { key: "Amount", header: `${t("Amount")}${companyInfo.stockSymbol ? ` (${companyInfo.stockSymbol})` : ""}`, align: "right", sum: true },
      { key: "RemainingAmount", header: t("Remain Amt"), align: "right", sum: true },
      { key: "Days120Plus", header: t("120+ Days"), align: "right", sum: true },
      { key: "Days91To120", header: t("120-90 Days"), align: "right", sum: true },
      { key: "Days61To90", header: t("90-61 Days"), align: "right", sum: true },
      { key: "Days31To60", header: t("60-31 Days"), align: "right", sum: true },
      { key: "Days1To30", header: t("30-1 Days"), align: "right", sum: true },
      { key: "EarlyPayments2", header: t("0-30 Early Payments"), align: "right", sum: true },
      { key: "EarlyPayments1", header: t(">30 Early Payments"), align: "right", sum: true }
    ],
    [companyInfo.stockSymbol, t]
  );

  const isInvoiceWise = appliedGroupBy === "InvoiceWise";
  const activeColumns = isInvoiceWise ? invoiceColumns : partyColumns;

  const invoiceGrouped = useMemo(() => {
    if (!isInvoiceWise) return [];
    const grouped = {};
    (reportRows || []).forEach((item) => {
      const key = getRowVal(item, "AccountName", "accountName") || t("Unknown Party");
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(item);
    });
    return Object.keys(grouped).map((party) => {
      const rows = grouped[party];
      const subtotal = emptyTotals();
      rows.forEach((item) => {
        SUM_KEYS.forEach((k) => {
          subtotal[k] += numVal(item, k, k.charAt(0).toLowerCase() + k.slice(1));
        });
      });
      return { party, rows, subtotal };
    });
  }, [isInvoiceWise, reportRows, t]);

  const grandTotal = useMemo(() => {
    const total = emptyTotals();
    (reportRows || []).forEach((item) => {
      SUM_KEYS.forEach((k) => {
        total[k] += numVal(item, k, k.charAt(0).toLowerCase() + k.slice(1));
      });
    });
    return total;
  }, [reportRows]);

  const handleExcel = async () => {
    if (!reportRows.length) {
      toast.warning(t("No data available."));
      return;
    }

    const headers = activeColumns.map((c) => c.header);
    const rows = [];

    if (isInvoiceWise) {
      invoiceGrouped.forEach(({ party, rows: partyRows, subtotal }) => {
        rows.push([`Party: ${party}`, ...Array(activeColumns.length - 1).fill("")]);
        partyRows.forEach((item) => {
          rows.push(
            activeColumns.map((col) => {
              if (col.sum) return fmtFixed(numVal(item, col.key, col.key.charAt(0).toLowerCase() + col.key.slice(1)));
              if (col.key === "DocId") return dashText(getRowVal(item, "DocId", "docId"));
              return dashText(getRowVal(item, col.key, col.key.charAt(0).toLowerCase() + col.key.slice(1)));
            })
          );
        });
        rows.push(
          activeColumns.map((col, idx) => {
            if (idx === 2) return t("Total");
            if (col.sum) return fmtFixed(subtotal[col.key] || 0);
            return "";
          })
        );
      });
      rows.push(
        activeColumns.map((col, idx) => {
          if (idx === 2) return t("Grand Total");
          if (col.sum) return fmtFixed(grandTotal[col.key] || 0);
          return "";
        })
      );
    } else {
      reportRows.forEach((item) => {
        rows.push(
          activeColumns.map((col) => {
            if (col.sum) return fmtFixed(numVal(item, col.key, col.key.charAt(0).toLowerCase() + col.key.slice(1)));
            return dashText(getRowVal(item, col.key, col.key.charAt(0).toLowerCase() + col.key.slice(1)));
          })
        );
      });
      rows.push(
        activeColumns.map((col, idx) => {
          if (idx === 0) return t("Grand Total");
          if (col.sum) return fmtFixed(grandTotal[col.key] || 0);
          return "";
        })
      );
    }

    const res = await exportToExcel(headers, rows, "AgingReport", "Aging-Report");
    if (!res?.success) toast.error(t("Excel export failed."));
  };

  const handlePrint = () => {
    const node = printRef.current;
    if (!node) {
      toast.warning(t("No report is currently visible to print."));
      return;
    }

    const printWindow = window.open("", "", "height=1000,width=1200");
    if (!printWindow) {
      toast.warning(t("Please allow pop-ups to print."));
      return;
    }

    printWindow.document.write("<html><head><title>Aging Report</title>");
    document.querySelectorAll('link[rel="stylesheet"], style').forEach((style) => {
      printWindow.document.write(style.outerHTML);
    });
    printWindow.document.write(`
<style>
  @media print {
    @page { size: landscape; margin: 6mm; }
    body {
      font-size: 10px;
      margin: 0;
      padding: 8px;
      color: #111;
      background: #fff;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    div.aging-company-header {
      display: flex !important;
      flex-direction: row !important;
      justify-content: space-between !important;
      align-items: flex-start !important;
      gap: 16px;
      margin-bottom: 14px;
    }
    div.aging-company-left {
      display: flex !important;
      flex-direction: row !important;
      align-items: flex-start !important;
      gap: 14px;
    }
    div.aging-company-right {
      text-align: right !important;
    }
    .aging-company-logo { max-width: 96px; max-height: 90px; object-fit: contain; }
    .aging-print-title { font-size: 18px; font-weight: 700; margin-bottom: 4px; }
    .aging-print-meta { font-size: 12px; color: #444; margin-bottom: 12px; }
    .aging-footer { margin-top: 12px; font-size: 11px; color: #555; }
    .table-responsive, .table-card {
      max-height: none !important;
      overflow: visible !important;
      display: contents !important;
    }
    #aging-report-table {
      width: 100% !important;
      display: table !important;
      border-collapse: collapse !important;
      border: 1px solid #888 !important;
      margin-top: 6px !important;
      font-size: 8px;
    }
    #aging-report-table thead {
      display: table-header-group !important;
      position: static !important;
    }
    #aging-report-table thead tr {
      page-break-inside: avoid !important;
    }
    #aging-report-table tbody tr {
      page-break-inside: avoid !important;
    }
    #aging-report-table th, #aging-report-table td {
      border: 1px solid #888 !important;
      padding: 3px 4px !important;
    }
    #aging-report-table th { background: #f2f2f2 !important; text-align: center; font-weight: 700; }
    .aging-party-header td { background: #eceff3 !important; font-weight: 700; text-align: center; }
    .aging-subtotal td, .aging-grand-total td { font-weight: 700; background: #f5f5f5 !important; }
  }
</style>
`);
    printWindow.document.write("</head><body>");
    printWindow.document.write(node.innerHTML);
    printWindow.document.write("</body></html>");
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const renderCell = (item, col) => {
    if (col.sum) {
      return fmtFixed(numVal(item, col.key, col.key.charAt(0).toLowerCase() + col.key.slice(1)));
    }
    if (col.key === "DocId") return dashText(getRowVal(item, "DocId", "docId"));
    return dashText(getRowVal(item, col.key, col.key.charAt(0).toLowerCase() + col.key.slice(1)));
  };

  document.title = `${t("Aging Report")} | ${t("Reports")}`;

  const companyLogoUrl = resolveCompanyLogoUrl(companyInfo.companyLogo);

  return (
    <React.Fragment>
      <ToastContainer />
      <style>{`
        .aging-party-header td {
          background-color: #eef1f6 !important;
          color: var(--vz-dark, #212529) !important;
        }
        .aging-subtotal td {
          background-color: #f8f9fb !important;
          color: var(--vz-dark, #212529) !important;
        }
        .aging-grand-total td {
          background-color: #e8ebf0 !important;
          color: var(--vz-dark, #212529) !important;
        }

        [data-layout-mode="dark"] .aging-party-header td,
        [data-bs-theme="dark"] .aging-party-header td {
          background-color: #2b303c !important;
          color: #f3f6f9 !important;
        }
        [data-layout-mode="dark"] .aging-subtotal td,
        [data-bs-theme="dark"] .aging-subtotal td {
          background-color: #1f222a !important;
          color: #f3f6f9 !important;
        }
        [data-layout-mode="dark"] .aging-grand-total td,
        [data-bs-theme="dark"] .aging-grand-total td {
          background-color: #353b48 !important;
          color: #ffffff !important;
        }
      `}</style>

      <div className="page-content">
        <Container fluid>
          <BreadCrumb title={t("Aging Report")} pageTitle={t("Reports")} />

          <div className="card stock-search-header-bar d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between mb-3 p-3 rounded-3 shadow-sm border gap-2">
            <h5 className="mb-0 fw-bold text-primary d-flex align-items-center gap-2">
              <i className={hasSearched ? "ri-time-line fs-20 text-primary" : "ri-search-eye-line fs-20 text-primary"}></i>
              {hasSearched ? t("Aging Report Results") : t("Aging Report Filters")}
            </h5>

            <div className="d-flex flex-wrap gap-2">
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
                    }}
                    disabled={loading}
                  >
                    {t("New Search")}
                  </Button>
                  <Button
                    color="success"
                    className="btn-sm rounded-2 px-3 py-1"
                    onClick={handleExcel}
                    disabled={!reportRows.length}
                  >
                    {t("Excel")}
                  </Button>
                  <Button
                    color="info"
                    className="btn-sm rounded-2 px-3 py-1"
                    onClick={handlePrint}
                    disabled={!reportRows.length}
                  >
                    <i className="ri-printer-line align-middle me-1"></i>
                    {t("Print")}
                  </Button>
                </>
              )}
            </div>
          </div>

          {!hasSearched && (
            <Card className="shadow-lg border-0 rounded-3 mb-4">
              <CardBody className="bg-light-subtle">
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
                      <Label className="fw-medium mb-1 small">{t("Type")}</Label>
                      <Select
                        classNamePrefix="react-select"
                        styles={customStyles}
                        isClearable
                        isLoading={loadingDropdowns}
                        options={getOptions("type")}
                        value={getOptions("type").find((o) => o.value === filters.type) || null}
                        onChange={(sel) => setFilters((prev) => ({ ...prev, type: sel?.value || "" }))}
                        placeholder={t("Select Type")}
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
                        isLoading={loadingDropdowns}
                        options={getOptions("subType")}
                        value={getOptions("subType").find((o) => o.value === filters.subType) || null}
                        onChange={(sel) => setFilters((prev) => ({ ...prev, subType: sel?.value || "" }))}
                        placeholder={t("Select SubType")}
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
                        isLoading={loadingDropdowns}
                        options={getOptions("category")}
                        value={getOptions("category").find((o) => o.value === filters.category) || null}
                        onChange={(sel) => setFilters((prev) => ({ ...prev, category: sel?.value || "" }))}
                        placeholder={t("Select Category")}
                      />
                    </FormGroup>
                  </Col>
                  <Col sm={2}>
                    <FormGroup className="mb-0">
                      <Label className="fw-medium mb-1 small">{t("Group By")}</Label>
                      <Select
                        classNamePrefix="react-select"
                        styles={customStyles}
                        options={groupByOptions}
                        value={groupByOptions.find((o) => o.value === filters.groupBy) || groupByOptions[0]}
                        onChange={(sel) => setFilters((prev) => ({ ...prev, groupBy: sel?.value || "InvoiceWise" }))}
                        placeholder={t("Group By")}
                      />
                    </FormGroup>
                  </Col>
                </Row>

                <Row className="g-2">
                  <Col sm={2}>
                    <FormGroup className="mb-0">
                      <Label className="fw-medium mb-1 small">{t("Party")}</Label>
                      <Select
                        classNamePrefix="react-select"
                        styles={customStyles}
                        isClearable
                        isLoading={loadingParties}
                        options={partyOptions}
                        value={selectedParty}
                        onInputChange={(val, meta) => {
                          if (meta.action === "input-change") setPartyInput(val);
                          return val;
                        }}
                        onChange={(sel) => setSelectedParty(sel)}
                        placeholder={t("Search Party")}
                        noOptionsMessage={() =>
                          partyInput.length < 2 ? t("Type 2+ characters") : t("No options")
                        }
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
                </Row>
              </CardBody>
            </Card>
          )}

          {hasSearched && (
            <Card className="shadow-lg border-0 rounded-3 mb-4">
              <CardBody>
                <div ref={printRef}>
                  <div className="aging-company-header d-flex flex-column flex-lg-row justify-content-between align-items-start gap-3 mb-3">
                    <div className="aging-company-left d-flex align-items-start gap-3">
                      {companyLogoUrl ? (
                        <img
                          src={companyLogoUrl}
                          alt="Company Logo"
                          className="aging-company-logo"
                          style={{ maxWidth: "96px", maxHeight: "90px", objectFit: "contain" }}
                        />
                      ) : null}
                      <div className="small text-body" style={{ lineHeight: 1.8 }}>
                        <div className="fw-bold">{companyInfo.companyName || "-"}</div>
                        {companyInfo.companyAddress ? <div>{companyInfo.companyAddress}</div> : null}
                        {companyInfo.companyAddress1 ? <div>{companyInfo.companyAddress1}</div> : null}
                        {companyInfo.companyAddress2 ? <div>{companyInfo.companyAddress2}</div> : null}
                        {companyInfo.companyPhone ? <div><strong>{t("Tel")}:</strong> {companyInfo.companyPhone}</div> : null}
                        {companyInfo.companyEmail ? <div><strong>{t("Email")}:</strong> {companyInfo.companyEmail}</div> : null}
                      </div>
                    </div>

                    <div className="text-lg-end aging-company-right">
                      <div className="aging-print-title fw-bold fs-5 text-body">{t("Aging Report")}</div>
                      <div className="aging-print-meta text-muted small">
                        <strong>{t("From")}:</strong> {appliedDateRange.from || "-"}<br />
                        <strong>{t("To")}:</strong> {appliedDateRange.to || "-"}
                      </div>
                    </div>
                  </div>

                  <div className="d-flex justify-content-end mb-3">
                    <div className="small fw-semibold text-muted">
                      {t("Showing")}: {reportRows.length} {t("rows")} ·{" "}
                      {isInvoiceWise ? t("Group by Inv") : t("Group by Party")}
                    </div>
                  </div>

                  {reportRows.length === 0 ? (
                    <div className="text-center py-4 text-muted">{t("No data available.")}</div>
                  ) : (
                    <div className="table-responsive table-card" style={{ maxHeight: "620px", overflow: "auto" }}>
                      <table id="aging-report-table" className="table table-bordered table-hover table-sm align-middle mb-0">
                        <thead className="table-light" style={{ position: "sticky", top: 0, zIndex: 2 }}>
                          <tr>
                            {activeColumns.map((col) => (
                              <th key={col.key} className="text-center text-nowrap small fw-semibold">
                                {col.header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {isInvoiceWise
                            ? invoiceGrouped.map(({ party, rows, subtotal }) => (
                                <React.Fragment key={party}>
                                  <tr className="aging-party-header">
                                    <td
                                      colSpan={activeColumns.length}
                                      className="text-center fw-semibold"
                                    >
                                      {t("Party")}: {party}
                                    </td>
                                  </tr>
                                  {rows.map((item, idx) => (
                                    <tr key={`${party}-${idx}`}>
                                      {activeColumns.map((col) => (
                                        <td
                                          key={col.key}
                                          className={`text-nowrap small ${col.align === "right" ? "text-end" : "text-start"}`}
                                        >
                                          {renderCell(item, col)}
                                        </td>
                                      ))}
                                    </tr>
                                  ))}
                                  <tr className="aging-subtotal">
                                    {activeColumns.map((col, idx) => (
                                      <td
                                        key={`sub-${col.key}`}
                                        className={`text-nowrap small fw-semibold ${col.align === "right" || idx === 2 ? "text-end" : ""}`}
                                      >
                                        {idx === 2
                                          ? t("Total")
                                          : col.sum
                                            ? fmtFixed(subtotal[col.key] || 0)
                                            : ""}
                                      </td>
                                    ))}
                                  </tr>
                                </React.Fragment>
                              ))
                            : reportRows.map((item, idx) => (
                                <tr key={`party-${idx}`}>
                                  {activeColumns.map((col) => (
                                    <td
                                      key={col.key}
                                      className={`text-nowrap small ${col.align === "right" ? "text-end" : "text-start"}`}
                                    >
                                      {renderCell(item, col)}
                                    </td>
                                  ))}
                                </tr>
                              ))}

                          <tr className="aging-grand-total">
                            {activeColumns.map((col, idx) => (
                              <td
                                key={`grand-${col.key}`}
                                className={`text-nowrap small fw-bold ${col.align === "right" || idx === (isInvoiceWise ? 2 : 0) ? "text-end" : ""}`}
                              >
                                {idx === (isInvoiceWise ? 2 : 0)
                                  ? t("Grand Total")
                                  : col.sum
                                    ? fmtFixed(grandTotal[col.key] || 0)
                                    : ""}
                              </td>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}

                  {companyInfo.companyFooter ? (
                    <div className="aging-footer mt-3 text-muted small">{companyInfo.companyFooter}</div>
                  ) : null}
                </div>
              </CardBody>
            </Card>
          )}
        </Container>
      </div>
    </React.Fragment>
  );
};

export default SolitaireAgingReport;
