import React, { useCallback, useMemo, useRef, useState } from "react";
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
import { toast, ToastContainer } from "react-toastify";

import BreadCrumb from "../../../Components/Common/BreadCrumb";
import { exportToExcel } from "../../../helpers/excel_helper";
import { getSolitaireKapanSummaryReport } from "../../../helpers/fakebackend_helper";

const getRowVal = (row, ...keys) => {
  if (!row || typeof row !== "object") return "";

  // Exact key match (allow 0)
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(row, key) && row[key] !== undefined && row[key] !== null) {
      return row[key];
    }
  }

  // Case-insensitive fallback (handles oP_Pcs vs OP_Pcs from camelCase serializers)
  const entries = Object.entries(row);
  for (const key of keys) {
    const found = entries.find(([k]) => k.toLowerCase() === String(key).toLowerCase());
    if (found && found[1] !== undefined && found[1] !== null) return found[1];
  }

  return "";
};

const num = (row, ...keys) => {
  const v = getRowVal(row, ...keys);
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const fmt = (value, decimals) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return (0).toFixed(decimals);
  return n.toFixed(decimals);
};

const calcTotals = (kapan) => {
  const stockAmt = num(kapan, "Stock_Amount", "stock_Amount");
  const saleAmt = num(kapan, "Sale_Amount", "sale_Amount");
  const stockCrt = num(kapan, "Stock_Carats", "stock_Carats");
  const saleCrt = num(kapan, "Sale_Carats", "sale_Carats");

  const totalAmountSaleStock = stockAmt + saleAmt;
  const totalCarats = stockCrt + saleCrt;
  const totalAvgRate = totalCarats > 0 ? totalAmountSaleStock / totalCarats : 0;
  const totalAvgRapa = num(kapan, "Stock_AvgRapa", "stock_AvgRapa");
  const totalAvgBack = num(kapan, "Stock_AvgBack", "stock_AvgBack");

  return { totalAmountSaleStock, totalAvgRate, totalAvgRapa, totalAvgBack };
};

const SolitaireKapanSummaryReport = () => {
  const { t } = useTranslation();
  const printRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [reportRows, setReportRows] = useState([]);

  const [filters, setFilters] = useState({
    lotNo: "",
    filterType: ""
  });

  const handleClear = () => {
    setHasSearched(false);
    setReportRows([]);
    setFilters({ lotNo: "", filterType: "" });
  };

  const buildPayload = () => ({
    FromDate: null,
    ToDate: null,
    LotNo: filters.lotNo?.trim() ? filters.lotNo : null,
    FilterType: filters.filterType || null
  });

  const handleReport = async () => {
    setLoading(true);
    try {
      const response = await getSolitaireKapanSummaryReport(buildPayload());
      const ok = response?.success || response?.Success;
      if (ok) {
        setReportRows(response.Data || response.data || []);
        setHasSearched(true);
        toast.success(t("Report loaded successfully."));
      } else {
        toast.warning(response?.Message || response?.message || t("Failed to load report."));
      }
    } catch (err) {
      console.error("Kapan summary report failed:", err);
      const msg =
        typeof err === "string"
          ? err
          : err?.response?.data?.message || err?.response?.data?.Message || null;
      toast.error(msg || t("Server Connection Problem.."));
    } finally {
      setLoading(false);
    }
  };

  const handleExcel = useCallback(async () => {
    if (!reportRows.length) {
      toast.warning(t("No data available."));
      return;
    }

    const headers = ["", "Opening + Purchase", "StkTrn + Sale", "Stock", "Memo"];
    const rows = [];

    reportRows.forEach((kapan) => {
      const totals = calcTotals(kapan);
      const kapanNo = getRowVal(kapan, "KapanNo", "kapanNo") || "-";

      rows.push([`Kapan No: ${kapanNo}`, "", "", "", ""]);
      rows.push([
        "Pcs",
        num(kapan, "OP_Pcs"),
        num(kapan, "Sale_Pcs"),
        num(kapan, "Stock_Pcs"),
        num(kapan, "MemoOut_Pcs")
      ]);
      rows.push([
        "Carats",
        fmt(num(kapan, "OP_Carats"), 3),
        fmt(num(kapan, "Sale_Carats"), 3),
        fmt(num(kapan, "Stock_Carats"), 3),
        fmt(num(kapan, "MemoOut_Carats"), 3)
      ]);
      rows.push([
        "Amount",
        fmt(num(kapan, "OP_Amount"), 2),
        fmt(num(kapan, "Sale_Amount"), 2),
        fmt(num(kapan, "Stock_Amount"), 2),
        fmt(num(kapan, "MemoOut_Amount"), 2)
      ]);
      rows.push([
        "Avg Rate",
        fmt(num(kapan, "OP_AvgRate"), 2),
        fmt(num(kapan, "Sale_AvgRate"), 2),
        fmt(num(kapan, "Stock_AvgRate"), 2),
        fmt(num(kapan, "MemoOut_AvgRate"), 2)
      ]);
      rows.push([
        "Avg MRP",
        fmt(num(kapan, "OP_AvgRapa"), 2),
        fmt(num(kapan, "Sale_AvgRapa"), 2),
        fmt(num(kapan, "Stock_AvgRapa"), 2),
        fmt(num(kapan, "MemoOut_AvgRapa"), 2)
      ]);
      rows.push([
        "Avg Back",
        fmt(num(kapan, "OP_AvgBack"), 2),
        fmt(num(kapan, "Sale_AvgBack"), 2),
        fmt(num(kapan, "Stock_AvgBack"), 2),
        fmt(num(kapan, "MemoOut_AvgBack"), 2)
      ]);
      rows.push(["Amount Sale + Stock", fmt(totals.totalAmountSaleStock, 3), "", "", ""]);
      rows.push(["Total Avg Rate", fmt(totals.totalAvgRate, 2), "", "", ""]);
      rows.push(["Total Avg Rapa", fmt(totals.totalAvgRapa, 2), "", "", ""]);
      rows.push(["Total Avg Back", fmt(totals.totalAvgBack, 2), "", "", ""]);
      rows.push(["", "", "", "", ""]);
    });

    const res = await exportToExcel(headers, rows, "Kapan_Summary", "Kapan-Summary");
    if (!res?.success) toast.error(t("Excel export failed."));
  }, [reportRows, t]);

  const handlePrint = () => {
    const node = printRef.current;
    if (!node) return;

    const printWindow = window.open("", "", "height=1000,width=1200");
    if (!printWindow) {
      toast.warning(t("Please allow pop-ups to print."));
      return;
    }

    printWindow.document.write("<html><head><title>Kapan Summary Report</title>");
    document.querySelectorAll('link[rel="stylesheet"], style').forEach((style) => {
      printWindow.document.write(style.outerHTML);
    });
    printWindow.document.write(`
<style>
  @media print {
    @page { size: A4 landscape; margin: 8mm; }
    body { font-size: 11px; margin: 0; padding: 10px; color: #111; background: #fff; }
    .kapan-block { page-break-inside: avoid; margin-bottom: 16px; border: 1px solid #ddd !important; }
    .kapan-matrix { width: 100%; border-collapse: collapse; }
    .kapan-matrix th, .kapan-matrix td { border: 1px solid #ccc; padding: 6px 10px; }
    .kapan-matrix th { text-align: right; font-size: 10px; color: #666; background: #f3f3f3; }
    .kapan-matrix td { text-align: right; color: #555; font-weight: 500; }
    .kapan-matrix td:first-child, .kapan-matrix th:first-child { text-align: left; }
    .kapan-totals { border-top: 1px solid #ccc !important; background: #fafafa !important; }
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

  const matrixColumns = useMemo(
    () => [
      { key: "op", title: "Opening + Purchase" },
      { key: "sale", title: "StkTrn + Sale" },
      { key: "stock", title: "Stock" },
      { key: "memo", title: "Memo" }
    ],
    []
  );

  const matrixMetrics = useMemo(
    () => [
      {
        label: "Pcs",
        decimals: 0,
        keys: { op: ["OP_Pcs"], sale: ["Sale_Pcs"], stock: ["Stock_Pcs"], memo: ["MemoOut_Pcs"] }
      },
      {
        label: "Carats",
        decimals: 2,
        keys: { op: ["OP_Carats"], sale: ["Sale_Carats"], stock: ["Stock_Carats"], memo: ["MemoOut_Carats"] }
      },
      {
        label: "Amount",
        decimals: 3,
        keys: { op: ["OP_Amount"], sale: ["Sale_Amount"], stock: ["Stock_Amount"], memo: ["MemoOut_Amount"] }
      },
      {
        label: "Avg Rate",
        decimals: 2,
        keys: { op: ["OP_AvgRate"], sale: ["Sale_AvgRate"], stock: ["Stock_AvgRate"], memo: ["MemoOut_AvgRate"] }
      },
      {
        label: "Avg MRP",
        decimals: 2,
        keys: { op: ["OP_AvgRapa"], sale: ["Sale_AvgRapa"], stock: ["Stock_AvgRapa"], memo: ["MemoOut_AvgRapa"] }
      },
      {
        label: "Avg Back",
        decimals: 2,
        keys: { op: ["OP_AvgBack"], sale: ["Sale_AvgBack"], stock: ["Stock_AvgBack"], memo: ["MemoOut_AvgBack"] }
      }
    ],
    []
  );

  const formatCell = (kapan, metric, colKey) => {
    const value = num(kapan, ...(metric.keys[colKey] || []));
    return metric.decimals === 0 ? Math.round(value) : fmt(value, metric.decimals);
  };

  document.title = `${t("Kapan Summary Report")} | ${t("Reports")}`;

  return (
    <React.Fragment>
      <ToastContainer />
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title={t("Kapan Summary Report")} pageTitle={t("Reports")} />

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
                ? t("Kapan Summary Report Results")
                : t("Kapan Summary Report Filters")}
            </h5>
            <div className="d-flex gap-2 flex-wrap">
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
                  <Button
                    color="primary"
                    className="btn-sm rounded-2 px-3 py-1"
                    onClick={handlePrint}
                  >
                    <i className="ri-printer-line align-middle me-1"></i>
                    {t("Print")}
                  </Button>
                  <Button
                    color="success"
                    className="btn-sm rounded-2 px-3 py-1"
                    onClick={handleExcel}
                    disabled={!reportRows.length}
                  >
                    <i className="ri-file-excel-2-line align-middle me-1"></i>
                    {t("Excel")}
                  </Button>
                  <Button
                    color="primary"
                    className="btn-sm rounded-2 px-3 py-1"
                    onClick={() => {
                      setHasSearched(false);
                      setReportRows([]);
                    }}
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
                <Row className="g-3 align-items-center">
                  <Col md={3} sm={6}>
                    <FormGroup className="mb-0">
                      <Label className="fw-medium mb-1 small">{t("Enter Kapan No")}</Label>
                      <Input
                        type="textarea"
                        value={filters.lotNo}
                        onChange={(e) =>
                          setFilters((prev) => ({ ...prev, lotNo: e.target.value }))
                        }
                        placeholder={t("Search by kapan no")}
                        className="form-control-sm"
                        style={{ height: "140px", resize: "none" }}
                      />
                    </FormGroup>
                  </Col>
                  <Col md={4} sm={6}>
                    <div className="d-flex align-items-center gap-4" style={{ minHeight: "140px" }}>
                      <div className="form-check">
                        <Input
                          className="form-check-input"
                          type="radio"
                          name="kapanFilter"
                          id="radInclude"
                          checked={filters.filterType === "include"}
                          onChange={() =>
                            setFilters((prev) => ({ ...prev, filterType: "include" }))
                          }
                        />
                        <Label className="form-check-label fw-semibold" htmlFor="radInclude">
                          {t("Include")}
                        </Label>
                      </div>
                      <div className="form-check">
                        <Input
                          className="form-check-input"
                          type="radio"
                          name="kapanFilter"
                          id="radExclude"
                          checked={filters.filterType === "exclude"}
                          onChange={() =>
                            setFilters((prev) => ({ ...prev, filterType: "exclude" }))
                          }
                        />
                        <Label className="form-check-label fw-semibold" htmlFor="radExclude">
                          {t("Exclude")}
                        </Label>
                      </div>
                    </div>
                  </Col>
                </Row>
              </CardBody>
            </Card>
          )}

          {hasSearched && (
            <Card className="shadow-lg border-0 rounded-3 mb-4">
              <CardBody>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div className="small text-muted">
                    {t("Kapan Summary")} · {reportRows.length} {t("records")}
                  </div>
                </div>

                {reportRows.length === 0 ? (
                  <div className="text-center py-5 text-muted">{t("No data available.")}</div>
                ) : (
                  <div ref={printRef} id="kapan-summary-print" className="d-flex flex-column gap-2">
                    {reportRows.map((kapan, idx) => {
                      const kapanNo = getRowVal(kapan, "KapanNo", "kapanNo") || "-";
                      const totals = calcTotals(kapan);
                      return (
                        <div
                          key={`${kapanNo}-${idx}`}
                          className="kapan-block overflow-hidden rounded-2"
                          style={{
                            border: "1px solid var(--vz-border-color, #dee2e6)",
                            background: "var(--vz-card-bg, #fff)"
                          }}
                        >
                          {/* Section header */}
                          <div
                            className="d-flex flex-wrap align-items-center justify-content-between gap-2 px-2 py-1"
                            style={{
                              borderBottom: "1px solid var(--vz-border-color, #dee2e6)",
                              background: "rgba(var(--vz-primary-rgb), 0.04)"
                            }}
                          >
                            <div className="d-flex align-items-baseline gap-2">
                              <span
                                className="text-uppercase text-muted fw-medium mb-0"
                                style={{ letterSpacing: "0.05em", fontSize: "0.65rem" }}
                              >
                                {t("Kapan No")}
                              </span>
                              <span
                                className="fw-semibold mb-0"
                                style={{
                                  fontSize: "0.85rem",
                                  letterSpacing: "0.02em",
                                  color: "var(--vz-body-color)"
                                }}
                              >
                                {kapanNo}
                              </span>
                            </div>
                            <span
                              className="badge bg-soft-primary text-primary fw-medium"
                              style={{ fontSize: "0.65rem" }}
                            >
                              #{idx + 1}
                            </span>
                          </div>

                          {/* Comparison matrix */}
                          <div className="table-responsive">
                            <table
                              className="kapan-matrix mb-0"
                              style={{
                                width: "100%",
                                borderCollapse: "collapse",
                                border: "1px solid var(--vz-border-color, #dee2e6)"
                              }}
                            >
                              <thead>
                                <tr
                                  style={{
                                    background: "rgba(var(--vz-primary-rgb), 0.06)"
                                  }}
                                >
                                  <th
                                    style={{
                                      width: "18%",
                                      padding: "4px 8px",
                                      textAlign: "left",
                                      fontSize: "0.65rem",
                                      fontWeight: 600,
                                      letterSpacing: "0.03em",
                                      textTransform: "uppercase",
                                      color: "var(--vz-secondary-color, #878a99)",
                                      border: "1px solid var(--vz-border-color, #dee2e6)"
                                    }}
                                  >
                                    {t("Metric")}
                                  </th>
                                  {matrixColumns.map((col) => (
                                    <th
                                      key={col.key}
                                      style={{
                                        width: "20.5%",
                                        padding: "4px 8px",
                                        textAlign: "right",
                                        fontSize: "0.65rem",
                                        fontWeight: 600,
                                        letterSpacing: "0.02em",
                                        textTransform: "uppercase",
                                        color: "var(--vz-secondary-color, #878a99)",
                                        border: "1px solid var(--vz-border-color, #dee2e6)"
                                      }}
                                    >
                                      {t(col.title)}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {matrixMetrics.map((metric, mIdx) => (
                                  <tr
                                    key={metric.label}
                                    style={{
                                      background:
                                        mIdx % 2 === 0
                                          ? "var(--vz-card-bg, transparent)"
                                          : "rgba(var(--vz-primary-rgb), 0.025)"
                                    }}
                                  >
                                    <td
                                      style={{
                                        padding: "3px 8px",
                                        fontSize: "0.75rem",
                                        fontWeight: 500,
                                        color: "var(--vz-secondary-color, #878a99)",
                                        border: "1px solid var(--vz-border-color, #dee2e6)"
                                      }}
                                    >
                                      {t(metric.label)}
                                    </td>
                                    {matrixColumns.map((col) => (
                                      <td
                                        key={col.key}
                                        style={{
                                          padding: "3px 8px",
                                          textAlign: "right",
                                          fontSize: "0.75rem",
                                          fontWeight: 500,
                                          fontVariantNumeric: "tabular-nums",
                                          color: "var(--vz-secondary-color, #74788d)",
                                          border: "1px solid var(--vz-border-color, #dee2e6)"
                                        }}
                                      >
                                        {formatCell(kapan, metric, col.key)}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {/* Summary strip */}
                          <div
                            className="kapan-totals px-2 py-1"
                            style={{
                              borderTop: "1px solid var(--vz-border-color, #dee2e6)",
                              background: "rgba(var(--vz-primary-rgb), 0.035)"
                            }}
                          >
                            <Row className="g-1">
                              {[
                                {
                                  label: "Total Amount Sale + Stock",
                                  value: fmt(totals.totalAmountSaleStock, 3)
                                },
                                {
                                  label: "Total Avg Rate",
                                  value: fmt(totals.totalAvgRate, 2)
                                },
                                {
                                  label: "Total Avg Rapa",
                                  value: fmt(totals.totalAvgRapa, 2)
                                },
                                {
                                  label: "Total Avg Back",
                                  value: fmt(totals.totalAvgBack, 2)
                                }
                              ].map((item, tIdx) => (
                                <Col
                                  key={item.label}
                                  md={3}
                                  sm={6}
                                  style={
                                    tIdx > 0
                                      ? {
                                          borderLeft: "1px solid var(--vz-border-color, #dee2e6)"
                                        }
                                      : undefined
                                  }
                                  className={tIdx > 0 ? "ps-md-2" : ""}
                                >
                                  <div
                                    className="text-muted text-uppercase mb-0"
                                    style={{ fontSize: "0.58rem", letterSpacing: "0.04em" }}
                                  >
                                    {t(item.label)}
                                  </div>
                                  <div
                                    className="fw-medium"
                                    style={{
                                      fontSize: "0.8rem",
                                      fontVariantNumeric: "tabular-nums",
                                      color: "var(--vz-secondary-color, #74788d)",
                                      lineHeight: 1.2
                                    }}
                                  >
                                    {item.value}
                                  </div>
                                </Col>
                              ))}
                            </Row>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardBody>
            </Card>
          )}
        </Container>
      </div>
    </React.Fragment>
  );
};

export default SolitaireKapanSummaryReport;
