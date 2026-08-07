import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  Card,
  CardBody,
  Col,
  Container,
  FormGroup,
  Label,
  Row,
  Modal,
  ModalHeader,
  ModalBody,
  Table
} from "reactstrap";
import Select from "react-select";
import { toast, ToastContainer } from "react-toastify";

import BreadCrumb from "../../../Components/Common/BreadCrumb";
import { useSettingReportDates } from "../../../Components/Hooks/useSettingReportDates";
import {
  getSolitaireFastMovingReport,
  getSolitaireFastMovingDisplay,
  getSolitaireFastMovingDropdowns
} from "../../../helpers/fakebackend_helper";
import {
  getCachedReportCompany,
  getReportCompanySettings,
  REPORT_COMPANY_SETTINGS_EVENT
} from "../../../helpers/reportCompanyDefaults";

const dashText = (value) =>
  value === null || value === undefined || value === "" ? "-" : String(value);

const fmtFixed = (value, decimals = 2) => {
  if (value === null || value === undefined || value === "" || Number.isNaN(Number(value)))
    return (0).toFixed(decimals);
  return Number(value).toFixed(decimals);
};

const SolitaireFastMovingReport = () => {
  const { t } = useTranslation();
  const printRef = useRef(null);
  const { fromDate, toDate, getDates, mergeDates } = useSettingReportDates();

  const [loadingDropdowns, setLoadingDropdowns] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [reportRows, setReportRows] = useState([]);
  const [dropdownData, setDropdownData] = useState({});
  const [companyInfo, setCompanyInfo] = useState(() => getCachedReportCompany());

  // Filters State matching SolitaireSaleReport array pattern
  const [filters, setFilters] = useState({
    fromDate: "2025-01-01",
    toDate: new Date().toISOString().substring(0, 10),
    shape: [],
    size: [],
    proportion: [],
    polish: [],
    symmetry: [],
    lab: [],
    fluorescence: []
  });

  // Modal Details State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalColor, setModalColor] = useState("");
  const [modalClarity, setModalClarity] = useState("");
  const [detailRows, setDetailRows] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const caratDecimal = 3;
  const amtDecimal = 2;

  // React Select Custom Styles matching SolitaireSaleReport
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
    (key) => {
      const list = dropdownData?.[key] || [];
      return list.map((item) => ({
        value: item.id ?? item.ID ?? item.name ?? item.Name ?? "",
        label: String(item.name ?? item.Name ?? item.id ?? item.ID ?? "").toUpperCase()
      }));
    },
    [dropdownData]
  );

  // Load Dropdowns
  useEffect(() => {
    const loadDropdowns = async () => {
      setLoadingDropdowns(true);
      try {
        const res = await getSolitaireFastMovingDropdowns();
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

  // Load Company Defaults
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

    return () => {
      window.removeEventListener(REPORT_COMPANY_SETTINGS_EVENT, handleCompanyRefresh);
    };
  }, []);

  // Update default dates from hook
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      fromDate: fromDate || prev.fromDate,
      toDate: toDate || prev.toDate
    }));
  }, [fromDate, toDate]);

  const handleMultiChange = (name, selected) => {
    setFilters((prev) => ({
      ...prev,
      [name]: selected ? selected.map((x) => x.value) : []
    }));
  };

  const handleClear = async () => {
    const d = await getDates();
    setFilters({
      fromDate: d.fromDate || "2025-01-01",
      toDate: d.toDate || new Date().toISOString().substring(0, 10),
      shape: [],
      size: [],
      proportion: [],
      polish: [],
      symmetry: [],
      lab: [],
      fluorescence: []
    });
    setReportRows([]);
    setHasSearched(false);
  };

  const buildPayload = () => ({
    FromDate: filters.fromDate,
    ToDate: filters.toDate,
    Shape: filters.shape,
    Size: filters.size,
    Proportion: filters.proportion,
    Polish: filters.polish,
    Symmetry: filters.symmetry,
    LAB: filters.lab,
    Fluorescence: filters.fluorescence
  });

  const handleReport = async () => {
    setLoading(true);
    try {
      const response = await getSolitaireFastMovingReport(buildPayload());
      const ok = response?.success || response?.Success;
      if (ok) {
        const data = response.Data || response.data || [];
        setReportRows(data);
        setHasSearched(true);
        if (!data.length) toast.info(t("No records found."));
        else toast.success(t("Report loaded successfully."));
      } else {
        toast.warning(response?.Message || response?.message || t("Failed to load report."));
      }
    } catch (err) {
      console.error("Fast Moving Report failed:", err);
      toast.error(t("Server Connection Problem.."));
    } finally {
      setLoading(false);
    }
  };

  // Case-insensitive / format-insensitive JSON property retrieval
  const getPropVal = useCallback((item, baseKey) => {
    if (!item) return 0;
    if (item[baseKey] !== undefined && item[baseKey] !== null) return item[baseKey];
    
    // Camel case check: "Opening_Pcs" -> "opening_Pcs"
    const camel = baseKey.charAt(0).toLowerCase() + baseKey.slice(1);
    if (item[camel] !== undefined && item[camel] !== null) return item[camel];

    // Lowercase check: "Opening_Pcs" -> "opening_pcs"
    const lower = baseKey.toLowerCase();
    if (item[lower] !== undefined && item[lower] !== null) return item[lower];

    return 0;
  }, []);

  // Extract Clarities and Colors from Data (case-insensitive)
  const clarities = useMemo(() => {
    const list = reportRows.map((x) => x.clarityName || x.ClarityName || x.clarityname);
    return [...new Set(list)].filter(Boolean);
  }, [reportRows]);

  const colors = useMemo(() => {
    const list = reportRows.map((x) => x.colorName || x.ColorName || x.colorname);
    return [...new Set(list)].filter(Boolean);
  }, [reportRows]);

  const metrics = ["Opening", "Purchase", "Sale", "Closing"];

  // Helper to fetch cell values for the grid matrix (casing immune)
  const getCellValues = useCallback((color, clarity, metric) => {
    const item = reportRows.find(
      (x) =>
        (x.colorName || x.ColorName || x.colorname) === color &&
        (x.clarityName || x.ClarityName || x.clarityname) === clarity
    );
    if (!item) return { pcs: 0, pcsper: 0, Age: 0, usdPerCts: 0, discPct: 0 };

    return {
      pcs: Number(getPropVal(item, `${metric}_Pcs`)),
      pcsper: Number(getPropVal(item, `${metric}_pcsper`)),
      Age: Number(getPropVal(item, `${metric}_Age_Total`)),
      usdPerCts: Number(getPropVal(item, `${metric}_USDperCts`)),
      discPct: Number(getPropVal(item, `${metric}_DiscPct`))
    };
  }, [reportRows, getPropVal]);

  // Highlighting comparison helper
  const getCellHighlight = useCallback((color, clarity, metric, valKey, currentVal) => {
    if (metric === "Closing") {
      const ref = getCellValues(color, clarity, "Opening");
      const previousVal = ref[valKey];
      if (currentVal > previousVal) return "fastmoving-bg-success text-white";
      if (currentVal < previousVal) return "fastmoving-bg-danger text-white";
    } else if (metric === "Sale") {
      const ref = getCellValues(color, clarity, "Purchase");
      const previousVal = ref[valKey];
      if (currentVal > previousVal) return "fastmoving-bg-success text-white";
      if (currentVal < previousVal) return "fastmoving-bg-danger text-white";
    }
    return "";
  }, [getCellValues]);

  // Modal Cell Click Details
  const handleCellClick = async (color, clarity) => {
    setModalColor(color);
    setModalClarity(clarity);
    setModalOpen(true);
    setLoadingDetails(true);

    try {
      const payload = {
        ...buildPayload(),
        Color: [color],
        Clarity: [clarity]
      };
      const res = await getSolitaireFastMovingDisplay(payload);
      if (res?.success || res?.Success) {
        setDetailRows(res.Data || res.data || []);
      } else {
        setDetailRows([]);
      }
    } catch (err) {
      console.error(err);
      toast.error(t("Failed to load details"));
    } finally {
      setLoadingDetails(false);
    }
  };

  // Format Dates
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    let d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    let month = ("0" + (d.getMonth() + 1)).slice(-2);
    let day = ("0" + d.getDate()).slice(-2);
    return `${day}-${month}-${d.getFullYear()}`;
  };

  // Custom XML/XLS Excel Export matching MVC style with colors
  const handleExcelExport = () => {
    const table = document.getElementById("FastMovingReportT");
    if (!table) {
      toast.warning(t("No report to export!"));
      return;
    }

    let excelHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office"
            xmlns:x="urn:schemas-microsoft-com:office:excel">
      <head>
        <meta charset="UTF-8">
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Fast Moving Report</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
      </head>
      <body>
        <table border="1">
    `;

    table.querySelectorAll("tr").forEach((tr) => {
      excelHtml += "tr" === tr.tagName.toLowerCase() ? "<tr>" : "";
      tr.querySelectorAll("th, td").forEach((cell) => {
        const tag = cell.tagName.toLowerCase();
        let bg = "";
        if (cell.classList.contains("fastmoving-bg-success")) bg = "#437643";
        else if (cell.classList.contains("fastmoving-bg-danger")) bg = "#ff4d4d";
        else bg = window.getComputedStyle(cell).backgroundColor;

        const rowspan = cell.getAttribute("rowspan") ? `rowspan="${cell.getAttribute("rowspan")}"` : "";
        const colspan = cell.getAttribute("colspan") ? `colspan="${cell.getAttribute("colspan")}"` : "";

        excelHtml += `<${tag} ${rowspan} ${colspan} style="background:${bg};padding:4px;text-align:center;">${cell.innerHTML}</${tag}>`;
      });
      excelHtml += "</tr>";
    });

    excelHtml += "</table></body></html>";

    const blob = new Blob([excelHtml], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "FastMovingReport.xls";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Print Report
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

    printWindow.document.write("<html><head><title>Fast Moving Report</title>");
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
          .table-responsive {
            max-height: none !important;
            overflow: visible !important;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
            border: 1px solid #888 !important;
          }
          th, td {
            border: 1px solid #888 !important;
            padding: 4px 6px !important;
          }
          .fastmoving-bg-success { background-color: #437643 !important; color: white !important; }
          .fastmoving-bg-danger { background-color: #ff4d4d !important; color: white !important; }
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

  // Render Subtable for Modal Detail view
  const renderDetailSubTable = (trnType, title) => {
    const rows = detailRows.filter((x) => x.trnType === trnType || x.TrnType === trnType);
    if (!rows.length) {
      return (
        <div className="mb-4">
          <h6 className="text-muted fw-bold">{title}</h6>
          <p className="text-center py-2 fs-12 text-muted">{t("No Records Found")}</p>
        </div>
      );
    }

    const totalPcs = rows.reduce((sum, r) => sum + Number(r.pcs || r.Pcs || 0), 0);
    const totalCarats = rows.reduce((sum, r) => sum + Number(r.carats || r.Carats || 0), 0);
    const totalAmount = rows.reduce((sum, r) => sum + Number(r.amount || r.Amount || 0), 0);

    return (
      <div className="mb-4">
        <h6 className="fw-bold">{title}</h6>
        <div className="table-responsive">
          <Table className="table-sm table-bordered mb-0 align-middle text-center fs-11">
            <thead className="table-light">
              <tr>
                <th>Date</th>
                <th>Lot No</th>
                <th>Clarity</th>
                <th>Pcs</th>
                <th>Age</th>
                <th>Carats</th>
                <th>MRP</th>
                <th>Disc</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td>{formatDate(r.sPdate || r.spdate || r.SPdate)}</td>
                  <td>{r.lotNo || r.LotNo}</td>
                  <td>{r.clarityName || r.ClarityName}</td>
                  <td className="text-end">{r.pcs || r.Pcs}</td>
                  <td className="text-end">{r.age || r.Age}</td>
                  <td className="text-end">{fmtFixed(r.carats || r.Carats, caratDecimal)}</td>
                  <td className="text-end">{fmtFixed(r.mrp || r.MRP, amtDecimal)}</td>
                  <td className="text-end">{fmtFixed(r.disc || r.Disc, 2)}</td>
                  <td className="text-end">{fmtFixed(r.amount || r.Amount, amtDecimal)}</td>
                </tr>
              ))}
              <tr className="table-light fw-bold">
                <td colSpan="3">Total</td>
                <td className="text-end">{totalPcs}</td>
                <td></td>
                <td className="text-end">{fmtFixed(totalCarats, caratDecimal)}</td>
                <td></td>
                <td></td>
                <td className="text-end">{fmtFixed(totalAmount, amtDecimal)}</td>
              </tr>
            </tbody>
          </Table>
        </div>
      </div>
    );
  };

  document.title = t("Fast Moving Report");

  return (
    <React.Fragment>
      <ToastContainer />
      <style>{`
        .fastmoving-bg-success {
          background-color: #437643 !important;
          color: white !important;
        }
        .fastmoving-bg-danger {
          background-color: #ff4d4d !important;
          color: white !important;
        }
        .detailCell:hover {
          opacity: 0.8;
          border: 1px solid #111;
        }
        #FastMovingReportT thead th {
          position: sticky !important;
          z-index: 10;
          background-color: var(--vz-secondary-bg, #f3f6f9) !important;
          color: var(--vz-body-color, #495057) !important;
          border-color: var(--vz-border-color, #ced4da) !important;
        }
        #FastMovingReportT thead tr:nth-child(1) th {
          top: 0 !important;
          height: 38px !important;
        }
        #FastMovingReportT thead tr:nth-child(2) th {
          top: 38px !important;
          height: 32px !important;
        }
      `}</style>
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title={t("Fast Moving Report")} pageTitle={t("Reports")} />

          {/* Header Bar matching SolitaireSaleReport */}
          <div className="card stock-search-header-bar d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between mb-3 p-3 rounded-3 shadow-sm border gap-2">
            <h5 className="mb-0 fw-bold text-primary d-flex align-items-center gap-2">
              <i className={hasSearched ? "ri-database-2-line fs-20 text-primary" : "ri-search-eye-line fs-20 text-primary"}></i>
              {hasSearched ? t("Fast Moving Results") : t("Fast Moving Filters")}
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
                    }}
                    disabled={loading}
                  >
                    {t("New Search")}
                  </Button>
                  <Button color="success" className="btn-sm rounded-2 px-3 py-1" onClick={handleExcelExport} disabled={reportRows.length === 0}>
                    {t("Excel")}
                  </Button>
                  <Button color="info" className="btn-sm rounded-2 px-3 py-1" onClick={handlePrint} disabled={reportRows.length === 0}>
                    {t("Print")}
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Filters Card matching SolitaireSaleReport Layout */}
          {!hasSearched && (
            <Card className="shadow-lg border-0 rounded-3 mb-4">
              <CardBody className="bg-light-subtle">
                <Row className="g-3">
                  <Col md={12}>
                    <Row className="g-2 mb-2">
                      <Col sm={2}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1 small">{t("From Date")}</Label>
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
                          <Label className="fw-medium mb-1 small">{t("Shape")}</Label>
                          <Select
                            classNamePrefix="react-select"
                            styles={customStyles}
                            isMulti
                            isClearable
                            isLoading={loadingDropdowns}
                            options={getOptions("shape")}
                            value={getOptions("shape").filter((o) => filters.shape.includes(o.value))}
                            onChange={(sel) => handleMultiChange("shape", sel)}
                            placeholder={t("Select Shape")}
                          />
                        </FormGroup>
                      </Col>

                      <Col sm={2}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1 small">{t("Size")}</Label>
                          <Select
                            classNamePrefix="react-select"
                            styles={customStyles}
                            isMulti
                            isClearable
                            isLoading={loadingDropdowns}
                            options={getOptions("size")}
                            value={getOptions("size").filter((o) => filters.size.includes(o.value))}
                            onChange={(sel) => handleMultiChange("size", sel)}
                            placeholder={t("Select Size")}
                          />
                        </FormGroup>
                      </Col>

                      <Col sm={2}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1 small">{t("Prop.")}</Label>
                          <Select
                            classNamePrefix="react-select"
                            styles={customStyles}
                            isMulti
                            isClearable
                            isLoading={loadingDropdowns}
                            options={getOptions("proportion")}
                            value={getOptions("proportion").filter((o) => filters.proportion.includes(o.value))}
                            onChange={(sel) => handleMultiChange("proportion", sel)}
                            placeholder={t("Select Prop.")}
                          />
                        </FormGroup>
                      </Col>

                      <Col sm={2}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1 small">{t("Polish")}</Label>
                          <Select
                            classNamePrefix="react-select"
                            styles={customStyles}
                            isMulti
                            isClearable
                            isLoading={loadingDropdowns}
                            options={getOptions("polish")}
                            value={getOptions("polish").filter((o) => filters.polish.includes(o.value))}
                            onChange={(sel) => handleMultiChange("polish", sel)}
                            placeholder={t("Select Polish")}
                          />
                        </FormGroup>
                      </Col>
                    </Row>

                    <Row className="g-2">
                      <Col sm={2}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1 small">{t("Symmetry")}</Label>
                          <Select
                            classNamePrefix="react-select"
                            styles={customStyles}
                            isMulti
                            isClearable
                            isLoading={loadingDropdowns}
                            options={getOptions("symmetry")}
                            value={getOptions("symmetry").filter((o) => filters.symmetry.includes(o.value))}
                            onChange={(sel) => handleMultiChange("symmetry", sel)}
                            placeholder={t("Select Symmetry")}
                          />
                        </FormGroup>
                      </Col>

                      <Col sm={2}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1 small">{t("Flou.")}</Label>
                          <Select
                            classNamePrefix="react-select"
                            styles={customStyles}
                            isMulti
                            isClearable
                            isLoading={loadingDropdowns}
                            options={getOptions("fluorescence")}
                            value={getOptions("fluorescence").filter((o) => filters.fluorescence.includes(o.value))}
                            onChange={(sel) => handleMultiChange("fluorescence", sel)}
                            placeholder={t("Select Flou.")}
                          />
                        </FormGroup>
                      </Col>

                      <Col sm={2}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1 small">{t("LAB")}</Label>
                          <Select
                            classNamePrefix="react-select"
                            styles={customStyles}
                            isMulti
                            isClearable
                            isLoading={loadingDropdowns}
                            options={getOptions("lab")}
                            value={getOptions("lab").filter((o) => filters.lab.includes(o.value))}
                            onChange={(sel) => handleMultiChange("lab", sel)}
                            placeholder={t("Select LAB")}
                          />
                        </FormGroup>
                      </Col>
                    </Row>
                  </Col>
                </Row>
              </CardBody>
            </Card>
          )}

          {/* Pivot Table Display Card */}
          {hasSearched && reportRows.length > 0 && (
            <Card className="shadow-lg border-0 rounded-3">
              <CardBody className="p-4">
                <div ref={printRef} className="table-responsive" style={{ maxHeight: "65vh" }}>
                  <Table
                    id="FastMovingReportT"
                    className="table-bordered align-middle text-center mb-0"
                    style={{ minWidth: "1200px" }}
                  >
                    <thead className="table-light sticky-top" style={{ zIndex: 5 }}>
                      <tr>
                        <th style={{ minWidth: "120px", backgroundColor: "var(--vz-secondary-bg)", color: "var(--vz-body-color)" }}>Clarity / Color</th>
                        <th style={{ backgroundColor: "var(--vz-secondary-bg)", color: "var(--vz-body-color)" }}>Metric</th>
                        {clarities.map((clarity, idx) => (
                          <th
                            key={idx}
                            colSpan="5"
                            className="fs-12"
                            style={{
                              backgroundColor: idx % 2 === 0 ? "var(--vz-light, #f1f3f6)" : "var(--vz-secondary-bg, #ffffff)",
                              color: "var(--vz-body-color)"
                            }}
                          >
                            {clarity}
                          </th>
                        ))}
                      </tr>
                      <tr className="fs-10">
                        <th style={{ backgroundColor: "var(--vz-secondary-bg)", color: "var(--vz-body-color)" }}></th>
                        <th style={{ backgroundColor: "var(--vz-secondary-bg)", color: "var(--vz-body-color)" }}></th>
                        {clarities.map((_, idx) => {
                          const bg = idx % 2 === 0 ? "var(--vz-light, #f1f3f6)" : "var(--vz-secondary-bg, #ffffff)";
                          return (
                            <React.Fragment key={idx}>
                              <th style={{ backgroundColor: bg, color: "var(--vz-body-color)" }}>Pcs</th>
                              <th style={{ backgroundColor: bg, color: "var(--vz-body-color)" }}>%</th>
                              <th style={{ backgroundColor: bg, color: "var(--vz-body-color)" }}>Age</th>
                              <th style={{ backgroundColor: bg, color: "var(--vz-body-color)" }}>
                                {companyInfo.stockSymbol || "$"}/Cts
                              </th>
                              <th style={{ backgroundColor: bg, color: "var(--vz-body-color)" }}>Dis%</th>
                            </React.Fragment>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody className="fs-11">
                      {colors.map((color, colorIdx) => (
                        <React.Fragment key={colorIdx}>
                          {/* Color Row Header */}
                          <tr className="table-light border-bottom-3">
                            <td
                              colSpan={2 + clarities.length * 5}
                              className="text-start fw-bold fs-6 ps-3 py-1 cursor-pointer"
                              style={{ backgroundColor: "var(--vz-light, #f3f6f9)", color: "var(--vz-body-color)" }}
                            >
                              {color}
                            </td>
                          </tr>

                          {/* 4 Rows per color */}
                          {metrics.map((metric, metricIdx) => (
                            <tr key={metricIdx}>
                              {metricIdx === 0 ? (
                                <td
                                  rowSpan={4}
                                  className="fw-bold align-middle border-end"
                                  style={{ backgroundColor: "var(--vz-secondary-bg)", color: "var(--vz-body-color)" }}
                                >
                                  {color}
                                </td>
                              ) : null}
                              <td
                                className="fw-semibold text-muted text-start ps-2 border-end"
                                style={{ backgroundColor: "var(--vz-secondary-bg)", color: "var(--vz-body-color)" }}
                              >
                                {metric}
                              </td>

                              {clarities.map((clarity, clarityIdx) => {
                                const { pcs, pcsper, Age, usdPerCts, discPct } = getCellValues(
                                  color,
                                  clarity,
                                  metric
                                );

                                // Get highlights
                                const highlightPcs = getCellHighlight(
                                  color,
                                  clarity,
                                  metric,
                                  "pcs",
                                  pcs
                                );
                                const highlightPcsPer = getCellHighlight(
                                  color,
                                  clarity,
                                  metric,
                                  "pcsper",
                                  pcsper
                                );
                                const highlightAge = getCellHighlight(
                                  color,
                                  clarity,
                                  metric,
                                  "Age",
                                  Age
                                );
                                const highlightUsd = getCellHighlight(
                                  color,
                                  clarity,
                                  metric,
                                  "usdPerCts",
                                  usdPerCts
                                );
                                const highlightDisc = getCellHighlight(
                                  color,
                                  clarity,
                                  metric,
                                  "discPct",
                                  discPct
                                );

                                const bgCol =
                                  clarityIdx % 2 === 0 ? "var(--vz-light, #f8f9fa)" : "var(--vz-secondary-bg, #ffffff)";

                                const cellStyle = {
                                  cursor: "pointer",
                                  backgroundColor: bgCol,
                                  color: "var(--vz-body-color)"
                                };

                                return (
                                  <React.Fragment key={clarityIdx}>
                                    <td
                                      onClick={() => handleCellClick(color, clarity)}
                                      className={`${highlightPcs} detailCell`}
                                      style={cellStyle}
                                    >
                                      {pcs}
                                    </td>
                                    <td
                                      onClick={() => handleCellClick(color, clarity)}
                                      className={`${highlightPcsPer} detailCell`}
                                      style={cellStyle}
                                    >
                                      {pcsper}%
                                    </td>
                                    <td
                                      onClick={() => handleCellClick(color, clarity)}
                                      className={`${highlightAge} detailCell`}
                                      style={cellStyle}
                                    >
                                      {Age}
                                    </td>
                                    <td
                                      onClick={() => handleCellClick(color, clarity)}
                                      className={`${highlightUsd} detailCell`}
                                      style={cellStyle}
                                    >
                                      {fmtFixed(usdPerCts, amtDecimal)}
                                    </td>
                                    <td
                                      onClick={() => handleCellClick(color, clarity)}
                                      className={`${highlightDisc} detailCell`}
                                      style={cellStyle}
                                    >
                                      {fmtFixed(discPct, 2)}%
                                    </td>
                                  </React.Fragment>
                                );
                              })}
                            </tr>
                          ))}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Modal for detail view */}
          <Modal
            isOpen={modalOpen}
            toggle={() => setModalOpen(!modalOpen)}
            className="modal-xl modal-dialog-centered"
          >
            <ModalHeader toggle={() => setModalOpen(!modalOpen)} className="bg-light">
              {t("Fast Moving Details")} &nbsp;- &nbsp;
              <span className="text-primary fw-bold">Color</span>: {modalColor} &nbsp;|&nbsp;
              <span className="text-primary fw-bold">Clarity</span>: {modalClarity}
            </ModalHeader>
            <ModalBody style={{ maxHeight: "75vh", overflowY: "auto" }}>
              {loadingDetails ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">{t("Loading...")}</span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className="fs-12 text-muted fw-semibold">
                      {t("Date range:")} {formatDate(filters.fromDate)} {t("to")}{" "}
                      {formatDate(filters.toDate)}
                    </span>
                  </div>

                  {renderDetailSubTable("Opening", "Opening")}
                  {renderDetailSubTable("PUR", "Purchase")}
                  {renderDetailSubTable("SALE", "Sale")}
                  {renderDetailSubTable("Closing", "Closing")}
                </>
              )}
            </ModalBody>
          </Modal>
        </Container>
      </div>
    </React.Fragment>
  );
};

export default SolitaireFastMovingReport;
