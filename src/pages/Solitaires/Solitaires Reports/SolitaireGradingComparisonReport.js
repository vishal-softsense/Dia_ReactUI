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
import TableContainer from "../../../Components/Common/TableContainer";
import { exportToExcel } from "../../../helpers/excel_helper";
import {
  getSolitaireGradingComparisonDropdowns,
  getSolitaireGradingComparisonReport
} from "../../../helpers/fakebackend_helper";

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

// Returns "-" for empty string, null or undefined; otherwise returns value as-is
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
    color: [],
    clarity: [],
    size: [],
    proportion: [],
    polish: [],
    symmetry: [],
    lab: [],
    fluorescence: [],
    lotNo: ""
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

  const handleClear = () => {
    setHasSearched(false);
    setReportRows([]);
    setFilters({
      fromDate: todayYMD,
      toDate: todayYMD,
      shape: [],
      color: [],
      clarity: [],
      size: [],
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
        Shape: filters.shape,
        Color: filters.color,
        Clarity: filters.clarity,
        Size: filters.size,
        Proportion: filters.proportion,
        Polish: filters.polish,
        Symmetry: filters.symmetry,
        LAB: filters.lab,
        Fluorescence: filters.fluorescence,
        LotNo: filters.lotNo
      };

      const response = await getSolitaireGradingComparisonReport(payload);
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
  };

  const footerTotals = useMemo(() => {
    let caratTotal = 0;
    let amtTotal = 0;

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
        cell: ({ row }) => <CompareCell value={getRowVal(row.original, "rate", "Rate")} decimals={2} align="right" />,
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
        cell: ({ row }) => <CompareCell value={getRowVal(row.original, "amount", "Amount")} decimals={2} align="right" />,
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
        cell: ({ row }) => <CompareCell value={getRowVal(row.original, "msp", "MSP")} decimals={2} align="right" />
      },
      {
        header: t("Back"),
        accessorKey: "back",
        cell: ({ row }) => <CompareCell value={getRowVal(row.original, "back", "Back")} decimals={2} align="right" />
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
    [t]
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
              <i className={hasSearched ? "ri-database-2-line fs-20 text-primary" : "ri-search-eye-line fs-20 text-primary"}></i>
              {hasSearched ? t("Grading Comparison Report Results") : t("Grading Comparison Report Filters")}
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

          {hasSearched && (
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
