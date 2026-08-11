import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Button,
    Card,
    CardBody,
    Col,
    Container,
    Modal,
    ModalBody,
    Row,
    Spinner
} from "reactstrap";
import { toast, ToastContainer } from "react-toastify";

import BreadCrumb from "../../../Components/Common/BreadCrumb";
import {
    downloadMRP,
    getDownloadMRPPermission,
    updateMRPInStock
} from "../../../helpers/fakebackend_helper";

/**
 * MVC SweetAlert-style confirm (download-mrp.js Swal.fire type: "warning")
 */
const MvcSwalConfirm = ({ open, title, text, confirmText, cancelText, onConfirm, onCancel }) => (
    <Modal
        isOpen={open}
        toggle={onCancel}
        centered
        className="modal-dialog-centered"
        contentClassName="border-0 shadow"
        style={{ maxWidth: 440 }}
    >
        <ModalBody className="p-4 text-center">
            {/* SweetAlert2 warning icon */}
            <div
                className="mx-auto mb-3 d-flex align-items-center justify-content-center"
                style={{
                    width: 80,
                    height: 80,
                    borderRadius: "50%",
                    border: "4px solid #f7b84b",
                    color: "#f7b84b",
                    fontSize: 48,
                    fontWeight: 600,
                    lineHeight: 1
                }}
                aria-hidden="true"
            >
                !
            </div>

            <h2 className="fw-semibold mb-2" style={{ fontSize: 22, color: "#495057" }}>
                {title}
            </h2>
            <p className="text-muted mb-4 fs-16">{text}</p>

            <div className="d-flex gap-2 justify-content-center flex-wrap">
                <button type="button" className="btn btn-primary" onClick={onConfirm}>
                    {confirmText}
                </button>
                <button type="button" className="btn btn-danger" onClick={onCancel}>
                    {cancelText}
                </button>
            </div>
        </ModalBody>
    </Modal>
);

/**
 * MVC SweetAlert-style result (success / error)
 */
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

                <button
                    type="button"
                    className={isSuccess ? "btn btn-success" : "btn btn-success"}
                    onClick={onClose}
                >
                    {confirmText}
                </button>
            </ModalBody>
        </Modal>
    );
};

const DownloadMRP = () => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(true);
    const [busy, setBusy] = useState(false);
    const [confirmModal, setConfirmModal] = useState({ open: false, type: null });
    const [resultModal, setResultModal] = useState({
        open: false,
        type: "success",
        title: "",
        text: ""
    });

    const loadPermission = useCallback(async () => {
        setLoading(true);
        try {
            const permission = await getDownloadMRPPermission();
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
                toast.error(err?.message || t("Error loading Download MRP."));
            }
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        loadPermission();
    }, [loadPermission]);

    const openConfirm = (type) => setConfirmModal({ open: true, type });
    const closeConfirm = () => setConfirmModal({ open: false, type: null });
    const closeResult = () => setResultModal((prev) => ({ ...prev, open: false }));

    const handleConfirm = async () => {
        const type = confirmModal.type;
        closeConfirm();
        if (!type) return;

        setBusy(true);
        try {
            const response = type === "download" ? await downloadMRP() : await updateMRPInStock();
            if (response?.success === true || response?.Success === true) {
                setResultModal({
                    open: true,
                    type: "success",
                    title: t("Success"),
                    text: response?.Data || response?.data || t("Success")
                });
            } else {
                setResultModal({
                    open: true,
                    type: "error",
                    title: t("Warning!"),
                    text: response?.Data || response?.data || response?.message || t("Operation failed.")
                });
            }
        } catch (err) {
            const status = err?.response?.status || err?.status;
            const msg =
                status === 403
                    ? t("You are not authorized to perform this task.")
                    : err?.response?.data?.Data ||
                    err?.response?.data?.data ||
                    err?.response?.data?.message ||
                    err?.message ||
                    t("Error");
            setResultModal({
                open: true,
                type: "error",
                title: t("Warning!"),
                text: msg
            });
        } finally {
            setBusy(false);
        }
    };

    document.title = `${t("Download MRP")} | ${t("Utility")}`;

    const confirmMessage =
        confirmModal.type === "download"
            ? t("Download New MRP !!")
            : t("Update MRP in Currunt Stock !!");

    return (
        <React.Fragment>
            <ToastContainer position="top-right" autoClose={3000} />

            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title={t("Download MRP")} pageTitle={t("Utility")} />

                    <div className="card stock-search-header-bar d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between mb-3 p-3 rounded-3 shadow-sm border gap-2">
                        <h5 className="mb-0 fw-bold text-primary d-flex align-items-center gap-2">
                            <i className="ri-download-2-line fs-20 text-primary" />
                            {t("Download MRP")}
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
                                    <Col sm={12} md={3} lg={2}>
                                        <Button
                                            color="primary"
                                            outline
                                            className="w-100"
                                            disabled={busy}
                                            onClick={() => openConfirm("download")}
                                        >
                                            {busy ? <Spinner size="sm" /> : t("Download MRP")}
                                        </Button>
                                    </Col>

                                    <Col sm={12} md={4} lg={3}>
                                        <Button
                                            color="primary"
                                            outline
                                            className="w-100"
                                            disabled={busy}
                                            onClick={() => openConfirm("update")}
                                        >
                                            {busy ? <Spinner size="sm" /> : t("UPDATE MRP IN STOCK")}
                                        </Button>
                                        <div className="mt-2" style={{ color: "coral" }}>
                                            {t("Sold Stone will Not Be Effected")}
                                        </div>
                                    </Col>

                                    <Col sm={12} md={3} lg={2} className="d-none d-md-block" />

                                    <Col sm={12} md={4} lg={3}>
                                        <Button color="primary" outline className="w-100" disabled>
                                            {t("Diasense Price Download")}
                                        </Button>
                                    </Col>
                                </Row>
                            </CardBody>
                        </Card>
                    )}
                </Container>
            </div>

            <MvcSwalConfirm
                open={confirmModal.open}
                title={t("Are You Sure ??")}
                text={confirmMessage}
                confirmText={t("Yes, Download it")}
                cancelText={t("Cancel")}
                onConfirm={handleConfirm}
                onCancel={closeConfirm}
            />

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

export default DownloadMRP;