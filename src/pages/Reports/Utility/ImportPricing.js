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

import BreadCrumb from "../../../Components/Common/BreadCrumb";
import {
    getImportPricingPermission,
    importPricingFile,
    saveImportPricing
} from "../../../helpers/fakebackend_helper";
import { exportToExcel } from "../../../helpers/excel_helper";

const PRICING_TYPES = [
    { value: "Back", label: "By Asking Back" },
    { value: "Rate", label: "By Asking Rate" },
    { value: "Seller Back", label: "By Seller Back" },
    { value: "Seller Rate", label: "By Seller Rate" },
    { value: "B2B Back", label: "By B2B Back" },
    { value: "BRB Rate", label: "By BRB Rate" }
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
                <p className="text-muted mb-4 fs-16">{text}</p>
                <button type="button" className="btn btn-success" onClick={onClose}>
                    {confirmText}
                </button>
            </ModalBody>
        </Modal>
    );
};

const ImportPricing = () => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(true);
    const [busy, setBusy] = useState(false);
    const [importModalOpen, setImportModalOpen] = useState(false);
    const [file, setFile] = useState(null);
    const [pricingType, setPricingType] = useState("Back");
    const [rows, setRows] = useState([]);
    const [resultModal, setResultModal] = useState({
        open: false,
        type: "success",
        title: "",
        text: "",
        reloadOnClose: false
    });

    const loadPermission = useCallback(async () => {
        setLoading(true);
        try {
            const permission = await getImportPricingPermission();
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
                toast.error(err?.message || t("Error loading Import Pricing."));
            }
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        loadPermission();
    }, [loadPermission]);

    const closeResult = () => {
        const reload = resultModal.reloadOnClose;
        setResultModal(prev => ({ ...prev, open: false, reloadOnClose: false }));
        if (reload) {
            window.location.reload();
        }
    };

    const downloadTemplate = async (e) => {
        e.preventDefault();
        try {
            const result = await exportToExcel(
                ["LotNo", "Rate/Back"],
                [],
                "ImportPricing",
                "ImportPricing"
            );
            if (!result?.success) {
                toast.error(t("Template download failed."));
            }
        } catch {
            toast.error(t("Template download failed."));
        }
    };

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

    const handleImport = async () => {
        if (!file) {
            toast.error(t("Please upload a file....!"));
            return;
        }

        setBusy(true);
        try {
            const response = await importPricingFile(file);
            if (response?.success === true || response?.Success === true) {
                const excelData = response?.Data || response?.data || [];
                setRows(
                    excelData.map(item => ({
                        LotNo: item.LotNo ?? item.lotNo ?? "",
                        rate: item.rate ?? item.Rate ?? 0
                    }))
                );
                setImportModalOpen(false);
                setFile(null);
                setResultModal({
                    open: true,
                    type: "success",
                    title: t("Excel Import Success!"),
                    text: t("Excel Import Success!"),
                    reloadOnClose: false
                });
            } else {
                setResultModal({
                    open: true,
                    type: "error",
                    title: t("Warning"),
                    text: extractErrorMessage(response, t("Import failed.")),
                    reloadOnClose: true
                });
            }
        } catch (err) {
            setResultModal({
                open: true,
                type: "error",
                title: t("Warning"),
                text: extractErrorMessage(err, t("Server Connection Problem..")),
                reloadOnClose: true
            });
        } finally {
            setBusy(false);
        }
    };

    const handleSave = async () => {
        if (!rows.length) {
            toast.error(t("Please import a file first."));
            return;
        }

        setBusy(true);
        try {
            const payload = {
                Pr: { Pricingtype: pricingType },
                Imp: rows.map(row => ({
                    LotNo: String(row.LotNo ?? "").trim(),
                    Rate: String(row.rate ?? ""),
                    rate: parseFloat(row.rate) || 0
                }))
            };

            const response = await saveImportPricing(payload);
            if (response?.success === true || response?.Success === true) {
                setResultModal({
                    open: true,
                    type: "success",
                    title: t("Success"),
                    text: response?.Data || response?.data || t("Rate/Back Updated"),
                    reloadOnClose: true
                });
            } else {
                setResultModal({
                    open: true,
                    type: "error",
                    title: t("Warning"),
                    text: extractErrorMessage(response, t("Operation failed.")),
                    reloadOnClose: false
                });
            }
        } catch (err) {
            setResultModal({
                open: true,
                type: "error",
                title: t("Warning"),
                text: extractErrorMessage(err, t("Server Connection Problem..")),
                reloadOnClose: false
            });
        } finally {
            setBusy(false);
        }
    };

    const updateRowRate = (index, value) => {
        setRows(prev =>
            prev.map((row, i) => (i === index ? { ...row, rate: value } : row))
        );
    };

    document.title = `${t("Import Pricing")} | ${t("Utility")}`;

    return (
        <React.Fragment>
            <ToastContainer position="top-right" autoClose={2500} />
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title={t("Import Pricing")} pageTitle={t("Utility")} />

                    <div className="card stock-search-header-bar d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between mb-3 p-3 rounded-3 shadow-sm border gap-2">
                        <h5 className="mb-0 fw-bold text-primary d-flex align-items-center gap-2">
                            <i className="ri-upload-2-line fs-20 text-primary" />
                            {t("Import Pricing")}
                        </h5>
                    </div>

                    {loading ? (
                        <div className="text-center py-5">
                            <Spinner color="primary" />
                        </div>
                    ) : !authorized ? (
                        <Card className="shadow-sm border-0">
                            <CardBody className="text-center text-danger py-5">
                                {t("You are not authorized to perform this task.")}
                            </CardBody>
                        </Card>
                    ) : (
                        <Card className="shadow-sm border-0">
                            <CardBody>
                                <Row className="g-3 align-items-start">
                                    <Col sm={12} md={4} lg={3}>
                                        <div className="table-responsive" style={{ maxHeight: 220, overflowY: "auto" }}>
                                            <Table bordered size="sm" className="mb-0">
                                                <thead className="table-light">
                                                    <tr>
                                                        <th>{t("LotNo")}</th>
                                                        <th>{t("Rate/Back")}</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {rows.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={2} className="text-muted text-center">
                                                                {t("No data imported yet.")}
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        rows.map((row, index) => (
                                                            <tr key={`${row.LotNo}-${index}`}>
                                                                <td>{row.LotNo}</td>
                                                                <td>
                                                                    <Input
                                                                        bsSize="sm"
                                                                        type="text"
                                                                        value={row.rate}
                                                                        onChange={e => updateRowRate(index, e.target.value)}
                                                                    />
                                                                </td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </Table>
                                        </div>
                                    </Col>

                                    <Col sm={12} md={3} lg={2}>
                                        <Label className="w-100">&nbsp;</Label>
                                        <Button
                                            color="primary"
                                            outline
                                            className="w-100"
                                            disabled={busy}
                                            onClick={() => setImportModalOpen(true)}
                                        >
                                            {t("Import File For Update")}
                                        </Button>
                                    </Col>

                                    <Col sm={12} md={4} lg={3}>
                                        <Label htmlFor="pricingtype">{t("Back/Rate")}</Label>
                                        <Input
                                            id="pricingtype"
                                            type="select"
                                            value={pricingType}
                                            onChange={e => setPricingType(e.target.value)}
                                        >
                                            {PRICING_TYPES.map(option => (
                                                <option key={option.value} value={option.value}>
                                                    {t(option.label)}
                                                </option>
                                            ))}
                                        </Input>
                                    </Col>

                                    <Col sm={12} md={3} lg={2}>
                                        <Label className="w-100">&nbsp;</Label>
                                        <Button
                                            color="primary"
                                            className="w-100"
                                            disabled={busy || rows.length === 0}
                                            onClick={handleSave}
                                        >
                                            {busy ? <Spinner size="sm" /> : t("Save")}
                                        </Button>
                                    </Col>
                                </Row>
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
                        <Label>{t("Download Import Pricing File Format")}</Label>
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

export default ImportPricing;
