import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Button,
    Card,
    CardBody,
    CardHeader,
    Col,
    Container,
    Input,
    Label,
    Modal,
    ModalBody,
    ModalFooter,
    ModalHeader,
    Row,
    Spinner
} from "reactstrap";
import { ToastContainer, toast } from "react-toastify";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import {
    deleteImportDeletedRecords,
    getImportGradingPermission,
    importAskingRate,

    updateAccountData,
    updateGiaData,
    updateGraderData,
    updateHrdData,
    updateIgiData,
    updateImageVideoData,
    updateImportSizeId,
    updateParcelItemData,
    updatePurchaseData,
    updateSolitaireItemData,
    uploadImportLogo,

    uploadJewStockData,
    uploadJewStockDiamondData,
    uploadPurchaseData,
    uploadPurchaseDetailsData
} from "../../../helpers/fakebackend_helper";

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

const ACTIONS = [
    { key: "gia", label: "Import GIA Data Format", handler: updateGiaData, template: "/excelfolder/GIAResultFormat.xlsx" },
    { key: "igi", label: "Import IGI Data Format", handler: updateIgiData, template: chkReplace => (chkReplace ? "/excelfolder/IGI_New.xlsx" : "/excelfolder/IGIResult.xlsx") },
    { key: "hrd", label: "Import HRD Data Format", handler: updateHrdData, template: chkReplace => (chkReplace ? "/excelfolder/HRD_New.xlsx" : "/excelfolder/HRDResult.xlsx") },
    { key: "grader", label: "Import Grader Data Format", handler: updateGraderData, template: "/excelfolder/Grader.xlsx" },
    { key: "diasense", label: "Import Diasense Purchase Grading", handler: updatePurchaseData, template: "/excelfolder/DiaSense.xlsx" },
    { key: "imageVideo", label: "Import Image/Video", handler: updateImageVideoData, template: "/excelfolder/ImportImageFormat.xlsx" },
    { key: "parcel", label: "Import Parcel Stock", handler: updateParcelItemData, template: "/excelfolder/ParcelStockData.xlsx" },
    { key: "solitaire", label: "Import Solitaire Stock", handler: updateSolitaireItemData, template: "/excelfolder/SolitaireStockData.xlsx" },
    { key: "account", label: "Import Account", handler: updateAccountData, template: "/excelfolder/AccountData.xlsx" },
    { key: "purchase", label: "Import Purchase", handler: uploadPurchaseData, template: "/excelfolder/PurchaseFormat.xlsx" },
    { key: "purchaseTxn", label: "Import Purchase Transaction", handler: uploadPurchaseDetailsData, template: "/excelfolder/PurchaseTransaction.xlsx" },
    { key: "jew", label: "Import Jewellery Stock", handler: uploadJewStockData, template: "/excelfolder/JewelleryStockUploadFinal.xlsx" },
    { key: "jewDia", label: "Import Jewellery Diamond Stock", handler: uploadJewStockDiamondData, template: "/excelfolder/JewDiamondData.xlsx" },
    { key: "asking", label: "Import Asking Purchase Rate", handler: importAskingRate, template: "/excelfolder/updateaskingpurchaseratedata.xlsx" }
];

const ImportGrading = () => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(true);
    const [busy, setBusy] = useState(false);
    const [chkReplace, setChkReplace] = useState(false);
    const [activeAction, setActiveAction] = useState(null);
    const [file, setFile] = useState(null);
    const [logoFile, setLogoFile] = useState(null);
    const [confirmModal, setConfirmModal] = useState({ open: false, type: null });
    const [resultModal, setResultModal] = useState({
        open: false,
        type: "success",
        title: "",
        text: ""
    });

    const actionMap = useMemo(() => {
        const map = {};
        ACTIONS.forEach(a => { map[a.key] = a; });
        return map;
    }, []);

    const loadPermission = useCallback(async () => {
        setLoading(true);
        try {
            const permission = await getImportGradingPermission();
            if (permission?.success === false) {
                setAuthorized(false);
                toast.error(permission?.message || t("You are not authorized to perform this task."));
            } else {
                setAuthorized(true);
            }
        } catch (err) {
            const status = err?.response?.status || err?.status;
            setAuthorized(status !== 403);
            toast.error(status === 403 ? t("You are not authorized to perform this task.") : (err?.message || t("Error loading Import Grading.")));
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        loadPermission();
    }, [loadPermission]);

    const currentAction = activeAction ? actionMap[activeAction] : null;

    const getTemplatePath = useCallback((action) => {
        if (!action?.template) return "";
        const templatePath = typeof action.template === "function" ? action.template(chkReplace) : action.template;
        return templatePath || "";
    }, [chkReplace]);

    const downloadTemplate = useCallback(async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const templatePath = getTemplatePath(currentAction);
        if (!templatePath) {
            toast.error(t("Template file not found."));
            return;
        }

        const fileName = decodeURIComponent(templatePath.split("/").pop() || "template.xlsx");
        const publicBase = (process.env.PUBLIC_URL || "").replace(/\/$/, "");
        const fileUrl = `${publicBase}${templatePath.startsWith("/") ? templatePath : `/${templatePath}`}`;

        try {
            const response = await fetch(fileUrl, { method: "GET", cache: "no-store" });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const contentType = (response.headers.get("content-type") || "").toLowerCase();
            if (contentType.includes("text/html")) {
                throw new Error("Template file not found.");
            }

            const blob = await response.blob();
            const objectUrl = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = objectUrl;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(objectUrl);
        } catch (err) {
            toast.error(t("Template download failed. Please ensure the Excel file exists in public/excelfolder."));
        }
    }, [currentAction, getTemplatePath, t]);

    const runAction = async () => {
        if (!currentAction) return;
        if (!file) {
            toast.error(t("Please select an Excel file to import."));
            return;
        }
        setBusy(true);
        try {
            const response = await currentAction.handler({ ImportFile: file, ChkReplace: chkReplace });
            if (response?.success || response?.Success) {
                toast.success(response?.Data || response?.data || t("Success"));
                setFile(null);
                setActiveAction(null);
            } else {
                toast.error(response?.Data || response?.data || response?.message || t("Operation failed."));
            }
        } catch (err) {
            toast.error(err?.response?.data?.Data || err?.message || t("Error"));
        } finally {
            setBusy(false);
        }
    };

    const openConfirm = (type) => setConfirmModal({ open: true, type });
    const closeConfirm = () => setConfirmModal({ open: false, type: null });
    const closeResult = () => setResultModal((prev) => ({ ...prev, open: false }));

    const handleConfirmAction = async () => {
        const { type } = confirmModal;
        closeConfirm();
        if (!type) return;

        const actionFn = type === "updateSizeId" ? updateImportSizeId : deleteImportDeletedRecords;

        setBusy(true);
        try {
            const response = await actionFn();
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

    const confirmMessage =
        confirmModal.type === "updateSizeId"
            ? t("Update SizeId !!")
            : t("Delete Deleted Records in TabSalePur,TabSalePurTran,TabMultiGrading,TabRateRevise,TabItemMaster,TabPayRec,TabJV !!");

    const submitLogo = async (e) => {
        e.preventDefault();
        if (!logoFile) {
            toast.error(t("Please select JPG or JPEG image"));
            return;
        }
        setBusy(true);
        try {
            const response = await uploadImportLogo(logoFile);
            if (response?.success || response?.Success) {
                toast.success(response?.message || response?.Data || t("Company Logo updated successfully"));
                setLogoFile(null);
            } else {
                toast.error(response?.message || response?.Data || t("Upload failed"));
            }
        } catch (err) {
            toast.error(err?.response?.data?.message || err?.message || t("Upload failed"));
        } finally {
            setBusy(false);
        }
    };

    document.title = `${t("Import Grading")} | ${t("Utility")}`;

    return (
        <React.Fragment>
            <ToastContainer position="top-right" autoClose={2500} />
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title={t("Import Grading")} pageTitle={t("Utility")} />

                    {loading ? (
                        <div className="text-center py-5"><Spinner color="primary" /></div>
                    ) : !authorized ? (
                        <Card className="shadow-sm border-0">
                            <CardBody className="text-center text-danger py-5">{t("You are not authorized to perform this task.")}</CardBody>
                        </Card>
                    ) : (
                        <Row className="g-3">
                            <Col md={4}>
                                <Card className="h-100">
                                    <CardHeader><h5 className="mb-0">{t("Import Grading")}</h5></CardHeader>
                                    <CardBody>
                                        <div className="d-grid gap-2">
                                            {ACTIONS.slice(0, 5).map(action => (
                                                <Button key={action.key} outline color="primary" onClick={() => setActiveAction(action.key)}>{t(action.label)}</Button>
                                            ))}
                                        </div>
                                        <div className="mt-3">
                                            <Input id="chkReplace" type="checkbox" checked={chkReplace} onChange={e => setChkReplace(e.target.checked)} />
                                            <Label htmlFor="chkReplace" className="ms-2">{t("Upload New Print")}</Label>
                                        </div>
                                    </CardBody>
                                </Card>
                            </Col>

                            <Col md={4}>
                                <Card className="h-100">
                                    <CardHeader><h5 className="mb-0">{t("Import Data")}</h5></CardHeader>
                                    <CardBody>
                                        <div className="d-grid gap-2">
                                            {ACTIONS.slice(5, 14).map(action => (
                                                <Button key={action.key} outline color="primary" onClick={() => setActiveAction(action.key)}>{t(action.label)}</Button>
                                            ))}
                                        </div>
                                    </CardBody>
                                </Card>
                            </Col>

                            <Col md={4}>
                                <Card className="h-100">
                                    <CardHeader><h5 className="mb-0">{t("Update Items")}</h5></CardHeader>
                                    <CardBody>
                                        <div className="d-grid gap-2 mb-3">
                                            <Button outline color="primary" disabled={busy} onClick={() => openConfirm("updateSizeId")}>{t("Update SizeId")}</Button>
                                            <Button outline color="primary" disabled={busy} onClick={() => openConfirm("deleteRecords")}>{t("Delete Deleted Records")}</Button>
                                        </div>
                                        <form onSubmit={submitLogo}>
                                            <Input type="file" accept=".jpg,.jpeg" onChange={e => setLogoFile(e.target.files?.[0] || null)} />
                                            <Button type="submit" color="primary" className="mt-2" disabled={busy}>{t("Update Logo")}</Button>
                                        </form>
                                        {/* <div className="mt-3">
                                            <Button outline color="primary" onClick={() => setActiveAction("asking")}>{t("Import Asking Purchase Rate")}</Button>
                                        </div> */}
                                    </CardBody>
                                </Card>
                            </Col>
                        </Row>
                    )}
                </Container>
            </div>

            <MvcSwalConfirm
                open={confirmModal.open}
                title={t("Are You Sure ??")}
                text={confirmMessage}
                confirmText={t("Yes")}
                cancelText={t("Cancel")}
                onConfirm={handleConfirmAction}
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

            <Modal isOpen={!!currentAction} toggle={() => setActiveAction(null)} centered>
                <ModalHeader toggle={() => setActiveAction(null)}>{t("Import File")}</ModalHeader>
                <ModalBody>
                    <Label>{t("Select File To Import")}</Label>
                    <Input type="file" accept=".xls,.xlsx" onChange={e => setFile(e.target.files?.[0] || null)} />
                    {currentAction?.template && (
                        <div className="mt-3">
                            <Button color="primary" type="button" onClick={downloadTemplate}>
                                {t("Download")}
                            </Button>
                        </div>
                    )}
                </ModalBody>
                <ModalFooter>
                    <Button color="light" onClick={() => setActiveAction(null)}>{t("Close")}</Button>
                    <Button color="primary" disabled={busy} onClick={runAction}>{t("Accept")}</Button>
                </ModalFooter>
            </Modal>
        </React.Fragment>
    );
};

export default ImportGrading;