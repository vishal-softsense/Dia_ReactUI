import React, { useMemo, useState } from "react";
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

import BreadCrumb from "../../../../Components/Common/BreadCrumb";
import TableContainer from "../../../../Components/Common/TableContainer";
import {
  getSolitaireHoldUnholdReport,
  postSolitaireHoldUnholdAction
} from "../../../../helpers/fakebackend_helper";

const todayIso = () => {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
};

const fmtFixed = (value, decimals) => {
  if (value === null || value === undefined || value === "" || Number.isNaN(Number(value)))
    return (0).toFixed(decimals);
  return Number(value).toFixed(decimals);
};

const getRowVal = (row, ...keys) => {
  if (!row) return "";
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && row[key] !== "") return row[key];
  }
  const map = {};
  Object.keys(row).forEach((k) => {
    map[String(k).toLowerCase()] = row[k];
  });
  for (const key of keys) {
    const v = map[String(key).toLowerCase()];
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return "";
};

/** Match holdres.js createdRow CurStatus colors. */
const getStatusRowClass = (status) => {
  switch (status) {
    case "M":
      return "hold-status-M";
    case "LAB":
      return "hold-status-LAB";
    case "I":
      return "hold-status-I";
    case "L":
      return "hold-status-L";
    case "PS":
      return "hold-status-PS";
    case "Sold":
      return "hold-status-Sold";
    case "PH":
      return "hold-status-PH";
    case "MI":
      return "hold-status-MI";
    default:
      return "";
  }
};

const SHOW_OPTIONS = [
  { value: "All", label: "All" },
  { value: "Sold", label: "Sold" },
  { value: "Unsold", label: "Unsold" }
];

const HOLD_OPTIONS = [
  { value: "All", label: "All" },
  { value: "Hold", label: "Hold" },
  { value: "Unhold", label: "Unhold" }
];

const STONE_OPTIONS = [
  { value: "Single", label: "Single" },
  { value: "Parcel", label: "Parcel" },
  { value: "All", label: "All" }
];

const STATUS_OPTIONS = [
  { value: "All", label: "All" },
  { value: "OnHand", label: "OnHand" },
  { value: "OnMemo", label: "OnMemo" },
  { value: "OnHand&Int.Memo", label: "OnHand&Int.Memo" },
  { value: "OnHand + Memo In", label: "OnHand + Memo In" },
  { value: "OnHand + Party Hold", label: "OnHand + Party Hold" },
  { value: "Memo In", label: "Memo In" },
  { value: "Party Hold", label: "Party Hold" },
  { value: "All - Party Hold", label: "All - Party Hold" }
];

const DEFAULT_FILTERS = {
  show: "Unsold",
  holdUnHold: "Unhold",
  stoneTypes: "All",
  status: "All",
  lotNo: ""
};

const MediaLink = ({ href, icon, title }) => {
  if (!href) {
    return (
      <span className="text-muted opacity-50 px-1" title={title}>
        <i className={icon} />
      </span>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary px-1"
      title={title}
    >
      <i className={icon} />
    </a>
  );
};

const SolitaireHoldUnholdReport = () => {
  const { t } = useTranslation();

  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [reportRows, setReportRows] = useState([]);
  const [selectedLots, setSelectedLots] = useState(() => new Set());
  const [filters, setFilters] = useState({ ...DEFAULT_FILTERS });

  const buildPayload = () => ({
    Date: todayIso(),
    Show: filters.show || "Unsold",
    HoldUnHold: filters.holdUnHold || "Unhold",
    StoneTypes: filters.stoneTypes || "All",
    Status: filters.status || "All",
    LotNo: filters.lotNo || null
  });

  const handleReport = async ({ silent = false } = {}) => {
    setLoading(true);
    try {
      const response = await getSolitaireHoldUnholdReport(buildPayload());
      const ok = response?.success || response?.Success;
      if (ok) {
        setReportRows(response.Data || response.data || []);
        setSelectedLots(new Set());
        setHasSearched(true);
        if (!silent) toast.success(t("Report loaded successfully."));
      } else {
        toast.warning(response?.Message || response?.Data || t("Failed to load report."));
      }
    } catch (err) {
      console.error("Hold/Unhold report request failed:", err);
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
    setSelectedLots(new Set());
  };

  const handleClear = () => {
    setFilters({ ...DEFAULT_FILTERS });
    setReportRows([]);
    setSelectedLots(new Set());
    setHasSearched(false);
  };

  const toggleLot = (lotNo, checked) => {
    if (!lotNo) return;
    setSelectedLots((prev) => {
      const next = new Set(prev);
      if (checked) next.add(lotNo);
      else next.delete(lotNo);
      return next;
    });
  };

  const allLots = useMemo(
    () =>
      reportRows
        .map((r) => String(getRowVal(r, "LotNo", "lotNo") || ""))
        .filter((x) => x),
    [reportRows]
  );

  const allSelected = allLots.length > 0 && allLots.every((lot) => selectedLots.has(lot));

  const toggleSelectAll = (checked) => {
    if (checked) setSelectedLots(new Set(allLots));
    else setSelectedLots(new Set());
  };

  const runHoldRestore = async (type) => {
    const lots = Array.from(selectedLots).filter((x) => x);
    if (lots.length === 0) {
      toast.error(t("Please Select Stone"));
      return;
    }

    const lotNumbersString = lots.map((lot) => `'${lot}'`).join(",");
    setActionLoading(true);
    try {
      const response = await postSolitaireHoldUnholdAction({
        LotNo: lotNumbersString,
        Type: type
      });
      const ok = response?.success || response?.Success;
      if (ok) {
        toast.success(type === "hold" ? t("Successfully Hold") : t("Successfully Restore"));
        setSelectedLots(new Set());
        await handleReport({ silent: true });
      } else {
        toast.error(response?.Data || response?.Message || t("Hold/Restore failed."));
      }
    } catch (err) {
      console.error("Hold/Restore failed:", err);
      const msg =
        typeof err === "string"
          ? err
          : err?.response?.data?.message || err?.response?.data?.Message || err?.response?.data?.Data || null;
      toast.error(msg || t("Server Connection Problem.."));
    } finally {
      setActionLoading(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        id: "select",
        header: () => (
          <Input
            type="checkbox"
            className="form-check-input"
            checked={allSelected}
            onChange={(e) => toggleSelectAll(e.target.checked)}
          />
        ),
        enableColumnFilter: false,
        enableSorting: false,
        cell: ({ row }) => {
          const lotNo = String(getRowVal(row.original, "LotNo", "lotNo") || "");
          return (
            <Input
              type="checkbox"
              className="form-check-input"
              checked={selectedLots.has(lotNo)}
              onChange={(e) => toggleLot(lotNo, e.target.checked)}
            />
          );
        }
      },
      {
        id: "media",
        header: t("Media"),
        enableColumnFilter: false,
        enableSorting: false,
        cell: ({ row }) => {
          const r = row.original;
          const imagePath = getRowVal(r, "ImagePath", "imagePath");
          const videoPath = getRowVal(r, "VideoPath", "videoPath");
          const viewPath = getRowVal(r, "view", "View", "PagePath", "pagePath");
          return (
            <div className="d-flex align-items-center justify-content-center">
              <MediaLink href={imagePath} icon="ri-camera-line fs-15" title={t("Image")} />
              <MediaLink href={videoPath} icon="ri-video-line fs-15" title={t("Video")} />
              <MediaLink href={viewPath} icon="ri-eye-line fs-15" title={t("View")} />
            </div>
          );
        }
      },
      {
        header: t("Status"),
        accessorKey: "CurStatus",
        accessorFn: (row) => getRowVal(row, "CurStatus", "curStatus"),
        enableColumnFilter: true,
        filterFn: "includesString",
        cell: ({ getValue }) => String(getValue() || "")
      },
      {
        header: t("LotNo"),
        accessorKey: "LotNo",
        accessorFn: (row) => getRowVal(row, "LotNo", "lotNo"),
        enableColumnFilter: true,
        filterFn: "includesString"
      },
      {
        header: t("Shp"),
        accessorKey: "Shape",
        accessorFn: (row) => getRowVal(row, "Shape", "shape"),
        enableColumnFilter: true,
        filterFn: "includesString"
      },
      {
        header: t("Col"),
        accessorKey: "Color",
        accessorFn: (row) => getRowVal(row, "Color", "color"),
        enableColumnFilter: true,
        filterFn: "includesString"
      },
      {
        header: t("Cla"),
        accessorKey: "Clarity",
        accessorFn: (row) => getRowVal(row, "Clarity", "clarity"),
        enableColumnFilter: true,
        filterFn: "includesString"
      },
      {
        header: t("Cts"),
        accessorKey: "Carats",
        accessorFn: (row) => getRowVal(row, "Carats", "carats"),
        enableColumnFilter: true,
        filterFn: "includesString",
        className: "text-end",
        cell: ({ getValue }) => fmtFixed(getValue(), 3)
      },
      {
        header: t("MRP"),
        accessorKey: "Rapa",
        accessorFn: (row) => getRowVal(row, "Rapa", "rapa"),
        enableColumnFilter: true,
        filterFn: "includesString",
        className: "text-end",
        cell: ({ getValue }) => fmtFixed(getValue(), 2)
      },
      {
        header: t("Rate"),
        accessorKey: "Rate",
        accessorFn: (row) => getRowVal(row, "Rate", "rate"),
        enableColumnFilter: true,
        filterFn: "includesString",
        className: "text-end",
        cell: ({ getValue }) => fmtFixed(getValue(), 2)
      },
      {
        header: t("Back"),
        accessorKey: "Back",
        accessorFn: (row) => getRowVal(row, "Back", "back"),
        enableColumnFilter: true,
        filterFn: "includesString",
        className: "text-end",
        cell: ({ getValue }) => fmtFixed(getValue(), 2)
      },
      {
        header: t("Amount"),
        accessorKey: "Amount",
        accessorFn: (row) => getRowVal(row, "Amount", "amount"),
        enableColumnFilter: true,
        filterFn: "includesString",
        className: "text-end",
        cell: ({ getValue }) => fmtFixed(getValue(), 2)
      },
      {
        header: t("Prop"),
        accessorKey: "Prop",
        accessorFn: (row) => getRowVal(row, "Prop", "prop"),
        enableColumnFilter: true,
        filterFn: "includesString"
      },
      {
        header: t("Pol"),
        accessorKey: "Pol",
        accessorFn: (row) => getRowVal(row, "Pol", "pol"),
        enableColumnFilter: true,
        filterFn: "includesString"
      },
      {
        header: t("Sym"),
        accessorKey: "Sym",
        accessorFn: (row) => getRowVal(row, "Sym", "sym"),
        enableColumnFilter: true,
        filterFn: "includesString"
      },
      {
        header: t("FL"),
        accessorKey: "FL",
        accessorFn: (row) => getRowVal(row, "FL", "fl"),
        enableColumnFilter: true,
        filterFn: "includesString"
      },
      {
        header: t("Diam"),
        accessorKey: "Diam",
        accessorFn: (row) => getRowVal(row, "Diam", "diam"),
        enableColumnFilter: true,
        filterFn: "includesString"
      },
      {
        header: t("MRP Amount"),
        accessorKey: "MRPAmount",
        accessorFn: (row) => getRowVal(row, "MRPAmount", "mrpAmount"),
        enableColumnFilter: true,
        filterFn: "includesString",
        className: "text-end",
        cell: ({ getValue }) => fmtFixed(getValue(), 2)
      },
      {
        header: t("Asking Back"),
        accessorKey: "AskingBack",
        accessorFn: (row) => getRowVal(row, "AskingBack", "askingBack"),
        enableColumnFilter: true,
        filterFn: "includesString",
        className: "text-end",
        cell: ({ getValue }) => fmtFixed(getValue(), 2)
      },
      {
        header: t("Asking Rate"),
        accessorKey: "AskingRate",
        accessorFn: (row) => getRowVal(row, "AskingRate", "askingRate"),
        enableColumnFilter: true,
        filterFn: "includesString",
        className: "text-end",
        cell: ({ getValue }) => fmtFixed(getValue(), 2)
      },
      {
        header: t("Asking Amount"),
        accessorKey: "AskingAmount",
        accessorFn: (row) => getRowVal(row, "AskingAmount", "askingAmount"),
        enableColumnFilter: true,
        filterFn: "includesString",
        className: "text-end",
        cell: ({ getValue }) => fmtFixed(getValue(), 2)
      },
      {
        header: t("LAB"),
        accessorKey: "LAB",
        accessorFn: (row) => getRowVal(row, "LAB", "lab"),
        enableColumnFilter: true,
        filterFn: "includesString"
      },
      {
        header: t("CNo"),
        accessorKey: "CNo",
        accessorFn: (row) => getRowVal(row, "CNo", "cNo"),
        enableColumnFilter: true,
        filterFn: "includesString"
      },
      {
        header: t("HA"),
        accessorKey: "HA",
        accessorFn: (row) => getRowVal(row, "HA", "ha"),
        enableColumnFilter: true,
        filterFn: "includesString"
      },
      {
        header: t("Nts"),
        accessorKey: "Nts",
        accessorFn: (row) => getRowVal(row, "Nts", "nts"),
        enableColumnFilter: true,
        filterFn: "includesString"
      },
      {
        header: t("Partyhold Cts"),
        accessorKey: "Partyholdcts",
        accessorFn: (row) => getRowVal(row, "Partyholdcts", "partyholdcts"),
        enableColumnFilter: true,
        filterFn: "includesString",
        className: "text-end",
        cell: ({ getValue }) => fmtFixed(getValue(), 3)
      },
      {
        header: t("ML"),
        accessorKey: "ML",
        accessorFn: (row) => getRowVal(row, "ML", "ml"),
        enableColumnFilter: true,
        filterFn: "includesString"
      },
      {
        header: t("Key To Symbols"),
        accessorKey: "KeyToSymbols",
        accessorFn: (row) => getRowVal(row, "KeyToSymbols", "keyToSymbols"),
        enableColumnFilter: true,
        filterFn: "includesString"
      },
      {
        header: t("Comments"),
        accessorKey: "Comments",
        accessorFn: (row) => getRowVal(row, "Comments", "comments"),
        enableColumnFilter: true,
        filterFn: "includesString"
      }
    ],
    [t, selectedLots, allSelected, allLots]
  );

  return (
    <React.Fragment>
      <ToastContainer />
      <style>{`
        .hold-status-M { color: red !important; }
        .hold-status-LAB { color: DarkTurquoise !important; }
        .hold-status-I { color: blue !important; }
        .hold-status-L { color: green !important; }
        .hold-status-PS { color: limegreen !important; }
        .hold-status-Sold { color: DarkViolet !important; }
        .hold-status-PH { color: Chocolate !important; }
        .hold-status-MI { color: DarkViolet !important; }
      `}</style>
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title={t("Hold/Unhold Report")} pageTitle={t("Reports")} />

          <div className="card stock-search-header-bar d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between mb-3 p-3 rounded-3 shadow-sm border gap-2">
            <h5 className="mb-0 fw-bold text-primary d-flex align-items-center gap-2">
              <i
                className={
                  hasSearched
                    ? "ri-database-2-line fs-20 text-primary"
                    : "ri-search-eye-line fs-20 text-primary"
                }
              />
              {hasSearched
                ? `${t("Hold/Unhold Report")} ${t("Results")}`
                : `${t("Hold/Unhold Report")} ${t("Filters")}`}
            </h5>
            <div className="d-flex gap-2 flex-wrap">
              {!hasSearched ? (
                <>
                  <Button
                    color="primary"
                    className="btn-sm rounded-2 px-3 py-1"
                    onClick={() => handleReport()}
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
                    onClick={() => runHoldRestore("hold")}
                    disabled={actionLoading || loading}
                  >
                    {t("Hold")}
                  </Button>
                  <Button
                    color="success"
                    className="btn-sm rounded-2 px-3 py-1"
                    onClick={() => runHoldRestore("unhold")}
                    disabled={actionLoading || loading}
                  >
                    {t("Restore")}
                  </Button>
                  <Button
                    color="soft-secondary"
                    className="btn-sm rounded-2 px-3 py-1"
                    onClick={handleNewSearch}
                    disabled={loading || actionLoading}
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
                  <Col sm={2}>
                    <FormGroup className="mb-0">
                      <Label className="fw-medium mb-1 small">{t("Show")}</Label>
                      <Input
                        type="select"
                        className="form-control form-control-sm"
                        style={{ height: "35px" }}
                        value={filters.show}
                        onChange={(e) => setFilters((p) => ({ ...p, show: e.target.value }))}
                      >
                        {SHOW_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {t(o.label)}
                          </option>
                        ))}
                      </Input>
                    </FormGroup>
                  </Col>
                  <Col sm={2}>
                    <FormGroup className="mb-0">
                      <Label className="fw-medium mb-1 small">{t("Hold/UnHold")}</Label>
                      <Input
                        type="select"
                        className="form-control form-control-sm"
                        style={{ height: "35px" }}
                        value={filters.holdUnHold}
                        onChange={(e) => setFilters((p) => ({ ...p, holdUnHold: e.target.value }))}
                      >
                        {HOLD_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {t(o.label)}
                          </option>
                        ))}
                      </Input>
                    </FormGroup>
                  </Col>
                  <Col sm={2}>
                    <FormGroup className="mb-0">
                      <Label className="fw-medium mb-1 small">{t("Single/Parcel")}</Label>
                      <Input
                        type="select"
                        className="form-control form-control-sm"
                        style={{ height: "35px" }}
                        value={filters.stoneTypes}
                        onChange={(e) => setFilters((p) => ({ ...p, stoneTypes: e.target.value }))}
                      >
                        {STONE_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {t(o.label)}
                          </option>
                        ))}
                      </Input>
                    </FormGroup>
                  </Col>
                  <Col sm={2}>
                    <FormGroup className="mb-0">
                      <Label className="fw-medium mb-1 small">{t("Status")}</Label>
                      <Input
                        type="select"
                        className="form-control form-control-sm"
                        style={{ height: "35px" }}
                        value={filters.status}
                        onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}
                      >
                        {STATUS_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {t(o.label)}
                          </option>
                        ))}
                      </Input>
                    </FormGroup>
                  </Col>
                  <Col sm={4}>
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
              </CardBody>
            </Card>
          )}

          {hasSearched && (
            <Card className="shadow-lg border-0 rounded-3 mb-4">
              <CardBody>
                <div className="d-flex justify-content-between align-items-center mb-3 small fw-semibold flex-wrap gap-2">
                  <span>
                    {t("Selected")}: {selectedLots.size} / {reportRows.length}
                  </span>
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
                    tableClass="align-middle table-nowrap mb-0 table-hover table-striped text-center"
                    theadClass="table-light"
                    SearchPlaceholder={t("SEARCH:")}
                    getRowClass={(row) =>
                      getStatusRowClass(getRowVal(row.original, "CurStatus", "curStatus"))
                    }
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

export default SolitaireHoldUnholdReport;
