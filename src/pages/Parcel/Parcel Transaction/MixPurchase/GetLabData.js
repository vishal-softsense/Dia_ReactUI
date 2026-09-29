import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Button,
    Card,
    CardBody,
    Col,
    Container,
    Input,
    Label,
    Modal,
    ModalBody,
    ModalFooter,
    ModalHeader,
    Row,
    Spinner,
    Table
} from "reactstrap";
import { toast, ToastContainer } from "react-toastify";

import BreadCrumb from "../../../../Components/Common/BreadCrumb";
import { exportToExcel } from "../../../../helpers/excel_helper";
import {
    getGetLabDataPermission,
    getLabDataFromList,
    getLabGiaData,
    getLabIgiData,
    importLabCertFile,
    printGetLabData
} from "../../../../helpers/fakebackend_helper";

const GIA_COLUMNS = [
    { key: "SrNo", title: "SrNo" },
    { key: "report_number", title: "Report Number" },
    { key: "report_date", title: "Report Date" },
    { key: "report_type", title: "Report Type" },
    { key: "shape_and_cutting_style", title: "Shape and Cutting Style" },
    { key: "measurements", title: "Measurements" },
    { key: "carat_weight", title: "Carat Weight" },
    { key: "color_grade", title: "Color Grade" },
    { key: "clarity_grade", title: "Clarity Grade" },
    { key: "cut_grade", title: "Cut Grade" },
    { key: "polish", title: "Polish" },
    { key: "symmetry", title: "Symmetry" },
    { key: "L", title: "L" },
    { key: "W", title: "W" },
    { key: "D", title: "D" },
    { key: "fluorescence", title: "Fluorescence" },
    { key: "clarity_characteristics", title: "Clarity Characteristics" },
    { key: "inscriptions", title: "Inscriptions" },
    { key: "depth_pct", title: "Depth Percentage" },
    { key: "table_pct", title: "Table Percentage" },
    { key: "crown_angle", title: "Crown Angle" },
    { key: "crown_height", title: "Crown Height" },
    { key: "pavilion_angle", title: "Pavilion Angle" },
    { key: "pavilion_depth", title: "Pavilion Depth" },
    { key: "star_length", title: "Star Length" },
    { key: "lower_half", title: "Lower Half" },
    { key: "girdle", title: "Girdle" },
    { key: "culet", title: "Culet" },
    { key: "color_origin", title: "Color Origin" },
    { key: "color_distribution", title: "Color Distribution" },
    { key: "country_of_origin", title: "Country of Origin" },
    { key: "diamond_type", title: "Diamond Type" },
    { key: "report_comments", title: "Report Comments" },
    { key: "lotno", title: "LotNo" }
];

const IGI_COLUMNS = [
    { key: "SrNo", title: "SrNo" },
    { key: "ReportNumber", title: "ReportNumber" },
    { key: "ReportDate", title: "ReportDate" },
    { key: "Description", title: "Description" },
    { key: "Shape", title: "Shape" },
    { key: "Weight", title: "Weight" },
    { key: "Color", title: "Color" },
    { key: "Clarity", title: "Clarity" },
    { key: "CutProp", title: "CutProp" },
    { key: "Sym", title: "Sym" },
    { key: "Pol", title: "Pol" },
    { key: "TableDiameter", title: "TableDiameter" },
    { key: "CrownHeight", title: "CrownHeight" },
    { key: "CrownAngel", title: "CrownAngel" },
    { key: "PavilionDepth", title: "PavilionDepth" },
    { key: "PavilionAngel", title: "PavilionAngel" },
    { key: "GirdleName", title: "GirdleName" },
    { key: "CuletSize", title: "CuletSize" },
    { key: "TotalDepth", title: "TotalDepth" },
    { key: "Fluorescence", title: "Fluorescence" },
    { key: "Inscription", title: "Inscription" },
    { key: "Measurement1", title: "Measurement1" },
    { key: "Measurement2", title: "Measurement2" },
    { key: "Measurement3", title: "Measurement3" }
];

const MvcSwalResult = ({ open, type, title, text, confirmText, onClose }) => {
    const isSuccess = type === "success";
    const iconColor = isSuccess ? "#0ab39c" : "#f06548";
    const iconBorder = isSuccess ? "rgba(10, 179, 156, 0.3)" : "#f06548";

    return (
        <Modal
            isOpen={open}
            toggle={onClose}
            centered
            className="modal-dialog-centered"
            contentClassName="border-0 shadow"
            style={{ maxWidth: 440 }}
        >
            <ModalBody className="p-4 text-center">
                <div
                    className="mx-auto mb-3 d-flex align-items-center justify-content-center"
                    style={{
                        width: 80,
                        height: 80,
                        borderRadius: "50%",
                        border: `4px solid ${iconBorder}`,
                        color: iconColor,
                        fontSize: isSuccess ? 42 : 48,
                        fontWeight: 600,
                        lineHeight: 1
                    }}
                    aria-hidden="true"
                >
                    {isSuccess ? "✓" : "!"}
                </div>
                <h2 className="fw-semibold mb-2" style={{ fontSize: 22, color: "#495057" }}>
                    {title}
                </h2>
                {text ? <p className="text-muted mb-4 fs-16">{text}</p> : <div className="mb-4" />}
                <button type="button" className="btn btn-success" onClick={onClose}>
                    {confirmText}
                </button>
            </ModalBody>
        </Modal>
    );
};

const ScrollTable = ({ columns, rows, emptyText }) => (
    <div className="table-responsive table-card mb-0" style={{ overflowX: "auto" }}>
        <Table bordered size="sm" className="mb-0 align-middle text-nowrap">
            <thead className="table-light">
                <tr>
                    {columns.map(col => (
                        <th key={col.key} className="text-nowrap">{col.title}</th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {rows.length === 0 ? (
                    <tr>
                        <td colSpan={columns.length} className="text-muted text-center">
                            {emptyText}
                        </td>
                    </tr>
                ) : (
                    rows.map((row, index) => (
                        <tr key={`${row.SrNo || row.LotNo || index}-${index}`}>
                            {columns.map(col => (
                                <td key={col.key}>{row[col.key] ?? ""}</td>
                            ))}
                        </tr>
                    ))
                )}
            </tbody>
        </Table>
    </div>
);

const GetLabData = () => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(true);
    const [busy, setBusy] = useState(false);
    const [lotNo, setLotNo] = useState("");
    const [printType, setPrintType] = useState("giaigi");
    const [importModalOpen, setImportModalOpen] = useState(false);
    const [file, setFile] = useState(null);
    const [certRows, setCertRows] = useState([]);
    const [giaRows, setGiaRows] = useState([]);
    const [igiRows, setIgiRows] = useState([]);
    const [showGiaTable, setShowGiaTable] = useState(false);
    const [showIgiTable, setShowIgiTable] = useState(false);
    const [resultModal, setResultModal] = useState({
        open: false,
        type: "success",
        title: "",
        text: ""
    });

    const loadPermission = useCallback(async () => {
        setLoading(true);
        try {
            const permission = await getGetLabDataPermission();
            if (permission?.success === false) {
                setAuthorized(false);
                toast.error(permission?.message || t("You are not authorized to perform this task."));
                return;
            }
            setAuthorized(true);
        } catch (err) {
            const status = err?.response?.status || err?.status;
            const msg = typeof err === "string" ? err : (err?.message || "");
            if (status === 403 || String(msg).toLowerCase().includes("not authorized")) {
                setAuthorized(false);
                toast.error(t("You are not authorized to perform this task."));
            } else {
                toast.error(msg || t("Error loading Get Lab Data."));
            }
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        loadPermission();
    }, [loadPermission]);

    const extractErrorMessage = (err, fallbackMsg) => {
        if (typeof err === "string" && err.trim()) return err;
        return (
            err?.Data ||
            err?.data ||
            err?.message ||
            err?.response?.data?.Data ||
            err?.response?.data?.data ||
            err?.response?.data?.message ||
            fallbackMsg
        );
    };

    const closeResult = () => setResultModal(prev => ({ ...prev, open: false }));

    const mapCertRows = (data) =>
        (Array.isArray(data) ? data : []).map(item => ({
            LotNo: item.LotNo ?? item.lotNo ?? "",
            CertificateNo: item.CertificateNo ?? item.certificateNo ?? "",
            Carats: item.Carats ?? item.carats ?? 0
        }));

    const handleGetItemFromList = async () => {
        setBusy(true);
        try {
            const response = await getLabDataFromList({ LotNo: lotNo });
            if (response?.success === true || response?.Success === true) {
                setCertRows(mapCertRows(response?.Data || response?.data || []));
                setGiaRows([]);
                setIgiRows([]);
                setShowGiaTable(false);
                setShowIgiTable(false);
            } else {
                setResultModal({
                    open: true,
                    type: "error",
                    title: t("Warning"),
                    text: extractErrorMessage(response, t("No data returned."))
                });
            }
        } catch (err) {
            setResultModal({
                open: true,
                type: "error",
                title: t("Warning"),
                text: extractErrorMessage(err, t("Failed to load items."))
            });
        } finally {
            setBusy(false);
        }
    };

    const downloadTemplate = async (e) => {
        e.preventDefault();
        try {
            const result = await exportToExcel(
                ["LotNo", "CertificateNo", "Carats"],
                [],
                "ImportCertificate",
                "ImportCertificate"
            );
            if (!result?.success) {
                toast.error(t("Template download failed."));
            }
        } catch {
            toast.error(t("Template download failed."));
        }
    };

    const handleImport = async () => {
        if (!file) {
            toast.error(t("Please upload a file....!"));
            return;
        }

        setBusy(true);
        try {
            const response = await importLabCertFile(file);
            if (response?.success === true || response?.Success === true) {
                setCertRows(mapCertRows(response?.Data || response?.data || []));
                setGiaRows([]);
                setIgiRows([]);
                setShowGiaTable(false);
                setShowIgiTable(false);
                setImportModalOpen(false);
                setFile(null);
                setResultModal({
                    open: true,
                    type: "success",
                    title: t("Excel Import Success!"),
                    text: ""
                });
            } else {
                setResultModal({
                    open: true,
                    type: "error",
                    title: t("Warning"),
                    text: extractErrorMessage(response, t("Import failed."))
                });
            }
        } catch (err) {
            setResultModal({
                open: true,
                type: "error",
                title: t("Warning"),
                text: extractErrorMessage(err, t("Server Connection Problem.."))
            });
        } finally {
            setBusy(false);
        }
    };

    const buildCertPayload = () => ({
        Item: certRows.map(row => ({
            Lotno: row.LotNo,
            GetCertNo: row.CertificateNo,
            Carats: parseFloat(row.Carats) || 0
        }))
    });

    const handleGetGiaData = async () => {
        if (!certRows.length) {
            toast.error(t("Get Item From List"));
            return;
        }

        setBusy(true);
        try {
            const response = await getLabGiaData(buildCertPayload());
            if (response?.success === true || response?.Success === true) {
                setGiaRows(response?.Data || response?.data || []);
                setShowGiaTable(true);
                setResultModal({
                    open: true,
                    type: "success",
                    title: t("Success"),
                    text: ""
                });
            } else {
                setResultModal({
                    open: true,
                    type: "error",
                    title: t("Warning"),
                    text: extractErrorMessage(response, t("Unexpected error"))
                });
            }
        } catch (err) {
            setResultModal({
                open: true,
                type: "error",
                title: t("Warning"),
                text: extractErrorMessage(err, t("Server Connection Problem.."))
            });
        } finally {
            setBusy(false);
        }
    };

    const handleGetIgiData = async () => {
        if (!certRows.length) {
            toast.error(t("Get Item From List"));
            return;
        }

        setBusy(true);
        try {
            const response = await getLabIgiData(buildCertPayload());
            if (response?.success === true || response?.Success === true) {
                setIgiRows(response?.Data || response?.data || []);
                setShowIgiTable(true);
                setResultModal({
                    open: true,
                    type: "success",
                    title: t("Success"),
                    text: ""
                });
            } else {
                setResultModal({
                    open: true,
                    type: "error",
                    title: t("Warning"),
                    text: extractErrorMessage(response, t("Unexpected error"))
                });
            }
        } catch (err) {
            setResultModal({
                open: true,
                type: "error",
                title: t("Warning"),
                text: extractErrorMessage(err, t("Server Connection Problem.."))
            });
        } finally {
            setBusy(false);
        }
    };

    const handlePrint = async () => {
        if (!giaRows.length && !igiRows.length) {
            toast.error(t("No data to export."));
            return;
        }

        setBusy(true);
        try {
            const payload = {
                spte: giaRows.map(row => ({ ...row, Cert: "GIA" })),
                ptse: igiRows.map(row => ({ ...row, Cert: "IGI" }))
            };
            const response = await printGetLabData(payload);
            if (response?.error) {
                alert(response?.message || t("Error while exporting data."));
                return;
            }

            const headers = response?.Headers || response?.headers || [];
            const rows = response?.Rows || response?.rows || [];
            const fileName = printType === "purchase" ? "Dia-report" : "GetLabData";
            const result = await exportToExcel(headers, rows, fileName, fileName);
            if (!result?.success) {
                alert(t("Error while exporting data."));
            }
        } catch (err) {
            alert(extractErrorMessage(err, t("Error while exporting data.")));
        } finally {
            setBusy(false);
        }
    };

    document.title = `${t("Get Lab Data")} | ${t("Utility")}`;

    return (
        <React.Fragment>
            <ToastContainer position="top-right" autoClose={2500} />
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title={t("Get Lab Data")} pageTitle={t("Utility")} />

                    <div className="card stock-search-header-bar d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between mb-3 p-3 rounded-3 shadow-sm border gap-2">
                        <h5 className="mb-0 fw-bold text-primary d-flex align-items-center gap-2 text-uppercase">
                            <i className="ri-flask-line fs-20 text-primary" />
                            {t("Get Lab Data")}
                        </h5>
                    </div>

                    {loading ? (
                        <div className="text-center py-5">
                            <Spinner color="primary" />
                        </div>
                    ) : !authorized ? (
                        <Card className="shadow-sm border-0 rounded-3">
                            <CardBody className="text-center text-danger py-5">
                                {t("You are not authorized to perform this task.")}
                            </CardBody>
                        </Card>
                    ) : (
                        <Card className="shadow-sm border-0 rounded-3">
                            <CardBody className="p-3 p-md-4">
                                <Row className="g-3 align-items-start">
                                    <Col xs={12} lg={3}>
                                        <Label className="form-label mb-1 text-uppercase small fw-semibold">
                                            {t("Enter Lot No")}
                                        </Label>
                                        <Input
                                            type="textarea"
                                            className="form-control"
                                            rows="10"
                                            placeholder={t("Add by lot no")}
                                            value={lotNo}
                                            onChange={e => setLotNo(e.target.value)}
                                        />
                                        <Button
                                            color="primary"
                                            className="w-100 mt-3"
                                            disabled={busy}
                                            onClick={handleGetItemFromList}
                                        >
                                            {busy ? <Spinner size="sm" /> : t("Get Item From List")}
                                        </Button>
                                        <Button
                                            color="primary"
                                            outline
                                            className="w-100 mt-2"
                                            disabled={busy}
                                            onClick={() => setImportModalOpen(true)}
                                        >
                                            {t("Import Cert No")}
                                        </Button>
                                    </Col>

                                    <Col xs={12} sm={6} lg={2} style={{ marginTop: "1.75rem" }}>
                                        <div className="d-flex flex-column gap-2">
                                            <Button
                                                color="primary"
                                                outline
                                                className="w-100 py-2"
                                                disabled={busy}
                                                onClick={handleGetGiaData}
                                            >
                                                {t("Get Gia Data")}
                                            </Button>
                                            <Button
                                                color="primary"
                                                outline
                                                className="w-100 py-2"
                                                disabled={busy}
                                                onClick={handleGetIgiData}
                                            >
                                                {t("Get IGI Data")}
                                            </Button>
                                            <Button
                                                color="primary"
                                                outline
                                                className="w-100 py-2"
                                                disabled
                                            >
                                                {t("Get HRD Data")}
                                            </Button>
                                        </div>
                                    </Col>

                                    <Col xs={12} sm={6} lg={3} style={{ marginTop: "1.75rem" }}>
                                        <div className="form-check mb-2">
                                            <Input
                                                type="radio"
                                                id="rdPurchase"
                                                name="labPrint"
                                                className="form-check-input"
                                                checked={printType === "purchase"}
                                                onChange={() => setPrintType("purchase")}
                                            />
                                            <Label className="form-check-label" htmlFor="rdPurchase">
                                                {t("DiaSense Purchase Print")}
                                            </Label>
                                        </div>
                                        <div className="form-check">
                                            <Input
                                                type="radio"
                                                id="rdSale"
                                                name="labPrint"
                                                className="form-check-input"
                                                checked={printType === "giaigi"}
                                                onChange={() => setPrintType("giaigi")}
                                            />
                                            <Label className="form-check-label" htmlFor="rdSale">
                                                {t("Gia/IGI Print")}
                                            </Label>
                                        </div>
                                    </Col>

                                    <Col xs={12} sm={6} lg={2} className="d-flex align-items-start" style={{ marginTop: "1.75rem" }}>
                                        <Button
                                            color="primary"
                                            className="w-100"
                                            disabled={busy}
                                            onClick={handlePrint}
                                        >
                                            {busy ? <Spinner size="sm" /> : t("PRINT")}
                                        </Button>
                                    </Col>
                                </Row>

                                <Row className="mt-4">
                                    <Col xs={12} lg={6}>
                                        <div className="table-responsive table-card mb-0" style={{ overflowX: "auto" }}>
                                            <Table bordered size="sm" className="mb-0 align-middle">
                                                <thead className="table-light">
                                                    <tr>
                                                        <th className="text-nowrap">{t("LotNo")}</th>
                                                        <th className="text-nowrap">{t("Certificate No")}</th>
                                                        <th className="text-nowrap">{t("Carats")}</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {certRows.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={3}>&nbsp;</td>
                                                        </tr>
                                                    ) : (
                                                        certRows.map((row, index) => (
                                                            <tr key={`${row.LotNo}-${row.CertificateNo}-${index}`}>
                                                                <td>{row.LotNo}</td>
                                                                <td>{row.CertificateNo}</td>
                                                                <td>{parseFloat(row.Carats || 0).toFixed(2)}</td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </Table>
                                        </div>
                                    </Col>
                                </Row>

                                {showGiaTable && (
                                    <div className="mt-4">
                                        <ScrollTable
                                            columns={GIA_COLUMNS}
                                            rows={giaRows}
                                            emptyText={t("No data imported yet.")}
                                        />
                                    </div>
                                )}

                                {showIgiTable && (
                                    <div className="mt-4">
                                        <ScrollTable
                                            columns={IGI_COLUMNS}
                                            rows={igiRows}
                                            emptyText={t("No data imported yet.")}
                                        />
                                    </div>
                                )}
                            </CardBody>
                        </Card>
                    )}
                </Container>
            </div>

            <Modal isOpen={importModalOpen} toggle={() => setImportModalOpen(false)} centered>
                <ModalHeader toggle={() => setImportModalOpen(false)}>{t("Import File")}</ModalHeader>
                <ModalBody>
                    <Label>{t("Select File To Import")}</Label>
                    <Input
                        type="file"
                        accept=".xls,.xlsx"
                        onChange={e => setFile(e.target.files?.[0] || null)}
                    />
                    <div className="mt-3">
                        <Label>{t("Download Import Cert File Format")}</Label>
                        <div>
                            <Button color="primary" type="button" onClick={downloadTemplate}>
                                {t("Download")}
                            </Button>
                        </div>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button color="light" onClick={() => setImportModalOpen(false)}>
                        {t("Close")}
                    </Button>
                    <Button color="primary" disabled={busy} onClick={handleImport}>
                        {busy ? <Spinner size="sm" /> : t("Accept")}
                    </Button>
                </ModalFooter>
            </Modal>

            <MvcSwalResult
                open={resultModal.open}
                type={resultModal.type}
                title={resultModal.title}
                text={resultModal.text}
                confirmText={t("OK")}
                onClose={closeResult}
            />
        </React.Fragment>
    );
};

export default GetLabData;
