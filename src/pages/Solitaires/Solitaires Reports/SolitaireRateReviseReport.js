import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Card, CardBody, Col, Container, FormGroup, Input, Label, Row } from "reactstrap";
import Select from "react-select";

import { toast, ToastContainer } from "react-toastify";

import BreadCrumb from "../../../Components/Common/BreadCrumb";
import TableContainer from "../../../Components/Common/TableContainer";
import { exportToExcel } from "../../../helpers/excel_helper";
import {
  getSolitaireRateReviseDropdowns,
  getSolitaireRateReviseReport
} from "../../../helpers/fakebackend_helper";

const dashText = (value) => (value === null || value === undefined || value === "" ? "-" : String(value));

const fmtFixedOrZero = (value, decimals) => {
  const num = Number(value);
  if (value === null || value === undefined || value === "" || Number.isNaN(num)) return (0).toFixed(decimals);
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

const isTotalRow = (row) => String(getRowVal(row, "Date", "date")).toLowerCase().includes("total");

const formatLocalDate = (date) => {
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};



const SolitaireRateReviseReport = () => {
  const { t } = useTranslation();

  const todayYMD = useMemo(() => formatLocalDate(new Date()), []);

  const [dropdownData, setDropdownData] = useState({});
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);

  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [reportRows, setReportRows] = useState([]);

  const [filters, setFilters] = useState({
    fromDate: todayYMD,
    toDate: todayYMD,
    shape: [],
    size: [],
    color: [],
    clarity: [],
    proportion: [],
    polish: [],
    symmetry: [],
    lab: [],
    fluorescence: [],
    lotNo: ""
  });

  const customStyles = useMemo(
    () => ({
      control: (provided) => ({
        ...provided,
        backgroundColor: "var(--vz-secondary-bg, #fff)",
        borderColor: "var(--vz-border-color, #ced4da)",
        color: "var(--vz-body-color, #495057)",
        minHeight: "31px"
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
        ":active": { backgroundColor: "#3b5de7" }
      }),
      input: (provided) => ({ ...provided, color: "var(--vz-body-color, #495057)" }),
      placeholder: (provided) => ({
        ...provided,
        color: "var(--vz-secondary-color, #878a99)"
      }),
      singleValue: (provided) => ({ ...provided, color: "var(--vz-body-color, #495057)" }),
      multiValue: (provided) => ({ ...provided, backgroundColor: "transparent" }),
      indicatorsContainer: (provided) => ({ ...provided, color: "var(--vz-body-color, #495057)" })
    }),
    []
  );

  useEffect(() => {
    const loadDropdowns = async () => {
      setLoadingDropdowns(true);
      try {
        const res = await getSolitaireRateReviseDropdowns();
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

  const getOptions = useCallback(
    (dropdownKey) => {
      const list = dropdownData?.[dropdownKey] || [];
      return list.map((item) => ({
        value: item.id ?? item.ID ?? item.name ?? item.Name ?? "",
        label: String(item.name ?? item.Name ?? "").toUpperCase()
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

  const handleClear = () => {
    setHasSearched(false);
    setReportRows([]);
    setFilters({
      fromDate: todayYMD,
      toDate: todayYMD,
      shape: [],
      size: [],
      color: [],
      clarity: [],
      proportion: [],
      polish: [],
      symmetry: [],
      lab: [],
      fluorescence: [],
      lotNo: ""
    });
  };

  const handleReport = async () => {
    setLoading(true);
    try {
      const payload = {
        FromDate: filters.fromDate,
        ToDate: filters.toDate,
        LotNo: filters.lotNo,
        Shape: filters.shape,
        Color: filters.color,
        Clarity: filters.clarity,
        Size: filters.size,
        Proportion: filters.proportion,
        Polish: filters.polish,
        Symmetry: filters.symmetry,
        LAB: filters.lab,
        Fluorescence: filters.fluorescence
      };

      const response = await getSolitaireRateReviseReport(payload);
      const ok = response?.success || response?.Success;

      if (ok) {
        const data = response.Data || response.data || [];
        setReportRows(data);
        setHasSearched(true);
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

  const handleNewSearch = () => {
    setHasSearched(false);
    setReportRows([]);
  };

  const totals = useMemo(() => {
    let count = 0;
    let plSum = 0;

    reportRows.forEach((row) => {
      if (!isTotalRow(row)) {
        count += 1;
        plSum += Number(getRowVal(row, "PLAmount", "plAmount") || 0);
      }
    });

    return { count, plSum };
  }, [reportRows]);

  const columns = useMemo(
    () => [
      {
        header: t("DATE"),
        accessorKey: "Date",
        cell: ({ row }) => {
          const value = getRowVal(row.original, "Date", "date");
          return dashText(value);
        }
      },
      {
        header: t("LotNo"),
        accessorKey: "LotNo",
        cell: ({ row }) => {
          if (isTotalRow(row.original)) {
            const v = getRowVal(row.original, "TotalItems", "totalItems");
            return v === "" ? 0 : v;
          }
          return dashText(getRowVal(row.original, "LotNo", "lotNo"));
        }
      },
      {
        header: t("Carats"),
        accessorKey: "Carats",
        cell: ({ row }) => fmtFixedOrZero(getRowVal(row.original, "Carats", "carats"), 3)
      },
      {
        header: t("OldRate"),
        accessorKey: "OldRate",
        cell: ({ row }) => fmtFixedOrZero(getRowVal(row.original, "OldRate", "oldRate"), 2)
      },
      {
        header: t("NewRate"),
        accessorKey: "NewRate",
        cell: ({ row }) => fmtFixedOrZero(getRowVal(row.original, "NewRate", "newRate"), 2)
      },
      {
        header: t("Old%"),
        accessorKey: "OldPer",
        cell: ({ row }) => {
          return `${fmtFixedOrZero(getRowVal(row.original, "OldPer", "oldPer"), 2)}%`;
        }
      },
      {
        header: t("New%"),
        accessorKey: "NewPer",
        cell: ({ row }) => {
          return `${fmtFixedOrZero(getRowVal(row.original, "NewPer", "newPer"), 2)}%`;
        }
      },
      {
        header: t("PLAmount"),
        accessorKey: "PLAmount",
        cell: ({ row }) => fmtFixedOrZero(getRowVal(row.original, "PLAmount", "plAmount"), 3)
      },
      {
        header: t("UserName"),
        accessorKey: "UserName",
        cell: ({ row }) => {
          const value = getRowVal(row.original, "UserName", "userName");
          return dashText(value);
        }
      },
      {
        header: t("Shape"),
        accessorKey: "ShapeId",
        cell: ({ row }) => {
          const value = getRowVal(row.original, "ShapeId", "shapeId");
          return dashText(value);
        }
      },
      {
        header: t("Color"),
        accessorKey: "ColorId",
        cell: ({ row }) => {
          const value = getRowVal(row.original, "ColorId", "colorId");
          return dashText(value);
        }
      },
      {
        header: t("Clarity"),
        accessorKey: "ClarityId",
        cell: ({ row }) => {
          const value = getRowVal(row.original, "ClarityId", "clarityId");
          return dashText(value);
        }
      }
    ],
    [t]
  );

  const handleExcel = async () => {
    if (!reportRows || reportRows.length === 0) {
      toast.warning(t("No data available to export."));
      return;
    }

    const headers = [
      "Date",
      "LotNo",
      "Carats",
      "OldRate",
      "NewRate",
      "Old%",
      "New%",
      "PLAmount",
      "UserName",
      "Shape",
      "Color",
      "Clarity"
    ];

    const rows = reportRows.map((row) => [
      dashText(getRowVal(row, "Date", "date")),
      isTotalRow(row)
        ? (() => {
            const v = getRowVal(row, "TotalItems", "totalItems");
            return v === "" ? 0 : v;
          })()
        : getRowVal(row, "LotNo", "lotNo")
          ? String(getRowVal(row, "LotNo", "lotNo"))
          : "",
      fmtFixedOrZero(getRowVal(row, "Carats", "carats"), 3),
      fmtFixedOrZero(getRowVal(row, "OldRate", "oldRate"), 2),
      fmtFixedOrZero(getRowVal(row, "NewRate", "newRate"), 2),
      `${fmtFixedOrZero(getRowVal(row, "OldPer", "oldPer"), 2)}%`,
      `${fmtFixedOrZero(getRowVal(row, "NewPer", "newPer"), 2)}%`,
      fmtFixedOrZero(getRowVal(row, "PLAmount", "plAmount"), 3),
      dashText(getRowVal(row, "UserName", "userName")),
      dashText(getRowVal(row, "ShapeId", "shapeId")),
      dashText(getRowVal(row, "ColorId", "colorId")),
      dashText(getRowVal(row, "ClarityId", "clarityId"))
    ]);

    await exportToExcel(headers, rows, "Rate_Revise", "Rate-Revise");
  };

  document.title = `${t("Rate Revise Report")} | ${t("Reports")}`;

  return (
    <React.Fragment>
      <style>{`
        .rate-revise-total-row td {
          background:
            linear-gradient(
              90deg,
              rgba(var(--vz-primary-rgb, 64, 81, 137), 0.12) 0,
              rgba(var(--vz-primary-rgb, 64, 81, 137), 0.06) 14px,
              var(--vz-tertiary-bg, rgba(0,0,0,0.05)) 14px,
              var(--vz-tertiary-bg, rgba(0,0,0,0.05)) 100%
            ) !important;
          color: var(--vz-body-color, inherit) !important;
          font-weight: 600;
          border-top: 1px solid rgba(var(--vz-primary-rgb, 64, 81, 137), 0.18) !important;
          border-bottom: 1px solid rgba(var(--vz-primary-rgb, 64, 81, 137), 0.18) !important;
        }

        .rate-revise-total-row td:first-child {
          box-shadow: inset 4px 0 0 rgba(var(--vz-primary-rgb, 64, 81, 137), 0.55);
        }

        .rate-revise-total-row:hover td {
          background:
            linear-gradient(
              90deg,
              rgba(var(--vz-primary-rgb, 64, 81, 137), 0.16) 0,
              rgba(var(--vz-primary-rgb, 64, 81, 137), 0.08) 14px,
              color-mix(in srgb, var(--vz-tertiary-bg, #f8f9fa) 88%, var(--vz-primary, #405189) 12%) 100%
            ) !important;
        }

        .rate-revise-total-row td:empty::before {
          content: "-";
          color: var(--vz-secondary-color, #878a99);
          font-weight: 500;
        }
      `}</style>
      <ToastContainer />

      <div className="page-content">
        <Container fluid>
          <BreadCrumb title={t("Rate Revise Report")} pageTitle={t("Reports")} />

          <div className="card stock-search-header-bar d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between mb-3 p-3 rounded-3 shadow-sm border gap-2">
            <h5 className="mb-0 fw-bold text-primary d-flex align-items-center gap-2">
              <i className={hasSearched ? "ri-database-2-line fs-20 text-primary" : "ri-search-eye-line fs-20 text-primary"}></i>
              {hasSearched ? t("Rate Revise Report Results") : t("Rate Revise Report Filters")}
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

          {!hasSearched && (
            <Card className="shadow-lg border-0 rounded-3 mb-4">
              <CardBody className="bg-light-subtle">
                <Row className="g-3 mb-3">
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

                      <Col lg={2} md={4} sm={6}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1">{t("Shape")}</Label>
                          <Select
                            isMulti
                            options={getOptions("shape")}
                            value={getOptions("shape").filter((o) => filters.shape.includes(o.value))}
                            onChange={(sel) => handleMultiChange("shape", sel)}
                            isLoading={loadingDropdowns}
                            classNamePrefix="react-select"
                            styles={customStyles}
                            placeholder={t("Shape")}
                          />
                        </FormGroup>
                      </Col>

                      <Col lg={2} md={4} sm={6}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1">{t("Color")}</Label>
                          <Select
                            isMulti
                            options={getOptions("color")}
                            value={getOptions("color").filter((o) => filters.color.includes(o.value))}
                            onChange={(sel) => handleMultiChange("color", sel)}
                            isLoading={loadingDropdowns}
                            classNamePrefix="react-select"
                            styles={customStyles}
                            placeholder={t("Color")}
                          />
                        </FormGroup>
                      </Col>

                      <Col lg={2} md={4} sm={6}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1">{t("Clarity")}</Label>
                          <Select
                            isMulti
                            options={getOptions("clarity")}
                            value={getOptions("clarity").filter((o) => filters.clarity.includes(o.value))}
                            onChange={(sel) => handleMultiChange("clarity", sel)}
                            isLoading={loadingDropdowns}
                            classNamePrefix="react-select"
                            styles={customStyles}
                            placeholder={t("Clarity")}
                          />
                        </FormGroup>
                      </Col>

                      <Col lg={2} md={4} sm={6}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1">{t("Size")}</Label>
                          <Select
                            isMulti
                            options={getOptions("size")}
                            value={getOptions("size").filter((o) => filters.size.includes(o.value))}
                            onChange={(sel) => handleMultiChange("size", sel)}
                            isLoading={loadingDropdowns}
                            classNamePrefix="react-select"
                            styles={customStyles}
                            placeholder={t("Size")}
                          />
                        </FormGroup>
                      </Col>
                    </Row>

                    <Row className="g-3">
                      <Col lg={2} md={4} sm={6}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1">{t("Prop.")}</Label>
                          <Select
                            isMulti
                            options={getOptions("proportion")}
                            value={getOptions("proportion").filter((o) => filters.proportion.includes(o.value))}
                            onChange={(sel) => handleMultiChange("proportion", sel)}
                            isLoading={loadingDropdowns}
                            classNamePrefix="react-select"
                            styles={customStyles}
                            placeholder={t("Proportion")}
                          />
                        </FormGroup>
                      </Col>

                      <Col lg={2} md={4} sm={6}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1">{t("Polish")}</Label>
                          <Select
                            isMulti
                            options={getOptions("polish")}
                            value={getOptions("polish").filter((o) => filters.polish.includes(o.value))}
                            onChange={(sel) => handleMultiChange("polish", sel)}
                            isLoading={loadingDropdowns}
                            classNamePrefix="react-select"
                            styles={customStyles}
                            placeholder={t("Polish")}
                          />
                        </FormGroup>
                      </Col>

                      <Col lg={2} md={4} sm={6}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1">{t("Sym.")}</Label>
                          <Select
                            isMulti
                            options={getOptions("symmetry")}
                            value={getOptions("symmetry").filter((o) => filters.symmetry.includes(o.value))}
                            onChange={(sel) => handleMultiChange("symmetry", sel)}
                            isLoading={loadingDropdowns}
                            classNamePrefix="react-select"
                            styles={customStyles}
                            placeholder={t("Symmetry")}
                          />
                        </FormGroup>
                      </Col>

                      <Col lg={2} md={4} sm={6}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1">{t("LAB")}</Label>
                          <Select
                            isMulti
                            options={getOptions("lab")}
                            value={getOptions("lab").filter((o) => filters.lab.includes(o.value))}
                            onChange={(sel) => handleMultiChange("lab", sel)}
                            isLoading={loadingDropdowns}
                            classNamePrefix="react-select"
                            styles={customStyles}
                            placeholder={t("LAB")}
                          />
                        </FormGroup>
                      </Col>

                      <Col lg={2} md={4} sm={6}>
                        <FormGroup className="mb-0">
                          <Label className="fw-medium mb-1">{t("Fluorescence")}</Label>
                          <Select
                            isMulti
                            options={getOptions("fluorescence")}
                            value={getOptions("fluorescence").filter((o) => filters.fluorescence.includes(o.value))}
                            onChange={(sel) => handleMultiChange("fluorescence", sel)}
                            isLoading={loadingDropdowns}
                            classNamePrefix="react-select"
                            styles={customStyles}
                            placeholder={t("Fluorescence")}
                          />
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
                        rows={7}
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

          {hasSearched && (
            <Card className="shadow-lg border-0 rounded-3 mb-4">
              <CardBody>
                <div className="d-flex justify-content-end gap-4 mb-3 small fw-semibold">
                  <span>{t("Total")}:</span>
                  <span>
                    {t("Items")}: {totals.count}
                  </span>
                  <span>
                    {t("PL Amount")}: {totals.plSum.toFixed(2)}
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
                    getRowClass={(row) => (isTotalRow(row.original) ? "rate-revise-total-row" : "")}
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

export default SolitaireRateReviseReport;

