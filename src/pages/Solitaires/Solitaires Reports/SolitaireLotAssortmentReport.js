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
  Row,
  Table
} from "reactstrap";
import { toast, ToastContainer } from "react-toastify";

import BreadCrumb from "../../../Components/Common/BreadCrumb";
import { exportToExcel } from "../../../helpers/excel_helper";
import { getSolitaireLotAssortmentReport } from "../../../helpers/fakebackend_helper";

const getRowVal = (row, ...keys) => {
  if (!row || typeof row !== "object") return "";
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(row, key) && row[key] !== undefined && row[key] !== null) {
      return row[key];
    }
  }
  const entries = Object.entries(row);
  for (const key of keys) {
    const found = entries.find(([k]) => k.toLowerCase() === String(key).toLowerCase());
    if (found && found[1] !== undefined && found[1] !== null) return found[1];
  }
  return "";
};

const dashText = (value) =>
  value === null || value === undefined || value === "" ? "-" : String(value);

const num = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const fmt = (value, decimals = 2) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return (0).toFixed(decimals);
  return n.toFixed(decimals);
};

const parseLotList = (raw) =>
  String(raw || "")
    .split(/[\s,]+/)
    .map((l) => l.trim())
    .filter(Boolean);

const buildLotTableModel = (rows, caratDecimal = 2, amtDecimal = 2) => {
  const data = [...(rows || [])].sort((a, b) => {
    const shapeA = String(getRowVal(a, "Shape", "shape") ?? "");
    const shapeB = String(getRowVal(b, "Shape", "shape") ?? "");
    const colorA = String(getRowVal(a, "Color", "color") ?? "");
    const colorB = String(getRowVal(b, "Color", "color") ?? "");
    const sizeA = String(getRowVal(a, "Size", "size") ?? "");
    const sizeB = String(getRowVal(b, "Size", "size") ?? "");
    if (shapeA !== shapeB) return shapeA.localeCompare(shapeB);
    if (colorA !== colorB) return colorA.localeCompare(colorB);
    return sizeA.localeCompare(sizeB);
  });

  const grouped = {};
  data.forEach((item) => {
    const shape = getRowVal(item, "Shape", "shape");
    const color = getRowVal(item, "Color", "color");
    const size = getRowVal(item, "Size", "size");
    const key = `${shape}|${color}|${size}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(item);
  });

  let grandTotalCarats = 0;
  let grandTotalAmount = 0;
  Object.values(grouped).forEach((items) => {
    items.forEach((i) => {
      grandTotalCarats += num(getRowVal(i, "Carats", "carats"));
      grandTotalAmount += num(getRowVal(i, "AmountCl", "amountCl"));
    });
  });

  const groups = Object.keys(grouped).map((key) => {
    const items = grouped[key];
    let subtotalCarats = 0;
    let subtotalAmount = 0;
    items.forEach((i) => {
      subtotalCarats += num(getRowVal(i, "Carats", "carats"));
      subtotalAmount += num(getRowVal(i, "AmountCl", "amountCl"));
    });

    const shape = getRowVal(items[0], "Shape", "shape");
    const color = getRowVal(items[0], "Color", "color");
    const size = getRowVal(items[0], "Size", "size");
    const groupPctOfGrand =
      grandTotalCarats > 0 ? Math.round((subtotalCarats / grandTotalCarats) * 100) : 0;
    const subtotalRate = subtotalCarats > 0 ? subtotalAmount / subtotalCarats : 0;

    const detailRows = items.map((i) => {
      const carats = num(getRowVal(i, "Carats", "carats"));
      const amount = num(getRowVal(i, "AmountCl", "amountCl"));
      const rate = num(getRowVal(i, "Rate", "rate"));
      const purityPct = subtotalCarats > 0 ? Math.round((carats / subtotalCarats) * 100) : 0;
      return {
        toLotNo: getRowVal(i, "ToLotNo", "toLotNo"),
        shape,
        color,
        size,
        clarity: getRowVal(i, "Clarity", "clarity"),
        purityPct,
        carats,
        rate,
        amount,
        caratsFmt: fmt(carats, caratDecimal),
        rateFmt: fmt(rate, amtDecimal),
        amountFmt: fmt(amount, amtDecimal)
      };
    });

    return {
      key,
      shape,
      color,
      size,
      detailRows,
      groupPctOfGrand,
      subtotalCarats,
      subtotalRate,
      subtotalAmount,
      subtotalCaratsFmt: fmt(subtotalCarats, caratDecimal),
      subtotalRateFmt: fmt(subtotalRate, amtDecimal),
      subtotalAmountFmt: fmt(subtotalAmount, amtDecimal)
    };
  });

  const grandTotalRate = grandTotalCarats > 0 ? grandTotalAmount / grandTotalCarats : 0;

  return {
    groups,
    grandTotalCarats,
    grandTotalRate,
    grandTotalAmount,
    grandTotalCaratsFmt: fmt(grandTotalCarats, caratDecimal),
    grandTotalRateFmt: fmt(grandTotalRate, amtDecimal),
    grandTotalAmountFmt: fmt(grandTotalAmount, amtDecimal)
  };
};

const SolitaireLotAssortmentReport = () => {
  const { t } = useTranslation();
  const printRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [lotGroups, setLotGroups] = useState([]);
  const [filters, setFilters] = useState({ lotNo: "" });

  const caratDecimal = 2;
  const amtDecimal = 2;

  const lotModels = useMemo(
    () =>
      (lotGroups || []).map((lotItem) => {
        const lotNo = getRowVal(lotItem, "LotNo", "lotNo") || "Unknown";
        const rows = getRowVal(lotItem, "Data", "data") || [];
        const list = Array.isArray(rows) ? rows : [];
        return {
          lotNo,
          hasData: list.length > 0,
          model: list.length ? buildLotTableModel(list, caratDecimal, amtDecimal) : null
        };
      }),
    [lotGroups, caratDecimal, amtDecimal]
  );

  const handleClear = () => {
    setHasSearched(false);
    setLotGroups([]);
    setFilters({ lotNo: "" });
  };

  const buildPayload = () => ({
    FLotList: parseLotList(filters.lotNo)
  });

  const handleReport = async () => {
    setLoading(true);
    try {
      const response = await getSolitaireLotAssortmentReport(buildPayload());
      const ok = response?.success || response?.Success;
      if (ok) {
        const data = response.Data || response.data || [];
        setLotGroups(data);
        setHasSearched(true);
        if (!data.length) toast.warning(t("No records found."));
        else toast.success(t("Report loaded successfully."));
      } else {
        toast.warning(response?.Message || response?.message || t("Failed to load report."));
      }
    } catch (err) {
      console.error("Lot assortment report failed:", err);
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
    if (!lotModels.length) {
      toast.warning(t("No data available."));
      return;
    }

    const headers = [
      t("Lot No"),
      t("Shape"),
      t("Color"),
      t("Size"),
      t("Clarity"),
      t("Purity %"),
      t("Carats"),
      t("Rate"),
      t("Amount")
    ];
    const rows = [];

    lotModels.forEach(({ lotNo, hasData, model }, idx) => {
      rows.push([`Lot No: ${lotNo}`, "", "", "", "", "", "", "", ""]);
      if (!hasData || !model) {
        rows.push([t("No data available."), "", "", "", "", "", "", "", ""]);
      } else {
        model.groups.forEach((g) => {
          rows.push([
            `Group : ${dashText(g.shape)} | ${dashText(g.color)} | ${dashText(g.size)}`,
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            ""
          ]);
          g.detailRows.forEach((r) => {
            rows.push([
              dashText(r.toLotNo),
              dashText(r.shape),
              dashText(r.color),
              dashText(r.size),
              dashText(r.clarity),
              `${r.purityPct}%`,
              r.caratsFmt,
              r.rateFmt,
              r.amountFmt
            ]);
          });
          rows.push([
            t("Total:"),
            "",
            "",
            "",
            "",
            `${g.groupPctOfGrand}%`,
            g.subtotalCaratsFmt,
            g.subtotalRateFmt,
            g.subtotalAmountFmt
          ]);
        });
        rows.push([
          t("Grand Total:"),
          "",
          "",
          "",
          "",
          "",
          model.grandTotalCaratsFmt,
          model.grandTotalRateFmt,
          model.grandTotalAmountFmt
        ]);
      }
      if (idx < lotModels.length - 1) {
        rows.push(["", "", "", "", "", "", "", "", ""]);
      }
    });

    const res = await exportToExcel(headers, rows, "LotAssortmentReport", "Lot-Assortment-Report");
    if (!res?.success) toast.error(t("Excel export failed."));
  }, [lotModels, t]);

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

    printWindow.document.write("<html><head><title>Lot Assortment Report</title>");
    document.querySelectorAll('link[rel="stylesheet"], style').forEach((style) => {
      printWindow.document.write(style.outerHTML);
    });
    printWindow.document.write(`
<style>
  @media print {
    @page { size: A4 portrait; margin: 8mm; }
    body {
      font-size: 11px;
      margin: 0;
      padding: 8px;
      color: #111;
      background: #fff;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .lot-block { page-break-inside: avoid; margin-bottom: 18px; }
    table { width: 100%; border-collapse: collapse !important; }
    th, td { border: 1px solid #ccc !important; padding: 4px 6px !important; }
    th { background: #f3f3f3 !important; }
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

  document.title = `${t("Lot Assortment Report")} | ${t("Reports")}`;

  return (
    <React.Fragment>
      <ToastContainer />
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title={t("Lot Assortment Report")} pageTitle={t("Reports")} />

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
                ? t("Lot Assortment Report Results")
                : t("Lot Assortment Report Filters")}
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
                  <Button color="primary" className="btn-sm rounded-2 px-3 py-1" onClick={handlePrint}>
                    <i className="ri-printer-line align-middle me-1"></i>
                    {t("Print")}
                  </Button>
                  <Button
                    color="success"
                    className="btn-sm rounded-2 px-3 py-1"
                    onClick={handleExcel}
                    disabled={!lotModels.length}
                  >
                    <i className="ri-file-excel-2-line align-middle me-1"></i>
                    {t("Excel")}
                  </Button>
                  <Button
                    color="primary"
                    className="btn-sm rounded-2 px-3 py-1"
                    onClick={() => {
                      setHasSearched(false);
                      setLotGroups([]);
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
                <Row className="g-3">
                  <Col md={3} sm={6}>
                    <FormGroup className="mb-0">
                      <Label className="fw-medium mb-1 small text-uppercase">
                        {t("Enter From Lot No")}
                      </Label>
                      <Input
                        type="textarea"
                        value={filters.lotNo}
                        onChange={(e) =>
                          setFilters((prev) => ({ ...prev, lotNo: e.target.value }))
                        }
                        placeholder={t("Search by lot no")}
                        className="form-control-sm"
                        style={{ height: "140px", resize: "none" }}
                      />
                      <div className="form-text small text-muted mt-1">
                        {t("Leave blank to load all lots. Separate multiple lots by space, comma, or new line.")}
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
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div className="small text-muted">
                    {t("Lot Assortment")} · {lotModels.length} {t("lots")}
                  </div>
                </div>

                {lotModels.length === 0 ? (
                  <div className="text-center py-5 text-muted">{t("No data available.")}</div>
                ) : (
                  <div ref={printRef} id="lot-assortment-print" className="d-flex flex-column gap-3">
                    {lotModels.map(({ lotNo, hasData, model }, idx) => (
                      <div
                        key={`${lotNo}-${idx}`}
                        className="lot-block overflow-hidden rounded-2"
                        style={{
                          border: "1px solid var(--vz-border-color, #dee2e6)",
                          background: "var(--vz-card-bg, #fff)"
                        }}
                      >
                        <div
                          className="d-flex flex-wrap align-items-center justify-content-between gap-2 px-3 py-2"
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
                              {t("Lot No")}
                            </span>
                            <span className="fw-semibold mb-0" style={{ fontSize: "0.95rem" }}>
                              {lotNo}
                            </span>
                          </div>
                        </div>

                        <div className="p-2">
                          {!hasData || !model ? (
                            <div className="text-center text-danger py-3">
                              {t("No data available for Lot")} {lotNo}.
                            </div>
                          ) : (
                            <div className="table-responsive">
                              <Table
                                bordered
                                hover
                                size="sm"
                                className="mb-0 align-middle"
                                style={{ fontSize: "0.8rem" }}
                              >
                                <thead style={{ background: "var(--vz-light, #f3f6f9)" }}>
                                  <tr>
                                    <th className="text-center">{t("Lot No")}</th>
                                    <th className="text-center">{t("Shape")}</th>
                                    <th className="text-center">{t("Color")}</th>
                                    <th className="text-center">{t("Size")}</th>
                                    <th className="text-center">{t("Clarity")}</th>
                                    <th className="text-center">{t("Purity %")}</th>
                                    <th className="text-end">{t("Carats")}</th>
                                    <th className="text-end">{t("Rate")}</th>
                                    <th className="text-end">{t("Amount")}</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {model.groups.map((g) => (
                                    <React.Fragment key={g.key}>
                                      <tr style={{ background: "rgba(0,0,0,0.03)" }}>
                                        <td
                                          colSpan={9}
                                          className="text-center fw-semibold py-2"
                                        >
                                          {t("Group")}&nbsp;:&nbsp;{dashText(g.shape)} |{" "}
                                          {dashText(g.color)} | {dashText(g.size)}
                                        </td>
                                      </tr>
                                      {g.detailRows.map((r, rIdx) => (
                                        <tr key={`${g.key}-row-${rIdx}`}>
                                          <td className="text-center">{dashText(r.toLotNo)}</td>
                                          <td className="text-center">{dashText(r.shape)}</td>
                                          <td className="text-center">{dashText(r.color)}</td>
                                          <td className="text-center">{dashText(r.size)}</td>
                                          <td className="text-center">{dashText(r.clarity)}</td>
                                          <td className="text-end">{r.purityPct}%</td>
                                          <td className="text-end">{r.caratsFmt}</td>
                                          <td className="text-end">{r.rateFmt}</td>
                                          <td className="text-end">{r.amountFmt}</td>
                                        </tr>
                                      ))}
                                      <tr className="fw-semibold">
                                        <td className="text-center">{t("Total:")}</td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                        <td className="text-end">{g.groupPctOfGrand}%</td>
                                        <td className="text-end">{g.subtotalCaratsFmt}</td>
                                        <td className="text-end">{g.subtotalRateFmt}</td>
                                        <td className="text-end">{g.subtotalAmountFmt}</td>
                                      </tr>
                                    </React.Fragment>
                                  ))}
                                  <tr
                                    className="fw-bold"
                                    style={{ background: "rgba(0,0,0,0.06)" }}
                                  >
                                    <td className="text-center">{t("Grand Total:")}</td>
                                    <td></td>
                                    <td></td>
                                    <td></td>
                                    <td></td>
                                    <td></td>
                                    <td className="text-end">{model.grandTotalCaratsFmt}</td>
                                    <td className="text-end">{model.grandTotalRateFmt}</td>
                                    <td className="text-end">{model.grandTotalAmountFmt}</td>
                                  </tr>
                                </tbody>
                              </Table>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
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

export default SolitaireLotAssortmentReport;
