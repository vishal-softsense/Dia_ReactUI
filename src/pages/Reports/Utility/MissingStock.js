import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Button,
    Card,
    CardBody,
    Col,
    Container,
    Input,
    Label,
    Row,
    Spinner
} from "reactstrap";
import { toast, ToastContainer } from "react-toastify";

import BreadCrumb from "../../../Components/Common/BreadCrumb";
import TableContainer from "../../../Components/Common/TableContainer";
import { exportToExcel } from "../../../helpers/excel_helper";
import {
    getMissingStockPermission,
    getMissingStockReport
} from "../../../helpers/fakebackend_helper";

const ON_HAND_STATUSES = { S: true, MI: true };

const STATUS_LABELS = {
    SOLD: "Sold",
    SD: "Sold",
    M: "Memo",
    L: "L",
    I: "Int. Memo",
    PS: "PS",
    PH: "Party Hold"
};

const getField = (row, key) => {
    if (row?.[key] !== undefined && row?.[key] !== null) return row[key];
    const lower = key.charAt(0).toLowerCase() + key.slice(1);
    if (row?.[lower] !== undefined && row?.[lower] !== null) return row[lower];
    return undefined;
};

/** Same 3-column categorisation as MVC MissingStock.js for Filters === "LotNo". */
const buildGridData = (dbData, enteredText, filterType) => {
    const rawLots = String(enteredText || "")
        .split("\n")
        .map(item => item.trim())
        .filter(item => item.length > 0);

    const seenLots = {};
    const enteredLots = [];
    rawLots.forEach(item => {
        const key = item.toUpperCase();
        if (!seenLots[key]) {
            seenLots[key] = true;
            enteredLots.push(item);
        }
    });

    const gridData = [];

    if (filterType === "LotNo") {
        if (enteredLots.length === 0) return gridData;

        const dbMap = {};
        (dbData || []).forEach(item => {
            const lotNo = getField(item, "LotNo");
            if (!lotNo) return;
            const key = String(lotNo).trim().toUpperCase();
            const status = String(getField(item, "CurStatus") || "").trim().toUpperCase();
            if (!dbMap[key]) dbMap[key] = {};
            dbMap[key][status] = true;
        });

        const lotNos = [];
        const lotNoMissing = [];
        const lotNoExtra = [];

        enteredLots.forEach(lot => {
            const key = lot.trim().toUpperCase();
            const trimmed = lot.trim();

            if (Object.prototype.hasOwnProperty.call(dbMap, key)) {
                const statuses = dbMap[key];
                let isOnHandOrMI = false;
                let primaryStatus = "";

                Object.keys(statuses).forEach(s => {
                    if (!primaryStatus && s) primaryStatus = s;
                    if (ON_HAND_STATUSES[s]) isOnHandOrMI = true;
                });

                if (isOnHandOrMI) {
                    lotNos.push(trimmed);
                } else {
                    const label = STATUS_LABELS[primaryStatus] || primaryStatus || "Other";
                    lotNoExtra.push(`${trimmed} (${label})`);
                }
            } else {
                lotNoMissing.push(trimmed);
            }
        });

        const max = Math.max(lotNos.length, lotNoMissing.length, lotNoExtra.length);
        for (let i = 0; i < max; i++) {
            gridData.push({
                LotNo: i < lotNos.length ? lotNos[i] : "",
                LotNoMissing: i < lotNoMissing.length ? lotNoMissing[i] : "",
                LotNoExtra: i < lotNoExtra.length ? lotNoExtra[i] : ""
            });
        }
    } else {
        const seen = {};
        (dbData || []).forEach(item => {
            const lotNo = getField(item, "LotNo");
            if (!lotNo) return;
            const lot = String(lotNo).trim();
            const lotUpper = lot.toUpperCase();
            if (!seen[lotUpper]) {
                seen[lotUpper] = true;
                gridData.push({ LotNo: lot, LotNoMissing: "", LotNoExtra: "" });
            }
        });
    }

    return gridData;
};

const MissingStock = () => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(true);
    const [busy, setBusy] = useState(false);
    const [stoneTypes, setStoneTypes] = useState("All");
    const [filters, setFilters] = useState("");
    const [lotNo, setLotNo] = useState("");
    const [gridRows, setGridRows] = useState([]);
    const [hasRun, setHasRun] = useState(false);

    const columns = useMemo(
        () => [
            {
                header: t("LotNo"),
                accessorKey: "LotNo",
                enableColumnFilter: true,
                cell: (cell) => cell.getValue() || ""
            },
            {
                header: t("LotNoMissing"),
                accessorKey: "LotNoMissing",
                enableColumnFilter: true,
                cell: (cell) => cell.getValue() || ""
            },
            {
                header: t("LotNoExtra"),
                accessorKey: "LotNoExtra",
                enableColumnFilter: true,
                cell: (cell) => cell.getValue() || ""
            }
        ],
        [t]
    );

    const loadPermission = useCallback(async () => {
        setLoading(true);
        try {
            const permission = await getMissingStockPermission();
            if (permission?.success === false) {
                setAuthorized(false);
                toast.error(permission?.message || t("You are not authorized to perform this task."));
                return;
            }
            setAuthorized(true);
        } catch (err) {
            const status = err?.response?.status || err?.status;
            if (status === 403) {
                setAuthorized(false);
                toast.error(t("You are not authorized to perform this task."));
            } else {
                toast.error(err?.message || t("Error loading Missing Stock."));
            }
        } finally {
            setLoading(false);
        }
    }, [t]);

    React.useEffect(() => {
        loadPermission();
    }, [loadPermission]);

    const handleClear = () => {
        setStoneTypes("All");
        setFilters("");
        setLotNo("");
        setGridRows([]);
        setHasRun(false);
    };

    const handleReport = async () => {
        setBusy(true);
        try {
            const payload = {
                StoneTypes: stoneTypes,
                LotNo: lotNo,
                Filters: filters
            };

            const response = await getMissingStockReport(payload);
            if (response?.success === true || response?.Success === true) {
                const data = response?.Data || response?.data || [];
                const rows = buildGridData(Array.isArray(data) ? data : [], lotNo, filters);
                setGridRows(rows);
                setHasRun(true);
                if (!rows.length) {
                    toast.info(t("No data available for the selected search criteria."));
                }
            } else {
                setGridRows([]);
                setHasRun(true);
                toast.error(response?.Data || response?.data || t("Unable to fetch data. Please try again."));
            }
        } catch (err) {
            setGridRows([]);
            setHasRun(true);
            const status = err?.response?.status || err?.status;
            if (status === 403) {
                setAuthorized(false);
                toast.error(t("You are not authorized to perform this task."));
            } else {
                toast.error(err?.response?.data?.Data || err?.message || t("Unable to fetch data. Please try again."));
            }
        } finally {
            setBusy(false);
        }
    };

    const handleExport = async () => {
        if (!gridRows.length) {
            toast.error(t("No table found!"));
            return;
        }

        const headers = ["LotNo", "LotNoMissing", "LotNoExtra"];
        const rows = gridRows.map(r => [r.LotNo || "", r.LotNoMissing || "", r.LotNoExtra || ""]);
        const result = await exportToExcel(headers, rows, "MissingStock", "MissingStockList");
        if (!result?.success) {
            toast.error(t("Export failed."));
        }
    };

    document.title = `${t("Missing Stock")} | ${t("Utility")}`;

    return (
        <React.Fragment>
            <ToastContainer position="top-right" autoClose={2500} />

            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title={t("Missing Stock")} pageTitle={t("Utility")} />

                    <div className="card stock-search-header-bar d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between mb-3 p-3 rounded-3 shadow-sm border gap-2">
                        <h5 className="mb-0 fw-bold text-primary d-flex align-items-center gap-2">
                            <i className="ri-file-search-line fs-20 text-primary" />
                            {t("Missing Stock")}
                        </h5>
                        <div className="d-flex flex-wrap gap-2">
                            <Button color="primary" disabled={busy || !authorized} onClick={() => handleReport()}>
                                {busy ? <Spinner size="sm" /> : t("Report")}
                            </Button>
                            <Button color="primary" outline disabled={busy || !authorized} onClick={handleClear}>
                                {t("Clear")}
                            </Button>
                            <Button color="primary" outline disabled={busy || !authorized || !gridRows.length} onClick={handleExport}>
                                {t("Excel")}
                            </Button>
                        </div>
                    </div>

                    {!authorized ? (
                        <Card className="shadow-sm border-0">
                            <CardBody className="text-center text-danger py-5">
                                {t("You are not authorized to perform this task.")}
                            </CardBody>
                        </Card>
                    ) : loading ? (
                        <div className="text-center py-5"><Spinner color="primary" /></div>
                    ) : (
                        <Card className="shadow-sm border-0">
                            <CardBody>
                                <Row className="g-3 align-items-start mb-3">
                                    <Col lg={2} md={4} sm={6}>
                                        <Label className="form-label fw-semibold">{t("Single/Parcel")}</Label>
                                        <Input type="select" value={stoneTypes} onChange={e => setStoneTypes(e.target.value)}>
                                            <option value="Single">{t("Single")}</option>
                                            <option value="Parcel">{t("Parcel")}</option>
                                            <option value="Jewellery">{t("Jewellery")}</option>
                                            <option value="All">{t("All")}</option>
                                        </Input>
                                    </Col>
                                    <Col lg={2} md={4} sm={6}>
                                        <Label className="form-label fw-semibold">{t("Enter Lot No")}</Label>
                                        <Input type="select" value={filters} onChange={e => setFilters(e.target.value)}>
                                            <option value="">{t("Select Option")}</option>
                                            <option value="LotNo">{t("LotNo")}</option>
                                            <option value="LotNo Not">{t("LotNo Not")}</option>
                                            <option value="LotNo Like">{t("LotNo Like")}</option>
                                        </Input>
                                    </Col>
                                    <Col lg={3} md={6} sm={12}>
                                        <Label className="form-label fw-semibold">{t("Lot No")}</Label>
                                        <Input
                                            type="textarea"
                                            rows={5}
                                            placeholder={t("Search by lot no")}
                                            value={lotNo}
                                            onChange={e => setLotNo(e.target.value)}
                                        />
                                    </Col>
                                </Row>

                                {hasRun ? (
                                    gridRows.length === 0 ? (
                                        <div className="text-center text-muted py-4">
                                            {t("No data available for the selected search criteria.")}
                                        </div>
                                    ) : (
                                        <TableContainer
                                            columns={columns}
                                            data={gridRows}
                                            isGlobalFilter={true}
                                            isShowEntries={true}
                                            customPageSize={500}
                                            customPageSizes={[500, 1000, 1500]}
                                            divClass="table-responsive table-card mb-3"
                                            tableClass="align-middle table-nowrap mb-0 table-hover table-striped table-bordered text-center"
                                            theadClass="table-light"
                                            SearchPlaceholder={t("Filter results...")}
                                        />
                                    )
                                ) : null}
                            </CardBody>
                        </Card>
                    )}
                </Container>
            </div>

            {busy ? (
                <div
                    className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                    style={{ background: "rgba(255,255,255,0.55)", zIndex: 1055 }}
                >
                    <Spinner color="primary" />
                </div>
            ) : null}
        </React.Fragment>
    );
};

export default MissingStock;
